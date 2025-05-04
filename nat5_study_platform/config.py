"""
Configuration settings for the Nat5 Study Platform.
"""
import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).parent.absolute()

# Data directories
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_PDFS_DIR = os.path.join(DATA_DIR, "raw_pdfs")
PROCESSED_QUESTIONS_DIR = os.path.join(DATA_DIR, "processed_questions")
USER_DATA_DIR = os.path.join(DATA_DIR, "user_data")

# Ensure directories exist
for directory in [RAW_PDFS_DIR, PROCESSED_QUESTIONS_DIR, USER_DATA_DIR]:
    os.makedirs(directory, exist_ok=True)

# Database configuration
DB_CONFIG = {
    "type": "json",  # Options: mongodb, sqlite, json
    "mongodb": {
        "host": os.environ.get("MONGODB_HOST", "localhost"),
        "port": int(os.environ.get("MONGODB_PORT", 27017)),
        "database": os.environ.get("MONGODB_DB", "nat5_study_platform"),
        "username": os.environ.get("MONGODB_USERNAME", ""),
        "password": os.environ.get("MONGODB_PASSWORD", ""),
    },
    "sqlite": {
        "path": os.path.join(DATA_DIR, "nat5_study_platform.db"),
    },
    "json": {
        "path": os.path.join(DATA_DIR, "db"),
    },
}

# Web interface configuration
WEB_CONFIG = {
    "host": "0.0.0.0",  # Allow access from any host
    "port": int(os.environ.get("PORT", 12000)),  # Use the provided port
    "debug": os.environ.get("DEBUG", "False").lower() == "true",
    "secret_key": os.environ.get("SECRET_KEY", "nat5-study-platform-secret-key"),
    "allow_cors": True,
    "allow_iframe": True,
}

# PDF processing configuration
PDF_CONFIG = {
    "ocr_engine": "tesseract",  # Options: tesseract, azure, google
    "tesseract_path": os.environ.get("TESSERACT_PATH", "/usr/bin/tesseract"),
    "dpi": 300,  # DPI for image conversion
    "languages": ["eng"],  # Languages for OCR
    "math_recognition": True,  # Enable mathematical expression recognition
}

# Subjects configuration
SUBJECTS = {
    "mathematics": {
        "name": "Mathematics",
        "topics": [
            "Algebra", "Geometry", "Trigonometry", "Statistics", 
            "Number", "Calculus"
        ],
        "question_types": [
            "multiple_choice", "short_answer", "calculation", "graph"
        ],
    },
    "english": {
        "name": "English",
        "topics": [
            "Reading for Understanding, Analysis and Evaluation", 
            "Critical Reading", "Writing"
        ],
        "question_types": [
            "multiple_choice", "short_answer", "essay"
        ],
    },
    "physics": {
        "name": "Physics",
        "topics": [
            "Dynamics", "Space", "Electricity", "Properties of Matter", 
            "Waves", "Radiation"
        ],
        "question_types": [
            "multiple_choice", "short_answer", "calculation", "graph"
        ],
    },
    # Add more subjects as needed
}

# Assessment configuration
ASSESSMENT_CONFIG = {
    "feedback_levels": ["none", "basic", "detailed"],
    "default_feedback_level": "detailed",
    "hint_levels": 3,  # Number of progressive hints to provide
    "spaced_repetition": True,  # Enable spaced repetition for learning
}

# Logging configuration
LOGGING_CONFIG = {
    "level": os.environ.get("LOG_LEVEL", "INFO"),
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": os.path.join(BASE_DIR, "nat5_study_platform.log"),
}