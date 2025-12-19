#!/usr/bin/env python3
"""
Gender-Specific AI Diagnosis Service for MediConnect
Uses separate male and female models to eliminate gender bias
FIXED VERSION with symptom mapping for better accuracy
"""
import pandas as pd
import numpy as np
import joblib
import json
from typing import List, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GenderMediConnectAI:
    def __init__(self, 
                 male_model_path='male_medical_model.pkl', 
                 male_encoders_path='male_medical_encoders.pkl', 
                 male_classes_path='male_disease_classes.pkl',
                 male_info_path='male_model_info.json',
                 female_model_path='female_medical_model.pkl', 
                 female_encoders_path='female_medical_encoders.pkl', 
                 female_classes_path='female_disease_classes.pkl',
                 female_info_path='female_model_info.json'):
        """Initialize the gender-specific AI diagnosis service"""
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
            self.male_encoders = joblib.load(male_encoders_path)
            self.male_disease_classes = joblib.load(male_classes_path)
            
            with open(male_info_path, 'r') as f:
                self.male_model_info = json.load(f)
            
            logger.info("✅ Male AI model loaded successfully")
            logger.info(f"Male model supports {len(self.male_disease_classes)} diseases")
            
            # Load female model
            self.female_model = joblib.load(female_model_path)
            self.female_encoders = joblib.load(female_encoders_path)
            self.female_disease_classes = joblib.load(female_classes_path)
            
            with open(female_info_path, 'r') as f:
                self.female_model_info = json.load(f)
            
            logger.info("✅ Female AI model loaded successfully")
            logger.info(f"Female model supports {len(self.female_disease_classes)} diseases")
            
        except FileNotFoundError as e:
            logger.error(f"❌ Gender model files not found: {e}")
            raise Exception("Gender-specific AI models not available. Please run train_gender_models.py first.")
        except Exception as e:
            logger.error(f"❌ Error loading gender models: {e}")
            raise Exception("Failed to load gender-specific AI models")
    
    def normalize_symptom(self, symptom: str) -> str:
        """Normalize and map common symptom variations to model vocabulary"""
        symptom = symptom.strip().lower()
        
        if not symptom:
            return ''
        
        # Symptom mapping for common variations and synonyms
        mapping = {
            # Fever related
            'chills': 'fever',
            'shivering': 'fever',
            'high temperature': 'fever',
            'temperature': 'fever',
            
            # Respiratory
            'runny nose': 'congestion',
            'stuffy nose': 'congestion',
            'blocked nose': 'congestion',
            'nasal congestion': 'congestion',
            'coughing': 'cough',
            
            # Pain/Aches
            'muscle aches': 'body aches',
            'muscle pain': 'body aches',
            'body pain': 'body aches',
            'aching': 'body aches',
            'headaches': 'headache',
            'sore muscles': 'body aches',
            
            # Fatigue
            'tired': 'fatigue',
            'exhausted': 'fatigue',
            'exhaustion': 'fatigue',
            'tiredness': 'fatigue',
            'weakness': 'fatigue',
            'weak': 'fatigue',
            
            # Throat
            'throat pain': 'sore throat',
            'painful throat': 'sore throat',
            
            # Digestive
            'vomiting': 'nausea',
            'throwing up': 'nausea',
            'stomach ache': 'abdominal pain',
            'stomach pain': 'abdominal pain',
            
            # Breathing
            'shortness of breath': 'difficulty breathing',
            'breathlessness': 'difficulty breathing',
        }
        
        # Return mapped symptom or original
        mapped = mapping.get(symptom, symptom)
        if mapped != symptom:
            logger.info(f"🔄 Mapped symptom: '{symptom}' → '{mapped}'")
        return mapped
    
    def parse_symptoms(self, symptoms_input: str) -> List[str]:
        """Parse and clean symptom input - NORMALIZE TO LOWERCASE AND MAP VARIATIONS"""
        if not symptoms_input:
            return ['', '', '', '', '', '']

        # Split by comma, clean, NORMALIZE TO LOWERCASE, and MAP to known symptoms
        symptoms = [self.normalize_symptom(s) for s in symptoms_input.split(',')]

        # Pad to 6 symptoms
        while len(symptoms) < 6:
            symptoms.append('')

        # Truncate to 6 symptoms
        symptoms = symptoms[:6]

        logger.info(f"Parsed symptoms (normalized & mapped): {symptoms}")
        return symptoms
    
    def prepare_input_data(self, age: int, symptoms: str, severity: str, gender: str) -> pd.DataFrame:
        """Prepare input data for prediction - NORMALIZE ALL TEXT TO LOWERCASE"""
        # Parse symptoms (already normalized to lowercase and mapped)
        symptom_list = self.parse_symptoms(symptoms)

        # Create input DataFrame - NORMALIZE severity and gender to lowercase
        input_data = {
            'age': [age],
            'symptom1': [symptom_list[0]],
            'symptom2': [symptom_list[1]],
            'symptom3': [symptom_list[2]],
            'symptom4': [symptom_list[3]],
            'symptom5': [symptom_list[4]],
            'symptom6': [symptom_list[5]],
            'severity': [severity.lower().strip()],  # Normalize to lowercase
            'gender_specific': [gender.lower().strip()]  # Normalize to lowercase
        }

        df = pd.DataFrame(input_data)
        logger.info(f"Input DataFrame created (normalized): {df.to_dict()}")
        return df
    
    def encode_input(self, df: pd.DataFrame, encoders: dict, gender: str) -> pd.DataFrame:
        """Encode input data using gender-specific encoders"""
        df_encoded = df.copy()
        
        # Encode symptoms
        symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
        for col in symptom_cols:
            encoder = encoders[col]
            try:
                df_encoded[col] = encoder.transform(df_encoded[col].astype(str))
                logger.info(f"✅ Encoded {col}: {df[col].iloc[0]} -> {df_encoded[col].iloc[0]}")
            except ValueError as e:
                logger.warning(f"⚠️  Unknown symptom in {col}: {df[col].iloc[0]}, using empty string")
                df_encoded[col] = encoder.transform([''])
        
        # Encode severity
        try:
            df_encoded['severity'] = encoders['severity'].transform(df_encoded['severity'])
            logger.info(f"✅ Encoded severity: {df['severity'].iloc[0]} -> {df_encoded['severity'].iloc[0]}")
        except ValueError:
            logger.warning(f"⚠️ Unknown severity: {df['severity'].iloc[0]}, using default")
            df_encoded['severity'] = [0]
        
        # Encode gender_specific
        try:
            df_encoded['gender_specific'] = encoders['gender_specific'].transform(df_encoded['gender_specific'])
            logger.info(f"✅ Encoded gender: {df['gender_specific'].iloc[0]} -> {df_encoded['gender_specific'].iloc[0]}")
        except ValueError:
            logger.warning(f"⚠️ Unknown gender: {df['gender_specific'].iloc[0]}, using default")
            df_encoded['gender_specific'] = [0]
        
        logger.info(f"Final encoded data for {gender}: {df_encoded.to_dict()}")
        return df_encoded
    
    def predict_disease(self, age: int, symptoms: str, severity: str, gender: str) -> Dict[str, Any]:
        """Make disease prediction with gender-specific model"""
        try:
            # Validate gender
            gender_lower = gender.lower()
            if gender_lower not in ['male', 'female']:
                raise ValueError(f"Invalid gender: {gender}. Must be 'Male' or 'Female'")
            
            # Select appropriate model and encoders
            if gender_lower == 'male':
                model = self.male_model
                encoders = self.male_encoders
                disease_classes = self.male_disease_classes
                model_info = self.male_model_info
                logger.info(f"🔵 Using MALE model for prediction")
            else:  # female
                model = self.female_model
                encoders = self.female_encoders
                disease_classes = self.female_disease_classes
                model_info = self.female_model_info
                logger.info(f"🔴 Using FEMALE model for prediction")
            
            # Prepare input data with correct gender
            input_df = self.prepare_input_data(age, symptoms, severity, gender)
            encoded_df = self.encode_input(input_df, encoders, gender)
            
            # Make prediction using gender-specific model
            prediction = model.predict(encoded_df)[0]
            probabilities = model.predict_proba(encoded_df)[0]
            
            # Get predicted disease
            predicted_disease = disease_classes[prediction]
            confidence = probabilities[prediction]
            
            logger.info(f"🎯 {gender} model prediction: {predicted_disease}")
            logger.info(f"🎯 Confidence: {confidence:.3f} ({confidence*100:.1f}%)")
            
            # Get top 10 predictions for debugging
            top_10_indices = np.argsort(probabilities)[-10:][::-1]
            logger.info(f"=== TOP 10 PREDICTIONS ({gender.upper()} MODEL) ===")
            for i, idx in enumerate(top_10_indices):
                disease = disease_classes[idx]
                conf = probabilities[idx]
                logger.info(f"{i+1}. {disease}: {conf:.4f} ({conf*100:.2f}%)")
            
            # Get top 5 predictions for response
            possible_conditions = []
            for idx in top_10_indices[:5]:
                conf = probabilities[idx]
                possible_conditions.append({
                    'condition': disease_classes[idx],
                    'confidence': f"{conf*100:.1f}%"
                })
            
            # Determine urgency based on confidence and disease type
            if confidence > 0.7:
                urgency = "High"
            elif confidence > 0.4:
                urgency = "Medium" 
            else:
                urgency = "Low"
            
            # Create response
            response = {
                'success': True,
                'primary_diagnosis': f"Based on the symptoms provided, the {gender} AI model suggests: {predicted_disease}",
                'top_disease': predicted_disease,
                'confidence': f"{confidence*100:.1f}%",
                'urgency': urgency,
                'possible_conditions': possible_conditions,
                'recommendations': [
                    "Consult with a healthcare professional for proper diagnosis",
                    "Monitor symptoms and seek immediate medical attention if they worsen",
                    "This AI analysis is for informational purposes only"
                ],
                'disclaimer': f"This is an AI-generated analysis using a {gender}-specific model based on symptoms. Please consult a healthcare professional for proper medical evaluation and treatment.",
                'model_info': f"{gender} model - {model_info['total_diseases']} diseases, {model_info['total_symptoms']} symptoms"
            }
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Prediction error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                'success': False,
                'error': str(e),
                'primary_diagnosis': f"Unable to make prediction due to technical error",
                'top_disease': 'Unknown',
                'confidence': '0%',
                'urgency': 'Unknown'
            }

def test_gender_ai():
    """Test the gender-specific AI service"""
    print("Testing Gender-Specific AI Service...")
    
    try:
        ai = GenderMediConnectAI()
        
        # Test influenza symptoms
        print("\n1. Testing Influenza Symptoms (Male):")
        result = ai.predict_disease(
            age=30,
            symptoms="fever, cough, body aches, fatigue",
            severity="medium",
            gender="male"
        )
        print(f"Result: {result['top_disease']} ({result['confidence']})")
        
        # Test with common variations
        print("\n2. Testing Influenza with variations (Female):")
        result = ai.predict_disease(
            age=25,
            symptoms="chills, coughing, muscle aches, sore throat",
            severity="medium",
            gender="female"
        )
        print(f"Result: {result['top_disease']} ({result['confidence']})")
        
        print("\n✅ Gender-Specific AI Service test completed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_gender_ai()
