// ─────────────────────────────────────────────
//  CuraMind · reminders.js
//  Save to: frontend/js/reminders.js
//  Add in index.html before </body>:
//  <script src="js/reminders.js"></script>
// ─────────────────────────────────────────────

// ── APP SUGGESTED REMINDERS ──────────────────
const APP_REMINDERS = [
  { id: 'water-morning',  icon: '💧', title: 'Morning Hydration',     message: 'Start your day with 2 glasses of water.',           time: '08:00', category: 'Hydration' },
  { id: 'water-noon',     icon: '💧', title: 'Midday Water Break',     message: 'You\'re likely dehydrated — drink a glass now.',     time: '12:00', category: 'Hydration' },
  { id: 'water-evening',  icon: '💧', title: 'Evening Hydration',      message: 'Check your water intake before dinner.',            time: '17:00', category: 'Hydration' },
  { id: 'move-morning',   icon: '🏃', title: 'Morning Movement',       message: 'A 10-min walk now energises your whole day.',       time: '09:00', category: 'Movement'  },
  { id: 'move-afternoon', icon: '🚶', title: 'Afternoon Walk',         message: 'Stand up — your body needs movement right now.',    time: '15:30', category: 'Movement'  },
  { id: 'food-breakfast', icon: '🥗', title: 'Healthy Breakfast',      message: 'Don\'t skip it — include protein and fibre.',       time: '07:30', category: 'Nutrition' },
  { id: 'food-snack',     icon: '🍎', title: 'Healthy Snack',          message: 'Reach for fruit or nuts instead of processed food.',time: '10:30', category: 'Nutrition' },
  { id: 'food-veggies',   icon: '🥦', title: 'Vegetable Check',        message: 'Have you had your 5 servings of vegetables today?', time: '19:00', category: 'Nutrition' },
  { id: 'mind-morning',   icon: '🧠', title: 'Morning Mindfulness',    message: 'Take 3 deep breaths and set one intention today.',  time: '08:30', category: 'Wellness'  },
  { id: 'mind-checkin',   icon: '😌', title: 'Mood Check-in',          message: 'How are you feeling? Log your mood now.',           time: '13:00', category: 'Wellness'  },
  { id: 'sleep-screen',   icon: '📵', title: 'Screen-Free Time',       message: 'Put your phone down — bedtime is in 1 hour.',       time: '21:00', category: 'Sleep'     },
  { id: 'sleep-bed',      icon: '🌙', title: 'Bedtime Reminder',       message: 'Time to sleep. Log your sleep tomorrow morning.',   time: '22:00', category: 'Sleep'     },
  { id: 'posture-check',  icon: '🪑', title: 'Posture Check',          message: 'Sit up straight — shoulders back, feet flat.',      time: '11:00', category: 'Posture'   },
  { id: 'eye-rest',       icon: '👁️', title: '20-20-20 Eye Rest',      message: 'Look 20 feet away for 20 seconds to rest eyes.',    time: '14:00', category: 'Posture'   },
];

// ── STORAGE HELPERS ──────────────────────────
function getCustomReminders() {
  try { return JSON.parse(localStorage.getItem('cm_custom_reminders') || '[]'); } catch { return []; }
}
function saveCustomReminders(list) {
  localStorage.setItem('cm_custom_reminders', JSON.stringify(list));
}
function getDismissedToday() {
  try {
    const d = JSON.parse(localStorage.getItem('cm_notif_dismissed') || '{}');
    if (d._date !== new Date().toDateString()) return { _date: new Date().toDateString() };
    return d;
  } catch { return { _date: new Date().toDateString() }; }
}
function dismissToday(id) {
  const d = getDismissedToday();
  d[id] = true;
  localStorage.setItem('cm_notif_dismissed', JSON.stringify(d));
}
function getDisabledCategories() {
  try { return JSON.parse(localStorage.getItem('cm_disabled_cats') || '[]'); } catch { return []; }
}

// ── NOTIFICATION POPUP ───────────────────────
let notifQueue   = [];
let notifShowing = false;

function queueNotification(reminder) {
  // Don't re-queue if already in queue or dismissed
  if (notifQueue.find(r => r.id === reminder.id)) return;
  if (getDismissedToday()[reminder.id]) return;
  notifQueue.push(reminder);
  if (!notifShowing) showNextNotif();
}

