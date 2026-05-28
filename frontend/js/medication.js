// ─────────────────────────────────────────────
//  CuraMind · medication.js
//  Save to: frontend/js/medication.js
// ─────────────────────────────────────────────

// Health issue → suggested medications/supplements
const HEALTH_SUGGESTIONS = {
  'headache':       [{ name:'Paracetamol 500mg', dose:'1 tablet', freq:'Every 6 hours if needed', note:'Take with water after food' }],
  'fever':          [{ name:'Paracetamol 500mg', dose:'1–2 tablets', freq:'Every 6 hours', note:'Drink plenty of fluids' },
                     { name:'Ibuprofen 400mg',   dose:'1 tablet',   freq:'Every 8 hours',  note:'Take with food only' }],
  'cold':           [{ name:'Vitamin C 1000mg',  dose:'1 tablet', freq:'Once daily',       note:'Take in the morning' },
                     { name:'Zinc 50mg',         dose:'1 tablet', freq:'Once daily',       note:'Take with food' }],
  'anxiety':        [{ name:'Magnesium Glycinate', dose:'400mg', freq:'Once before bed',  note:'Helps with sleep and anxiety' },
                     { name:'Ashwagandha',         dose:'300mg', freq:'Twice daily',       note:'Take with meals' }],
  'sleep':          [{ name:'Melatonin 5mg',     dose:'1 tablet', freq:'30 mins before bed', note:'Avoid screens after taking' }],
  'vitamin d':      [{ name:'Vitamin D3 2000IU', dose:'1 capsule', freq:'Once daily with food', note:'Best absorbed with fat' }],
  'iron deficiency':[{ name:'Iron 65mg',         dose:'1 tablet', freq:'Once daily',      note:'Take on empty stomach with Vitamin C' }],
  'diabetes':       [{ name:'Metformin',         dose:'As prescribed', freq:'With meals', note:'⚠️ Consult doctor for exact dose' }],
  'blood pressure': [{ name:'Regular monitoring',dose:'—',        freq:'Daily',           note:'Check BP same time each day' }],
  'digestion':      [{ name:'Probiotic',         dose:'1 capsule', freq:'Once daily',      note:'Take before breakfast' },
                     { name:'Ginger Tea',        dose:'1 cup',    freq:'After meals',      note:'Natural digestive aid' }],
  'joint pain':     [{ name:'Glucosamine 1500mg',dose:'1 tablet', freq:'Once daily',       note:'Results take 4–8 weeks' },
                     { name:'Omega-3 Fish Oil',  dose:'1000mg',   freq:'Twice daily',      note:'Anti-inflammatory properties' }],
};

function getMedications() {
  try { return JSON.parse(localStorage.getItem('cm_medications_local') || '[]'); } catch { return []; }
}
function saveMedications(list) {
  localStorage.setItem('cm_medications_local', JSON.stringify(list));
}

