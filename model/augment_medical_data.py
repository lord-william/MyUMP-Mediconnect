#!/usr/bin/env python3
"""
Medical Data Augmentation Script
Generates realistic symptom combinations based on medical knowledge
"""
import pandas as pd
import random
import json
from collections import defaultdict

# Medical knowledge base: realistic symptom patterns for each disease
DISEASE_SYMPTOM_PATTERNS = {
    # Respiratory Infections
    "Common Cold": {
        "core_symptoms": ["cough", "runny nose", "sneezing", "sore throat", "congestion"],
        "common_symptoms": ["fever", "headache", "fatigue", "body aches", "mild headache", "stuffy nose"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["cough", "runny nose", "sneezing"],
            ["fever", "cough", "headache"],
            ["sore throat", "runny nose", "sneezing"],
            ["cough", "congestion", "fatigue"],
            ["fever", "sore throat", "body aches"],
            ["sneezing", "runny nose", "congestion"],
            ["mild headache", "cough", "stuffy nose"]
        ]
    },
    "Influenza": {
        "core_symptoms": ["fever", "cough", "body aches", "fatigue", "headache"],
        "common_symptoms": ["chills", "sore throat", "weakness", "muscle pain", "shortness of breath"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "cough", "body aches"],
            ["fever", "headache", "muscle pain"],
            ["cough", "fatigue", "weakness"],
            ["fever", "chills", "body aches"],
            ["headache", "fever", "sore throat"],
            ["cough", "body aches", "fatigue"],
            ["fever", "muscle pain", "weakness"]
        ]
    },
    "Upper Respiratory Infection": {
        "core_symptoms": ["cough", "sore throat", "fever", "congestion"],
        "common_symptoms": ["headache", "fatigue", "pain", "weakness", "body aches"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["fever", "cough", "sore throat"],
            ["cough", "congestion", "headache"],
            ["fever", "headache", "fatigue"],
            ["sore throat", "fever", "body aches"],
            ["cough", "pain", "weakness"]
        ]
    },

    # Mental Health
    "Depression": {
        "core_symptoms": ["persistent sadness", "loss of interest", "fatigue", "sleep problems"],
        "common_symptoms": ["mood swings", "anxiety", "restlessness", "loss of balance", "weakness"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["persistent sadness", "loss of interest", "fatigue"],
            ["sleep problems", "mood swings", "loss of interest"],
            ["fatigue", "anxiety", "persistent sadness"],
            ["loss of interest", "sleep problems", "restlessness"]
        ]
    },
    "Anxiety Disorder": {
        "core_symptoms": ["anxiety", "excessive worry", "restlessness", "panic attacks"],
        "common_symptoms": ["rapid heartbeat", "sleep problems", "fatigue", "muscle aches"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["anxiety", "excessive worry", "restlessness"],
            ["panic attacks", "rapid heartbeat", "anxiety"],
            ["restlessness", "sleep problems", "excessive worry"],
            ["anxiety", "fatigue", "rapid heartbeat"]
        ]
    },

    # Chronic Conditions
    "Diabetes": {
        "core_symptoms": ["increased thirst", "frequent urination", "fatigue"],
        "common_symptoms": ["weight loss", "blurred vision", "slow healing", "weakness"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["increased thirst", "frequent urination", "fatigue"],
            ["weight loss", "increased thirst", "blurred vision"],
            ["frequent urination", "fatigue", "weakness"],
            ["increased thirst", "weight loss", "fatigue"]
        ]
    },
    "Hypertension": {
        "core_symptoms": ["headache", "dizziness", "chest pain"],
        "common_symptoms": ["shortness of breath", "blurred vision", "fatigue", "nausea"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["headache", "dizziness", "chest pain"],
            ["shortness of breath", "headache", "fatigue"],
            ["chest pain", "dizziness", "blurred vision"],
            ["headache", "nausea", "dizziness"]
        ]
    },

    # Allergies
    "Allergies": {
        "core_symptoms": ["sneezing", "itchy eyes", "runny nose", "watery eyes"],
        "common_symptoms": ["congestion", "cough", "sore throat", "stuffy nose"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["sneezing", "itchy eyes", "runny nose"],
            ["watery eyes", "sneezing", "congestion"],
            ["runny nose", "itchy eyes", "sore throat"],
            ["sneezing", "stuffy nose", "watery eyes"]
        ]
    },

    "Asthma": {
        "core_symptoms": ["shortness of breath", "wheezing", "cough", "chest tightness"],
        "common_symptoms": ["difficulty breathing", "fatigue", "rapid heartbeat"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["shortness of breath", "wheezing", "cough"],
            ["chest tightness", "difficulty breathing", "wheezing"],
            ["cough", "shortness of breath", "chest tightness"],
            ["wheezing", "fatigue", "difficulty breathing"]
        ]
    },

    # Female-specific conditions
    "Menstrual Cramps (Dysmenorrhea)": {
        "core_symptoms": ["abdominal cramps", "pelvic pain", "lower abdominal pain"],
        "common_symptoms": ["back pain", "headache", "bloating", "breast tenderness", "nausea", "fatigue"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["abdominal cramps", "pelvic pain", "back pain"],
            ["severe pelvic pain", "bloating", "headache"],
            ["lower abdominal pain", "breast tenderness", "fatigue"],
            ["abdominal cramps", "back pain", "nausea"]
        ],
        "gender": "female"
    },
    "Endometriosis": {
        "core_symptoms": ["severe pelvic pain", "chronic pain", "painful periods"],
        "common_symptoms": ["pain during intercourse", "pain during bowel movements", "heavy bleeding", "fatigue"],
        "severity": ["high"],
        "typical_combinations": [
            ["severe pelvic pain", "painful periods", "chronic pain"],
            ["pelvic pain", "pain during intercourse", "heavy bleeding"],
            ["chronic pain", "pain during bowel movements", "fatigue"]
        ],
        "gender": "female"
    },
    "Polycystic Ovary Syndrome (PCOS)": {
        "core_symptoms": ["irregular periods", "acne", "weight gain"],
        "common_symptoms": ["facial hair growth", "hair loss", "oily skin", "difficulty losing weight"],
        "severity": ["medium"],
        "typical_combinations": [
            ["irregular periods", "acne", "weight gain"],
            ["facial hair growth", "irregular periods", "difficulty losing weight"],
            ["acne", "oily skin", "irregular periods"]
        ],
        "gender": "female"
    },

    # Infectious Diseases - Tropical/Vector-borne
    "Malaria": {
        "core_symptoms": ["fever", "chills", "headache", "sweating"],
        "common_symptoms": ["muscle aches", "fatigue", "nausea", "weakness", "body aches"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "chills", "headache"],
            ["fever", "sweating", "muscle aches"],
            ["chills", "headache", "fatigue"],
            ["fever", "chills", "body aches"]
        ]
    },
    "Dengue Fever": {
        "core_symptoms": ["fever", "severe headache", "pain", "muscle pain"],
        "common_symptoms": ["headache", "nausea", "body aches", "weakness", "fatigue"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "severe headache", "muscle pain"],
            ["fever", "pain", "headache"],
            ["severe headache", "body aches", "fever"],
            ["fever", "muscle pain", "weakness"]
        ]
    },
    "Zika Virus Disease": {
        "core_symptoms": ["fever", "headache", "pain"],
        "common_symptoms": ["muscle pain", "weakness", "fatigue", "nausea"],
        "severity": ["medium"],
        "typical_combinations": [
            ["fever", "headache", "pain"],
            ["fever", "muscle pain", "weakness"],
            ["headache", "pain", "fatigue"]
        ]
    },

    # Bacterial Infections - Severe
    "Tuberculosis": {
        "core_symptoms": ["persistent cough", "coughing blood", "night sweats", "weight loss"],
        "common_symptoms": ["fatigue", "weakness", "fever", "chest pain"],
        "severity": ["high"],
        "typical_combinations": [
            ["persistent cough", "night sweats", "weight loss"],
            ["coughing blood", "chest pain", "fatigue"],
            ["persistent cough", "fever", "night sweats"],
            ["coughing blood", "weakness", "weight loss"]
        ]
    },
    "Cholera": {
        "core_symptoms": ["diarrhea", "nausea", "weakness"],
        "common_symptoms": ["fatigue", "pain", "fever", "headache"],
        "severity": ["high"],
        "typical_combinations": [
            ["diarrhea", "weakness", "nausea"],
            ["nausea", "fatigue", "pain"],
            ["diarrhea", "fever", "weakness"]
        ]
    },
    "Typhoid Fever": {
        "core_symptoms": ["fever", "headache", "weakness", "abdominal pain"],
        "common_symptoms": ["fatigue", "nausea", "pain", "body aches"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "weakness"],
            ["fever", "abdominal pain", "fatigue"],
            ["headache", "weakness", "abdominal pain"]
        ]
    },
    "Rabies": {
        "core_symptoms": ["fever", "headache", "anxiety", "confusion"],
        "common_symptoms": ["weakness", "pain", "muscle aches", "fatigue"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "anxiety"],
            ["confusion", "fever", "weakness"],
            ["headache", "anxiety", "muscle aches"]
        ]
    },

    # Bacterial Infections - Moderate
    "Gonorrhoea": {
        "core_symptoms": ["painful urination", "discharge"],
        "common_symptoms": ["pain", "fever", "pelvic pain"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["painful urination", "discharge", "pain"],
            ["painful urination", "fever", "pelvic pain"]
        ]
    },
    "Sexually Transmitted Infections": {
        "core_symptoms": ["painful urination", "discharge", "pain"],
        "common_symptoms": ["fever", "pelvic pain", "sore throat", "swelling"],
        "severity": ["medium"],
        "typical_combinations": [
            ["painful urination", "discharge", "pain"],
            ["discharge", "pain", "fever"]
        ]
    },

    # Viral Infections
    "HIV": {
        "core_symptoms": ["fever", "fatigue", "weight loss", "night sweats"],
        "common_symptoms": ["weakness", "swollen lymph nodes", "muscle aches", "headache"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "fatigue", "night sweats"],
            ["weight loss", "weakness", "fever"],
            ["fever", "swollen lymph nodes", "muscle aches"]
        ]
    },
    "Hepatitis": {
        "core_symptoms": ["fatigue", "fever", "nausea", "abdominal pain"],
        "common_symptoms": ["weakness", "pain", "weight loss", "headache"],
        "severity": ["high"],
        "typical_combinations": [
            ["fatigue", "fever", "nausea"],
            ["abdominal pain", "weakness", "fatigue"],
            ["fever", "nausea", "pain"]
        ]
    },
    "Hepatitis A": {
        "core_symptoms": ["fever", "fatigue", "nausea", "abdominal pain"],
        "common_symptoms": ["weakness", "pain", "headache", "diarrhea"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "fatigue", "nausea"],
            ["abdominal pain", "weakness", "fever"],
            ["nausea", "fatigue", "headache"]
        ]
    },
    "Varicella-Zoster Virus": {
        "core_symptoms": ["fever", "headache", "pain", "skin changes"],
        "common_symptoms": ["fatigue", "weakness", "itchy eyes", "muscle aches"],
        "severity": ["medium"],
        "typical_combinations": [
            ["fever", "headache", "skin changes"],
            ["pain", "fever", "weakness"],
            ["headache", "pain", "fatigue"]
        ]
    },
    "Mumps": {
        "core_symptoms": ["fever", "headache", "swelling", "pain"],
        "common_symptoms": ["fatigue", "muscle aches", "weakness", "facial swelling"],
        "severity": ["medium"],
        "typical_combinations": [
            ["fever", "headache", "swelling"],
            ["fever", "pain", "facial swelling"],
            ["headache", "swelling", "muscle aches"]
        ]
    },

    # Gastrointestinal
    "Acid Reflux (GERD)": {
        "core_symptoms": ["chest pain", "pain", "nausea"],
        "common_symptoms": ["abdominal pain", "sore throat", "cough", "difficulty breathing"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["chest pain", "pain", "nausea"],
            ["abdominal pain", "sore throat", "cough"],
            ["chest pain", "nausea", "pain"]
        ]
    },
    "Constipation": {
        "core_symptoms": ["abdominal pain", "pain", "bloating"],
        "common_symptoms": ["nausea", "fatigue", "weakness"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["abdominal pain", "bloating", "pain"],
            ["pain", "nausea", "fatigue"]
        ]
    },
    "Shigellosis": {
        "core_symptoms": ["diarrhea", "abdominal pain", "fever"],
        "common_symptoms": ["nausea", "pain", "weakness", "fatigue"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["diarrhea", "abdominal pain", "fever"],
            ["fever", "pain", "nausea"],
            ["diarrhea", "fever", "weakness"]
        ]
    },

    # Cardiovascular
    "Stroke": {
        "core_symptoms": ["face drooping", "arm weakness", "speech difficulty", "sudden numbness"],
        "common_symptoms": ["headache", "vision problems", "confusion", "dizziness"],
        "severity": ["high"],
        "typical_combinations": [
            ["face drooping", "arm weakness", "speech difficulty"],
            ["sudden numbness", "confusion", "headache"],
            ["arm weakness", "vision problems", "dizziness"]
        ]
    },
    "Acute Rheumatic Fever": {
        "core_symptoms": ["fever", "pain", "swelling", "chest pain"],
        "common_symptoms": ["weakness", "fatigue", "muscle pain", "headache"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "pain", "swelling"],
            ["chest pain", "fever", "weakness"],
            ["pain", "swelling", "fatigue"]
        ]
    },

    # Metabolic/Chronic
    "Diabetes Mellitus": {
        "core_symptoms": ["increased thirst", "frequent urination", "fatigue"],
        "common_symptoms": ["weight loss", "blurred vision", "slow healing", "weakness"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["increased thirst", "frequent urination", "fatigue"],
            ["weight loss", "increased thirst", "blurred vision"],
            ["frequent urination", "fatigue", "weakness"]
        ]
    },

    # Cancers
    "Cancer": {
        "core_symptoms": ["fatigue", "weight loss", "pain"],
        "common_symptoms": ["weakness", "fever", "night sweats", "nausea"],
        "severity": ["high"],
        "typical_combinations": [
            ["fatigue", "weight loss", "pain"],
            ["weakness", "fever", "night sweats"],
            ["pain", "fatigue", "nausea"]
        ]
    },
    "Testicular Cancer": {
        "core_symptoms": ["testicular lump", "testicular pain", "swelling", "heaviness feeling"],
        "common_symptoms": ["groin pain", "back pain", "testicular enlargement", "palpable mass"],
        "severity": ["high"],
        "typical_combinations": [
            ["testicular lump", "testicular pain", "swelling"],
            ["testicular enlargement", "heaviness feeling", "groin pain"],
            ["testicular pain", "swelling", "back pain"]
        ],
        "gender": "male"
    },
    "Breast Cancer": {
        "core_symptoms": ["breast lump", "breast pain", "nipple discharge"],
        "common_symptoms": ["breast swelling", "skin changes", "nipple inversion", "hard mass"],
        "severity": ["high"],
        "typical_combinations": [
            ["breast lump", "breast pain", "skin changes"],
            ["nipple discharge", "breast swelling", "hard mass"],
            ["breast lump", "nipple inversion", "breast pain"]
        ],
        "gender": "female"
    },
    "Cervical Cancer": {
        "core_symptoms": ["abnormal bleeding", "pelvic pain", "vaginal discharge"],
        "common_symptoms": ["pain during intercourse", "post-coital bleeding", "back pain"],
        "severity": ["high"],
        "typical_combinations": [
            ["abnormal bleeding", "pelvic pain", "vaginal discharge"],
            ["pain during intercourse", "abnormal bleeding", "back pain"],
            ["pelvic pain", "post-coital bleeding", "vaginal discharge"]
        ],
        "gender": "female"
    },
    "Ovarian Cysts": {
        "core_symptoms": ["pelvic pain", "bloating", "abdominal swelling"],
        "common_symptoms": ["lower abdominal pain", "pressure sensation", "painful periods"],
        "severity": ["medium"],
        "typical_combinations": [
            ["pelvic pain", "bloating", "abdominal swelling"],
            ["lower abdominal pain", "pressure sensation", "pelvic pain"],
            ["bloating", "pelvic pain", "painful periods"]
        ],
        "gender": "female"
    },
    "Pregnancy Complications": {
        "core_symptoms": ["abdominal pain", "pelvic pain", "severe nausea"],
        "common_symptoms": ["headache", "swelling", "high blood pressure", "persistent vomiting"],
        "severity": ["high"],
        "typical_combinations": [
            ["abdominal pain", "severe nausea", "persistent vomiting"],
            ["pelvic pain", "headache", "high blood pressure"],
            ["severe nausea", "swelling", "headache"]
        ],
        "gender": "female"
    },

    # Parasitic/Other Infections
    "Lice": {
        "core_symptoms": ["itchy eyes", "scalp sensitivity", "pain"],
        "common_symptoms": ["headache", "fatigue", "skin changes"],
        "severity": ["low"],
        "typical_combinations": [
            ["itchy eyes", "scalp sensitivity", "pain"],
            ["scalp sensitivity", "headache", "skin changes"]
        ]
    },
    "Myiasis": {
        "core_symptoms": ["pain", "swelling", "skin changes"],
        "common_symptoms": ["fever", "weakness", "fatigue"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["pain", "swelling", "skin changes"],
            ["fever", "pain", "weakness"]
        ]
    },

    # Rare/Severe Infections
    "Anthrax": {
        "core_symptoms": ["fever", "chest pain", "shortness of breath", "cough"],
        "common_symptoms": ["weakness", "fatigue", "headache", "nausea"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "chest pain", "shortness of breath"],
            ["cough", "fever", "weakness"],
            ["chest pain", "shortness of breath", "fatigue"]
        ]
    },
    "Botulism": {
        "core_symptoms": ["weakness", "blurred vision", "dry mouth", "difficulty breathing"],
        "common_symptoms": ["dizziness", "fatigue", "nausea", "confusion"],
        "severity": ["high"],
        "typical_combinations": [
            ["weakness", "blurred vision", "dry mouth"],
            ["difficulty breathing", "weakness", "blurred vision"],
            ["dry mouth", "dizziness", "weakness"]
        ]
    },
    "Brucellosis": {
        "core_symptoms": ["fever", "muscle aches", "night sweats", "weakness"],
        "common_symptoms": ["headache", "fatigue", "back pain", "weight loss"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "muscle aches", "night sweats"],
            ["weakness", "fatigue", "headache"],
            ["fever", "back pain", "muscle aches"]
        ]
    },
    "Bartonellosis": {
        "core_symptoms": ["fever", "headache", "muscle aches", "fatigue"],
        "common_symptoms": ["weakness", "pain", "nausea", "bone pain"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "headache", "muscle aches"],
            ["fatigue", "weakness", "pain"],
            ["fever", "bone pain", "fatigue"]
        ]
    },
    "Histoplasmosis": {
        "core_symptoms": ["fever", "cough", "chest pain", "fatigue"],
        "common_symptoms": ["headache", "muscle aches", "chills", "shortness of breath"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "cough", "chest pain"],
            ["fatigue", "muscle aches", "fever"],
            ["cough", "shortness of breath", "chest pain"]
        ]
    },
    "Lassa Fever": {
        "core_symptoms": ["fever", "weakness", "headache", "sore throat"],
        "common_symptoms": ["chest pain", "nausea", "muscle aches", "abdominal pain"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "weakness", "headache"],
            ["sore throat", "chest pain", "fever"],
            ["headache", "muscle aches", "weakness"]
        ]
    },
    "Lujo": {
        "core_symptoms": ["fever", "headache", "weakness", "nausea"],
        "common_symptoms": ["diarrhea", "sore throat", "muscle aches", "chest pain"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "weakness"],
            ["nausea", "diarrhea", "fever"],
            ["weakness", "muscle aches", "headache"]
        ]
    },
    "Arbovirus": {
        "core_symptoms": ["fever", "headache", "muscle pain", "weakness"],
        "common_symptoms": ["nausea", "fatigue", "pain", "body aches"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "headache", "muscle pain"],
            ["weakness", "fatigue", "fever"],
            ["muscle pain", "body aches", "headache"]
        ]
    },
    "Sindbis Fever": {
        "core_symptoms": ["fever", "headache", "pain", "muscle aches"],
        "common_symptoms": ["weakness", "fatigue", "nausea"],
        "severity": ["medium"],
        "typical_combinations": [
            ["fever", "headache", "pain"],
            ["muscle aches", "weakness", "fever"],
            ["headache", "pain", "fatigue"]
        ]
    },
    "Crimean Congo Haemorrhagic Fever": {
        "core_symptoms": ["fever", "headache", "pain", "nausea"],
        "common_symptoms": ["weakness", "swelling", "muscle aches", "dizziness"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "pain"],
            ["nausea", "weakness", "fever"],
            ["pain", "swelling", "muscle aches"]
        ]
    },

    # Hospital/Drug-resistant
    "Staphylococcus Infection": {
        "core_symptoms": ["fever", "pain", "swelling", "skin changes"],
        "common_symptoms": ["weakness", "fatigue", "redness", "warmth"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "pain", "swelling"],
            ["skin changes", "redness", "pain"],
            ["fever", "weakness", "swelling"]
        ]
    },
    "Klebsiella Pneumoniae": {
        "core_symptoms": ["fever", "cough", "chest pain", "shortness of breath"],
        "common_symptoms": ["weakness", "fatigue", "chills", "muscle aches"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "cough", "chest pain"],
            ["shortness of breath", "fever", "weakness"],
            ["cough", "chills", "chest pain"]
        ]
    },
    "Enterococci": {
        "core_symptoms": ["fever", "pain", "weakness", "nausea"],
        "common_symptoms": ["abdominal pain", "fatigue", "headache"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "pain", "weakness"],
            ["nausea", "abdominal pain", "fever"],
            ["weakness", "fatigue", "pain"]
        ]
    },
    "Carbapenem Resistant Enterobacteriaceae (CRE)": {
        "core_symptoms": ["fever", "weakness", "pain", "fatigue"],
        "common_symptoms": ["nausea", "confusion", "shortness of breath"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "weakness", "pain"],
            ["fatigue", "nausea", "fever"],
            ["weakness", "confusion", "fever"]
        ]
    },
    "Hospital Infection Outbreaks": {
        "core_symptoms": ["fever", "pain", "weakness", "fatigue"],
        "common_symptoms": ["nausea", "confusion", "headache", "cough"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "pain", "weakness"],
            ["fatigue", "nausea", "fever"],
            ["weakness", "headache", "pain"]
        ]
    },
    "Haemophilus Influenzae Type B": {
        "core_symptoms": ["fever", "headache", "nausea", "weakness"],
        "common_symptoms": ["fatigue", "confusion", "pain", "swelling"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "nausea"],
            ["weakness", "fatigue", "fever"],
            ["headache", "confusion", "nausea"]
        ]
    },
    "Enteroviral Meningitis": {
        "core_symptoms": ["fever", "headache", "stiff neck", "nausea"],
        "common_symptoms": ["sensitivity to light", "confusion", "weakness", "fatigue"],
        "severity": ["high"],
        "typical_combinations": [
            ["fever", "headache", "nausea"],
            ["headache", "confusion", "weakness"],
            ["fever", "nausea", "fatigue"]
        ]
    },
    "Scarlet Fever": {
        "core_symptoms": ["fever", "sore throat", "headache", "skin changes"],
        "common_symptoms": ["nausea", "body aches", "chills", "swelling"],
        "severity": ["medium", "high"],
        "typical_combinations": [
            ["fever", "sore throat", "headache"],
            ["skin changes", "fever", "nausea"],
            ["sore throat", "body aches", "fever"]
        ]
    },

    # Male-specific conditions
    "Erectile Dysfunction": {
        "core_symptoms": ["difficulty maintaining erection", "trouble getting erection", "erectile dysfunction"],
        "common_symptoms": ["low libido", "reduced sexual desire", "inconsistent erections", "soft erections"],
        "severity": ["low", "medium"],
        "typical_combinations": [
            ["difficulty maintaining erection", "low libido", "reduced sexual desire"],
            ["trouble getting erection", "inconsistent erections", "anxiety"],
            ["erectile dysfunction", "reduced sexual desire", "fatigue"]
        ],
        "gender": "male"
    },
    "Prostate Cancer": {
        "core_symptoms": ["difficulty urinating", "weak urine stream", "frequent urination"],
        "common_symptoms": ["blood in urine", "painful urination", "pelvic pain", "back pain"],
        "severity": ["high"],
        "typical_combinations": [
            ["difficulty urinating", "weak urine stream", "frequent urination"],
            ["blood in urine", "painful urination", "pelvic pain"],
            ["frequent urination", "back pain", "weak urine stream"]
        ],
        "gender": "male"
    },
    "Male Pattern Baldness": {
        "core_symptoms": ["hair loss", "receding hairline", "crown baldness"],
        "common_symptoms": ["hair thinning", "hair shedding", "vertex baldness", "temporal recession"],
        "severity": ["low"],
        "typical_combinations": [
            ["hair loss", "receding hairline", "crown baldness"],
            ["hair thinning", "vertex baldness", "hair shedding"],
            ["receding hairline", "temporal recession", "crown baldness"]
        ],
        "gender": "male"
    }
}

