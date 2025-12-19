#!/usr/bin/env python3
"""
Check what symptoms are recognized by the model
"""
import json

# Load male model info
with open('male_model_info.json', 'r') as f:
    male_info = json.load(f)

# Load female model info  
with open('female_model_info.json', 'r') as f:
    female_info = json.load(f)

print("="*70)
print("CHECKING MODEL SYMPTOMS")
print("="*70)

# Common influenza symptoms that users might input
user_inputs = [
    "fever", "cough", "sore throat", "body aches", "fatigue",
    "headache", "chills", "muscle aches", "runny nose", "congestion",
    "sneezing", "weakness", "nausea", "dizziness"
]

print("\n1. CHECKING MALE MODEL SYMPTOMS")
print("-" * 70)
print(f"Total symptoms in male model: {len(male_info['symptoms'])}")

print("\nChecking common influenza symptoms:")
for symptom in user_inputs:
    if symptom in male_info['symptoms']:
        print(f"  ✅ '{symptom}' - FOUND")
    else:
        # Check for case variations
        found_variations = [s for s in male_info['symptoms'] if s.lower() == symptom.lower()]
        if found_variations:
            print(f"  ⚠️  '{symptom}' - Found as: {found_variations[0]}")
        else:
            # Check for similar
            similar = [s for s in male_info['symptoms'] if symptom in s.lower() or s.lower() in symptom]
            if similar:
                print(f"  ⚠️  '{symptom}' - Similar: {similar[:3]}")
            else:
                print(f"  ❌ '{symptom}' - NOT FOUND")

print("\n\n2. CHECKING FEMALE MODEL SYMPTOMS")
print("-" * 70)
print(f"Total symptoms in female model: {len(female_info['symptoms'])}")

print("\nChecking common influenza symptoms:")
for symptom in user_inputs:
    if symptom in female_info['symptoms']:
        print(f"  ✅ '{symptom}' - FOUND")
    else:
        # Check for case variations
        found_variations = [s for s in female_info['symptoms'] if s.lower() == symptom.lower()]
        if found_variations:
            print(f"  ⚠️  '{symptom}' - Found as: {found_variations[0]}")
        else:
            # Check for similar
            similar = [s for s in female_info['symptoms'] if symptom in s.lower() or s.lower() in symptom]
            if similar:
                print(f"  ⚠️  '{symptom}' - Similar: {similar[:3]}")
            else:
                print(f"  ❌ '{symptom}' - NOT FOUND")

print("\n\n3. ACTUAL INFLUENZA-RELATED SYMPTOMS IN MODELS")
print("-" * 70)
influenza_symptoms_male = [s for s in male_info['symptoms'] if any(keyword in s.lower() for keyword in ['fever', 'cough', 'ache', 'throat', 'chills', 'congestion'])]
print(f"\nMale model - Flu-related symptoms ({len(influenza_symptoms_male)}):")
for s in sorted(influenza_symptoms_male):
    print(f"  • {s}")

print("\n" + "="*70)
print("RECOMMENDATIONS FOR ACCURATE INFLUENZA DIAGNOSIS")
print("="*70)
print("\nUse these exact symptom combinations:")
print("  • fever, cough, body aches, fatigue")
print("  • fever, sore throat, muscle aches, headache")  
print("  • fever, chills, body aches, weakness")
print("  • cough, headache, fatigue, sore throat")
