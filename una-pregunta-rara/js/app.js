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
  "¿Hay algo de mí que todavía te dé curiosidad?",
  "¿Qué te hace sentir más viva en este momento?",
  "¿Qué pequeña cosa te hace feliz sin que nadie lo note?",
  "¿Qué cosa de la vida adulta te parece más rara de lo que pensabas?",
  "¿Cuál es tu mayor miedo real o tonto?",
  "¿Qué te gustaría aprender aunque te cueste mucho al principio?",
  "¿Qué sitio del mundo te gustaría visitar al menos una vez?",
  "¿Qué canción te representa más en este momento?",
  "¿Qué persona te ha cambiado la forma de ver la vida?",
  "¿Qué te gustaría que la gente entendiera de ti mejor?",
  "¿Qué sueño te daría más miedo contar en voz alta?",
  "¿Qué harías si te tocaran 100.000 pesos y no tuvieras que pagar nada?",
  "¿Qué cosa te hace reír aunque sepas que no es graciosa?",
  "¿Qué hábito tuyo te gustaría romper ya mismo?",
  "¿Cuál es la peor primera impresión que alguien te ha dado?",
  "¿Qué te parece más atractivo: inteligencia, humor o valentía?",
  "¿Qué sería lo primero que harías si pudieras vivir un año sin reglas?",
  "¿Qué te gustaría que te dijeran más seguido?",
  "¿Qué cosa te da un poquito de ansiedad por pensarla demasiado?",
  "¿Qué te gustaría hacer antes de cumplir 30?",
  "¿Qué superstición o ritual tienes aunque no quieras admitirlo?",
  "¿Qué te parece más importante: sentirte amada o sentirte comprendida?",
  "¿Qué película, serie o libro te cambió la forma de pensar?",
  "¿Qué te gustaría cambiar de tu vida actual si pudieras?",
  "¿Qué te hace sentir más libre?",
  "¿Qué cosa te gustaría decirle a tu yo del pasado?",
  "¿Qué te da más curiosidad de la humanidad?",
  "¿Qué te parece más valioso: el tiempo, la salud o el dinero?",
  "¿Qué te gustaría que te recordaran de ti cuando no estés?",
  "¿Qué es algo que te has callado por miedo a perder a alguien?",
  "¿Cuál es el detalle más raro o bonito que alguien ha hecho por ti?",
  "¿Qué te da más ganas de vivir cada día?",
  "¿Qué te gustaría que te entendieran sin explicación?",
  "¿Qué cosa de la naturaleza te parece más fascinante?",
  "¿Qué te haría dejar de mirar el celular por un rato?",
  "¿Qué te parece más difícil: empezar o mantenerse?",
  "¿Qué te gustaría aprender de alguien que admires mucho?",
  "¿Qué te daría más tranquilidad en una noche tormentosa?",
  "¿Qué cosa te hace sentir más adulta?",
  "¿Qué te gustaría ser capaz de hacer sin miedo?",
  "¿Qué secreto pequeño te gustaría confesarle a alguien?",
  "¿Cuál es la mejor decisión que has tomado hasta ahora?",
  "¿Qué te gustaría que cambiara de la sociedad?",
  "¿Qué te persigue de la infancia y todavía no logras soltar?",
  "¿Qué te hace sentir más conectada con la gente?",
  "¿Qué sería lo más loco que harías por una persona que te importa?",
  "¿Qué misterio de la vida te da más curiosidad?",
  "¿Qué te gustaría que te preguntaran más seguido?",
  "¿Qué te devuelve la energía cuando estás cansada?",
  "¿Qué crees que nadie se imagina de ti?",
  "¿Qué harías si pudieras vivir una semana sin responsabilidades?",
  "¿Qué cosa de ti te gustaría que cambiaran otras personas?",
  "¿Qué cosa de ti te gustaría que no cambiaran nunca?",
  "¿Qué te saca más de quicio en una conversación?",
  "¿Qué es lo más extraño que te ha pasado?",
  "¿Qué harías si te dieran una segunda oportunidad para empezar de cero?",
  "¿Qué tipo de persona te atrae más y por qué?",
  "¿Qué te parece una verdadera prueba de cariño?",
  "¿Qué te hace sentir segura con alguien?",
  "¿Hay algo que te gustaría decirle a alguien y no has dicho?",
  "¿Qué cosa te gustaría que se quedara para siempre?",
  "¿Qué conversación te hace sentir más viva?",
  "¿Qué sería lo más hermoso que alguien te pudiera decir ahora mismo?",
  "¿Qué hace que quieras acercarte más a alguien?",
  "¿Qué te hace sentir más en paz contigo misma?",
  "¿Qué te gustaría que te regalaran sin que fuera algo material?",
  "¿Qué te da más miedo de la madurez?",
  "¿Qué cosa pequeña te hace sentir que alguien te conoce de verdad?",
  "¿Qué prefieres: una noche llena de risas o una noche llena de conversaciones profundas?",
  "¿Qué te gustaría que alguien entendiera de ti aunque jamás lo dijeras?",
  "¿Qué sueles idealizar más: la gente, el amor o el futuro?",
  "¿Qué te hace sentir que las cosas valen la pena?",
  "¿Qué harías si supieras que mañana todo cambia para siempre?",
  "¿Qué detalle de alguien te resulta muy atractivo aunque no lo exprese?",
  "¿Qué te ayuda a mantener la calma cuando estás bajo presión?",
  "¿Qué te gustaría experimentar por primera vez en la vida?",
  "¿Qué te gustaría dejar de hacer por vergüenza?",
  "¿Qué te parece más intenso: un silencio cómodo o una discusión sincera?",
  "¿Qué te calmaría en medio de un momento de caos?",
  "¿Qué te parece más valioso en una amistad?",
  "¿Cuál es la frase que más te ha impactado escuchar?",
  "¿Qué cosa te hace sentir que la vida tiene sentido?",
  "¿Qué te gustaría decirle a la versión de ti que era más inocente?",
  "¿Qué te hace sentir que alguien te está observando de verdad?",
  "¿Qué te gustaría hacer sin pensar en la opinión de los demás?",
  "¿Qué te parece más revelador de una persona: su humor o su silencio?",
  "¿Qué te gustaría descubrir de ti misma durante el próximo año?",
  "¿Qué te da más alegría sin que lo vean los demás?",
  "¿Qué te haría más difícil decir adiós?",
  "¿Qué te gusta más de una persona: su presencia o su forma de hablar?",
  "¿Qué te hace sentir más vulnerable?",
  "¿Qué cosa te gustaría que nunca se volviera rutina?",
  "¿Qué persona te ha enseñado algo sin darte cuenta?",
  "¿Qué es lo más hermoso que alguien te ha compartido?",
  "¿Qué te hace querer estar cerca de alguien de verdad?",
  "¿Qué te gustaría cambiar de la forma en que te relacionas con la gente?",
  "¿Qué te gustaría que te dijeran un día antes de dormir?",
  "¿Qué tienes miedo de perder aunque intentes no mostrarlo?",
  "¿De qué te sientes más orgullosa?",
  "¿Cuál es la mayor contradicción de tu personalidad?",
  "¿Qué te parece más romántico: una acción o una palabra?",
  "¿Qué te gustaría hacer aunque nadie te lo pida?",
  "¿Qué te da más ganas de empezar de nuevo?",
  "¿Qué cosa de ti te gustaría descubrir en otra persona?",
  "¿Qué te parece más raro: la gente que se guarda todo o la gente que lo dice todo?",
  "¿Qué te hace sentir que alguien realmente te ve?",
  "¿Qué te gustaría aprender a hacer mejor en la vida?",
  "¿Qué te hace querer abrazar a alguien sin decir nada?",
  "¿Qué agradeces más de tu vida?",
  "¿Qué es lo más difícil que has superado?",
  "¿Qué te gustaría que la gente recordara primero de ti?",
  "¿Qué te hace sentir más libre en una conversación?",
  "¿Qué te gustaría que alguien te preguntara en una cita?",
  "¿Qué te da más curiosidad por una persona?",
  "¿Qué te parece más importante para sostener una relación?",
  "¿Qué te hace sentir más cercana a alguien?",
  "¿Qué te gustaría poder hacer sin que nadie te juzgara?",
  "¿Qué te ha hecho crecer aunque no lo esperaras?",
  "¿Qué te gustaría que alguien entendiera sin que te lo explicaran?",
  "¿Qué cosa de ti es más difícil de explicar?",
  "¿Qué harías si tuvieras un día entero solo para ti?",
  "¿Qué te hace querer cuidar a alguien más de lo que sueles cuidar a otros?",
  "¿Qué sensación te hace recordar a alguien especial?",
  "¿Qué te gustaría que cambiaran de los caminos que tomas?",
  "¿Qué detalle te hace sentir que alguien se tomó el tiempo de conocerte?",
  "¿Qué te parece más íntimo: compartir un secreto o compartir un silencio?",
  "¿Qué te hace sentir más cerca de un lugar?",
  "¿Qué no harías nunca aunque te lo pidieran?",
  "¿Qué te gustaría volver a experimentar aunque sabes que no volverá?",
  "¿Qué te hace sentir más humana?",
  "¿Qué te gustaría que te dijeran en público y en privado?",
  "¿Qué te ha enseñado a no dar nada por sentado?",
  "¿Qué te gustaría que te permitieran hacer sin culpa?",
  "¿Qué harías si te dieras cuenta de que no tienes tanto tiempo como creías?",
  "¿Qué te gustaría que alguien supiera de ti aunque no lo diga abiertamente?",
  "¿Qué extrañas más de la gente que te importa?",
  "¿Qué te hace sentir que una conversación realmente importa?",
  "¿Qué te gustaría ser capaz de perdonar?",
  "¿Qué momento de tu vida te gustaría revivir aunque fuera por cinco minutos?"
];