function showNextNotif() {
  if (!notifQueue.length) { notifShowing = false; return; }
  notifShowing = true;
  const r = notifQueue.shift();

  // Remove any existing notif
  const old = document.getElementById('cm-notif');
  if (old) old.remove();

  const el = document.createElement('div');
  el.id = 'cm-notif';
  el.innerHTML = `
    <div id="cm-notif-inner">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="width:38px;height:38px;background:var(--green-light);border-radius:10px;
          display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
          ${r.icon}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="font-size:0.85rem;font-weight:600;color:var(--green-dark);">${r.title}</span>
            <span style="font-size:0.68rem;background:var(--green-light);color:var(--green-dark);
              padding:2px 8px;border-radius:10px;white-space:nowrap;font-weight:500;">${r.category || 'Reminder'}</span>
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;margin:0 0 10px;">${r.message}</p>
          <div style="display:flex;gap:8px;">
            <button onclick="dismissNotif('${r.id}', true)"
              style="flex:1;background:var(--green-dark);color:#fff;border:none;padding:7px 12px;
              border-radius:20px;font-size:0.78rem;font-weight:500;cursor:pointer;
              font-family:'DM Sans',sans-serif;transition:background 0.2s;"
              onmouseover="this.style.background='var(--green-mid)'"
              onmouseout="this.style.background='var(--green-dark)'">
              ✓ Got it
            </button>
            <button onclick="snoozeNotif('${r.id}')"
              style="flex:1;background:var(--bg);color:var(--text-muted);border:1px solid var(--border);
              padding:7px 12px;border-radius:20px;font-size:0.78rem;cursor:pointer;
              font-family:'DM Sans',sans-serif;transition:all 0.2s;"
              onmouseover="this.style.background='var(--green-light)'"
              onmouseout="this.style.background='var(--bg)'">
              😴 Snooze 10m
            </button>
            <button onclick="dismissNotif('${r.id}', false)"
              style="background:none;border:none;color:var(--text-light);cursor:pointer;
              font-size:1rem;padding:4px 6px;">✕</button>
          </div>
        </div>
      </div>
      ${notifQueue.length > 0 ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);
        font-size:0.72rem;color:var(--text-light);text-align:center;">
        +${notifQueue.length} more reminder${notifQueue.length > 1 ? 's' : ''}</div>` : ''}
    </div>`;

  Object.assign(el.style, {
    position:     'fixed',
    bottom:       '24px',
    right:        '24px',
    width:        '340px',
    background:   'var(--bg-card)',
    border:       '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding:      '16px',
    boxShadow:    '0 8px 32px rgba(30,58,47,0.18)',
    zIndex:       '9999',
    fontFamily:   "'DM Sans', sans-serif",
    animation:    'notifSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
  });

  document.body.appendChild(el);

  // Auto-dismiss after 12 seconds
  el._autoTimer = setTimeout(() => dismissNotif(r.id, false), 12000);
}

function dismissNotif(id, markDone) {
  const el = document.getElementById('cm-notif');
  if (el) {
    clearTimeout(el._autoTimer);
    el.style.animation   = 'notifSlideOut 0.25s ease forwards';
    el.style.opacity     = '0';
    el.style.transform   = 'translateX(120%)';
    el.style.transition  = 'all 0.25s ease';
    setTimeout(() => { el.remove(); notifShowing = false; setTimeout(showNextNotif, 400); }, 250);
  }
  if (markDone) dismissToday(id);
}

function snoozeNotif(id) {
  dismissNotif(id, false);
  // Re-queue after 10 minutes
  setTimeout(() => {
    const r = [...APP_REMINDERS, ...getCustomReminders()].find(r => r.id === id);
    if (r) queueNotification(r);
  }, 10 * 60 * 1000);
  showToast('Snoozed for 10 minutes 😴');
}

// ── ADD NOTIFICATION KEYFRAMES ───────────────
const notifStyle = document.createElement('style');
notifStyle.textContent = `
  @keyframes notifSlideIn {
    from { opacity: 0; transform: translateX(120%) scale(0.9); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes notifSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(120%); }
  }
