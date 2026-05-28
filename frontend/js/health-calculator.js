// ─────────────────────────────────────────────
//  CuraMind · health-calculator.js
//  Add this file to: frontend/js/health-calculator.js
//  Then add in index.html before </body>:
//  <script src="js/health-calculator.js"></script>
// ─────────────────────────────────────────────

// ── HEALTH CALCULATIONS ──────────────────────

function calculateAll(profile) {
  const { age, weight, height, gender, activity } = profile;

  // ── BMI ──────────────────────────────────
  // Formula: weight(kg) / height(m)²
  const heightM = height / 100;
  const bmi = +(weight / (heightM * heightM)).toFixed(1);
  const bmiLabel =
    bmi < 18.5 ? 'Underweight' :
    bmi < 25   ? 'Healthy' :
    bmi < 30   ? 'Overweight' : 'Obese';

  // ── BMR (Mifflin-St Jeor) ────────────────
  // Men:   10×weight + 6.25×height − 5×age + 5
  // Women: 10×weight + 6.25×height − 5×age − 161
  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // ── TDEE (Total Daily Energy) ────────────
  // Activity multipliers
  const activityMap = {
    sedentary:  1.2,   // little/no exercise
    light:      1.375, // light exercise 1-3 days/week
    moderate:   1.55,  // moderate exercise 3-5 days/week
    active:     1.725, // hard exercise 6-7 days/week
    very_active: 1.9   // very hard exercise + physical job
  };
  const tdee = Math.round(bmr * (activityMap[activity] || 1.55));

  // ── HYDRATION (ml) ───────────────────────
  // Base: 35ml per kg of body weight
  // Add 500ml for moderate activity, 1000ml for active+
  let hydrationMl = weight * 35;
  if (activity === 'moderate') hydrationMl += 500;
  if (activity === 'active' || activity === 'very_active') hydrationMl += 1000;
  const hydrationL = +(hydrationMl / 1000).toFixed(1);

  // ── DAILY STEPS GOAL ────────────────────
  // Base 8000, scale with activity level
  const stepsMap = {
    sedentary:   6000,
    light:       8000,
    moderate:    10000,
    active:      12000,
    very_active: 15000
  };
  const stepsGoal = stepsMap[activity] || 10000;

  // ── SLEEP RECOMMENDATION ─────────────────
  // Based on age
  const sleepHours =
    age < 18 ? 9 :
    age < 26 ? 8 :
    age < 65 ? 7.5 : 7;

  // ── IDEAL WEIGHT RANGE (BMI 18.5–24.9) ──
  const idealMin = +(18.5 * heightM * heightM).toFixed(1);
  const idealMax = +(24.9 * heightM * heightM).toFixed(1);

  // ── PROTEIN GOAL ────────────────────────
  // 1.6g per kg for active, 0.8g for sedentary
  const proteinMultiplier =
    activity === 'sedentary' ? 0.8 :
    activity === 'light'     ? 1.0 :
    activity === 'moderate'  ? 1.2 :
    activity === 'active'    ? 1.6 : 1.8;
  const proteinG = Math.round(weight * proteinMultiplier);

  return {
    bmi, bmiLabel,
    calories: tdee,
    hydration: hydrationL,
    steps: stepsGoal,
    sleep: sleepHours,
    protein: proteinG,
    idealWeightMin: idealMin,
    idealWeightMax: idealMax
  };
}

// ── RENDER CALCULATOR MODAL ──────────────────

