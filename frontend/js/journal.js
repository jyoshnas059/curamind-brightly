// ─────────────────────────────────────────────
//  CuraMind · journal.js
//  Save to: frontend/js/journal.js
// ─────────────────────────────────────────────

const JOURNAL_PROMPTS = [
  'What are three things you are grateful for today?',
  'What made you smile today, even briefly?',
  'What is one challenge you faced today and what did you learn?',
  'How is your body feeling right now? Describe it gently.',
  'What is one kind thing you did for yourself today?',
  'What emotion is most present for you right now?',
  'Write about one small moment of joy from your day.',
  'What would you like to let go of today?',
  'What do you need most right now — rest, connection, or movement?',
  'What are you proud of yourself for this week?',
  'Describe how your energy levels felt today.',
  'What is one thing you are looking forward to tomorrow?',
];

function getJournalEntries() {
  try { return JSON.parse(localStorage.getItem('cm_journal') || '[]'); } catch { return []; }
}
function saveJournalEntries(entries) {
  localStorage.setItem('cm_journal', JSON.stringify(entries));
}
function getTodayPrompt() {
  const day = Math.floor(Date.now() / 86400000);
  return JOURNAL_PROMPTS[day % JOURNAL_PROMPTS.length];
}

function openJournal() {
  const existing = document.getElementById('journal-modal');
  if (existing) existing.remove();

  const entries = getJournalEntries();
  const modal   = document.createElement('div');
  modal.id = 'journal-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:580px;max-height:90vh;overflow-y:auto;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">📓 Gratitude Journal</p>
        <button onclick="document.getElementById('journal-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Write freely — your entries are private and stored only on this device.</p>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:24px;">
        <button id="jt-write" onclick="jTab('write')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.83rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">✏️ Write</button>
        <button id="jt-history" onclick="jTab('history')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.83rem;
          background:transparent;color:var(--text-muted);">📚 Past Entries (${entries.length})</button>
      </div>

      <!-- Write tab -->
      <div id="j-write">
        <!-- Today's prompt -->
        <div style="background:var(--green-light);border-radius:var(--radius-sm);
          padding:14px 16px;margin-bottom:16px;display:flex;gap:12px;align-items:flex-start;">
          <span style="font-size:1.2rem;">💡</span>
          <div>
            <div style="font-size:0.7rem;font-weight:600;color:var(--green-dark);
              letter-spacing:0.08em;margin-bottom:4px;">TODAY'S PROMPT</div>
            <div style="font-size:0.85rem;color:var(--green-dark);line-height:1.5;
              font-style:italic;">"${getTodayPrompt()}"</div>
          </div>
        </div>

        <!-- Mood selector -->
        <div style="margin-bottom:14px;">
          <label style="font-size:0.75rem;font-weight:500;color:var(--text-muted);
            display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
            How are you feeling right now?
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;" id="j-moods">
            ${['😊 Happy','😌 Calm','😔 Sad','😤 Frustrated','😰 Anxious','😴 Tired','🤩 Excited','🥲 Grateful'].map(m => `
              <button onclick="jSelectMood(this)" data-mood="${m}"
                style="padding:6px 14px;border:1px solid var(--border);border-radius:20px;
                background:var(--bg);font-size:0.8rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;"
                onmouseover="this.style.background='var(--green-light)'"
                onmouseout="if(!this.classList.contains('j-mood-sel'))this.style.background='var(--bg)'">${m}</button>`).join('')}
          </div>
        </div>

        <!-- Entry textarea -->
        <div style="margin-bottom:14px;">
          <label style="font-size:0.75rem;font-weight:500;color:var(--text-muted);
            display:block;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">
            Your entry
          </label>
          <textarea id="j-text" placeholder="Write whatever comes to mind. There's no right or wrong..."
            style="width:100%;min-height:150px;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:14px;font-family:'DM Sans',sans-serif;
            font-size:0.9rem;color:var(--text-main);resize:vertical;outline:none;
            transition:border-color 0.2s;line-height:1.7;"
            onfocus="this.style.borderColor='var(--green-accent)'"
            onblur="this.style.borderColor='var(--border)'"
            oninput="updateJWordCount(this)"></textarea>
          <div id="j-wordcount" style="font-size:0.72rem;color:var(--text-light);
            text-align:right;margin-top:4px;">0 words</div>
        </div>

        <!-- Prompts -->
        <div style="margin-bottom:20px;">
          <div style="font-size:0.72rem;color:var(--text-light);margin-bottom:8px;">
            Need inspiration? Try a different prompt:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="j-prompt-tags">
            ${JOURNAL_PROMPTS.slice(0,5).map((p,i) => `
              <button onclick="usePrompt(${i})"
                style="padding:4px 12px;border:1px solid var(--border);border-radius:12px;
                background:var(--bg);font-size:0.72rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;text-align:left;"
                onmouseover="this.style.background='var(--green-light)'"
                onmouseout="this.style.background='var(--bg)'">
                ${p.substring(0,40)}…
              </button>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('journal-modal').remove()"
            class="btn-cancel">Cancel</button>
          <button onclick="saveJournalEntry()" class="btn-save">Save Entry ✓</button>
        </div>
      </div>

      <!-- History tab -->
      <div id="j-history" style="display:none;">
        <div id="j-entries-list"></div>
      </div>

    </div>`;

  document.body.appendChild(modal);
}

let selectedMood = '';

function jSelectMood(btn) {
  document.querySelectorAll('#j-moods button').forEach(b => {
    b.classList.remove('j-mood-sel');
    b.style.background  = 'var(--bg)';
    b.style.borderColor = 'var(--border)';
    b.style.color       = 'var(--text-muted)';
  });
  btn.classList.add('j-mood-sel');
  btn.style.background  = 'var(--green-dark)';
  btn.style.borderColor = 'var(--green-dark)';
  btn.style.color       = '#fff';
  selectedMood = btn.dataset.mood;
}

function updateJWordCount(el) {
  const words = el.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('j-wordcount').textContent = words + ' word' + (words !== 1 ? 's' : '');
}

function usePrompt(index) {
  const ta = document.getElementById('j-text');
  ta.value = '';
  ta.placeholder = JOURNAL_PROMPTS[index];
  ta.focus();
}

function jTab(tab) {
  document.getElementById('j-write').style.display   = tab === 'write'   ? 'block' : 'none';
  document.getElementById('j-history').style.display = tab === 'history' ? 'block' : 'none';
  document.getElementById('jt-write').style.background   = tab === 'write'   ? 'var(--bg-card)' : 'transparent';
  document.getElementById('jt-write').style.color        = tab === 'write'   ? 'var(--green-dark)' : 'var(--text-muted)';
  document.getElementById('jt-history').style.background = tab === 'history' ? 'var(--bg-card)' : 'transparent';
  document.getElementById('jt-history').style.color      = tab === 'history' ? 'var(--green-dark)' : 'var(--text-muted)';
  if (tab === 'history') renderJournalHistory();
}

function saveJournalEntry() {
  const text = document.getElementById('j-text').value.trim();
  if (!text) { if (typeof showToast === 'function') showToast('Please write something first'); return; }

  const entries = getJournalEntries();
  entries.unshift({
    id:      Date.now(),
    date:    new Date().toISOString(),
    mood:    selectedMood,
    text,
    words:   text.split(/\s+/).filter(Boolean).length
  });
  saveJournalEntries(entries);
  document.getElementById('journal-modal').remove();
  if (typeof showToast === 'function') showToast('📓 Journal entry saved ✓');
}

function renderJournalHistory() {
  const el      = document.getElementById('j-entries-list');
  const entries = getJournalEntries();

  if (!entries.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:2rem;margin-bottom:8px;">📓</div>
      <div style="font-size:0.85rem;">No entries yet. Start writing!</div></div>`;
    return;
  }

  el.innerHTML = entries.map(e => {
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const timeStr = d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:16px;margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            ${e.mood ? `<span style="font-size:0.82rem;">${e.mood}</span>` : ''}
            <span style="font-size:0.75rem;color:var(--text-muted);">${dateStr} · ${timeStr}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.7rem;color:var(--text-light);">${e.words} words</span>
            <button onclick="deleteJournalEntry(${e.id})"
              style="background:none;border:none;color:var(--text-light);cursor:pointer;
              font-size:0.75rem;padding:2px 6px;border-radius:4px;transition:all 0.2s;"
              onmouseover="this.style.color='#c0392b'"
              onmouseout="this.style.color='var(--text-light)'">✕</button>
          </div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.7;
          white-space:pre-wrap;margin:0;">${e.text.length > 200 ? e.text.substring(0,200) + '…' : e.text}</p>
      </div>`;
  }).join('');
}

function deleteJournalEntry(id) {
  const entries = getJournalEntries().filter(e => e.id !== id);
  saveJournalEntries(entries);
  renderJournalHistory();
  if (typeof showToast === 'function') showToast('Entry deleted');
}