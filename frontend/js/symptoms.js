// ─────────────────────────────────────────────
//  CuraMind  ·  frontend/js/symptoms.js
//  Upgraded Symptom Checker module
//  Features:
//    • Real-time symptom extraction as user types
//    • Severity detection (low / medium / high)
//    • Structured JSON output from Gemini
//    • Urgency badge (Monitor / See Doctor / Urgent)
//    • Symptom timeline from past logs
//    • Saves to backend via SymptomsAPI
//
//  Requires: api.js loaded before this file
//  Add in index.html: <script src="js/symptoms.js"></script>
// ─────────────────────────────────────────────

const GEMINI_KEY = 'AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;

// ── KNOWN SYMPTOM DICTIONARY ─────────────────
// Used for real-time client-side extraction
const SYMPTOM_KEYWORDS = [
  'headache', 'fever', 'cough', 'cold', 'sore throat', 'throat',
  'fatigue', 'tired', 'exhausted', 'weakness', 'weak',
  'nausea', 'vomiting', 'dizziness', 'dizzy', 'lightheaded',
  'chest pain', 'chest tightness', 'shortness of breath', 'breathing',
  'stomach ache', 'stomach pain', 'abdominal pain', 'cramps',
  'diarrhea', 'constipation', 'bloating',
  'body pain', 'muscle pain', 'joint pain', 'back pain',
  'anxiety', 'stress', 'panic', 'nervousness',
  'insomnia', 'sleep', 'restless',
  'rash', 'itching', 'swelling', 'inflammation',
  'runny nose', 'sneezing', 'congestion', 'blocked nose',
  'eye pain', 'blurred vision', 'watery eyes',
  'earache', 'ear pain', 'ringing',
  'loss of appetite', 'weight loss', 'weight gain',
  'depression', 'sadness', 'mood', 'irritable',
  'palpitations', 'heart racing', 'irregular heartbeat',
  'frequent urination', 'burning urination',
  'hair loss', 'dry skin', 'acne',
];

// Words that signal HIGH severity
const HIGH_SEVERITY_WORDS = [
  'severe', 'extreme', 'unbearable', 'worst', 'terrible',
  'crushing', 'sharp', 'sudden', 'emergency', 'can\'t breathe',
  'unconscious', 'fainted', 'collapsing', 'paralysis', 'numbness',
  'blood', 'bleeding', 'vomiting blood', 'chest pain',
];

// Words that signal MEDIUM severity
const MEDIUM_SEVERITY_WORDS = [
  'moderate', 'quite', 'pretty bad', 'getting worse', 'worsening',
  'since yesterday', 'for days', 'few days', 'persistent',
  'keeps coming back', 'recurring', 'not improving',
];

// ── REAL-TIME SYMPTOM EXTRACTION ─────────────
function extractSymptoms(text) {
  if (!text || text.length < 3) return [];
  const lower = text.toLowerCase();
  const found = [];
  SYMPTOM_KEYWORDS.forEach(kw => {
    if (lower.includes(kw) && !found.includes(kw)) {
      found.push(kw);
    }
  });
  return found;
}

// ── SEVERITY DETECTION ────────────────────────
function detectSeverity(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const word of HIGH_SEVERITY_WORDS) {
    if (lower.includes(word)) return 'high';
  }
  for (const word of MEDIUM_SEVERITY_WORDS) {
    if (lower.includes(word)) return 'medium';
  }
  if (text.trim().length > 20) return 'low';
  return null;
}

// ── ONINPUT HANDLER (called from HTML) ───────
// Fires on every keystroke in the symptom textarea
function onSymptomInput(textarea) {
  const val = textarea.value;

  // Character count
  const countEl = document.getElementById('sym-char-count');
  if (countEl) countEl.textContent = `${val.length} / 500`;

  // Extracted symptoms
  const symptoms  = extractSymptoms(val);
  const extWrap   = document.getElementById('sym-extracted-wrap');
  const extTags   = document.getElementById('sym-extracted-tags');

  if (symptoms.length && extWrap && extTags) {
    extWrap.style.display = 'block';
    extTags.innerHTML = symptoms.map(s => `
      <span style="display:inline-flex;align-items:center;gap:5px;
        background:var(--green-dark);color:#fff;font-size:0.78rem;font-weight:500;
        padding:5px 12px;border-radius:20px;animation:tagPop 0.2s ease;">
        ✓ ${s}
      </span>
    `).join('');
  } else if (extWrap) {
    extWrap.style.display = 'none';
  }

  // Severity badge
  const severity     = detectSeverity(val);
  const sevWrap      = document.getElementById('sym-severity-wrap');
  const sevBadge     = document.getElementById('sym-severity-badge');

  if (severity && sevWrap && sevBadge) {
    sevWrap.style.display = 'block';
    const map = {
      low:    { label: '🟢 Mild',    cls: 'severity-low'    },
      medium: { label: '🟡 Moderate', cls: 'severity-medium' },
      high:   { label: '🔴 Severe',  cls: 'severity-high'   },
    };
    sevBadge.textContent  = map[severity].label;
    sevBadge.className    = map[severity].cls;
    // also style inline for safety
    const colors = {
      low:    { bg: '#d4e8d8', color: '#1e3a2f' },
      medium: { bg: '#fff3cd', color: '#7a5c00' },
      high:   { bg: '#ffe4e4', color: '#c0392b' },
    };
    sevBadge.style.background = colors[severity].bg;
    sevBadge.style.color      = colors[severity].color;
    sevBadge.style.padding    = '3px 12px';
    sevBadge.style.borderRadius = '12px';
    sevBadge.style.fontWeight = '600';
    sevBadge.style.fontSize   = '0.78rem';
  } else if (sevWrap) {
    sevWrap.style.display = 'none';
  }
}

