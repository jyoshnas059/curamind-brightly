// ─────────────────────────────────────────────
//  CuraMind  ·  frontend/js/symptoms.js
// ─────────────────────────────────────────────

const GEMINI_KEY = 'AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;

// ── SYMPTOM KEYWORDS ──────────────────────────
const SYMPTOM_KEYWORDS = [
  'headache','fever','cough','cold','sore throat','throat',
  'fatigue','tired','exhausted','weakness','weak',
  'nausea','vomiting','dizziness','dizzy','lightheaded',
  'chest pain','chest tightness','shortness of breath','breathing',
  'stomach ache','stomach pain','abdominal pain','cramps',
  'diarrhea','constipation','bloating',
  'body pain','muscle pain','joint pain','back pain',
  'anxiety','stress','panic','nervousness',
  'insomnia','sleep','restless',
  'rash','itching','swelling','inflammation',
  'runny nose','sneezing','congestion','blocked nose',
  'eye pain','blurred vision','watery eyes',
  'earache','ear pain','ringing',
  'loss of appetite','weight loss','weight gain',
  'depression','sadness','mood','irritable',
  'palpitations','heart racing','irregular heartbeat',
  'frequent urination','burning urination',
  'hair loss','dry skin','acne',
];

const HIGH_SEVERITY_WORDS = [
  'severe','extreme','unbearable','worst','terrible',
  'crushing','sharp','sudden','emergency','can\'t breathe',
  'unconscious','fainted','collapsing','paralysis','numbness',
  'blood','bleeding','vomiting blood','chest pain',
];

const MEDIUM_SEVERITY_WORDS = [
  'moderate','quite','pretty bad','getting worse','worsening',
  'since yesterday','for days','few days','persistent',
  'keeps coming back','recurring','not improving',
];

// ── SYMPTOM EXTRACTION ────────────────────────
function extractSymptoms(text) {
  if (!text || text.length < 3) return [];
  const lower = text.toLowerCase();
  const found = [];
  SYMPTOM_KEYWORDS.forEach(kw => {
    if (lower.includes(kw) && !found.includes(kw)) found.push(kw);
  });
  return found;
}

// ── SEVERITY DETECTION ────────────────────────
function detectSeverity(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const word of HIGH_SEVERITY_WORDS)   if (lower.includes(word)) return 'high';
  for (const word of MEDIUM_SEVERITY_WORDS) if (lower.includes(word)) return 'medium';
  if (text.trim().length > 20) return 'low';
  return null;
}

// ── ON INPUT HANDLER ──────────────────────────
function onSymptomInput(textarea) {
  const val     = textarea.value;
  const countEl = document.getElementById('sym-char-count');
  if (countEl) countEl.textContent = val.length + ' / 500';

  const symptoms = extractSymptoms(val);
  const extWrap  = document.getElementById('sym-extracted-wrap');
  const extTags  = document.getElementById('sym-extracted-tags');

  if (symptoms.length && extWrap && extTags) {
    extWrap.style.display = 'block';
    extTags.innerHTML = symptoms.map(s =>
      '<span style="display:inline-flex;align-items:center;gap:5px;' +
      'background:var(--green-dark);color:#fff;font-size:0.78rem;font-weight:500;' +
      'padding:5px 12px;border-radius:20px;">✓ ' + s + '</span>'
    ).join('');
  } else if (extWrap) {
    extWrap.style.display = 'none';
  }

  const severity = detectSeverity(val);
  const sevWrap  = document.getElementById('sym-severity-wrap');
  const sevBadge = document.getElementById('sym-severity-badge');

  if (severity && sevWrap && sevBadge) {
    sevWrap.style.display = 'flex';
    const colors = {
      low:    { label: '🟢 Mild',     bg: '#d4e8d8', color: '#1e3a2f' },
      medium: { label: '🟡 Moderate', bg: '#fff3cd', color: '#7a5c00' },
      high:   { label: '🔴 Severe',   bg: '#ffe4e4', color: '#c0392b' },
    };
    const c = colors[severity];
    sevBadge.textContent        = c.label;
    sevBadge.style.background   = c.bg;
    sevBadge.style.color        = c.color;
    sevBadge.style.padding      = '3px 12px';
    sevBadge.style.borderRadius = '12px';
    sevBadge.style.fontWeight   = '600';
    sevBadge.style.fontSize     = '0.78rem';
  } else if (sevWrap) {
    sevWrap.style.display = 'none';
  }
}

