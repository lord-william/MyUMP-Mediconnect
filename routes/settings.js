const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseService = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Change password
router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!userEmail) {
    return res.status(400).json({ error: "User email not found" });
  }

  try {
    console.log(`[Password Change] Starting password change for user ${userId} (${userEmail})`);
    
    // Step 1: Verify the old password by attempting to sign in with it
    console.log('[Password Change] Verifying old password...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: userEmail,
      password: oldPassword
    });

    // Check if sign-in failed
    if (signInError) {
      console.log('[Password Change] ❌ Password verification FAILED:', signInError.message);
      return res.status(401).json({ 
        error: "Current password is incorrect",
        message: "The current password you entered is wrong. Please try again." 
      });
    }

    // Verify the user ID matches
    if (!signInData.user || signInData.user.id !== userId) {
      console.log('[Password Change] ❌ User ID mismatch during password verification');
      return res.status(401).json({ 
        error: "Current password is incorrect",
        message: "Authentication failed. Please try again." 
      });
    }

    console.log('[Password Change] ✅ Old password verified successfully');

    // Step 2: Old password verified successfully, now update to the new password
    console.log('[Password Change] Updating to new password...');
    const { error: updateError } = await supabaseService.auth.admin.updateUserById(userId, { 
      password: newPassword 
    });
    
    if (updateError) {
      console.error('[Password Change] ❌ Password update error:', updateError);
      return res.status(400).json({ 
        error: updateError.message || "Failed to update password" 
      });
    }
    
    console.log(`[Password Change] ✅ Password successfully changed for user ${userId}`);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error('[Password Change] ❌ Unexpected error:', err);
    res.status(500).json({ error: "Server error updating password" });
  }
});

module.exports = router;
