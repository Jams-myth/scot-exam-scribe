"""
Routes for the Nat5 Study Platform web interface.
"""
import os
import logging
from flask import (
    render_template, request, redirect, url_for, flash, jsonify, 
    send_from_directory, abort, current_app
)
from werkzeug.utils import secure_filename

from nat5_study_platform.config import (
    SUBJECTS, RAW_PDFS_DIR, PROCESSED_QUESTIONS_DIR, ASSESSMENT_CONFIG
)
from nat5_study_platform.pdf_processor.extractor import PDFExtractor
from nat5_study_platform.question_database.database import Database
from nat5_study_platform.question_database.models import (
    Question, MarkingScheme, UserResponse, User
)
from nat5_study_platform.assessment_engine.evaluator import ResponseEvaluator
from nat5_study_platform.learning_support.hints import HintGenerator

logger = logging.getLogger(__name__)

# Initialize database
db = Database()

def register_routes(app):
    """Register routes for the Flask application."""
    
    @app.route('/')
    def index():
        """Render the home page."""
        return render_template('index.html', subjects=SUBJECTS)
    
    @app.route('/subjects')
    def subjects():
        """Render the subjects page."""
        return render_template('subjects.html', subjects=SUBJECTS)
    
    @app.route('/subject/<subject_id>')
    def subject(subject_id):
        """Render the subject page."""
        if subject_id not in SUBJECTS:
            abort(404)
        
        subject_data = SUBJECTS[subject_id]
        
        # Get questions for this subject
        questions = db.get_by_field(Question, 'subject_id', subject_id)
        
        # Group questions by topic
        questions_by_topic = {}
        for topic in subject_data['topics']:
            questions_by_topic[topic] = []
        
        for question in questions:
            for topic_id in question.topic_ids:
                if topic_id in questions_by_topic:
                    questions_by_topic[topic_id].append(question)
        
        return render_template(
            'subject.html',
            subject_id=subject_id,
            subject=subject_data,
            questions_by_topic=questions_by_topic
        )
    
    @app.route('/topic/<subject_id>/<topic_id>')
    def topic(subject_id, topic_id):
        """Render the topic page."""
        if subject_id not in SUBJECTS:
            abort(404)
        
        subject_data = SUBJECTS[subject_id]
        
        if topic_id not in subject_data['topics']:
            abort(404)
        
        # Get questions for this topic
        questions = []
        for question in db.get_by_field(Question, 'subject_id', subject_id):
            if topic_id in question.topic_ids:
                questions.append(question)
        
        return render_template(
            'topic.html',
            subject_id=subject_id,
            subject=subject_data,
            topic_id=topic_id,
            topic_name=topic_id,  # This would be replaced with a proper topic name lookup
            questions=questions
        )
    
    @app.route('/question/<question_id>')
    def question(question_id):
        """Render the question page."""
        # Get the question
        question = db.get_by_id(Question, question_id)
        if not question:
            abort(404)
        
        # Get the marking scheme
        marking_scheme = db.get_by_field(MarkingScheme, 'question_id', question_id)
        marking_scheme = marking_scheme[0] if marking_scheme else None
        
        # Get the subject
        subject_id = question.subject_id
        subject = SUBJECTS.get(subject_id, {'name': 'Unknown Subject'})
        
        return render_template(
            'question.html',
            question=question,
            marking_scheme=marking_scheme,
            subject_id=subject_id,
            subject=subject,
            hint_levels=ASSESSMENT_CONFIG['hint_levels']
        )
    
    @app.route('/upload', methods=['GET', 'POST'])
    def upload():
        """Render the upload page and handle file uploads."""
        if request.method == 'POST':
            # Check if a file was uploaded
            if 'file' not in request.files:
                flash('No file part')
                return redirect(request.url)
            
            file = request.files['file']
            
            # Check if a file was selected
            if file.filename == '':
                flash('No file selected')
                return redirect(request.url)
            
            # Check if the file is a PDF
            if file and file.filename.endswith('.pdf'):
                # Get the subject
                subject_id = request.form.get('subject')
                if subject_id not in SUBJECTS:
                    flash('Invalid subject')
                    return redirect(request.url)
                
                # Save the file
                filename = secure_filename(file.filename)
                file_path = os.path.join(RAW_PDFS_DIR, filename)
                file.save(file_path)
                
                # Process the PDF
                try:
                    extractor = PDFExtractor(file_path, subject_id)
                    result = extractor.extract_content()
                    
                    flash(f'File uploaded and processed successfully. Extracted {len(result["questions"])} questions.')
                    return redirect(url_for('subject', subject_id=subject_id))
                except Exception as e:
                    logger.error(f"Error processing PDF: {e}")
                    flash(f'Error processing PDF: {str(e)}')
                    return redirect(request.url)
            else:
                flash('Invalid file type. Please upload a PDF file.')
                return redirect(request.url)
        
        return render_template('upload.html', subjects=SUBJECTS)
    
    @app.route('/about')
    def about():
        """Render the about page."""
        return render_template('about.html', subjects=SUBJECTS)
    
    # API routes
    
    @app.route('/api/evaluate', methods=['POST'])
    def api_evaluate():
        """Evaluate a student response."""
        data = request.json
        
        # Get the question ID
        question_id = data.get('question_id')
        if not question_id:
            return jsonify({'error': 'Question ID is required'}), 400
        
        # Get the response text
        response_text = data.get('response_text')
        if not response_text:
            return jsonify({'error': 'Response text is required'}), 400
        
        # Get the sub-question ID (if any)
        sub_question_id = data.get('sub_question_id')
        
        # Get the question
        question = db.get_by_id(Question, question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        # Get the marking scheme
        marking_schemes = db.get_by_field(MarkingScheme, 'question_id', question_id)
        marking_scheme = marking_schemes[0] if marking_schemes else None
        if not marking_scheme:
            return jsonify({'error': 'Marking scheme not found'}), 404
        
        # Evaluate the response
        evaluator = ResponseEvaluator(question, marking_scheme)
        score, feedback = evaluator.evaluate(response_text, sub_question_id)
        
        # Determine the maximum marks
        if sub_question_id:
            sub_question = next((sq for sq in question.sub_questions if sq.id == sub_question_id), None)
            max_marks = sub_question.marks if sub_question else 0
        else:
            max_marks = question.marks or 0
        
        # Save the response
        user_id = request.cookies.get('user_id', 'anonymous')
        user_response = UserResponse(
            user_id=user_id,
            question_id=question_id,
            sub_question_id=sub_question_id,
            response_text=response_text,
            score=score,
            feedback=feedback,
            hints_used=0,  # This would be updated if hints were used
            time_taken=0  # This would be calculated based on start and end times
        )
        db.save(user_response)
        
        return jsonify({
            'score': score,
            'max_marks': max_marks,
            'feedback': feedback
        })
    
    @app.route('/api/hint', methods=['POST'])
    def api_hint():
        """Get a hint for a question."""
        data = request.json
        
        # Get the question ID
        question_id = data.get('question_id')
        if not question_id:
            return jsonify({'error': 'Question ID is required'}), 400
        
        # Get the hint level
        hint_level = data.get('hint_level')
        if hint_level is None:
            return jsonify({'error': 'Hint level is required'}), 400
        
        # Get the sub-question ID (if any)
        sub_question_id = data.get('sub_question_id')
        
        # Get the question
        question = db.get_by_id(Question, question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        # Get the marking scheme
        marking_schemes = db.get_by_field(MarkingScheme, 'question_id', question_id)
        marking_scheme = marking_schemes[0] if marking_schemes else None
        if not marking_scheme:
            return jsonify({'error': 'Marking scheme not found'}), 404
        
        # Generate hints
        hint_generator = HintGenerator(question, marking_scheme)
        hints = hint_generator.generate_hints(sub_question_id)
        
        # Get the requested hint
        if hint_level < 0 or hint_level >= len(hints):
            return jsonify({'error': 'Invalid hint level'}), 400
        
        hint = hints[hint_level]
        
        # Update user response to track hint usage
        user_id = request.cookies.get('user_id', 'anonymous')
        user_responses = db.get_by_field(UserResponse, 'user_id', user_id)
        for response in user_responses:
            if response.question_id == question_id and response.sub_question_id == sub_question_id:
                response.hints_used = max(response.hints_used or 0, hint_level + 1)
                db.save(response)
                break
        
        return jsonify({
            'hint': hint,
            'hint_level': hint_level,
            'max_hint_level': len(hints) - 1
        })
    
    @app.route('/api/subjects')
    def api_subjects():
        """Get all subjects."""
        return jsonify(SUBJECTS)
    
    @app.route('/api/questions/<subject_id>')
    def api_questions(subject_id):
        """Get questions for a subject."""
        if subject_id not in SUBJECTS:
            return jsonify({'error': 'Subject not found'}), 404
        
        questions = db.get_by_field(Question, 'subject_id', subject_id)
        return jsonify([q.to_dict() for q in questions])
    
    @app.route('/api/question/<question_id>')
    def api_question(question_id):
        """Get a specific question."""
        question = db.get_by_id(Question, question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        
        return jsonify(question.to_dict())