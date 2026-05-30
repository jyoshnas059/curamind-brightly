// ─────────────────────────────────────────────
//  CuraMind  ·  frontend/js/script.js
//  Main app logic — requires api.js loaded first
// ─────────────────────────────────────────────

// ── INIT: Auth guard + inject user nav ───────
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  injectUserNav();
  await loadDashboard();
  await loadSleepData();
  await loadMoodHistory();
  await loadHomeLiveStats();
  // loadSymptomHistory() is handled inside symptoms.js
});

// ── NAVIGATION ───────────────────────────────
const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.dataset.page;
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${target}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ── LOAD DASHBOARD DATA ──────────────────────
// ── REPLACE the loadDashboard() function in your script.js with this ──

async function loadDashboard() {
  try {
    const data = await DashboardAPI.getSummary();
    const h = data.health || {};

    // Load saved targets from localStorage (set by calculator)
    let targets = {};
    try { targets = JSON.parse(localStorage.getItem('cm_targets') || '{}'); } catch {}

    // Hide banner if targets already calculated
    const banner = document.getElementById('calc-banner');
    if (banner && targets.calories) banner.style.display = 'none';

    // ── Heart Rate ──
    if (h.heart_rate) {
      document.getElementById('val-heart').innerHTML =
        `${h.heart_rate} <span class="vital-unit">bpm</span>`;
    }

    // ── Hydration ──
    const hydTarget = targets.hydration || 2.5;
    if (h.hydration) {
      document.getElementById('val-hydration').innerHTML =
        `${h.hydration} <span class="vital-unit">L</span>`;
      const pct = Math.min((h.hydration / hydTarget) * 100, 100).toFixed(0);
      document.getElementById('prog-hydration').style.width = pct + '%';
      document.getElementById('hydration-sub').textContent =
        `${pct}% of ${hydTarget}L target`;
    } else if (targets.hydration) {
      document.getElementById('val-hydration').innerHTML =
        `${targets.hydration} <span class="vital-unit">L</span>`;
      document.getElementById('hydration-sub').textContent = 'Your daily target';
      document.getElementById('prog-hydration').style.width = '100%';
    }

    // ── Calories ──
    const calTarget = targets.calories || 2000;
    if (h.calories) {
      document.getElementById('val-calories').innerHTML =
        `${h.calories.toLocaleString()} <span class="vital-unit">kcal</span>`;
      const pct = Math.min((h.calories / calTarget) * 100, 100).toFixed(0);
      document.getElementById('prog-calories').style.width = pct + '%';
      document.getElementById('calories-sub').textContent =
        `${pct}% of ${calTarget.toLocaleString()} kcal target`;
    } else if (targets.calories) {
      document.getElementById('val-calories').innerHTML =
        `${targets.calories.toLocaleString()} <span class="vital-unit">kcal</span>`;
      document.getElementById('calories-sub').textContent = 'Your daily target';
      document.getElementById('prog-calories').style.width = '100%';
    }

    // ── Steps ──
    const stepsTarget = targets.steps || 10000;
    if (h.steps) {
      document.getElementById('val-steps').textContent = h.steps.toLocaleString();
      const pct = Math.min((h.steps / stepsTarget) * 100, 100).toFixed(0);
      document.getElementById('prog-steps').style.width = pct + '%';
      document.getElementById('steps-sub').textContent =
        `${pct}% of ${stepsTarget.toLocaleString()} steps`;
    } else if (targets.steps) {
      document.getElementById('val-steps').textContent = targets.steps.toLocaleString();
      document.getElementById('steps-sub').textContent = 'Your daily target';
      document.getElementById('prog-steps').style.width = '100%';
    }

    // ── BMI ──
    if (h.bmi) {
      document.getElementById('val-bmi').textContent = h.bmi;
      const bmiLabel =
        h.bmi < 18.5 ? '⚠️ Underweight' :
        h.bmi < 25   ? '✅ Healthy range' :
        h.bmi < 30   ? '⚠️ Overweight' : '🔴 Obese range';
      document.getElementById('bmi-sub').textContent = bmiLabel;
    }

    // ── Protein ──
    if (targets.protein) {
      document.getElementById('val-protein').innerHTML =
        `${targets.protein} <span class="vital-unit">g</span>`;
    }

    // ── Lifestyle page sync ──
    if (h.steps)    document.getElementById('ls-steps').textContent    = h.steps.toLocaleString() + ' steps';
    else if (targets.steps) document.getElementById('ls-steps').textContent = targets.steps.toLocaleString() + ' steps (target)';

    if (h.calories) document.getElementById('ls-calories').textContent = h.calories.toLocaleString() + ' kcal';
    else if (targets.calories) document.getElementById('ls-calories').textContent = targets.calories.toLocaleString() + ' kcal (target)';

    // ── Mood ──
    if (data.mood?.mood) {
      document.getElementById('mood-value').textContent = data.mood.mood + ' 🍃';
      document.querySelectorAll('.mood-tag').forEach(t => {
        t.classList.toggle('active', t.textContent === data.mood.mood);
      });
    }

  } catch (e) {
    console.warn('Dashboard load failed:', e.message);
  }
}

