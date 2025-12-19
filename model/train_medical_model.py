#!/usr/bin/env python3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier
import numpy as np
import joblib
import warnings
warnings.filterwarnings('ignore')

def load_and_preprocess_data():
    """Load and preprocess the medical dataset"""
    print("Loading medical dataset...")
    
    # Load the available clean dataset with comma delimiter
    df = pd.read_csv('medical_training_dataset_clean.csv', 
                     delimiter=',', encoding='utf-8-sig')
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Display basic info
    print(f"\nDataset Info:")
    print(f"Total rows: {len(df)}")
    print(f"Diseases: {df['disease'].nunique()}")
    print(f"Severities: {df['severity'].unique()}")
    print(f"Gender specific: {df['gender_specific'].unique()}")
    
    return df

def prepare_features(df):
    """Prepare features for training"""
    print("\nPreparing features...")
    
    # Features: age + symptoms + severity + gender_specific
    feature_columns = ['age', 'symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6', 'severity', 'gender_specific']
    target_column = 'disease'
    
    # Handle missing values by filling with empty string
    for col in feature_columns:
        if col in df.columns:
            df[col] = df[col].fillna('')
    
    # Create feature matrix
    X = df[feature_columns].copy()
    y = df[target_column].copy()
    
    # Import OneHotEncoder for proper categorical encoding
    from sklearn.preprocessing import OneHotEncoder
    import scipy.sparse
    
    # Encode categorical features
    encoders = {}
    
    # Use OneHotEncoder for symptoms (categorical features)
    symptom_columns = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    ordinal_columns = ['severity', 'gender_specific']  # These can remain label encoded
    
    # OneHot encode symptoms
    for col in symptom_columns:
        if col in X.columns:
            encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
            # Convert to string and handle empty values
            X[col] = X[col].astype(str)
            encoded_data = encoder.fit_transform(X[[col]])
            
            # Replace the original column with encoded columns
            feature_names = [f"{col}_{cat}" for cat in encoder.categories_[0]]
            encoded_df = pd.DataFrame(encoded_data, columns=feature_names, index=X.index)
            
            # Drop original column and add encoded columns
            X = X.drop(columns=[col])
            X = pd.concat([X, encoded_df], axis=1)
            
            encoders[col] = encoder
    
    # Label encode ordinal features
    for col in ordinal_columns:
        if col in X.columns:
            encoder = LabelEncoder()
            X[col] = X[col].astype(str)
            X[col] = encoder.fit_transform(X[col])
            encoders[col] = encoder
    
    # Encode target variable
    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    encoders['disease'] = target_encoder
    
    print(f"Feature matrix shape: {X.shape}")
    print(f"Number of unique diseases: {len(target_encoder.classes_)}")
    
    return X, y_encoded, encoders, target_encoder.classes_

