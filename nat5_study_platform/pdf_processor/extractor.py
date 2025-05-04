"""
PDF Extractor module for processing SQA Nat5 exam papers.
"""
import os
import logging
import json
from pathlib import Path
import re
from typing import Dict, List, Tuple, Any, Optional

import PyPDF2
from nat5_study_platform.config import PDF_CONFIG, PROCESSED_QUESTIONS_DIR

logger = logging.getLogger(__name__)

class PDFExtractor:
    """
    Class for extracting content from SQA Nat5 exam papers.
    """
    
    def __init__(self, pdf_path: str, subject: str):
        """
        Initialize the PDF extractor.
        
        Args:
            pdf_path: Path to the PDF file
            subject: Subject of the exam paper
        """
        self.pdf_path = pdf_path
        self.subject = subject
        self.pdf_name = Path(pdf_path).stem
        self.output_dir = os.path.join(PROCESSED_QUESTIONS_DIR, subject)
        os.makedirs(self.output_dir, exist_ok=True)
    
    def extract_content(self) -> Dict[str, Any]:
        """
        Extract content from the PDF file.
        
        Returns:
            Dictionary containing the extracted content
        """
        logger.info(f"Extracting content from {self.pdf_path}")
        
        # Extract metadata
        metadata = self._extract_metadata()
        
        # Extract text directly from PDF
        pages_text = self._extract_text_from_pdf()
        
        # Extract questions and marking schemes
        questions, marking_schemes = self._extract_questions_and_marking_schemes(pages_text)
        
        # Save extracted content
        output = {
            "metadata": metadata,
            "questions": questions,
            "marking_schemes": marking_schemes
        }
        
        output_path = os.path.join(self.output_dir, f"{self.pdf_name}.json")
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2)
        
        logger.info(f"Extracted content saved to {output_path}")
        
        return output
    
    def _extract_metadata(self) -> Dict[str, Any]:
        """
        Extract metadata from the PDF file.
        
        Returns:
            Dictionary containing the metadata
        """
        metadata = {
            "filename": self.pdf_name,
            "subject": self.subject,
            "year": None,
            "paper_type": None,
            "total_marks": None
        }
        
        # Extract year and paper type from filename
        # Example: 2019-nat5-mathematics-paper1
        filename_parts = self.pdf_name.split("-")
        if len(filename_parts) >= 3:
            try:
                metadata["year"] = int(filename_parts[0])
                metadata["paper_type"] = filename_parts[-1]
            except ValueError:
                pass
        
        # Extract more metadata from PDF
        with open(self.pdf_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            info = pdf_reader.metadata
            if info:
                metadata["title"] = info.get("/Title", "")
                metadata["author"] = info.get("/Author", "")
                metadata["creator"] = info.get("/Creator", "")
                metadata["producer"] = info.get("/Producer", "")
            
            # Extract total marks from first page
            if len(pdf_reader.pages) > 0:
                first_page_text = pdf_reader.pages[0].extract_text()
                marks_match = re.search(r"Total marks\s*—\s*(\d+)", first_page_text, re.IGNORECASE)
                if marks_match:
                    metadata["total_marks"] = int(marks_match.group(1))
        
        return metadata
    
    def _extract_text_from_pdf(self) -> List[str]:
        """
        Extract text directly from PDF using PyPDF2.
        
        Returns:
            List of extracted text strings, one per page
        """
        logger.info(f"Extracting text directly from PDF")
        pages_text = []
        
        with open(self.pdf_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            num_pages = len(pdf_reader.pages)
            
            logger.info(f"PDF has {num_pages} pages")
            
            for i in range(num_pages):
                logger.info(f"Processing page {i+1}/{num_pages}")
                page = pdf_reader.pages[i]
                text = page.extract_text()
                pages_text.append(text)
        
        return pages_text
    
    def _extract_questions_and_marking_schemes(self, pages_text: List[str]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extract questions and marking schemes from the extracted text.
        
        Args:
            pages_text: List of extracted text strings, one per page
        
        Returns:
            Tuple of (questions, marking_schemes)
        """
        logger.info("Extracting questions and marking schemes")
        
        questions = []
        marking_schemes = []
        
        # Combine all pages into a single text
        full_text = "\n".join(pages_text)
        
        # Split into question paper and marking scheme sections
        # This is a simplified approach; actual implementation would need to be more sophisticated
        if "MARKING INSTRUCTIONS" in full_text or "MARKING SCHEME" in full_text:
            # Split at the marking instructions/scheme heading
            parts = re.split(r"(MARKING INSTRUCTIONS|MARKING SCHEME)", full_text, flags=re.IGNORECASE)
            question_paper_text = parts[0]
            marking_scheme_text = "".join(parts[1:]) if len(parts) > 1 else ""
        else:
            # Assume the entire document is the question paper
            question_paper_text = full_text
            marking_scheme_text = ""
        
        # Extract questions from question paper
        questions = self._extract_questions(question_paper_text)
        
        # Extract marking schemes if available
        if marking_scheme_text:
            marking_schemes = self._extract_marking_schemes(marking_scheme_text, questions)
        
        return questions, marking_schemes
    
    def _extract_questions(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract questions from the question paper text.
        
        Args:
            text: Text of the question paper
        
        Returns:
            List of question dictionaries
        """
        questions = []
        
        # Regular expression to find questions
        # This is a simplified approach; actual implementation would need to be more sophisticated
        question_pattern = r"(\d+)\.\s+(.*?)(?=\d+\.\s+|\Z)"
        mark_pattern = r"\((\d+)\s*marks?\)"
        
        # Find all questions
        matches = re.finditer(question_pattern, text, re.DOTALL)
        
        for match in matches:
            question_number = match.group(1)
            question_text = match.group(2).strip()
            
            # Extract marks
            marks_match = re.search(mark_pattern, question_text)
            marks = int(marks_match.group(1)) if marks_match else None
            
            # Remove marks from question text if found
            if marks_match:
                question_text = question_text.replace(marks_match.group(0), "").strip()
            
            # Extract sub-questions if any
            sub_questions = self._extract_sub_questions(question_text)
            
            question = {
                "id": f"q{question_number}",
                "number": question_number,
                "text": question_text,
                "marks": marks,
                "sub_questions": sub_questions,
                "subject": self.subject,
                "year": None,  # Will be filled from metadata
                "paper_type": None,  # Will be filled from metadata
                "question_type": self._determine_question_type(question_text)
            }
            
            questions.append(question)
        
        return questions
    
    def _extract_sub_questions(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract sub-questions from a question text.
        
        Args:
            text: Text of the question
        
        Returns:
            List of sub-question dictionaries
        """
        sub_questions = []
        
        # Regular expression to find sub-questions
        # This is a simplified approach; actual implementation would need to be more sophisticated
        sub_question_pattern = r"([a-z])\)\s+(.*?)(?=[a-z]\)\s+|\Z)"
        mark_pattern = r"\((\d+)\s*marks?\)"
        
        # Find all sub-questions
        matches = re.finditer(sub_question_pattern, text, re.DOTALL)
        
        for match in matches:
            sub_question_letter = match.group(1)
            sub_question_text = match.group(2).strip()
            
            # Extract marks
            marks_match = re.search(mark_pattern, sub_question_text)
            marks = int(marks_match.group(1)) if marks_match else None
            
            # Remove marks from sub-question text if found
            if marks_match:
                sub_question_text = sub_question_text.replace(marks_match.group(0), "").strip()
            
            sub_question = {
                "id": sub_question_letter,
                "text": sub_question_text,
                "marks": marks
            }
            
            sub_questions.append(sub_question)
        
        return sub_questions
    
    def _determine_question_type(self, text: str) -> str:
        """
        Determine the type of question based on its text.
        
        Args:
            text: Text of the question
        
        Returns:
            Question type
        """
        # Check for multiple choice
        if "Choose the correct answer" in text or "Circle the correct answer" in text:
            return "multiple_choice"
        
        # Check for calculation
        if "Calculate" in text or "Find the value" in text or "Solve" in text:
            return "calculation"
        
        # Check for graph
        if "Draw" in text or "Sketch" in text or "Plot" in text or "Graph" in text:
            return "graph"
        
        # Check for essay
        if "Discuss" in text or "Explain" in text or "Describe" in text or "Write" in text:
            if len(text.split()) > 20:  # If the question is long, it's likely an essay
                return "essay"
            else:
                return "short_answer"
        
        # Default to short answer
        return "short_answer"
    
    def _extract_marking_schemes(self, text: str, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract marking schemes from the marking scheme text.
        
        Args:
            text: Text of the marking scheme
            questions: List of extracted questions
        
        Returns:
            List of marking scheme dictionaries
        """
        marking_schemes = []
        
        # Regular expression to find marking schemes
        # This is a simplified approach; actual implementation would need to be more sophisticated
        marking_scheme_pattern = r"(\d+)\.\s+(.*?)(?=\d+\.\s+|\Z)"
        
        # Find all marking schemes
        matches = re.finditer(marking_scheme_pattern, text, re.DOTALL)
        
        for match in matches:
            question_number = match.group(1)
            marking_scheme_text = match.group(2).strip()
            
            # Extract sub-question marking schemes if any
            sub_marking_schemes = self._extract_sub_marking_schemes(marking_scheme_text)
            
            marking_scheme = {
                "id": f"ms{question_number}",
                "question_id": f"q{question_number}",
                "text": marking_scheme_text,
                "sub_marking_schemes": sub_marking_schemes
            }
            
            marking_schemes.append(marking_scheme)
        
        return marking_schemes
    
    def _extract_sub_marking_schemes(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract sub-question marking schemes from a marking scheme text.
        
        Args:
            text: Text of the marking scheme
        
        Returns:
            List of sub-question marking scheme dictionaries
        """
        sub_marking_schemes = []
        
        # Regular expression to find sub-question marking schemes
        # This is a simplified approach; actual implementation would need to be more sophisticated
        sub_marking_scheme_pattern = r"([a-z])\)\s+(.*?)(?=[a-z]\)\s+|\Z)"
        
        # Find all sub-question marking schemes
        matches = re.finditer(sub_marking_scheme_pattern, text, re.DOTALL)
        
        for match in matches:
            sub_question_letter = match.group(1)
            sub_marking_scheme_text = match.group(2).strip()
            
            sub_marking_scheme = {
                "id": sub_question_letter,
                "text": sub_marking_scheme_text
            }
            
            sub_marking_schemes.append(sub_marking_scheme)
        
        return sub_marking_schemes