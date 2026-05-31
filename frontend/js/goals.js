// ─────────────────────────────────────────────
//  CuraMind · goals.js
//  Health Goals & Streaks
//  - User sets goals (steps, sleep, hydration, calories)
//  - App tracks daily streaks
//  - Shows 🔥 streak counter + badges
//  Save to: frontend/js/goals.js
// ─────────────────────────────────────────────

const DEFAULT_GOALS = [
  { id: 'steps',     icon: '👣', label: 'Daily Steps',     unit: 'steps', default: 8000  },
  { id: 'sleep',     icon: '🌙', label: 'Sleep Duration',  unit: 'hrs',   default: 7     },
  { id: 'hydration', icon: '💧', label: 'Water Intake',    unit: 'L',     default: 2.5   },
  { id: 'calories',  icon: '🔥', label: 'Calorie Target',  unit: 'kcal',  default: 2000  },
];

const BADGES = [
  { days: 3,  icon: '🌱', label: 'Seedling',    desc: '3-day streak'   },
  { days: 7,  icon: '⭐', label: 'Week Warrior', desc: '7-day streak'   },
  { days: 14, icon: '🔥', label: 'On Fire',      desc: '14-day streak'  },
  { days: 30, icon: '🏆', label: 'Champion',     desc: '30-day streak'  },
  { days: 60, icon: '💎', label: 'Diamond',      desc: '60-day streak'  },
];

// ── STORAGE HELPERS ───────────────────────────
function getGoals() {
  try { return JSON.parse(localStorage.getItem('cm_goals') || '{}'); } catch { return {}; }
}
function saveGoals(data) {
  localStorage.setItem('cm_goals', JSON.stringify(data));
}
function getStreaks() {
  try { return JSON.parse(localStorage.getItem('cm_streaks') || '{}'); } catch { return {}; }
}
function saveStreaks(data) {
  localStorage.setItem('cm_streaks', JSON.stringify(data));
}

// ── CHECK STREAKS AGAINST TODAY'S HEALTH DATA ─
async function checkAndUpdateStreaks() {
  try {
    const data    = await DashboardAPI.getSummary();
    const health  = data.health || {};
    const goals   = getGoals();
    const streaks = getStreaks();
    const today   = new Date().toISOString().split('T')[0];

    DEFAULT_GOALS.forEach(goal => {
      const target  = goals[goal.id] || goal.default;
      const actual  = health[goal.id] || 0;
      const s       = streaks[goal.id] || { count: 0, lastDate: null, best: 0 };

      if (actual >= target) {
        // Goal met today
        if (s.lastDate === today) return; // already counted today
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (s.lastDate === yesterday) {
          s.count++; // continued streak
        } else {
          s.count = 1; // new streak
        }
        s.lastDate = today;
        s.best     = Math.max(s.best, s.count);
      } else {
        // Goal not met — break streak if we missed yesterday
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (s.lastDate && s.lastDate !== today && s.lastDate !== yesterday) {
          s.count = 0;
        }
      }
      streaks[goal.id] = s;
    });

    saveStreaks(streaks);
    return streaks;
  } catch (e) {
    return getStreaks();
  }
}