`;
document.head.appendChild(notifStyle);

// ── CHECK REMINDERS EVERY MINUTE ─────────────
function checkReminders() {
  const now      = new Date();
  const nowMins  = now.getHours() * 60 + now.getMinutes();
  const disabled = getDisabledCategories();
  const dismissed = getDismissedToday();

  // Check app suggested reminders
  APP_REMINDERS.forEach(r => {
    if (disabled.includes(r.category)) return;
    if (dismissed[r.id]) return;
    const [h, m] = r.time.split(':').map(Number);
    const rMins  = h * 60 + m;
    // Trigger within a 2-minute window
    if (Math.abs(nowMins - rMins) <= 1) queueNotification(r);
  });

  // Check custom reminders
  getCustomReminders().forEach(r => {
    if (dismissed[r.id]) return;
    const [h, m] = r.time.split(':').map(Number);
    const rMins  = h * 60 + m;
    if (Math.abs(nowMins - rMins) <= 1) queueNotification({ ...r, category: r.category || 'Custom' });
  });
}

// Run every 60 seconds
setInterval(checkReminders, 60 * 1000);

// ── REMINDER MANAGER MODAL ───────────────────
function openReminderManager() {
  const ex = document.getElementById('rm-modal');
  if (ex) ex.remove();

  const modal = document.createElement('div');
  modal.id = 'rm-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:560px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">🔔 Reminders</p>
        <button onclick="document.getElementById('rm-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">App suggestions + your custom reminders.</p>

      <!-- TABS -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:24px;">
        <button id="rm-tab-custom" onclick="rmShowTab('custom')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);transition:all 0.2s;">
          ✏️ My Reminders
        </button>
        <button id="rm-tab-app" onclick="rmShowTab('app')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;
          background:transparent;color:var(--text-muted);transition:all 0.2s;">
          🤖 App Suggestions
        </button>
      </div>

      <!-- CUSTOM TAB -->
      <div id="rm-custom">
        <!-- Add new reminder -->
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
          padding:16px;margin-bottom:20px;">
          <p style="font-size:0.78rem;font-weight:600;color:var(--text-main);margin-bottom:12px;
            text-transform:uppercase;letter-spacing:0.06em;">+ Add New Reminder</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div>
              <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">TIME</label>
              <input type="time" id="new-r-time" style="width:100%;background:var(--bg-card);
                border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 12px;
                font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--text-main);outline:none;"/>
            </div>
            <div>
              <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">CATEGORY</label>
              <select id="new-r-cat" style="width:100%;background:var(--bg-card);
                border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 12px;
                font-family:'DM Sans',sans-serif;font-size:0.88rem;color:var(--text-main);outline:none;">
                <option>Hydration</option>
                <option>Movement</option>
                <option>Nutrition</option>
                <option>Wellness</option>
                <option>Sleep</option>
                <option>Medication</option>
                <option>Custom</option>
              </select>
            </div>
          </div>
          <div style="margin-bottom:10px;">
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">TITLE</label>
            <input type="text" id="new-r-title" placeholder="e.g. Take vitamins"
              style="width:100%;background:var(--bg-card);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:9px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:4px;">MESSAGE</label>
            <input type="text" id="new-r-msg" placeholder="e.g. Don't forget your morning vitamins"
              style="width:100%;background:var(--bg-card);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:9px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <button onclick="addCustomReminder()"
            style="background:var(--green-dark);color:#fff;border:none;padding:10px 20px;
            border-radius:20px;font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;
            cursor:pointer;width:100%;transition:background 0.2s;"
            onmouseover="this.style.background='var(--green-mid)'"
            onmouseout="this.style.background='var(--green-dark)'">
            + Add Reminder
          </button>
        </div>

        <!-- Custom reminder list -->
        <div id="custom-list"></div>
      </div>

      <!-- APP SUGGESTIONS TAB -->
      <div id="rm-app" style="display:none;">
        <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px;line-height:1.5;">
          These reminders fire automatically at the set time. Toggle categories on or off below.
        </p>
        <div id="app-suggestions-list"></div>
      </div>

    </div>`;

  document.body.appendChild(modal);
  renderCustomList();
  renderAppSuggestions();
}

function rmShowTab(tab) {
  document.getElementById('rm-custom').style.display = tab === 'custom' ? 'block' : 'none';
  document.getElementById('rm-app').style.display    = tab === 'app'    ? 'block' : 'none';
  const cBtn = document.getElementById('rm-tab-custom');
  const aBtn = document.getElementById('rm-tab-app');
  cBtn.style.background = tab === 'custom' ? 'var(--bg-card)' : 'transparent';
  cBtn.style.color      = tab === 'custom' ? 'var(--green-dark)' : 'var(--text-muted)';
  aBtn.style.background = tab === 'app'    ? 'var(--bg-card)' : 'transparent';
  aBtn.style.color      = tab === 'app'    ? 'var(--green-dark)' : 'var(--text-muted)';
}