// ── LOAD SLEEP DATA ──────────────────────────
async function loadSleepData() {
  try {
    const rows = await SleepAPI.getAll();
    if (rows.length) {
      const latest = rows[0];
      const h = Math.floor(latest.hours);
      const m = Math.round((latest.hours - h) * 60);
      const display = m > 0 ? `${h}h ${m}m` : `${h}h`;
      document.getElementById('ls-sleep').textContent = display;
      document.getElementById('ls-sleep-sub').textContent =
        latest.quality ? `Quality: ${latest.quality}/10` : 'Logged';
    }
  } catch (e) {
    console.warn('Sleep load failed:', e.message);
  }
}

// ── LOAD MOOD HISTORY ────────────────────────
async function loadMoodHistory() {
  try {
    const rows = await MoodAPI.getAll();
    if (rows.length) {
      const today = rows.find(r => r.date === new Date().toISOString().split('T')[0]);
      if (today) {
        document.getElementById('mood-value').textContent = today.mood + ' 🍃';
        document.querySelectorAll('.mood-tag').forEach(t => {
          t.classList.toggle('active', t.textContent === today.mood);
        });
      }
    }
  } catch (e) { /* silent */ }
}

// ── MOOD TAGS ────────────────────────────────
document.querySelectorAll('.mood-tag').forEach(tag => {
  tag.addEventListener('click', async () => {
    document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    const mood = tag.textContent;
    document.getElementById('mood-value').textContent = mood + ' 🍃';
    try {
      await MoodAPI.log(mood);
      showToast('Mood logged ✓');
    } catch (e) {
      showToast('Could not save mood');
    }
  });
});

// ── SYMPTOM CHECKER ─ moved to symptoms.js ────
// All symptom extraction, Gemini AI, tag handlers, history, urgency → symptoms.js

// ── MODAL: LOG VITALS ────────────────────────
function openLogModal() {
  document.getElementById('log-modal').style.display = 'flex';
}

async function saveVitals() {
  const payload = {
    heart_rate:  parseFloat(document.getElementById('m-heart').value)    || null,
    hydration:   parseFloat(document.getElementById('m-hydration').value) || null,
    calories:    parseInt(document.getElementById('m-calories').value)    || null,
    steps:       parseInt(document.getElementById('m-steps').value)       || null,
    bmi:         parseFloat(document.getElementById('m-bmi').value)       || null,
    weight:      parseFloat(document.getElementById('m-weight').value)    || null,
  };

  const hasAny = Object.values(payload).some(v => v !== null);
  if (!hasAny) { showToast('Enter at least one value'); return; }

  try {
    await HealthAPI.log(payload);
    closeModal('log-modal');
    showToast('Vitals saved ✓');
    await loadDashboard();
    // Clear inputs
    ['m-heart','m-hydration','m-calories','m-steps','m-bmi','m-weight']
      .forEach(id => document.getElementById(id).value = '');
  } catch (e) {
    showToast('Error saving: ' + e.message);
  }
}

