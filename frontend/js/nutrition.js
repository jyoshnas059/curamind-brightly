// ─────────────────────────────────────────────
//  CuraMind · nutrition.js
//  Save to: frontend/js/nutrition.js
// ─────────────────────────────────────────────

// Common foods database (no API needed)
const FOOD_DB = [
  { name:'Apple',              cal:95,  protein:0.5, carbs:25, fat:0.3, serving:'1 medium (182g)' },
  { name:'Banana',             cal:105, protein:1.3, carbs:27, fat:0.4, serving:'1 medium (118g)' },
  { name:'Orange',             cal:62,  protein:1.2, carbs:15, fat:0.2, serving:'1 medium (131g)' },
  { name:'Boiled Egg',         cal:78,  protein:6.3, carbs:0.6,fat:5.3, serving:'1 large (50g)'   },
  { name:'Oats (cooked)',      cal:158, protein:6.0, carbs:27, fat:3.2, serving:'1 cup (234g)'    },
  { name:'White Rice (cooked)',cal:206, protein:4.3, carbs:45, fat:0.4, serving:'1 cup (186g)'    },
  { name:'Brown Rice (cooked)',cal:216, protein:5.0, carbs:45, fat:1.8, serving:'1 cup (195g)'    },
  { name:'Roti / Chapati',     cal:104, protein:3.1, carbs:18, fat:2.5, serving:'1 piece (40g)'   },
  { name:'Idli',               cal:58,  protein:2.0, carbs:12, fat:0.1, serving:'1 piece (39g)'   },
  { name:'Dosa',               cal:133, protein:3.6, carbs:20, fat:4.0, serving:'1 piece (64g)'   },
  { name:'Dal (cooked)',       cal:198, protein:12,  carbs:33, fat:1.4, serving:'1 cup (198g)'    },
  { name:'Chicken Breast',     cal:165, protein:31,  carbs:0,  fat:3.6, serving:'100g cooked'     },
  { name:'Paneer',             cal:265, protein:18,  carbs:3.4,fat:20,  serving:'100g'            },
  { name:'Milk (full fat)',    cal:149, protein:8.0, carbs:11, fat:8.0, serving:'1 cup (244ml)'   },
  { name:'Curd / Yogurt',      cal:100, protein:5.7, carbs:7.7,fat:5.4, serving:'1 cup (245g)'    },
  { name:'Banana Chips',       cal:374, protein:1.6, carbs:40, fat:24,  serving:'50g'             },
  { name:'Almonds',            cal:164, protein:6.0, carbs:6.0,fat:14,  serving:'1oz/28g (~23)'   },
  { name:'Peanuts',            cal:166, protein:7.3, carbs:6.1,fat:14,  serving:'1oz/28g'         },
  { name:'Sambar',             cal:90,  protein:4.0, carbs:14, fat:2.0, serving:'1 cup (200g)'    },
  { name:'Upma',               cal:190, protein:4.5, carbs:32, fat:5.0, serving:'1 serving (150g)'},
  { name:'Poha',               cal:250, protein:3.5, carbs:50, fat:4.0, serving:'1 plate (150g)'  },
  { name:'Bread (white)',      cal:79,  protein:2.7, carbs:15, fat:1.0, serving:'1 slice (30g)'   },
  { name:'Bread (brown)',      cal:69,  protein:3.6, carbs:12, fat:1.2, serving:'1 slice (30g)'   },
  { name:'Butter',             cal:102, protein:0.1, carbs:0,  fat:11.5,serving:'1 tbsp (14g)'    },
  { name:'Ghee',               cal:112, protein:0,   carbs:0,  fat:12.7,serving:'1 tbsp (14g)'    },
  { name:'Tea with milk',      cal:35,  protein:1.5, carbs:4.5,fat:1.2, serving:'1 cup (200ml)'   },
  { name:'Coffee with milk',   cal:45,  protein:1.8, carbs:5.5,fat:1.5, serving:'1 cup (200ml)'   },
  { name:'Orange Juice',       cal:112, protein:1.7, carbs:26, fat:0.5, serving:'1 cup (248ml)'   },
  { name:'Watermelon',         cal:86,  protein:1.7, carbs:22, fat:0.4, serving:'2 cups (280g)'   },
  { name:'Mango',              cal:201, protein:2.8, carbs:50, fat:1.3, serving:'1 fruit (336g)'  },
  { name:'Potato (boiled)',    cal:87,  protein:1.9, carbs:20, fat:0.1, serving:'100g'            },
  { name:'Sweet Potato',       cal:103, protein:2.3, carbs:24, fat:0.1, serving:'100g baked'      },
  { name:'Spinach (cooked)',   cal:41,  protein:5.4, carbs:6.8,fat:0.5, serving:'1 cup (180g)'    },
  { name:'Broccoli (cooked)',  cal:55,  protein:3.7, carbs:11, fat:0.6, serving:'1 cup (156g)'    },
  { name:'Fish (salmon)',      cal:208, protein:28,  carbs:0,  fat:10,  serving:'100g cooked'     },
  { name:'Tuna (canned)',      cal:132, protein:29,  carbs:0,  fat:1.0, serving:'100g'            },
  { name:'Rajma (cooked)',     cal:225, protein:15,  carbs:40, fat:1.5, serving:'1 cup (171g)'    },
  { name:'Chana / Chickpea',  cal:269, protein:15,  carbs:45, fat:4.2, serving:'1 cup (164g)'    },
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

function getNutritionLogs() {
  try { return JSON.parse(localStorage.getItem('cm_nutrition_logs') || '[]'); } catch { return []; }
}
function saveNutritionLogs(logs) { localStorage.setItem('cm_nutrition_logs', JSON.stringify(logs)); }

function openNutritionTracker() {
  const ex = document.getElementById('nutrition-modal');
  if (ex) ex.remove();

  const today     = new Date().toDateString();
  const logs      = getNutritionLogs().filter(l => new Date(l.date).toDateString() === today);
  const totals    = calcTotals(logs);
  const targets   = JSON.parse(localStorage.getItem('cm_targets') || '{}');
  const calGoal   = targets.calories || 2000;
  const protGoal  = targets.protein  || 60;

  const modal = document.createElement('div');
  modal.id = 'nutrition-modal';
  modal.className = 'modal-overlay';
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.innerHTML = `
    <div class="modal-box" style="max-width:600px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <p class="modal-title">🥗 Nutrition Tracker</p>
        <button onclick="document.getElementById('nutrition-modal').remove()"
          style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);">✕</button>
      </div>
      <p class="modal-sub">Track your meals — search foods or add manually.</p>

      <!-- Today totals -->
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);
        padding:16px;margin-bottom:20px;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);letter-spacing:0.08em;
          margin-bottom:12px;">TODAY'S TOTALS</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
          ${macroCard('🔥','Calories', totals.cal, calGoal, 'kcal')}
          ${macroCard('🥩','Protein',  totals.protein, protGoal, 'g')}
          ${macroCard('🍞','Carbs',    totals.carbs, 0, 'g')}
          ${macroCard('🧈','Fat',      totals.fat, 0, 'g')}
        </div>
        <!-- Calorie progress bar -->
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Calorie goal</span>
            <span style="font-size:0.72rem;color:var(--green-accent);font-weight:500;">
              ${totals.cal} / ${calGoal} kcal</span>
          </div>
          <div style="height:6px;background:var(--green-light);border-radius:4px;overflow:hidden;">
            <div style="height:100%;background:${totals.cal > calGoal ? '#ef4444' : 'var(--green-accent)'};
              border-radius:4px;width:${Math.min((totals.cal/calGoal)*100,100).toFixed(0)}%;
              transition:width 0.5s;"></div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;background:var(--border);border-radius:10px;
        padding:4px;margin-bottom:20px;">
        <button id="nut-tab-search" onclick="nutTab('search')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:500;
          background:var(--bg-card);color:var(--green-dark);">🔍 Search Food</button>
        <button id="nut-tab-manual" onclick="nutTab('manual')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">✏️ Manual Entry</button>
        <button id="nut-tab-log" onclick="nutTab('log')"
          style="flex:1;padding:8px;border:none;border-radius:8px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:0.82rem;
          background:transparent;color:var(--text-muted);">📋 Today's Log</button>
      </div>

      <!-- SEARCH TAB -->
      <div id="nut-search">
        <div style="margin-bottom:12px;">
          <select id="nut-meal-type" style="width:100%;background:var(--bg);border:1px solid var(--border);
            border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
            font-size:0.88rem;color:var(--text-main);outline:none;margin-bottom:10px;">
            ${MEAL_TYPES.map(m => `<option>${m}</option>`).join('')}
          </select>
          <div style="position:relative;">
            <input type="text" id="food-search-input" placeholder="Search food... (e.g. rice, egg, apple)"
              oninput="searchFood(this.value)"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 16px 10px 40px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"
              onfocus="this.style.borderColor='var(--green-accent)'"
              onblur="this.style.borderColor='var(--border)'"/>
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);
              font-size:0.9rem;">🔍</span>
          </div>
        </div>

        <!-- Quick add popular -->
        <div style="margin-bottom:12px;">
          <div style="font-size:0.7rem;color:var(--text-light);margin-bottom:8px;">POPULAR</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="quick-foods">
            ${['Boiled Egg','Oats (cooked)','Banana','Roti / Chapati','Dal (cooked)','Curd / Yogurt'].map(f =>
              `<button onclick="quickAddFood('${f}')"
                style="padding:5px 12px;border:1px solid var(--border);border-radius:12px;
                background:var(--bg);font-size:0.75rem;color:var(--text-muted);cursor:pointer;
                font-family:'DM Sans',sans-serif;transition:all 0.2s;"
                onmouseover="this.style.background='var(--green-light)'"
                onmouseout="this.style.background='var(--bg)'">${f}</button>`).join('')}
          </div>
        </div>

        <div id="food-search-results"></div>
      </div>

      <!-- MANUAL TAB -->
      <div id="nut-manual" style="display:none;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div style="grid-column:1/-1;">
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Food Name *</label>
            <input type="text" id="manual-food-name" placeholder="e.g. Homemade dal fry"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Calories (kcal) *</label>
            <input type="number" id="manual-cal" placeholder="250"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Protein (g)</label>
            <input type="number" id="manual-protein" placeholder="10"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Carbs (g)</label>
            <input type="number" id="manual-carbs" placeholder="30"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Fat (g)</label>
            <input type="number" id="manual-fat" placeholder="5"
              style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;"/>
          </div>
          <div>
            <label style="font-size:0.72rem;color:var(--text-muted);display:block;margin-bottom:5px;
              text-transform:uppercase;letter-spacing:0.05em;">Meal Type</label>
            <select id="manual-meal-type" style="width:100%;background:var(--bg);border:1px solid var(--border);
              border-radius:var(--radius-sm);padding:10px 12px;font-family:'DM Sans',sans-serif;
              font-size:0.88rem;color:var(--text-main);outline:none;">
              ${MEAL_TYPES.map(m => `<option>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <button onclick="saveManualFood()" class="btn-save" style="width:100%;">+ Add Food</button>
      </div>

      <!-- LOG TAB -->
      <div id="nut-log" style="display:none;">
        <div id="nut-log-content"></div>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function calcTotals(logs) {
  return logs.reduce((t, l) => ({
    cal:     t.cal     + (l.cal || 0),
    protein: t.protein + (l.protein || 0),
    carbs:   t.carbs   + (l.carbs || 0),
    fat:     t.fat     + (l.fat || 0),
  }), { cal:0, protein:0, carbs:0, fat:0 });
}

function macroCard(icon, label, val, goal, unit) {
  return `<div style="background:var(--bg-card);border:1px solid var(--border);
    border-radius:var(--radius-sm);padding:10px;text-align:center;">
    <div style="font-size:0.9rem;margin-bottom:2px;">${icon}</div>
    <div style="font-size:0.68rem;color:var(--text-light);text-transform:uppercase;margin-bottom:3px;">${label}</div>
    <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--text-main);">
      ${Math.round(val)}<span style="font-size:0.65rem;font-family:'DM Sans',sans-serif;
      color:var(--text-muted);"> ${unit}</span></div>
    ${goal ? `<div style="font-size:0.65rem;color:var(--text-light);">of ${goal} ${unit}</div>` : ''}
  </div>`;
}

function searchFood(query) {
  const el = document.getElementById('food-search-results');
  if (!el) return;
  if (!query.trim()) { el.innerHTML = ''; return; }

  const results = FOOD_DB.filter(f =>
    f.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  if (!results.length) {
    el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
      No results — try Manual Entry tab to add custom food.</div>`;
    return;
  }

  el.innerHTML = results.map(f => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;
      background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
      margin-bottom:8px;cursor:pointer;transition:all 0.2s;"
      onmouseover="this.style.background='#f9fdf9'"
      onmouseout="this.style.background='var(--bg-card)'">
      <div style="flex:1;">
        <div style="font-size:0.85rem;font-weight:500;color:var(--text-main);">${f.name}</div>
        <div style="font-size:0.72rem;color:var(--text-muted);">${f.serving}</div>
        <div style="display:flex;gap:10px;margin-top:4px;">
          <span style="font-size:0.72rem;color:var(--green-accent);">🔥 ${f.cal} kcal</span>
          <span style="font-size:0.72rem;color:var(--text-light);">P: ${f.protein}g</span>
          <span style="font-size:0.72rem;color:var(--text-light);">C: ${f.carbs}g</span>
          <span style="font-size:0.72rem;color:var(--text-light);">F: ${f.fat}g</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="number" value="1" min="0.5" max="10" step="0.5"
          id="qty-${f.name.replace(/\s/g,'_')}"
          style="width:50px;background:var(--bg);border:1px solid var(--border);
          border-radius:6px;padding:5px 6px;font-size:0.82rem;text-align:center;outline:none;"
          onclick="event.stopPropagation()"/>
        <button onclick="logSearchedFood('${f.name}')" class="btn-save"
          style="padding:7px 14px;font-size:0.78rem;white-space:nowrap;">+ Add</button>
      </div>
    </div>`).join('');
}

function quickAddFood(name) {
  document.getElementById('food-search-input').value = name;
  searchFood(name);
}

function logSearchedFood(name) {
  const food  = FOOD_DB.find(f => f.name === name);
  if (!food) return;
  const qtyEl = document.getElementById(`qty-${name.replace(/\s/g,'_')}`);
  const qty   = parseFloat(qtyEl?.value || 1);
  const meal  = document.getElementById('nut-meal-type')?.value || 'Snack';

  const logs = getNutritionLogs();
  logs.push({ id: Date.now(), name: food.name, meal, qty,
    cal:     Math.round(food.cal     * qty),
    protein: Math.round(food.protein * qty * 10) / 10,
    carbs:   Math.round(food.carbs   * qty * 10) / 10,
    fat:     Math.round(food.fat     * qty * 10) / 10,
    serving: food.serving, date: new Date().toISOString() });
  saveNutritionLogs(logs);
  showToast(`✓ ${food.name} added to ${meal}`);
  document.getElementById('food-search-input').value = '';
  document.getElementById('food-search-results').innerHTML = '';
  updateNutritionLifestyle();
}

function saveManualFood() {
  const name = document.getElementById('manual-food-name').value.trim();
  const cal  = parseInt(document.getElementById('manual-cal').value);
  if (!name) { showToast('Please enter food name'); return; }
  if (!cal)  { showToast('Please enter calories'); return; }

  const meal = document.getElementById('manual-meal-type').value;
  const logs = getNutritionLogs();
  logs.push({ id: Date.now(), name, meal, qty: 1, cal,
    protein: parseFloat(document.getElementById('manual-protein').value) || 0,
    carbs:   parseFloat(document.getElementById('manual-carbs').value)   || 0,
    fat:     parseFloat(document.getElementById('manual-fat').value)     || 0,
    serving: 'custom', date: new Date().toISOString() });
  saveNutritionLogs(logs);
  showToast(`✓ ${name} added`);
  ['manual-food-name','manual-cal','manual-protein','manual-carbs','manual-fat']
    .forEach(id => { document.getElementById(id).value = ''; });
  nutTab('log');
  updateNutritionLifestyle();
}

function renderNutritionLog() {
  const el    = document.getElementById('nut-log-content');
  if (!el) return;
  const today = new Date().toDateString();
  const logs  = getNutritionLogs().filter(l => new Date(l.date).toDateString() === today);

  if (!logs.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);">
      <div style="font-size:2rem;margin-bottom:8px;">🥗</div>
      <div style="font-size:0.85rem;">No meals logged today. Start tracking!</div></div>`;
    return;
  }

  const byMeal = {};
  MEAL_TYPES.forEach(m => byMeal[m] = []);
  logs.forEach(l => { if (byMeal[l.meal]) byMeal[l.meal].push(l); });

  el.innerHTML = MEAL_TYPES.filter(m => byMeal[m].length).map(m => `
    <div style="margin-bottom:16px;">
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);
        letter-spacing:0.08em;margin-bottom:8px;">${m.toUpperCase()}</div>
      ${byMeal[m].map(item => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
          background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);
          margin-bottom:6px;">
          <div style="flex:1;">
            <div style="font-size:0.83rem;font-weight:500;color:var(--text-main);">${item.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">
              P: ${item.protein}g · C: ${item.carbs}g · F: ${item.fat}g</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--green-accent);">
              ${item.cal} kcal</div>
            <button onclick="deleteNutritionLog(${item.id})"
              style="background:none;border:none;color:var(--text-light);cursor:pointer;
              font-size:0.72rem;">remove</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

function deleteNutritionLog(id) {
  const logs = getNutritionLogs().filter(l => l.id !== id);
  saveNutritionLogs(logs);
  renderNutritionLog();
  showToast('Item removed');
}

function nutTab(tab) {
  ['search','manual','log'].forEach(t => {
    const el  = document.getElementById(`nut-${t}`);
    const btn = document.getElementById(`nut-tab-${t}`);
    if (el)  el.style.display     = t === tab ? 'block' : 'none';
    if (btn) {
      btn.style.background = t === tab ? 'var(--bg-card)' : 'transparent';
      btn.style.color      = t === tab ? 'var(--green-dark)' : 'var(--text-muted)';
      btn.style.fontWeight = t === tab ? '500' : '400';
    }
  });
  if (tab === 'log') renderNutritionLog();
}

function updateNutritionLifestyle() {
  const today  = new Date().toDateString();
  const logs   = getNutritionLogs().filter(l => new Date(l.date).toDateString() === today);
  const totals = calcTotals(logs);
  const el = document.getElementById('ls-calories');
  if (el && totals.cal) el.textContent = totals.cal + ' kcal today';
}

document.addEventListener('DOMContentLoaded', updateNutritionLifestyle);