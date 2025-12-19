const express = require("express");
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Signup route
router.post('/signup', async (req, res) => {
    const {email, password, name} = req.body;
    if(!email || !password || !name){
        return res.status(400).json({ error: 'All fields are required'});
    }
    try{
        const {data, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {name, 
                    role: 'student', 
                    status: 'active'
                },
                emailRedirectTo: "http://localhost:5000/login.html"
            }    
        });
        if (error){
            return res.status(400).json({error: error.message});
        }
        res.json({
            message: 'User registered successfully',
            user: data.user
        });
    }
    catch (error){
        console.error('Signup error: ', error);
        res.status(500).json({error: 'server error'});
    }
});

// Login route - only return token for security
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Only return token - let backend handle role-based routing
    res.json({
      message: 'Login successful',
      token: data.session?.access_token || null
    });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Secure redirect route with proper session management
router.get('/redirect', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send("No token provided");

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).send("Invalid or expired token");
    }

    const role = data.user.user_metadata?.role || 'student';
    const status = data.user.user_metadata?.status;

    if (status !== 'active') {
      return res.redirect('/account-deactivated.html');
    }

    // Create session data that frontend can access
    const sessionData = {
      user_id: data.user.id,
      user_email: data.user.email,
      user_role: role,
      supabase_token: token
    };

    // Redirect with session data injection
    let dashboardFile;
    if (role === 'staff') {
      dashboardFile = 'clinicDashboard.html';
    } else if (role === 'student') {
      dashboardFile = 'studentDashboard.html';
    } else if (role === 'admin') {
      dashboardFile = 'admin.html';
    } else {
      return res.status(403).send("Unknown role: access denied");
    }

    // Send HTML with session data and history management
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
        <script>
          // Set session data securely
          const sessionData = ${JSON.stringify(sessionData)};
          Object.keys(sessionData).forEach(key => {
            sessionStorage.setItem(key, sessionData[key]);
          });
          
          // Replace history to prevent back button issues
          window.location.replace('/${dashboardFile}');
        </script>
      </head>
      <body>
        <p>Redirecting to dashboard...</p>
      </body>
      </html>
    `);

  } catch (err) {
    console.error('Redirect error', err);
    res.status(500).send("Server error");
  }
});

// Token verification endpoint for frontend
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ valid: false });
    }

    res.json({ 
      valid: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role || 'student'
      }
    });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ valid: false });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      // Optionally invalidate token on Supabase side
      await supabase.auth.admin.signOut(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;