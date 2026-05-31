// ─────────────────────────────────────────────
//  CuraMind · profile.js
//  User Profile Page — view & edit profile,
//  update health targets, change password
//  Save to: frontend/js/profile.js
// ─────────────────────────────────────────────

function openProfilePage() {
  const user    = Auth.getUser();
  const targets = JSON.parse(localStorage.getItem('cm_targets') || '{}');

  const existing = document.getElementById('profile-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'profile-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(20,40,28,0.5);
    backdrop-filter:blur(6px);z-index:300;
    display:flex;align-items:center;justify-content:center;
    animation:fadeIn 0.2s ease;
  `;

  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:var(--radius);
      width:100%;max-width:540px;max-height:90vh;overflow-y:auto;
      box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:24px 28px 0;">
        <div>
          <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;
            font-weight:700;color:var(--green-dark);margin-bottom:4px;">My Profile</h2>
          <p style="font-size:0.8rem;color:var(--text-muted);">Manage your account and health targets</p>
        </div>
        <button onclick="document.getElementById('profile-modal').remove()"
          style="background:none;border:none;font-size:1.3rem;cursor:pointer;
          color:var(--text-muted);padding:4px;">✕</button>
      </div>

      <!-- Avatar + Name -->
      <div style="padding:20px 28px;display:flex;align-items:center;gap:16px;
        border-bottom:1px solid var(--border);margin-top:20px;">
        <div style="width:60px;height:60px;border-radius:50%;
          background:var(--green-dark);display:flex;align-items:center;
          justify-content:center;font-size:1.6rem;color:#fff;font-weight:700;
          flex-shrink:0;">
          ${(user?.name || 'U')[0].toUpperCase()}
        </div>
        <div>
          <div style="font-size:1rem;font-weight:600;color:var(--text-main);">
            ${user?.name || 'User'}
          </div>
          <div style="font-size:0.82rem;color:var(--text-muted);">${user?.email || ''}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:2px;">
            Member since ${user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN',{month:'long',year:'numeric'}) : 'recently'}
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin:20px 28px 0;">
        <button id="pt-account" onclick="profileTab('account')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">👤 Account</button>
        <button id="pt-targets" onclick="profileTab('targets')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">🎯 Targets</button>
        <button id="pt-security" onclick="profileTab('security')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">🔒 Security</button>
      </div>

      <!-- TAB: ACCOUNT -->
      <div id="profile-account" style="padding:20px 28px 28px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
          ${profileField('Full Name', 'p-name', user?.name || '', 'text', 'Your name')}
          ${profileField('Email', 'p-email', user?.email || '', 'email', 'you@example.com')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px;">
          ${profileField('Age', 'p-age', localStorage.getItem('cm_age') || '', 'number', '25')}
          ${profileField('Height (cm)', 'p-height', localStorage.getItem('cm_height') || '', 'number', '165')}
          ${profileField('Weight (kg)', 'p-weight', localStorage.getItem('cm_weight') || '', 'number', '60')}
        </div>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:0.75rem;font-weight:500;
            color:var(--text-muted);margin-bottom:6px;text-transform:uppercase;
            letter-spacing:0.05em;">Activity Level</label>
          <select id="p-activity" style="width:100%;background:var(--bg);
            border:1px solid var(--border);border-radius:var(--radius-sm);
            padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:0.88rem;
            color:var(--text-main);outline:none;">
            <option value="sedentary" ${localStorage.getItem('cm_activity')==='sedentary'?'selected':''}>Sedentary</option>
            <option value="light" ${localStorage.getItem('cm_activity')==='light'?'selected':''}>Light exercise</option>
            <option value="moderate" ${!localStorage.getItem('cm_activity')||localStorage.getItem('cm_activity')==='moderate'?'selected':''}>Moderate exercise</option>
            <option value="active" ${localStorage.getItem('cm_activity')==='active'?'selected':''}>Active</option>
            <option value="very_active" ${localStorage.getItem('cm_activity')==='very_active'?'selected':''}>Very active</option>
          </select>
        </div>
        <div id="profile-account-error" style="display:none;color:#c0392b;
          font-size:0.8rem;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button onclick="document.getElementById('profile-modal').remove()"
            class="btn-cancel" style="padding:10px 20px;border-radius:20px;
            background:transparent;border:1px solid var(--border);
            color:var(--text-muted);cursor:pointer;font-family:'DM Sans',sans-serif;">
            Cancel
          </button>
          <button onclick="saveProfileAccount()"
            style="padding:10px 24px;border-radius:20px;background:var(--green-dark);
            color:#fff;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;
            font-size:0.85rem;font-weight:500;">
            Save Changes ✓
          </button>
        </div>
      </div>

      <!-- TAB: TARGETS -->
      <div id="profile-targets" style="display:none;padding:20px 28px 28px;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">
          Update your daily health targets. These affect your dashboard progress bars.
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          ${profileField('Calories (kcal)', 'pt-calories', targets.calories || '', 'number', '2000')}
          ${profileField('Hydration (L)', 'pt-hydration', targets.hydration || '', 'number', '2.5')}
          ${profileField('Steps / day', 'pt-steps', targets.steps || '', 'number', '10000')}
          ${profileField('Sleep (hrs)', 'pt-sleep', targets.sleep || '', 'number', '7.5')}
          ${profileField('Protein (g)', 'pt-protein', targets.protein || '', 'number', '60')}
        </div>
        <div style="background:var(--green-light);border-radius:var(--radius-sm);
          padding:12px 16px;margin-bottom:20px;font-size:0.8rem;color:var(--green-dark);">
          💡 Use the <strong>Health Calculator</strong> on the dashboard to auto-calculate all targets based on your body stats.
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <button onclick="saveProfileTargets()"
            style="padding:10px 24px;border-radius:20px;background:var(--green-dark);
            color:#fff;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;
            font-size:0.85rem;font-weight:500;">
            Save Targets ✓
          </button>
        </div>
      </div>

      <!-- TAB: SECURITY -->
      <div id="profile-security" style="display:none;padding:20px 28px 28px;">
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px;">
          Change your account password.
        </p>
        ${profileField('Current Password', 'ps-current', '', 'password', '••••••••')}
        <div style="margin-top:14px;">
          ${profileField('New Password', 'ps-new', '', 'password', 'min 6 characters')}
        </div>
        <div style="margin-top:14px;margin-bottom:20px;">
          ${profileField('Confirm New Password', 'ps-confirm', '', 'password', 'repeat new password')}
        </div>
        <div id="profile-security-error" style="display:none;color:#c0392b;
          font-size:0.8rem;margin-bottom:12px;"></div>
        <div style="display:flex;justify-content:flex-end;">
          <button onclick="saveProfilePassword()"
            style="padding:10px 24px;border-radius:20px;background:var(--green-dark);
            color:#fff;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;
            font-size:0.85rem;font-weight:500;">
            Change Password ✓
          </button>
        </div>

        <!-- Danger zone -->
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid var(--border);">
          <p style="font-size:0.75rem;font-weight:600;color:#c0392b;
            text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">
            Danger Zone
          </p>
          <button onclick="confirmLogoutAll()"
            style="width:100%;padding:10px;border-radius:var(--radius-sm);
            background:transparent;border:1px solid #fca5a5;color:#c0392b;
            cursor:pointer;font-family:'DM Sans',sans-serif;font-size:0.85rem;">
            Sign out of all devices
          </button>
        </div>
      </div>

    </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

function profileField(label, id, value, type, placeholder) {
  return `
    <div>
      <label style="display:block;font-size:0.72rem;font-weight:500;color:var(--text-muted);
        margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">${label}</label>
      <input type="${type}" id="${id}" value="${value}" placeholder="${placeholder}"
        style="width:100%;background:var(--bg);border:1px solid var(--border);
        border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
        font-size:0.88rem;color:var(--text-main);outline:none;
        transition:border-color 0.2s;box-sizing:border-box;"
        onfocus="this.style.borderColor='var(--green-accent)'"
        onblur="this.style.borderColor='var(--border)'"/>
    </div>`;
}

function profileTab(tab) {
  ['account','targets','security'].forEach(t => {
    document.getElementById('profile-' + t).style.display = t === tab ? 'block' : 'none';
    const btn = document.getElementById('pt-' + t);
    btn.style.background = t === tab ? 'var(--bg-card)' : 'transparent';
    btn.style.color      = t === tab ? 'var(--green-dark)' : 'var(--text-muted)';
    btn.style.fontWeight = t === tab ? '500' : '400';
  });
}

async function saveProfileAccount() {
  const name     = document.getElementById('p-name')?.value.trim();
  const age      = document.getElementById('p-age')?.value;
  const height   = document.getElementById('p-height')?.value;
  const weight   = document.getElementById('p-weight')?.value;
  const activity = document.getElementById('p-activity')?.value;
  const errEl    = document.getElementById('profile-account-error');

  if (!name) {
    errEl.textContent = 'Name is required.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  // Save to localStorage
  if (age)      localStorage.setItem('cm_age', age);
  if (height)   localStorage.setItem('cm_height', height);
  if (weight)   localStorage.setItem('cm_weight', weight);
  if (activity) localStorage.setItem('cm_activity', activity);

  // Update stored user name
  const user = Auth.getUser();
  if (user) {
    user.name = name;
    Auth.setUser(user);
    // Update nav display
    const navName = document.querySelector('.nav-username');
    if (navName) navName.textContent = '👤 ' + name;
  }

  document.getElementById('profile-modal').remove();
  if (typeof showToast === 'function') showToast('✓ Profile updated');
}

function saveProfileTargets() {
  const targets = {
    calories:  parseFloat(document.getElementById('pt-calories')?.value) || null,
    hydration: parseFloat(document.getElementById('pt-hydration')?.value) || null,
    steps:     parseInt(document.getElementById('pt-steps')?.value)       || null,
    sleep:     parseFloat(document.getElementById('pt-sleep')?.value)     || null,
    protein:   parseInt(document.getElementById('pt-protein')?.value)     || null,
  };
  // Remove nulls
  Object.keys(targets).forEach(k => { if (!targets[k]) delete targets[k]; });
  const existing = JSON.parse(localStorage.getItem('cm_targets') || '{}');
  localStorage.setItem('cm_targets', JSON.stringify({ ...existing, ...targets }));
  document.getElementById('profile-modal').remove();
  if (typeof showToast === 'function') showToast('✓ Targets saved');
  if (typeof loadDashboard === 'function') loadDashboard();
}

async function saveProfilePassword() {
  const current = document.getElementById('ps-current')?.value;
  const newPwd  = document.getElementById('ps-new')?.value;
  const confirm = document.getElementById('ps-confirm')?.value;
  const errEl   = document.getElementById('profile-security-error');

  if (!current || !newPwd || !confirm) {
    errEl.textContent = 'All fields are required.';
    errEl.style.display = 'block';
    return;
  }
  if (newPwd.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters.';
    errEl.style.display = 'block';
    return;
  }
  if (newPwd !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';

  // Call your backend to change password
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: current, newPassword: newPwd })
    });
    document.getElementById('profile-modal').remove();
    if (typeof showToast === 'function') showToast('✓ Password changed');
  } catch (e) {
    errEl.textContent = e.message || 'Failed to change password.';
    errEl.style.display = 'block';
  }
}

function confirmLogoutAll() {
  if (confirm('Sign out of all devices? You will need to log in again.')) {
    Auth.logout();
  }
}