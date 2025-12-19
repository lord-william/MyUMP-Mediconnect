#!/usr/bin/env python3
"""
Embedding-Based Gender-Specific AI Model Training Script for MediConnect
Uses all-MiniLM-L6-v2 embeddings for better symptom understanding + RandomForest
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score
from sentence_transformers import SentenceTransformer
import joblib
import warnings
import json
warnings.filterwarnings('ignore')

# Load the sentence transformer model
print("Loading all-MiniLM-L6-v2 model...")
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print("OK - Embedding model loaded (384 dimensions)")

def load_gender_datasets():
    """Load both male and female datasets"""
    print("\nLoading AUGMENTED gender-specific medical datasets...")

    # Load male dataset
    df_male = pd.read_csv('medical_training_dataset_male_augmented.csv', delimiter=';', encoding='utf-8-sig')
    print(f"Male dataset: {len(df_male)} rows, {df_male['disease'].nunique()} diseases")

    # Load female dataset
    df_female = pd.read_csv('medical_training_dataset_female_augmented.csv', delimiter=';', encoding='utf-8-sig')
    print(f"Female dataset: {len(df_female)} rows, {df_female['disease'].nunique()} diseases")

    return df_male, df_female

def create_symptom_text(row):
    """Convert symptom columns into a single text string for embedding"""
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    symptoms = []
    for col in symptom_cols:
        symptom = str(row[col]).strip().lower()
        if symptom and symptom != 'nan' and symptom != '':
            symptoms.append(symptom)

    # Create natural language text
    if symptoms:
        return ", ".join(symptoms)
    else:
        return "no symptoms"

def prepare_embedding_features(df, gender_name):
    """Prepare features using embeddings for symptoms"""
    print(f"\nPreparing embedding features for {gender_name} model...")

    # Normalize data
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        df[col] = df[col].fillna('').str.lower().str.strip()

    df['severity'] = df['severity'].str.lower().str.strip()
    df['gender_specific'] = df['gender_specific'].str.lower().str.strip()

    # Create symptom text for embeddings
    print(f"Creating symptom embeddings for {len(df)} samples...")
    df['symptom_text'] = df.apply(create_symptom_text, axis=1)

    # Get embeddings (batch processing for speed)
    symptom_texts = df['symptom_text'].tolist()
    symptom_embeddings = embedding_model.encode(symptom_texts, show_progress_bar=True, batch_size=32)
    print(f"OK - Generated {len(symptom_embeddings)} embeddings of dimension {symptom_embeddings.shape[1]}")

    # Create DataFrame with embeddings
    embedding_cols = [f'emb_{i}' for i in range(symptom_embeddings.shape[1])]
    df_embeddings = pd.DataFrame(symptom_embeddings, columns=embedding_cols, index=df.index)

    # Encode categorical features
    severity_encoder = LabelEncoder()
    severity_encoded = severity_encoder.fit_transform(df['severity'])

    gender_encoder = LabelEncoder()
    gender_encoded = gender_encoder.fit_transform(df['gender_specific'])

    # Combine all features: [age, embeddings (384), severity (1), gender (1)]
    X = pd.DataFrame({
        'age': df['age'].values,
        **{col: df_embeddings[col].values for col in embedding_cols},
        'severity': severity_encoded,
        'gender': gender_encoded
    })

    y = df['disease'].copy()

    print(f"{gender_name} feature shape: {X.shape}")
    print(f"{gender_name} features: age (1) + embeddings ({symptom_embeddings.shape[1]}) + severity (1) + gender (1) = {X.shape[1]} total")
    print(f"{gender_name} target classes: {y.nunique()}")

    encoders = {
        'severity': severity_encoder,
        'gender': gender_encoder
    }

    return X, y, encoders

def train_model(X, y, gender_name):
    """Train RandomForest with regularization to prevent overfitting"""
    print(f"\nTraining {gender_name} model with regularization...")

    # Check class distribution
    unique, counts = np.unique(y, return_counts=True)
    print(f"{gender_name} class distribution: {len(unique)} classes")

    # Encode target
    disease_encoder = LabelEncoder()
    y_encoded = disease_encoder.fit_transform(y)

    # Split data with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print(f"{gender_name} training set: {X_train.shape[0]} samples")
    print(f"{gender_name} test set: {X_test.shape[0]} samples")

    # RandomForest with REGULARIZATION to prevent overfitting
    model = RandomForestClassifier(
        n_estimators=100,           # Reduced from 300 to prevent overfitting
        max_depth=15,               # Reduced from 25 - key for preventing overfitting
        min_samples_split=10,       # Increased from 3 - requires more samples to split
        min_samples_leaf=5,         # Increased from 1 - each leaf must have 5+ samples
        max_features='sqrt',        # Use sqrt of features instead of all
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )

    print(f"Training {gender_name} RandomForest with regularization...")
    model.fit(X_train, y_train)

    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    train_acc = accuracy_score(y_train, train_pred)
    test_acc = accuracy_score(y_test, test_pred)
    train_f1 = f1_score(y_train, train_pred, average='weighted')
    test_f1 = f1_score(y_test, test_pred, average='weighted')

    print(f"\n{gender_name} Performance:")
    print(f"Training accuracy: {train_acc:.4f}")
    print(f"Test accuracy: {test_acc:.4f} (Target: >0.70)")
    print(f"Training F1: {train_f1:.4f}")
    print(f"Test F1: {test_f1:.4f}")
    print(f"Overfit gap: {(train_acc - test_acc):.4f} (Target: <0.15)")

    if train_acc - test_acc < 0.15:
        print("OK - Overfitting is under control!")
    else:
        print("WARNING - Still overfitting - consider more regularization")

    # Feature importance
    feature_names = ['age'] + [f'emb_{i}' for i in range(384)] + ['severity', 'gender']
    importances = model.feature_importances_

    # Get top 10 features
    top_indices = np.argsort(importances)[-10:][::-1]
    print(f"\n{gender_name} Top 10 Feature Importances:")
    for idx in top_indices:
        print(f"  {feature_names[idx]}: {importances[idx]:.4f}")

    return model, disease_encoder, X_test, y_test, test_pred

def save_embedding_model(model, disease_encoder, encoders, gender_name):
    """Save the embedding-based model"""
    print(f"\nSaving {gender_name} embedding-based model...")

    gender_lower = gender_name.lower()

    # Save model
    model_filename = f'{gender_lower}_medical_model_embedding.pkl'
    joblib.dump(model, model_filename)
    print(f"OK - Saved {model_filename}")

    # Save disease encoder
    disease_filename = f'{gender_lower}_disease_classes_embedding.pkl'
    joblib.dump(disease_encoder.classes_, disease_filename)
    print(f"OK - Saved {disease_filename}")

    # Save encoders (severity, gender)
    encoders_filename = f'{gender_lower}_medical_encoders_embedding.pkl'
    joblib.dump(encoders, encoders_filename)
    print(f"OK - Saved {encoders_filename}")

    # Save model info
    model_info = {
        'model_type': 'RandomForest + all-MiniLM-L6-v2 Embeddings',
        'embedding_model': 'sentence-transformers/all-MiniLM-L6-v2',
        'embedding_dim': 384,
        'total_features': 387,  # 1 (age) + 384 (embeddings) + 1 (severity) + 1 (gender)
        'total_diseases': len(disease_encoder.classes_),
        'disease_classes': list(disease_encoder.classes_),
        'gender': gender_name,
        'regularization': {
            'max_depth': 15,
            'min_samples_split': 10,
            'min_samples_leaf': 5,
            'max_features': 'sqrt'
        }
    }

    info_filename = f'{gender_lower}_model_info_embedding.json'
    with open(info_filename, 'w') as f:
        json.dump(model_info, f, indent=2)
    print(f"OK - Saved {info_filename}")

    return {
        'model_file': model_filename,
        'disease_file': disease_filename,
        'encoders_file': encoders_filename,
        'info_file': info_filename,
        'diseases': len(disease_encoder.classes_)
    }

def test_embedding_models(male_files, female_files):
    """Test both models with sample predictions"""
    print("\n" + "="*70)
    print("TESTING EMBEDDING-BASED MODELS")
    print("="*70)

    # Test male model with influenza symptoms
    print("\n1. Testing MALE model with INFLUENZA symptoms:")
    try:
        male_model = joblib.load(male_files['model_file'])
        male_classes = joblib.load(male_files['disease_file'])
        male_encoders = joblib.load(male_files['encoders_file'])

        # Test case: Influenza with natural language variations
        symptom_text = "fever, cough, body aches, fatigue, chills, sore throat"

        # Get embedding
        symptom_embedding = embedding_model.encode([symptom_text])[0]

        # Create feature vector
        sample_features = np.concatenate([
            [30],  # age
            symptom_embedding,  # 384 embedding dimensions
            [male_encoders['severity'].transform(['medium'])[0]],  # severity
            [male_encoders['gender'].transform(['male'])[0]]  # gender
        ]).reshape(1, -1)

        # Predict
        pred = male_model.predict(sample_features)[0]
        probs = male_model.predict_proba(sample_features)[0]
        disease = male_classes[pred]
        confidence = probs[pred]

        print(f"Input: '{symptom_text}'")
        print(f"Prediction: {disease}")
        print(f"Confidence: {confidence:.3f} ({confidence*100:.1f}%)")

        # Top 5
        top5 = np.argsort(probs)[-5:][::-1]
        print("Top 5 predictions:")
        for i, idx in enumerate(top5):
            print(f"  {i+1}. {male_classes[idx]}: {probs[idx]:.3f} ({probs[idx]*100:.1f}%)")

    except Exception as e:
        print(f"ERROR - Male test failed: {e}")
        import traceback
        traceback.print_exc()

    # Test female model
    print("\n2. Testing FEMALE model with period symptoms:")
    try:
        female_model = joblib.load(female_files['model_file'])
        female_classes = joblib.load(female_files['disease_file'])
        female_encoders = joblib.load(female_files['encoders_file'])

        symptom_text = "abdominal cramps, bloating, lower back pain, breast tenderness"
        symptom_embedding = embedding_model.encode([symptom_text])[0]

        sample_features = np.concatenate([
            [25],
            symptom_embedding,
            [female_encoders['severity'].transform(['medium'])[0]],
            [female_encoders['gender'].transform(['female'])[0]]
        ]).reshape(1, -1)

        pred = female_model.predict(sample_features)[0]
        probs = female_model.predict_proba(sample_features)[0]
        disease = female_classes[pred]
        confidence = probs[pred]

        print(f"Input: '{symptom_text}'")
        print(f"Prediction: {disease}")
        print(f"Confidence: {confidence:.3f} ({confidence*100:.1f}%)")

        top5 = np.argsort(probs)[-5:][::-1]
        print("Top 5 predictions:")
        for i, idx in enumerate(top5):
            print(f"  {i+1}. {female_classes[idx]}: {probs[idx]:.3f} ({probs[idx]*100:.1f}%)")

    except Exception as e:
        print(f"ERROR - Female test failed: {e}")

def main():
    """Main training function"""
    print("="*70)
    print("CREATING EMBEDDING-BASED AI MODELS FOR MEDICONNECT")
    print("Using: all-MiniLM-L6-v2 + RandomForest with Regularization")
    print("="*70)

    try:
        # Load datasets
        df_male, df_female = load_gender_datasets()

        # Train Male Model
        print("\n" + "="*50)
        print("TRAINING MALE MODEL")
        print("="*50)

        X_male, y_male, encoders_male = prepare_embedding_features(df_male, "Male")
        model_male, disease_enc_male, _, _, _ = train_model(X_male, y_male, "Male")
        male_files = save_embedding_model(model_male, disease_enc_male, encoders_male, "Male")

        # Train Female Model
        print("\n" + "="*50)
        print("TRAINING FEMALE MODEL")
        print("="*50)

        X_female, y_female, encoders_female = prepare_embedding_features(df_female, "Female")
        model_female, disease_enc_female, _, _, _ = train_model(X_female, y_female, "Female")
        female_files = save_embedding_model(model_female, disease_enc_female, encoders_female, "Female")

        # Test models
        test_embedding_models(male_files, female_files)

        print("\n" + "="*70)
        print("SUCCESS: EMBEDDING-BASED MODEL TRAINING COMPLETED!")
        print("="*70)
        print(f"Male model: {male_files['diseases']} diseases")
        print(f"Female model: {female_files['diseases']} diseases")
        print("\nKey improvements:")
        print("- Semantic understanding of symptoms (chills -> fever, muscle aches -> body aches)")
        print("- Regularization to prevent overfitting")
        print("- 384-dimensional embeddings capture symptom relationships")
        print("\nNext steps:")
        print("1. Update AI service to use embedding-based models")
        print("2. Test with real user inputs")
        print("3. Compare accuracy with old models")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
