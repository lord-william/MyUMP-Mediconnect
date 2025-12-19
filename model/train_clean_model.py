#!/usr/bin/env python3
"""
Clean AI Model Training Script for MediConnect
Creates a new model from the clean dataset with proper encoding
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import warnings
warnings.filterwarnings('ignore')

def load_clean_data():
    """Load the clean medical dataset"""
    print("Loading clean medical dataset...")
    
    df = pd.read_csv('medical_training_dataset_clean.csv', delimiter=',', encoding='utf-8-sig')
    
    print(f"Dataset shape: {df.shape}")
    print(f"Total rows: {len(df)}")
    print(f"Diseases: {df['disease'].nunique()}")
    print(f"Unique diseases: {sorted(df['disease'].unique())}")
    
    # Check for missing values
    print(f"\nMissing values per column:")
    print(df.isnull().sum())
    
    return df

def prepare_clean_features(df):
    """Prepare features ensuring proper encoding"""
    print("\nPreparing features for clean model...")
    
    # Fill missing values with empty string
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        df[col] = df[col].fillna('')
    
    # Create feature matrix
    feature_columns = ['age'] + symptom_cols + ['severity', 'gender_specific']
    X = df[feature_columns].copy()
    y = df['disease'].copy()
    
    print(f"Features: {feature_columns}")
    print(f"Target classes: {y.nunique()}")
    
    # Get unique symptoms across all symptom columns
    all_symptoms = set()
    for col in symptom_cols:
        symptoms = df[col].dropna().unique()
        all_symptoms.update(symptoms)
    all_symptoms.discard('')  # Remove empty string
    
    print(f"Total unique symptoms found: {len(all_symptoms)}")
    print(f"Sample symptoms: {list(sorted(all_symptoms))[:10]}")
    
    return X, y, sorted(all_symptoms)

def encode_clean_features(X, y, all_symptoms):
    """Encode features with proper handling"""
    print("\nEncoding features...")
    
    # Initialize encoders dictionary
    encoders = {}
    
    # Create symptom encoders - include all possible symptoms
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        encoder = LabelEncoder()
        # Include empty string and all possible symptoms
        all_categories = [''] + all_symptoms
        encoder.fit(all_categories)
        encoders[col] = encoder
        
        # Transform the column
        X[col] = encoder.transform(X[col].astype(str))
        print(f"Encoded {col}: {len(encoder.classes_)} categories")
    
    # Encode severity
    severity_encoder = LabelEncoder()
    X['severity'] = severity_encoder.fit_transform(X['severity'].astype(str))
    encoders['severity'] = severity_encoder
    print(f"Severity categories: {severity_encoder.classes_}")
    
    # Encode gender_specific
    gender_encoder = LabelEncoder()
    X['gender_specific'] = gender_encoder.fit_transform(X['gender_specific'].astype(str))
    encoders['gender_specific'] = gender_encoder
    print(f"Gender categories: {gender_encoder.classes_}")
    
    # Encode target (diseases)
    disease_encoder = LabelEncoder()
    y_encoded = disease_encoder.fit_transform(y)
    disease_classes = disease_encoder.classes_
    encoders['disease'] = disease_encoder
    
    print(f"Disease classes: {len(disease_classes)}")
    print(f"Sample diseases: {disease_classes[:10]}")
    
    return X, y_encoded, encoders, disease_classes

def train_clean_model(X, y):
    """Train the clean model"""
    print("\nTraining clean RandomForest model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    
    # Train RandomForest with balanced class weights
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced',
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2
    )
    
    print("Training model...")
    model.fit(X_train, y_train)
    
    # Make predictions
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    # Calculate accuracy
    train_acc = accuracy_score(y_train, train_pred)
    test_acc = accuracy_score(y_test, test_pred)
    
    print(f"\nModel Performance:")
    print(f"Training accuracy: {train_acc:.4f}")
    print(f"Test accuracy: {test_acc:.4f}")
    
    return model, X_test, y_test, test_pred

def save_clean_model(model, encoders, disease_classes, all_symptoms):
    """Save the clean model and components"""
    print("\nSaving clean model components...")
    
    # Save model
    joblib.dump(model, 'clean_medical_model.pkl')
    print("✅ Saved clean_medical_model.pkl")
    
    # Save encoders
    joblib.dump(encoders, 'clean_medical_encoders.pkl')
    print("✅ Saved clean_medical_encoders.pkl")
    
    # Save disease classes
    joblib.dump(disease_classes, 'clean_disease_classes.pkl')
    print("✅ Saved clean_disease_classes.pkl")
    
    # Save model info
    model_info = {
        'total_diseases': len(disease_classes),
        'disease_classes': list(disease_classes),
        'total_symptoms': len(all_symptoms),
        'symptoms': all_symptoms,
        'severity_levels': ['Low', 'Medium', 'High'],
        'gender_types': ['Both', 'Female', 'Male'],
        'model_type': 'RandomForestClassifier',
        'training_dataset': 'medical_training_dataset_clean.csv'
    }
    
    import json
    with open('clean_model_info.json', 'w') as f:
        json.dump(model_info, f, indent=2)
    print("✅ Saved clean_model_info.json")
    
    print(f"\nModel Summary:")
    print(f"Total diseases: {len(disease_classes)}")
    print(f"Total symptoms: {len(all_symptoms)}")
    print(f"Model files: clean_medical_model.pkl, clean_medical_encoders.pkl, clean_disease_classes.pkl")

def main():
    """Main training function"""
    print("="*70)
    print("CREATING NEW CLEAN AI MODEL FOR MEDICONNECT")
    print("="*70)
    
    try:
        # Load data
        df = load_clean_data()
        
        # Prepare features
        X, y, all_symptoms = prepare_clean_features(df)
        
        # Encode features
        X_encoded, y_encoded, encoders, disease_classes = encode_clean_features(X, y, all_symptoms)
        
        # Train model
        model, X_test, y_test, test_pred = train_clean_model(X_encoded, y_encoded)
        
        # Save model
        save_clean_model(model, encoders, disease_classes, all_symptoms)
        
        print("\n" + "="*70)
        print("✅ CLEAN MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("="*70)
        
        # Test a sample prediction
        print("\nTesting sample prediction...")
        sample_input = pd.DataFrame({
            'age': [28],
            'symptom1': ['persistent sadness'],
            'symptom2': ['loss of interest'], 
            'symptom3': ['sleep problems'],
            'symptom4': [''],
            'symptom5': [''],
            'symptom6': [''],
            'severity': ['Medium'],
            'gender_specific': ['Both']
        })
        
        # Encode sample input
        sample_encoded = sample_input.copy()
        symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
        for col in symptom_cols:
            sample_encoded[col] = encoders[col].transform(sample_encoded[col].astype(str))
        sample_encoded['severity'] = encoders['severity'].transform(sample_encoded['severity'])
        sample_encoded['gender_specific'] = encoders['gender_specific'].transform(sample_encoded['gender_specific'])
        
        # Predict
        prediction = model.predict(sample_encoded)[0]
        probabilities = model.predict_proba(sample_encoded)[0]
        predicted_disease = disease_classes[prediction]
        confidence = probabilities[prediction]
        
        print(f"Sample test - Depression symptoms:")
        print(f"Predicted: {predicted_disease}")
        print(f"Confidence: {confidence:.3f} ({confidence*100:.1f}%)")
        
        # Show top 5 predictions
        top_5_indices = np.argsort(probabilities)[-5:][::-1]
        print("\nTop 5 predictions:")
        for i, idx in enumerate(top_5_indices):
            disease = disease_classes[idx] 
            conf = probabilities[idx]
            print(f"{i+1}. {disease}: {conf:.3f} ({conf*100:.1f}%)")
            
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()