// ── SYMPTOM TIMELINE ──────────────────────────
async function renderSymptomTimeline() {
  try {
    const rows         = await SymptomsAPI.getAll();
    const timelineWrap = document.getElementById('sym-timeline-wrap');
    const timeline     = document.getElementById('sym-timeline');
    if (!rows.length || !timelineWrap || !timeline) return;
    timelineWrap.style.display = 'block';
    timeline.innerHTML = rows.slice(0, 5).map(r => {
      const d       = new Date(r.created_at);
      const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const short   = r.symptoms.length > 30 ? r.symptoms.substring(0, 30) + '…' : r.symptoms;
      return '<div style="display:flex;flex-direction:column;gap:2px;background:var(--bg-card);' +
        'border:1px solid var(--border);border-radius:10px;padding:7px 12px;font-size:0.75rem;">' +
        '<span style="font-size:0.68rem;color:var(--text-light);">' + dateStr + '</span>' +
        '<span style="color:var(--text-main);font-weight:500;max-width:140px;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(short) + '</span>' +
        '</div>';
    }).join('');
  } catch (e) { /* silent */ }
}

// ── LOAD SYMPTOM HISTORY ──────────────────────
async function loadSymptomHistory() {
  try {
    const rows      = await SymptomsAPI.getAll();
    const container = document.getElementById('symptom-history');
    const list      = document.getElementById('symptom-history-list');
    if (!rows.length || !container || !list) return;
    container.style.display = 'block';
    list.innerHTML = rows.slice(0, 5).map(r =>
      '<div style="background:var(--bg-card);border:1px solid var(--border);' +
      'border-radius:var(--radius-sm);padding:14px 18px;margin-bottom:10px;">' +
      '<div style="font-size:0.82rem;font-weight:500;color:var(--text-main);margin-bottom:4px;">' +
      escapeHtml(r.symptoms) + '</div>' +
      '<div style="font-size:0.75rem;color:var(--text-light);">' + formatDate(r.created_at) + '</div>' +
      '</div>'
    ).join('');
  } catch (e) { /* silent */ }
}

// ── URGENCY BADGE ─────────────────────────────
function applyUrgencyBadge(urgency) {
  const badge = document.getElementById('urgency-badge');
  if (!badge) return;
  const map = {
    monitor: { label: '🟢 Monitor at home',  bg: '#d4e8d8', color: '#1e3a2f' },
    doctor:  { label: '🟡 See a doctor soon', bg: '#fff3cd', color: '#7a5c00' },
    urgent:  { label: '🔴 Seek urgent care',  bg: '#ffe4e4', color: '#c0392b' },
  };
  const level              = map[urgency] || map.monitor;
  badge.textContent        = level.label;
  badge.style.display      = 'inline-block';
  badge.style.background   = level.bg;
  badge.style.color        = level.color;
  badge.style.padding      = '4px 12px';
  badge.style.borderRadius = '12px';
  badge.style.fontWeight   = '600';
  badge.style.fontSize     = '0.75rem';
}