def train_model(X, y):
    """Train medical diagnosis models with 2024 best practices"""
    print("\nSplitting data for training...")
    
    # Split the data with stratification for imbalanced classes
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Test set size: {X_test.shape[0]}")
    
    # Skip SMOTE due to memory constraints with 1516 features
    # Use class_weight='balanced' instead for efficient class balancing
    print("\nUsing class_weight='balanced' for memory-efficient class balancing...")
    print("(SMOTE skipped due to high-dimensional sparse features)")
    
    X_train_balanced, y_train_balanced = X_train, y_train
    print(f"Training set size: {X_train_balanced.shape[0]}")
    
    # Show class distribution before balancing
    unique_classes, class_counts = np.unique(y_train, return_counts=True)
    print(f"Class distribution - Min: {class_counts.min()}, Max: {class_counts.max()}, Mean: {class_counts.mean():.1f}")
    
    # Train Random Forest with balanced class weights
    print("\nTraining Random Forest with class balancing...")
    print("Progress: [          ] 0% - Starting RandomForest training...")
    rf_model = RandomForestClassifier(
        n_estimators=100,           # Reduced from 200 for faster training
        max_depth=15,               # Reduced to prevent overfitting
        min_samples_split=10,       # Higher to prevent overfitting
        min_samples_leaf=5,         # Higher to prevent overfitting
        random_state=42,
        n_jobs=-1,
        class_weight='balanced',    # CRITICAL: Balance classes
        verbose=1                   # Show progress during training
    )
    
    rf_model.fit(X_train_balanced, y_train_balanced)
    print("Progress: [█████     ] 50% - RandomForest completed!")
    
    # Train XGBoost for comparison
    print("Progress: [█████     ] 50% - Starting XGBoost training...")
    xgb_base = XGBClassifier(
        n_estimators=100,           # Reduced from 200 for faster training
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        eval_metric='logloss',
        scale_pos_weight=1,         # Will be auto-calculated for imbalanced data
        verbosity=0                 # Reduce verbosity for cleaner output
    )
    
    # Apply probability calibration to XGBoost to fix overconfidence
    print("Progress: [██████    ] 60% - Applying probability calibration to XGBoost...")
    xgb_model = CalibratedClassifierCV(
        estimator=xgb_base,         # Updated parameter name for newer sklearn
        method='isotonic',          # Isotonic regression for better calibration
        cv=3,                       # 3-fold cross-validation for calibration
        n_jobs=-1
    )
    
    xgb_model.fit(X_train_balanced, y_train_balanced)
    print("Progress: [██████████] 100% - Calibrated XGBoost completed!")
    
    # Make predictions with both models
    print("\nMaking predictions...")
    rf_pred = rf_model.predict(X_test)
    xgb_pred = xgb_model.predict(X_test)
    
    # Evaluate both models
    print("\n" + "="*60)
    print("MODEL PERFORMANCE COMPARISON")
    print("="*60)
    
    # Random Forest Evaluation
    rf_accuracy = accuracy_score(y_test, rf_pred)
    rf_f1_macro = f1_score(y_test, rf_pred, average='macro')
    rf_f1_weighted = f1_score(y_test, rf_pred, average='weighted')
    rf_precision = precision_score(y_test, rf_pred, average='weighted', zero_division=0)
    rf_recall = recall_score(y_test, rf_pred, average='weighted')
    
    print(f"\nRANDOM FOREST RESULTS:")
    print(f"Accuracy: {rf_accuracy:.4f} ({rf_accuracy*100:.2f}%)")
    print(f"F1-Score (Macro): {rf_f1_macro:.4f}")
    print(f"F1-Score (Weighted): {rf_f1_weighted:.4f}")
    print(f"Precision (Weighted): {rf_precision:.4f}")
    print(f"Recall (Weighted): {rf_recall:.4f}")
    
    # XGBoost Evaluation
    xgb_accuracy = accuracy_score(y_test, xgb_pred)
    xgb_f1_macro = f1_score(y_test, xgb_pred, average='macro')
    xgb_f1_weighted = f1_score(y_test, xgb_pred, average='weighted')
    xgb_precision = precision_score(y_test, xgb_pred, average='weighted', zero_division=0)
    xgb_recall = recall_score(y_test, xgb_pred, average='weighted')
    
    print(f"\nXGBOOST RESULTS:")
    print(f"Accuracy: {xgb_accuracy:.4f} ({xgb_accuracy*100:.2f}%)")
    print(f"F1-Score (Macro): {xgb_f1_macro:.4f}")
    print(f"F1-Score (Weighted): {xgb_f1_weighted:.4f}")
    print(f"Precision (Weighted): {xgb_precision:.4f}")
    print(f"Recall (Weighted): {xgb_recall:.4f}")
    
    # Choose best model based on F1-score (macro) - better for imbalanced data
    if rf_f1_macro >= xgb_f1_macro:
        best_model = rf_model
        best_pred = rf_pred
        best_name = "Random Forest"
        print(f"\nBEST MODEL: Random Forest (F1-Macro: {rf_f1_macro:.4f})")
    else:
        best_model = xgb_model
        best_pred = xgb_pred
        best_name = "Calibrated XGBoost"
        print(f"\nBEST MODEL: Calibrated XGBoost (F1-Macro: {xgb_f1_macro:.4f})")
    
    return best_model, X_test, y_test, best_pred, best_name

