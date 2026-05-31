// ─────────────────────────────────────────────
//  CuraMind · symptom-photo.js
//  Photo upload + Claude Vision analysis
//  Save to: frontend/js/symptom-photo.js
// ─────────────────────────────────────────────

let uploadedPhotoBase64 = null;
let uploadedPhotoType   = null;

function openPhotoUpload() {
  const ex = document.getElementById('photo-modal');
  if (ex) ex.remove();

  const modal = document.createElement('div');
  modal.id = 'photo-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:480px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">📸 Upload Symptom Photo</p>
        <button onclick="document.getElementById('photo-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Upload a photo of your symptom — rash, swelling, eye redness etc. Claude AI will analyse it.</p>

      <!-- Upload area -->
      <div id="photo-drop-zone"
        style="border:2px dashed var(--green-accent);border-radius:var(--radius);
        padding:32px;text-align:center;cursor:pointer;transition:all 0.2s;
        background:var(--bg);margin-bottom:16px;"
        onclick="document.getElementById('photo-file-input').click()"
        ondragover="event.preventDefault();this.style.background='var(--green-light)'"
        ondragleave="this.style.background='var(--bg)'"
        ondrop="handlePhotoDrop(event)">
        <div style="font-size:2.5rem;margin-bottom:10px;">📷</div>
        <div style="font-size:0.88rem;font-weight:500;color:var(--green-dark);margin-bottom:4px;">
          Click to upload or drag & drop
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);">
          JPG, PNG, WEBP — max 5MB<br>
          Works best with: skin rashes, swelling, eye redness, wound, bruise
        </div>
      </div>

      <input type="file" id="photo-file-input" accept="image/*" style="display:none;"
        onchange="handlePhotoSelect(this)"/>

      <!-- Preview -->
      <div id="photo-preview" style="display:none;margin-bottom:16px;">
        <img id="photo-preview-img" style="width:100%;border-radius:var(--radius-sm);
          max-height:200px;object-fit:cover;margin-bottom:10px;"/>
        <div style="display:flex;gap:8px;">
          <button onclick="analysePhoto()" class="btn-save" style="flex:1;">
            🔍 Analyse with AI
          </button>
          <button onclick="clearPhoto()" class="btn-cancel">Remove</button>
        </div>
      </div>

      <!-- Analysis result -->
      <div id="photo-analysis" style="display:none;background:var(--bg);
        border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;">
        <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
          letter-spacing:0.08em;margin-bottom:10px;">AI VISUAL ANALYSIS</div>
        <div id="photo-analysis-content" style="font-size:0.85rem;color:var(--text-muted);
          line-height:1.7;"></div>
      </div>

      <!-- Disclaimer -->
      <div style="margin-top:14px;padding:10px 12px;background:#fffbf0;
        border:1px solid #f0d060;border-radius:var(--radius-sm);
        font-size:0.72rem;color:#7a5c00;line-height:1.5;">
        ⚠️ AI photo analysis is not a medical diagnosis. Always consult a qualified
        healthcare professional for proper evaluation. Your photo is not stored.
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function handlePhotoSelect(input) {
  const file = input.files[0];
  if (!file) return;
  processPhotoFile(file);
}

function handlePhotoDrop(event) {
  event.preventDefault();
  document.getElementById('photo-drop-zone').style.background = 'var(--bg)';
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processPhotoFile(file);
}

function processPhotoFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    if (typeof showToast === 'function') showToast('File too large — max 5MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedPhotoBase64 = e.target.result.split(',')[1];
    uploadedPhotoType   = file.type;

    const preview    = document.getElementById('photo-preview');
    const previewImg = document.getElementById('photo-preview-img');
    const dropZone   = document.getElementById('photo-drop-zone');

    if (previewImg) previewImg.src = e.target.result;
    if (preview)    preview.style.display = 'block';
    if (dropZone)   dropZone.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  uploadedPhotoBase64 = null;
  uploadedPhotoType   = null;
  const preview  = document.getElementById('photo-preview');
  const dropZone = document.getElementById('photo-drop-zone');
  const analysis = document.getElementById('photo-analysis');
  const input    = document.getElementById('photo-file-input');
  if (preview)  preview.style.display  = 'none';
  if (dropZone) dropZone.style.display = 'block';
  if (analysis) analysis.style.display = 'none';
  if (input)    input.value            = '';
}