// ── OPEN GOALS MODAL ──────────────────────────
async function openGoals() {
  const existing = document.getElementById('goals-modal');
  if (existing) existing.remove();

  const goals   = getGoals();
  const streaks = await checkAndUpdateStreaks();

  const modal = document.createElement('div');
  modal.id = 'goals-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(20,40,28,0.5);
    backdrop-filter:blur(6px);z-index:300;
    display:flex;align-items:center;justify-content:center;
    animation:fadeIn 0.2s ease;
  `;

  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:var(--radius);
      width:100%;max-width:560px;max-height:90vh;overflow-y:auto;
      box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:24px 28px;">
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;
            font-weight:700;color:var(--green-dark);margin-bottom:4px;">
            Goals & Streaks
          </h2>
          <p style="font-size:0.8rem;color:var(--text-muted);">
            Set daily targets and track your consistency
          </p>
        </div>
        <button onclick="document.getElementById('goals-modal').remove()"
          style="background:none;border:none;font-size:1.3rem;cursor:pointer;
          color:var(--text-muted);">✕</button>
      </div>

      <!-- Streak cards -->
      <div style="padding:0 28px 20px;display:grid;
        grid-template-columns:repeat(2,1fr);gap:12px;">
        ${DEFAULT_GOALS.map(goal => {
          const s      = streaks[goal.id] || { count: 0, best: 0 };
          const target = goals[goal.id]   || goal.default;
          const badge  = BADGES.slice().reverse().find(b => s.best >= b.days);
          return `
            <div style="background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius);padding:16px;position:relative;">
              <div style="display:flex;align-items:center;justify-content:space-between;
                margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:1.1rem;">${goal.icon}</span>
                  <span style="font-size:0.8rem;font-weight:500;
                    color:var(--text-main);">${goal.label}</span>
                </div>
                ${badge ? `<span title="${badge.desc}" style="font-size:1rem;">${badge.icon}</span>` : ''}
              </div>
              <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:4px;">
                <span style="font-family:'Playfair Display',serif;font-size:1.8rem;
                  font-weight:700;color:${s.count > 0 ? 'var(--green-dark)' : 'var(--text-light)'};">
                  ${s.count}
                </span>
                <span style="font-size:0.78rem;color:var(--text-muted);">day streak</span>
                ${s.count >= 3 ? '<span style="font-size:1rem;margin-left:4px;">🔥</span>' : ''}
              </div>
              <div style="font-size:0.72rem;color:var(--text-light);">
                Best: ${s.best} days · Target: ${target} ${goal.unit}
              </div>
            </div>`;
        }).join('')}
      </div>

      <!-- Edit Goals -->
      <div style="padding:0 28px 24px;border-top:1px solid var(--border);padding-top:20px;">
        <p style="font-size:0.72rem;font-weight:500;letter-spacing:0.1em;
          color:var(--text-light);text-transform:uppercase;margin-bottom:16px;">
          Edit Daily Targets
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          ${DEFAULT_GOALS.map(goal => `
            <div>
              <label style="display:block;font-size:0.72rem;font-weight:500;
                color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;
                letter-spacing:0.05em;">${goal.icon} ${goal.label} (${goal.unit})</label>
              <input type="number" id="goal-${goal.id}"
                value="${goals[goal.id] || goal.default}"
                style="width:100%;background:var(--bg);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:9px 12px;
                font-family:'DM Sans',sans-serif;font-size:0.88rem;
                color:var(--text-main);outline:none;box-sizing:border-box;"
                onfocus="this.style.borderColor='var(--green-accent)'"
                onblur="this.style.borderColor='var(--border)'"/>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('goals-modal').remove()"
            style="padding:10px 20px;border-radius:20px;background:transparent;
            border:1px solid var(--border);color:var(--text-muted);cursor:pointer;
            font-family:'DM Sans',sans-serif;font-size:0.85rem;">Cancel</button>
          <button onclick="saveGoalTargets()"
            style="padding:10px 24px;border-radius:20px;background:var(--green-dark);
            color:#fff;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;
            font-size:0.85rem;font-weight:500;">Save Goals ✓</button>
        </div>
      </div>

      <!-- Badges section -->
      <div style="padding:20px 28px;border-top:1px solid var(--border);
        background:var(--bg);">
        <p style="font-size:0.72rem;font-weight:500;letter-spacing:0.1em;
          color:var(--text-light);text-transform:uppercase;margin-bottom:14px;">
          Badges you can earn
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${BADGES.map(b => {
            const earned = Object.values(streaks).some(s => (s.best || 0) >= b.days);
            return `
              <div style="display:flex;align-items:center;gap:7px;padding:8px 14px;
                border-radius:20px;
                background:${earned ? 'var(--green-light)' : 'transparent'};
                border:1px solid ${earned ? 'var(--green-light)' : 'var(--border)'};
                opacity:${earned ? 1 : 0.5};">
                <span style="font-size:1rem;">${b.icon}</span>
                <div>
                  <div style="font-size:0.78rem;font-weight:500;
                    color:var(--text-main);">${b.label}</div>
                  <div style="font-size:0.68rem;color:var(--text-muted);">${b.desc}</div>
                </div>
                ${earned ? '<span style="font-size:0.7rem;color:var(--green-dark);font-weight:600;">✓</span>' : ''}
              </div>`;
          }).join('')}
        </div>
      </div>

    </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function saveGoalTargets() {
  const goals = {};
  DEFAULT_GOALS.forEach(goal => {
    const val = parseFloat(document.getElementById('goal-' + goal.id)?.value);
    if (val) goals[goal.id] = val;
  });
  saveGoals(goals);

  // Also update cm_targets so dashboard progress bars reflect goals
  const existing = JSON.parse(localStorage.getItem('cm_targets') || '{}');
  localStorage.setItem('cm_targets', JSON.stringify({ ...existing, ...goals }));

  document.getElementById('goals-modal').remove();
  if (typeof showToast === 'function') showToast('🎯 Goals saved!');
  if (typeof loadDashboard === 'function') loadDashboard();
}

// ── MINI STREAK WIDGET (shown in nav/dashboard) ──
function renderStreakWidget() {
  const streaks = getStreaks();
  const best = Math.max(0, ...Object.values(streaks).map(s => s.count || 0));
  const container = document.getElementById('streak-widget');
  if (!container || !best) return;
  container.innerHTML = `
    <span style="font-size:0.85rem;">🔥</span>
    <span style="font-size:0.82rem;font-weight:500;color:var(--green-dark);">
      ${best}-day streak
    </span>`;
  container.style.display = 'flex';
}

// Auto-check streaks on load
document.addEventListener('DOMContentLoaded', () => {
  checkAndUpdateStreaks().then(() => renderStreakWidget());
});