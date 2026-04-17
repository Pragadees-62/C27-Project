const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');

dotenv.config();

// DynamoDB connection is initialized in config/db.js (imported by models)
require('./config/db');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', require('./routes/apiRoutes'));

// ── Fallback: serve index.html only for extensionless SPA routes ─────────────
app.get(/^(?!\/api)(?!.*\.\w+$).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  EduPrime SMS Server → http://localhost:${PORT}`);
});
