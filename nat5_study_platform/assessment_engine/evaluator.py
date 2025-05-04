"""
Evaluator module for assessing student responses.
"""
import re
import logging
from typing import Dict, List, Any, Optional, Tuple, Union

import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords

from nat5_study_platform.question_database.models import Question, MarkingScheme, UserResponse
from nat5_study_platform.config import ASSESSMENT_CONFIG

logger = logging.getLogger(__name__)

class ResponseEvaluator:
    """Class for evaluating student responses to questions."""
    
    def __init__(self, question: Question, marking_scheme: MarkingScheme):
        """
        Initialize the response evaluator.
        
        Args:
            question: Question being answered
            marking_scheme: Marking scheme for the question
        """
        self.question = question
        self.marking_scheme = marking_scheme
        self.feedback_level = ASSESSMENT_CONFIG["default_feedback_level"]
        
        # Initialize NLP tools
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        except LookupError:
            # Download NLTK data if not available
            nltk.download('punkt')
            nltk.download('wordnet')
            nltk.download('stopwords')
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
    
    def evaluate(self, response_text: str, sub_question_id: Optional[str] = None) -> Tuple[int, str]:
        """
        Evaluate a student response.
        
        Args:
            response_text: Student's response text
            sub_question_id: ID of the sub-question being answered (if applicable)
        
        Returns:
            Tuple of (score, feedback)
        """
        logger.info(f"Evaluating response for question {self.question.id}")
        
        # Determine the question type
        question_type = self.question.question_type
        
        # Get the appropriate marking scheme
        if sub_question_id:
            # Find the sub-question
            sub_question = next((sq for sq in self.question.sub_questions if sq.id == sub_question_id), None)
            if not sub_question:
                logger.warning(f"Sub-question {sub_question_id} not found for question {self.question.id}")
                return 0, "Error: Sub-question not found."
            
            # Find the sub-marking scheme
            sub_marking_scheme = next(
                (sms for sms in self.marking_scheme.sub_marking_schemes if sms["id"] == sub_question_id),
                None
            )
            if not sub_marking_scheme:
                logger.warning(f"Sub-marking scheme not found for sub-question {sub_question_id}")
                return 0, "Error: Marking scheme not found for this sub-question."
            
            marking_text = sub_marking_scheme["text"]
            max_marks = sub_question.marks or 0
            question_type = sub_question.question_type or question_type
        else:
            marking_text = self.marking_scheme.text
            max_marks = self.question.marks or 0
        
        # Evaluate based on question type
        if question_type == "multiple_choice":
            score, feedback = self._evaluate_multiple_choice(response_text, marking_text, max_marks)
        elif question_type == "calculation":
            score, feedback = self._evaluate_calculation(response_text, marking_text, max_marks)
        elif question_type == "short_answer":
            score, feedback = self._evaluate_short_answer(response_text, marking_text, max_marks)
        elif question_type == "essay":
            score, feedback = self._evaluate_essay(response_text, marking_text, max_marks)
        elif question_type == "graph":
            # Graph evaluation would require image processing, which is beyond the scope of this implementation
            score, feedback = 0, "Graph evaluation is not supported in this version."
        else:
            score, feedback = self._evaluate_generic(response_text, marking_text, max_marks)
        
        # Adjust feedback based on feedback level
        if self.feedback_level == "none":
            feedback = f"Score: {score}/{max_marks}"
        elif self.feedback_level == "basic":
            feedback = f"Score: {score}/{max_marks}\n{feedback}"
        
        return score, feedback
    
    def _evaluate_multiple_choice(self, response_text: str, marking_text: str, max_marks: int) -> Tuple[int, str]:
        """
        Evaluate a multiple choice response.
        
        Args:
            response_text: Student's response text
            marking_text: Marking scheme text
            max_marks: Maximum marks available
        
        Returns:
            Tuple of (score, feedback)
        """
        # Clean and normalize the response
        response_text = response_text.strip().lower()
        
        # Extract the correct answer from the marking text
        correct_answer_match = re.search(r"(?:correct answer|answer)[:\s]+([a-e])", marking_text, re.IGNORECASE)
        if correct_answer_match:
            correct_answer = correct_answer_match.group(1).lower()
        else:
            # Try to find the answer in a different format
            correct_answer_match = re.search(r"([a-e])(?:\s+is correct|\s+correct)", marking_text, re.IGNORECASE)
            if correct_answer_match:
                correct_answer = correct_answer_match.group(1).lower()
            else:
                logger.warning(f"Could not extract correct answer from marking text: {marking_text}")
                return 0, "Error: Could not determine the correct answer."
        
        # Check if the response matches the correct answer
        if response_text == correct_answer:
            return max_marks, "Correct answer."
        else:
            return 0, f"Incorrect. The correct answer is {correct_answer.upper()}."
    
    def _evaluate_calculation(self, response_text: str, marking_text: str, max_marks: int) -> Tuple[int, str]:
        """
        Evaluate a calculation response.
        
        Args:
            response_text: Student's response text
            marking_text: Marking scheme text
            max_marks: Maximum marks available
        
        Returns:
            Tuple of (score, feedback)
        """
        # Clean and normalize the response
        response_text = response_text.strip()
        
        # Extract the correct answer from the marking text
        correct_answer_match = re.search(r"(?:correct answer|answer|=)[:\s]+([-+]?\d*\.?\d+)", marking_text, re.IGNORECASE)
        if correct_answer_match:
            correct_answer = float(correct_answer_match.group(1))
        else:
            logger.warning(f"Could not extract correct answer from marking text: {marking_text}")
            return 0, "Error: Could not determine the correct answer."
        
        # Try to extract a numerical answer from the response
        try:
            # Look for a number in the response
            response_match = re.search(r"([-+]?\d*\.?\d+)", response_text)
            if response_match:
                response_value = float(response_match.group(1))
            else:
                return 0, f"No numerical answer found. The correct answer is {correct_answer}."
            
            # Check if the response is close to the correct answer (allowing for rounding errors)
            if abs(response_value - correct_answer) < 0.001:
                return max_marks, "Correct answer."
            else:
                return 0, f"Incorrect. The correct answer is {correct_answer}."
        except ValueError:
            return 0, f"Invalid numerical format. The correct answer is {correct_answer}."
    
    def _evaluate_short_answer(self, response_text: str, marking_text: str, max_marks: int) -> Tuple[int, str]:
        """
        Evaluate a short answer response.
        
        Args:
            response_text: Student's response text
            marking_text: Marking scheme text
            max_marks: Maximum marks available
        
        Returns:
            Tuple of (score, feedback)
        """
        # Clean and normalize the response
        response_text = response_text.strip().lower()
        
        # Extract key points from the marking text
        key_points = self._extract_key_points(marking_text)
        
        if not key_points:
            logger.warning(f"Could not extract key points from marking text: {marking_text}")
            return 0, "Error: Could not determine the marking criteria."
        
        # Tokenize and lemmatize the response
        response_tokens = [
            self.lemmatizer.lemmatize(token.lower())
            for token in word_tokenize(response_text)
            if token.lower() not in self.stop_words and token.isalnum()
        ]
        
        # Check for key points in the response
        points_found = []
        points_missed = []
        
        for point, keywords in key_points.items():
            # Check if any of the keywords are in the response
            if any(keyword in response_tokens for keyword in keywords):
                points_found.append(point)
            else:
                points_missed.append(point)
        
        # Calculate score based on points found
        if not key_points:
            score = 0
        else:
            score = int(max_marks * len(points_found) / len(key_points))
        
        # Generate feedback
        if score == max_marks:
            feedback = "Excellent answer! You've covered all the key points."
        elif score > 0:
            feedback = f"You've covered {len(points_found)} out of {len(key_points)} key points.\n\n"
            feedback += "Points covered:\n"
            for point in points_found:
                feedback += f"- {point}\n"
            feedback += "\nPoints missed:\n"
            for point in points_missed:
                feedback += f"- {point}\n"
        else:
            feedback = "Your answer didn't cover any of the key points required.\n\n"
            feedback += "Key points to include:\n"
            for point in key_points:
                feedback += f"- {point}\n"
        
        return score, feedback
    
    def _evaluate_essay(self, response_text: str, marking_text: str, max_marks: int) -> Tuple[int, str]:
        """
        Evaluate an essay response.
        
        Args:
            response_text: Student's response text
            marking_text: Marking scheme text
            max_marks: Maximum marks available
        
        Returns:
            Tuple of (score, feedback)
        """
        # This is a simplified implementation of essay evaluation
        # A more sophisticated approach would use NLP techniques for semantic analysis
        
        # Clean and normalize the response
        response_text = response_text.strip().lower()
        
        # Extract key points from the marking text
        key_points = self._extract_key_points(marking_text)
        
        if not key_points:
            logger.warning(f"Could not extract key points from marking text: {marking_text}")
            return 0, "Error: Could not determine the marking criteria."
        
        # Tokenize and lemmatize the response
        response_tokens = [
            self.lemmatizer.lemmatize(token.lower())
            for token in word_tokenize(response_text)
            if token.lower() not in self.stop_words and token.isalnum()
        ]
        
        # Check for key points in the response
        points_found = []
        points_missed = []
        
        for point, keywords in key_points.items():
            # Check if any of the keywords are in the response
            if any(keyword in response_tokens for keyword in keywords):
                points_found.append(point)
            else:
                points_missed.append(point)
        
        # Calculate base score based on points found
        if not key_points:
            base_score = 0
        else:
            base_score = max_marks * len(points_found) / len(key_points)
        
        # Adjust score based on response length (simple heuristic)
        word_count = len(response_text.split())
        if word_count < 50:
            length_factor = 0.5  # Penalize very short responses
        elif word_count < 100:
            length_factor = 0.8  # Slightly penalize short responses
        else:
            length_factor = 1.0  # No penalty for adequate length
        
        # Calculate final score
        score = int(base_score * length_factor)
        
        # Generate feedback
        if score == max_marks:
            feedback = "Excellent essay! You've covered all the key points with adequate depth."
        elif score > max_marks * 0.7:
            feedback = "Good essay. You've covered most of the key points.\n\n"
            if points_missed:
                feedback += "Consider including these points to improve:\n"
                for point in points_missed:
                    feedback += f"- {point}\n"
        elif score > max_marks * 0.4:
            feedback = "Satisfactory essay, but there's room for improvement.\n\n"
            feedback += "Points covered well:\n"
            for point in points_found:
                feedback += f"- {point}\n"
            feedback += "\nPoints to include or expand on:\n"
            for point in points_missed:
                feedback += f"- {point}\n"
        else:
            feedback = "Your essay needs significant improvement.\n\n"
            if points_found:
                feedback += "Points covered:\n"
                for point in points_found:
                    feedback += f"- {point}\n"
            feedback += "\nKey points to include:\n"
            for point in points_missed:
                feedback += f"- {point}\n"
            
            if word_count < 100:
                feedback += "\nYour response is too short. Aim for a more detailed explanation."
        
        return score, feedback
    
    def _evaluate_generic(self, response_text: str, marking_text: str, max_marks: int) -> Tuple[int, str]:
        """
        Generic evaluation for when the question type is unknown or unsupported.
        
        Args:
            response_text: Student's response text
            marking_text: Marking scheme text
            max_marks: Maximum marks available
        
        Returns:
            Tuple of (score, feedback)
        """
        # Fall back to short answer evaluation
        return self._evaluate_short_answer(response_text, marking_text, max_marks)
    
    def _extract_key_points(self, marking_text: str) -> Dict[str, List[str]]:
        """
        Extract key points from marking text.
        
        Args:
            marking_text: Marking scheme text
        
        Returns:
            Dictionary mapping key points to lists of keywords
        """
        key_points = {}
        
        # Look for bullet points or numbered lists
        bullet_pattern = r"(?:^|\n)(?:\*|\-|\d+\.)\s+(.*?)(?=(?:^|\n)(?:\*|\-|\d+\.)|$)"
        bullet_matches = re.finditer(bullet_pattern, marking_text, re.MULTILINE | re.DOTALL)
        
        for match in bullet_matches:
            point = match.group(1).strip()
            if point:
                # Extract keywords from the point
                keywords = [
                    self.lemmatizer.lemmatize(token.lower())
                    for token in word_tokenize(point)
                    if token.lower() not in self.stop_words and token.isalnum() and len(token) > 2
                ]
                key_points[point] = keywords
        
        # If no bullet points found, try to split by sentences
        if not key_points:
            sentences = re.split(r'(?<=[.!?])\s+', marking_text)
            for sentence in sentences:
                if len(sentence) > 10:  # Ignore very short sentences
                    # Extract keywords from the sentence
                    keywords = [
                        self.lemmatizer.lemmatize(token.lower())
                        for token in word_tokenize(sentence)
                        if token.lower() not in self.stop_words and token.isalnum() and len(token) > 2
                    ]
                    key_points[sentence.strip()] = keywords
        
        return key_points