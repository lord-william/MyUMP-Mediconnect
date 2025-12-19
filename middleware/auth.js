// middleware/auth.js
const { createClient } = require("@supabase/supabase-js");

const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const requireAuth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];

      const { data: userData, error: verifyError } = await supabaseService.auth.getUser(token);

      if (verifyError || !userData?.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const role = userData.user.user_metadata?.role || "user";

      req.user = {
        id: userData.user.id,
        email: userData.user.email,
        role,
      };

      if (roles.length && !roles.includes(role)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }

      next();
    } catch (err) {
      console.error("Auth middleware error:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  };
};

module.exports = requireAuth;