def generate_realistic_combination(disease_name, pattern_info, gender=None):
    """Generate a realistic symptom combination for a disease"""
    core = pattern_info.get("core_symptoms", [])
    common = pattern_info.get("common_symptoms", [])
    severities = pattern_info.get("severity", ["medium"])
    typical = pattern_info.get("typical_combinations", [])

    # 60% use typical combinations, 40% generate new ones
    if typical and random.random() < 0.6:
        symptoms = random.choice(typical).copy()
    else:
        # Generate new combination
        num_core = random.randint(2, min(3, len(core)))
        num_common = random.randint(0, min(2, len(common)))

        symptoms = random.sample(core, num_core)
        if common and num_common > 0:
            symptoms.extend(random.sample(common, num_common))

    # Pad to 6 symptoms
    while len(symptoms) < 6:
        symptoms.append("")

    # Generate age based on disease
    if "pattern baldness" in disease_name.lower():
        age = random.randint(30, 65)
    elif "menstrual" in disease_name.lower() or "endometriosis" in disease_name.lower():
        age = random.randint(18, 45)
    elif "prostate" in disease_name.lower():
        age = random.randint(50, 65)
    else:
        age = random.randint(18, 65)

    severity = random.choice(severities)

    return {
        "age": age,
        "symptom1": symptoms[0],
        "symptom2": symptoms[1],
        "symptom3": symptoms[2],
        "symptom4": symptoms[3],
        "symptom5": symptoms[4],
        "symptom6": symptoms[5],
        "disease": disease_name,
        "severity": severity,
        "gender_specific": gender or "male"
    }

