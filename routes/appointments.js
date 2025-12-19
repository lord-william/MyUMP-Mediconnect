// routes/appointments.js
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET all appointments
router.get("/list", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*");

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error fetching appointments" });
    }

    return res.status(200).json({ success: true, appointments: data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// UPDATE appointment status
router.post("/status", async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: "ID and status are required" });
  }

  try {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating status" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
