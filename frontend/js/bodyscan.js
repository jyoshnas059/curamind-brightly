// ─────────────────────────────────────────────
//  CuraMind · bodyscan.js
//  Save to: frontend/js/bodyscan.js
//  NOTE: Body scan is a guided AUDIO meditation
//  (no camera needed — "body scan" in meditation
//   means mentally scanning from head to toe)
// ─────────────────────────────────────────────

const BODY_SCAN_STEPS = [
  { area: 'Head & Scalp',    icon: '🧠', duration: 5, instruction: 'Close your eyes. Notice the top of your head. Feel any tension in your scalp — let it soften.' },
  { area: 'Face & Jaw',      icon: '😌', duration: 5, instruction: 'Relax your forehead. Unclench your jaw. Let your cheeks and eyes soften completely.' },
  { area: 'Neck & Shoulders',icon: '🔄', duration: 5, instruction: 'Feel the weight of your shoulders. Let them drop away from your ears. Release all tension.' },
  { area: 'Chest & Heart',   icon: '🫀', duration: 5, instruction: 'Notice your breath moving in and out. Feel your chest rise and fall. Let it be easy.' },
  { area: 'Arms & Hands',    icon: '🙌', duration: 5, instruction: 'Let your arms feel heavy. Relax your elbows, wrists, and fingers. Feel the warmth in your palms.' },
  { area: 'Stomach & Core',  icon: '🌀', duration: 5, instruction: 'Soften your belly. Let your abdomen expand freely with each breath. No holding.' },
  { area: 'Lower Back',      icon: '🪑', duration: 5, instruction: 'Notice your lower back. If there is tension, breathe into it and let it melt away.' },
  { area: 'Hips & Pelvis',   icon: '⚖️', duration: 5, instruction: 'Feel the support beneath you. Let your hips release. Ground yourself here.' },
  { area: 'Thighs & Knees',  icon: '🦵', duration: 5, instruction: 'Relax the large muscles of your thighs. Let your knees soften. Feel the heaviness.' },
  { area: 'Calves & Feet',   icon: '🦶', duration: 5, instruction: 'Travel down to your calves, ankles, and feet. Wiggle your toes and let everything go.' },
  { area: 'Whole Body',      icon: '✨', duration: 5, instruction: 'Now feel your entire body at once — heavy, warm, and completely relaxed. You are here.' },
];

let scanTimer   = null;
let scanRunning = false;
let scanStep    = 0;
let scanSeconds = 0;