// ── SYMPTOM TIMELINE ─────────────────────────
// Shows last 5 logged symptoms as timeline pills
async function renderSymptomTimeline() {
  try {
    const rows     = await SymptomsAPI.getAll();
    const timelineWrap = document.getElementById('sym-timeline-wrap');
    const timeline     = document.getElementById('sym-timeline');
    if (!rows.length || !timelineWrap || !timeline) return;

    timelineWrap.style.display = 'block';
    timeline.innerHTML = rows.slice(0, 5).map(r => {
      const d = new Date(r.created_at);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const short   = r.symptoms.length > 30
        ? r.symptoms.substring(0, 30) + '…'
        : r.symptoms;
      return `
        <div style="display:flex;flex-direction:column;gap:2px;background:var(--bg-card);
          border:1px solid var(--border);border-radius:10px;padding:7px 12px;font-size:0.75rem;">
          <span style="font-size:0.68rem;color:var(--text-light);">${dateStr}</span>
          <span style="color:var(--text-main);font-weight:500;max-width:140px;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(short)}</span>
        </div>`;
    }).join('');
  } catch (e) { /* silent */ }
}

// ── LOAD SYMPTOM HISTORY (past logs list) ────
async function loadSymptomHistory() {
  try {
    const rows      = await SymptomsAPI.getAll();
    const container = document.getElementById('symptom-history');
    const list      = document.getElementById('symptom-history-list');
    if (!rows.length || !container || !list) return;

    container.style.display = 'block';
    list.innerHTML = rows.slice(0, 5).map(r => `
      <div style="background:var(--bg-card);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:14px 18px;margin-bottom:10px;">
        <div style="font-size:0.82rem;font-weight:500;color:var(--text-main);margin-bottom:4px;">
          ${escapeHtml(r.symptoms)}
        </div>
        <div style="font-size:0.75rem;color:var(--text-light);">${formatDate(r.created_at)}</div>
      </div>
    `).join('');
  } catch (e) { /* silent */ }
}

// ── URGENCY LEVEL FROM GEMINI JSON ───────────
function applyUrgencyBadge(urgency) {
  const badge = document.getElementById('urgency-badge');
  if (!badge) return;

  const map = {
    'monitor':  { label: '🟢 Monitor at home', bg: '#d4e8d8', color: '#1e3a2f' },
    'doctor':   { label: '🟡 See a doctor soon', bg: '#fff3cd', color: '#7a5c00' },
    'urgent':   { label: '🔴 Seek urgent care', bg: '#ffe4e4', color: '#c0392b' },
  };

  const level = map[urgency] || map['monitor'];
  badge.textContent        = level.label;
  badge.style.display      = 'inline-block';
  badge.style.background   = level.bg;
  badge.style.color        = level.color;
  badge.style.padding      = '4px 12px';
  badge.style.borderRadius = '12px';
  badge.style.fontWeight   = '600';
  badge.style.fontSize     = '0.75rem';
}

// ── RENDER STRUCTURED AI SECTIONS ────────────
function renderStructuredResult(parsed) {
  const bodyEl = document.getElementById('guidance-body');
  if (!bodyEl) return;

  const sections = [
    {
      icon: '🔎',
      label: 'What you might be experiencing',
      content: parsed.what_you_might_experience || '',
      type: 'text',
    },
    {
      icon: '🌿',
      label: 'Gentle next steps',
      content: parsed.gentle_next_steps || [],
      type: 'list',
    },
    {
      icon: '⚠️',
      label: 'When to see a doctor',
      content: parsed.when_to_see_doctor || '',
      type: 'text',
    },
    {
      icon: '💊',
      label: 'Possible conditions (not a diagnosis)',
      content: (parsed.possible_conditions || []).join(', '),
      type: 'text',
    },
  ];

  bodyEl.innerHTML = sections.map(s => {
    let body = '';
    if (s.type === 'list' && Array.isArray(s.content)) {
      body = `<ul style="padding-left:18px;margin:6px 0 0;">
        ${s.content.map(item => `<li style="margin-bottom:5px;">${item}</li>`).join('')}
      </ul>`;
    } else {
      body = `<p style="margin:0;">${s.content}</p>`;
    }

    return `
      <div style="padding:20px 24px;border-bottom:1px solid var(--border);">
        <div style="font-size:0.68rem;font-weight:600;letter-spacing:0.12em;
          text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;
          display:flex;align-items:center;gap:7px;">
          <span>${s.icon}</span> ${s.label}
        </div>
        <div style="font-size:0.88rem;color:var(--text-muted);line-height:1.75;">
          ${body}
        </div>
      </div>`;
  }).join('');
}