function openMedicationManager() {
  const existing = document.getElementById('med-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'med-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:580px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">💊 Medication Reminders</p>
        <button onclick="document.getElementById('med-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Add medications manually, from a prescription, or get suggestions based on your health issues.</p>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:24px;">
        <button id="med-tab-add" onclick="medTab('add')"
          style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.8rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">➕ Add</button>
        <button id="med-tab-suggest" onclick="medTab('suggest')"
          style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.8rem;
          background:transparent;color:var(--text-muted);">🤖 Suggestions</button>
        <button id="med-tab-list" onclick="medTab('list')"
          style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.8rem;
          background:transparent;color:var(--text-muted);">📋 My Meds</button>
        <button id="med-tab-prescription" onclick="medTab('prescription')"
          style="flex:1;padding:7px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.8rem;
          background:transparent;color:var(--text-muted);">📷 Scan</button>
      </div>

      <!-- ADD TAB -->
      <div id="med-add">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Medication Name *</label>
            <input id="med-name" type="text" placeholder="e.g. Paracetamol 500mg"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Dosage</label>
            <input id="med-dose" type="text" placeholder="e.g. 1 tablet"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Reminder Times</label>
            <div id="med-times-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;"></div>
            <div style="display:flex;gap:6px;">
              <input id="med-time-input" type="time"
                style="flex:1;background:var(--bg);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:9px 10px;font-family:'DM Sans',sans-serif;
                font-size:0.85rem;outline:none;"/>
              <button onclick="addMedTime()"
                style="background:var(--green-light);border:none;border-radius:var(--radius-sm);
                padding:9px 14px;cursor:pointer;font-size:0.85rem;color:var(--green-dark);">+ Add</button>
            </div>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Duration</label>
            <select id="med-duration" style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;">
              <option>Ongoing</option>
              <option>3 days</option>
              <option>5 days</option>
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
              <option>Custom</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
            text-transform:uppercase;letter-spacing:0.05em;">Notes (optional)</label>
          <input id="med-note" type="text" placeholder="e.g. Take after food"
            style="width:100%;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
            font-size:0.88rem;color:var(--text-main);outline:none;"/>
        </div>
        <button onclick="addMedication()" class="btn-save" style="width:100%;">
          + Add Medication & Set Reminders
        </button>
      </div>

      <!-- SUGGEST TAB -->
      <div id="med-suggest" style="display:none;">
        <div style="background:var(--bg);border:1px solid var(--border);
          border-radius:var(--radius-sm);padding:16px;margin-bottom:16px;">
          <label style="font-size:0.78rem;font-weight:500;color:var(--text-main);
            display:block;margin-bottom:8px;">What health issue are you dealing with?</label>
          <div style="display:flex;gap:8px;">
            <input id="health-issue-input" type="text"
              placeholder="e.g. headache, anxiety, sleep, cold..."
              style="flex:1;background:var(--bg-card);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"
              onkeydown="if(event.key==='Enter')searchSuggestions()"/>
            <button onclick="searchSuggestions()" class="btn-save" style="padding:10px 18px;">Search</button>
          </div>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
            ${Object.keys(HEALTH_SUGGESTIONS).map(k => `
              <button onclick="document.getElementById('health-issue-input').value='${k}';searchSuggestions()"
                style="padding:4px 12px;border:1px solid var(--border);border-radius:12px;
                background:var(--bg-card);font-size:0.75rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;"
                onmouseover="this.style.background='var(--green-light)'"
                onmouseout="this.style.background='var(--bg-card)'">${k}</button>`).join('')}
          </div>
        </div>
        <div id="suggestions-result"></div>
        <div style="padding:12px;background:#fffbf0;border:1px solid #f0d060;border-radius:var(--radius-sm);
          font-size:0.75rem;color:#7a5c00;margin-top:12px;">
          ⚠️ These are general wellness suggestions only — not medical prescriptions. Always consult a qualified doctor before starting any medication.
        </div>
      </div>

      <!-- MY MEDS TAB -->
      <div id="med-list" style="display:none;">
        <div id="med-list-content"></div>
      </div>

      <!-- SCAN PRESCRIPTION TAB -->
      <div id="med-prescription" style="display:none;">
        <div style="background:var(--bg);border:1px dashed var(--green-accent);
          border-radius:var(--radius-sm);padding:28px;text-align:center;margin-bottom:16px;">
          <div style="font-size:2.5rem;margin-bottom:12px;">📷</div>
          <p style="font-size:0.88rem;font-weight:500;color:var(--text-main);margin-bottom:6px;">
            Upload your prescription
          </p>
          <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:16px;line-height:1.5;">
            Take a clear photo of your prescription and upload it. We'll extract the medication names, dosage and timing and add them as reminders.
          </p>
          <input type="file" id="prescription-upload" accept="image/*"
            style="display:none;" onchange="processPrescription(this)"/>
          <button onclick="document.getElementById('prescription-upload').click()"
            style="background:var(--green-dark);color:#fff;border:none;padding:12px 24px;
            border-radius:20px;font-family:'DM Sans',sans-serif;font-size:0.88rem;
            font-weight:500;cursor:pointer;">
            📂 Choose Image
          </button>
        </div>
        <div id="prescription-result"></div>
        <div style="padding:12px;background:#fffbf0;border:1px solid #f0d060;
          border-radius:var(--radius-sm);font-size:0.75rem;color:#7a5c00;">
          ⚠️ Always verify extracted information against your original prescription before saving.
        </div>
      </div>

    </div>`;

  document.body.appendChild(modal);
  renderMedList();
}

let medTimes = [];

function addMedTime() {
  const t = document.getElementById('med-time-input').value;
  if (!t || medTimes.includes(t)) return;
  medTimes.push(t);
  renderMedTimes();
  document.getElementById('med-time-input').value = '';
}

function removeMedTime(t) {
  medTimes = medTimes.filter(x => x !== t);
  renderMedTimes();
}

function renderMedTimes() {
  const el = document.getElementById('med-times-list');
  if (!el) return;
  el.innerHTML = medTimes.map(t => `
    <span style="background:var(--green-dark);color:#fff;padding:4px 10px;border-radius:12px;
      font-size:0.78rem;display:flex;align-items:center;gap:6px;">
      ${t}
      <button onclick="removeMedTime('${t}')"
        style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;
        font-size:0.75rem;padding:0;">✕</button>
    </span>`).join('');
}

function addMedication() {
  const name = document.getElementById('med-name').value.trim();
  if (!name) { if (typeof showToast === 'function') showToast('Please enter medication name'); return; }

  const meds = getMedications();
  meds.push({
    id:       Date.now(),
    name,
    dose:     document.getElementById('med-dose').value.trim(),
    times:    [...medTimes],
    duration: document.getElementById('med-duration').value,
    note:     document.getElementById('med-note').value.trim(),
    active:   true,
    added:    new Date().toISOString(),
  });
  saveMedications(meds);
  scheduleMedReminders(meds[meds.length - 1]);

  // Clear form
  ['med-name','med-dose','med-note'].forEach(id => document.getElementById(id).value = '');
  medTimes = [];
  renderMedTimes();

  medTab('list');
  renderMedList();
  if (typeof showToast === 'function') showToast('💊 Medication added with reminders ✓');
}

function scheduleMedReminders(med) {
  // Save med reminders so reminders.js can pick them up
  const existing = JSON.parse(localStorage.getItem('cm_custom_reminders') || '[]');
  med.times.forEach(t => {
    existing.push({
      id:       'med-' + med.id + '-' + t,
      icon:     '💊',
      title:    med.name,
      message:  `Time to take your ${med.name}${med.dose ? ' — ' + med.dose : ''}.${med.note ? ' ' + med.note : ''}`,
      time:     t,
      category: 'Medication'
    });
  });
  localStorage.setItem('cm_custom_reminders', JSON.stringify(existing));
}

function renderMedList() {
  const el   = document.getElementById('med-list-content');
  if (!el) return;
  const meds = getMedications().filter(m => m.active);

  if (!meds.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:2rem;margin-bottom:8px;">💊</div>
      <div style="font-size:0.85rem;">No medications added yet.</div></div>`;
    return;
  }

  el.innerHTML = meds.map(m => `
    <div style="background:var(--bg-card);border:1px solid var(--border);
      border-radius:var(--radius-sm);padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="font-size:1.4rem;">💊</span>
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:var(--text-main);margin-bottom:3px;">${m.name}</div>
            ${m.dose ? `<div style="font-size:0.78rem;color:var(--text-muted);">Dose: ${m.dose}</div>` : ''}
            ${m.times.length ? `<div style="font-size:0.78rem;color:var(--green-accent);margin-top:4px;">
              🔔 ${m.times.join(', ')}</div>` : ''}
            ${m.note ? `<div style="font-size:0.75rem;color:var(--text-light);margin-top:2px;font-style:italic;">${m.note}</div>` : ''}
            <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px;">
              Duration: ${m.duration}</div>
          </div>
        </div>
        <button onclick="deleteMedication(${m.id})"
          style="background:none;border:1px solid var(--border);color:var(--text-muted);
          padding:5px 10px;border-radius:8px;cursor:pointer;font-size:0.75rem;
          font-family:'DM Sans',sans-serif;white-space:nowrap;flex-shrink:0;"
          onmouseover="this.style.background='#fff5f5';this.style.color='#c0392b'"
          onmouseout="this.style.background='none';this.style.color='var(--text-muted)'">Remove</button>
      </div>
    </div>`).join('');
}