const FINAL_QUESTION = "Si supieras con absoluta certeza que nunca voy a leer esta respuesta… ¿qué me dirías ahora mismo?";

const MAX_CHARS = 500;
const TOTAL = 7;
const ENABLE_TIME_LOCK = false; // set to true to restore the nightly-only restriction

const TOPIC_KEYS = ['relacion', 'nostalgia', 'miedo', 'futuro', 'personalidad', 'curiosidad'];
const TOPIC_LABELS = {
  relacion: 'relación',
  nostalgia: 'nostalgia',
  miedo: 'miedo',
  futuro: 'futuro',
  personalidad: 'personalidad',
  curiosidad: 'curiosidad'
};
const TOPIC_DESCRIPTIONS = {
  relacion: 'Parece que lo que más te hizo pensar fue lo que sentías y compartías con otra persona.',
  nostalgia: 'Tu sesión estuvo marcada por recuerdos, pasado y lo que todavía te pesa o te acompaña.',
  miedo: 'Lo que más dominó fue lo que te inquieta, te asusta o te hace dudar.',
  futuro: 'Más que mirar atrás, pareció que te importaba pensar en lo que viene.',
  personalidad: 'Lo que más salió fue tu forma de ser, de sentirte y de entenderte a ti misma.',
  curiosidad: 'Tu sesión giró mucho en torno a lo que te interesa, te intriga y te gustaría descubrir.'
};

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
let sessionTopicStats = Object.fromEntries(TOPIC_KEYS.map((key) => [key, 0]));
let sessionSkipped = 0;

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

