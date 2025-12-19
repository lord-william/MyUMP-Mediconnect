"""
Deep Learning Model Training for Gender-Specific Medical Diagnosis
Uses Neural Networks with Embedding layers for better generalization
"""

import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import json

print("="*70)
print("DEEP LEARNING MODEL TRAINING FOR MEDICONNECT")
print("="*70)

def prepare_features(df, gender_name):
    """Prepare features for a specific gender dataset"""
    print(f"\nPreparing features for {gender_name} model...")

    # Normalize text to lowercase
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        df[col] = df[col].fillna('').str.lower().str.strip()

    df['severity'] = df['severity'].str.lower().str.strip()
    df['gender_specific'] = df['gender_specific'].str.lower().str.strip()

    # Get features and target
    X = df[['age'] + symptom_cols + ['severity', 'gender_specific']].copy()
    y = df['disease'].copy()

    # Get unique symptoms
    all_symptoms = set()
    for col in symptom_cols:
        symptoms = df[col].dropna().unique()
        all_symptoms.update(symptoms)
    all_symptoms.discard('')

    print(f"{gender_name} total unique symptoms: {len(all_symptoms)}")
    print(f"{gender_name} target diseases: {y.nunique()}")

    return X, y, sorted(all_symptoms)

def encode_features(X, y, all_symptoms, gender_name, encoders=None):
    """Encode features with embeddings in mind"""
    print(f"\nEncoding features for {gender_name}...")

    # If encoders not provided, create new ones
    if encoders is None:
        encoders = {}

        # Create symptom encoder (includes empty string)
        symptom_vocab = [''] + sorted(all_symptoms)
        encoders['symptom'] = {symptom: idx for idx, symptom in enumerate(symptom_vocab)}
        encoders['symptom_vocab_size'] = len(symptom_vocab)

        # Create severity encoder
        severity_encoder = LabelEncoder()
        severity_encoder.fit(X['severity'].unique())
        encoders['severity'] = severity_encoder

        # Create gender encoder
        gender_encoder = LabelEncoder()
        gender_encoder.fit(X['gender_specific'].unique())
        encoders['gender'] = gender_encoder

        # Create disease encoder
        disease_encoder = LabelEncoder()
        disease_encoder.fit(y)
        encoders['disease'] = disease_encoder

    # Encode symptoms using vocabulary
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    X_encoded = X.copy()

    for col in symptom_cols:
        X_encoded[col] = X[col].map(encoders['symptom']).fillna(0).astype(int)

    # Encode severity and gender
    X_encoded['severity'] = encoders['severity'].transform(X['severity'])
    X_encoded['gender_specific'] = encoders['gender'].transform(X['gender_specific'])

    # Encode disease labels
    y_encoded = encoders['disease'].transform(y)

    print(f"{gender_name} symptom vocabulary size: {encoders['symptom_vocab_size']}")
    print(f"{gender_name} disease classes: {len(encoders['disease'].classes_)}")

    return X_encoded, y_encoded, encoders

def create_neural_network(symptom_vocab_size, num_diseases, embedding_dim=32):
    """Create neural network with embedding layer"""
    print("\nBuilding Neural Network Architecture...")
    print(f"Symptom vocabulary size: {symptom_vocab_size}")
    print(f"Embedding dimension: {embedding_dim}")
    print(f"Number of diseases: {num_diseases}")

    # Input layers
    age_input = layers.Input(shape=(1,), name='age')
    symptom1_input = layers.Input(shape=(1,), name='symptom1')
    symptom2_input = layers.Input(shape=(1,), name='symptom2')
    symptom3_input = layers.Input(shape=(1,), name='symptom3')
    symptom4_input = layers.Input(shape=(1,), name='symptom4')
    symptom5_input = layers.Input(shape=(1,), name='symptom5')
    symptom6_input = layers.Input(shape=(1,), name='symptom6')
    severity_input = layers.Input(shape=(1,), name='severity')
    gender_input = layers.Input(shape=(1,), name='gender_specific')

    # Shared embedding layer for all symptoms
    symptom_embedding = layers.Embedding(
        input_dim=symptom_vocab_size,
        output_dim=embedding_dim,
        name='symptom_embedding'
    )

    # Embed each symptom
    symptom1_embedded = layers.Flatten()(symptom_embedding(symptom1_input))
    symptom2_embedded = layers.Flatten()(symptom_embedding(symptom2_input))
    symptom3_embedded = layers.Flatten()(symptom_embedding(symptom3_input))
    symptom4_embedded = layers.Flatten()(symptom_embedding(symptom4_input))
    symptom5_embedded = layers.Flatten()(symptom_embedding(symptom5_input))
    symptom6_embedded = layers.Flatten()(symptom_embedding(symptom6_input))

    # Concatenate all features
    concatenated = layers.Concatenate()([
        age_input,
        symptom1_embedded, symptom2_embedded, symptom3_embedded,
        symptom4_embedded, symptom5_embedded, symptom6_embedded,
        severity_input, gender_input
    ])

    # Dense layers with dropout
    x = layers.Dense(128, activation='relu', name='dense1')(concatenated)
    x = layers.Dropout(0.3, name='dropout1')(x)
    x = layers.Dense(64, activation='relu', name='dense2')(x)
    x = layers.Dropout(0.3, name='dropout2')(x)
    x = layers.Dense(32, activation='relu', name='dense3')(x)

    # Output layer
    output = layers.Dense(num_diseases, activation='softmax', name='output')(x)

    # Create model
    model = keras.Model(
        inputs=[age_input, symptom1_input, symptom2_input, symptom3_input,
                symptom4_input, symptom5_input, symptom6_input,
                severity_input, gender_input],
        outputs=output,
        name='medical_diagnosis_nn'
    )

    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    print("\nModel Architecture:")
    model.summary()

    return model

