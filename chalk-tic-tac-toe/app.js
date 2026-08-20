/* ═════════ datos base ═════════ */
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const DIFFS = {
  easy: { name: "Fácil" },
  normal: { name: "Normal" },
  hard: { name: "Imposible" },
};
const $ = (s) => document.querySelector(s);
const board = $("#board"),
  cellsEl = $("#cells"),
  gridSvg = $("#gridSvg"),
  winlineSvg = $("#winline"),
  statusEl = $("#status"),
  statusMsg = $("#statusMsg"),
  statusSub = $("#statusSub"),
  catEl = $("#cat"),
  numYou = $("#numYou"),
  numCat = $("#numCat"),
  numTie = $("#numTie"),
  mkYou = $("#mkYou"),
  mkCat = $("#mkCat"),
  mkTie = $("#mkTie"),
  roundEl = $("#round"),
  streakEl = $("#streak"),
  btnMenu = $("#btnMenu"),
  btnNew = $("#btnNew"),
  btnNext = $("#btnNext"),
  btnMute = $("#btnMute"),
  btnReset = $("#btnReset");

let grid,
  turn,
  over,
  aiTimer = null,
  soundOn = true,
  diff = "easy",
  score = { you: 0, cat: 0, tie: 0 },
  round = 1,
  streak = 0;

/* persistencia */
try {
  const s = JSON.parse(localStorage.getItem("gatoState") || "null");
  if (s) {
    diff = s.diff || "easy";
    score = s.score || score;
    round = s.round || 1;
    soundOn = s.soundOn !== false;
  }
} catch (e) {}
function save() {
  try {
    localStorage.setItem(
      "gatoState",
      JSON.stringify({ diff, score, round, soundOn }),
    );
  } catch (e) {}
}

/* ═════════ tiza: líneas dibujadas a mano ═════════ */
function wobble(x1, y1, x2, y2, seed) {
  const dx = x2 - x1,
    dy = y2 - y1,
    len = Math.hypot(dx, dy);
  const nx = -dy / len,
    ny = dx / len;
  const a = (rand(seed * 7 + 1) - 0.5) * 7,
    b = (rand(seed * 13 + 2) - 0.5) * 7;
  return `M ${x1} ${y1} Q ${((x1 + x2) / 2 + nx * a).toFixed(1)} ${((y1 + y2) / 2 + ny * a).toFixed(1)} ${(x1 + x2) / 2 + nx * b * 0.6} ${(y1 + y2) / 2 + ny * b * 0.6} T ${x2} ${y2}`;
}
function rand(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function buildGrid() {
  let h = "";
  const seg = [
    [100, 6, 100, 294],
    [200, 6, 200, 294],
    [6, 100, 294, 100],
    [6, 200, 294, 200],
  ];
  seg.forEach(
    (p, i) => (h += `<path d="${wobble(p[0], p[1], p[2], p[3], i + 1)}"/>`),
  );
  gridSvg.innerHTML = h;
}
const MARKS = {
  X: `<svg viewBox="0 0 100 100"><path class="st d1" d="M22 24 L78 76"/><path class="st d2" d="M77 23 L23 78"/></svg>`,
  O: `<svg viewBox="0 0 100 100"><path class="st d1" d="M50 21 C 73 21 79 38 78 52 C 77 70 63 79 49 78 C 32 77 22 63 23 48 C 24 31 34 21 50 21"/></svg>`,
};

/* ═════════ sonido (WebAudio) ═════════ */
let AC = null;
function ac() {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === "suspended") AC.resume();
  return AC;
}
function noiseBurst(dur, freq) {
  if (!soundOn) return;
  try {
    const a = ac(),
      sr = a.sampleRate,
      buf = a.createBuffer(1, sr * dur, sr),
      d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.6);
    const src = a.createBufferSource();
    src.buffer = buf;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = 1.1;
    const g = a.createGain();
    g.gain.setValueAtTime(0.5, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    src.connect(bp).connect(g).connect(a.destination);
    src.start();
  } catch (e) {}
}
function tone(f, t0, dur, type = "sine", vol = 0.14) {
  if (!soundOn) return;
  try {
    const a = ac(),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, a.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol, a.currentTime + t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + t0);
    o.stop(a.currentTime + t0 + dur + 0.05);
  } catch (e) {}
}
const sfx = {
  place: (who) => noiseBurst(0.09, who === "X" ? 1900 : 1350),
  win: () =>
    [523, 659, 784, 1046].forEach((f, i) =>
      tone(f, i * 0.09, 0.22, "triangle", 0.16),
    ),
  lose: () =>
    [392, 330, 262].forEach((f, i) => tone(f, i * 0.12, 0.2, "sine", 0.13)),
  tie: () => {
    tone(440, 0, 0.14, "sine", 0.11);
    tone(440, 0.16, 0.2, "sine", 0.11);
  },
  ui: () => noiseBurst(0.05, 700),
};

