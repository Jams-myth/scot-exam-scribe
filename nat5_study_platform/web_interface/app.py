"""
Flask application for the Nat5 Study Platform web interface.
"""
import os
import logging
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS

from nat5_study_platform.config import WEB_CONFIG, SUBJECTS
from nat5_study_platform.web_interface.routes import register_routes

logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application."""
    # Create the Flask app
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "static"),
        template_folder=os.path.join(os.path.dirname(__file__), "templates")
    )
    
    # Configure the app
    app.config["SECRET_KEY"] = WEB_CONFIG["secret_key"]
    app.config["DEBUG"] = WEB_CONFIG["debug"]
    
    # Enable CORS if configured
    if WEB_CONFIG["allow_cors"]:
        CORS(app)
    
    # Register routes
    register_routes(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Create default templates if they don't exist
    create_default_templates()
    
    return app

def register_error_handlers(app):
    """Register error handlers for the Flask application."""
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return render_template("error.html", error=error, title="Page Not Found"), 404
    
    @app.errorhandler(500)
    def server_error(error):
        """Handle 500 errors."""
        logger.error(f"Server error: {error}")
        return render_template("error.html", error=error, title="Server Error"), 500

def create_default_templates():
    """Create default templates if they don't exist."""
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    os.makedirs(template_dir, exist_ok=True)
    
    # Create base template
    base_template_path = os.path.join(template_dir, "base.html")
    if not os.path.exists(base_template_path):
        with open(base_template_path, "w") as f:
            f.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Nat5 Study Platform{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/main.css') }}">
    {% block head %}{% endblock %}
</head>
<body>
    <header>
        <nav>
            <div class="logo">
                <a href="{{ url_for('index') }}">Nat5 Study Platform</a>
            </div>
            <ul class="nav-links">
                <li><a href="{{ url_for('index') }}">Home</a></li>
                <li><a href="{{ url_for('subjects') }}">Subjects</a></li>
                <li><a href="{{ url_for('upload') }}">Upload</a></li>
                <li><a href="{{ url_for('about') }}">About</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <footer>
        <p>&copy; 2025 Nat5 Study Platform</p>
    </footer>
    
    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
    {% block scripts %}{% endblock %}
</body>
</html>""")
    
    # Create index template
    index_template_path = os.path.join(template_dir, "index.html")
    if not os.path.exists(index_template_path):
        with open(index_template_path, "w") as f:
            f.write("""{% extends "base.html" %}

{% block title %}Home - Nat5 Study Platform{% endblock %}

{% block content %}
<section class="hero">
    <div class="hero-content">
        <h1>Welcome to the Nat5 Study Platform</h1>
        <p>Your comprehensive study support platform for Scottish National 5 exam preparation.</p>
        <a href="{{ url_for('subjects') }}" class="btn">Get Started</a>
    </div>
</section>

<section class="features">
    <h2>Core Features</h2>
    <div class="feature-grid">
        <div class="feature-card">
            <h3>Interactive Questions</h3>
            <p>Practice with interactive questions extracted from official SQA Nat5 exam papers.</p>
        </div>
        <div class="feature-card">
            <h3>Instant Feedback</h3>
            <p>Receive detailed feedback on your answers based on official marking schemes.</p>
        </div>
        <div class="feature-card">
            <h3>Progressive Hints</h3>
            <p>Get help when you need it with progressive hints that guide you to the answer.</p>
        </div>
        <div class="feature-card">
            <h3>Track Progress</h3>
            <p>Monitor your progress and focus on areas that need improvement.</p>
        </div>
    </div>
</section>

<section class="subjects-preview">
    <h2>Available Subjects</h2>
    <div class="subject-grid">
        {% for subject_id, subject in subjects.items() %}
        <div class="subject-card">
            <h3>{{ subject.name }}</h3>
            <p>{{ subject.topics|length }} topics available</p>
            <a href="{{ url_for('subject', subject_id=subject_id) }}" class="btn">Study Now</a>
        </div>
        {% endfor %}
    </div>
</section>
{% endblock %}""")
    
    # Create error template
    error_template_path = os.path.join(template_dir, "error.html")
    if not os.path.exists(error_template_path):
        with open(error_template_path, "w") as f:
            f.write("""{% extends "base.html" %}

{% block title %}{{ title }} - Nat5 Study Platform{% endblock %}

{% block content %}
<section class="error-container">
    <h1>{{ title }}</h1>
    <p>{{ error }}</p>
    <a href="{{ url_for('index') }}" class="btn">Return to Home</a>
</section>
{% endblock %}""")
    
    # Create CSS file
    css_dir = os.path.join(os.path.dirname(__file__), "static", "css")
    os.makedirs(css_dir, exist_ok=True)
    
    css_path = os.path.join(css_dir, "main.css")
    if not os.path.exists(css_path):
        with open(css_path, "w") as f:
            f.write("""/* Main CSS for Nat5 Study Platform */

/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

a {
    text-decoration: none;
    color: #2c3e50;
}

ul {
    list-style: none;
}

/* Header and navigation */
header {
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.logo a {
    font-size: 1.5rem;
    font-weight: bold;
    color: #3498db;
}

.nav-links {
    display: flex;
}

.nav-links li {
    margin-left: 2rem;
}

.nav-links a {
    font-weight: 500;
}

.nav-links a:hover {
    color: #3498db;
}

/* Main content */
main {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
}

/* Hero section */
.hero {
    background-color: #3498db;
    color: #fff;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.hero h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

/* Buttons */
.btn {
    display: inline-block;
    background-color: #2c3e50;
    color: #fff;
    padding: 0.8rem 1.5rem;
    border-radius: 4px;
    font-weight: 500;
    transition: background-color 0.3s;
}

.btn:hover {
    background-color: #1a252f;
}

/* Features section */
.features {
    margin-bottom: 3rem;
}

.features h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature-card {
    background-color: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
    margin-bottom: 1rem;
    color: #3498db;
}

/* Subjects section */
.subjects-preview {
    margin-bottom: 3rem;
}

.subjects-preview h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
}

.subject-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.subject-card {
    background-color: #fff;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.subject-card h3 {
    margin-bottom: 1rem;
    color: #3498db;
}

.subject-card p {
    margin-bottom: 1.5rem;
}

/* Error page */
.error-container {
    text-align: center;
    padding: 4rem 2rem;
}

.error-container h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #e74c3c;
}

.error-container p {
    margin-bottom: 2rem;
}

/* Footer */
footer {
    background-color: #2c3e50;
    color: #fff;
    text-align: center;
    padding: 2rem;
    margin-top: 3rem;
}

/* Responsive design */
@media (max-width: 768px) {
    nav {
        flex-direction: column;
    }
    
    .nav-links {
        margin-top: 1rem;
    }
    
    .nav-links li {
        margin: 0 1rem;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
}""")
    
    # Create JS file
    js_dir = os.path.join(os.path.dirname(__file__), "static", "js")
    os.makedirs(js_dir, exist_ok=True)
    
    js_path = os.path.join(js_dir, "main.js")
    if not os.path.exists(js_path):
        with open(js_path, "w") as f:
            f.write("""// Main JavaScript for Nat5 Study Platform

document.addEventListener('DOMContentLoaded', function() {
    console.log('Nat5 Study Platform loaded');
    
    // Add event listeners for interactive elements
    setupQuestionInteractions();
    setupHintButtons();
    setupFeedbackToggles();
});

function setupQuestionInteractions() {
    const questionForms = document.querySelectorAll('.question-form');
    
    questionForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const questionId = this.dataset.questionId;
            const subQuestionId = this.dataset.subQuestionId || null;
            const responseText = this.querySelector('textarea, input[type="text"]').value;
            
            // Submit the response to the server
            submitResponse(questionId, subQuestionId, responseText, this);
        });
    });
}

