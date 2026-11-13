/**
 * DomRendererAdapter — implements RendererPort.
 * Chalk grid, SVG marks, status line, tallies and the cat face, all in the DOM.
 * Dust bursts on placement are delegated to the injected `effects` adapter.
 */
const DomRendererAdapter = {
  effects: null,
  els: null,

  statusTexts: {
    you: { m: "¡Ganaste! 🎉", sub: "El gato frota el tablero…" },
    cat: { m: "Gana el gato", sub: "Te lo prometimos: invencible" },
    tie: { m: "Empate", sub: "Ninguno cede" },
    think: { m: "El gato piensa…", sub: "…" },
    turn: { m: "Tu jugada", sub: "El gato jugó su O" },
    start: { m: "Tu jugada", sub: "Eres la X — el gato juega la O" },
  },

  marks: {
    X: `<svg viewBox="0 0 100 100"><path class="st d1" d="M22 24 L78 76"/><path class="st d2" d="M77 23 L23 78"/></svg>`,
    O: `<svg viewBox="0 0 100 100"><path class="st d1" d="M50 21 C 73 21 79 38 78 52 C 77 70 63 79 49 78 C 32 77 22 63 23 48 C 24 31 34 21 50 21"/></svg>`,
  },

  init({ effects }) {
    this.effects = effects;
    this.els = {
      board: document.getElementById("board"),
      cells: document.getElementById("cells"),
      grid: document.getElementById("gridSvg"),
      winline: document.getElementById("winline"),
      status: document.getElementById("status"),
      statusMsg: document.getElementById("statusMsg"),
      statusSub: document.getElementById("statusSub"),
      cat: document.getElementById("cat"),
      numYou: document.getElementById("numYou"),
      numCat: document.getElementById("numCat"),
      numTie: document.getElementById("numTie"),
      mkYou: document.getElementById("mkYou"),
      mkCat: document.getElementById("mkCat"),
      mkTie: document.getElementById("mkTie"),
      round: document.getElementById("round"),
      streak: document.getElementById("streak"),
      btnMute: document.getElementById("btnMute"),
      diffButtons: document.querySelectorAll(".diff"),
    };
    this.buildGrid();
  },

  buildGrid() {
    const segments = [
      [100, 6, 100, 294],
      [200, 6, 200, 294],
      [6, 100, 294, 100],
      [6, 200, 294, 200],
    ];
    this.els.grid.innerHTML = segments
      .map((p, i) => `<path d="${this.wobble(p[0], p[1], p[2], p[3], i + 1)}"/>`)
      .join("");
  },

  renderBoard(cells) {
    const { cells: container, board } = this.els;
    container.innerHTML = "";
    board.classList.remove("shake");
    cells.forEach((value, index) => {
      const button = document.createElement("button");
      button.className = "cell" + (value ? " " + value.toLowerCase() : " empty");
      button.dataset.i = index;
      button.setAttribute("aria-label", "casilla " + (index + 1));
      if (value) {
        button.appendChild(this.createMark(value));
      } else {
        const ghost = document.createElement("div");
        ghost.className = "ghost";
        ghost.innerHTML = this.marks.X;
        ghost.querySelectorAll(".st").forEach((p) => p.style.removeProperty("--L"));
        button.appendChild(ghost);
      }
      container.appendChild(button);
    });
  },

  placeMark(index, who) {
    const cell = this.els.cells.children[index];
    cell.classList.remove("empty");
    cell.classList.add(who === "X" ? "x" : "o");
    cell.querySelector(".ghost")?.remove();
    cell.appendChild(this.createMark(who));
    const r = cell.getBoundingClientRect();
    this.effects?.burst(r.left + r.width / 2, r.top + r.height / 2, who === "X" ? "#ff7d6e" : "#85d1ff");
  },

  createMark(who) {
    const mark = document.createElement("div");
    mark.className = "mark " + (who === "X" ? "x" : "o");
    mark.innerHTML = this.marks[who];
    // Stroke lengths drive the chalk draw-on animation; measured before the mark is inserted.
    mark.querySelectorAll(".st").forEach((s) => {
      s.style.setProperty("--L", s.getTotalLength().toFixed(1));
    });
    return mark;
  },

  setBoardState(state) {
    const { classList } = this.els.board;
    if (state === "play") {
      classList.add("play");
      classList.remove("lock");
    } else if (state === "lock") {
      classList.remove("play");
      classList.add("lock");
    } else {
      classList.remove("play", "lock");
    }
  },

  setMood(mood) {
    this.els.cat.dataset.mood = mood;
  },

  setStatus(key) {
    const text = this.statusTexts[key];
    const { statusMsg, statusSub } = this.els;
    statusMsg.textContent = text.m;
    statusSub.textContent = text.sub;
    // Restart the message animation. The "msg" class carries the pop-in and the winner colour,
    // so it has to be put back after the reflow (the old code left it removed).
    statusMsg.classList.remove("msg");
    void statusMsg.offsetWidth;
    statusMsg.classList.add("msg");
  },

  setResult(who) {
    const { board, status } = this.els;
    board.dataset.winner = who || "";
    status.dataset.winner = who || "";
    status.classList.toggle("done", Boolean(who));
  },

  highlightWin(line) {
    this.drawWinLine(line);
    line.forEach((index) => {
      this.els.cells.children[index].querySelector(".mark")?.classList.add("winner");
    });
    this.els.cells.querySelectorAll(".mark:not(.winner)").forEach((mark) => mark.classList.add("dim"));
  },

  drawWinLine(line) {
    const coord = (i) => [i % 3, Math.floor(i / 3)];
    const overhang = 0.3;
    const [a, , d] = line.map(coord);
    const dx = d[0] - a[0];
    const dy = d[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const sx = a[0] - ux * overhang;
    const sy = a[1] - uy * overhang;
    const ex = d[0] + ux * overhang;
    const ey = d[1] + uy * overhang;
    const P = (u, v) => [50 + u * 100, 50 + v * 100];
    const [x1, y1] = P(sx, sy);
    const [x2, y2] = P(ex, ey);
    const L = Math.hypot(x2 - x1, y2 - y1).toFixed(1);
    this.els.winline.style.display = "block";
    this.els.winline.innerHTML = `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--len:${L}"/>`;
  },

  clearWinLine() {
    this.els.winline.style.display = "none";
    this.els.winline.innerHTML = "";
  },

  shakeBoard() {
    const { board } = this.els;
    board.classList.add("shake");
    setTimeout(() => board.classList.remove("shake"), 450);
  },

  renderTallies({ score, round, streak }) {
    const e = this.els;
    e.numYou.textContent = score.you;
    e.numCat.textContent = score.cat;
    e.numTie.textContent = score.tie;
    e.mkYou.innerHTML = this.tallyHTML(score.you, 1);
    e.mkCat.innerHTML = this.tallyHTML(score.cat, 7);
    e.mkTie.innerHTML = this.tallyHTML(score.tie, 13);
    e.round.textContent = "Ronda " + round;
    e.streak.textContent = streak >= 2 ? `Racha: ${streak} 🔥` : "";
  },

  setDifficulty(difficulty) {
    this.els.diffButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.diff === difficulty);
    });
  },

  setSoundButton(on) {
    const { btnMute } = this.els;
    btnMute.textContent = on ? "🔊" : "🔇";
    btnMute.setAttribute("aria-pressed", String(!on));
    btnMute.classList.toggle("off", !on);
  },

  tallyHTML(n, ref) {
    let h = "";
    const groups = Math.floor(n / 5);
    const left = n % 5;
    const groupsDraw = Math.min(groups, 1);
    const leftDraw = Math.min(left, 5);
    const shown = Math.min(n, groupsDraw * 5 + leftDraw);
    for (let i = 0; i < shown; i++) {
      const p = i % 5;
      const last = i === shown - 1;
      if (p < 4) {
        h += `<span class="stk${last ? " pop" : ""}" style="--r:${(this.rand(i * 3 + ref) * 8 - 4).toFixed(1)}deg"></span>`;
      } else {
        h += `<span class="stk hit${last ? " pop" : ""}"></span>`;
      }
    }
    return h;
  },

  wobble(x1, y1, x2, y2, seed) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const a = (this.rand(seed * 7 + 1) - 0.5) * 7;
    const b = (this.rand(seed * 13 + 2) - 0.5) * 7;
    return `M ${x1} ${y1} Q ${((x1 + x2) / 2 + nx * a).toFixed(1)} ${((y1 + y2) / 2 + ny * a).toFixed(1)} ${(x1 + x2) / 2 + nx * b * 0.6} ${(y1 + y2) / 2 + ny * b * 0.6} T ${x2} ${y2}`;
  },

  rand(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  },
};