// ── MAIN: GUIDANCE BUTTON HANDLER ────────────
document.addEventListener('DOMContentLoaded', () => {

  // Attach sym-tag click handlers
  document.querySelectorAll('.sym-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('selected');
      const input = document.getElementById('symptom-input');
      if (!input) return;
      if (tag.classList.contains('selected')) {
        const current = input.value.trim();
        input.value = current ? current + ', ' + tag.textContent : tag.textContent;
      } else {
        input.value = input.value
          .replace(new RegExp(',?\\s*' + tag.textContent + ',?\\s*', 'i'), ' ')
          .trim()
          .replace(/^,|,$/g, '');
      }
      onSymptomInput(input);
    });
  });

  // Load past timeline when page is first opened
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (link.dataset.page === 'symptoms') {
        setTimeout(renderSymptomTimeline, 150);
      }
    });
  });

  // Initial load
  renderSymptomTimeline();

  // ── GUIDANCE BUTTON ──────────────────────
  const btn = document.getElementById('btn-guidance');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const input     = document.getElementById('symptom-input');
    const resultBox = document.getElementById('guidance-result');
    const bodyEl    = document.getElementById('guidance-body');
    const dot       = document.getElementById('guidance-dot');
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

    // Show loading
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    dot?.classList.add('pulsing');

    // Hide urgency badge while loading
    const urgencyBadge = document.getElementById('urgency-badge');
    if (urgencyBadge) urgencyBadge.style.display = 'none';

    bodyEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:24px;
        color:var(--text-muted);font-size:0.88rem;">
        Analysing your symptoms
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>`;

    // Build prompt — ask Gemini to return strict JSON
    const historyContext = await buildHistoryContext();

    const prompt = `You are CuraMind, a calm and caring AI wellness assistant.
The user describes: "${val}"
${historyContext}

Return ONLY a valid JSON object with exactly these fields (no markdown, no extra text):
{
  "urgency": "monitor" | "doctor" | "urgent",
  "what_you_might_experience": "2-3 sentence plain language explanation of likely causes",
  "possible_conditions": ["condition1", "condition2"],
  "gentle_next_steps": ["step1", "step2", "step3", "step4"],
  "when_to_see_doctor": "one sentence about warning signs to watch for"
}

Rules:
- urgency "monitor" = manageable at home
- urgency "doctor" = needs medical attention within 1-2 days
- urgency "urgent" = needs immediate care
- Never diagnose. Keep tone warm and calm. Use simple language.
- possible_conditions max 3 items, gentle_next_steps max 5 items.`;

    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.4 }
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      dot?.classList.remove('pulsing');

      // Strip markdown code fences if Gemini wraps in them
      raw = raw.replace(/```json|```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        // Fallback: show raw text nicely if JSON fails
        bodyEl.innerHTML = `
          <div style="padding:24px;font-size:0.88rem;color:var(--text-muted);
            line-height:1.75;white-space:pre-wrap;">${raw}</div>`;
        dot?.classList.remove('pulsing');
        await saveToDB(val, raw);
        return;
      }

      // Apply urgency badge
      applyUrgencyBadge(parsed.urgency || 'monitor');

      // Render structured sections
      renderStructuredResult(parsed);

      // Save to database
      await saveToDB(val, raw);

    } catch (err) {
      dot?.classList.remove('pulsing');
      bodyEl.innerHTML = `
        <div style="padding:20px 24px;color:#c0392b;font-size:0.88rem;
          background:#fff5f5;border-radius:0 0 var(--radius) var(--radius);">
          ❌ Something went wrong: ${err.message}.<br>
          Check your Gemini API key and internet connection.
        </div>`;
    }
  });
});

// ── BUILD HISTORY CONTEXT FOR PROMPT ─────────
async function buildHistoryContext() {
  try {
    const rows = await SymptomsAPI.getAll();
    if (!rows.length) return '';
    const recent = rows.slice(0, 3)
      .map(r => `- ${r.date}: "${r.symptoms}"`)
      .join('\n');
    return `\nRecent symptom history for context:\n${recent}`;
  } catch {
    return '';
  }
}

// ── SAVE TO DATABASE ─────────────────────────
async function saveToDB(symptoms, aiResponse) {
  try {
    await SymptomsAPI.log(symptoms, aiResponse);
    if (typeof showToast === 'function') showToast('✓ Symptom log saved');
    await loadSymptomHistory();
    await renderSymptomTimeline();
  } catch (e) { /* silent — AI result already shown */ }
}