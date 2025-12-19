
// Example: Integrating AI diagnosis with your existing backend
// Add this to your backend's diagnosis route

const express = require('express');
const axios = require('axios');

// AI Diagnosis endpoint
app.post('/diagnostics/analyze', authenticateToken, async (req, res) => {
  try {
    const { user_id, symptoms, severity, age, gender, additional_info } = req.body;
    
    // Validate input
    if (!symptoms || !severity || !age || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Call AI service
    const aiResponse = await axios.post('http://localhost:5001/ai/diagnose', {
      user_id: user_id,
      symptoms: symptoms,
      severity: severity,
      age: parseInt(age),
      gender: gender,
      additional_info: additional_info
    }, {
      timeout: 30000  // 30 second timeout
    });
    
    // Add timestamp and request ID
    const diagnosis = aiResponse.data;
    diagnosis.timestamp = new Date().toISOString();
    diagnosis.request_id = generateRequestId();
    
    // Log the diagnosis (optional)
    console.log(`Diagnosis completed for user ${user_id}: ${diagnosis.diagnosis?.top_disease}`);
    
    // Return to frontend
    res.json(diagnosis);
    
  } catch (error) {
    console.error('AI diagnosis error:', error.message);
    
    // Return fallback response
    res.json({
      success: false,
      diagnosis: {
        primary_diagnosis: 'AI diagnosis service is currently unavailable.',
        recommendations: [
          'Please consult a healthcare professional',
          'Monitor your symptoms closely',
          'Seek immediate medical attention if symptoms worsen'
        ],
        disclaimer: 'AI service temporarily unavailable. Please seek professional medical advice.'
      }
    });
  }
});

function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
