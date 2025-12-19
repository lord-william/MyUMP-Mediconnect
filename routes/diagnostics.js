const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post('/store', async (req, res) => {
  try {
    const { user_id, symptoms, severity, age, gender, diagnosis } = req.body;
    
    console.log("📥 Incoming payload:", req.body);

    // Validate required fields
    if (!user_id || !symptoms || !severity || !age || !gender || !diagnosis) {
      return res.status(400).json({ 
        error: "Validation Failed", 
        message: "Missing required fields",
        received: { user_id, symptoms, severity, age, gender, hasdiagnosis: !!diagnosis }
      });
    }

    // Ensure symptoms is a string
    const symptomsString = Array.isArray(symptoms) ? symptoms.join(", ") : symptoms;

    // Ensure diagnosis is a string (it might be JSON stringified already)
    const diagnosisString = typeof diagnosis === 'string' 
      ? diagnosis 
      : JSON.stringify(diagnosis);

    const { data, error } = await supabase
      .from('diagnosis_records')
      .insert({
        user_id: user_id,
        symptoms: symptomsString.trim(),
        severity: severity.toString().toLowerCase(),
        age: parseInt(age),
        gender: gender.trim(),
        diagnosis: diagnosisString,
      })
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to save diagnosis record',
        message: error.message,
        details: error
      });
    }
    
    console.log('✅ Successfully saved:', data[0]);
    
    res.status(201).json({ 
      success: true,
      message: 'Diagnosis record saved successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;