/* ═════════ IA ═════════ */
const emptyOf = (g) => g.flatMap((v, i) => (v ? [] : [i]));
function findWin(g, p) {
  for (const [a, b, c] of LINES)
    if (g[a] === p && g[b] === p && g[c] === p) return [a, b, c];
  return null;
}
function randomMove() {
  const e = emptyOf(grid);
  return e[Math.floor(Math.random() * e.length)];
}
function smartMove() {
  const e = emptyOf(grid);
  for (const m of e) {
    const t = grid.slice();
    t[m] = "O";
    if (findWin(t, "O")) return m;
  } // gana
  for (const m of e) {
    const t = grid.slice();
    t[m] = "X";
    if (findWin(t, "X")) return m;
  } // bloquea
  const open = e.filter((i) => grid[i] === null);
  const pool = open.length ? open : e;
  const order = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter((i) => pool.includes(i));
  return order[0];
}
function minimax(g, cur, depth, alpha, beta) {
  const w = findWin(g, "O");
  if (w) return { s: 10 - depth, l: w };
  const l = findWin(g, "X");
  if (l) return { s: -10 + depth, l };
  const e = emptyOf(g);
  if (!e.length) return { s: 0, l: null };
  let best = null;
  for (const m of e) {
    g[m] = cur;
    const r = minimax(g, cur === "O" ? "X" : "O", depth + 1, alpha, beta);
    g[m] = null;
    r.s += cur === "O" ? 0.001 : -0.001; // desempate: el gato decide
    if (!best || (cur === "O" ? r.s > best.s : r.s < best.s))
      best = { s: r.s, l: m };
    if (cur === "O") beta = Math.max(beta, r.s);
    else alpha = Math.min(alpha, r.s);
    if (beta <= alpha) break;
  }
  return best;
}
function bestMove() {
  const e = emptyOf(grid);
  if (e.length === 9) return Math.random() < 0.72 ? 4 : randomMove(); // el gato abre por el centro
  const r = minimax(grid.slice(), "X", 0, -Infinity, Infinity);
  return r.l != null ? r.l : randomMove();
}

