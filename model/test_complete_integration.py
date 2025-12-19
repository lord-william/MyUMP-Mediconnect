#!/usr/bin/env python3
"""
Test complete frontend -> backend -> AI integration
"""
import requests
import json

def test_ai_service_directly():
    """Test the AI service directly"""
    print("="*60)
    print("TESTING AI SERVICE DIRECTLY")
    print("="*60)
    
    try:
        # Test data that matches frontend form
        test_data = {
            "user_id": "test_user_123",
            "symptoms": "fever, cough, fatigue, headache",
            "severity": "medium",
            "age": 25,
            "gender": "both"
        }
        
        print(f"Sending request to AI service...")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:5001/ai/diagnose",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ AI Service Response (Status: {response.status_code}):")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"\n❌ AI Service Error (Status: {response.status_code}):")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to AI service at http://localhost:5001")
        print("Make sure to start the AI service first:")
        print("python start_ai_server.py")
        return False
    except Exception as e:
        print(f"\n❌ Error testing AI service: {e}")
        return False

def test_backend_integration():
    """Test the backend integration"""
    print("\n" + "="*60)
    print("TESTING BACKEND INTEGRATION")
    print("="*60)
    
    try:
        # Test data that matches what frontend sends to backend
        test_data = {
            "user_id": "test_user_456",
            "symptoms": "chest pain, shortness of breath, dizziness",
            "duration": "1-3-days",
            "severity": "high",
            "age": 45,
            "gender": "male",
            "additional_info": "Test from integration script"
        }
        
        print(f"Sending request to backend...")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(
            "http://localhost:5000/diagnostics/analyze",
            json=test_data,
            timeout=60,
            headers={
                "Content-Type": "application/json",
                # Note: In real usage, you'd need an auth token here
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Backend Response (Status: {response.status_code}):")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"\n❌ Backend Error (Status: {response.status_code}):")
            print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend at http://localhost:5000")
        print("Make sure to start your Node.js backend first")
        return False
    except Exception as e:
        print(f"\n❌ Error testing backend: {e}")
        return False

def test_health_endpoints():
    """Test health check endpoints"""
    print("\n" + "="*60)
    print("TESTING HEALTH ENDPOINTS")
    print("="*60)
    
    # Test AI service health
    try:
        response = requests.get("http://localhost:5001/health", timeout=10)
        if response.status_code == 200:
            print("✅ AI Service Health: OK")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ AI Service Health: Error {response.status_code}")
    except:
        print("❌ AI Service Health: Not responding")
    
    # Test backend health  
    try:
        response = requests.get("http://localhost:5000/diagnostics/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend Health: OK")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Backend Health: Error {response.status_code}")
    except:
        print("❌ Backend Health: Not responding")

def main():
    """Run all integration tests"""
    print("MEDICONNECT AI INTEGRATION TESTS")
    print("="*60)
    
    ai_ok = test_ai_service_directly()
    backend_ok = test_backend_integration()
    
    test_health_endpoints()
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if ai_ok and backend_ok:
        print("🎉 ALL TESTS PASSED!")
        print("✅ AI Service: Working")
        print("✅ Backend Integration: Working")
        print("✅ Complete Flow: Frontend -> Backend -> AI -> Response")
        print("\nYour MediConnect AI diagnosis system is ready!")
    elif ai_ok:
        print("⚠️  PARTIAL SUCCESS")
        print("✅ AI Service: Working")
        print("❌ Backend Integration: Failed")
        print("\nFix the backend connection and try again.")
    else:
        print("❌ TESTS FAILED")
        print("❌ AI Service: Not working")
        if not backend_ok:
            print("❌ Backend Integration: Not working")
        print("\nStart the AI service first, then try again.")
    
    print("\n" + "="*60)
    print("SETUP INSTRUCTIONS")
    print("="*60)
    print("1. Start AI Service:")
    print("   cd 'AI train'")
    print("   python start_ai_server.py")
    print("\n2. Start Backend:")
    print("   cd backend")
    print("   npm start (or node server.js)")
    print("\n3. Open Frontend:")
    print("   Open diagnosis.html in browser")
    print("   Fill out the form and test!")

if __name__ == "__main__":
    main()