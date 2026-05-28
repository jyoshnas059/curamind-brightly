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
  await loadSymptomHistory();
  await loadSleepData();
  await loadMoodHistory();
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

// ── SYMPTOM TAGS ─────────────────────────────
document.querySelectorAll('.sym-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    tag.classList.toggle('selected');
    const input = document.getElementById('symptom-input');
    if (tag.classList.contains('selected')) {
      const current = input.value.trim();
      input.value = current ? current + ', ' + tag.textContent : tag.textContent;
    }
  });
});

// ── LOAD SYMPTOM HISTORY ─────────────────────
async function loadSymptomHistory() {
  try {
    const rows = await SymptomsAPI.getAll();
    const container = document.getElementById('symptom-history');
    const list = document.getElementById('symptom-history-list');
    if (!rows.length) return;

    container.style.display = 'block';
    list.innerHTML = rows.slice(0, 5).map(r => `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
           padding:14px 18px;margin-bottom:10px;">
        <div style="font-size:0.82rem;font-weight:500;color:var(--text-main);margin-bottom:4px;">
          ${escapeHtml(r.symptoms)}
        </div>
        <div style="font-size:0.75rem;color:var(--text-light);">${formatDate(r.created_at)}</div>
      </div>
    `).join('');
  } catch (e) { /* silent */ }
}

// ── GUIDANCE BUTTON: GEMINI AI + SAVE ────────
const GEMINI_KEY = 'AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';

document.getElementById('btn-guidance')?.addEventListener('click', async () => {
  const input     = document.getElementById('symptom-input');
  const resultBox = document.getElementById('guidance-result');
  const bodyEl    = document.getElementById('guidance-body');
  const dot       = resultBox?.querySelector('.guidance-dot');
  const val       = input?.value.trim();

  if (!val) {
    input.style.borderColor = 'var(--green-accent)';
    input.placeholder = 'Please describe your symptoms first...';
    input.focus();
    setTimeout(() => {
      input.style.borderColor = '';
      input.placeholder = "I've had a dull headache since this morning, mostly behind my eyes...";
    }, 2500);
    return;
  }

  resultBox.style.display = 'block';
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  dot?.classList.add('pulsing');
  bodyEl.innerHTML = `
    <div class="guidance-loading">
      Analysing your symptoms
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>`;

  const prompt = `You are CuraMind, a calm and caring wellness assistant.
The user describes their symptoms: "${val}"

Respond in this exact structure:
1. What you might be experiencing: (2-3 sentences explaining likely causes in plain language)
2. Gentle next steps: (3-5 bullet points of practical self-care tips)
3. When to see a doctor: (one sentence about warning signs)

Keep the tone warm, never alarming. Never diagnose. Use simple language.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
    dot?.classList.remove('pulsing');

    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(\d\.\s[^\n]+)/gm, '<p class="section-title">$1</p>')
      .replace(/^\*\s(.+)/gm, '<li>$1</li>')
      .replace(/^-\s(.+)/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$&</ul>')
      .replace(/\n{2,}/g, '<br>');

    bodyEl.innerHTML = formatted;

    // Save to database
    try {
      await SymptomsAPI.log(val, text);
      showToast('Symptom log saved ✓');
      await loadSymptomHistory();
    } catch (e) { /* silent — AI response still shown */ }

  } catch (err) {
    dot?.classList.remove('pulsing');
    bodyEl.innerHTML = `<div class="guidance-error">
      ❌ Something went wrong: ${err.message}.<br>Check your API key and internet connection.
    </div>`;
  }
});

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