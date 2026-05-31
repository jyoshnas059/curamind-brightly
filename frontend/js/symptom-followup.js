// ─────────────────────────────────────────────
//  CuraMind · symptom-followup.js
//  Follow-up question flow + Duration tracker
//  Save to: frontend/js/symptom-followup.js
// ─────────────────────────────────────────────

// ── DURATION OPTIONS ─────────────────────────
const DURATION_OPTIONS = [
  { id: 'today',   label: 'Started today',     icon: '🕐', weight: 1 },
  { id: '2-3days', label: '2–3 days',           icon: '📅', weight: 2 },
  { id: 'week',    label: 'About a week',       icon: '🗓️', weight: 3 },
  { id: '2weeks',  label: '1–2 weeks',          icon: '⚠️', weight: 4 },
  { id: 'month',   label: 'More than 2 weeks', icon: '🔴', weight: 5 },
];

// ── SMART FOLLOW-UP QUESTIONS ────────────────
const FOLLOWUP_QUESTIONS = {
  headache: [
    { id: 'location', q: 'Where is the headache located?',       options: ['Forehead','Back of head','One side','All over','Behind eyes'] },
    { id: 'pattern',  q: 'How does the pain feel?',              options: ['Throbbing','Constant pressure','Sharp/stabbing','Dull ache','Tight band'] },
    { id: 'triggers', q: 'What makes it worse?',                 options: ['Bright light','Loud sounds','Movement','Screen time','Nothing specific'] },
  ],
  fever: [
    { id: 'temp',   q: 'How high is your temperature?',          options: ['Mild (99–100°F)','Moderate (100–102°F)','High (102°F+)','Not measured'] },
    { id: 'chills', q: 'Do you have chills or shivering?',       options: ['Yes — severe','Yes — mild','No','Comes and goes'] },
  ],
  stomach: [
    { id: 'location', q: 'Where is the stomach pain?',           options: ['Upper abdomen','Lower abdomen','Around navel','Whole stomach','Right side'] },
    { id: 'eating',   q: 'Does eating make it better or worse?', options: ['Worse after eating','Better after eating','No difference','Only on empty stomach'] },
    { id: 'other',    q: 'Any other symptoms?',                  options: ['Nausea','Vomiting','Bloating','Loss of appetite','Loose stools'] },
  ],
  chest: [
    { id: 'type',      q: 'How does the chest pain feel?',       options: ['Pressure/squeezing','Sharp when breathing','Burning','Dull ache','Comes in waves'] },
    { id: 'breathing', q: 'Any trouble breathing?',              options: ['Yes — severe','Yes — mild','No','Only with movement'] },
    { id: 'duration',  q: 'How long does each episode last?',    options: ['Seconds','Minutes','Hours','Constant'] },
  ],
  cough: [
    { id: 'type', q: 'What kind of cough?',                      options: ['Dry cough','Wet/productive','Barking','Wheezing','Blood in mucus'] },
    { id: 'time', q: 'When is it worst?',                        options: ['Morning','Night','After eating','All day','After exercise'] },
  ],
  fatigue: [
    { id: 'level', q: 'How severe is the fatigue?',              options: ['Mild — can function','Moderate — hard to concentrate','Severe — cannot do daily tasks'] },
    { id: 'sleep', q: 'How is your sleep?',                      options: ['Sleeping too much','Cannot sleep','Normal sleep but still tired','Disturbed sleep'] },
  ],
  anxiety: [
    { id: 'triggers', q: 'What triggers your anxiety?',          options: ['Work/studies','Social situations','No clear trigger','Physical symptoms','Future worries'] },
    { id: 'physical', q: 'Any physical symptoms with anxiety?',  options: ['Heart racing','Shortness of breath','Sweating','Trembling','All of these'] },
  ],
  default: [
    { id: 'severity', q: 'How much is this affecting daily life?',   options: ['Barely noticeable','Somewhat limiting','Very limiting','Cannot function normally'] },
    { id: 'onset',    q: 'Did symptoms start suddenly or gradually?', options: ['Suddenly — within hours','Gradually over days','Gradually over weeks','After an event/stress'] },
  ],
};

let followUpAnswers  = {};
let selectedDuration = null;