function openCalculator() {
  // Remove existing modal if any
  const existing = document.getElementById('calc-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'calc-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px;  max-height:90vh; overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <p class="modal-title">🧮 Health Calculator</p>
        <button onclick="document.getElementById('calc-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Enter your details — we'll calculate all your daily targets automatically.</p>

      <div class="modal-grid">
        <div class="modal-field">
          <label>Age (years)</label>
          <input type="number" id="c-age" placeholder="25" min="10" max="100"/>
        </div>
        <div class="modal-field">
          <label>Weight (kg)</label>
          <input type="number" id="c-weight" placeholder="70" min="20" max="300"/>
        </div>
        <div class="modal-field">
          <label>Height (cm)</label>
          <input type="number" id="c-height" placeholder="170" min="100" max="250"/>
        </div>
        <div class="modal-field">
          <label>Gender</label>
          <select id="c-gender" style="width:100%;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
            font-size:0.88rem;color:var(--text-main);outline:none;">
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
      </div>

      <div class="modal-field" style="margin-bottom:20px;">
        <label style="display:block;font-size:0.77rem;font-weight:500;color:var(--text-muted);
          margin-bottom:7px;text-transform:uppercase;letter-spacing:0.05em;">Activity Level</label>
        <select id="c-activity" style="width:100%;background:var(--bg);border:1px solid var(--border);
          border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
          font-size:0.88rem;color:var(--text-main);outline:none;">
          <option value="sedentary">Sedentary (desk job, little exercise)</option>
          <option value="light">Light (exercise 1–3 days/week)</option>
          <option value="moderate" selected>Moderate (exercise 3–5 days/week)</option>
          <option value="active">Active (exercise 6–7 days/week)</option>
          <option value="very_active">Very Active (physical job + daily exercise)</option>
        </select>
      </div>

      <!-- Results (hidden until calculated) -->
      <div id="calc-results" style="display:none;margin-bottom:20px;">
        <div style="height:1px;background:var(--border);margin-bottom:20px;"></div>
        <p style="font-size:0.72rem;font-weight:500;letter-spacing:0.1em;color:var(--text-light);
          margin-bottom:14px;">YOUR DAILY TARGETS</p>
        <div id="calc-results-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
      </div>

      <div class="modal-actions">
        <button class="btn-cancel" onclick="document.getElementById('calc-modal').remove()">Cancel</button>
        <button class="btn-save" id="btn-calc-go" onclick="runCalculator()">Calculate →</button>
      </div>
    </div>
  `;

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// ── RUN CALCULATOR ───────────────────────────
async function runCalculator() {
  const age      = parseInt(document.getElementById('c-age').value);
  const weight   = parseFloat(document.getElementById('c-weight').value);
  const height   = parseFloat(document.getElementById('c-height').value);
  const gender   = document.getElementById('c-gender').value;
  const activity = document.getElementById('c-activity').value;

  // Validate
  if (!age || !weight || !height) {
    showToast('Please fill in age, weight and height');
    return;
  }
  if (age < 10 || age > 100)    { showToast('Enter a valid age (10–100)'); return; }
  if (weight < 20 || weight > 300) { showToast('Enter a valid weight (20–300 kg)'); return; }
  if (height < 100 || height > 250) { showToast('Enter a valid height (100–250 cm)'); return; }

  const result = calculateAll({ age, weight, height, gender, activity });

  // ── Show results ──────────────────────────
  const grid = document.getElementById('calc-results-grid');
  grid.innerHTML = `
    ${resultCard('🔥', 'Daily Calories', result.calories + ' kcal', 'Energy to maintain weight')}
    ${resultCard('💧', 'Hydration', result.hydration + ' L', 'Water intake per day')}
    ${resultCard('📈', 'BMI', result.bmi + ' — ' + result.bmiLabel, 'Body Mass Index')}
    ${resultCard('👣', 'Steps Goal', result.steps.toLocaleString(), 'Daily step target')}
    ${resultCard('🌙', 'Sleep', result.sleep + ' hrs', 'Recommended sleep')}
    ${resultCard('🥩', 'Protein', result.protein + 'g', 'Daily protein goal')}
    ${resultCard('⚖️', 'Ideal Weight', result.idealWeightMin + '–' + result.idealWeightMax + ' kg', 'Healthy BMI range')}
    ${resultCard('❤️', 'Resting HR', gender === 'male' ? '60–70 bpm' : '62–72 bpm', 'Normal resting heart rate')}
  `;

  document.getElementById('calc-results').style.display = 'block';

  // Change button to "Save to Dashboard"
  const btn = document.getElementById('btn-calc-go');
  btn.textContent = 'Save to Dashboard ✓';
  btn.onclick = () => saveCalculatedToDashboard(result, weight, height);

  // Scroll results into view
  document.getElementById('calc-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resultCard(icon, label, value, sub) {
  return `
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
      padding:14px 16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:1rem;">${icon}</span>
        <span style="font-size:0.72rem;color:var(--text-light);font-weight:500;
          text-transform:uppercase;letter-spacing:0.06em;">${label}</span>
      </div>
      <div style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;
        color:var(--text-main);margin-bottom:2px;">${value}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);">${sub}</div>
    </div>
  `;
}

// ── SAVE CALCULATED VALUES TO DASHBOARD ──────
async function saveCalculatedToDashboard(result, weight, height) {
  try {
    await HealthAPI.log({
      calories:   result.calories,
      hydration:  result.hydration,
      steps:      result.steps,
      bmi:        result.bmi,
      weight:     weight,
      heart_rate: null
    });

    // Save targets to localStorage for progress display
    localStorage.setItem('cm_targets', JSON.stringify({
      calories:  result.calories,
      hydration: result.hydration,
      steps:     result.steps,
      sleep:     result.sleep,
      protein:   result.protein
    }));

    document.getElementById('calc-modal').remove();
    showToast('✓ Targets saved to your dashboard!');
    await loadDashboard();

  } catch (e) {
    showToast('Error saving: ' + e.message);
  }
}