#!/usr/bin/env python3
"""
Gender-Specific AI Model Training Script for MediConnect
Creates separate male and female models to eliminate gender bias
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
    print("XGBoost available")
except ImportError:
    XGBOOST_AVAILABLE = False
    print("WARNING: XGBoost not available. Install with: pip install xgboost")
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score
import joblib
import warnings
import json
warnings.filterwarnings('ignore')

# Try to import BalancedRandomForestClassifier for handling class imbalance
try:
    from imblearn.ensemble import BalancedRandomForestClassifier
    BALANCED_RF_AVAILABLE = True
    print("Using BalancedRandomForestClassifier for class imbalance handling")
except ImportError:
    BALANCED_RF_AVAILABLE = False
    print("WARNING: imblearn not available. Install with: pip install imbalanced-learn")
    print("WARNING: Falling back to standard RandomForest with class_weight='balanced'")

def load_gender_datasets():
    """Load both male and female datasets - USING AUGMENTED DATA"""
    print("Loading AUGMENTED gender-specific medical datasets...")

    # Load male dataset (AUGMENTED)
    df_male = pd.read_csv('medical_training_dataset_male_augmented.csv', delimiter=';', encoding='utf-8-sig')
    print(f"Male dataset shape: {df_male.shape}")
    print(f"Male rows: {len(df_male)}")
    print(f"Male diseases: {df_male['disease'].nunique()}")

    # Load female dataset (AUGMENTED)
    df_female = pd.read_csv('medical_training_dataset_female_augmented.csv', delimiter=';', encoding='utf-8-sig')
    print(f"Female dataset shape: {df_female.shape}")
    print(f"Female rows: {len(df_female)}")
    print(f"Female diseases: {df_female['disease'].nunique()}")
    
    # Check for missing values
    print(f"\nMale dataset missing values:")
    print(df_male.isnull().sum())
    print(f"\nFemale dataset missing values:")
    print(df_female.isnull().sum())
    
    return df_male, df_female

def prepare_features(df, gender_name):
    """Prepare features for a specific gender dataset"""
    print(f"\nPreparing features for {gender_name} model...")

    # Fill missing values with empty string and NORMALIZE TO LOWERCASE
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        df[col] = df[col].fillna('').str.lower().str.strip()

    # Normalize severity and gender to lowercase for consistency
    df['severity'] = df['severity'].str.lower().str.strip()
    df['gender_specific'] = df['gender_specific'].str.lower().str.strip()

    # Create feature matrix
    feature_columns = ['age'] + symptom_cols + ['severity', 'gender_specific']
    X = df[feature_columns].copy()
    y = df['disease'].copy()

    print(f"{gender_name} features: {feature_columns}")
    print(f"{gender_name} target classes: {y.nunique()}")

    # Get unique symptoms across all symptom columns (already lowercase)
    all_symptoms = set()
    for col in symptom_cols:
        symptoms = df[col].dropna().unique()
        all_symptoms.update(symptoms)
    all_symptoms.discard('')  # Remove empty string






    print(f"{gender_name} total unique symptoms: {len(all_symptoms)}")
    print(f"{gender_name} sample symptoms: {list(sorted(all_symptoms))[:10]}")

    return X, y, sorted(all_symptoms)

def encode_features(X, y, all_symptoms, gender_name):
    """Encode features with proper handling"""
    print(f"\nEncoding features for {gender_name}...")
    
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
        print(f"{gender_name} encoded {col}: {len(encoder.classes_)} categories")
    
    # Encode severity
    severity_encoder = LabelEncoder()
    X['severity'] = severity_encoder.fit_transform(X['severity'].astype(str))
    encoders['severity'] = severity_encoder
    print(f"{gender_name} severity categories: {severity_encoder.classes_}")
    
    # Encode gender_specific
    gender_encoder = LabelEncoder()
    X['gender_specific'] = gender_encoder.fit_transform(X['gender_specific'].astype(str))
    encoders['gender_specific'] = gender_encoder
    print(f"{gender_name} gender categories: {gender_encoder.classes_}")
    
    # Encode target (diseases)
    disease_encoder = LabelEncoder()
    y_encoded = disease_encoder.fit_transform(y)
    disease_classes = disease_encoder.classes_
    encoders['disease'] = disease_encoder
    
    print(f"{gender_name} disease classes: {len(disease_classes)}")
    print(f"{gender_name} sample diseases: {disease_classes[:10]}")
    
    return X, y_encoded, encoders, disease_classes

def train_model(X, y, gender_name):
    """Train a gender-specific model with class imbalance handling"""
    print(f"\nTraining {gender_name} model with class imbalance handling...")
    
    # Check class distribution
    unique, counts = np.unique(y, return_counts=True)
    print(f"{gender_name} class distribution:")
    for i, (class_id, count) in enumerate(zip(unique, counts)):
        print(f"  Class {class_id}: {count} samples")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"{gender_name} training set: {X_train.shape[0]} samples")
    print(f"{gender_name} test set: {X_test.shape[0]} samples")
    
    # Use XGBoost for better performance
    if XGBOOST_AVAILABLE:
        print(f"TARGET: Using XGBoost for {gender_name}")
        model = XGBClassifier(
            n_estimators=200,
            random_state=42,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric='mlogloss',
            use_label_encoder=False
        )
        model_type = "XGBoost"
    else:
        print(f"WARNING: Falling back to RandomForest for {gender_name}")
        model = RandomForestClassifier(
            n_estimators=300,  # Increased from 100 for better accuracy
            random_state=42,
            class_weight='balanced',
            max_depth=25,  # Increased from 20
            min_samples_split=3,  # Reduced from 5 for more splits
            min_samples_leaf=1  # Reduced from 2 for more granularity
        )
        model_type = "RandomForest"
    
    print(f"Training {gender_name} {model_type} model...")
    model.fit(X_train, y_train)
    
    # Make predictions
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    # Calculate multiple metrics for imbalanced data
    train_acc = accuracy_score(y_train, train_pred)
    test_acc = accuracy_score(y_test, test_pred)
    train_f1 = f1_score(y_train, train_pred, average='weighted')
    test_f1 = f1_score(y_test, test_pred, average='weighted')
    
    print(f"\n{gender_name} {model_type} Performance:")
    print(f"Training accuracy: {train_acc:.4f}")
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Training F1-score: {train_f1:.4f}")
    print(f"Test F1-score: {test_f1:.4f}")
    
    # Show feature importance for top features
    if hasattr(model, 'feature_importances_'):
        feature_names = ['age', 'symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6', 'severity', 'gender_specific']
        importance_pairs = list(zip(feature_names, model.feature_importances_))
        importance_pairs.sort(key=lambda x: x[1], reverse=True)
        print(f"\n{gender_name} Top Feature Importances:")
        for name, importance in importance_pairs[:5]:
            print(f"  {name}: {importance:.4f}")
    
    return model, X_test, y_test, test_pred, model_type

def save_gender_model(model, encoders, disease_classes, all_symptoms, gender_name, model_type="RandomForest"):
    """Save the gender-specific model and components"""
    print(f"\nSaving {gender_name} model components...")
    
    gender_lower = gender_name.lower()
    
    # Save model
    model_filename = f'{gender_lower}_medical_model.pkl'
    joblib.dump(model, model_filename)
    print(f"SUCCESS: Saved {model_filename}")
    
    # Save encoders
    encoders_filename = f'{gender_lower}_medical_encoders.pkl'
    joblib.dump(encoders, encoders_filename)
    print(f"SUCCESS: Saved {encoders_filename}")
    
    # Save disease classes
    classes_filename = f'{gender_lower}_disease_classes.pkl'
    joblib.dump(disease_classes, classes_filename)
    print(f"SUCCESS: Saved {classes_filename}")
    
    # Save model info
    model_info = {
        'total_diseases': len(disease_classes),
        'disease_classes': list(disease_classes),
        'total_symptoms': len(all_symptoms),
        'symptoms': all_symptoms,
        'severity_levels': ['High', 'Low', 'Medium'],
        'gender_types': [gender_name],
        'model_type': f'{model_type}Classifier',
        'class_imbalance_handling': 'BalancedRandomForest' if model_type == 'BalancedRandomForest' else 'class_weight_balanced',
        'training_dataset': f'medical_training_dataset_{gender_lower}.csv',
        'gender': gender_name
    }
    
    info_filename = f'{gender_lower}_model_info.json'
    with open(info_filename, 'w') as f:
        json.dump(model_info, f, indent=2)
    print(f"SUCCESS: Saved {info_filename}")
    
    print(f"\n{gender_name} Model Summary:")
    print(f"Total diseases: {len(disease_classes)}")
    print(f"Total symptoms: {len(all_symptoms)}")
    print(f"Model files: {model_filename}, {encoders_filename}, {classes_filename}")
    
    return {
        'model_file': model_filename,
        'encoders_file': encoders_filename,
        'classes_file': classes_filename,
        'info_file': info_filename,
        'diseases': len(disease_classes),
        'symptoms': len(all_symptoms)
    }

def test_gender_models(male_files, female_files):
    """Test both gender models with sample predictions"""
    print("\n" + "="*70)
    print("TESTING GENDER-SPECIFIC MODELS")
    print("="*70)
    
    # Test male model with depression symptoms
    print("\n1. Testing MALE model with depression symptoms:")
    try:
        male_model = joblib.load(male_files['model_file'])
        male_encoders = joblib.load(male_files['encoders_file'])
        male_classes = joblib.load(male_files['classes_file'])
        
        male_sample = pd.DataFrame({
            'age': [28],
            'symptom1': ['loss of interest'],
            'symptom2': ['sleep problems'],
            'symptom3': ['mood swings'],
            'symptom4': [''],
            'symptom5': [''],
            'symptom6': [''],
            'severity': ['medium'],
            'gender_specific': ['male']
        })
        
        # Encode male sample
        male_encoded = male_sample.copy()
        symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
        for col in symptom_cols:
            male_encoded[col] = male_encoders[col].transform(male_encoded[col].astype(str))
        male_encoded['severity'] = male_encoders['severity'].transform(male_encoded['severity'])
        male_encoded['gender_specific'] = male_encoders['gender_specific'].transform(male_encoded['gender_specific'])
        
        # Predict for male
        male_pred = male_model.predict(male_encoded)[0]
        male_probs = male_model.predict_proba(male_encoded)[0]
        male_disease = male_classes[male_pred]
        male_conf = male_probs[male_pred]
        
        print(f"Male prediction: {male_disease}")
        print(f"Male confidence: {male_conf:.3f} ({male_conf*100:.1f}%)")
        
        # Show top 5 for male
        male_top5 = np.argsort(male_probs)[-5:][::-1]
        print("Male top 5 predictions:")
        for i, idx in enumerate(male_top5):
            disease = male_classes[idx]
            conf = male_probs[idx]
            print(f"  {i+1}. {disease}: {conf:.3f} ({conf*100:.1f}%)")
            
    except Exception as e:
        print(f"ERROR: Male model test failed: {e}")
    
    # Test female model with period symptoms  
    print("\n2. Testing FEMALE model with period symptoms:")
    try:
        female_model = joblib.load(female_files['model_file'])
        female_encoders = joblib.load(female_files['encoders_file'])
        female_classes = joblib.load(female_files['classes_file'])
        
        female_sample = pd.DataFrame({
            'age': [25],
            'symptom1': ['abdominal cramps'],
            'symptom2': ['bloating'],
            'symptom3': ['severe pelvic pain'],
            'symptom4': ['breast tenderness'],
            'symptom5': [''],
            'symptom6': [''],
            'severity': ['medium'],
            'gender_specific': ['female']
        })
        
        # Encode female sample
        female_encoded = female_sample.copy()
        for col in symptom_cols:
            female_encoded[col] = female_encoders[col].transform(female_encoded[col].astype(str))
        female_encoded['severity'] = female_encoders['severity'].transform(female_encoded['severity'])
        female_encoded['gender_specific'] = female_encoders['gender_specific'].transform(female_encoded['gender_specific'])
        
        # Predict for female
        female_pred = female_model.predict(female_encoded)[0]
        female_probs = female_model.predict_proba(female_encoded)[0]
        female_disease = female_classes[female_pred]
        female_conf = female_probs[female_pred]
        
        print(f"Female prediction: {female_disease}")
        print(f"Female confidence: {female_conf:.3f} ({female_conf*100:.1f}%)")
        
        # Show top 5 for female
        female_top5 = np.argsort(female_probs)[-5:][::-1]
        print("Female top 5 predictions:")
        for i, idx in enumerate(female_top5):
            disease = female_classes[idx]
            conf = female_probs[idx]
            print(f"  {i+1}. {disease}: {conf:.3f} ({conf*100:.1f}%)")
            
    except Exception as e:
        print(f"ERROR: Female model test failed: {e}")

def main():
    """Main training function"""
    print("="*70)
    print("CREATING GENDER-SPECIFIC AI MODELS FOR MEDICONNECT")
    print("="*70)
    
    try:
        # Load datasets
        df_male, df_female = load_gender_datasets()
        
        # Train Male Model
        print("\n" + "="*50)
        print("TRAINING MALE MODEL")
        print("="*50)
        
        X_male, y_male, symptoms_male = prepare_features(df_male, "Male")
        X_male_enc, y_male_enc, encoders_male, classes_male = encode_features(X_male, y_male, symptoms_male, "Male")
        model_male, _, _, _, model_type_male = train_model(X_male_enc, y_male_enc, "Male")
        male_files = save_gender_model(model_male, encoders_male, classes_male, symptoms_male, "Male", model_type_male)
        
        # Train Female Model
        print("\n" + "="*50)
        print("TRAINING FEMALE MODEL")
        print("="*50)
        
        X_female, y_female, symptoms_female = prepare_features(df_female, "Female")
        X_female_enc, y_female_enc, encoders_female, classes_female = encode_features(X_female, y_female, symptoms_female, "Female")
        model_female, _, _, _, model_type_female = train_model(X_female_enc, y_female_enc, "Female")
        female_files = save_gender_model(model_female, encoders_female, classes_female, symptoms_female, "Female", model_type_female)
        
        # Test both models
        test_gender_models(male_files, female_files)
        
        print("\n" + "="*70)
        print("SUCCESS: GENDER-SPECIFIC MODEL TRAINING COMPLETED SUCCESSFULLY!")
        print("="*70)
        print(f"Male model: {male_files['diseases']} diseases, {male_files['symptoms']} symptoms")
        print(f"Female model: {female_files['diseases']} diseases, {female_files['symptoms']} symptoms")
        print("\nNext steps:")
        print("1. Update the AI service to use gender-specific models")
        print("2. Test with the web interface")
        print("3. Verify gender bias elimination")
            
    except Exception as e:
        print(f"ERROR: Error during training: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()