// ── MODAL: LOG SLEEP ─────────────────────────
function openSleepModal() {
  document.getElementById('sleep-modal').style.display = 'flex';
}

async function saveSleep() {
  const hours   = parseFloat(document.getElementById('m-sleep-hours').value);
  const quality = parseInt(document.getElementById('m-sleep-quality').value) || null;

  if (!hours) { showToast('Enter hours slept'); return; }

  try {
    await SleepAPI.log(hours, quality);
    closeModal('sleep-modal');
    showToast('Sleep logged ✓');
    await loadSleepData();
    document.getElementById('m-sleep-hours').value   = '';
    document.getElementById('m-sleep-quality').value = '';
  } catch (e) {
    showToast('Error saving: ' + e.message);
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// ── WELLNESS CARDS ───────────────────────────
document.querySelectorAll('.wellness-card').forEach(card => {
  card.addEventListener('click', () => {
    const title = card.querySelector('h3').textContent;
    const time  = card.querySelector('.w-time')?.textContent || '';
    alert(`Starting: ${title} (${time})\n\nThis is a demo — the full app would launch the guided session.`);
  });
});

// ── FORUM ITEMS ──────────────────────────────
document.querySelectorAll('.forum-item').forEach(item => {
  item.addEventListener('click', () => {
    const title = item.querySelector('.forum-title').textContent;
    alert(`Opening thread: "${title}"\n\nThis is a demo — the full app would load the forum thread.`);
  });
});

// ── UTILITIES ────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return iso; }
}
// ── HELPER: programmatic page switch ─────────
// Used by home page quick-action cards and feature cards
function switchPage(pageId) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── HOME: LIVE STATS BAR ──────────────────────
async function loadHomeLiveStats() {
  try {
    const data = await DashboardAPI.getSummary();
    const h = data.health || {};
    let targets = {};
    try { targets = JSON.parse(localStorage.getItem('cm_targets') || '{}'); } catch {}

    const pills = [];
    if (h.hydration)         pills.push({ icon: '💧', val: h.hydration + 'L',                          label: 'hydration' });
    else if (targets.hydration) pills.push({ icon: '💧', val: targets.hydration + 'L',                  label: 'target' });
    if (h.calories)          pills.push({ icon: '🔥', val: Number(h.calories).toLocaleString() + ' kcal', label: 'calories' });
    if (h.steps)             pills.push({ icon: '👣', val: Number(h.steps).toLocaleString(),             label: 'steps' });
    if (h.bmi)               pills.push({ icon: '📈', val: 'BMI ' + h.bmi,                              label: '' });
    if (data.mood?.mood)     pills.push({ icon: '😊', val: data.mood.mood,                               label: 'mood' });

    const container = document.getElementById('home-stats-pills');
    if (!container) return;

    if (!pills.length) {
      container.innerHTML = `<span style="font-size:0.8rem;color:var(--text-light);font-style:italic;">
        No data yet — log your vitals to see live stats here.</span>`;
      return;
    }

    container.innerHTML = pills.map(p => `
      <div style="display:flex;align-items:center;gap:5px;padding:4px 12px;
        border-radius:20px;background:var(--green-light);">
        <span style="font-size:0.85rem;">${p.icon}</span>
        <span style="font-size:0.82rem;font-weight:500;color:var(--green-dark);">${p.val}</span>
        ${p.label ? `<span style="font-size:0.72rem;color:var(--text-muted);">${p.label}</span>` : ''}
      </div>
    `).join('');
  } catch(e) { /* silent */ }
}

// Refresh stats bar on nav back to home
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (link.dataset.page === 'home') setTimeout(loadHomeLiveStats, 250);
  });
});