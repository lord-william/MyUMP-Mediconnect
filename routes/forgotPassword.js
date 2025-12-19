// routes/user.js
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // keep safe, only in backend
);

router.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5000/resetPassword.html", // your reset page
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resetPassword", async (req, res) => {
  const { access_token, newPassword } = req.body;

  if (!access_token || !newPassword) {
    return res.status(400).json({ error: "Missing token or password" });
  }

  try {
    // Authenticate the user session with the token Supabase gave in the email link
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: access_token, // Supabase uses same token for reset flow
    });

    if (sessionError) {
      return res.status(400).json({ error: sessionError.message });
    }

    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