// ── RENDER STRUCTURED RESULT ──────────────────
function renderStructuredResult(parsed) {
  const bodyEl = document.getElementById('guidance-body');
  if (!bodyEl) return;

  const sections = [
    {
      icon: '🔍', label: 'WHAT YOU MIGHT BE EXPERIENCING',
      content: parsed.what_you_might_experience || '',
      type: 'text'
    },
    {
      icon: '📋', label: 'POSSIBLE CONDITIONS',
      content: parsed.possible_conditions || [],
      type: 'list'
    },
    {
      icon: '💚', label: 'GENTLE NEXT STEPS',
      content: parsed.gentle_next_steps || [],
      type: 'list'
    },
    {
      icon: '⚠️', label: 'WHEN TO SEE A DOCTOR',
      content: parsed.when_to_see_doctor || '',
      type: 'text'
    },
  ];

  bodyEl.innerHTML = sections.map(s => {
    let body = '';
    if (s.type === 'list' && Array.isArray(s.content)) {
      body = '<ul style="padding-left:18px;margin:6px 0 0;">' +
        s.content.map(item => '<li style="margin-bottom:5px;">' + item + '</li>').join('') +
        '</ul>';
    } else {
      body = '<p style="margin:0;">' + s.content + '</p>';
    }
    return '<div style="padding:20px 24px;border-bottom:1px solid var(--border);">' +
      '<div style="font-size:0.68rem;font-weight:600;letter-spacing:0.12em;' +
      'text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;' +
      'display:flex;align-items:center;gap:7px;">' +
      '<span>' + s.icon + '</span> ' + s.label + '</div>' +
      '<div style="font-size:0.88rem;color:var(--text-muted);line-height:1.75;">' +
      body + '</div></div>';
  }).join('');
}

// ── BUILD HISTORY CONTEXT ─────────────────────
async function buildHistoryContext() {
  try {
    const rows = await SymptomsAPI.getAll();
    if (!rows.length) return '';
    const recent = rows.slice(0, 3).map(r => '- ' + r.date + ': "' + r.symptoms + '"').join('\n');
    return '\nRecent symptom history for context:\n' + recent;
  } catch {
    return '';
  }
}

// ── SAVE TO DATABASE ──────────────────────────
async function saveToDB(symptoms, aiResponse) {
  try {
    await SymptomsAPI.log(symptoms, aiResponse);
    if (typeof showToast === 'function') showToast('✓ Symptom log saved');
    await loadSymptomHistory();
    await renderSymptomTimeline();
  } catch (e) { /* silent */ }
}

// ── OPEN FOLLOW-UP FROM BUTTON ────────────────
function openFollowUpFromBtn() {
  const input = document.getElementById('symptom-input');
  const val   = input ? input.value.trim() : '';
  if (!val) {
    if (typeof showToast === 'function') showToast('Please describe your symptoms first');
    return;
  }
  if (typeof followUpAnswers  !== 'undefined') followUpAnswers  = {};
  if (typeof selectedDuration !== 'undefined') selectedDuration = null;
  if (typeof openFollowUpFlow === 'function')  openFollowUpFlow(val);
}