async function analysePhoto() {
  if (!uploadedPhotoBase64) return;

  const analysisBox = document.getElementById('photo-analysis');
  const content     = document.getElementById('photo-analysis-content');

  analysisBox.style.display = 'block';
  content.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;color:var(--text-muted);">
      Analysing image
      <div class="loading-dots"><span></span><span></span><span></span></div>
    </div>`;

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
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: uploadedPhotoType,
                data: uploadedPhotoBase64
              }
            },
            {
              type: 'text',
              text: `You are CuraMind, a calm wellness assistant helping analyse a symptom photo.

Look at this image carefully and provide:
1. What you observe visually (describe what you see — colour, texture, size, location if visible)
2. What condition this might suggest (2-3 possibilities, NOT a diagnosis)
3. Immediate self-care steps
4. When to see a doctor

Keep the tone warm and non-alarming. Never give a definitive diagnosis.
Format your response clearly with these 4 sections.
If the image is NOT a medical symptom (e.g. it's a landscape, food, etc.), say so kindly and ask them to upload a symptom photo.`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    const text = data?.content?.[0]?.text || 'Could not analyse the image.';

    // Format response
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(\d+\.\s.+)/gm, '<p style="margin-top:10px;font-weight:600;color:var(--text-main);">$1</p>')
      .replace(/\n/g, '<br>');

    content.innerHTML = formatted;

    // Auto-add to symptom input
    const symptomInput = document.getElementById('symptom-input');
    if (symptomInput) {
      const current    = symptomInput.value.trim();
      const photoNote  = '[Photo uploaded for visual analysis]';
      if (!current.includes(photoNote)) {
        symptomInput.value = current
          ? current + '. ' + photoNote
          : photoNote;
        if (typeof onSymptomInput === 'function') onSymptomInput(symptomInput);
      }
    }

    // Store analysis text for Gemini context
    window._photoAnalysisText = text;

    // Show add to symptoms button
    content.innerHTML += `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);">
        <button onclick="usePhotoAnalysis()" class="btn-save" style="width:100%;">
          ✓ Use this analysis in symptom check
        </button>
      </div>`;

  } catch (err) {
    content.innerHTML = `
      <div style="color:#c0392b;font-size:0.85rem;">
        ❌ Could not analyse image: ${err.message}<br>
        <span style="font-size:0.78rem;color:var(--text-muted);">
          Make sure the backend server is running and try again.
        </span>
      </div>`;
  }
}

function usePhotoAnalysis() {
  const modal = document.getElementById('photo-modal');
  if (modal) modal.remove();

  // Photo analysis text is stored in window._photoAnalysisText
  // It will be picked up by symptom-followup.js when guidance is triggered
  if (typeof showToast === 'function') showToast('📸 Photo analysis added to symptom check');

  // Scroll to guidance button
  const btn = document.getElementById('btn-guidance');
  if (btn) {
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btn.style.animation = 'none';
    btn.style.background = 'var(--green-accent)';
    setTimeout(() => btn.style.background = '', 2000);
  }
}

// ── PATCH SYMPTOM CONTEXT TO INCLUDE PHOTO ───
// Override buildHistoryContextSafe to include photo analysis
const _originalBuildContext = window.buildHistoryContextSafe;
window.buildHistoryContextSafe = async function() {
  let ctx = '';
  if (typeof _originalBuildContext === 'function') {
    ctx = await _originalBuildContext();
  }
  if (window._photoAnalysisText) {
    ctx += `\n\nVisual symptom analysis from uploaded photo:\n${window._photoAnalysisText}`;
    window._photoAnalysisText = null; // clear after use
  }
  return ctx;
};