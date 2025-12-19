# AI Model Inaccuracy Issue Analysis

## Problem
The AI model is giving inaccurate results when users input influenza symptoms.

## Root Cause Analysis

### 1. **Case Sensitivity Issue**
The models were trained with **lowercase** symptoms, but the model info JSON files show symptoms in various cases:
- Male model symptoms: lowercase (e.g., "fever", "cough", "body aches")
- Female model symptoms: lowercase (e.g., "fever", "cough", "body aches")

**Current Implementation**: The `gender_ai_service.py` already normalizes inputs to lowercase ✅

### 2. **Symptom Vocabulary Mismatch**
Looking at the male model symptoms (from male_model_info.json):
- ✅ "fever" - EXISTS
- ✅ "cough" - EXISTS  
- ✅ "body aches" - EXISTS
- ✅ "headache" - EXISTS
- ✅ "muscle aches" - EXISTS
- ✅ "sore throat" - EXISTS
- ✅ "fatigue" - EXISTS
- ❌ "chills" - NOT FOUND in male model
- ❌ "runny nose" - NOT FOUND in male model
- ❌ "muscle pain" - EXISTS (but users might say "muscle aches")

### 3. **Training Data Analysis**
From the dataset search, Influenza cases include:
- "body aches;fever;fatigue;sore throat"
- "fever;chills;body aches"
- "cough;body aches;headache;sore throat"
- "fever;cough;body aches"
- "cough;headache;fever"

**Note**: Training data uses "chills" but male model symptoms list doesn't show it!

### 4. **Similar Diseases**
The model also has "Haemophilus Influenzae Type B" which shares similar symptoms with Influenza:
- fever, headache, weakness, swelling
- This can cause confusion in predictions

## Issues Identified

### Issue 1: Unknown Symptom Handling
When a user enters a symptom that's not in the encoder:
```python
except ValueError as e:
    logger.warning(f"⚠️ Unknown symptom in {col}: {df[col].iloc[0]}, using empty string")
    df_encoded[col] = encoder.transform([''])
```
**Problem**: Unknown symptoms are replaced with empty strings, losing information!

### Issue 2: Symptom Not in Training Data
If users type symptoms that aren't recognized:
- "runny nose" → might not be in model
- "chills" → might not be in male model  
- "muscle aches" vs "muscle pain" → different encoding

### Issue 3: Not Enough Symptoms
Influenza typically has 4-6 symptoms, but if only 2-3 are recognized, the model lacks information for accurate prediction.

## Solutions

### Immediate Fix 1: Add Symptom Mapping
Map common user inputs to model symptoms:
```python
SYMPTOM_MAPPING = {
    'chills': 'fever',  # chills often accompany fever
    'runny nose': 'congestion',
    'stuffy nose': 'congestion',
    'muscle aches': 'muscle pain',
    'muscle pain': 'muscle aches',
    'tired': 'fatigue',
    'exhausted': 'fatigue',
    'headaches': 'headache',
}
```

### Immediate Fix 2: Better Unknown Symptom Handling
Instead of replacing with empty string, use the closest match:
- Use fuzzy matching to find similar symptoms
- Log warnings for unmapped symptoms
- Provide suggestions to users

### Immediate Fix 3: Retrain with More Symptoms
The current models are missing common symptoms like:
- "chills" (in training data but not in male model vocab?)
- "runny nose" 
- "stuffy nose"
- "congestion"

### Long-term Fix: Symptom Standardization
1. Create a comprehensive symptom vocabulary
2. Add synonym mapping
3. Implement fuzzy matching for typos
4. Validate all training data symptoms are in encoders

## Testing Recommendations

Test with these exact inputs (lowercase):
1. **Should predict Influenza:**
   - "fever, cough, body aches, fatigue"
   - "fever, sore throat, muscle aches, headache"
   - "cough, headache, fever, weakness"

2. **Check what it actually predicts:**
   - "fever, cough, chills, body aches" (if chills is missing)
   - "runny nose, sore throat, fever, fatigue"

## Quick Fix Implementation

Add this to `gender_ai_service.py` before symptom parsing:

```python
def normalize_symptom(symptom: str) -> str:
    """Normalize and map common symptom variations"""
    symptom = symptom.strip().lower()
    
    # Symptom mapping
    mapping = {
        'chills': 'fever',
        'shivering': 'fever',
        'runny nose': 'congestion',
        'stuffy nose': 'congestion',
        'blocked nose': 'congestion',
        'muscle aches': 'body aches',
        'tired': 'fatigue',
        'exhausted': 'fatigue',
        'exhaustion': 'fatigue',
        'headaches': 'headache',
        'coughing': 'cough',
    }
    
    return mapping.get(symptom, symptom)
```