// ── DOM READY ─────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

  // Symptom tag clicks
  document.querySelectorAll('.sym-tag').forEach(function(tag) {
    tag.addEventListener('click', function() {
      tag.classList.toggle('selected');
      var input = document.getElementById('symptom-input');
      if (!input) return;
      if (tag.classList.contains('selected')) {
        var current = input.value.trim();
        input.value = current ? current + ', ' + tag.textContent.trim() : tag.textContent.trim();
      } else {
        input.value = input.value
          .replace(new RegExp(',?\\s*' + tag.textContent.trim() + ',?\\s*', 'i'), ' ')
          .trim().replace(/^,|,$/g, '');
      }
      onSymptomInput(input);
    });
  });

  // Nav link — reload timeline when switching to symptoms page
  document.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
      if (link.dataset.page === 'symptoms') setTimeout(renderSymptomTimeline, 150);
    });
  });

  // Initial timeline render
  renderSymptomTimeline();

  // ── GUIDANCE BUTTON ───────────────────────
  var btn = document.getElementById('btn-guidance');
  if (!btn) return;

  btn.addEventListener('click', async function() {
    var input     = document.getElementById('symptom-input');
    var resultBox = document.getElementById('guidance-result');
    var bodyEl    = document.getElementById('guidance-body');
    var dot       = document.getElementById('guidance-dot');
    var val       = input ? input.value.trim() : '';

    if (!val) {
      if (input) {
        input.style.borderColor = 'var(--green-accent)';
        input.placeholder = 'Please describe your symptoms first...';
        input.focus();
        setTimeout(function() {
          input.style.borderColor = '';
          input.placeholder = "I've had a dull headache since this morning, mostly behind my eyes...";
        }, 2500);
      }
      return;
    }

    // Use follow-up answers if they exist
    var answers  = (typeof followUpAnswers  !== 'undefined' && Object.keys(followUpAnswers).length)
      ? followUpAnswers : null;
    var duration = (typeof selectedDuration !== 'undefined' && selectedDuration &&
                    typeof DURATION_OPTIONS  !== 'undefined')
      ? DURATION_OPTIONS.find(function(d) { return d.id === selectedDuration; }) : null;

    if (answers || duration) {
      if (typeof triggerGuidance === 'function') await triggerGuidance(answers, duration);
      return;
    }

    // Normal flow
    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (dot) dot.classList.add('pulsing');

    var urgencyBadge = document.getElementById('urgency-badge');
    if (urgencyBadge) urgencyBadge.style.display = 'none';

    bodyEl.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:24px;' +
      'color:var(--text-muted);font-size:0.88rem;">Analysing your symptoms' +
      '<div class="loading-dots"><span></span><span></span><span></span></div></div>';

    var historyContext = await buildHistoryContext();

    var prompt =
      'You are CuraMind, a calm and caring AI wellness assistant.\n' +
      'The user describes: "' + val + '"\n' +
      historyContext + '\n\n' +
      'Return ONLY a valid JSON object with exactly these fields (no markdown, no extra text):\n' +
      '{\n' +
      '  "urgency": "monitor" | "doctor" | "urgent",\n' +
      '  "what_you_might_experience": "2-3 sentence plain language explanation",\n' +
      '  "possible_conditions": ["condition1", "condition2"],\n' +
      '  "gentle_next_steps": ["step1", "step2", "step3", "step4"],\n' +
      '  "when_to_see_doctor": "one sentence about warning signs"\n' +
      '}\n' +
      'Never diagnose. Keep tone warm and calm. Use simple language.';

    try {
      var response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 900, temperature: 0.4 }
        })
      });

      if (!response.ok) {
        var errData = await response.json().catch(function() { return {}; });
        throw new Error((errData && errData.error && errData.error.message) || 'API error ' + response.status);
      }

      var data = await response.json();
      var raw  = (data && data.candidates && data.candidates[0] &&
                  data.candidates[0].content && data.candidates[0].content.parts &&
                  data.candidates[0].content.parts[0].text) || '';
      if (dot) dot.classList.remove('pulsing');
      raw = raw.replace(/```json|```/g, '').trim();

      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        bodyEl.innerHTML = '<div style="padding:24px;font-size:0.88rem;color:var(--text-muted);' +
          'white-space:pre-wrap;">' + raw + '</div>';
        await saveToDB(val, raw);
        return;
      }

      applyUrgencyBadge(parsed.urgency || 'monitor');
      renderStructuredResult(parsed);
      await saveToDB(val, raw);

    } catch (err) {
      if (dot) dot.classList.remove('pulsing');
      bodyEl.innerHTML =
        '<div style="padding:20px 24px;color:#c0392b;font-size:0.88rem;' +
        'background:#fff5f5;border-radius:0 0 var(--radius) var(--radius);">' +
        '❌ Something went wrong: ' + err.message + '.<br>' +
        'Check your Gemini API key and internet connection.</div>';
    }
  });

});