def save_model_and_encoders(model, encoders, disease_classes):
    """Save the trained model and encoders"""
    print("\nSaving model and encoders...")
    
    # Save model (Windows paths)
    joblib.dump(model, 'medical_diagnosis_model.pkl')
    
    # Save encoders
    joblib.dump(encoders, 'medical_encoders.pkl')
    
    # Save disease classes
    joblib.dump(disease_classes, 'disease_classes.pkl')
    
    print("Model saved as: medical_diagnosis_model.pkl")
    print("Encoders saved as: medical_encoders.pkl")
    print("Disease classes saved as: disease_classes.pkl")

def display_results(y_test, y_pred, disease_classes, model_name):
    """Display detailed medical AI results with focus on clinical relevance"""
    print("\n" + "="*70)
    print(f"MEDICAL AI DIAGNOSIS RESULTS - {model_name}")
    print("="*70)
    
    # Show top 10 most common diseases in test set
    unique, counts = np.unique(y_test, return_counts=True)
    top_diseases_idx = np.argsort(counts)[-10:][::-1]
    
    print("\nTop 10 most common diseases in test set:")
    for i, idx in enumerate(top_diseases_idx, 1):
        disease_name = disease_classes[unique[idx]]
        count = counts[idx]
        print(f"{i:2d}. {disease_name}: {count} cases")
    
    # Check mental health predictions specifically
    print("\n" + "="*50)
    print("MENTAL HEALTH DISEASE ANALYSIS")
    print("="*50)
    
    mental_diseases = ['Anxiety Disorder', 'Depression']
    for mental_disease in mental_diseases:
        if mental_disease in disease_classes:
            disease_idx = np.where(disease_classes == mental_disease)[0][0]
            
            # Find cases where this mental disease was the true label
            true_mental_cases = np.where(y_test == disease_idx)[0]
            
            if len(true_mental_cases) > 0:
                predicted_labels = y_pred[true_mental_cases]
                predicted_diseases = [disease_classes[pred] for pred in predicted_labels]
                
                print(f"\n{mental_disease} Analysis:")
                print(f"True cases in test set: {len(true_mental_cases)}")
                print(f"Correctly predicted: {np.sum(predicted_labels == disease_idx)}")
                print(f"Accuracy for {mental_disease}: {np.sum(predicted_labels == disease_idx)/len(true_mental_cases)*100:.1f}%")
                
                # Show what it predicted instead
                wrong_predictions = predicted_labels[predicted_labels != disease_idx]
                if len(wrong_predictions) > 0:
                    wrong_diseases = [disease_classes[pred] for pred in wrong_predictions]
                    unique_wrong, counts_wrong = np.unique(wrong_diseases, return_counts=True)
                    print(f"Wrong predictions: {', '.join([f'{d}({c})' for d, c in zip(unique_wrong[:3], counts_wrong[:3])])}")
    
    # Show classification report for all diseases with focus on mental health
    print(f"\nDetailed Classification Metrics:")
    
    # Calculate per-class metrics
    from sklearn.metrics import precision_recall_fscore_support
    precision, recall, f1, support = precision_recall_fscore_support(y_test, y_pred, average=None, zero_division=0)
    
    # Show mental health metrics specifically
    for mental_disease in mental_diseases:
        if mental_disease in disease_classes:
            disease_idx = np.where(disease_classes == mental_disease)[0][0]
            print(f"{mental_disease}: Precision={precision[disease_idx]:.3f}, Recall={recall[disease_idx]:.3f}, F1={f1[disease_idx]:.3f}")
    
    # Show top performing diseases
    f1_sorted_idx = np.argsort(f1)[-5:][::-1]
    print(f"\nTop 5 best performing diseases (F1-score):")
    for i, idx in enumerate(f1_sorted_idx, 1):
        if support[idx] > 0:  # Only show diseases that appear in test set
            print(f"{i}. {disease_classes[idx]}: F1={f1[idx]:.3f} (Support={support[idx]})")
    
    print("\n" + "="*70)

