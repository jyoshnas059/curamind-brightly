// ─────────────────────────────────────────────
//  CuraMind · fitness.js
//  Save to: frontend/js/fitness.js
//  Add in index.html before </body>:
//  <script src="js/fitness.js"></script>
// ─────────────────────────────────────────────

const WORKOUT_TYPES = [
  { id: 'walking',    icon: '🚶', name: 'Walking',       metFactor: 3.5  },
  { id: 'running',    icon: '🏃', name: 'Running',       metFactor: 9.0  },
  { id: 'cycling',    icon: '🚴', name: 'Cycling',       metFactor: 7.5  },
  { id: 'swimming',   icon: '🏊', name: 'Swimming',      metFactor: 8.0  },
  { id: 'yoga',       icon: '🧘', name: 'Yoga',          metFactor: 3.0  },
  { id: 'gym',        icon: '🏋️', name: 'Gym/Weights',   metFactor: 6.0  },
  { id: 'hiit',       icon: '⚡', name: 'HIIT',          metFactor: 10.0 },
  { id: 'dancing',    icon: '💃', name: 'Dancing',       metFactor: 5.0  },
  { id: 'sports',     icon: '⚽', name: 'Sports',        metFactor: 7.0  },
  { id: 'stretching', icon: '🤸', name: 'Stretching',    metFactor: 2.5  },
  { id: 'stairs',     icon: '🪜', name: 'Stair Climbing',metFactor: 8.0  },
  { id: 'other',      icon: '🏅', name: 'Other',         metFactor: 5.0  },
];

// Storage
function getFitnessLogs() {
  try { return JSON.parse(localStorage.getItem('cm_fitness_logs') || '[]'); } catch { return []; }
}
function saveFitnessLogs(logs) { localStorage.setItem('cm_fitness_logs', JSON.stringify(logs)); }
function getStepsLog() {
  try { return JSON.parse(localStorage.getItem('cm_steps_log') || '[]'); } catch { return []; }
}
function saveStepsLog(logs) { localStorage.setItem('cm_steps_log', JSON.stringify(logs)); }

function getUserWeightKg() {
  try {
    const p = JSON.parse(localStorage.getItem('cm_profile') || '{}');
    return p.weight || 65;
  } catch { return 65; }
}

// Calculate calories burned
// Formula: Calories = MET × weight(kg) × duration(hours)
function calcCaloriesBurned(metFactor, durationMins, weightKg) {
  return Math.round(metFactor * weightKg * (durationMins / 60));
}

