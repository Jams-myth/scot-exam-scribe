"""
Database models for the question database.
"""
from datetime import datetime
from typing import Dict, List, Any, Optional, Union

class BaseModel:
    """Base model for all database models."""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModel':
        """Create model from dictionary."""
        instance = cls()
        for key, value in data.items():
            setattr(instance, key, value)
        return instance

class Subject(BaseModel):
    """Subject model."""
    
    def __init__(
        self,
        id: str = None,
        name: str = None,
        topics: List[str] = None,
        question_types: List[str] = None,
        description: str = None
    ):
        self.id = id
        self.name = name
        self.topics = topics or []
        self.question_types = question_types or []
        self.description = description

class Topic(BaseModel):
    """Topic model."""
    
    def __init__(
        self,
        id: str = None,
        name: str = None,
        subject_id: str = None,
        parent_topic_id: str = None,
        subtopics: List[str] = None,
        description: str = None
    ):
        self.id = id
        self.name = name
        self.subject_id = subject_id
        self.parent_topic_id = parent_topic_id
        self.subtopics = subtopics or []
        self.description = description

class SubQuestion(BaseModel):
    """Sub-question model."""
    
    def __init__(
        self,
        id: str = None,
        question_id: str = None,
        text: str = None,
        marks: int = None,
        question_type: str = None,
        difficulty: int = None,
        hints: List[str] = None,
        solution: str = None
    ):
        self.id = id
        self.question_id = question_id
        self.text = text
        self.marks = marks
        self.question_type = question_type
        self.difficulty = difficulty
        self.hints = hints or []
        self.solution = solution

class Question(BaseModel):
    """Question model."""
    
    def __init__(
        self,
        id: str = None,
        number: str = None,
        text: str = None,
        marks: int = None,
        subject_id: str = None,
        topic_ids: List[str] = None,
        topic_id: str = None,
        question_type: str = None,
        difficulty: int = None,
        year: int = None,
        paper_type: str = None,
        sub_questions: List[SubQuestion] = None,
        hints: List[str] = None,
        solution: str = None,
        created_at: datetime = None,
        updated_at: datetime = None
    ):
        self.id = id
        self.number = number
        self.text = text
        self.marks = marks
        self.subject_id = subject_id
        self.topic_ids = topic_ids or []
        self.question_type = question_type
        self.difficulty = difficulty
        self.year = year
        self.paper_type = paper_type
        self.sub_questions = sub_questions or []
        self.hints = hints or []
        self.solution = solution
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = super().to_dict()
        result['sub_questions'] = [sq.to_dict() for sq in self.sub_questions]
        result['created_at'] = self.created_at.isoformat()
        result['updated_at'] = self.updated_at.isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Question':
        """Create model from dictionary."""
        instance = super().from_dict(data)
        instance.sub_questions = [SubQuestion.from_dict(sq) for sq in data.get('sub_questions', [])]
        instance.created_at = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()))
        instance.updated_at = datetime.fromisoformat(data.get('updated_at', datetime.now().isoformat()))
        return instance

class MarkingScheme(BaseModel):
    """Marking scheme model."""
    
    def __init__(
        self,
        id: str = None,
        question_id: str = None,
        text: str = None,
        criteria: List[Dict[str, Any]] = None,
        sub_marking_schemes: List[Dict[str, Any]] = None,
        created_at: datetime = None,
        updated_at: datetime = None
    ):
        self.id = id
        self.question_id = question_id
        self.text = text
        self.criteria = criteria or []
        self.sub_marking_schemes = sub_marking_schemes or []
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = super().to_dict()
        result['created_at'] = self.created_at.isoformat()
        result['updated_at'] = self.updated_at.isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MarkingScheme':
        """Create model from dictionary."""
        instance = super().from_dict(data)
        instance.created_at = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()))
        instance.updated_at = datetime.fromisoformat(data.get('updated_at', datetime.now().isoformat()))
        return instance

class UserResponse(BaseModel):
    """User response model."""
    
    def __init__(
        self,
        id: str = None,
        user_id: str = None,
        question_id: str = None,
        sub_question_id: str = None,
        response_text: str = None,
        score: int = None,
        feedback: str = None,
        hints_used: int = None,
        time_taken: int = None,
        created_at: datetime = None
    ):
        self.id = id
        self.user_id = user_id
        self.question_id = question_id
        self.sub_question_id = sub_question_id
        self.response_text = response_text
        self.score = score
        self.feedback = feedback
        self.hints_used = hints_used
        self.time_taken = time_taken  # in seconds
        self.created_at = created_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = super().to_dict()
        result['created_at'] = self.created_at.isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserResponse':
        """Create model from dictionary."""
        instance = super().from_dict(data)
        instance.created_at = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()))
        return instance

class User(BaseModel):
    """User model."""
    
    def __init__(
        self,
        id: str = None,
        username: str = None,
        email: str = None,
        password_hash: str = None,
        first_name: str = None,
        last_name: str = None,
        subjects: List[str] = None,
        progress: Dict[str, Any] = None,
        created_at: datetime = None,
        last_login: datetime = None
    ):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.subjects = subjects or []
        self.progress = progress or {}
        self.created_at = created_at or datetime.now()
        self.last_login = last_login
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = super().to_dict()
        result['created_at'] = self.created_at.isoformat()
        if self.last_login:
            result['last_login'] = self.last_login.isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create model from dictionary."""
        instance = super().from_dict(data)
        instance.created_at = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()))
        if data.get('last_login'):
            instance.last_login = datetime.fromisoformat(data['last_login'])
        return instance

class UserProgress(BaseModel):
    """User progress model."""
    
    def __init__(
        self,
        id: str = None,
        user_id: str = None,
        subject_id: str = None,
        topic_id: str = None,
        questions_attempted: int = None,
        questions_correct: int = None,
        total_score: int = None,
        total_possible_score: int = None,
        average_time: float = None,
        last_activity: datetime = None,
        next_review_date: datetime = None
    ):
        self.id = id
        self.user_id = user_id
        self.subject_id = subject_id
        self.topic_id = topic_id
        self.questions_attempted = questions_attempted or 0
        self.questions_correct = questions_correct or 0
        self.total_score = total_score or 0
        self.total_possible_score = total_possible_score or 0
        self.average_time = average_time or 0.0
        self.last_activity = last_activity or datetime.now()
        self.next_review_date = next_review_date
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        result = super().to_dict()
        result['last_activity'] = self.last_activity.isoformat()
        if self.next_review_date:
            result['next_review_date'] = self.next_review_date.isoformat()
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserProgress':
        """Create model from dictionary."""
        instance = super().from_dict(data)
        instance.last_activity = datetime.fromisoformat(data.get('last_activity', datetime.now().isoformat()))
        if data.get('next_review_date'):
            instance.next_review_date = datetime.fromisoformat(data['next_review_date'])
        return instance