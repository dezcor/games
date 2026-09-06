const RAW_QUESTIONS = [
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

const ALCOHOL_PATTERNS = /(cerveza|birra|beer|vino|alcohol|licor|trago|tragos|copas|whisky|vodka|tequila|ron|rum|ginebra)/i;
const QUESTIONS = RAW_QUESTIONS.map((question) => question)
  .filter((question) => !ALCOHOL_PATTERNS.test(question));

const FINAL_QUESTION =
  "Si supieras con absoluta certeza que nunca voy a leer esta respuesta… ¿qué me dirías ahora mismo?";

const TARGET = String.fromCharCode(118, 101, 114, 111);
const NAME = String.fromCharCode(86, 101, 114, 111);

const $ = (id) => document.getElementById(id);

const screens = {
  start: $("screen-start"),
  rejected: $("screen-rejected"),
  intro: $("screen-intro"),
  question: $("screen-question"),
  final: $("screen-final")
};

const nameInput = $("name");
const nameForm = $("name-form");
const answer = $("answer");
const questionText = $("questionText");
const progressLabel = $("progressLabel");
const progressFill = $("progressFill");
const count = $("count");
const finalName = $("finalName");

let questions = [];
let index = 0;
let currentAnswer = null;

function normalizeName(value) {
  return value.trim().toLowerCase();
}

function isAllowed(value) {
  return normalizeName(value) === TARGET;
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showScreen(key) {
  const screen = screens[key];
  if (!screen) return;

  screen.hidden = false;
  screen.classList.remove("enter");
  void screen.offsetWidth;
  screen.classList.add("enter");

  const focusEl = screen.querySelector("input, textarea, button");
  if (focusEl) focusEl.focus();
}

function resetTransient() {
  questions = [];
  index = 0;
  currentAnswer = null;
  answer.value = "";
  questionText.textContent = "…";
  progressLabel.textContent = "1 / 7";
  progressFill.style.width = "0%";
  count.textContent = "0/500";
  nameInput.value = "";
  finalName.textContent = "";
  document.body.classList.remove("target");
}

function restart() {
  resetTransient();
  showScreen("start");
}

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = nameInput.value;

  if (isAllowed(raw)) {
    document.body.classList.add("target");
    showScreen("intro");
  } else {
    document.body.classList.remove("target");
    showScreen("rejected");
  }

  nameInput.value = "";
});

$("btn-restart").addEventListener("click", restart);

$("btn-start").addEventListener("click", () => {
  questions = shuffle(QUESTIONS).slice(0, 6).concat([FINAL_QUESTION]);
  index = 0;
  renderQuestion();
});

function updateCount() {
  count.textContent = `${answer.value.length}/500`;
}

function renderQuestion() {
  questionText.textContent = questions[index];
  currentAnswer = null;
  answer.value = "";
  updateCount();

  progressLabel.textContent = `${index + 1} / 7`;
  progressFill.style.width = `${((index + 1) / questions.length) * 100}%`;

  showScreen("question");
  answer.focus();
}

function discardCurrent() {
  currentAnswer = null;
  answer.value = "";
  updateCount();
}

function advance() {
  discardCurrent();
  index += 1;

  if (index < questions.length) {
    renderQuestion();
  } else {
    finish();
  }
}

$("btn-skip").addEventListener("click", advance);
$("btn-continue").addEventListener("click", advance);

answer.addEventListener("input", () => {
  currentAnswer = answer.value;
  updateCount();
});

answer.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    advance();
  }
});

function finish() {
  discardCurrent();
  questions = [];
  index = 0;
  currentAnswer = null;
  finalName.textContent = NAME;
  showScreen("final");
}

$("btn-finish").addEventListener("click", restart);

restart();