function openBodyScan() {
  const existing = document.getElementById('bodyscan-modal');
  if (existing) existing.remove();
  scanStep = 0; scanSeconds = 0; scanRunning = false;

  const modal = document.createElement('div');
  modal.id = 'bodyscan-modal';
  modal.className = 'modal-overlay';
  modal.style.background   = 'rgba(10,20,30,0.9)';
  modal.style.backdropFilter = 'blur(10px)';

  modal.innerHTML = `
    <div style="width:100%;max-width:480px;padding:20px;text-align:center;">

      <!-- Header -->
      <div style="margin-bottom:24px;">
        <div style="font-size:2rem;margin-bottom:8px;">🧘</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:#fff;
          font-weight:700;margin-bottom:6px;">Body Scan</h2>
        <p style="font-size:0.83rem;color:rgba(255,255,255,0.6);">
          A guided meditation — softening tension from head to toe.
        </p>
      </div>

      <!-- Body figure -->
      <div style="position:relative;width:120px;height:220px;margin:0 auto 24px;">
        <svg viewBox="0 0 120 220" style="width:100%;height:100%;opacity:0.4;">
          <ellipse cx="60" cy="22" rx="18" ry="20" fill="#a8d5b5" id="body-head"/>
          <rect x="42" y="44" width="36" height="50" rx="8" fill="#a8d5b5" id="body-torso"/>
          <rect x="20" y="46" width="20" height="44" rx="8" fill="#a8d5b5" id="body-left-arm"/>
          <rect x="80" y="46" width="20" height="44" rx="8" fill="#a8d5b5" id="body-right-arm"/>
          <rect x="44" y="96" width="28" height="54" rx="8" fill="#a8d5b5" id="body-hips"/>
          <rect x="44" y="150" width="12" height="50" rx="6" fill="#a8d5b5" id="body-left-leg"/>
          <rect x="64" y="150" width="12" height="50" rx="6" fill="#a8d5b5" id="body-right-leg"/>
        </svg>
        <div id="scan-highlight" style="position:absolute;inset:0;pointer-events:none;"></div>
      </div>

      <!-- Current step card -->
      <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
        border-radius:16px;padding:20px;margin-bottom:20px;min-height:110px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div id="scan-area-icon" style="font-size:1.6rem;margin-bottom:6px;">🧘</div>
        <div id="scan-area-name" style="font-size:1rem;font-weight:600;color:#fff;
          margin-bottom:8px;">Press Start to begin</div>
        <div id="scan-instruction" style="font-size:0.8rem;color:rgba(255,255,255,0.65);
          line-height:1.6;max-width:340px;">
          Find a comfortable position — seated or lying down. Close your eyes.
        </div>
      </div>

      <!-- Timer + progress -->
      <div style="margin-bottom:20px;">
        <div id="scan-timer" style="font-family:'Playfair Display',serif;font-size:2.2rem;
          font-weight:700;color:#fff;margin-bottom:8px;">—</div>
        <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:4px;overflow:hidden;">
          <div id="scan-progress-bar" style="height:100%;background:#a8d5b5;
            border-radius:4px;width:0%;transition:width 1s linear;"></div>
        </div>
        <div id="scan-step-label" style="font-size:0.72rem;color:rgba(255,255,255,0.5);
          margin-top:6px;">Step 0 of ${BODY_SCAN_STEPS.length}</div>
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="scan-start-btn" onclick="toggleScan()"
          style="background:#fff;color:#1e3a2f;border:none;padding:13px 36px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.92rem;
          font-weight:600;cursor:pointer;min-width:120px;transition:all 0.2s;"
          onmouseover="this.style.transform='scale(1.04)'"
          onmouseout="this.style.transform='scale(1)'">
          ▶ Start
        </button>
        <button onclick="closeBodyScan()"
          style="background:transparent;color:rgba(255,255,255,0.6);
          border:1px solid rgba(255,255,255,0.2);padding:13px 24px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.88rem;cursor:pointer;">
          Close
        </button>
      </div>

    </div>`;

  document.body.appendChild(modal);
}

function toggleScan() {
  if (scanRunning) {
    pauseScan();
    document.getElementById('scan-start-btn').textContent = '▶ Resume';
  } else {
    startScan();
    document.getElementById('scan-start-btn').textContent = '⏸ Pause';
  }
}

function startScan() {
  scanRunning = true;
  if (scanSeconds === 0) scanSeconds = BODY_SCAN_STEPS[scanStep].duration;
  scanTimer = setInterval(() => {
    scanSeconds--;
    const step = BODY_SCAN_STEPS[scanStep];
    const totalSecs = step.duration;
    const pct = ((totalSecs - scanSeconds) / totalSecs) * 100;

    document.getElementById('scan-timer').textContent         = scanSeconds + 's';
    document.getElementById('scan-progress-bar').style.width  = pct + '%';
    document.getElementById('scan-area-icon').textContent     = step.icon;
    document.getElementById('scan-area-name').textContent     = step.area;
    document.getElementById('scan-instruction').textContent   = step.instruction;
    document.getElementById('scan-step-label').textContent    =
      `Step ${scanStep + 1} of ${BODY_SCAN_STEPS.length}`;

    if (scanSeconds <= 0) {
      scanStep++;
      if (scanStep >= BODY_SCAN_STEPS.length) {
        clearInterval(scanTimer);
        scanRunning = false;
        document.getElementById('scan-area-icon').textContent     = '🌟';
        document.getElementById('scan-area-name').textContent     = 'Complete';
        document.getElementById('scan-instruction').textContent   =
          'Beautiful. Take a deep breath and gently open your eyes when ready.';
        document.getElementById('scan-timer').textContent         = '✅';
        document.getElementById('scan-progress-bar').style.width  = '100%';
        document.getElementById('scan-start-btn').textContent     = 'Done';
        if (typeof showToast === 'function') showToast('🧘 Body scan complete!');
        return;
      }
      scanSeconds = BODY_SCAN_STEPS[scanStep].duration;
      document.getElementById('scan-progress-bar').style.width = '0%';
    }
  }, 1000);
}

function pauseScan() {
  scanRunning = false;
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
}

function closeBodyScan() {
  pauseScan();
  const modal = document.getElementById('bodyscan-modal');
  if (modal) modal.remove();
}