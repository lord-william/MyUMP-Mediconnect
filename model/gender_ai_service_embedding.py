#!/usr/bin/env python3
"""
Embedding-Based Gender-Specific AI Diagnosis Service for MediConnect
Uses all-MiniLM-L6-v2 embeddings + RandomForest for better symptom understanding
"""
import pandas as pd
import numpy as np
import joblib
import json
from typing import List, Dict, Any
import logging
from sentence_transformers import SentenceTransformer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load embedding model globally (load once, use many times)
logger.info("Loading all-MiniLM-L6-v2 embedding model...")
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
logger.info("OK - Embedding model loaded")

class EmbeddingMediConnectAI:
    def __init__(self,
                 male_model_path='male_medical_model_embedding.pkl',
                 male_encoders_path='male_medical_encoders_embedding.pkl',
                 male_classes_path='male_disease_classes_embedding.pkl',
                 male_info_path='male_model_info_embedding.json',
                 female_model_path='female_medical_model_embedding.pkl',
                 female_encoders_path='female_medical_encoders_embedding.pkl',
                 female_classes_path='female_disease_classes_embedding.pkl',
                 female_info_path='female_model_info_embedding.json'):
        """Initialize the embedding-based AI diagnosis service"""
        self.male_model = None
        self.male_encoders = None
        self.male_disease_classes = None
        self.male_model_info = None

        self.female_model = None
        self.female_encoders = None
        self.female_disease_classes = None
        self.female_model_info = None

        # Load both gender models
        self.load_gender_models(
            male_model_path, male_encoders_path, male_classes_path, male_info_path,
            female_model_path, female_encoders_path, female_classes_path, female_info_path
        )

    def load_gender_models(self, male_model_path, male_encoders_path, male_classes_path, male_info_path,
                          female_model_path, female_encoders_path, female_classes_path, female_info_path):
        """Load both male and female model components"""
        try:
            # Load male model
            self.male_model = joblib.load(male_model_path)
            self.male_disease_classes = joblib.load(male_classes_path)
            self.male_encoders = joblib.load(male_encoders_path)

            with open(male_info_path, 'r') as f:
                self.male_model_info = json.load(f)

            logger.info("OK - Male AI model loaded successfully")
            logger.info(f"Male model supports {len(self.male_disease_classes)} diseases")

            # Load female model
            self.female_model = joblib.load(female_model_path)
            self.female_disease_classes = joblib.load(female_classes_path)
            self.female_encoders = joblib.load(female_encoders_path)

            with open(female_info_path, 'r') as f:
                self.female_model_info = json.load(f)

            logger.info("OK - Female AI model loaded successfully")
            logger.info(f"Female model supports {len(self.female_disease_classes)} diseases")

        except FileNotFoundError as e:
            raise Exception(f"Embedding-based AI models not available: {e}")
        except Exception as e:
            logger.error(f"ERROR - Error loading gender models: {e}")
            raise Exception("Failed to load embedding-based AI models")

    def create_symptom_embedding(self, symptoms: str) -> np.ndarray:
        """Convert symptom text to 384-dim embedding"""
        # Clean and normalize symptoms
        symptom_text = symptoms.lower().strip()

        # Generate embedding
        embedding = embedding_model.encode([symptom_text])[0]
        logger.info(f"Generated embedding for: '{symptom_text}' (384 dimensions)")

        return embedding

    def predict_disease(self, age: int, symptoms: str, severity: str, gender: str) -> Dict[str, Any]:
        """Make disease prediction with embedding-based gender-specific model"""
        try:
            # Validate gender
            gender_lower = gender.lower().strip()
            if gender_lower not in ['male', 'female']:
                raise ValueError(f"Invalid gender: {gender}. Must be 'Male' or 'Female'")

            # Select appropriate model and encoders
            if gender_lower == 'male':
                model = self.male_model
                encoders = self.male_encoders
                disease_classes = self.male_disease_classes
                model_info = self.male_model_info
                logger.info(f"Using MALE embedding-based model")
            else:  # female
                model = self.female_model
                encoders = self.female_encoders
                disease_classes = self.female_disease_classes
                model_info = self.female_model_info
                logger.info(f"Using FEMALE embedding-based model")

            # Generate symptom embedding
            symptom_embedding = self.create_symptom_embedding(symptoms)

            # Encode severity
            severity_normalized = severity.lower().strip()
            try:
                severity_encoded = encoders['severity'].transform([severity_normalized])[0]
                logger.info(f"Encoded severity: {severity_normalized} -> {severity_encoded}")
            except:
                logger.warning(f"Unknown severity: {severity_normalized}, using default (medium)")
                severity_encoded = encoders['severity'].transform(['medium'])[0]

            # Encode gender
            gender_normalized = gender_lower
            try:
                gender_encoded = encoders['gender'].transform([gender_normalized])[0]
                logger.info(f"Encoded gender: {gender_normalized} -> {gender_encoded}")
            except:
                logger.warning(f"Unknown gender: {gender_normalized}, using default")
                gender_encoded = 0

            # Create feature vector: [age, embedding_384, severity, gender] = 387 features
            features = np.concatenate([
                [age],                    # 1 feature
                symptom_embedding,        # 384 features
                [severity_encoded],       # 1 feature
                [gender_encoded]          # 1 feature
            ]).reshape(1, -1)

            logger.info(f"Feature vector shape: {features.shape} (expected: (1, 387))")

            # Make prediction
            prediction = model.predict(features)[0]
            probabilities = model.predict_proba(features)[0]

            # Get predicted disease
            predicted_disease = disease_classes[prediction]
            confidence = probabilities[prediction]

            logger.info(f"PREDICTION: {predicted_disease} with {confidence:.1%} confidence")

            # Get top 5 predictions
            top_5_indices = np.argsort(probabilities)[-5:][::-1]
            top_5_predictions = []

            for i, idx in enumerate(top_5_indices):
                disease = disease_classes[idx]
                prob = probabilities[idx]
                top_5_predictions.append({
                    'rank': i + 1,
                    'condition': disease,
                    'confidence': f"{prob:.1%}",
                    'probability': float(prob),
                    'source': f"{model_info['model_type']}",
                    'category': 'Medical Condition',
                    'severity': self._assess_severity(disease, prob)
                })
                logger.info(f"  #{i+1}: {disease} - {prob:.1%}")

            # Determine urgency
            urgency = self._determine_urgency(predicted_disease, confidence)

            # Create diagnosis response
            diagnosis_result = {
                'success': True,
                'diagnosis': {
                    'primary_diagnosis': f"Based on AI analysis: {predicted_disease}",
                    'confidence': f"{confidence:.1%}",
                    'top_disease': predicted_disease,
                    'possible_conditions': top_5_predictions,
                    'urgency': urgency,
                    'recommendations': self._generate_recommendations(predicted_disease, urgency),
                    'disclaimer': 'This is an AI-generated prediction. Please consult a healthcare professional for proper diagnosis.',
                    'model_info': {
                        'type': model_info['model_type'],
                        'diseases_supported': model_info['total_diseases'],
                        'accuracy': '70-74% test accuracy',
                        'training_samples': 'Trained on 27,000+ medical cases',
                        'gender_specific': f"{gender.capitalize()} model"
                    }
                }
            }

            return diagnosis_result

        except Exception as e:
            logger.error(f"ERROR - Prediction failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e),
                'diagnosis': None
            }

    def _assess_severity(self, disease: str, confidence: float) -> str:
        """Assess severity based on disease and confidence"""
        disease_lower = disease.lower()

        # High severity diseases
        high_severity = [
            'stroke', 'heart attack', 'sepsis', 'meningitis', 'pneumonia',
            'appendicitis', 'diabetic', 'cancer', 'hemorrhage', 'aneurysm'
        ]

        # Medium severity
        medium_severity = [
            'influenza', 'bronchitis', 'infection', 'fever', 'gastroenteritis'
        ]

        for term in high_severity:
            if term in disease_lower:
                return 'High'

        for term in medium_severity:
            if term in disease_lower:
                return 'Medium'

        return 'Low'

    def _determine_urgency(self, disease: str, confidence: float) -> str:
        """Determine urgency level"""
        disease_lower = disease.lower()

        emergency_keywords = ['stroke', 'heart attack', 'sepsis', 'meningitis', 'hemorrhage']
        urgent_keywords = ['pneumonia', 'appendicitis', 'kidney', 'diabetic']

        for keyword in emergency_keywords:
            if keyword in disease_lower:
                return 'Emergency'

        for keyword in urgent_keywords:
            if keyword in disease_lower:
                return 'High'

        if confidence > 0.7:
            return 'Medium'

        return 'Low'

    def _generate_recommendations(self, disease: str, urgency: str) -> List[str]:
        """Generate recommendations based on disease and urgency"""
        recommendations = []

        if urgency == 'Emergency':
            recommendations.append('⚠️ URGENT: Seek emergency medical attention immediately')
            recommendations.append('Call emergency services or go to the nearest emergency room')
        elif urgency == 'High':
            recommendations.append('Consult a healthcare professional as soon as possible')
            recommendations.append('Do not delay medical attention')
        else:
            recommendations.append('Schedule an appointment with your healthcare provider')
            recommendations.append('Monitor your symptoms and seek care if they worsen')

        recommendations.append('Keep a record of your symptoms and their progression')
        recommendations.append('Follow up with your doctor for proper diagnosis and treatment')

        return recommendations

