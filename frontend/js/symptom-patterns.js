// ─────────────────────────────────────────────
//  CuraMind · symptom-patterns.js
//  Symptom Pattern Detector
//  - Analyses past symptom logs for recurring patterns
//  - Detects frequency, time-of-day, weekly trends
//  - AI generates insight: "You report headaches 4x/week..."
//  Save to: frontend/js/symptom-patterns.js
// ─────────────────────────────────────────────

const GEMINI_KEY_PATTERNS = 'AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';
const GEMINI_URL_PATTERNS = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY_PATTERNS}`;

// ── SYMPTOM KEYWORD GROUPS ────────────────────
// Maps symptoms to canonical names for grouping
const SYMPTOM_GROUPS = {
  headache:   ['headache', 'head pain', 'migraine', 'head ache'],
  fatigue:    ['fatigue', 'tired', 'exhausted', 'weakness', 'weak', 'lethargy'],
  fever:      ['fever', 'temperature', 'chills', 'hot'],
  nausea:     ['nausea', 'nauseous', 'vomiting', 'sick stomach'],
  cough:      ['cough', 'coughing', 'dry cough'],
  throat:     ['sore throat', 'throat pain', 'throat'],
  anxiety:    ['anxiety', 'anxious', 'panic', 'stress', 'stressed', 'nervousness'],
  sleep:      ['insomnia', 'can\'t sleep', 'sleep problems', 'restless'],
  stomach:    ['stomach ache', 'stomach pain', 'abdominal', 'belly', 'stomach'],
  dizziness:  ['dizziness', 'dizzy', 'lightheaded', 'vertigo'],
  bodyPain:   ['body pain', 'muscle pain', 'body ache', 'joint pain', 'ache'],
  breathing:  ['shortness of breath', 'breathing', 'breathless', 'chest tight'],
};

// ── DETECT SYMPTOM IN TEXT ────────────────────
function detectSymptomsInText(text) {
  const lower = text.toLowerCase();
  const found = [];
  Object.entries(SYMPTOM_GROUPS).forEach(([name, keywords]) => {
    if (keywords.some(kw => lower.includes(kw)) && !found.includes(name)) {
      found.push(name);
    }
  });
  return found;
}

// ── ANALYSE PATTERNS FROM LOGS ────────────────
function analysePatterns(logs) {
  if (!logs.length) return null;

  // Count symptom frequencies
  const freq    = {};
  const byTime  = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const byDay   = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  logs.forEach(log => {
    const symptoms = detectSymptomsInText(log.symptoms || '');
    symptoms.forEach(s => { freq[s] = (freq[s] || 0) + 1; });

    // Time of day
    const hour = new Date(log.created_at).getHours();
    if      (hour >= 5  && hour < 12) byTime.morning++;
    else if (hour >= 12 && hour < 17) byTime.afternoon++;
    else if (hour >= 17 && hour < 21) byTime.evening++;
    else                              byTime.night++;

    // Day of week
    const day = dayNames[new Date(log.created_at).getDay()];
    byDay[day]++;
  });

  // Top symptoms sorted by frequency
  const topSymptoms = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Peak time of day
  const peakTime = Object.entries(byTime)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Peak day of week
  const peakDay = Object.entries(byDay)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Recurring = symptom logged 3+ times
  const recurring = topSymptoms.filter(s => s.count >= 3);

  // Date range
  const dates = logs.map(l => new Date(l.created_at)).sort((a, b) => a - b);
  const daySpan = Math.max(1,
    Math.round((dates[dates.length - 1] - dates[0]) / 86400000)
  );

  return { topSymptoms, recurring, peakTime, peakDay, byTime, byDay, daySpan, total: logs.length };
}

// ── OPEN PATTERN DETECTOR MODAL ───────────────
async function openSymptomPatterns() {
  const existing = document.getElementById('patterns-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'patterns-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(20,40,28,0.5);
    backdrop-filter:blur(6px);z-index:300;
    display:flex;align-items:center;justify-content:center;
    animation:fadeIn 0.2s ease;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:var(--radius);
      width:100%;max-width:580px;padding:40px;text-align:center;">
      <div style="font-size:0.88rem;color:var(--text-muted);">
        Analysing your symptom history...
      </div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  try {
    const logs      = await SymptomsAPI.getAll();
    const patterns  = analysePatterns(logs);
    const noData    = !patterns || !logs.length;
    const aiInsight = (!noData && patterns.recurring.length)
      ? await generatePatternInsight(patterns, logs)
      : '';

    modal.innerHTML = `
      <div style="background:var(--bg-card);border-radius:var(--radius);
        width:100%;max-width:580px;max-height:90vh;overflow-y:auto;
        box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:24px 28px;">
          <div>
            <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;
              font-weight:700;color:var(--green-dark);margin-bottom:4px;">
              🔍 Symptom Patterns
            </h2>
            <p style="font-size:0.8rem;color:var(--text-muted);">
              ${noData ? 'No data yet' : `Based on ${logs.length} logs over ${patterns.daySpan} days`}
            </p>
          </div>
          <button onclick="document.getElementById('patterns-modal').remove()"
            style="background:none;border:none;font-size:1.3rem;cursor:pointer;
            color:var(--text-muted);">✕</button>
        </div>

        ${noData ? `
          <div style="padding:0 28px 40px;text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:12px;">🔍</div>
            <div style="font-size:0.9rem;color:var(--text-muted);line-height:1.6;">
              No symptom logs found yet.<br>
              Use the Symptom Checker a few times and patterns will appear here.
            </div>
          </div>
        ` : `
          <!-- AI Insight -->
          ${aiInsight ? `
            <div style="margin:0 28px 20px;background:var(--green-light);
              border-radius:var(--radius-sm);padding:14px 18px;">
              <div style="font-size:0.68rem;font-weight:600;letter-spacing:0.1em;
                color:var(--green-dark);text-transform:uppercase;margin-bottom:6px;">
                ✨ Pattern Insight
              </div>
              <p style="font-size:0.85rem;color:var(--green-dark);
                line-height:1.65;margin:0;">${aiInsight}</p>
            </div>` : ''}

          <!-- Top Symptoms -->
          <div style="padding:0 28px 20px;">
            <p style="font-size:0.68rem;font-weight:500;letter-spacing:0.1em;
              color:var(--text-light);text-transform:uppercase;margin-bottom:12px;">
              Most frequent symptoms
            </p>
            ${patterns.topSymptoms.length ? `
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${patterns.topSymptoms.map((s, i) => {
                  const maxCount = patterns.topSymptoms[0].count;
                  const pct = Math.round((s.count / maxCount) * 100);
                  const isRecurring = s.count >= 3;
                  return `
                    <div>
                      <div style="display:flex;align-items:center;
                        justify-content:space-between;margin-bottom:5px;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <span style="font-size:0.85rem;font-weight:500;
                            color:var(--text-main);text-transform:capitalize;">
                            ${s.name.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          ${isRecurring
                            ? `<span style="font-size:0.65rem;font-weight:600;
                                padding:2px 8px;border-radius:10px;
                                background:#fff3cd;color:#7a5c00;">Recurring ⚠️</span>`
                            : ''}
                        </div>
                        <span style="font-size:0.78rem;color:var(--text-muted);">
                          ${s.count}x
                        </span>
                      </div>
                      <div style="height:6px;background:var(--green-light);
                        border-radius:4px;overflow:hidden;">
                        <div style="height:100%;width:${pct}%;
                          background:${isRecurring ? '#c0392b' : 'var(--green-accent)'};
                          border-radius:4px;transition:width 0.8s ease;"></div>
                      </div>
                    </div>`;
                }).join('')}
              </div>` : `
              <p style="font-size:0.85rem;color:var(--text-muted);">
                Not enough logs to detect patterns yet.
              </p>`}
          </div>

          <!-- Time + Day stats -->
          <div style="padding:0 28px 24px;display:grid;
            grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:14px;">
              <div style="font-size:0.72rem;font-weight:500;color:var(--text-muted);
                text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
                ⏰ Time of day
              </div>
              ${Object.entries(patterns.byTime).map(([time, count]) => `
                <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:6px;">
                  <span style="font-size:0.8rem;color:var(--text-muted);
                    text-transform:capitalize;">${time}</span>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:60px;height:4px;background:var(--green-light);
                      border-radius:4px;overflow:hidden;">
                      <div style="height:100%;
                        width:${count ? Math.round(count/patterns.total*100) : 0}%;
                        background:var(--green-accent);border-radius:4px;"></div>
                    </div>
                    <span style="font-size:0.72rem;color:var(--text-light);">${count}</span>
                  </div>
                </div>`).join('')}
            </div>

            <div style="background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:14px;">
              <div style="font-size:0.72rem;font-weight:500;color:var(--text-muted);
                text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">
                📅 Day of week
              </div>
              ${Object.entries(patterns.byDay).map(([day, count]) => `
                <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:6px;">
                  <span style="font-size:0.8rem;color:var(--text-muted);">${day}</span>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:60px;height:4px;background:var(--green-light);
                      border-radius:4px;overflow:hidden;">
                      <div style="height:100%;
                        width:${count ? Math.round(count/patterns.total*100) : 0}%;
                        background:var(--green-accent);border-radius:4px;"></div>
                    </div>
                    <span style="font-size:0.72rem;color:var(--text-light);">${count}</span>
                  </div>
                </div>`).join('')}
            </div>
          </div>

          <!-- Disclaimer -->
          <div style="padding:12px 28px 24px;">
            <div style="background:#fffbf0;border:1px solid #f0d060;border-radius:var(--radius-sm);
              padding:10px 14px;font-size:0.75rem;color:#9a7c30;">
              ⚠️ These are patterns from your self-reported logs, not medical analysis.
              Please consult a doctor for recurring or worsening symptoms.
            </div>
          </div>
        `}
      </div>`;

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  } catch (err) {
    modal.innerHTML = `
      <div style="background:var(--bg-card);border-radius:var(--radius);
        width:100%;max-width:480px;padding:40px;text-align:center;">
        <div style="color:#c0392b;font-size:0.88rem;">
          Failed to load patterns: ${err.message}
        </div>
        <button onclick="document.getElementById('patterns-modal').remove()"
          style="margin-top:16px;padding:8px 20px;border-radius:20px;
          background:var(--green-dark);color:#fff;border:none;cursor:pointer;
          font-family:'DM Sans',sans-serif;">Close</button>
      </div>`;
  }
}

// ── GEMINI PATTERN INSIGHT ────────────────────
async function generatePatternInsight(patterns, logs) {
  try {
    const recurring = patterns.recurring
      .map(s => `${s.name.replace(/([A-Z])/g, ' $1').trim()} (${s.count}x)`)
      .join(', ');

    const prompt = `You are CuraMind. Based on this user's symptom history, write a 2-sentence plain-English insight. Be warm, helpful, not alarming. Under 70 words.

Recurring symptoms: ${recurring}
Most common time: ${patterns.peakTime}
Most common day: ${patterns.peakDay}
Total logs: ${patterns.total} over ${patterns.daySpan} days

Reply with plain text only.`;

    const res = await fetch(GEMINI_URL_PATTERNS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.4 }
      })
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
}