"""
Database interface for the question database.
"""
import os
import json
import logging
import uuid
from typing import Dict, List, Any, Optional, Union, Type, TypeVar
from datetime import datetime

from nat5_study_platform.config import DB_CONFIG, DATA_DIR
from nat5_study_platform.question_database.models import (
    BaseModel, Subject, Topic, Question, SubQuestion, 
    MarkingScheme, User, UserResponse, UserProgress
)

logger = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)

class Database:
    """Database interface for the question database."""
    
    def __init__(self):
        """Initialize the database."""
        self.db_type = DB_CONFIG["type"]
        self.db_config = DB_CONFIG[self.db_type]
        self.collections = {
            "subjects": Subject,
            "topics": Topic,
            "questions": Question,
            "marking_schemes": MarkingScheme,
            "users": User,
            "user_responses": UserResponse,
            "user_progress": UserProgress
        }
        
        # Initialize database connection
        if self.db_type == "mongodb":
            self._init_mongodb()
        elif self.db_type == "sqlite":
            self._init_sqlite()
        else:
            # Fallback to JSON file storage
            self._init_json_storage()
    
    def _init_mongodb(self):
        """Initialize MongoDB connection."""
        try:
            import pymongo
            
            # Connect to MongoDB
            connection_string = f"mongodb://"
            if self.db_config["username"] and self.db_config["password"]:
                connection_string += f"{self.db_config['username']}:{self.db_config['password']}@"
            connection_string += f"{self.db_config['host']}:{self.db_config['port']}"
            
            self.client = pymongo.MongoClient(connection_string)
            self.db = self.client[self.db_config["database"]]
            
            logger.info(f"Connected to MongoDB at {self.db_config['host']}:{self.db_config['port']}")
        except ImportError:
            logger.warning("pymongo not installed. Falling back to JSON file storage.")
            self._init_json_storage()
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            logger.warning("Falling back to JSON file storage.")
            self._init_json_storage()
    
    def _init_sqlite(self):
        """Initialize SQLite connection."""
        try:
            from sqlalchemy import create_engine
            from sqlalchemy.orm import sessionmaker
            
            # Connect to SQLite
            engine = create_engine(f"sqlite:///{self.db_config['path']}")
            Session = sessionmaker(bind=engine)
            self.session = Session()
            
            logger.info(f"Connected to SQLite at {self.db_config['path']}")
        except ImportError:
            logger.warning("SQLAlchemy not installed. Falling back to JSON file storage.")
            self._init_json_storage()
        except Exception as e:
            logger.error(f"Failed to connect to SQLite: {e}")
            logger.warning("Falling back to JSON file storage.")
            self._init_json_storage()
    
    def _init_json_storage(self):
        """Initialize JSON file storage."""
        self.db_type = "json"
        self.db_dir = os.path.join(DATA_DIR, "db")
        os.makedirs(self.db_dir, exist_ok=True)
        
        # Create collection files if they don't exist
        for collection in self.collections:
            collection_path = os.path.join(self.db_dir, f"{collection}.json")
            if not os.path.exists(collection_path):
                with open(collection_path, "w") as f:
                    json.dump([], f)
        
        logger.info(f"Using JSON file storage at {self.db_dir}")
    
    def _get_collection(self, collection_name: str) -> List[Dict[str, Any]]:
        """
        Get a collection from the database.
        
        Args:
            collection_name: Name of the collection
        
        Returns:
            List of documents in the collection
        """
        if self.db_type == "mongodb":
            return list(self.db[collection_name].find())
        elif self.db_type == "sqlite":
            # SQLite implementation would go here
            pass
        else:  # JSON file storage
            collection_path = os.path.join(self.db_dir, f"{collection_name}.json")
            with open(collection_path, "r") as f:
                return json.load(f)
    
    def _save_collection(self, collection_name: str, data: List[Dict[str, Any]]):
        """
        Save a collection to the database.
        
        Args:
            collection_name: Name of the collection
            data: List of documents to save
        """
        if self.db_type == "mongodb":
            # Clear the collection and insert new data
            self.db[collection_name].delete_many({})
            if data:
                self.db[collection_name].insert_many(data)
        elif self.db_type == "sqlite":
            # SQLite implementation would go here
            pass
        else:  # JSON file storage
            collection_path = os.path.join(self.db_dir, f"{collection_name}.json")
            with open(collection_path, "w") as f:
                json.dump(data, f, indent=2)
    
    def get_all(self, model_class: Type[T]) -> List[T]:
        """
        Get all documents of a specific model type.
        
        Args:
            model_class: Model class to get
        
        Returns:
            List of model instances
        """
        collection_name = self._get_collection_name(model_class)
        data = self._get_collection(collection_name)
        return [model_class.from_dict(doc) for doc in data]
    
    def get_by_id(self, model_class: Type[T], id: str) -> Optional[T]:
        """
        Get a document by ID.
        
        Args:
            model_class: Model class to get
            id: ID of the document
        
        Returns:
            Model instance if found, None otherwise
        """
        collection_name = self._get_collection_name(model_class)
        
        if self.db_type == "mongodb":
            doc = self.db[collection_name].find_one({"id": id})
            return model_class.from_dict(doc) if doc else None
        else:
            data = self._get_collection(collection_name)
            for doc in data:
                if doc.get("id") == id:
                    return model_class.from_dict(doc)
            return None
    
    def get_by_field(self, model_class: Type[T], field: str, value: Any) -> List[T]:
        """
        Get documents by a specific field value.
        
        Args:
            model_class: Model class to get
            field: Field to filter by
            value: Value to filter for
        
        Returns:
            List of model instances
        """
        collection_name = self._get_collection_name(model_class)
        
        if self.db_type == "mongodb":
            docs = self.db[collection_name].find({field: value})
            return [model_class.from_dict(doc) for doc in docs]
        else:
            data = self._get_collection(collection_name)
            return [model_class.from_dict(doc) for doc in data if doc.get(field) == value]
    
    def save(self, model: T) -> T:
        """
        Save a model to the database.
        
        Args:
            model: Model to save
        
        Returns:
            Saved model
        """
        collection_name = self._get_collection_name(type(model))
        
        # Generate ID if not present
        if not model.id:
            model.id = str(uuid.uuid4())
        
        # Update timestamps if applicable
        if hasattr(model, "updated_at"):
            model.updated_at = datetime.now()
        
        if self.db_type == "mongodb":
            self.db[collection_name].update_one(
                {"id": model.id},
                {"$set": model.to_dict()},
                upsert=True
            )
        else:
            data = self._get_collection(collection_name)
            
            # Check if document already exists
            for i, doc in enumerate(data):
                if doc.get("id") == model.id:
                    data[i] = model.to_dict()
                    break
            else:
                # Document doesn't exist, append it
                data.append(model.to_dict())
            
            self._save_collection(collection_name, data)
        
        return model
    
    def save_many(self, models: List[T]) -> List[T]:
        """
        Save multiple models to the database.
        
        Args:
            models: Models to save
        
        Returns:
            Saved models
        """
        if not models:
            return []
        
        collection_name = self._get_collection_name(type(models[0]))
        
        # Generate IDs and update timestamps
        for model in models:
            if not model.id:
                model.id = str(uuid.uuid4())
            if hasattr(model, "updated_at"):
                model.updated_at = datetime.now()
        
        if self.db_type == "mongodb":
            # Use bulk operations for MongoDB
            bulk_operations = []
            for model in models:
                bulk_operations.append(
                    pymongo.UpdateOne(
                        {"id": model.id},
                        {"$set": model.to_dict()},
                        upsert=True
                    )
                )
            if bulk_operations:
                self.db[collection_name].bulk_write(bulk_operations)
        else:
            data = self._get_collection(collection_name)
            
            # Create a dictionary of existing documents
            existing_docs = {doc.get("id"): i for i, doc in enumerate(data) if doc.get("id")}
            
            # Update or append documents
            for model in models:
                if model.id in existing_docs:
                    data[existing_docs[model.id]] = model.to_dict()
                else:
                    data.append(model.to_dict())
            
            self._save_collection(collection_name, data)
        
        return models
    
    def delete(self, model_class: Type[T], id: str) -> bool:
        """
        Delete a document by ID.
        
        Args:
            model_class: Model class to delete
            id: ID of the document
        
        Returns:
            True if document was deleted, False otherwise
        """
        collection_name = self._get_collection_name(model_class)
        
        if self.db_type == "mongodb":
            result = self.db[collection_name].delete_one({"id": id})
            return result.deleted_count > 0
        else:
            data = self._get_collection(collection_name)
            initial_length = len(data)
            data = [doc for doc in data if doc.get("id") != id]
            
            if len(data) < initial_length:
                self._save_collection(collection_name, data)
                return True
            return False
    
    def delete_many(self, model_class: Type[T], ids: List[str]) -> int:
        """
        Delete multiple documents by ID.
        
        Args:
            model_class: Model class to delete
            ids: IDs of the documents
        
        Returns:
            Number of documents deleted
        """
        collection_name = self._get_collection_name(model_class)
        
        if self.db_type == "mongodb":
            result = self.db[collection_name].delete_many({"id": {"$in": ids}})
            return result.deleted_count
        else:
            data = self._get_collection(collection_name)
            initial_length = len(data)
            data = [doc for doc in data if doc.get("id") not in ids]
            
            deleted_count = initial_length - len(data)
            if deleted_count > 0:
                self._save_collection(collection_name, data)
            return deleted_count
    
    def _get_collection_name(self, model_class: Type[T]) -> str:
        """
        Get the collection name for a model class.
        
        Args:
            model_class: Model class
        
        Returns:
            Collection name
        """
        for collection_name, cls in self.collections.items():
            if cls == model_class:
                return collection_name
        
        # Default to class name in lowercase
        return model_class.__name__.lower() + "s"