function resetSessionAnalysis() {
  sessionTopicStats = Object.fromEntries(TOPIC_KEYS.map((key) => [key, 0]));
  sessionSkipped = 0;
}

const ANSWER_TOPIC_PATTERNS = {
  relacion: ['amor', 'pareja', 'cariño', 'querer', 'quiero', 'extraño', 'juntos', 'nosotros', 'confianza', 'beso', 'abrazo', 'persona importante', 'me gusta alguien'],
  nostalgia: ['recuerdo', 'extraño', 'antes', 'pasado', 'infancia', 'niñez', 'cuando era', 'volvería', 'volvier', 'aquella vez', 'nostalgia', 'abuela', 'familia'],
  miedo: ['miedo', 'temor', 'ansiedad', 'nerviosa', 'preocupa', 'preocupación', 'insegura', 'duda', 'perder', 'fracaso', 'culpa', 'vergüenza', 'difícil'],
  futuro: ['futuro', 'mañana', 'algún día', 'sueño', 'meta', 'metas', 'quiero lograr', 'espero', 'viajar', 'aprender', 'cambiar', 'plan', 'próximo'],
  personalidad: ['soy', 'siento', 'pienso', 'carácter', 'forma de ser', 'tímida', 'extrovertida', 'orgullosa', 'feliz', 'tranquila', 'libre', 'yo misma'],
  curiosidad: ['curiosidad', 'pregunta', 'descubrir', 'conocer', 'interesa', 'intriga', 'misterio', 'saber', 'entender', 'por qué', 'cómo funciona']
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getQuestionTopic(question) {
  const text = normalizeText(question);

  if (/(me conociste|gusta|parecidos|pareja|alguien|carino|cerca|relacion|somos|seguro|cercano|atrae|importa|sentir mas|compartias|nosotros|quedo algo pendiente|algo pendiente)/i.test(text)) {
    return 'relacion';
  }

  if (/(recuerdo|nostalgia|pasado|infancia|revivir|volver a|antes|viejo|recordar|momento nuestro|habria sido|quedo algo pendiente)/i.test(text)) {
    return 'nostalgia';
  }

  if (/(miedo|ansiedad|temor|asust|inquieta|vulnerable|perder|dudar|miedo de|temor|dificil|adios|no mostrarlo|nervios|problema)/i.test(text)) {
    return 'miedo';
  }

  if (/(manana|futuro|proximo ano|cumplir|una semana|si pudieras|volver a|vivir un ano|cuando no estes|tiempo|cambiar de la sociedad|caminos|dia entero|antes de|ahora mismo)/i.test(text)) {
    return 'futuro';
  }

  if (/(forma de ser|persona|que crees|que te|que harias|te hace sentir|te gustaria|te parece|seas|contradiccion|ideali|entender|nadie|te hace sentir mas|que cosa de ti|como te|eres para ti|tu yo|quieres|te vale|te hace|te gustaria que)/i.test(text)) {
    return 'personalidad';
  }

  if (/(curiosidad|intrigado|darte cuenta|aprender|descubrir|experimentar|preguntaran|interesa|gustaria aprender|te da mas curiosidad|que te gustaria|que te|que harias|que te hace)/i.test(text)) {
    return 'curiosidad';
  }

  return 'personalidad';
}

function getAnswerTopic(answer, question) {
  const text = normalizeText(answer);
  if (text.split(/\s+/).filter(Boolean).length < 3) {
    return getQuestionTopic(question);
  }

  const scores = Object.fromEntries(TOPIC_KEYS.map((key) => [key, 0]));
  Object.entries(ANSWER_TOPIC_PATTERNS).forEach(([topic, patterns]) => {
    patterns.forEach((pattern) => {
      if (text.includes(normalizeText(pattern))) {
        scores[topic] += 1;
      }
    });
  });

  const [topic, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return score > 0 ? topic : getQuestionTopic(question);
}

function recordAnsweredQuestion(question, answer) {
  const topic = getAnswerTopic(answer, question);
  if (sessionTopicStats[topic] !== undefined) {
    sessionTopicStats[topic] += 1;
  }
}

function renderFinalSummary() {
  const [dominantTopic, count] = Object.entries(sessionTopicStats).sort((a, b) => b[1] - a[1])[0] || ['personalidad', 0];
  const label = $('final-topic-label');
  const description = $('final-topic-description');

  if (label) {
    label.textContent = 'Tema dominante: ' + (TOPIC_LABELS[dominantTopic] || 'personalidad') + (count > 0 ? ' (' + count + ')' : '');
  }

  if (description) {
    description.textContent = TOPIC_DESCRIPTIONS[dominantTopic] || TOPIC_DESCRIPTIONS.personalidad;
  }
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

const SPECIAL_QUESTIONS = QUESTIONS.slice(0, 20);
const REGULAR_QUESTIONS = QUESTIONS.slice(20);

function buildSessionQuestions() {
  const selected = [];

  if (Math.random() < 0.5) {
    const pick = SPECIAL_QUESTIONS[Math.floor(Math.random() * SPECIAL_QUESTIONS.length)];
    selected.push(pick);
  }

  const remainingSlots = 6 - selected.length;
  const extraPool = shuffle(REGULAR_QUESTIONS).slice(0, remainingSlots);
  selected.push(...extraPool);

  while (selected.length < 6) {
    const fallback = shuffle(QUESTIONS).find((q) => !selected.includes(q));
    if (!fallback) break;
    selected.push(fallback);
  }

  return shuffle([...selected, FINAL_QUESTION]);
}

// --- Session ---
function startSession() {
  sessionQuestions = buildSessionQuestions();
  currentIndex = 0;
  resetSessionAnalysis();
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

function advance(skip = false) {
  const answer = $('answer-input');
  const value = answer ? answer.value.trim() : '';

  if (value) {
    recordAnsweredQuestion(sessionQuestions[currentIndex], value);
  } else if (skip) {
    sessionSkipped += 1;
  }

  if (answer) {
    answer.value = '';
  }

  currentIndex++;
  if (currentIndex >= TOTAL) {
    renderFinalSummary();
    showScreen('final');
  } else {
    renderQuestion();
  }
}

bind('btn-continue', 'click', () => advance(false));
bind('btn-skip', 'click', () => advance(true));

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
  resetSessionAnalysis();
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