def augment_dataset(input_file, output_file, target_samples_per_disease=500):
    """Augment the medical training dataset"""
    print(f"Loading dataset from {input_file}...")
    df = pd.read_csv(input_file, delimiter=';', encoding='utf-8-sig')

    # Determine gender from filename
    if "female" in input_file.lower():
        default_gender = "female"
    else:
        default_gender = "male"

    print(f"Original dataset: {len(df)} rows, {df['disease'].nunique()} diseases")
    print(f"Target: {target_samples_per_disease} samples per disease")

    # Get disease counts
    disease_counts = df['disease'].value_counts()

    augmented_rows = []

    for disease in disease_counts.index:
        current_count = disease_counts[disease]
        needed = max(0, target_samples_per_disease - current_count)

        print(f"\n{disease}: {current_count} -> {target_samples_per_disease} (adding {needed})")

        if disease in DISEASE_SYMPTOM_PATTERNS:
            pattern = DISEASE_SYMPTOM_PATTERNS[disease]

            # Check gender compatibility
            pattern_gender = pattern.get("gender", default_gender)
            if pattern_gender != default_gender:
                print(f"  Skipping - gender mismatch")
                continue

            # Generate augmented samples
            for i in range(needed):
                new_row = generate_realistic_combination(disease, pattern, default_gender)
                augmented_rows.append(new_row)
        else:
            print(f"  WARNING: No pattern defined - using original data only")

    # Combine original and augmented data
    augmented_df = pd.DataFrame(augmented_rows)
    combined_df = pd.concat([df, augmented_df], ignore_index=True)

    # NORMALIZE ALL TEXT TO LOWERCASE
    print(f"\nNormalizing all text to lowercase...")
    symptom_cols = ['symptom1', 'symptom2', 'symptom3', 'symptom4', 'symptom5', 'symptom6']
    for col in symptom_cols:
        combined_df[col] = combined_df[col].fillna('').str.lower().str.strip()
    combined_df['severity'] = combined_df['severity'].str.lower().str.strip()
    combined_df['gender_specific'] = combined_df['gender_specific'].str.lower().str.strip()
    print(f"Text normalization complete")

    # Shuffle the dataset
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"\n{'='*70}")
    print(f"Augmentation Complete!")
    print(f"{'='*70}")
    print(f"Original: {len(df)} rows")
    print(f"Added: {len(augmented_rows)} rows")
    print(f"Final: {len(combined_df)} rows")
    print(f"Diseases: {combined_df['disease'].nunique()}")

    # Save augmented dataset
    combined_df.to_csv(output_file, sep=';', index=False, encoding='utf-8-sig')
    print(f"\nSaved to: {output_file}")

    # Show sample statistics
    print(f"\nSamples per disease (first 10):")
    disease_counts_final = combined_df['disease'].value_counts()
    for disease, count in disease_counts_final.head(10).items():
        print(f"  {disease}: {count}")

    return combined_df

def main():
    print("="*70)
    print("MEDICAL DATA AUGMENTATION SCRIPT")
    print("="*70)

    # Augment male dataset
    print("\n\nAUGMENTING MALE DATASET")
    print("="*70)
    augment_dataset(
        input_file="medical_training_dataset_male.csv",
        output_file="medical_training_dataset_male_augmented.csv",
        target_samples_per_disease=500
    )

    # Augment female dataset
    print("\n\nAUGMENTING FEMALE DATASET")
    print("="*70)
    augment_dataset(
        input_file="medical_training_dataset_female.csv",
        output_file="medical_training_dataset_female_augmented.csv",
        target_samples_per_disease=500
    )

    print("\n" + "="*70)
    print("SUCCESS: Data augmentation completed!")
    print("="*70)
    print("\nNext steps:")
    print("1. Review the augmented datasets")
    print("2. Retrain models with augmented data")
    print("3. Test improved accuracy")

if __name__ == "__main__":
    main()