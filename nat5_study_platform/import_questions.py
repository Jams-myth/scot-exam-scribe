"""
Script to import processed questions into the database.
"""
import os
import json
import logging
from datetime import datetime

from nat5_study_platform.config import PROCESSED_QUESTIONS_DIR
from nat5_study_platform.question_database.database import Database
from nat5_study_platform.question_database.models import Question, SubQuestion, MarkingScheme

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def import_questions():
    """Import processed questions into the database."""
    db = Database()
    
    # Get all subject directories
    for subject_id in os.listdir(PROCESSED_QUESTIONS_DIR):
        subject_dir = os.path.join(PROCESSED_QUESTIONS_DIR, subject_id)
        
        if not os.path.isdir(subject_dir):
            continue
        
        logger.info(f"Processing subject: {subject_id}")
        
        # Get all JSON files in the subject directory
        for filename in os.listdir(subject_dir):
            if not filename.endswith('.json'):
                continue
            
            file_path = os.path.join(subject_dir, filename)
            logger.info(f"Processing file: {file_path}")
            
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                # Extract metadata
                metadata = data.get('metadata', {})
                year = metadata.get('year')
                paper_type = metadata.get('paper_type')
                
                # Process questions
                questions_data = data.get('questions', [])
                for q_data in questions_data:
                    # Create Question object
                    question = Question(
                        id=q_data.get('id'),
                        number=q_data.get('number'),
                        text=q_data.get('text'),
                        marks=q_data.get('marks'),
                        subject_id=subject_id,
                        topic_id=q_data.get('topic_id'),  # Use topic_id from the data
                        topic_ids=[q_data.get('topic_id')] if q_data.get('topic_id') else None,
                        question_type=q_data.get('question_type', 'short_answer'),
                        year=year,
                        paper_type=paper_type,
                        difficulty=None,  # Would need to be determined
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    # Process sub-questions
                    sub_questions_data = q_data.get('sub_questions', [])
                    sub_questions = []
                    for sq_data in sub_questions_data:
                        sub_question = SubQuestion(
                            id=sq_data.get('id'),
                            text=sq_data.get('text'),
                            marks=sq_data.get('marks')
                        )
                        sub_questions.append(sub_question)
                    
                    question.sub_questions = sub_questions
                    
                    # Save question to database
                    db.save(question)
                    logger.info(f"Saved question: {question.id}")
                
                # Process marking schemes
                marking_schemes_data = data.get('marking_schemes', [])
                for ms_data in marking_schemes_data:
                    # Create MarkingScheme object
                    marking_scheme = MarkingScheme(
                        id=ms_data.get('id'),
                        question_id=ms_data.get('question_id'),
                        text=ms_data.get('text'),
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    
                    # Save marking scheme to database
                    db.save(marking_scheme)
                    logger.info(f"Saved marking scheme: {marking_scheme.id}")
                
                logger.info(f"Successfully processed file: {file_path}")
                
            except Exception as e:
                logger.error(f"Error processing file {file_path}: {e}")

if __name__ == "__main__":
    import_questions()