const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('item_name, quantity, stock_limit, expiry_date')
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(400).json({ error: 'Error fetching low stock' });
    }

    return res.json({ lowStock: data || [] });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