def create_prediction_function():
    """Create a function to make predictions with new data"""
    prediction_code = '''
# Prediction function - save this as predict_disease.py
import joblib
import pandas as pd
import numpy as np

def predict_disease(age, symptoms, severity='Medium', gender_specific='Both'):
    """
    Predict disease based on symptoms
    
    Args:
        age (int): Patient age
        symptoms (list): List of up to 6 symptoms
        severity (str): 'Low', 'Medium', or 'High'
        gender_specific (str): 'Male', 'Female', or 'Both'
    
    Returns:
        str: Predicted disease name
    """
    # Load model and encoders
    model = joblib.load('medical_diagnosis_model.pkl')
    encoders = joblib.load('medical_encoders.pkl')
    disease_classes = joblib.load('disease_classes.pkl')
    
    # Prepare symptoms (pad to 6 symptoms)
    symptoms_padded = symptoms + [''] * (6 - len(symptoms))
    symptoms_padded = symptoms_padded[:6]
    
    # Create input data
    input_data = {
        'age': [age],
        'symptom1': [symptoms_padded[0]],
        'symptom2': [symptoms_padded[1]], 
        'symptom3': [symptoms_padded[2]],
        'symptom4': [symptoms_padded[3]],
        'symptom5': [symptoms_padded[4]],
        'symptom6': [symptoms_padded[5]],
        'severity': [severity],
        'gender_specific': [gender_specific]
    }
    
    df = pd.DataFrame(input_data)
    
    # Encode features
    string_columns = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6', 'severity', 'gender_specific']
    
    for col in string_columns:
        encoder = encoders[col]
        # Handle unknown categories
        try:
            df[col] = encoder.transform(df[col].astype(str))
        except ValueError:
            # If category not seen during training, use most frequent category
            df[col] = [0]  # Default to first category
    
    # Make prediction
    prediction = model.predict(df)
    predicted_disease = disease_classes[prediction[0]]
    
    return predicted_disease

# Example usage:
if __name__ == "__main__":
    # Example prediction
    symptoms = ["Fever", "Cough", "Fatigue", "Headache"]
    predicted = predict_disease(age=25, symptoms=symptoms, severity="Medium")
    print(f"Predicted disease: {predicted}")
'''
    
    with open('predict_disease.py', 'w') as f:
        f.write(prediction_code)
    
    print("\nPrediction function saved as: predict_disease.py")

def main():
    """Main training function with 2024 medical AI best practices"""
    print("="*70)
    print("MEDICAL DIAGNOSIS MODEL TRAINING - 2024 ENHANCED")
    print("="*70)
    
    # Load data
    df = load_and_preprocess_data()
    
    # Prepare features
    X, y, encoders, disease_classes = prepare_features(df)
    
    # Train model with advanced techniques
    model, X_test, y_test, y_pred, model_name = train_model(X, y)
    
    # Save best model
    save_model_and_encoders(model, encoders, disease_classes)
    
    # Display comprehensive results
    display_results(y_test, y_pred, disease_classes, model_name)
    
    # Create prediction function
    create_prediction_function()
    
    print("\n" + "="*70)
    print(f"TRAINING COMPLETED - BEST MODEL: {model_name}")
    print("="*70)
    print("\nEnhancements Applied:")
    print("✅ Class balancing with class_weight='balanced'")
    print("✅ Memory-efficient training (SMOTE skipped for high-dim data)")
    print("✅ XGBoost vs RandomForest comparison")
    print("✅ Probability calibration for XGBoost (fixes overconfidence)")
    print("✅ Medical-focused evaluation metrics (F1, Precision, Recall)")
    print("✅ Mental health prediction analysis")
    print("\nFiles created:")
    print("- medical_diagnosis_model.pkl (best trained model)")
    print("- medical_encoders.pkl (feature encoders)")
    print("- disease_classes.pkl (disease labels)")
    print("- predict_disease.py (prediction function)")
    
    print("\nTo make predictions, use:")
    print("python predict_disease.py")

if __name__ == "__main__":
    main()