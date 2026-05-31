// ─────────────────────────────────────────────
//  CuraMind · symptom-voice.js
//  Voice input for symptom checker
//  Uses Web Speech API (no external API needed)
//  Save to: frontend/js/symptom-voice.js
//  Add in index.html before </body>:
//  <script src="js/symptom-voice.js"></script>
// ─────────────────────────────────────────────

let voiceRecognition = null;
let isRecording      = false;

function initVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const btn = document.getElementById('voice-btn');
    if (btn) {
      btn.style.opacity = '0.4';
      btn.title = 'Voice input not supported in this browser. Use Chrome.';
      btn.disabled = true;
    }
    return;
  }

  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous    = false;
  voiceRecognition.interimResults = true;
  voiceRecognition.maxAlternatives = 1;

  // Default language — changed by language selector
  voiceRecognition.lang = 'en-IN';

  voiceRecognition.onstart = () => {
    isRecording = true;
    updateVoiceBtn(true);
    showVoiceStatus('Listening… speak your symptoms');
  };

  voiceRecognition.onresult = (event) => {
    let interim = '';
    let final   = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += transcript;
      else interim += transcript;
    }

    const input = document.getElementById('symptom-input');
    if (!input) return;

    if (final) {
      const current = input.value.trim();
      input.value   = current ? current + ' ' + final : final;
      if (typeof onSymptomInput === 'function') onSymptomInput(input);
      showVoiceStatus('✓ Voice captured — you can keep speaking or edit the text');
    } else if (interim) {
      showVoiceStatus('Hearing: ' + interim);
    }
  };

  voiceRecognition.onerror = (event) => {
    isRecording = false;
    updateVoiceBtn(false);
    const msgs = {
      'not-allowed':  'Microphone permission denied. Please allow mic access.',
      'no-speech':    'No speech detected. Try again.',
      'network':      'Network error. Check connection.',
      'aborted':      'Recording stopped.',
    };
    showVoiceStatus(msgs[event.error] || 'Error: ' + event.error, true);
  };

  voiceRecognition.onend = () => {
    isRecording = false;
    updateVoiceBtn(false);
    if (document.getElementById('voice-status')?.textContent.startsWith('Listening')) {
      showVoiceStatus('Done. Edit above if needed.');
    }
  };
}

function toggleVoiceInput() {
  if (!voiceRecognition) { initVoiceInput(); }
  if (!voiceRecognition) return;

  // Update language based on selector
  const langSel = document.getElementById('symptom-lang');
  if (langSel) {
    const langMap = {
      en: 'en-IN',
      te: 'te-IN',
      hi: 'hi-IN'
    };
    voiceRecognition.lang = langMap[langSel.value] || 'en-IN';
  }

  if (isRecording) {
    voiceRecognition.stop();
  } else {
    try {
      voiceRecognition.start();
    } catch (e) {
      showVoiceStatus('Could not start recording: ' + e.message, true);
    }
  }
}

function updateVoiceBtn(recording) {
  const btn = document.getElementById('voice-btn');
  if (!btn) return;
  if (recording) {
    btn.innerHTML   = '⏹️';
    btn.title       = 'Stop recording';
    btn.style.background = '#ffe4e4';
    btn.style.borderColor = '#c0392b';
    btn.style.animation   = 'voicePulse 1s infinite';
  } else {
    btn.innerHTML   = '🎤';
    btn.title       = 'Click to speak your symptoms';
    btn.style.background = 'var(--green-light)';
    btn.style.borderColor = 'var(--border)';
    btn.style.animation   = 'none';
  }
}

function showVoiceStatus(msg, isError = false) {
  const el = document.getElementById('voice-status');
  if (!el) return;
  el.textContent  = msg;
  el.style.color  = isError ? '#c0392b' : 'var(--green-accent)';
  el.style.display = 'block';
  if (!isError && !msg.startsWith('Listening')) {
    setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
  }
}

// Add voice pulse animation
const voiceStyle = document.createElement('style');
voiceStyle.textContent = `
  @keyframes voicePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(192,57,43,0.4); }
    50%       { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(192,57,43,0); }
  }
`;
document.head.appendChild(voiceStyle);

// Init on load
document.addEventListener('DOMContentLoaded', initVoiceInput);