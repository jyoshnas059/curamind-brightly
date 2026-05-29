// ─────────────────────────────────────────────
//  CuraMind · sleeptracker.js
//  Save to: frontend/js/sleeptracker.js
// ─────────────────────────────────────────────

function getSleepLogs() {
  try { return JSON.parse(localStorage.getItem('cm_sleep_full_logs') || '[]'); } catch { return []; }
}
function saveSleepLogs(logs) { localStorage.setItem('cm_sleep_full_logs', JSON.stringify(logs)); }

function getSleepGoal() {
  const targets = JSON.parse(localStorage.getItem('cm_targets') || '{}');
  return targets.sleep || 7.5;
}

function openSleepTracker() {
  const ex = document.getElementById('sleep-tracker-modal');
  if (ex) ex.remove();

  const logs      = getSleepLogs();
  const goal      = getSleepGoal();
  const last7     = logs.slice(0, 7);
  const avgSleep  = last7.length
    ? (last7.reduce((s, l) => s + l.hours, 0) / last7.length).toFixed(1)
    : '—';

  const modal = document.createElement('div');
  modal.id = 'sleep-tracker-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:560px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">🌙 Sleep Tracker</p>
        <button onclick="document.getElementById('sleep-tracker-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Track bedtime, wake time and sleep quality.</p>

      <!-- Stats row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
          padding:12px;text-align:center;">
          <div style="font-size:0.68rem;color:var(--text-light);text-transform:uppercase;
            letter-spacing:0.06em;margin-bottom:4px;">7-Day Avg</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;
            color:var(--text-main);">${avgSleep}h</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
          padding:12px;text-align:center;">
          <div style="font-size:0.68rem;color:var(--text-light);text-transform:uppercase;
            letter-spacing:0.06em;margin-bottom:4px;">Goal</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;
            color:var(--green-accent);">${goal}h</div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
          padding:12px;text-align:center;">
          <div style="font-size:0.68rem;color:var(--text-light);text-transform:uppercase;
            letter-spacing:0.06em;margin-bottom:4px;">Entries</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;
            color:var(--text-main);">${logs.length}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:20px;">
        <button id="sl-tab-log" onclick="slTab('log')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">😴 Log Sleep</button>
        <button id="sl-tab-remind" onclick="slTab('remind')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">🔔 Reminders</button>
        <button id="sl-tab-history" onclick="slTab('history')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">📊 History</button>
      </div>

      <!-- LOG TAB -->
      <div id="sl-log">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Bedtime</label>
            <input type="time" id="sl-bedtime" value="22:30"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.95rem;color:var(--text-main);outline:none;"
              oninput="calcSleepHours()"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Wake Time</label>
            <input type="time" id="sl-waketime" value="06:30"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.95rem;color:var(--text-main);outline:none;"
              oninput="calcSleepHours()"/>
          </div>
        </div>

        <!-- Auto-calculated hours -->
        <div id="sl-hours-display" style="background:var(--green-light);border-radius:var(--radius-sm);
          padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
          <span style="font-size:1.6rem;">🌙</span>
          <div>
            <div style="font-size:0.7rem;color:var(--green-dark);font-weight:600;
              text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px;">Sleep Duration</div>
            <div id="sl-calc-hours" style="font-family:'Playfair Display',serif;
              font-size:1.6rem;font-weight:700;color:var(--green-dark);">8h 0m</div>
          </div>
          <div id="sl-goal-status" style="margin-left:auto;font-size:0.78rem;
            font-weight:500;color:var(--green-dark);"></div>
        </div>

        <!-- Quality slider -->
        <div style="margin-bottom:16px;">
          <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:8px;
            text-transform:uppercase;letter-spacing:0.05em;">
            Sleep Quality: <span id="quality-label" style="color:var(--green-dark);font-weight:600;">Good (7/10)</span>
          </label>
          <input type="range" id="sl-quality" min="1" max="10" value="7"
            oninput="updateQualityLabel(this.value)"
            style="width:100%;accent-color:var(--green-accent);cursor:pointer;height:6px;"/>
          <div style="display:flex;justify-content:space-between;margin-top:4px;">
            <span style="font-size:0.7rem;color:var(--text-light);">😫 Poor</span>
            <span style="font-size:0.7rem;color:var(--text-light);">😐 Fair</span>
            <span style="font-size:0.7rem;color:var(--text-light);">😊 Good</span>
            <span style="font-size:0.7rem;color:var(--text-light);">🌟 Excellent</span>
          </div>
        </div>

        <!-- Sleep factors -->
        <div style="margin-bottom:16px;">
          <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:8px;
            text-transform:uppercase;letter-spacing:0.05em;">What affected your sleep? (optional)</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="sleep-factors">
            ${['Stress','Screen time','Caffeine','Exercise','Noise','Temperature','Illness','Good routine'].map(f => `
              <button onclick="toggleFactor(this)" data-factor="${f}"
                style="padding:5px 12px;border:1px solid var(--border);border-radius:12px;
                background:var(--bg);font-size:0.75rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;">${f}</button>`).join('')}
          </div>
        </div>

        <!-- Notes -->
        <div style="margin-bottom:16px;">
          <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
            text-transform:uppercase;letter-spacing:0.05em;">Notes (optional)</label>
          <input type="text" id="sl-notes" placeholder="e.g. Had vivid dreams, felt refreshed"
            style="width:100%;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
            font-size:0.88rem;color:var(--text-main);outline:none;"/>
        </div>

        <button onclick="saveSleepEntry()" class="btn-save" style="width:100%;">
          🌙 Save Sleep Entry
        </button>
      </div>

      <!-- REMINDERS TAB -->
      <div id="sl-remind" style="display:none;">
        <div style="background:var(--bg);border:1px solid var(--border);
          border-radius:var(--radius-sm);padding:20px;margin-bottom:16px;">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-main);margin-bottom:4px;">
            🔔 Bedtime Reminder
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px;">
            Get reminded to start winding down before bed.
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div>
              <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;">
                Wind-down reminder</label>
              <input type="time" id="winddown-time" value="21:00"
                style="width:100%;background:var(--bg-card);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
                font-size:0.88rem;outline:none;"/>
            </div>
            <div>
              <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;">
                Bedtime reminder</label>
              <input type="time" id="bedtime-remind-time" value="22:30"
                style="width:100%;background:var(--bg-card);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
                font-size:0.88rem;outline:none;"/>
            </div>
          </div>
          <button onclick="saveSleepReminders()" class="btn-save" style="width:100%;">
            Save Sleep Reminders
          </button>
        </div>

        <!-- Sleep tips -->
        <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
          letter-spacing:0.08em;margin-bottom:10px;">SLEEP HYGIENE TIPS</div>
        ${[
          ['📵', 'No screens 1 hour before bed — blue light delays melatonin by up to 3 hours.'],
          ['🌡️', 'Keep your room cool (18–20°C) — body temperature drop triggers sleep.'],
          ['☕', 'Avoid caffeine after 2pm — it has a 5-6 hour half-life in your body.'],
          ['🚶', 'Exercise improves sleep quality but avoid intense workouts within 2 hours of bed.'],
          ['📅', 'Same bedtime every day — even weekends — keeps your circadian rhythm stable.'],
          ['🧘', 'Try 5 minutes of deep breathing or body scan before bed to reduce cortisol.'],
        ].map(([icon, tip]) => `
          <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;
            border-bottom:1px solid var(--border);">
            <span style="font-size:1rem;flex-shrink:0;">${icon}</span>
            <span style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;">${tip}</span>
          </div>`).join('')}
      </div>

      <!-- HISTORY TAB -->
      <div id="sl-history" style="display:none;">
        <div id="sl-history-content"></div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  calcSleepHours();
}