// ── OPEN FITNESS TRACKER ─────────────────────
function openFitnessTracker() {
  const ex = document.getElementById('fitness-modal');
  if (ex) ex.remove();

  const logs    = getFitnessLogs();
  const today   = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.date).toDateString() === today);
  const totalCal  = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalMins = todayLogs.reduce((s, l) => s + (l.duration || 0), 0);
  const stepsToday = getStepsLog().find(s => new Date(s.date).toDateString() === today);

  const modal = document.createElement('div');
  modal.id = 'fitness-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">🏃 Fitness Tracker</p>
        <button onclick="document.getElementById('fitness-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Log workouts and track your daily steps.</p>

      <!-- Today summary -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
        ${summaryCard('🔥', 'Calories Burned', totalCal + ' kcal', 'today')}
        ${summaryCard('⏱️', 'Active Time', totalMins + ' mins', 'today')}
        ${summaryCard('👣', 'Steps', stepsToday ? stepsToday.steps.toLocaleString() : '—', 'today')}
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:20px;">
        <button id="fit-tab-workout" onclick="fitTab('workout')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">💪 Log Workout</button>
        <button id="fit-tab-steps" onclick="fitTab('steps')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">👣 Log Steps</button>
        <button id="fit-tab-history" onclick="fitTab('history')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">📊 History</button>
      </div>

      <!-- WORKOUT TAB -->
      <div id="fit-workout">
        <p style="font-size:0.78rem;font-weight:500;color:var(--text-muted);
          margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">Select Workout Type</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
          ${WORKOUT_TYPES.map(w => `
            <div onclick="selectWorkout('${w.id}')" id="wt-${w.id}"
              style="padding:12px 8px;border:2px solid var(--border);border-radius:var(--radius-sm);
              background:var(--bg);text-align:center;cursor:pointer;transition:all 0.2s;">
              <div style="font-size:1.4rem;margin-bottom:4px;">${w.icon}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);font-weight:500;">${w.name}</div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;
              margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em;">Duration (minutes)</label>
            <input type="number" id="workout-duration" placeholder="30" min="1" max="300"
              oninput="updateCalPreview()"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;
              margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em;">Intensity</label>
            <select id="workout-intensity" oninput="updateCalPreview()"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;">
              <option value="0.8">Light</option>
              <option value="1.0" selected>Moderate</option>
              <option value="1.3">Intense</option>
            </select>
          </div>
        </div>

        <!-- Calories preview -->
        <div id="cal-preview" style="background:var(--green-light);border-radius:var(--radius-sm);
          padding:12px 16px;margin-bottom:12px;display:none;
          display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.2rem;">🔥</span>
          <div>
            <div style="font-size:0.72rem;color:var(--green-dark);font-weight:500;
              text-transform:uppercase;letter-spacing:0.06em;">Estimated Calories Burned</div>
            <div id="cal-preview-val" style="font-family:'Playfair Display',serif;
              font-size:1.4rem;font-weight:700;color:var(--green-dark);">—</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:0.72rem;color:var(--text-muted);display:block;
            margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em;">Notes (optional)</label>
          <input type="text" id="workout-note" placeholder="e.g. Morning run in the park"
            style="width:100%;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
            font-size:0.88rem;color:var(--text-main);outline:none;"/>
        </div>

        <button onclick="saveWorkout()" class="btn-save" style="width:100%;">
          ✓ Log Workout
        </button>
      </div>

      <!-- STEPS TAB -->
      <div id="fit-steps" style="display:none;">
        <div style="background:var(--bg);border:1px solid var(--border);
          border-radius:var(--radius-sm);padding:20px;margin-bottom:16px;text-align:center;">
          <div style="font-size:3rem;margin-bottom:8px;">👣</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">
            Enter your step count for today
          </div>
          <input type="number" id="steps-input" placeholder="e.g. 8000" min="0" max="100000"
            oninput="updateStepsPreview()"
            style="width:100%;background:var(--bg-card);border:2px solid var(--border);
            border-radius:var(--radius-sm);padding:14px;font-family:'Playfair Display',serif;
            font-size:1.8rem;font-weight:700;color:var(--text-main);outline:none;
            text-align:center;margin-bottom:12px;"
            onfocus="this.style.borderColor='var(--green-accent)'"
            onblur="this.style.borderColor='var(--border)'" />

          <div id="steps-preview" style="display:none;margin-bottom:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              ${summaryCard('📏', 'Distance', '<span id="steps-dist">—</span>', 'km approx')}
              ${summaryCard('🔥', 'Calories', '<span id="steps-cal">—</span>', 'kcal burned')}
            </div>
            <div style="margin-top:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:0.72rem;color:var(--text-muted);">Goal progress</span>
                <span id="steps-pct" style="font-size:0.72rem;color:var(--green-accent);font-weight:500;"></span>
              </div>
              <div style="height:6px;background:var(--green-light);border-radius:4px;overflow:hidden;">
                <div id="steps-progress" style="height:100%;background:var(--green-accent);
                  border-radius:4px;width:0%;transition:width 0.5s ease;"></div>
              </div>
            </div>
          </div>

          <button onclick="saveSteps()" class="btn-save" style="width:100%;">
            ✓ Log Steps
          </button>
        </div>
      </div>

      <!-- HISTORY TAB -->
      <div id="fit-history" style="display:none;">
        <div id="fitness-history-content"></div>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

let selectedWorkoutId = null;

function selectWorkout(id) {
  selectedWorkoutId = id;
  WORKOUT_TYPES.forEach(w => {
    const el = document.getElementById(`wt-${w.id}`);
    if (!el) return;
    el.style.borderColor = w.id === id ? 'var(--green-accent)' : 'var(--border)';
    el.style.background  = w.id === id ? 'var(--green-light)' : 'var(--bg)';
  });
  updateCalPreview();
}

function updateCalPreview() {
  const duration  = parseFloat(document.getElementById('workout-duration')?.value) || 0;
  const intensity = parseFloat(document.getElementById('workout-intensity')?.value) || 1.0;
  const workout   = WORKOUT_TYPES.find(w => w.id === selectedWorkoutId);
  const preview   = document.getElementById('cal-preview');
  const valEl     = document.getElementById('cal-preview-val');
  if (!duration || !workout) { if (preview) preview.style.display = 'none'; return; }
  const cals = calcCaloriesBurned(workout.metFactor * intensity, duration, getUserWeightKg());
  if (preview) preview.style.display = 'flex';
  if (valEl)   valEl.textContent = cals + ' kcal';
}

function updateStepsPreview() {
  const steps   = parseInt(document.getElementById('steps-input')?.value) || 0;
  const preview = document.getElementById('steps-preview');
  if (!steps) { if (preview) preview.style.display = 'none'; return; }
  if (preview) preview.style.display = 'block';

  const distKm  = (steps * 0.000762).toFixed(2);
  const calsBurned = Math.round(steps * 0.04 * (getUserWeightKg() / 70));
  const targets = JSON.parse(localStorage.getItem('cm_targets') || '{}');
  const goal    = targets.steps || 10000;
  const pct     = Math.min((steps / goal) * 100, 100).toFixed(0);

  const distEl = document.getElementById('steps-dist');
  const calEl  = document.getElementById('steps-cal');
  const pctEl  = document.getElementById('steps-pct');
  const progEl = document.getElementById('steps-progress');

  if (distEl) distEl.textContent = distKm + ' km';
  if (calEl)  calEl.textContent  = calsBurned + ' kcal';
  if (pctEl)  pctEl.textContent  = pct + '% of goal';
  if (progEl) progEl.style.width = pct + '%';
}

function saveWorkout() {
  if (!selectedWorkoutId) { showToast('Please select a workout type'); return; }
  const duration  = parseInt(document.getElementById('workout-duration').value);
  if (!duration)  { showToast('Please enter duration'); return; }
  const intensity = parseFloat(document.getElementById('workout-intensity').value);
  const workout   = WORKOUT_TYPES.find(w => w.id === selectedWorkoutId);
  const calories  = calcCaloriesBurned(workout.metFactor * intensity, duration, getUserWeightKg());
  const note      = document.getElementById('workout-note').value.trim();

  const logs = getFitnessLogs();
  logs.unshift({ id: Date.now(), type: workout.name, icon: workout.icon,
    duration, intensity, calories, note, date: new Date().toISOString() });
  saveFitnessLogs(logs);

  showToast(`${workout.icon} ${workout.name} logged — ${calories} kcal burned!`);
  document.getElementById('fitness-modal').remove();
  updateLifestylePage();
}

function saveSteps() {
  const steps = parseInt(document.getElementById('steps-input').value);
  if (!steps || steps < 0) { showToast('Please enter valid steps'); return; }

  const logs = getStepsLog();
  const today = new Date().toDateString();
  const existing = logs.findIndex(l => new Date(l.date).toDateString() === today);
  const entry = { steps, date: new Date().toISOString(),
    distance: (steps * 0.000762).toFixed(2),
    calories: Math.round(steps * 0.04 * (getUserWeightKg() / 70)) };

  if (existing >= 0) logs[existing] = entry;
  else logs.unshift(entry);
  saveStepsLog(logs);

  showToast(`👣 ${steps.toLocaleString()} steps logged!`);
  document.getElementById('fitness-modal').remove();
  updateLifestylePage();
}

function fitTab(tab) {
  ['workout','steps','history'].forEach(t => {
    const el  = document.getElementById(`fit-${t}`);
    const btn = document.getElementById(`fit-tab-${t}`);
    if (el)  el.style.display     = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background = t === tab ? 'var(--bg-card)' : 'transparent';
      btn.style.color      = t === tab ? 'var(--green-dark)' : 'var(--text-muted)';
      btn.style.fontWeight = t === tab ? '500' : '400';
    }
  });
  if (tab === 'history') renderFitnessHistory();
}

function renderFitnessHistory() {
  const el   = document.getElementById('fitness-history-content');
  if (!el) return;
  const logs = getFitnessLogs();
  const steps = getStepsLog();

  if (!logs.length && !steps.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:2rem;margin-bottom:8px;">🏅</div>
      <div style="font-size:0.85rem;">No workouts logged yet. Start moving!</div></div>`;
    return;
  }

  el.innerHTML = `
    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
      letter-spacing:0.08em;margin-bottom:10px;">RECENT WORKOUTS</div>
    ${logs.slice(0,10).map(l => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;
        background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
        margin-bottom:8px;">
        <span style="font-size:1.4rem;">${l.icon}</span>
        <div style="flex:1;">
          <div style="font-size:0.85rem;font-weight:500;color:var(--text-main);">${l.type}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            ${l.duration} mins · ${l.calories} kcal burned</div>
          ${l.note ? `<div style="font-size:0.72rem;color:var(--text-light);font-style:italic;">${l.note}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.72rem;color:var(--text-light);">
            ${new Date(l.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
        </div>
      </div>`).join('')}
    ${steps.length ? `
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
        letter-spacing:0.08em;margin:16px 0 10px;">STEPS HISTORY</div>
      ${steps.slice(0,7).map(s => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
          background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
          margin-bottom:8px;">
          <span style="font-size:1.2rem;">👣</span>
          <div style="flex:1;">
            <div style="font-size:0.85rem;font-weight:500;color:var(--text-main);">
              ${s.steps.toLocaleString()} steps</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">
              ${s.distance} km · ${s.calories} kcal</div>
          </div>
          <div style="font-size:0.72rem;color:var(--text-light);">
            ${new Date(s.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
        </div>`).join('')}` : ''}`;
}

function summaryCard(icon, label, value, sub) {
  return `<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
    padding:12px;text-align:center;">
    <div style="font-size:1rem;margin-bottom:4px;">${icon}</div>
    <div style="font-size:0.68rem;color:var(--text-light);text-transform:uppercase;
      letter-spacing:0.06em;margin-bottom:4px;">${label}</div>
    <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;
      color:var(--text-main);">${value}</div>
    <div style="font-size:0.7rem;color:var(--text-muted);">${sub}</div>
  </div>`;
}

function updateLifestylePage() {
  const today     = new Date().toDateString();
  const logs      = getFitnessLogs().filter(l => new Date(l.date).toDateString() === today);
  const stepsToday = getStepsLog().find(s => new Date(s.date).toDateString() === today);
  const totalCal  = logs.reduce((s, l) => s + (l.calories || 0), 0);
  const totalMins = logs.reduce((s, l) => s + (l.duration || 0), 0);

  const stepsEl = document.getElementById('ls-steps');
  const calEl   = document.getElementById('ls-calories');
  if (stepsEl && stepsToday) stepsEl.textContent = stepsToday.steps.toLocaleString() + ' steps';
  if (calEl && totalCal)     calEl.textContent   = totalCal + ' kcal burned';
}

// Auto-update on page load
document.addEventListener('DOMContentLoaded', updateLifestylePage);