/* ═════════ flujo de juego ═════════ */
function renderBoard() {
  cellsEl.innerHTML = "";
  grid.forEach((v, i) => {
    const b = document.createElement("button");
    b.className = "cell" + (v ? " " + v.toLowerCase() : " empty");
    b.dataset.i = i;
    b.setAttribute("aria-label", "casilla " + (i + 1));
    if (v) {
      const m = document.createElement("div");
      m.className = "mark " + v.toLowerCase();
      const svg = MARKS[v];
      m.innerHTML = svg;
      svg.querySelectorAll(".st").forEach((p) => {
        const L = p.getTotalLength();
        p.style.setProperty("--L", L.toFixed(1));
      });
      b.appendChild(m);
    } else {
      const g = document.createElement("div");
      g.className = "ghost";
      g.innerHTML = MARKS.X;
      g.querySelectorAll(".st").forEach((p) => p.style.removeProperty("--L"));
      b.appendChild(g);
      b.addEventListener("click", () => onPlayerMove(i));
    }
    cellsEl.appendChild(b);
  });
}
function onPlayerMove(i) {
  if (over || turn !== "X" || grid[i]) return;
  clearTimeout(aiTimer);
  grid[i] = "X";
  placeMark(i, "X");
  sfx.place("X");
  const w = findWin(grid, "X");
  if (w) return finish("you", w);
  if (!emptyOf(grid).length) return finish("tie", null);
  turn = "O";
  catEl.dataset.mood = "think";
  board.classList.remove("play");
  board.classList.add("lock");
  setStatus("think");
  aiTimer = setTimeout(aiMove, 520 + Math.random() * 480);
}
function aiMove() {
  if (over || turn !== "O") return;
  const m =
    diff === "easy"
      ? randomMove()
      : diff === "normal"
        ? smartMove()
        : bestMove();
  if (m == null) return finish("tie", null);
  grid[m] = "O";
  placeMark(m, "O");
  sfx.place("O");
  const w = findWin(grid, "O");
  if (w) return finish("cat", w);
  if (!emptyOf(grid).length) return finish("tie", null);
  turn = "X";
  catEl.dataset.mood = "neutral";
  board.classList.add("play");
  board.classList.remove("lock");
  setStatus("turn");
}
function placeMark(i, p) {
  const c = cellsEl.children[i];
  c.classList.remove("empty");
  c.classList.add(p === "X" ? "x" : "o");
  c.querySelector(".ghost")?.remove();
  const m = document.createElement("div");
  m.className = "mark " + (p === "X" ? "x" : "o");
  m.innerHTML = MARKS[p];
  m.querySelectorAll(".st").forEach((s) => {
    const L = s.getTotalLength();
    s.style.setProperty("--L", L.toFixed(1));
  });
  c.appendChild(m);
  const r = c.getBoundingClientRect();
  burst(
    r.left + r.width / 2,
    r.top + r.height / 2,
    p === "X" ? "#ff7d6e" : "#85d1ff",
  );
}
function finish(who, cellsWin) {
  over = true;
  turn = null;
  clearTimeout(aiTimer);
  board.classList.remove("play", "lock");
  catEl.dataset.mood = who === "you" ? "sad" : who === "cat" ? "happy" : "draw";
  if (who === "you") {
    score.you++;
    streak++;
    sfx.win();
  } else if (who === "cat") {
    score.cat++;
    streak = 0;
    sfx.lose();
    board.classList.add("shake");
    setTimeout(() => board.classList.remove("shake"), 450);
  } else {
    score.tie++;
    streak = 0;
    sfx.tie();
  }
  if (cellsWin) {
    drawWinLine(cellsWin);
    cellsWin.forEach((i) =>
      cellsEl.children[i].querySelector(".mark")?.classList.add("winner"),
    );
    cellsEl
      .querySelectorAll(".mark:not(.winner)")
      .forEach((m) => m.classList.add("dim"));
  }
  board.dataset.winner = who;
  statusEl.dataset.winner = who;
  statusEl.classList.add("done");
  setStatus(who);
  renderTallies();
  save();
}
function drawWinLine(w) {
  const c = (i) => [i % 3, Math.floor(i / 3)];
  const overhang = 0.3;
  const [a, , d] = w.map(c);
  const dx = d[0] - a[0],
    dy = d[1] - a[1],
    len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const sx = a[0] - ux * overhang,
    sy = a[1] - uy * overhang;
  const ex = d[0] + ux * overhang,
    ey = d[1] + uy * overhang;
  const P = (u, v) => [50 + u * 100, 50 + v * 100];
  const [x1, y1] = P(sx, sy),
    [x2, y2] = P(ex, ey);
  winlineSvg.style.display = "block";
  const L = Math.hypot(x2 - x1, y2 - y1).toFixed(1);
  winlineSvg.innerHTML = `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--len:${L}"/>`;
}
const STATUS = {
  you: { m: "¡Ganaste! 🎉", sub: "El gato frota el tablero…" },
  cat: { m: "Gana el gato", sub: "Te lo prometimos: invencible" },
  tie: { m: "Empate", sub: "Ninguno cede" },
  think: { m: "El gato piensa…", sub: "…" },
  turn: { m: "Tu jugada", sub: "El gato jugó su O" },
  start: { m: "Tu jugada", sub: "Eres la X — el gato juega la O" },
};
function setStatus(key) {
  const s = STATUS[key];
  statusMsg.textContent = s.m;
  statusSub.textContent = s.sub;
  statusMsg.classList.remove("msg");
  void statusMsg.offsetWidth; // reinicia animación
}

/* ═════════ marcador ═════════ */
function tallyHTML(n, ref) {
  let h = "";
  const groups = Math.floor(n / 5),
    left = n % 5;
  const groupsDraw = Math.min(groups, 1);
  const leftDraw = Math.min(left, 5);
  const shown = Math.min(n, groupsDraw * 5 + leftDraw);
  for (let i = 0; i < shown; i++) {
    const g = Math.floor(i / 5),
      p = i % 5,
      last = i === shown - 1;
    if (p < 4)
      h += `<span class="stk${last ? " pop" : ""}" style="--r:${(rand(i * 3 + ref) * 8 - 4).toFixed(1)}deg"></span>`;
    else h += `<span class="stk hit${last ? " pop" : ""}"></span>`;
  }
  return h;
}
function renderTallies() {
  numYou.textContent = score.you;
  numCat.textContent = score.cat;
  numTie.textContent = score.tie;
  mkYou.innerHTML = tallyHTML(score.you, 1);
  mkCat.innerHTML = tallyHTML(score.cat, 7);
  mkTie.innerHTML = tallyHTML(score.tie, 13);
  roundEl.textContent = "Ronda " + round;
  streakEl.textContent = streak >= 2 ? `Racha: ${streak} 🔥` : "";
}