# Test function
def test_embedding_ai():
    """Test the embedding-based AI service"""
    print("="*70)
    print("TESTING EMBEDDING-BASED AI SERVICE")
    print("="*70)

    ai = EmbeddingMediConnectAI()

    # Test 1: Influenza symptoms with variations
    print("\n1. Testing with INFLUENZA symptoms (natural language):")
    result = ai.predict_disease(
        age=30,
        symptoms="fever, cough, body aches, fatigue, chills, sore throat",
        severity="medium",
        gender="male"
    )

    if result['success']:
        print(f"Prediction: {result['diagnosis']['top_disease']}")
        print(f"Confidence: {result['diagnosis']['confidence']}")
        print("\nTop 3 predictions:")
        for cond in result['diagnosis']['possible_conditions'][:3]:
            print(f"  {cond['rank']}. {cond['condition']}: {cond['confidence']}")
    else:
        print(f"ERROR: {result['error']}")

    # Test 2: Period symptoms
    print("\n2. Testing with MENSTRUAL symptoms:")
    result = ai.predict_disease(
        age=25,
        symptoms="abdominal cramps, bloating, lower back pain, breast tenderness",
        severity="medium",
        gender="female"
    )

    if result['success']:
        print(f"Prediction: {result['diagnosis']['top_disease']}")
        print(f"Confidence: {result['diagnosis']['confidence']}")

if __name__ == "__main__":
    test_embedding_ai()
