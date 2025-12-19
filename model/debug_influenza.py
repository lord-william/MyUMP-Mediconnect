#!/usr/bin/env python3
"""
Debug script to test influenza symptoms prediction
"""
import pandas as pd
import joblib
import json

def test_influenza_symptoms():
    """Test the model with typical influenza symptoms"""
    
    print("="*70)
    print("DEBUGGING INFLUENZA PREDICTION")
    print("="*70)
    
    # Typical influenza symptoms
    influenza_test_cases = [
        {
            "name": "Classic Influenza",
            "symptoms": "fever, cough, body aches, fatigue",
            "age": 30,
            "severity": "medium",
            "gender": "male"
        },
        {
            "name": "Flu with sore throat",
            "symptoms": "fever, sore throat, muscle aches, headache",
            "age": 25,
            "severity": "medium",
            "gender": "female"
        },
        {
            "name": "Severe Flu",
            "symptoms": "high fever, severe cough, chills, body aches",
            "age": 40,
            "severity": "high",
            "gender": "male"
        }
    ]
    
    # Try to load models
    try:
        # Test with male model
        print("\n1. TESTING MALE MODEL")
        print("-" * 70)
        male_model = joblib.load('male_medical_model.pkl')
        male_encoders = joblib.load('male_medical_encoders.pkl')
        male_classes = joblib.load('male_disease_classes.pkl')
        
        with open('male_model_info.json', 'r') as f:
            male_info = json.load(f)
        
        print(f"Male model loaded: {len(male_classes)} diseases")
        print(f"Symptoms in male model: {len(male_info['symptoms'])}")
        
        # Check if Influenza is in the disease classes
        if 'Influenza' in male_classes:
            print("✅ Influenza IS in male model disease classes")
        else:
            print("❌ Influenza NOT in male model disease classes")
            print(f"Available diseases: {sorted(male_classes)}")
        
        # Test prediction
        for test_case in influenza_test_cases:
            if test_case['gender'].lower() == 'male':
                print(f"\nTest: {test_case['name']}")
                print(f"Symptoms: {test_case['symptoms']}")
                
                # Parse symptoms
                symptoms = [s.strip().lower() for s in test_case['symptoms'].split(',')]
                while len(symptoms) < 6:
                    symptoms.append('')
                symptoms = symptoms[:6]
                
                # Create input
                input_data = pd.DataFrame({
                    'age': [test_case['age']],
                    'symptom1': [symptoms[0]],
                    'symptom2': [symptoms[1]],
                    'symptom3': [symptoms[2]],
                    'symptom4': [symptoms[3]],
                    'symptom5': [symptoms[4]],
                    'symptom6': [symptoms[5]],
                    'severity': [test_case['severity'].lower()],
                    'gender_specific': [test_case['gender'].lower()]
                })
                
                print(f"Input symptoms (normalized): {symptoms[:4]}")
                
                # Check if symptoms are in encoder
                for i, symptom in enumerate(symptoms[:4]):
                    if symptom:
                        symptom_encoder = male_encoders[f'symptom{i+1}']
                        if symptom in symptom_encoder.classes_:
                            print(f"  ✅ '{symptom}' found in encoder")
                        else:
                            print(f"  ❌ '{symptom}' NOT found in encoder")
                            print(f"     Similar symptoms in encoder: {[s for s in symptom_encoder.classes_ if symptom[:3] in s][:5]}")
                
                # Encode
                encoded = input_data.copy()
                symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
                for col in symptom_cols:
                    try:
                        encoded[col] = male_encoders[col].transform(encoded[col])
                    except ValueError:
                        encoded[col] = male_encoders[col].transform([''])
                
                encoded['severity'] = male_encoders['severity'].transform(encoded['severity'])
                encoded['gender_specific'] = male_encoders['gender_specific'].transform(encoded['gender_specific'])
                
                # Predict
                prediction = male_model.predict(encoded)[0]
                probabilities = male_model.predict_proba(encoded)[0]
                
                predicted_disease = male_classes[prediction]
                confidence = probabilities[prediction]
                
                print(f"\n  PREDICTION: {predicted_disease}")
                print(f"  CONFIDENCE: {confidence:.3f} ({confidence*100:.1f}%)")
                
                # Show top 10
                top_10_indices = probabilities.argsort()[-10:][::-1]
                print(f"\n  TOP 10 PREDICTIONS:")
                for i, idx in enumerate(top_10_indices):
                    disease = male_classes[idx]
                    conf = probabilities[idx]
                    marker = "👈 INFLUENZA" if disease == "Influenza" else ""
                    print(f"    {i+1}. {disease}: {conf:.4f} ({conf*100:.2f}%) {marker}")
        
        # Test with female model
        print("\n\n2. TESTING FEMALE MODEL")
        print("-" * 70)
        female_model = joblib.load('female_medical_model.pkl')
        female_encoders = joblib.load('female_medical_encoders.pkl')
        female_classes = joblib.load('female_disease_classes.pkl')
        
        with open('female_model_info.json', 'r') as f:
            female_info = json.load(f)
        
        print(f"Female model loaded: {len(female_classes)} diseases")
        
        if 'Influenza' in female_classes:
            print("✅ Influenza IS in female model disease classes")
        else:
            print("❌ Influenza NOT in female model disease classes")
        
        # Test with female case
        for test_case in influenza_test_cases:
            if test_case['gender'].lower() == 'female':
                print(f"\nTest: {test_case['name']}")
                print(f"Symptoms: {test_case['symptoms']}")
                
                # Parse symptoms
                symptoms = [s.strip().lower() for s in test_case['symptoms'].split(',')]
                while len(symptoms) < 6:
                    symptoms.append('')
                symptoms = symptoms[:6]
                
                # Create input
                input_data = pd.DataFrame({
                    'age': [test_case['age']],
                    'symptom1': [symptoms[0]],
                    'symptom2': [symptoms[1]],
                    'symptom3': [symptoms[2]],
                    'symptom4': [symptoms[3]],
                    'symptom5': [symptoms[4]],
                    'symptom6': [symptoms[5]],
                    'severity': [test_case['severity'].lower()],
                    'gender_specific': [test_case['gender'].lower()]
                })
                
                print(f"Input symptoms (normalized): {symptoms[:4]}")
                
                # Check if symptoms are in encoder
                for i, symptom in enumerate(symptoms[:4]):
                    if symptom:
                        symptom_encoder = female_encoders[f'symptom{i+1}']
                        if symptom in symptom_encoder.classes_:
                            print(f"  ✅ '{symptom}' found in encoder")
                        else:
                            print(f"  ❌ '{symptom}' NOT found in encoder")
                
                # Encode
                encoded = input_data.copy()
                symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
                for col in symptom_cols:
                    try:
                        encoded[col] = female_encoders[col].transform(encoded[col])
                    except ValueError:
                        encoded[col] = female_encoders[col].transform([''])
                
                encoded['severity'] = female_encoders['severity'].transform(encoded['severity'])
                encoded['gender_specific'] = female_encoders['gender_specific'].transform(encoded['gender_specific'])
                
                # Predict
                prediction = female_model.predict(encoded)[0]
                probabilities = female_model.predict_proba(encoded)[0]
                
                predicted_disease = female_classes[prediction]
                confidence = probabilities[prediction]
                
                print(f"\n  PREDICTION: {predicted_disease}")
                print(f"  CONFIDENCE: {confidence:.3f} ({confidence*100:.1f}%)")
                
                # Show top 10
                top_10_indices = probabilities.argsort()[-10:][::-1]
                print(f"\n  TOP 10 PREDICTIONS:")
                for i, idx in enumerate(top_10_indices):
                    disease = female_classes[idx]
                    conf = probabilities[idx]
                    marker = "👈 INFLUENZA" if disease == "Influenza" else ""
                    print(f"    {i+1}. {disease}: {conf:.4f} ({conf*100:.2f}%) {marker}")
        
    except FileNotFoundError as e:
        print(f"❌ Model file not found: {e}")
        print("\nPlease ensure you have trained the models first:")
        print("  python train_gender_models.py")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_influenza_symptoms()