function deleteMedication(id) {
  const meds = getMedications().map(m => m.id === id ? { ...m, active: false } : m);
  saveMedications(meds);
  // Remove from custom reminders too
  const reminders = JSON.parse(localStorage.getItem('cm_custom_reminders') || '[]')
    .filter(r => !r.id.startsWith('med-' + id));
  localStorage.setItem('cm_custom_reminders', JSON.stringify(reminders));
  renderMedList();
  if (typeof showToast === 'function') showToast('Medication removed');
}

function searchSuggestions() {
  const issue = document.getElementById('health-issue-input').value.trim().toLowerCase();
  const el    = document.getElementById('suggestions-result');
  if (!issue) { el.innerHTML = ''; return; }

  const key  = Object.keys(HEALTH_SUGGESTIONS).find(k => issue.includes(k) || k.includes(issue));
  const sugs = key ? HEALTH_SUGGESTIONS[key] : null;

  if (!sugs) {
    el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
      No suggestions found for "${issue}". Try: ${Object.keys(HEALTH_SUGGESTIONS).slice(0,4).join(', ')}...</div>`;
    return;
  }

  el.innerHTML = `
    <div style="margin-bottom:8px;font-size:0.78rem;font-weight:500;color:var(--text-muted);">
      Suggestions for: <strong>${key}</strong></div>
    ${sugs.map(s => `
      <div style="background:var(--bg-card);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-size:0.88rem;font-weight:600;color:var(--text-main);margin-bottom:4px;">
              💊 ${s.name}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">Dose: ${s.dose} · ${s.freq}</div>
            ${s.note ? `<div style="font-size:0.75rem;color:var(--green-accent);margin-top:3px;
              font-style:italic;">💡 ${s.note}</div>` : ''}
          </div>
          <button onclick="addSuggestedMed('${s.name}','${s.dose}','${s.note}')"
            style="background:var(--green-dark);color:#fff;border:none;padding:7px 14px;
            border-radius:12px;font-family:'DM Sans',sans-serif;font-size:0.78rem;
            font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;">
            + Add
          </button>
        </div>
      </div>`).join('')}`;
}

function addSuggestedMed(name, dose, note) {
  const meds = getMedications();
  meds.push({ id: Date.now(), name, dose, times: [], duration: 'Ongoing', note, active: true, added: new Date().toISOString() });
  saveMedications(meds);
  medTab('list');
  renderMedList();
  if (typeof showToast === 'function') showToast(`💊 ${name} added — set a reminder time in My Meds`);
}

function medTab(tab) {
  ['add','suggest','list','prescription'].forEach(t => {
    const el  = document.getElementById(`med-${t}`);
    const btn = document.getElementById(`med-tab-${t}`);
    if (el)  el.style.display     = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background = t === tab ? 'var(--bg-card)' : 'transparent';
      btn.style.color      = t === tab ? 'var(--green-dark)' : 'var(--text-muted)';
      btn.style.fontWeight = t === tab ? '500' : '400';
    }
  });
  if (tab === 'list') renderMedList();
}

// ── PROCESS PRESCRIPTION IMAGE (text extraction) ──
async function processPrescription(input) {
  const file = input.files[0];
  if (!file) return;

  const el = document.getElementById('prescription-result');
  el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:0.85rem;">
    <div style="font-size:1.5rem;margin-bottom:8px;">⏳</div>Analysing prescription...</div>`;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result.split(',')[1];
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text', text: 'Extract medications from this prescription. Return ONLY a JSON array like: [{"name":"Med Name","dose":"500mg","frequency":"twice daily","time":"08:00","note":"after food"}]. If not a prescription, return [].' }
            ]
          }]
        })
      });
      const data = await response.json();
      const text = data?.content?.[0]?.text || '[]';
      const meds = JSON.parse(text.replace(/```json|```/g,'').trim());
      showPrescriptionResults(meds);
    } catch(err) {
      el.innerHTML = `<div style="padding:16px;color:#c0392b;font-size:0.85rem;">
        Could not read prescription automatically. Please add medications manually.</div>`;
    }
  };
  reader.readAsDataURL(file);
}

function showPrescriptionResults(meds) {
  const el = document.getElementById('prescription-result');
  if (!meds.length) {
    el.innerHTML = `<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;text-align:center;">
      No medications detected. Please add them manually.</div>`;
    return;
  }
  el.innerHTML = `
    <div style="font-size:0.82rem;font-weight:500;color:var(--text-main);margin-bottom:10px;">
      Found ${meds.length} medication(s) — review and save:</div>
    ${meds.map((m,i) => `
      <div style="background:var(--bg-card);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;">
        <div style="font-size:0.88rem;font-weight:600;color:var(--text-main);">💊 ${m.name}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:3px;">
          ${m.dose || ''}${m.frequency ? ' · ' + m.frequency : ''}
          ${m.time ? ' · Reminder: ' + m.time : ''}</div>
        ${m.note ? `<div style="font-size:0.75rem;color:var(--green-accent);margin-top:3px;">${m.note}</div>` : ''}
      </div>`).join('')}
    <button onclick="savePrescriptionMeds(${JSON.stringify(meds).replace(/'/g,'\\\'').replace(/"/g,'&quot;')})"
      class="btn-save" style="width:100%;margin-top:8px;">Save All & Set Reminders</button>`;
}

function savePrescriptionMeds(meds) {
  const existing = getMedications();
  meds.forEach(m => {
    const entry = { id: Date.now() + Math.random(), name: m.name, dose: m.dose || '',
      times: m.time ? [m.time] : [], duration: 'As prescribed', note: m.note || '', active: true, added: new Date().toISOString() };
    existing.push(entry);
    if (m.time) scheduleMedReminders(entry);
  });
  saveMedications(existing);
  medTab('list');
  if (typeof showToast === 'function') showToast(`💊 ${meds.length} medication(s) saved ✓`);
}