/* ═════════ acciones ═════════ */
function newRound() {
  clearTimeout(aiTimer);
  grid = Array(9).fill(null);
  over = false;
  turn = "X";
  round++;
  winlineSvg.style.display = "none";
  winlineSvg.innerHTML = "";
  board.dataset.winner = "";
  board.classList.add("play");
  board.classList.remove("lock", "shake");
  statusEl.classList.remove("done");
  catEl.dataset.mood = "neutral";
  renderBoard();
  setStatus("start");
  renderTallies();
  save();
}
function newGame(d) {
  diff = d;
  score = { you: 0, cat: 0, tie: 0 };
  round = 1;
  streak = 0;
  document
    .querySelectorAll(".diff")
    .forEach((b) => b.classList.toggle("active", b.dataset.diff === d));
  sfx.ui();
  newRound();
}
document
  .querySelectorAll(".diff")
  .forEach((b) => b.addEventListener("click", () => newGame(b.dataset.diff)));
btnNew.addEventListener("click", () => {
  sfx.ui();
  newRound();
});
btnMenu.addEventListener("click", () => {
  sfx.ui();
  window.location.href = "../index.html";
});
btnNext.addEventListener("click", () => {
  sfx.ui();
  newRound();
});
btnReset.addEventListener("click", () => {
  if (confirm("¿Borrar marcador y empezar de cero?")) {
    sfx.ui();
    newGame(diff);
  }
});
btnMute.addEventListener("click", toggleMute);
function toggleMute() {
  soundOn = !soundOn;
  btnMute.classList.toggle("off", !soundOn);
  btnMute.textContent = soundOn ? "Sonido" : "Silencio";
  save();
  if (soundOn) sfx.ui();
}
btnMute.textContent = soundOn ? "Sonido" : "Silencio";
btnMute.classList.toggle("off", !soundOn);

document.addEventListener("keydown", (e) => {
  if (e.key === "n" || e.key === "N") {
    sfx.ui();
    newRound();
  } else if (e.key === "m" || e.key === "M") {
    toggleMute();
  } else if (e.key === "b" || e.key === "B") {
    if (confirm("¿Borrar marcador?")) {
      sfx.ui();
      newGame(diff);
    }
  } else if (e.key >= "1" && e.key <= "9") {
    if (over || turn !== "X") return;
    const i = +e.key - 1;
    const c = cellsEl.children[i];
    c.classList.contains("empty") && onPlayerMove(i);
  }
});

/* ═════════ polvo de tiza ═════════ */
const cv = $("#dust"),
  ctx = cv.getContext("2d");
let W,
  H,
  parts = [],
  bursts = [],
  running = true;
function sizeCanvas() {
  W = cv.width = innerWidth;
  H = cv.height = innerHeight;
}
addEventListener("resize", sizeCanvas);
sizeCanvas();
for (let i = 0; i < 42; i++)
  parts.push({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: 0.6 + Math.random() * 1.9,
    vx: (Math.random() - 0.5) * 0.14,
    vy: -0.05 - Math.random() * 0.18,
    a: 0.04 + Math.random() * 0.09,
  });
function burst(x, y, col) {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2,
      sp = 0.6 + Math.random() * 2.4;
    bursts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 0.5,
      life: 1,
      col,
      r: 0.8 + Math.random() * 1.8,
    });
  }
}
function loop() {
  ctx.clearRect(0, 0, W, H);
  for (const p of parts) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -6) {
      p.y = H + 6;
      p.x = Math.random() * W;
    }
    if (p.x < -6) p.x = W + 6;
    if (p.x > W + 6) p.x = -6;
    ctx.globalAlpha = p.a;
    ctx.fillStyle = "#f2ecdd";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fill();
  }
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.05;
    b.life -= 0.022;
    if (b.life <= 0) {
      bursts.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = b.life * 0.8;
    ctx.fillStyle = b.col;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 7);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(loop);
}
document.addEventListener("visibilitychange", () => {
  running = !document.hidden;
  if (running) loop();
  else cancelAnimationFrame(rafId);
});
let rafId = requestAnimationFrame(loop);

/* ═════════ arranque ═════════ */
buildGrid();
document
  .querySelectorAll(".diff")
  .forEach((b) => b.classList.toggle("active", b.dataset.diff === diff));
grid = Array(9).fill(null);
renderBoard();
setStatus("start");
renderTallies();
save();
