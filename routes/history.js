const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/appointments', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  const token = authHeader.replace("Bearer ", "");

  // Get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }

  try {
    // Fetch appointments for logged in user
    const { data, error } = await supabase
      .from('appointments')
      .select('date, time, symptoms, diagnosis')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Error fetching appointments' });
    }

    res.json({ appointments: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
