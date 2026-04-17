const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const path      = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', require('./routes/apiRoutes'));

// ── Fallback: serve index.html only for extensionless SPA routes ─────────────
// express.static already handles /teacher.html, /student.html, /style.css etc.
// This fallback only fires for routes like /dashboard, /profile (no extension)
app.get(/^(?!\/api)(?!.*\.\w+$).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅  SMS Server running → http://localhost:${PORT}`);
});
