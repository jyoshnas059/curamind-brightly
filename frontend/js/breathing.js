// ─────────────────────────────────────────────
//  CuraMind · breathing.js
//  Save to: frontend/js/breathing.js
//  Add in index.html before </body>:
//  <script src="js/breathing.js"></script>
// ─────────────────────────────────────────────

const BREATHING_EXERCISES = {
  box: {
    name: 'Box Breathing',
    icon: '💨',
    description: 'Inhale, hold, exhale, hold — each for 4 seconds.',
    color: '#3b82f6',
    bg: '#eff6ff',
    phases: [
      { label: 'Inhale',  duration: 4, instruction: 'Breathe in slowly through your nose' },
      { label: 'Hold',    duration: 4, instruction: 'Hold gently — stay still'             },
      { label: 'Exhale',  duration: 4, instruction: 'Breathe out slowly through your mouth'},
      { label: 'Hold',    duration: 4, instruction: 'Rest — empty and still'               },
    ],
    totalCycles: 6
  },
  deep: {
    name: '4-7-8 Breathing',
    icon: '🌬️',
    description: 'Inhale 4s, hold 7s, exhale 8s — deeply calming.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    phases: [
      { label: 'Inhale', duration: 4, instruction: 'Breathe in quietly through your nose'  },
      { label: 'Hold',   duration: 7, instruction: 'Hold your breath gently'               },
      { label: 'Exhale', duration: 8, instruction: 'Exhale completely through your mouth'  },
    ],
    totalCycles: 4
  },
  calm: {
    name: 'Calm Breathing',
    icon: '🌿',
    description: 'Simple 5-5 breathing to reduce anxiety.',
    color: '#10b981',
    bg: '#ecfdf5',
    phases: [
      { label: 'Inhale', duration: 5, instruction: 'Breathe in slowly and deeply'          },
      { label: 'Exhale', duration: 5, instruction: 'Let it all go — fully exhale'          },
    ],
    totalCycles: 8
  }
};

let breathingTimer   = null;
let breathingRunning = false;
let currentCycle     = 0;
let currentPhase     = 0;
let currentExercise  = null;
let phaseSeconds     = 0;

