// routes/addTipRoutes.js
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET all health tips
router.get("/load", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("healthy_tips")
      .select("*")
      .order("date", { ascending: false });

    if (error) throw error;

    console.log("GET /api/load called");
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error loading tips" });
  }
});

// DELETE a tip by ID
router.delete("/del/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("healthy_tips")
      .delete()
      .eq("id", id);
    
    console.log("DELETE /api/del called");
    if (error) throw error;

    return res.status(200).json({ message: "Tip deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error deleting tip" });
  }
});

// UPDATE a tip by ID
router.put("/updatetip/:id", async (req, res) => {
  const { id } = req.params;
  const { title, category, message, date } = req.body;

  if (!title || !category || !message || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const { error } = await supabase
      .from("healthy_tips")
      .update({ title, category, message, date })
      .eq("id", id);

    if (error) throw error;

    return res.status(200).json({ message: "Tip updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating tip" });
  }
});

// ADD a new tip
router.post("/addtip/", async (req, res) => {
  const { title, category, message, date } = req.body;

  if (!title || !category || !message || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const { error } = await supabase
      .from("healthy_tips")
      .insert([{ title, category, message, date }]);

    if (error) throw error;

    return res.status(201).json({ message: "Tip added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error adding tip" });
  }
});

module.exports = router;
