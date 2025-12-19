#!/usr/bin/env python3
"""
Test the specific fever, cough, headache combination that was failing
"""
from gender_ai_service import GenderMediConnectAI

print("Testing fever, cough, headache combination...")
print("="*70)

ai = GenderMediConnectAI()

# Test the exact combination that was predicting Male Pattern Baldness
result = ai.predict_disease(
    age=22,
    symptoms="fever, cough, headache",
    severity="low",
    gender="male"
)

print(f"\nPrediction: {result['top_disease']}")
print(f"Confidence: {result['confidence']}")
print(f"Urgency: {result['urgency']}")
print(f"\nTop 5 Possible Conditions:")
for i, condition in enumerate(result['possible_conditions'], 1):
    print(f"{i}. {condition['condition']}: {condition['confidence']}")

print("\n" + "="*70)
if result['top_disease'] in ['Common Cold', 'Influenza', 'Upper Respiratory Infection']:
    print("SUCCESS: Correct prediction!")
else:
    print(f"WARNING: Predicted {result['top_disease']} instead of respiratory illness")