# MediConnect AI Models

This folder contains all AI training files, models, and datasets for the MediConnect medical diagnosis system.

## Directory Contents

**Total Files**: 63 files
**Total Size**: 2.3 GB
**Location**: `C:\Users\Lenovo\Downloads\MediConnect\model`

---

## 📁 File Categories

### 🤖 AI Service Files (Primary)
- `gender_ai_service_embedding.py` - **Main embedding-based AI service**
- `gender_diagnosis_api.py` - **Flask REST API (port 5002)**
- `clean_ai_service.py` - Alternative clean model service
- `gender_ai_service.py` - Standard gender-specific service
- `gender_ai_service_fixed.py` - Fixed version with symptom mapping

### 🏋️ Training Scripts
- `train_embedding_models.py` - **Recommended** - Trains embedding-based models
- `train_gender_models.py` - Trains standard gender-specific models
- `train_clean_model.py` - Trains unified clean model
- `train_deep_learning_models.py` - Trains deep learning models
- `train_medical_model.py` - Original training script
- `augment_medical_data.py` - Data augmentation script

### 🔬 Testing & Debug
- `test_diagnosis.html` - Web-based testing interface
- `check_symptoms.py` - Symptom checker utility
- `debug_influenza.py` - Influenza prediction debugging
- `test_integration.py` - Integration tests
- `test_complete_integration.py` - Complete integration tests
- `test_fever_cough_headache.py` - Specific symptom tests
- `evaluate_model_quality.py` - Model evaluation script

### 🎯 Model Files (19 .pkl files)

**Embedding-Based Models (Recommended)**
- `male_medical_model_embedding.pkl` (28.6 MB) - 54 diseases
- `female_medical_model_embedding.pkl` (28.6 MB) - 57 diseases
- `male_disease_classes_embedding.pkl`
- `female_disease_classes_embedding.pkl`
- `male_medical_encoders_embedding.pkl`
- `female_medical_encoders_embedding.pkl`

**Standard Models**
- `male_medical_model.pkl` (1.1 GB)
- `female_medical_model.pkl` (1.0 GB)
- Associated encoders and classes files

**Deep Learning Models**
- `male_medical_model_dl.keras` (566 KB)
- `female_medical_model_dl.keras` (577 KB)

**Clean Model**
- `clean_medical_model.pkl` (87.5 MB)
- `clean_disease_classes.pkl`
- `clean_medical_encoders.pkl`

### 📊 Datasets
- `medical_train_dataset.csv` (10.5 MB) - 114K rows
- `medical_training_dataset_clean.csv` (718 KB) - 10K rows

### 📄 Configuration & Documentation
- `male_model_info_embedding.json` - Embedding model specs
- `female_model_info_embedding.json` - Embedding model specs
- `male_model_info.json` - Standard model specs
- `female_model_info.json` - Standard model specs
- `clean_model_info.json` - Clean model specs
- `model_info.json` - General model info
- `simple_disease_model.json` - Simple disease definitions
- `DIAGNOSIS_ISSUE_ANALYSIS.md` - Known issues documentation
- `FIX_INSTRUCTIONS.md` - Bug fix instructions

### 📝 Other Files
- `dataset_symptoms.txt` - Symptom list
- `diagnosis_symptoms.txt` - Diagnosis symptom mappings
- `retrain_output.log` - Training log output
- `backend_integration_example.js` - Backend integration example
- `package-lock.json` - Node.js dependencies

---

## 🚀 Quick Start

### Run the AI API Server
```bash
cd "C:\Users\Lenovo\Downloads\MediConnect\model"
python gender_diagnosis_api.py
```
Server will start on `http://127.0.0.1:5002`

### Test the API
Open `test_diagnosis.html` in a web browser

### Train New Models
```bash
python train_embedding_models.py
```

---

## 📈 Model Performance

### Embedding-Based Models (Recommended)
- **Male Model**: 70.6% test accuracy, 54 diseases
- **Female Model**: 74.1% test accuracy, 57 diseases
- **Technology**: all-MiniLM-L6-v2 + RandomForest
- **Features**: 387 total (age + 384 embeddings + severity + gender)
- **Regularization**: Overfitting gap < 15%

### Standard Models
- Larger file size (1GB+)
- Uses XGBoost/RandomForest with label encoding

---

## 🏥 Supported Diseases

**Total**: 60+ diseases across both models

**Categories**:
- Common: Influenza, Common Cold, Hypertension, Diabetes
- Mental Health: Depression, Anxiety Disorder
- Serious: Stroke, Cancer, HIV, Tuberculosis, Hepatitis
- Infectious: Malaria, Dengue Fever, Cholera, Rabies
- Gender-specific Male: Prostate Cancer, Erectile Dysfunction, Testicular Cancer
- Gender-specific Female: Endometriosis, PCOS, Pregnancy Complications, Cervical Cancer

---

## 🔧 API Endpoints

### POST `/ai/diagnose`
```json
{
  "age": 30,
  "symptoms": "fever, cough, body aches, fatigue",
  "severity": "medium",
  "gender": "male"
}
```

### GET `/ai/health`
Health check endpoint

### GET `/ai/info`
Model information endpoint

---

## 📋 Known Issues & Fixes

### Issue: Influenza Misdiagnosis
- **Problem**: Symptom vocabulary mismatch
- **Solution**: Use `gender_ai_service_fixed.py` with symptom mapping
- **Details**: See `DIAGNOSIS_ISSUE_ANALYSIS.md`

### Symptom Mapping Examples
- "chills" → "fever"
- "muscle aches" → "body aches"
- "runny nose" → "congestion"
- "tired" → "fatigue"

---

## 🔒 Important Notes

1. **Use embedding-based models** for best results
2. Models require **sentence-transformers** library
3. API runs on **port 5002** by default
4. Always consult healthcare professionals - AI is for informational purposes only
5. Models handle gender-specific conditions appropriately

---

## 📦 Dependencies

```bash
pip install pandas numpy scikit-learn joblib flask flask-cors sentence-transformers
```

---

## 📞 Support

For issues or questions, refer to:
- `DIAGNOSIS_ISSUE_ANALYSIS.md` - Troubleshooting
- `FIX_INSTRUCTIONS.md` - Implementation fixes

---

*Last Updated: October 13, 2024*
