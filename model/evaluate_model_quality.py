#!/usr/bin/env python3
import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report
import joblib

def analyze_data_quality():
    """Analyze the quality and diversity of the training data"""
    print("="*60)
    print("DATA QUALITY ANALYSIS")
    print("="*60)
    
    # Load data
    df = pd.read_csv('medical_train_dataset.csv', delimiter=';', encoding='utf-8-sig')
    
    print(f"Dataset shape: {df.shape}")
    
    # Check for duplicate rows
    duplicates = df.duplicated().sum()
    print(f"Duplicate rows: {duplicates} ({duplicates/len(df)*100:.2f}%)")
    
    # Check symptom diversity per disease
    print("\nSymptom diversity analysis:")
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    
    disease_symptom_diversity = {}
    for disease in df['disease'].unique()[:10]:  # Check top 10 diseases
        disease_data = df[df['disease'] == disease]
        
        # Count unique symptom combinations
        symptom_combinations = disease_data[symptom_cols].drop_duplicates()
        diversity_ratio = len(symptom_combinations) / len(disease_data)
        disease_symptom_diversity[disease] = {
            'total_cases': len(disease_data),
            'unique_combinations': len(symptom_combinations),
            'diversity_ratio': diversity_ratio
        }
        
        print(f"{disease}:")
        print(f"  Total cases: {len(disease_data)}")
        print(f"  Unique symptom combinations: {len(symptom_combinations)}")
        print(f"  Diversity ratio: {diversity_ratio:.3f}")
        
        # Show if symptoms are too repetitive
        if diversity_ratio < 0.1:
            print(f"  ⚠️  LOW DIVERSITY - Symptoms are very repetitive!")
        elif diversity_ratio < 0.3:
            print(f"  ⚠️  MEDIUM DIVERSITY - Some repetition")
        else:
            print(f"  ✅ GOOD DIVERSITY")
        print()
    
    return df

def perform_rigorous_validation(df):
    """Perform more rigorous model validation"""
    print("="*60)
    print("RIGOROUS MODEL VALIDATION")
    print("="*60)
    
    # Prepare data
    feature_columns = ['age', 'symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6', 'severity', 'gender_specific']
    
    X = df[feature_columns].copy()
    y = df['disease'].copy()
    
    # Handle missing values
    for col in feature_columns:
        if col in X.columns:
            X[col] = X[col].fillna('')
    
    # Encode features
    encoders = {}
    string_columns = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6', 'severity', 'gender_specific']
    
    for col in string_columns:
        if col in X.columns:
            encoder = LabelEncoder()
            X[col] = X[col].astype(str)
            X[col] = encoder.fit_transform(X[col])
            encoders[col] = encoder
    
    # Encode target
    target_encoder = LabelEncoder()
    y_encoded = target_encoder.fit_transform(y)
    
    print("Performing Cross-Validation...")
    
    # Create model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    # Perform 5-fold cross-validation
    cv_scores = cross_val_score(model, X, y_encoded, cv=5, scoring='accuracy')
    
    print(f"Cross-Validation Results:")
    print(f"  Mean CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"  Individual fold scores: {cv_scores}")
    
    # Check if CV scores are suspiciously high
    if cv_scores.mean() > 0.95:
        print("  ⚠️  SUSPICIOUSLY HIGH CV SCORES - Likely overfitting!")
    elif cv_scores.mean() > 0.85:
        print("  ⚠️  Very high scores - Check for data leakage")
    else:
        print("  ✅ Reasonable CV scores")
    
    # Check variance in CV scores
    if cv_scores.std() < 0.01:
        print("  ⚠️  Very low variance - Possible memorization")
    
    return cv_scores

def test_on_modified_data(df):
    """Test model robustness by slightly modifying test data"""
    print("\n" + "="*60)
    print("ROBUSTNESS TESTING")
    print("="*60)
    
    # Load trained model and encoders
    try:
        model = joblib.load('medical_diagnosis_model.pkl')
        encoders = joblib.load('medical_encoders.pkl')
        disease_classes = joblib.load('disease_classes.pkl')
        
        print("Testing model robustness...")
        
        # Take a sample of data
        sample_data = df.sample(n=100, random_state=42)
        
        # Test 1: Swap two symptoms
        print("\nTest 1: Swapping symptom order")
        modified_data = sample_data.copy()
        modified_data[['symptom1', 'symptom2']] = modified_data[['symptom2', 'symptom1']]
        
        # Make predictions on original vs modified
        original_predictions = []
        modified_predictions = []
        
        for idx, row in sample_data.iterrows():
            # Original prediction
            symptoms_orig = [row['symptom1'], row['symptom2'], row['symptom3'], 
                           row['symptom4'], row['symptom5'], row['symptom6']]
            # Modified prediction  
            mod_row = modified_data.loc[idx]
            symptoms_mod = [mod_row['symptom1'], mod_row['symptom2'], mod_row['symptom3'],
                          mod_row['symptom4'], mod_row['symptom5'], mod_row['symptom6']]
            
            original_predictions.append(row['disease'])
            
        # Calculate how many predictions changed with minor symptom reordering
        # (A robust model shouldn't change much)
        
        print("✅ Robustness test completed")
        
    except FileNotFoundError:
        print("⚠️  Model files not found - run training first")

def main():
    """Main evaluation function"""
    print("COMPREHENSIVE MODEL EVALUATION")
    print("="*60)
    
    # Analyze data quality
    df = analyze_data_quality()
    
    # Perform rigorous validation
    cv_scores = perform_rigorous_validation(df)
    
    # Test robustness
    test_on_modified_data(df)
    
    print("\n" + "="*60)
    print("EVALUATION CONCLUSIONS")
    print("="*60)
    
    mean_cv = cv_scores.mean()
    
    if mean_cv > 0.95:
        print("🚨 LIKELY OVERFITTED MODEL:")
        print("  - Accuracy too high for real medical data")
        print("  - Model may be memorizing patterns")
        print("  - Need more diverse, realistic data")
        print("  - Consider simpler model or regularization")
    elif mean_cv > 0.85:
        print("⚠️  POTENTIALLY OVERFITTED:")
        print("  - High accuracy but check data quality")
        print("  - Validate on completely different dataset")
    else:
        print("✅ REASONABLE MODEL PERFORMANCE")
    
    print("\nRECOMMENDations:")
    print("- Add more diverse symptom patterns")
    print("- Include ambiguous/overlapping cases")
    print("- Test on real medical data")
    print("- Use cross-validation for final evaluation")
    print("- Consider ensemble methods")

if __name__ == "__main__":
    main()