// ── OPEN FOLLOW-UP FLOW ──────────────────────
function openFollowUpFlow(symptoms) {
  const ex = document.getElementById('followup-modal');
  if (ex) ex.remove();

  const lower = symptoms.toLowerCase();
  let questionSet = FOLLOWUP_QUESTIONS.default;

  if (lower.includes('head'))    questionSet = [...FOLLOWUP_QUESTIONS.headache, ...FOLLOWUP_QUESTIONS.default];
  if (lower.includes('fever'))   questionSet = [...FOLLOWUP_QUESTIONS.fever,    ...FOLLOWUP_QUESTIONS.default];
  if (lower.includes('stomach') || lower.includes('abdom') || lower.includes('nausea'))
                                 questionSet = [...FOLLOWUP_QUESTIONS.stomach,  ...FOLLOWUP_QUESTIONS.default];
  if (lower.includes('chest'))   questionSet = [...FOLLOWUP_QUESTIONS.chest];
  if (lower.includes('cough'))   questionSet = [...FOLLOWUP_QUESTIONS.cough,    ...FOLLOWUP_QUESTIONS.default];
  if (lower.includes('tired') || lower.includes('fatigue'))
                                 questionSet = [...FOLLOWUP_QUESTIONS.fatigue,  ...FOLLOWUP_QUESTIONS.default];
  if (lower.includes('anxiet') || lower.includes('stress') || lower.includes('panic'))
                                 questionSet = [...FOLLOWUP_QUESTIONS.anxiety,  ...FOLLOWUP_QUESTIONS.default];

  questionSet     = questionSet.slice(0, 3);
  followUpAnswers = {};

  const modal = document.createElement('div');
  modal.id        = 'followup-modal';
  modal.className = 'modal-overlay';

  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">🩺 A few quick questions</p>
        <button onclick="skipFollowUp()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;
          color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">This helps us give you much more accurate guidance.</p>

      <!-- Duration selector -->
      <div style="margin-bottom:24px;">
        <div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);
          text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
          ⏱️ How long have you had these symptoms?
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;" id="duration-options">
          ${DURATION_OPTIONS.map(d => `
            <button onclick="selectDuration('${d.id}', this)"
              style="padding:8px 14px;border:2px solid var(--border);border-radius:20px;
              background:var(--bg);font-size:0.8rem;color:var(--text-muted);cursor:pointer;
              font-family:'DM Sans',sans-serif;transition:all 0.2s;
              display:flex;align-items:center;gap:6px;">
              <span>${d.icon}</span> ${d.label}
            </button>`).join('')}
        </div>
      </div>

      <!-- Follow-up questions -->
      ${questionSet.map((q, i) => `
        <div style="margin-bottom:20px;">
          <div style="font-size:0.78rem;font-weight:600;color:var(--text-main);
            margin-bottom:10px;">${i + 1}. ${q.q}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="fq-${q.id}">
            ${q.options.map(opt => `
              <button onclick="selectFollowUp('${q.id}', '${opt.replace(/'/g,"\\'")}', this)"
                style="padding:7px 14px;border:2px solid var(--border);border-radius:12px;
                background:var(--bg);font-size:0.8rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;">
                ${opt}
              </button>`).join('')}
          </div>
        </div>`).join('')}

      <div class="modal-actions" style="margin-top:8px;">
        <button class="btn-cancel" onclick="skipFollowUp()">Skip</button>
        <button class="btn-save" onclick="submitFollowUp('${symptoms.replace(/'/g,"\\'")}')">
          Get Detailed Guidance →
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

// ── SELECT DURATION ──────────────────────────
function selectDuration(id, btn) {
  selectedDuration = id;
  document.querySelectorAll('#duration-options button').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.background  = 'var(--bg)';
    b.style.color       = 'var(--text-muted)';
  });
  btn.style.borderColor = 'var(--green-accent)';
  btn.style.background  = 'var(--green-light)';
  btn.style.color       = 'var(--green-dark)';
}

// ── SELECT FOLLOW-UP ANSWER ──────────────────
function selectFollowUp(qId, answer, btn) {
  followUpAnswers[qId] = answer;
  const container = document.getElementById('fq-' + qId);
  if (!container) return;
  container.querySelectorAll('button').forEach(b => {
    b.style.borderColor = 'var(--border)';
    b.style.background  = 'var(--bg)';
    b.style.color       = 'var(--text-muted)';
  });
  btn.style.borderColor = 'var(--green-accent)';
  btn.style.background  = 'var(--green-dark)';
  btn.style.color       = '#fff';
}

