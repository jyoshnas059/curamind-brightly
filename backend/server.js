// ─────────────────────────────────────────────
//  CuraMind Backend  ·  server.js
//  Stack: Node.js + Express + lowdb (pure JS, no Python/C++ needed)
//  Run:   node server.js
// ─────────────────────────────────────────────

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'curamind-secret-change-in-production';

// ── SIMPLE JSON DATABASE (no Python/C++ needed) ──
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database file if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const empty = {
      users: [],
      health_data: [],
      mood_logs: [],
      symptom_logs: [],
      sleep_logs: [],
      medications: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function newId(collection) {
  if (!collection.length) return 1;
  return Math.max(...collection.map(r => r.id)) + 1;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function now() {
  return new Date().toISOString();
}

initDB();

// ── MIDDLEWARE ───────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'null'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── AUTH ROUTES ──────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = readDB();
  const exists = db.users.find(u => u.email === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: newId(db.users),
    name,
    email: email.toLowerCase(),
    password: hashed,
    created_at: now()
  };
  db.users.push(user);
  writeDB(db);

  const token = jwt.sign({ id: user.id, name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name, email: user.email } });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const db = readDB();
  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

// GET /api/auth/me
app.get('/api/auth/me', auth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, created_at: user.created_at });
});

// ── HEALTH ROUTES ────────────────────────────

// GET /api/health
app.get('/api/health', auth, (req, res) => {
  const db = readDB();
  const rows = db.health_data
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(rows[0] || {});
});

// GET /api/health/history
app.get('/api/health/history', auth, (req, res) => {
  const db = readDB();
  const rows = db.health_data
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);
  res.json(rows);
});

// POST /api/health
app.post('/api/health', auth, (req, res) => {
  const { heart_rate, hydration, calories, steps, bmi, weight } = req.body;
  const db = readDB();
  const entry = {
    id: newId(db.health_data),
    user_id: req.user.id,
    date: today(),
    heart_rate: heart_rate || null,
    hydration: hydration || null,
    calories: calories || null,
    steps: steps || null,
    bmi: bmi || null,
    weight: weight || null,
    created_at: now()
  };
  db.health_data.push(entry);
  writeDB(db);
  res.json({ id: entry.id, message: 'Health data saved' });
});

// ── MOOD ROUTES ──────────────────────────────

// GET /api/mood
app.get('/api/mood', auth, (req, res) => {
  const db = readDB();
  const rows = db.mood_logs
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 30);
  res.json(rows);
});

// POST /api/mood
app.post('/api/mood', auth, (req, res) => {
  const { mood, note } = req.body;
  if (!mood) return res.status(400).json({ error: 'Mood required' });
  const db = readDB();
  const entry = {
    id: newId(db.mood_logs),
    user_id: req.user.id,
    mood,
    note: note || null,
    date: today(),
    created_at: now()
  };
  db.mood_logs.push(entry);
  writeDB(db);
  res.json({ id: entry.id, message: 'Mood logged' });
});

// ── SYMPTOM ROUTES ───────────────────────────

// GET /api/symptoms
app.get('/api/symptoms', auth, (req, res) => {
  const db = readDB();
  const rows = db.symptom_logs
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);
  res.json(rows);
});

// POST /api/symptoms
app.post('/api/symptoms', auth, (req, res) => {
  const { symptoms, ai_response } = req.body;
  if (!symptoms) return res.status(400).json({ error: 'Symptoms text required' });
  const db = readDB();
  const entry = {
    id: newId(db.symptom_logs),
    user_id: req.user.id,
    symptoms,
    ai_response: ai_response || null,
    date: today(),
    created_at: now()
  };
  db.symptom_logs.push(entry);
  writeDB(db);
  res.json({ id: entry.id, message: 'Symptom log saved' });
});

// ── SLEEP ROUTES ─────────────────────────────

// GET /api/sleep
app.get('/api/sleep', auth, (req, res) => {
  const db = readDB();
  const rows = db.sleep_logs
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 14);
  res.json(rows);
});

// POST /api/sleep
app.post('/api/sleep', auth, (req, res) => {
  const { hours, quality } = req.body;
  if (!hours) return res.status(400).json({ error: 'Hours required' });
  const db = readDB();
  const entry = {
    id: newId(db.sleep_logs),
    user_id: req.user.id,
    hours,
    quality: quality || null,
    date: today(),
    created_at: now()
  };
  db.sleep_logs.push(entry);
  writeDB(db);
  res.json({ id: entry.id, message: 'Sleep logged' });
});

// ── MEDICATION ROUTES ────────────────────────

// GET /api/medications
app.get('/api/medications', auth, (req, res) => {
  const db = readDB();
  const rows = db.medications
    .filter(r => r.user_id === req.user.id && r.active)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(rows);
});

// POST /api/medications
app.post('/api/medications', auth, (req, res) => {
  const { name, dosage, frequency, time_of_day } = req.body;
  if (!name) return res.status(400).json({ error: 'Medication name required' });
  const db = readDB();
  const entry = {
    id: newId(db.medications),
    user_id: req.user.id,
    name,
    dosage: dosage || null,
    frequency: frequency || null,
    time_of_day: time_of_day || null,
    active: true,
    created_at: now()
  };
  db.medications.push(entry);
  writeDB(db);
  res.json({ id: entry.id, message: 'Medication added' });
});

// DELETE /api/medications/:id
app.delete('/api/medications/:id', auth, (req, res) => {
  const db = readDB();
  const med = db.medications.find(m => m.id === parseInt(req.params.id) && m.user_id === req.user.id);
  if (med) med.active = false;
  writeDB(db);
  res.json({ message: 'Medication removed' });
});

// ── DASHBOARD SUMMARY ────────────────────────

// GET /api/dashboard
app.get('/api/dashboard', auth, (req, res) => {
  const db = readDB();

  const health = db.health_data
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || {};

  const mood = db.mood_logs
    .filter(r => r.user_id === req.user.id && r.date === today())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || {};

  const sleep = db.sleep_logs
    .filter(r => r.user_id === req.user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || {};

  const medications = db.medications
    .filter(r => r.user_id === req.user.id && r.active).length;

  res.json({ health, mood, sleep, medications });
});

// ── CATCH-ALL → serve frontend ───────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── START ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 CuraMind server running at http://localhost:${PORT}`);
  console.log(`   Database: database.json`);
  console.log(`   Press Ctrl+C to stop\n`);
});