const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware: make sure req.user.id is set (from your auth middleware/JWT)
router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id; // injected from your auth middleware

  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  try {
    // ✅ Optional: verify the old password using anon client
    const { error: verifyError } = await supabaseAnon.auth.signInWithPassword({
      email: req.user.email, // user email must be available in req.user
      password: oldPassword,
    });

    if (verifyError) {
      return res.status(401).json({
        success: false,
        error: "Invalid current password",
      });
    }

    // ✅ Update password with service key
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      return res.status(400).json({ success: false, error: updateError.message });
    }

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error while updating password",
    });
  }
});

module.exports = router;

