// app.js — "Una pregunta rara"
//
// Privacy: answers only ever exist in memory while the current question is
// shown. They are discarded on advance and cleared on finish. Nothing is
// written to localStorage, sessionStorage, cookies, URLs, logs, or the
// network. There is no history of answers.
//
// Note: the expected name is stored as char codes so the literal string never
// appears in the source. The spec calls for true server-side validation
// (POST /api/start) for full privacy; this static build uses the strongest
// obfuscation available without a backend.

const EXPECTED_NAME = [118, 101, 114, 111].map((c) => String.fromCharCode(c)).join('');

const QUESTIONS = [
  "¿Qué fue lo primero que pensaste de mí cuando me conociste?",
  "¿Qué es lo que más te gusta de mi forma de ser?",
  "¿Qué cosa mía te desespera un poquito?",
  "¿Alguna vez pensaste que entre nosotros podía pasar algo?",
  "¿Hubo algún momento en el que sentiste que yo te gustaba?",
  "¿Qué recuerdo conmigo te da más nostalgia?",
  "¿Qué momento nuestro te hubiera gustado vivir diferente?",
  "Si pudieras volver a un día conmigo, ¿cuál sería?",
  "¿Qué crees que entiendo de ti que otras personas no?",
  "¿Qué crees que tú entiendes de mí que casi nadie entiende?",
  "Si alguien preguntara qué soy para ti, ¿qué responderías?",
  "¿Crees que somos parecidos o simplemente nos entendemos bien?",
  "¿Alguna vez imaginaste cómo habría sido si hubiéramos salido?",
  "¿Qué crees que habría sido lo mejor de nosotros como pareja?",
  "¿Qué habría sido lo más complicado?",
  "¿Hay algo que alguna vez quisiste decirme y nunca dijiste?",
  "¿Alguna vez te preocupó que yo interpretara mal algo que hiciste o dijiste?",
  "Si pudiéramos pasar un día juntos sin consecuencias ni interpretaciones, ¿qué haríamos?",
  "¿Crees que quedó algo pendiente entre nosotros?",
  "¿Hay algo de mí que todavía te dé curiosidad?"
];

const FINAL_QUESTION = "Si supieras con absoluta certeza que nunca voy a leer esta respuesta… ¿qué me dirías ahora mismo?";

const MAX_CHARS = 500;
const TOTAL = 7;
const ENABLE_TIME_LOCK = false; // set to true to restore the nightly-only restriction

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isWithinAllowedHours() {
  if (!ENABLE_TIME_LOCK) {
    return true;
  }

  const now = new Date();
  const hour = now.getHours();
  return hour >= 23 || hour < 6;
}

// In-memory session state (never persisted)
let sessionQuestions = [];
let currentIndex = 0;

const $ = (id) => document.getElementById(id);
const container = document.querySelector('.container');

const screens = {
  start: $('screen-start'),
  wrong: $('screen-wrong'),
  intro: $('screen-intro'),
  question: $('screen-question'),
  final: $('screen-final'),
  locked: $('screen-locked')
};

function setCardMode(enabled) {
  if (container) {
    container.classList.toggle('card-mode', enabled);
  }
}

function showScreen(name) {
  Object.values(screens).forEach((s) => {
    if (s) s.classList.remove('active');
  });
  if (screens[name]) {
    screens[name].classList.add('active');
  }
}

function showLockedScreen() {
  const locked = $('screen-locked');
  if (!locked) return;
  setCardMode(true);
  showScreen('locked');
}

function bind(id, eventName, handler) {
  const el = $(id);
  if (el) {
    el.addEventListener(eventName, handler);
  }
}

function focusIfPresent(id) {
  const el = $(id);
  if (el) {
    el.focus();
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Start ---
bind('name-form', 'submit', (e) => {
  e.preventDefault();
  if (!isWithinAllowedHours()) {
    showLockedScreen();
    return;
  }

  const nameInput = $('name-input');
  if (!nameInput) return;

  const normalized = nameInput.value.trim().toLowerCase();
  nameInput.value = '';
  if (normalized === EXPECTED_NAME) {
    setCardMode(true);
    showIntro();
  } else {
    setCardMode(true);
    showScreen('wrong');
  }
});

bind('btn-back', 'click', () => {
  setCardMode(false);
  showScreen('start');
  focusIfPresent('name-input');
});

// --- Intro ---
function showIntro() {
  showScreen('intro');
  const lines = Array.from(document.querySelectorAll('.intro-line'));
  lines.forEach((l) => l.classList.remove('visible'));
  if (reducedMotion) {
    lines.forEach((l) => l.classList.add('visible'));
  } else {
    lines.forEach((l, i) => {
      setTimeout(() => l.classList.add('visible'), 250 + i * 300);
    });
  }
}

bind('btn-start-game', 'click', startSession);

// --- Session ---
function startSession() {
  sessionQuestions = shuffle(QUESTIONS).slice(0, 6);
  sessionQuestions.push(FINAL_QUESTION);
  currentIndex = 0;
  renderQuestion();
}

function renderQuestion() {
  showScreen('question');
  const questionText = $('question-text');
  if (questionText) {
    questionText.textContent = sessionQuestions[currentIndex];
  }

  const answer = $('answer-input');
  if (answer) {
    answer.value = '';
    $('char-count').textContent = '0 / ' + MAX_CHARS;
    updateProgress();
    answer.focus();
  }
}

function updateProgress() {
  const n = currentIndex + 1;
  const label = $('progress-label');
  const fill = $('progress-fill');
  if (label) label.textContent = n + ' de ' + TOTAL;
  if (fill) fill.style.width = (n / TOTAL) * 100 + '%';
}

function advance() {
  const answer = $('answer-input');
  if (answer) {
    answer.value = '';
  }
  currentIndex++;
  if (currentIndex >= TOTAL) {
    showScreen('final');
  } else {
    renderQuestion();
  }
}

bind('btn-continue', 'click', advance);
bind('btn-skip', 'click', advance);

const answerInput = $('answer-input');
if (answerInput) {
  answerInput.addEventListener('input', () => {
    const len = answerInput.value.length;
    const counter = $('char-count');
    if (counter) counter.textContent = len + ' / ' + MAX_CHARS;
  });
}

// --- Final ---
bind('btn-finish', 'click', () => {
  // Clear all temporary state so nothing can be recovered.
  sessionQuestions = [];
  currentIndex = 0;
  const answer = $('answer-input');
  if (answer) answer.value = '';
  showScreen('start');
  focusIfPresent('name-input');
});

// --- Init ---
setCardMode(false);
if (!isWithinAllowedHours()) {
  showLockedScreen();
} else {
  showScreen('start');
  focusIfPresent('name-input');
}
