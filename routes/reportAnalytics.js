const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Appointments
router.get('/appointments', async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('user_name, date, time, status, symptoms');

    if (error) {
      return res.status(400).json({ error: 'Error fetching appointments' });
    }

    res.json({ data: appointments });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Inventory
router.get('/inventory', async (req, res) => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('item_name, quantity, stock_limit, expiry_date, category, created_at');

    if (error) {
      return res.status(400).json({ error: 'Error fetching inventory' });
    }

    res.json({ data: inventory });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Diagnosis
router.get('/diagnosis', async (req, res) => {
  try {
    const { data: diagnosis, error } = await supabase
      .from('diagnosis_records')
      .select('diagnosis');

    if (error) {
      return res.status(400).json({ error: 'Error fetching diagnosis' });
    }

    res.json({ data: diagnosis });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
