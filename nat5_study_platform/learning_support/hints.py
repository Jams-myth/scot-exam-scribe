"""
Hints module for providing progressive hints to students.
"""
import logging
import re
from typing import Dict, List, Any, Optional, Tuple, Union

from nat5_study_platform.question_database.models import Question, MarkingScheme
from nat5_study_platform.config import ASSESSMENT_CONFIG

logger = logging.getLogger(__name__)

class HintGenerator:
    """Class for generating progressive hints for questions."""
    
    def __init__(self, question: Question, marking_scheme: MarkingScheme):
        """
        Initialize the hint generator.
        
        Args:
            question: Question to generate hints for
            marking_scheme: Marking scheme for the question
        """
        self.question = question
        self.marking_scheme = marking_scheme
        self.hint_levels = ASSESSMENT_CONFIG["hint_levels"]
    
    def generate_hints(self, sub_question_id: Optional[str] = None) -> List[str]:
        """
        Generate progressive hints for a question or sub-question.
        
        Args:
            sub_question_id: ID of the sub-question to generate hints for (if applicable)
        
        Returns:
            List of hints, from general to specific
        """
        logger.info(f"Generating hints for question {self.question.id}")
        
        # Check if hints are already defined for the question
        if sub_question_id:
            # Find the sub-question
            sub_question = next((sq for sq in self.question.sub_questions if sq.id == sub_question_id), None)
            if not sub_question:
                logger.warning(f"Sub-question {sub_question_id} not found for question {self.question.id}")
                return ["Error: Sub-question not found."]
            
            # Use predefined hints if available
            if sub_question.hints and len(sub_question.hints) > 0:
                return sub_question.hints
            
            # Find the sub-marking scheme
            sub_marking_scheme = next(
                (sms for sms in self.marking_scheme.sub_marking_schemes if sms["id"] == sub_question_id),
                None
            )
            if not sub_marking_scheme:
                logger.warning(f"Sub-marking scheme not found for sub-question {sub_question_id}")
                return ["Error: Marking scheme not found for this sub-question."]
            
            marking_text = sub_marking_scheme["text"]
            question_text = sub_question.text
            question_type = sub_question.question_type or self.question.question_type
        else:
            # Use predefined hints if available
            if self.question.hints and len(self.question.hints) > 0:
                return self.question.hints
            
            marking_text = self.marking_scheme.text
            question_text = self.question.text
            question_type = self.question.question_type
        
        # Generate hints based on question type
        if question_type == "multiple_choice":
            return self._generate_multiple_choice_hints(question_text, marking_text)
        elif question_type == "calculation":
            return self._generate_calculation_hints(question_text, marking_text)
        elif question_type == "short_answer":
            return self._generate_short_answer_hints(question_text, marking_text)
        elif question_type == "essay":
            return self._generate_essay_hints(question_text, marking_text)
        elif question_type == "graph":
            return self._generate_graph_hints(question_text, marking_text)
        else:
            return self._generate_generic_hints(question_text, marking_text)
    
    def _generate_multiple_choice_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate hints for multiple choice questions.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = []
        
        # Extract the correct answer from the marking text
        correct_answer_match = re.search(r"(?:correct answer|answer)[:\s]+([a-e])", marking_text, re.IGNORECASE)
        if not correct_answer_match:
            correct_answer_match = re.search(r"([a-e])(?:\s+is correct|\s+correct)", marking_text, re.IGNORECASE)
        
        if correct_answer_match:
            correct_answer = correct_answer_match.group(1).upper()
            
            # Level 1: General hint
            hints.append("Read the question carefully and consider all options before making your choice.")
            
            # Level 2: Elimination hint
            hints.append("Try to eliminate obviously incorrect options first.")
            
            # Level 3: More specific hint (without giving away the answer)
            if "not" in question_text.lower() or "except" in question_text.lower():
                hints.append("Be careful with negative questions - you're looking for the option that is NOT correct.")
            else:
                hints.append("Look for key terms in the question that match with one of the options.")
        else:
            # Fallback hints if we can't extract the correct answer
            hints = [
                "Read the question carefully and consider all options.",
                "Try to eliminate obviously incorrect options.",
                "Look for key terms in the question that match with one of the options."
            ]
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append(hints[-1])  # Duplicate the last hint if we need more
        
        return hints[:self.hint_levels]
    
    def _generate_calculation_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate hints for calculation questions.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = []
        
        # Extract formulas or steps from the marking text
        formula_match = re.search(r"formula[:\s]+(.*?)(?=\n|$)", marking_text, re.IGNORECASE)
        steps_match = re.search(r"steps?[:\s]+(.*?)(?=\n|$)", marking_text, re.IGNORECASE)
        
        # Level 1: General hint
        hints.append("Identify the key information given in the question and what you need to find.")
        
        # Level 2: Formula hint
        if formula_match:
            hints.append(f"Consider using the formula: {formula_match.group(1).strip()}")
        else:
            hints.append("Think about which formula or mathematical relationship applies to this problem.")
        
        # Level 3: Steps hint
        if steps_match:
            hints.append(f"Follow these steps: {steps_match.group(1).strip()}")
        else:
            # Look for numbers in the question to provide a more specific hint
            numbers = re.findall(r"\d+(?:\.\d+)?", question_text)
            if numbers:
                hints.append(f"Use the values given in the question ({', '.join(numbers)}) and apply the appropriate formula.")
            else:
                hints.append("Break down the problem into smaller steps and solve each step methodically.")
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append("Check your calculations carefully and make sure your units are correct.")
        
        return hints[:self.hint_levels]
    
    def _generate_short_answer_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate hints for short answer questions.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = []
        
        # Extract key points from the marking text
        key_points = []
        bullet_pattern = r"(?:^|\n)(?:\*|\-|\d+\.)\s+(.*?)(?=(?:^|\n)(?:\*|\-|\d+\.)|$)"
        bullet_matches = re.finditer(bullet_pattern, marking_text, re.MULTILINE | re.DOTALL)
        
        for match in bullet_matches:
            point = match.group(1).strip()
            if point:
                key_points.append(point)
        
        # If no bullet points found, try to split by sentences
        if not key_points:
            sentences = re.split(r'(?<=[.!?])\s+', marking_text)
            for sentence in sentences:
                if len(sentence) > 10:  # Ignore very short sentences
                    key_points.append(sentence.strip())
        
        # Level 1: General hint
        hints.append("Think about the key concepts related to this question.")
        
        # Level 2: More specific hint
        if "define" in question_text.lower() or "what is" in question_text.lower():
            hints.append("This question is asking for a definition. Make sure your answer is clear and concise.")
        elif "explain" in question_text.lower():
            hints.append("This question is asking for an explanation. Make sure to include the 'how' and 'why'.")
        elif "compare" in question_text.lower():
            hints.append("This question is asking you to compare. Make sure to discuss similarities and differences.")
        else:
            hints.append("Make sure your answer addresses all parts of the question.")
        
        # Level 3: Key points hint
        if key_points:
            # Don't give away all the key points, just hint at them
            if len(key_points) > 2:
                key_terms = [point.split()[0] for point in key_points[:2]]
                hints.append(f"Your answer should include points about {' and '.join(key_terms)}...")
            else:
                key_term = key_points[0].split()[0]
                hints.append(f"Your answer should include a point about {key_term}...")
        else:
            hints.append("Make sure your answer is specific and uses appropriate terminology.")
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append("Review your notes on this topic and make sure your answer is complete.")
        
        return hints[:self.hint_levels]
    
    def _generate_essay_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate hints for essay questions.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = []
        
        # Extract key points from the marking text
        key_points = []
        bullet_pattern = r"(?:^|\n)(?:\*|\-|\d+\.)\s+(.*?)(?=(?:^|\n)(?:\*|\-|\d+\.)|$)"
        bullet_matches = re.finditer(bullet_pattern, marking_text, re.MULTILINE | re.DOTALL)
        
        for match in bullet_matches:
            point = match.group(1).strip()
            if point:
                key_points.append(point)
        
        # If no bullet points found, try to split by sentences
        if not key_points:
            sentences = re.split(r'(?<=[.!?])\s+', marking_text)
            for sentence in sentences:
                if len(sentence) > 10:  # Ignore very short sentences
                    key_points.append(sentence.strip())
        
        # Level 1: Structure hint
        hints.append("Structure your essay with an introduction, main body paragraphs, and a conclusion.")
        
        # Level 2: Content hint
        if "discuss" in question_text.lower():
            hints.append("This question is asking you to discuss. Present different perspectives and arguments.")
        elif "analyze" in question_text.lower() or "analyse" in question_text.lower():
            hints.append("This question is asking you to analyze. Break down the topic and examine each part in detail.")
        elif "evaluate" in question_text.lower():
            hints.append("This question is asking you to evaluate. Assess the strengths and weaknesses, and make a judgment.")
        else:
            hints.append("Make sure your essay addresses all aspects of the question and provides supporting evidence.")
        
        # Level 3: Key points hint
        if key_points:
            # Don't give away all the key points, just hint at them
            if len(key_points) > 2:
                key_terms = [point.split()[0] for point in key_points[:3]]
                hints.append(f"Your essay should include points about {', '.join(key_terms[:-1])} and {key_terms[-1]}...")
            else:
                key_term = key_points[0].split()[0]
                hints.append(f"Your essay should include a point about {key_term}...")
        else:
            hints.append("Make sure your essay is well-structured, uses appropriate terminology, and provides evidence to support your arguments.")
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append("Review your notes on this topic and make sure your essay is comprehensive and well-structured.")
        
        return hints[:self.hint_levels]
    
    def _generate_graph_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate hints for graph questions.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = []
        
        # Level 1: General hint
        hints.append("Make sure you understand what type of graph you need to draw or interpret.")
        
        # Level 2: Axes hint
        if "draw" in question_text.lower() or "sketch" in question_text.lower() or "plot" in question_text.lower():
            hints.append("Label your axes clearly with appropriate units and choose a suitable scale.")
        else:
            hints.append("Look carefully at the axes labels and units to understand what the graph is showing.")
        
        # Level 3: Specific hint
        if "gradient" in marking_text.lower() or "slope" in marking_text.lower():
            hints.append("Calculate the gradient (slope) of the graph by finding the change in y divided by the change in x.")
        elif "area" in marking_text.lower():
            hints.append("Consider calculating the area under the graph, which may represent a physical quantity.")
        elif "intercept" in marking_text.lower():
            hints.append("Find where the graph crosses the axes (the intercepts), as these points often have physical significance.")
        else:
            hints.append("Look for patterns or trends in the graph and think about what they represent in the context of the question.")
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append("Make sure your graph is accurate, clearly labeled, and addresses all parts of the question.")
        
        return hints[:self.hint_levels]
    
    def _generate_generic_hints(self, question_text: str, marking_text: str) -> List[str]:
        """
        Generate generic hints for when the question type is unknown or unsupported.
        
        Args:
            question_text: Text of the question
            marking_text: Text of the marking scheme
        
        Returns:
            List of hints
        """
        hints = [
            "Read the question carefully and identify exactly what you're being asked to do.",
            "Break down the question into smaller parts and tackle each part systematically.",
            "Make sure your answer is clear, concise, and directly addresses the question."
        ]
        
        # Ensure we have the right number of hints
        while len(hints) < self.hint_levels:
            hints.append("Review your notes on this topic and make sure your answer is complete and accurate.")
        
        return hints[:self.hint_levels]