function openBreathing(type) {
  currentExercise = BREATHING_EXERCISES[type];
  const ex = currentExercise;

  const existing = document.getElementById('breathing-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'breathing-modal';
  modal.className = 'modal-overlay';
  modal.style.background = 'rgba(10,30,20,0.85)';
  modal.style.backdropFilter = 'blur(8px)';

  modal.innerHTML = `
    <div style="width:100%;max-width:420px;text-align:center;padding:20px;">

      <!-- Header -->
      <div style="margin-bottom:28px;">
        <div style="font-size:2rem;margin-bottom:8px;">${ex.icon}</div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.6rem;color:#fff;
          font-weight:700;margin-bottom:6px;">${ex.name}</h2>
        <p style="font-size:0.85rem;color:rgba(255,255,255,0.65);">${ex.description}</p>
      </div>

      <!-- Breathing circle -->
      <div style="position:relative;width:200px;height:200px;margin:0 auto 28px;">
        <!-- Outer pulse ring -->
        <div id="br-ring" style="position:absolute;inset:-20px;border-radius:50%;
          background:rgba(255,255,255,0.08);transition:transform 1s ease;"></div>
        <!-- Main circle -->
        <div id="br-circle" style="position:absolute;inset:0;border-radius:50%;
          background:${ex.bg};border:3px solid ${ex.color};
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          transition:transform 1s ease, background 1s ease;">
          <div id="br-phase" style="font-size:1.1rem;font-weight:700;color:${ex.color};
            margin-bottom:4px;">Ready</div>
          <div id="br-countdown" style="font-family:'Playfair Display',serif;
            font-size:2.8rem;font-weight:700;color:#1a2e1e;">—</div>
          <div id="br-instruction" style="font-size:0.7rem;color:#6b7b6e;
            max-width:120px;line-height:1.4;margin-top:4px;">Press Start</div>
        </div>
      </div>

      <!-- Cycle progress -->
      <div style="margin-bottom:24px;">
        <div id="br-cycles-label" style="font-size:0.78rem;color:rgba(255,255,255,0.6);
          margin-bottom:8px;">Cycle 0 of ${ex.totalCycles}</div>
        <div style="display:flex;gap:6px;justify-content:center;" id="br-dots">
          ${Array(ex.totalCycles).fill(0).map((_,i) =>
            `<div id="br-dot-${i}" style="width:8px;height:8px;border-radius:50%;
              background:rgba(255,255,255,0.2);transition:background 0.3s;"></div>`
          ).join('')}
        </div>
      </div>

      <!-- Exercise selector -->
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:24px;">
        ${Object.entries(BREATHING_EXERCISES).map(([key, e]) => `
          <button onclick="switchBreathing('${key}')"
            style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.2);
            background:${key === type ? 'rgba(255,255,255,0.15)' : 'transparent'};
            color:rgba(255,255,255,0.8);font-size:0.75rem;cursor:pointer;
            font-family:'DM Sans',sans-serif;transition:all 0.2s;"
            id="br-sel-${key}">${e.icon} ${e.name}</button>`).join('')}
      </div>

      <!-- Controls -->
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="br-start-btn" onclick="toggleBreathing()"
          style="background:white;color:#1e3a2f;border:none;padding:13px 36px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.92rem;
          font-weight:600;cursor:pointer;transition:all 0.2s;min-width:120px;"
          onmouseover="this.style.transform='scale(1.04)'"
          onmouseout="this.style.transform='scale(1)'">
          ▶ Start
        </button>
        <button onclick="closeBreathing()"
          style="background:transparent;color:rgba(255,255,255,0.6);
          border:1px solid rgba(255,255,255,0.2);padding:13px 24px;
          border-radius:28px;font-family:'DM Sans',sans-serif;font-size:0.88rem;
          cursor:pointer;transition:all 0.2s;">
          Close
        </button>
      </div>

    </div>`;

  document.body.appendChild(modal);
  breathingRunning = false;
  currentCycle = 0;
  currentPhase = 0;
}

function switchBreathing(type) {
  stopBreathing();
  openBreathing(type);
}

function toggleBreathing() {
  if (breathingRunning) {
    stopBreathing();
    document.getElementById('br-start-btn').textContent = '▶ Resume';
  } else {
    startBreathing();
    document.getElementById('br-start-btn').textContent = '⏸ Pause';
  }
}

function startBreathing() {
  breathingRunning = true;
  const ex = currentExercise;
  if (currentCycle === 0 && currentPhase === 0) phaseSeconds = ex.phases[0].duration;

  breathingTimer = setInterval(() => {
    phaseSeconds--;

    const phase = ex.phases[currentPhase];
    const circle = document.getElementById('br-circle');
    const ring   = document.getElementById('br-ring');

    document.getElementById('br-phase').textContent       = phase.label;
    document.getElementById('br-countdown').textContent   = phaseSeconds;
    document.getElementById('br-instruction').textContent = phase.instruction;

    // Circle animation
    if (phase.label === 'Inhale') {
      circle.style.transform = `scale(${1 + (ex.phases[0].duration - phaseSeconds) * 0.02})`;
      ring.style.transform   = `scale(${1 + (ex.phases[0].duration - phaseSeconds) * 0.03})`;
      circle.style.background = ex.bg;
    } else if (phase.label === 'Exhale') {
      const maxScale = 1 + ex.phases[0].duration * 0.02;
      circle.style.transform  = `scale(${maxScale - phaseSeconds * 0.02})`;
      ring.style.transform    = `scale(${maxScale - phaseSeconds * 0.03})`;
    } else {
      // Hold
      circle.style.background = `${ex.bg}cc`;
    }

    if (phaseSeconds <= 0) {
      currentPhase++;
      if (currentPhase >= ex.phases.length) {
        currentPhase = 0;
        currentCycle++;
        const dot = document.getElementById(`br-dot-${currentCycle - 1}`);
        if (dot) dot.style.background = 'white';
        document.getElementById('br-cycles-label').textContent =
          `Cycle ${currentCycle} of ${ex.totalCycles}`;

        if (currentCycle >= ex.totalCycles) {
          stopBreathing();
          finishBreathing();
          return;
        }
      }
      phaseSeconds = ex.phases[currentPhase].duration;
    }
  }, 1000);
}

function stopBreathing() {
  breathingRunning = false;
  if (breathingTimer) { clearInterval(breathingTimer); breathingTimer = null; }
}

function finishBreathing() {
  const circle = document.getElementById('br-circle');
  if (circle) {
    circle.style.background = '#eef5ee';
    document.getElementById('br-phase').textContent       = '✅ Done!';
    document.getElementById('br-countdown').textContent   = '🌿';
    document.getElementById('br-instruction').textContent = 'Well done. Take a moment.';
    document.getElementById('br-start-btn').textContent   = '↺ Restart';
    document.getElementById('br-start-btn').onclick = () => {
      currentCycle = 0; currentPhase = 0; phaseSeconds = 0;
      document.getElementById('br-start-btn').textContent = '▶ Start';
      document.getElementById('br-start-btn').onclick = toggleBreathing;
      document.querySelectorAll('[id^="br-dot-"]').forEach(d => d.style.background = 'rgba(255,255,255,0.2)');
      document.getElementById('br-cycles-label').textContent = `Cycle 0 of ${currentExercise.totalCycles}`;
    };
  }
  if (typeof showToast === 'function') showToast('🌿 Breathing session complete!');
}

function closeBreathing() {
  stopBreathing();
  const modal = document.getElementById('breathing-modal');
  if (modal) modal.remove();
}