def train_model(gender, df):
    """Train deep learning model for a specific gender"""
    print(f"\n{'='*50}")
    print(f"TRAINING {gender.upper()} DEEP LEARNING MODEL")
    print(f"{'='*50}")

    # Prepare features
    X, y, all_symptoms = prepare_features(df, gender)

    # Encode features
    X_encoded, y_encoded, encoders = encode_features(X, y, all_symptoms, gender)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print(f"\n{gender} training set: {len(X_train)} samples")
    print(f"{gender} test set: {len(X_test)} samples")

    # Prepare input data for model
    def prepare_model_input(X_data):
        return {
            'age': X_data['age'].values,
            'symptom1': X_data['symptom1'].values,
            'symptom2': X_data['symptom2'].values,
            'symptom3': X_data['symptom3'].values,
            'symptom4': X_data['symptom4'].values,
            'symptom5': X_data['symptom5'].values,
            'symptom6': X_data['symptom6'].values,
            'severity': X_data['severity'].values,
            'gender_specific': X_data['gender_specific'].values
        }

    X_train_dict = prepare_model_input(X_train)
    X_test_dict = prepare_model_input(X_test)

    # Create model
    model = create_neural_network(
        symptom_vocab_size=encoders['symptom_vocab_size'],
        num_diseases=len(encoders['disease'].classes_)
    )

    # Train model
    print(f"\nTraining {gender} Deep Learning Model...")

    # Early stopping to prevent overfitting
    early_stopping = keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    )

    history = model.fit(
        X_train_dict,
        y_train,
        validation_data=(X_test_dict, y_test),
        epochs=50,
        batch_size=32,
        callbacks=[early_stopping],
        verbose=1
    )

    # Evaluate model
    train_loss, train_accuracy = model.evaluate(X_train_dict, y_train, verbose=0)
    test_loss, test_accuracy = model.evaluate(X_test_dict, y_test, verbose=0)

    print(f"\n{gender} Deep Learning Performance:")
    print(f"Training accuracy: {train_accuracy:.4f}")
    print(f"Test accuracy: {test_accuracy:.4f}")
    print(f"Training loss: {train_loss:.4f}")
    print(f"Test loss: {test_loss:.4f}")

    # Save model and encoders
    model_prefix = gender.lower()

    # Save Keras model
    model.save(f'{model_prefix}_medical_model_dl.keras')
    print(f"SUCCESS: Saved {model_prefix}_medical_model_dl.keras")

    # Save encoders
    joblib.dump(encoders, f'{model_prefix}_medical_encoders_dl.pkl')
    print(f"SUCCESS: Saved {model_prefix}_medical_encoders_dl.pkl")

    # Save disease classes
    disease_classes = encoders['disease'].classes_
    joblib.dump(disease_classes, f'{model_prefix}_disease_classes_dl.pkl')
    print(f"SUCCESS: Saved {model_prefix}_disease_classes_dl.pkl")

    # Save model info
    model_info = {
        'total_diseases': len(disease_classes),
        'disease_classes': disease_classes.tolist(),
        'total_symptoms': len(all_symptoms),
        'symptoms': sorted(all_symptoms),
        'severity_levels': encoders['severity'].classes_.tolist(),
        'gender_types': encoders['gender'].classes_.tolist(),
        'model_type': 'DeepLearning_NeuralNetwork',
        'embedding_dimension': 32,
        'training_dataset': f'medical_training_dataset_{gender.lower()}_augmented.csv',
        'gender': gender,
        'test_accuracy': float(test_accuracy),
        'train_accuracy': float(train_accuracy)
    }

    with open(f'{model_prefix}_model_info_dl.json', 'w') as f:
        json.dump(model_info, f, indent=2)
    print(f"SUCCESS: Saved {model_prefix}_model_info_dl.json")

    return model, encoders, history

# Main execution
if __name__ == '__main__':
    # Load datasets
    print("\nLoading augmented datasets...")
    df_male = pd.read_csv('medical_training_dataset_male_augmented.csv', delimiter=';', encoding='utf-8-sig')
    df_female = pd.read_csv('medical_training_dataset_female_augmented.csv', delimiter=';', encoding='utf-8-sig')

    print(f"Male dataset: {len(df_male)} rows, {df_male['disease'].nunique()} diseases")
    print(f"Female dataset: {len(df_female)} rows, {df_female['disease'].nunique()} diseases")

    # Train male model
    male_model, male_encoders, male_history = train_model('Male', df_male)

    # Train female model
    female_model, female_encoders, female_history = train_model('Female', df_female)

    print("\n" + "="*70)
    print("SUCCESS: DEEP LEARNING MODEL TRAINING COMPLETED!")
    print("="*70)
    print("\nModels saved:")
    print("- male_medical_model_dl.keras")
    print("- female_medical_model_dl.keras")
    print("- Corresponding encoders and metadata files")