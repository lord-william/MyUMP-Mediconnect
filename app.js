const express = require('express'); 
const cors = require('cors'); 
require('dotenv').config();
const path = require('path');

// --- Route Imports (Keep all of these) ---
const authRoutes = require('./routes/auth');
const add_stockRoutes = require('./routes/add_stock');
const adminRoutes = require('./routes/admin');
const appointmentsRoutes = require('./routes/appointments');
const clinicRoutes = require('./routes/clinic');
const stu_tipsRoutes = require('./routes/stu_tips');
const inventoryRoutes = require('./routes/inventory');
const historyRoutes = require('./routes/history');
const reportRoutes = require('./routes/reportAnalytics');
const addTipRoutes = require('./routes/add_tip');
const studentRoutes = require('./routes/student');
const bookRoutes = require('./routes/book');
const settingsRoutes = require('./routes/settings');  
const resetPasswordRoutes = require('./routes/forgotPassword');
const requireAuth = require('./middleware/auth');
const diagnosticsRoutes = require('./routes/diagnostics');
// ------------------------------------------

const app = express();

// Updated path to point to your HTML files location
const PUBLIC_DIR = path.join(__dirname, 'public');

// Serve static frontend files
app.use(express.static(PUBLIC_DIR));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'landing.html'));
});

// --- Route Mounting ---
app.use('/auth', authRoutes);
app.use('/user', resetPasswordRoutes);
app.use('/add_stock', requireAuth(['admin', 'staff']), add_stockRoutes);
app.use('/admin', requireAuth(['admin']), adminRoutes);
app.use('/appointments', requireAuth(['admin', 'staff']), appointmentsRoutes);
app.use('/clinic', requireAuth(['admin', 'staff']), clinicRoutes);
app.use('/student/health', requireAuth(['admin', 'student']), stu_tipsRoutes);
app.use('/inventory', requireAuth(['admin', 'staff']), inventoryRoutes);
app.use('/history', requireAuth(['admin', 'student']), historyRoutes);
app.use('/api/profile', requireAuth(['staff','admin', 'student']), settingsRoutes);
app.use('/report', requireAuth(['admin', 'staff']), reportRoutes);
app.use('/api', requireAuth(['admin', 'staff']), addTipRoutes);
app.use('/student', requireAuth(['admin', 'staff', 'student']), studentRoutes);
app.use('/book', requireAuth(['admin', 'student']), bookRoutes);
app.use('/diagnostics', diagnosticsRoutes);

// 404 handler
app.use((req, res) => {
  const notFoundPath = path.join(PUBLIC_DIR, '404.html');
  res.status(404).sendFile(notFoundPath, (err) => {
    if (err) res.status(404).send('Page not found');
  });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const errorPath = path.join(PUBLIC_DIR, '500.html');
  res.status(500).sendFile(errorPath, (sendErr) => {
    if (sendErr) res.status(500).send('Internal server error');
  });
});

// --- CRITICAL CHANGE ---
// Export the application instance so it can be used by index.js (for running) 
// and app.test.js (for testing with Supertest).
module.exports = app;
