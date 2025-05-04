# Scottish National 5 (Nat5) Study Platform

A comprehensive study support platform for Scottish National 5 exam preparation. This system analyzes official Nat5 exam papers, extracts questions and marking schemes, and provides an interactive practice system to help students prepare effectively.

## Core Features

### PDF Content Extraction
- Parses SQA Nat5 exam PDFs to extract questions, mark allocations, and marking guidelines
- Identifies subject-specific terminology, mathematical notation, and diagrams
- Maintains the hierarchical structure of exam papers (sections, subsections)

### Interactive Question Conversion
- Transforms extracted questions into interactive digital formats
- Preserves the original difficulty level and assessment criteria
- Supports various question types (multiple choice, short answer, essay, calculation-based)

### Assessment Engine
- Evaluates student responses based on official SQA marking guidelines
- Provides specific feedback on incorrect or partially correct answers
- Awards marks according to the same criteria used in official exams

### Learning Support Features
- Implements help buttons for each question that provide progressive hints
- Includes subject-specific guidance that mimics teacher explanations
- Offers step-by-step solution paths for complex problems

## Technical Implementation

### Document Processing
- Uses OCR and document understanding techniques to parse exam PDFs
- Extracts text, mathematical expressions, tables, and diagrams
- Maps questions to corresponding marking schemes

### Question Database
- Organizes questions by subject, topic, subtopic, and difficulty
- Stores both original questions and interactive versions
- Includes metadata about marks, question type, and curriculum links

### Response Analysis
- Develops NLP capabilities to assess written answers
- Implements mathematical expression evaluation for STEM subjects
- Creates pattern matching algorithms based on marking scheme keywords

### User Experience
- Clean, intuitive interface for students
- Progress tracking dashboards
- Spaced repetition for topics requiring additional practice

## Getting Started

### Prerequisites
- Python 3.8+
- Required Python packages (see requirements.txt)
- MongoDB for database storage

### Installation
1. Clone the repository
2. Install dependencies: `pip install -r nat5_study_platform/requirements.txt`
3. Configure the application in `config.py`
4. Run the application: `python nat5_study_platform/main.py`

### Usage
1. Upload SQA Nat5 exam PDFs to the system
2. Process the PDFs to extract questions and marking schemes
3. Access the interactive practice system through the web interface
4. Track progress and receive personalized feedback

## Development Roadmap
1. Start with Mathematics as proof-of-concept
2. Expand to English, Sciences, and other subjects
3. Implement advanced analytics for personalized learning paths
4. Develop mobile application for on-the-go practice