let selectedFactors = [];

function toggleFactor(btn) {
  const f = btn.dataset.factor;
  const active = selectedFactors.includes(f);
  if (active) {
    selectedFactors = selectedFactors.filter(x => x !== f);
    btn.style.background  = 'var(--bg)';
    btn.style.borderColor = 'var(--border)';
    btn.style.color       = 'var(--text-muted)';
  } else {
    selectedFactors.push(f);
    btn.style.background  = 'var(--green-dark)';
    btn.style.borderColor = 'var(--green-dark)';
    btn.style.color       = '#fff';
  }
}

function calcSleepHours() {
  const bed  = document.getElementById('sl-bedtime')?.value;
  const wake = document.getElementById('sl-waketime')?.value;
  if (!bed || !wake) return;

  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let totalMins  = (wh * 60 + wm) - (bh * 60 + bm);
  if (totalMins < 0) totalMins += 24 * 60;

  const hours = Math.floor(totalMins / 60);
  const mins  = totalMins % 60;
  const goal  = getSleepGoal();
  const diff  = (totalMins / 60) - goal;

  const display = document.getElementById('sl-calc-hours');
  const status  = document.getElementById('sl-goal-status');
  if (display) display.textContent = `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
  if (status) {
    if (diff >= 0)      { status.textContent = `✅ +${diff.toFixed(1)}h vs goal`; status.style.color = 'var(--green-accent)'; }
    else if (diff > -1) { status.textContent = `⚠️ ${Math.abs(diff).toFixed(1)}h short`; status.style.color = '#f59e0b'; }
    else                { status.textContent = `❌ ${Math.abs(diff).toFixed(1)}h short`; status.style.color = '#ef4444'; }
  }
}

function updateQualityLabel(val) {
  const labels = { 1:'Terrible',2:'Very Poor',3:'Poor',4:'Below Average',5:'Fair',
    6:'Decent',7:'Good',8:'Very Good',9:'Excellent',10:'Perfect' };
  const el = document.getElementById('quality-label');
  if (el) el.textContent = `${labels[val]} (${val}/10)`;
}

function saveSleepEntry() {
  const bedtime  = document.getElementById('sl-bedtime').value;
  const waketime = document.getElementById('sl-waketime').value;
  const quality  = parseInt(document.getElementById('sl-quality').value);
  const notes    = document.getElementById('sl-notes').value.trim();

  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = waketime.split(':').map(Number);
  let totalMins  = (wh * 60 + wm) - (bh * 60 + bm);
  if (totalMins < 0) totalMins += 24 * 60;
  const hours = totalMins / 60;

  const logs = getSleepLogs();
  logs.unshift({ id: Date.now(), bedtime, waketime, hours: Math.round(hours * 10) / 10,
    quality, factors: [...selectedFactors], notes, date: new Date().toISOString() });
  saveSleepLogs(logs);

  selectedFactors = [];
  document.getElementById('sleep-tracker-modal').remove();
  showToast(`🌙 Sleep logged — ${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`);
  updateSleepLifestyle();
}

function saveSleepReminders() {
  const winddown = document.getElementById('winddown-time').value;
  const bedtime  = document.getElementById('bedtime-remind-time').value;

  const reminders = JSON.parse(localStorage.getItem('cm_custom_reminders') || '[]')
    .filter(r => r.id !== 'sleep-winddown' && r.id !== 'sleep-bedtime');

  reminders.push(
    { id:'sleep-winddown', icon:'📵', title:'Wind-Down Time', category:'Sleep',
      message:'Put screens away and start winding down — bedtime approaching.', time: winddown },
    { id:'sleep-bedtime',  icon:'🌙', title:'Bedtime Reminder', category:'Sleep',
      message:'Time to sleep. Log your sleep tomorrow morning in CuraMind.', time: bedtime }
  );
  localStorage.setItem('cm_custom_reminders', JSON.stringify(reminders));
  showToast('🌙 Sleep reminders saved ✓');
}

function renderSleepHistory() {
  const el   = document.getElementById('sl-history-content');
  if (!el) return;
  const logs = getSleepLogs();

  if (!logs.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:2rem;margin-bottom:8px;">🌙</div>
      <div style="font-size:0.85rem;">No sleep entries yet.</div></div>`;
    return;
  }

  // Mini bar chart for last 7 days
  const last7  = logs.slice(0, 7).reverse();
  const goal   = getSleepGoal();
  const maxH   = Math.max(...last7.map(l => l.hours), goal);

  el.innerHTML = `
    <div style="margin-bottom:20px;">
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
        letter-spacing:0.08em;margin-bottom:12px;">LAST 7 NIGHTS</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:80px;">
        ${last7.map(l => {
          const h = (l.hours / maxH) * 70;
          const color = l.hours >= goal ? 'var(--green-accent)' :
                        l.hours >= goal - 1 ? '#f59e0b' : '#ef4444';
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="font-size:0.65rem;color:var(--text-light);">${l.hours}h</div>
            <div style="width:100%;height:${h}px;background:${color};border-radius:4px 4px 0 0;
              min-height:4px;transition:height 0.5s;"></div>
            <div style="font-size:0.62rem;color:var(--text-light);">
              ${new Date(l.date).toLocaleDateString('en-IN',{weekday:'short'})}</div>
          </div>`;
        }).join('')}
      </div>
      <div style="margin-top:8px;display:flex;align-items:center;gap:6px;">
        <div style="width:12px;height:4px;background:var(--green-accent);border-radius:2px;"></div>
        <span style="font-size:0.68rem;color:var(--text-light);">Met goal (${goal}h)</span>
        <div style="width:12px;height:4px;background:#f59e0b;border-radius:2px;margin-left:8px;"></div>
        <span style="font-size:0.68rem;color:var(--text-light);">Close</span>
        <div style="width:12px;height:4px;background:#ef4444;border-radius:2px;margin-left:8px;"></div>
        <span style="font-size:0.68rem;color:var(--text-light);">Short</span>
      </div>
    </div>

    <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
      letter-spacing:0.08em;margin-bottom:10px;">ALL ENTRIES</div>
    ${logs.map(l => {
      const qualityEmoji = l.quality >= 8 ? '🌟' : l.quality >= 6 ? '😊' :
                           l.quality >= 4 ? '😐' : '😫';
      return `
        <div style="background:var(--bg-card);border:1px solid var(--border);
          border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.2rem;">${qualityEmoji}</span>
              <div>
                <div style="font-family:'Playfair Display',serif;font-size:1.1rem;
                  font-weight:700;color:var(--text-main);">${l.hours}h</div>
                <div style="font-size:0.72rem;color:var(--text-muted);">
                  ${l.bedtime} → ${l.waketime}</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.78rem;font-weight:500;color:var(--green-accent);">
                Quality: ${l.quality}/10</div>
              <div style="font-size:0.7rem;color:var(--text-light);">
                ${new Date(l.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
            </div>
          </div>
          ${l.factors?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
            ${l.factors.map(f => `<span style="font-size:0.68rem;background:var(--green-light);
              color:var(--green-dark);padding:2px 8px;border-radius:8px;">${f}</span>`).join('')}
          </div>` : ''}
          ${l.notes ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;
            font-style:italic;">"${l.notes}"</div>` : ''}
        </div>`;
    }).join('')}`;
}

function slTab(tab) {
  ['log','remind','history'].forEach(t => {
    const el  = document.getElementById(`sl-${t}`);
    const btn = document.getElementById(`sl-tab-${t}`);
    if (el)  el.style.display     = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background = t === tab ? 'var(--bg-card)' : 'transparent';
      btn.style.color      = t === tab ? 'var(--green-dark)' : 'var(--text-muted)';
      btn.style.fontWeight = t === tab ? '500' : '400';
    }
  });
  if (tab === 'history') renderSleepHistory();
}

function updateSleepLifestyle() {
  const logs = getSleepLogs();
  if (!logs.length) return;
  const latest = logs[0];
  const el     = document.getElementById('ls-sleep');
  const subEl  = document.getElementById('ls-sleep-sub');
  if (el)    el.textContent    = latest.hours + 'h';
  if (subEl) subEl.textContent = `Quality: ${latest.quality}/10`;
}

document.addEventListener('DOMContentLoaded', updateSleepLifestyle);