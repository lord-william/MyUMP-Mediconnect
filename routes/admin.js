const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch all users from Supabase Auth
router.get('/users', async (req, res) => {
  try {
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
    console.log("SERVICE_ROLE_KEY exists?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("Supabase listUsers error:", error);
      return res.status(500).json({ message: error.message });
    }
    return res.status(200).json({ success: true, inserted: data });
  } catch (error) {
    console.error("Catch block error:", error);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Change user role
router.post('/role', async (req, res) => {
  const { email, newRole } = req.body;
  try {
    // Find user by email
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = listData.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { role: newRole }
    });
    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update user status
router.post('/status', async (req, res) => {
  const { email, newStatus } = req.body;
  try {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = listData.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { status: newStatus }
    });
    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post("/add-user", async (req, res) => {
    const { name, email, role } = req.body;

    // Server-side email validation
    if (!email.endsWith("@ump.ac.za")) {
        return res.status(400).json({ error: "Only ump.ac.za emails allowed" });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: "Medi@2025",
        email_confirm: true,
        user_metadata: { name, role, status: 'active' }
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "User created successfully", user: data.user });
});

router.delete('/delete', async (req, res) => {
  const { email} = req.body;
  try {
    // Find user by email
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = listData.users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { error: updateError } = await supabase.auth.admin.deleteUser(user.id);
    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
