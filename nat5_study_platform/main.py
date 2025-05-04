"""
Main entry point for the Nat5 Study Platform.
"""
import os
import logging
import sys
from pathlib import Path

# Add the project root directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import configuration
from nat5_study_platform.config import (
    BASE_DIR, DATA_DIR, LOGGING_CONFIG, WEB_CONFIG
)

# Set up logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG["level"]),
    format=LOGGING_CONFIG["format"],
    filename=LOGGING_CONFIG["file"],
)
console = logging.StreamHandler()
console.setLevel(getattr(logging, LOGGING_CONFIG["level"]))
formatter = logging.Formatter(LOGGING_CONFIG["format"])
console.setFormatter(formatter)
logging.getLogger("").addHandler(console)

logger = logging.getLogger(__name__)

def setup_environment():
    """Set up the environment for the application."""
    logger.info("Setting up environment...")
    
    # Ensure data directories exist
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Check for required external dependencies
    try:
        import PyPDF2
        import pdf2image
        import pytesseract
        import cv2
        import numpy
        import nltk
        import spacy
        import flask
        logger.info("All required packages are installed.")
    except ImportError as e:
        logger.error(f"Missing required package: {e}")
        logger.info("Installing required packages...")
        os.system(f"pip install -r {os.path.join(BASE_DIR, 'requirements.txt')}")
    
    # Download NLTK data
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('stopwords', quiet=True)
        logger.info("NLTK data downloaded successfully.")
    except Exception as e:
        logger.error(f"Failed to download NLTK data: {e}")
    
    # Download spaCy model
    try:
        import spacy
        os.system("python -m spacy download en_core_web_sm")
        logger.info("spaCy model downloaded successfully.")
    except Exception as e:
        logger.error(f"Failed to download spaCy model: {e}")
    
    logger.info("Environment setup complete.")

def main():
    """Main entry point for the application."""
    logger.info("Starting Nat5 Study Platform...")
    
    # Set up the environment
    setup_environment()
    
    # Import the web interface
    from nat5_study_platform.web_interface.app import create_app
    
    # Create and run the Flask application
    app = create_app()
    
    logger.info(f"Starting web server on {WEB_CONFIG['host']}:{WEB_CONFIG['port']}...")
    app.run(
        host=WEB_CONFIG["host"],
        port=WEB_CONFIG["port"],
        debug=WEB_CONFIG["debug"]
    )

if __name__ == "__main__":
    main()