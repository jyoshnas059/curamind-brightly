// ─────────────────────────────────────────────
//  CuraMind · weekly-insights.js
//  Weekly Health Insights
//  - Every Monday shows a summary card
//  - Compares this week vs last week
//  - Trend arrows (up/down) for each metric
//  Save to: frontend/js/weekly-insights.js
// ─────────────────────────────────────────────

// ── COMPUTE WEEKLY AVERAGES ───────────────────
function computeWeeklyAverages(rows, weekStart, weekEnd) {
  const inRange = rows.filter(r => {
    const d = new Date(r.created_at);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return null;

  const avg = (field) => {
    const vals = inRange.map(r => r[field]).filter(v => v != null && v > 0);
    if (!vals.length) return null;
    return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  return {
    steps:     avg('steps'),
    hydration: avg('hydration'),
    calories:  avg('calories'),
    bmi:       avg('bmi'),
    weight:    avg('weight'),
    count:     inRange.length,
  };
}

function computeWeeklySleepAvg(rows, weekStart, weekEnd) {
  const inRange = rows.filter(r => {
    const d = new Date(r.created_at);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return null;
  const vals = inRange.map(r => r.hours).filter(v => v != null && v > 0);
  if (!vals.length) return null;
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function getMostFrequentMood(rows, weekStart, weekEnd) {
  const inRange = rows.filter(r => {
    const d = new Date(r.created_at);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return null;
  const freq = {};
  inRange.forEach(r => { freq[r.mood] = (freq[r.mood] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// ── TREND ICON ────────────────────────────────
function trendIcon(current, previous, higherIsBetter = true) {
  if (current == null || previous == null) return '';
  const diff = current - previous;
  if (Math.abs(diff) < 0.01) return '<span style="color:var(--text-light);">→</span>';
  const good = higherIsBetter ? diff > 0 : diff < 0;
  return good
    ? `<span style="color:#1e3a2f;">↑ +${Math.abs(diff)}</span>`
    : `<span style="color:#c0392b;">↓ -${Math.abs(diff)}</span>`;
}

// ── OPEN WEEKLY INSIGHTS MODAL ────────────────
async function openWeeklyInsights() {
  const existing = document.getElementById('insights-modal');
  if (existing) existing.remove();

  // Show loading immediately
  const modal = document.createElement('div');
  modal.id = 'insights-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(20,40,28,0.5);
    backdrop-filter:blur(6px);z-index:300;
    display:flex;align-items:center;justify-content:center;
    animation:fadeIn 0.2s ease;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:var(--radius);
      width:100%;max-width:620px;padding:40px;text-align:center;">
      <div style="font-size:0.88rem;color:var(--text-muted);">Loading your weekly insights...</div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  try {
    // Fetch all data
    const [healthRows, sleepRows, moodRows] = await Promise.all([
      HealthAPI.getHistory(),
      SleepAPI.getAll(),
      MoodAPI.getAll(),
    ]);

    // Calculate week boundaries
    const now       = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    thisMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(thisMonday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);

    const thisWeekEnd = new Date(now);

    // This week
    const thisWeek = computeWeeklyAverages(healthRows, thisMonday, thisWeekEnd);
    const lastWeek = computeWeeklyAverages(healthRows, lastMonday, lastSunday);
    const thisSleep = computeWeeklySleepAvg(sleepRows, thisMonday, thisWeekEnd);
    const lastSleep = computeWeeklySleepAvg(sleepRows, lastMonday, lastSunday);
    const thisMood  = getMostFrequentMood(moodRows, thisMonday, thisWeekEnd);
    const lastMood  = getMostFrequentMood(moodRows, lastMonday, lastSunday);

    const noData = !thisWeek && !thisSleep && !thisMood;

    const formatDate = (d) => d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    const weekLabel  = `${formatDate(thisMonday)} – ${formatDate(now)}`;
    const lastLabel  = `${formatDate(lastMonday)} – ${formatDate(lastSunday)}`;

    // Build insight summary using Gemini
    let aiSummary = '';
    if (!noData) {
      aiSummary = await generateInsightSummary(thisWeek, lastWeek, thisSleep, lastSleep, thisMood);
    }

    const metrics = [
      { label: 'Avg Steps',     icon: '👣', curr: thisWeek?.steps,     prev: lastWeek?.steps,     unit: '',    higher: true  },
      { label: 'Avg Hydration', icon: '💧', curr: thisWeek?.hydration,  prev: lastWeek?.hydration, unit: 'L',   higher: true  },
      { label: 'Avg Calories',  icon: '🔥', curr: thisWeek?.calories,   prev: lastWeek?.calories,  unit: 'kcal',higher: false },
      { label: 'Avg Sleep',     icon: '🌙', curr: thisSleep,            prev: lastSleep,           unit: 'hrs', higher: true  },
      { label: 'BMI',           icon: '📈', curr: thisWeek?.bmi,        prev: lastWeek?.bmi,       unit: '',    higher: false },
    ].filter(m => m.curr != null);

    // Rebuild modal with data
    modal.querySelector('div').outerHTML; // clear
    modal.innerHTML = `
      <div style="background:var(--bg-card);border-radius:var(--radius);
        width:100%;max-width:620px;max-height:90vh;overflow-y:auto;
        box-shadow:0 24px 60px rgba(0,0,0,0.2);animation:slideUp 0.25s ease;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;
          padding:24px 28px;">
          <div>
            <h2 style="font-family:'Playfair Display',serif;font-size:1.4rem;
              font-weight:700;color:var(--green-dark);margin-bottom:4px;">
              📊 Weekly Insights
            </h2>
            <p style="font-size:0.8rem;color:var(--text-muted);">${weekLabel}</p>
          </div>
          <button onclick="document.getElementById('insights-modal').remove()"
            style="background:none;border:none;font-size:1.3rem;cursor:pointer;
            color:var(--text-muted);">✕</button>
        </div>

        ${noData ? `
          <div style="padding:40px 28px;text-align:center;">
            <div style="font-size:2rem;margin-bottom:12px;">📭</div>
            <div style="font-size:0.9rem;color:var(--text-muted);">
              No data yet for this week. Start logging your vitals, sleep and mood to see weekly insights.
            </div>
          </div>
        ` : `
          <!-- AI Summary -->
          ${aiSummary ? `
            <div style="margin:0 28px 20px;background:var(--green-light);
              border-radius:var(--radius-sm);padding:14px 18px;">
              <div style="font-size:0.68rem;font-weight:600;letter-spacing:0.1em;
                color:var(--green-dark);text-transform:uppercase;margin-bottom:6px;">
                ✨ AI Summary
              </div>
              <p style="font-size:0.85rem;color:var(--green-dark);line-height:1.65;margin:0;">
                ${aiSummary}
              </p>
            </div>` : ''}

          <!-- Metrics grid -->
          <div style="padding:0 28px 20px;display:grid;
            grid-template-columns:repeat(3,1fr);gap:12px;">
            ${metrics.map(m => `
              <div style="background:var(--bg);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                  <span>${m.icon}</span>
                  <span style="font-size:0.72rem;color:var(--text-muted);
                    font-weight:500;">${m.label}</span>
                </div>
                <div style="font-family:'Playfair Display',serif;font-size:1.4rem;
                  font-weight:700;color:var(--text-main);margin-bottom:4px;">
                  ${m.curr}
                  <span style="font-size:0.75rem;font-family:'DM Sans',sans-serif;
                    font-weight:400;color:var(--text-muted);">${m.unit}</span>
                </div>
                <div style="font-size:0.72rem;">
                  ${m.prev != null
                    ? `vs ${m.prev} ${m.unit} last week ${trendIcon(m.curr, m.prev, m.higher)}`
                    : '<span style="color:var(--text-light);">No prior data</span>'}
                </div>
              </div>`).join('')}

            ${thisMood ? `
              <div style="background:var(--bg);border:1px solid var(--border);
                border-radius:var(--radius-sm);padding:14px;">
                <div style="font-size:0.72rem;color:var(--text-muted);
                  font-weight:500;margin-bottom:8px;">😊 Top Mood</div>
                <div style="font-size:1.1rem;font-weight:600;
                  color:var(--text-main);margin-bottom:4px;">${thisMood}</div>
                ${lastMood && lastMood !== thisMood
                  ? `<div style="font-size:0.72rem;color:var(--text-light);">
                      was ${lastMood} last week</div>`
                  : ''}
              </div>` : ''}
          </div>

          <!-- Last week comparison label -->
          <div style="padding:0 28px 24px;">
            <div style="font-size:0.72rem;color:var(--text-light);text-align:center;">
              Compared against ${lastLabel}
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
          Failed to load insights: ${err.message}
        </div>
        <button onclick="document.getElementById('insights-modal').remove()"
          style="margin-top:16px;padding:8px 20px;border-radius:20px;
          background:var(--green-dark);color:#fff;border:none;cursor:pointer;
          font-family:'DM Sans',sans-serif;">Close</button>
      </div>`;
  }
}

// ── GEMINI AI SUMMARY ─────────────────────────
const GEMINI_KEY_INSIGHTS = 'AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg';
const GEMINI_URL_INSIGHTS = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY_INSIGHTS}`;

async function generateInsightSummary(thisWeek, lastWeek, thisSleep, lastSleep, thisMood) {
  try {
    const prompt = `You are CuraMind, a warm wellness assistant. Write a 2-sentence plain-English summary of this user's week. Be encouraging. Keep it under 60 words.

This week averages:
- Steps: ${thisWeek?.steps || 'N/A'} (last week: ${lastWeek?.steps || 'N/A'})
- Hydration: ${thisWeek?.hydration || 'N/A'}L (last week: ${lastWeek?.hydration || 'N/A'}L)
- Sleep: ${thisSleep || 'N/A'} hrs (last week: ${lastSleep || 'N/A'} hrs)
- Mood: ${thisMood || 'N/A'}

Reply with plain text only — no bullet points, no markdown.`;

    const res = await fetch(GEMINI_URL_INSIGHTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.5 }
      })
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
}