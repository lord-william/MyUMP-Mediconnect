#!/usr/bin/env python3
"""
Gender-Specific Diagnosis API for MediConnect
Uses separate male and female models to eliminate gender bias
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import traceback
from gender_ai_service_embedding import EmbeddingMediConnectAI

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global AI instance
ai_service = None

def initialize_gender_ai():
    """Initialize the embedding-based gender-specific AI service"""
    global ai_service
    try:
        ai_service = EmbeddingMediConnectAI()
        logger.info("OK - Embedding-based AI service initialized successfully")
        return True
    except Exception as e:
        logger.error(f"ERROR - Failed to initialize embedding-based AI service: {e}")
        return False

@app.route('/ai/diagnose', methods=['POST'])
def diagnose():
    """Gender-specific AI diagnosis endpoint"""
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Extract parameters
        age = data.get('age', 30)
        symptoms = data.get('symptoms', '')
        severity = data.get('severity', 'Medium')
        gender = data.get('gender', 'Male')
        user_id = data.get('user_id', 'unknown')
        
        logger.info(f"🔍 Diagnosis request from user {user_id}")
        logger.info(f"🔍 Age: {age}, Gender: {gender}, Severity: {severity}")
        logger.info(f"🔍 Symptoms: {symptoms}")
        
        # Validate inputs
        if not symptoms or not symptoms.strip():
            return jsonify({
                'success': False,
                'error': 'Symptoms are required'
            }), 400
        
        if gender.lower() not in ['male', 'female']:
            return jsonify({
                'success': False,
                'error': 'Gender must be either Male or Female'
            }), 400
        
        if not ai_service:
            logger.error("❌ AI service not initialized")
            return jsonify({
                'success': False,
                'error': 'AI service not available'
            }), 500
        
        # Make prediction using gender-specific model
        result = ai_service.predict_disease(
            age=int(age),
            symptoms=symptoms,
            severity=severity,
            gender=gender
        )
        
        if result['success']:
            logger.info(f"OK - Diagnosis completed: {result['diagnosis']['top_disease']} ({result['diagnosis']['confidence']})")
            return jsonify(result)
        else:
            logger.error(f"ERROR - Diagnosis failed: {result.get('error', 'Unknown error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Diagnosis failed'),
                'diagnosis': result
            }), 500
            
    except Exception as e:
        logger.error(f"❌ API error: {e}")
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}',
            'diagnosis': {
                'primary_diagnosis': 'Technical error occurred during diagnosis',
                'top_disease': 'Unknown',
                'confidence': '0%',
                'urgency': 'Unknown',
                'possible_conditions': [],
                'recommendations': [
                    'Please try again later',
                    'Consult a healthcare professional for proper diagnosis'
                ],
                'disclaimer': 'AI diagnosis service encountered a technical error.'
            }
        }), 500

@app.route('/ai/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        status = "healthy" if ai_service else "unhealthy"
        models_status = "active" if ai_service else "inactive"
        
        male_diseases = len(ai_service.male_disease_classes) if ai_service else 0
        female_diseases = len(ai_service.female_disease_classes) if ai_service else 0
        
        return jsonify({
            'status': status,
            'timestamp': pd.Timestamp.now().isoformat(),
            'models': {
                'male_model': models_status,
                'female_model': models_status,
                'male_diseases': male_diseases,
                'female_diseases': female_diseases,
                'model_type': 'Embedding-based Gender-Specific (all-MiniLM-L6-v2 + RandomForest)'
            },
            'service': 'Gender-Specific AI Diagnosis API',
            'version': '2.0'
        })
        
    except Exception as e:
        logger.error(f"❌ Health check error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/ai/info', methods=['GET'])
def model_info():
    """Get model information"""
    try:
        if not ai_service:
            return jsonify({
                'error': 'AI service not initialized'
            }), 500
        
        return jsonify({
            'male_model': ai_service.male_model_info,
            'female_model': ai_service.female_model_info,
            'service': 'Gender-Specific AI Diagnosis',
            'description': 'Separate male and female models to eliminate gender bias'
        })
        
    except Exception as e:
        logger.error(f"❌ Model info error: {e}")
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("="*70)
    print("STARTING EMBEDDING-BASED AI DIAGNOSIS API")
    print("Using: all-MiniLM-L6-v2 + RandomForest")
    print("="*70)

    # Initialize AI service
    if initialize_gender_ai():
        print("OK - Embedding-based AI models loaded successfully")
        print("Male model ready (70.6% accuracy)")
        print("Female model ready (74.1% accuracy)")
        print("Starting API server on http://127.0.0.1:5002")
        print("="*70)

        # Import pandas for health check
        import pandas as pd

        # Start the Flask app
        app.run(host='127.0.0.1', port=5002, debug=False)
    else:
        print("ERROR - Failed to initialize AI service")
        print("Please ensure embedding model files exist:")
        print("- male_medical_model_embedding.pkl")
        print("- female_medical_model_embedding.pkl")
        print("- And corresponding encoders/classes files")
        exit(1)