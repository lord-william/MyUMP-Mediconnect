// index.js

// 1. Import the application from app.js
const app = require('./app'); 

// 2. Import necessary startup modules
require('dotenv').config();
const { spawn, exec } = require('child_process');
const path = require('path');

// 3. Define the port
const PORT = process.env.PORT || 5000;

// 4. Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // --- Python Script Logic (moved from original server.js) ---
  const pathToPython = process.platform === 'win32' ? 'python' : 'python3';

  const pythonProcess = spawn(pathToPython, ['gender_diagnosis_api.py'], {
    cwd: path.join(__dirname, 'model'), // make sure this is where your script is
    stdio: 'inherit'
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python process:', err);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
  // ------------------------------------------------------------

  // Open browser after server starts
  const url = `http://localhost:${PORT}`;
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} ${url}`);
});
