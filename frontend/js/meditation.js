// ─────────────────────────────────────────────
//  CuraMind · meditation.js
//  Save to: frontend/js/meditation.js
//  Covers: Body Scan (guided) + Loving Kindness
// ─────────────────────────────────────────────

const LOVING_KINDNESS_STEPS = [
  { title: 'Begin with yourself',   icon: '🫀', duration: 5,
    instruction: 'Place a hand on your heart. Silently say: "May I be happy. May I be healthy. May I be at peace. May I be free from suffering."' },
  { title: 'Someone you love',      icon: '💚', duration: 5,
    instruction: 'Think of someone you love deeply. Visualise them smiling. Say: "May you be happy. May you be healthy. May you be at peace."' },
  { title: 'A neutral person',      icon: '🤝', duration: 5,
    instruction: 'Think of someone you neither like nor dislike — a neighbour or shop keeper. Extend the same warmth: "May you be happy. May you be at peace."' },
  { title: 'A difficult person',    icon: '🌱', duration: 5,
    instruction: 'This is hard — but powerful. Think of someone who has caused you difficulty. Offer: "May you be happy. May you find peace." You don\'t have to like them.' },
  { title: 'All living beings',     icon: '🌍', duration: 5,
    instruction: 'Expand your heart outward — your street, your city, the whole world. "May all beings be happy. May all beings be free from suffering."' },
  { title: 'Rest in openness',      icon: '✨', duration: 5,
    instruction: 'Let go of all images. Simply sit with an open, warm heart. Nothing to do, nowhere to go. Just be here, in kindness.' },
];

let meditTimer   = null;
let meditRunning = false;
let meditStep    = 0;
let meditSecs    = 0;
let meditType    = '';

function openMeditation(type) {
  meditType = type;
  if (type === 'bodyscan') { openBodyScan(); return; }

  const existing = document.getElementById('medit-modal');
  if (existing) existing.remove();
  meditStep = 0; meditSecs = 0; meditRunning = false;

  const steps = LOVING_KINDNESS_STEPS;
  const modal = document.createElement('div');
  modal.id = 'medit-modal';
  modal.className = 'modal-overlay';
  modal.style.background    = 'rgba(8,16,28,0.92)';
  modal.style.backdropFilter = 'blur(12px)';

  modal.innerHTML = `
    <div style="width:100%;max-width:460px;padding:24px;text-align:center;">
      <div style="font-size:2rem;margin-bottom:8px;">💚</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:#fff;
        font-weight:700;margin-bottom:6px;">Loving Kindness</h2>
      <p style="font-size:0.83rem;color:rgba(255,255,255,0.55);margin-bottom:28px;">
        Offer warmth — to yourself, then others.
      </p>

      <!-- Step card -->
      <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
        border-radius:16px;padding:24px;margin-bottom:24px;min-height:160px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div id="lk-icon" style="font-size:2rem;margin-bottom:10px;">🫀</div>
        <div id="lk-title" style="font-size:1rem;font-weight:600;color:#fff;
          margin-bottom:10px;">Press Start</div>
        <div id="lk-instruction" style="font-size:0.82rem;color:rgba(255,255,255,0.65);
          line-height:1.7;font-style:italic;">
          Find a quiet place and sit comfortably. Close your eyes when ready.
        </div>
      </div>

      <!-- Timer -->
      <div style="margin-bottom:8px;">
        <div id="lk-timer" style="font-family:'Playfair Display',serif;font-size:2.4rem;
          font-weight:700;color:#fff;">—</div>
      </div>

      <!-- Progress dots -->
      <div style="display:flex;justify-content:center;gap:8px;margin-bottom:24px;">
        ${steps.map((_,i) => `<div id="lk-dot-${i}" style="width:8px;height:8px;border-radius:50%;
          background:rgba(255,255,255,0.2);transition:all 0.3s;"></div>`).join('')}
      </div>
      <div id="lk-step-label" style="font-size:0.72rem;color:rgba(255,255,255,0.4);margin-bottom:20px;">
        Step 0 of ${steps.length}
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="lk-start-btn" onclick="toggleMeditation()"
          style="background:#fff;color:#1e3a2f;border:none;padding:13px 36px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.92rem;
          font-weight:600;cursor:pointer;min-width:120px;transition:all 0.2s;"
          onmouseover="this.style.transform='scale(1.04)'"
          onmouseout="this.style.transform='scale(1)'">▶ Start</button>
        <button onclick="closeMeditation()"
          style="background:transparent;color:rgba(255,255,255,0.6);
          border:1px solid rgba(255,255,255,0.2);padding:13px 24px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.88rem;cursor:pointer;">
          Close
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function toggleMeditation() {
  if (meditRunning) {
    meditRunning = false;
    clearInterval(meditTimer);
    document.getElementById('lk-start-btn').textContent = '▶ Resume';
  } else {
    meditRunning = true;
    if (meditSecs === 0) meditSecs = LOVING_KINDNESS_STEPS[meditStep].duration;
    document.getElementById('lk-start-btn').textContent = '⏸ Pause';
    meditTimer = setInterval(() => {
      meditSecs--;
      const step = LOVING_KINDNESS_STEPS[meditStep];
      document.getElementById('lk-icon').textContent        = step.icon;
      document.getElementById('lk-title').textContent       = step.title;
      document.getElementById('lk-instruction').textContent = step.instruction;
      document.getElementById('lk-timer').textContent       = meditSecs + 's';
      document.getElementById('lk-step-label').textContent  =
        `Step ${meditStep + 1} of ${LOVING_KINDNESS_STEPS.length}`;
      document.getElementById(`lk-dot-${meditStep}`).style.background = '#a8d5b5';

      if (meditSecs <= 0) {
        meditStep++;
        if (meditStep >= LOVING_KINDNESS_STEPS.length) {
          clearInterval(meditTimer);
          document.getElementById('lk-icon').textContent        = '🌟';
          document.getElementById('lk-title').textContent       = 'Complete';
          document.getElementById('lk-instruction').textContent =
            'Gently open your eyes. Carry this warmth with you.';
          document.getElementById('lk-timer').textContent       = '✅';
          document.getElementById('lk-start-btn').textContent   = 'Done';
          if (typeof showToast === 'function') showToast('💚 Loving Kindness complete!');
          return;
        }
        meditSecs = LOVING_KINDNESS_STEPS[meditStep].duration;
      }
    }, 1000);
  }
}

function closeMeditation() {
  meditRunning = false;
  if (meditTimer) clearInterval(meditTimer);
  ['medit-modal','bodyscan-modal'].forEach(id => {
    const m = document.getElementById(id);
    if (m) m.remove();
  });
}