function addCustomReminder() {
  const time  = document.getElementById('new-r-time').value;
  const title = document.getElementById('new-r-title').value.trim();
  const msg   = document.getElementById('new-r-msg').value.trim();
  const cat   = document.getElementById('new-r-cat').value;

  if (!time)  { showToast('Please set a time'); return; }
  if (!title) { showToast('Please enter a title'); return; }

  const list = getCustomReminders();
  const icons = { Hydration:'💧', Movement:'🏃', Nutrition:'🥗', Wellness:'🧠', Sleep:'🌙', Medication:'💊', Custom:'⭐' };
  list.push({
    id:       'custom-' + Date.now(),
    icon:     icons[cat] || '⭐',
    title,
    message:  msg || title,
    time,
    category: cat
  });
  saveCustomReminders(list);

  // Clear inputs
  ['new-r-time','new-r-title','new-r-msg'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('new-r-cat').value = 'Hydration';

  renderCustomList();
  showToast('Reminder added ✓');
}

function deleteCustomReminder(id) {
  const list = getCustomReminders().filter(r => r.id !== id);
  saveCustomReminders(list);
  renderCustomList();
  showToast('Reminder removed');
}

function renderCustomList() {
  const el   = document.getElementById('custom-list');
  if (!el) return;
  const list = getCustomReminders();
  if (!list.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.85rem;">
      No custom reminders yet.<br>Add one above ↑</div>`;
    return;
  }
  el.innerHTML = list.map(r => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;
      background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
      margin-bottom:8px;">
      <span style="font-size:1.1rem;">${r.icon}</span>
      <div style="flex:1;">
        <div style="font-size:0.85rem;font-weight:500;color:var(--text-main);">${r.title}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${r.time} · ${r.category}</div>
      </div>
      <button onclick="deleteCustomReminder('${r.id}')"
        style="background:none;border:1px solid var(--border);color:var(--text-muted);
        padding:4px 10px;border-radius:8px;cursor:pointer;font-size:0.75rem;
        font-family:'DM Sans',sans-serif;transition:all 0.2s;"
        onmouseover="this.style.background='#fff5f5';this.style.color='#c0392b'"
        onmouseout="this.style.background='none';this.style.color='var(--text-muted)'">
        Delete
      </button>
    </div>`).join('');
}

function renderAppSuggestions() {
  const el = document.getElementById('app-suggestions-list');
  if (!el) return;
  const disabled = getDisabledCategories();
  const cats = [...new Set(APP_REMINDERS.map(r => r.category))];

  el.innerHTML = cats.map(cat => {
    const items   = APP_REMINDERS.filter(r => r.category === cat);
    const enabled = !disabled.includes(cat);
    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);
          border-radius:var(--radius-sm) var(--radius-sm) 0 0;border-bottom:none;">
          <span style="font-size:0.85rem;font-weight:600;color:var(--text-main);">${cat}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.72rem;color:var(--text-light);">${items.length} reminders</span>
            <label style="position:relative;display:inline-block;width:40px;height:22px;cursor:pointer;">
              <input type="checkbox" ${enabled ? 'checked' : ''}
                onchange="toggleAppCategory('${cat}', this.checked)"
                style="opacity:0;width:0;height:0;"/>
              <span style="position:absolute;inset:0;border-radius:22px;
                background:${enabled ? 'var(--green-accent)' : 'var(--border)'};
                transition:background 0.2s;" id="acat-bg-${cat}"></span>
              <span style="position:absolute;top:2px;left:${enabled ? '20px' : '2px'};
                width:18px;height:18px;border-radius:50%;background:#fff;
                transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"
                id="acat-knob-${cat}"></span>
            </label>
          </div>
        </div>
        <div style="background:var(--bg);border:1px solid var(--border);
          border-radius:0 0 var(--radius-sm) var(--radius-sm);padding:8px;">
          ${items.map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:7px 8px;
              opacity:${enabled ? '1' : '0.4'};">
              <span>${r.icon}</span>
              <span style="flex:1;font-size:0.8rem;color:var(--text-muted);">${r.title}</span>
              <span style="font-size:0.75rem;color:var(--text-light);font-weight:500;">${r.time}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function toggleAppCategory(cat, enabled) {
  let disabled = getDisabledCategories();
  if (enabled) disabled = disabled.filter(c => c !== cat);
  else if (!disabled.includes(cat)) disabled.push(cat);
  localStorage.setItem('cm_disabled_cats', JSON.stringify(disabled));
  const bg   = document.getElementById(`acat-bg-${cat}`);
  const knob = document.getElementById(`acat-knob-${cat}`);
  if (bg)   bg.style.background = enabled ? 'var(--green-accent)' : 'var(--border)';
  if (knob) knob.style.left     = enabled ? '20px' : '2px';
}

// ── NOTIFICATION BELL IN NAV ─────────────────
function injectNotifBell() {
  const nav = document.querySelector('.nav-auth');
  if (!nav || document.getElementById('notif-bell')) return;
  const bell = document.createElement('button');
  bell.id = 'notif-bell';
  bell.innerHTML = '🔔';
  bell.title = 'Manage Reminders';
  bell.onclick = openReminderManager;
  Object.assign(bell.style, {
    background:  'none',
    border:      '1px solid var(--border)',
    borderRadius:'50%',
    width:       '34px',
    height:      '34px',
    cursor:      'pointer',
    fontSize:    '0.9rem',
    display:     'flex',
    alignItems:  'center',
    justifyContent: 'center',
    transition:  'all 0.2s',
  });
  bell.onmouseover = () => bell.style.background = 'var(--green-light)';
  bell.onmouseout  = () => bell.style.background = 'none';
  nav.insertBefore(bell, nav.firstChild);
}

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectNotifBell();
  // Run first check after 3 seconds
  setTimeout(checkReminders, 3000);
  // Then every minute
  setInterval(checkReminders, 60 * 1000);
});