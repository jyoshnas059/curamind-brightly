// ─────────────────────────────────────────────
//  CuraMind · symptom-multilingual.js
//  Telugu + Hindi symptom input support
//  Save to: frontend/js/symptom-multilingual.js
// ─────────────────────────────────────────────

// ── TELUGU SYMPTOM PHRASES → English ─────────
const TELUGU_SYMPTOMS = {
  'తలనొప్పి':          'headache',
  'జ్వరం':             'fever',
  'దగ్గు':             'cough',
  'జలుబు':             'cold',
  'గొంతు నొప్పి':      'sore throat',
  'అలసట':              'fatigue',
  'వికారం':            'nausea',
  'వాంతులు':           'vomiting',
  'తలతిరగడం':          'dizziness',
  'ఛాతీ నొప్పి':       'chest pain',
  'కడుపు నొప్పి':      'stomach ache',
  'వేగంగా శ్వాస':     'breathing difficulty',
  'నిద్ర రాకపోవడం':   'insomnia',
  'ఆందోళన':           'anxiety',
  'నీరసం':            'weakness',
  'కండరాల నొప్పి':    'muscle pain',
  'వీపు నొప్పి':       'back pain',
  'కన్నుల నొప్పి':     'eye pain',
  'చెవి నొప్పి':       'ear pain',
  'చర్మం దురద':       'skin itching',
  'ముక్కు నుండి నీరు': 'runny nose',
  'తుమ్ములు':          'sneezing',
  'ఆకలి లేకపోవడం':    'loss of appetite',
  'గుండె దడ':          'palpitations',
  'మూత్రం తరచుగా':    'frequent urination',
  'మూత్రం మంట':       'burning urination',
  'నొప్పి':            'pain',
  'జ్వరం ఉంది':        'i have fever',
  'బాగా లేను':         'not feeling well',
};

// ── HINDI SYMPTOM PHRASES → English ──────────
const HINDI_SYMPTOMS = {
  'सिरदर्द':          'headache',
  'बुखार':            'fever',
  'खांसी':            'cough',
  'जुकाम':            'cold',
  'गले में दर्द':     'sore throat',
  'थकान':             'fatigue',
  'थकावट':            'exhaustion',
  'मतली':             'nausea',
  'उल्टी':            'vomiting',
  'चक्कर':            'dizziness',
  'सीने में दर्द':    'chest pain',
  'पेट दर्द':         'stomach ache',
  'सांस लेने में दिक्कत': 'breathing difficulty',
  'नींद नहीं आना':    'insomnia',
  'घबराहट':           'anxiety',
  'कमज़ोरी':          'weakness',
  'मांसपेशियों में दर्द': 'muscle pain',
  'कमर दर्द':         'back pain',
  'आंखों में दर्द':   'eye pain',
  'कान में दर्द':     'ear pain',
  'खुजली':            'itching',
  'नाक बहना':         'runny nose',
  'छींक':             'sneezing',
  'भूख नहीं':         'loss of appetite',
  'दिल की धड़कन':     'palpitations',
  'बार बार पेशाब':    'frequent urination',
  'जलन':              'burning sensation',
  'दर्द':             'pain',
  'बीमार':            'sick',
  'तबीयत ठीक नहीं':   'not feeling well',
};

// ── TRANSLATE TEXT TO ENGLISH ─────────────────
function translateSymptomText(text, lang) {
  if (lang === 'en') return text;

  const dict = lang === 'te' ? TELUGU_SYMPTOMS : HINDI_SYMPTOMS;
  let translated = text;

  // Replace known phrases
  Object.entries(dict).forEach(([native, english]) => {
    const regex = new RegExp(native, 'gi');
    translated = translated.replace(regex, english);
  });

  return translated;
}

// ── LANGUAGE SELECTOR ─────────────────────────
function initLanguageSelector() {
  const sel = document.getElementById('symptom-lang');
  if (!sel) return;

  sel.addEventListener('change', () => {
    const lang     = sel.value;
    const input    = document.getElementById('symptom-input');
    const langNote = document.getElementById('lang-note');
    const placeholder = {
      en: "I've had a dull headache since this morning, mostly behind my eyes...",
      te: "ఉదయం నుండి నాకు తలనొప్పి వస్తోంది, కళ్ళ వెనక ఎక్కువగా...",
      hi: "आज सुबह से मुझे सिरदर्द है, ज़्यादातर आंखों के पीछे...",
    };
    if (input) input.placeholder = placeholder[lang] || placeholder.en;

    // Update voice recognition language
    if (window.voiceRecognition) {
      const langMap = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
      window.voiceRecognition.lang = langMap[lang] || 'en-IN';
    }

    // Show language note
    if (langNote) {
      if (lang !== 'en') {
        const notes = {
          te: '🇮🇳 Telugu mode — type in Telugu, we\'ll understand and translate automatically.',
          hi: '🇮🇳 Hindi mode — हिंदी में लिखें, हम समझेंगे और अनुवाद करेंगे।',
        };
        langNote.textContent  = notes[lang];
        langNote.style.display = 'block';
      } else {
        langNote.style.display = 'none';
      }
    }
  });
}

// ── GET TRANSLATED TEXT FOR GUIDANCE ─────────
// Call this before sending to Gemini
async function getTranslatedSymptoms() {
  const input = document.getElementById('symptom-input');
  const lang  = document.getElementById('symptom-lang')?.value || 'en';
  const raw   = input?.value.trim() || '';

  if (lang === 'en') return raw;

  // First try dictionary-based translation
  const dictTranslated = translateSymptomText(raw, lang);

  // If it still has non-ASCII chars (untranslated), use Gemini to translate
  const hasNonAscii = /[^\x00-\x7F]/.test(dictTranslated);
  if (hasNonAscii) {
    try {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=AIzaSyCNvmYGkV0CN38tQbrI10eG9R4NNBq4peg`;
      const langNames = { te: 'Telugu', hi: 'Hindi' };
      const prompt = `Translate this ${langNames[lang]} medical text to English. Return ONLY the translation, nothing else:\n"${raw}"`;

      const res  = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 } })
      });
      const data = await res.json();
      const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (translated) {
        // Show translation note
        showTranslationNote(raw, translated);
        return translated;
      }
    } catch { /* fall through to dict translation */ }
  }

  return dictTranslated;
}

function showTranslationNote(original, translated) {
  const existing = document.getElementById('translation-note');
  if (existing) existing.remove();

  const note = document.createElement('div');
  note.id = 'translation-note';
  note.style.cssText = `background:#eef5ee;border:1px solid var(--border);border-radius:var(--radius-sm);
    padding:10px 14px;margin-top:8px;font-size:0.78rem;color:var(--text-muted);max-width:760px;`;
  note.innerHTML = `
    <span style="font-weight:500;color:var(--green-dark);">🔄 Translated for analysis:</span>
    <span style="color:var(--text-main);"> "${translated}"</span>`;

  const symptomBox = document.querySelector('.symptom-box');
  if (symptomBox) symptomBox.appendChild(note);
}

// Init on load
document.addEventListener('DOMContentLoaded', initLanguageSelector);