// ── SKIP FOLLOW-UP ───────────────────────────
function skipFollowUp() {
  const modal = document.getElementById('followup-modal');
  if (modal) modal.remove();
  triggerGuidance(null, null);
}

// ── SUBMIT FOLLOW-UP ─────────────────────────
async function submitFollowUp(symptoms) {
  const modal = document.getElementById('followup-modal');
  if (modal) modal.remove();

  const duration    = DURATION_OPTIONS.find(d => d.id === selectedDuration);
  const answerCount = Object.keys(followUpAnswers).length;

  // Toast confirmation
  let msg = '✓ ';
  if (duration)     msg += 'Duration: ' + duration.label;
  if (answerCount)  msg += ' · ' + answerCount + ' answers noted';
  if (typeof showToast === 'function') showToast(msg);

  // Show saved note below symptom box
  showAnswersSavedNote(duration, followUpAnswers);

  // Trigger guidance with full context
  await triggerGuidance(followUpAnswers, duration);
}

// ── SHOW SAVED NOTE ──────────────────────────
function showAnswersSavedNote(duration, answers) {
  const old = document.getElementById('followup-saved-note');
  if (old) old.remove();

  const answerCount = Object.keys(answers || {}).length;
  if (!duration && !answerCount) return;

  const note = document.createElement('div');
  note.id = 'followup-saved-note';
  note.style.cssText = [
    'background:var(--green-light)',
    'border:1px solid var(--border)',
    'border-radius:var(--radius-sm)',
    'padding:10px 14px',
    'margin-top:10px',
    'font-size:0.78rem',
    'color:var(--green-dark)',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'max-width:760px',
  ].join(';');

  const parts = [];
  if (duration)    parts.push('⏱️ Duration: ' + duration.label);
  if (answerCount) parts.push('🩺 ' + answerCount + ' follow-up answer' + (answerCount > 1 ? 's' : '') + ' saved');

  note.innerHTML =
    '<span style="font-size:1rem;">✅</span>' +
    '<span>' + parts.join(' · ') + ' — included in guidance below</span>' +
    '<button onclick="clearFollowUpAnswers()" style="margin-left:auto;background:none;' +
    'border:none;color:var(--green-dark);cursor:pointer;font-size:0.75rem;' +
    'font-family:DM Sans,sans-serif;text-decoration:underline;">Clear</button>';

  const symptomBox = document.querySelector('.symptom-box');
  if (symptomBox) symptomBox.after(note);
}

// ── CLEAR FOLLOW-UP ANSWERS ──────────────────
function clearFollowUpAnswers() {
  followUpAnswers  = {};
  selectedDuration = null;
  const note = document.getElementById('followup-saved-note');
  if (note) note.remove();
  if (typeof showToast === 'function') showToast('Follow-up answers cleared');
}

// ── BUILD FOLLOW-UP CONTEXT FOR PROMPT ───────
function buildFollowUpContext(answers, duration) {
  if (!answers && !duration) return '';

  let context = '\n\nAdditional patient information:';

  if (duration) {
    context += '\n- Symptom duration: ' + duration.label;
    if (duration.weight >= 4) {
      context += ' (IMPORTANT: symptoms lasting over 2 weeks need medical attention)';
    }
  }

  if (answers && Object.keys(answers).length) {
    context += '\n- Follow-up answers:';
    Object.entries(answers).forEach(function(entry) {
      context += '\n  • ' + entry[0] + ': ' + entry[1];
    });
  }

  return context;
}