function submitResponse(questionId, subQuestionId, responseText, form) {
    // Create the request data
    const data = {
        question_id: questionId,
        response_text: responseText
    };
    
    if (subQuestionId) {
        data.sub_question_id = subQuestionId;
    }
    
    // Send the request to the server
    fetch('/api/evaluate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Display the feedback
        const feedbackElement = form.nextElementSibling;
        feedbackElement.innerHTML = `
            <div class="feedback-header">
                <h4>Score: ${data.score}/${data.max_marks}</h4>
            </div>
            <div class="feedback-content">
                <p>${data.feedback}</p>
            </div>
        `;
        feedbackElement.classList.remove('hidden');
    })
    .catch(error => {
        console.error('Error submitting response:', error);
        alert('An error occurred while submitting your response. Please try again.');
    });
}

function setupHintButtons() {
    const hintButtons = document.querySelectorAll('.hint-button');
    
    hintButtons.forEach(button => {
        button.addEventListener('click', function() {
            const questionId = this.dataset.questionId;
            const subQuestionId = this.dataset.subQuestionId || null;
            const hintLevel = parseInt(this.dataset.hintLevel);
            
            // Get the hint from the server
            getHint(questionId, subQuestionId, hintLevel, this);
        });
    });
}

function getHint(questionId, subQuestionId, hintLevel, button) {
    // Create the request data
    const data = {
        question_id: questionId,
        hint_level: hintLevel
    };
    
    if (subQuestionId) {
        data.sub_question_id = subQuestionId;
    }
    
    // Send the request to the server
    fetch('/api/hint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        // Display the hint
        const hintElement = button.nextElementSibling;
        hintElement.textContent = data.hint;
        hintElement.classList.remove('hidden');
        
        // Update the button to show the next hint level
        button.dataset.hintLevel = hintLevel + 1;
        
        // If we've reached the maximum hint level, disable the button
        if (hintLevel + 1 > data.max_hint_level) {
            button.disabled = true;
            button.textContent = 'No more hints';
        } else {
            button.textContent = `Hint ${hintLevel + 1}`;
        }
    })
    .catch(error => {
        console.error('Error getting hint:', error);
        alert('An error occurred while getting the hint. Please try again.');
    });
}

function setupFeedbackToggles() {
    const feedbackToggles = document.querySelectorAll('.feedback-toggle');
    
    feedbackToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const feedbackContent = this.nextElementSibling;
            feedbackContent.classList.toggle('hidden');
            
            // Update the toggle text
            if (feedbackContent.classList.contains('hidden')) {
                this.textContent = 'Show Feedback';
            } else {
                this.textContent = 'Hide Feedback';
            }
        });
    });
}""")

if __name__ == "__main__":
    app = create_app()
    app.run(
        host=WEB_CONFIG["host"],
        port=WEB_CONFIG["port"],
        debug=WEB_CONFIG["debug"]
    )