// ── TRIGGER GUIDANCE WITH FULL CONTEXT ───────
async function triggerGuidance(answers, duration) {
  const input     = document.getElementById('symptom-input');
  const resultBox = document.getElementById('guidance-result');
  const bodyEl    = document.getElementById('guidance-body');
  const dot       = document.getElementById('guidance-dot');
  const val       = input ? input.value.trim() : '';
  if (!val) return;

  resultBox.style.display = 'block';
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (dot) dot.classList.add('pulsing');

  const urgencyBadge = document.getElementById('urgency-badge');
  if (urgencyBadge) urgencyBadge.style.display = 'none';

  bodyEl.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;padding:24px;' +
    'color:var(--text-muted);font-size:0.88rem;">' +
    'Analysing your symptoms' +
    '<div class="loading-dots"><span></span><span></span><span></span></div>' +
    '</div>';

  const followUpContext = buildFollowUpContext(answers, duration);
  const historyContext  = await buildHistoryContextSafe();

  let urgencyNote = '';
  if (duration && duration.weight >= 4) {
    urgencyNote = '\nNOTE: Symptoms lasting over 2 weeks — lean toward "doctor" or "urgent" urgency unless clearly benign.';
  }

  const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';

  const prompt =
    'You are CuraMind, a calm and caring AI wellness assistant.\n' +
    'The user describes: "' + val + '"\n' +
    followUpContext + '\n' +
    historyContext + '\n' +
    urgencyNote + '\n\n' +
    'Return ONLY a valid JSON object with exactly these fields:\n' +
    '{\n' +
    '  "urgency": "monitor" | "doctor" | "urgent",\n' +
    '  "what_you_might_experience": "2-3 sentence explanation",\n' +
    '  "possible_conditions": ["condition1", "condition2"],\n' +
    '  "gentle_next_steps": ["step1", "step2", "step3"],\n' +
    '  "when_to_see_doctor": "one sentence about warning signs",\n' +
    '  "duration_note": "one sentence about what the symptom duration means"\n' +
    '}\n' +
    'Never diagnose. Keep tone warm. Use simple language.';

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.4 }
      })
    });

    const data = await response.json();
    let raw = (data && data.candidates && data.candidates[0] &&
               data.candidates[0].content && data.candidates[0].content.parts &&
               data.candidates[0].content.parts[0] &&
               data.candidates[0].content.parts[0].text) || '';
    raw = raw.replace(/```json|```/g, '').trim();
    if (dot) dot.classList.remove('pulsing');

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      bodyEl.innerHTML =
        '<div style="padding:24px;font-size:0.88rem;color:var(--text-muted);' +
        'white-space:pre-wrap;">' + raw + '</div>';
      return;
    }

    if (typeof applyUrgencyBadge === 'function') {
      applyUrgencyBadge(parsed.urgency || 'monitor');
    }

    if (typeof renderStructuredResult === 'function') {
      if (parsed.duration_note && duration) {
        parsed.gentle_next_steps = parsed.gentle_next_steps || [];
        parsed.gentle_next_steps.unshift('⏱️ Duration note: ' + parsed.duration_note);
      }
      renderStructuredResult(parsed);
    }

    // Save to DB
    if (typeof SymptomsAPI !== 'undefined') {
      try {
        var saveText = val + (duration ? ' [Duration: ' + duration.label + ']' : '');
        await SymptomsAPI.log(saveText, raw);
        if (typeof showToast === 'function') showToast('✓ Symptom log saved');
        if (typeof loadSymptomHistory === 'function')    await loadSymptomHistory();
        if (typeof renderSymptomTimeline === 'function') await renderSymptomTimeline();
      } catch (e) { /* silent */ }
    }

  } catch (err) {
    if (dot) dot.classList.remove('pulsing');
    bodyEl.innerHTML =
      '<div style="padding:20px 24px;color:#c0392b;font-size:0.88rem;">' +
      '❌ ' + err.message + '</div>';
  }
}

// ── BUILD HISTORY CONTEXT ─────────────────────
async function buildHistoryContextSafe() {
  try {
    if (typeof SymptomsAPI === 'undefined') return '';
    const rows = await SymptomsAPI.getAll();
    if (!rows.length) return '';
    const recent = rows.slice(0, 3).map(function(r) {
      return '- ' + r.date + ': "' + r.symptoms + '"';
    }).join('\n');
    return '\nRecent symptom history:\n' + recent;
  } catch (e) {
    return '';
  }
}

// ── OPEN FOLLOW-UP FROM BUTTON ────────────────
function openFollowUpFromBtn() {
  const input = document.getElementById('symptom-input');
  const val   = input ? input.value.trim() : '';
  if (!val) {
    if (typeof showToast === 'function') showToast('Please describe your symptoms first');
    return;
  }
  followUpAnswers  = {};
  selectedDuration = null;
  openFollowUpFlow(val);
}