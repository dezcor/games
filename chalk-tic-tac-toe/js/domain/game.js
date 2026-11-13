/**
 * CatGame — pure domain state machine for El Gato (tris de tiza).
 * Receives ports (repository, renderer, sound, timer) by injection.
 * No DOM, no localStorage, no audio directly.
 */
class CatGame {
  constructor(config, ports) {
    this.aiDelayMin = config.aiDelayMin;
    this.aiDelayJitter = config.aiDelayJitter;
    this.repository = ports.repository;
    this.renderer = ports.renderer;
    this.sound = ports.sound;
    this.timer = ports.timer;

    this.cells = Board.create();
    this.turn = null; // "X" (player), "O" (cat), or null once the round is over
    this.over = false;
    this.difficulty = DEFAULT_DIFFICULTY;
    this.score = { you: 0, cat: 0, tie: 0 };
    this.round = 1;
    this.streak = 0;
    this.soundOn = true;
  }

  static normalizeCount(value) {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  // ── Load saved preferences and show the first round ──
  init() {
    const saved = this.repository.load() || {};
    this.difficulty = DIFFICULTIES.includes(saved.diff) ? saved.diff : DEFAULT_DIFFICULTY;
    this.score = {
      you: CatGame.normalizeCount(saved.score?.you),
      cat: CatGame.normalizeCount(saved.score?.cat),
      tie: CatGame.normalizeCount(saved.score?.tie),
    };
    this.round = Math.max(1, CatGame.normalizeCount(saved.round));
    this.soundOn = saved.soundOn !== false;

    this.sound.setEnabled(this.soundOn);
    this.renderer.setDifficulty(this.difficulty);
    this.renderer.setSoundButton(this.soundOn);
    this.startRound();
  }

  // ── Fresh board for the current round; X moves first ──
  startRound() {
    this.timer.cancel();
    this.cells = Board.create();
    this.turn = "X";
    this.over = false;
    this.renderer.renderBoard(this.cells);
    this.renderer.clearWinLine();
    this.renderer.setResult(null);
    this.renderer.setBoardState("play");
    this.renderer.setMood("neutral");
    this.renderer.setStatus("start");
    this.renderTallies();
    this.persist();
  }

  // ── Commands ──
  newRound() {
    this.sound.ui();
    this.round++;
    this.startRound();
  }

  newGame(difficulty) {
    if (!DIFFICULTIES.includes(difficulty)) return;
    this.sound.ui();
    this.difficulty = difficulty;
    this.score = { you: 0, cat: 0, tie: 0 };
    this.round = 1;
    this.streak = 0;
    this.renderer.setDifficulty(difficulty);
    this.startRound();
  }

  toggleSound() {
    this.soundOn = !this.soundOn;
    this.sound.setEnabled(this.soundOn);
    this.renderer.setSoundButton(this.soundOn);
    this.persist();
    if (this.soundOn) this.sound.ui();
  }

  // ── Player move (X). Ignored when the round is over, it is not X's turn, or the cell is taken. ──
  playerMove(index) {
    if (this.over || this.turn !== "X" || this.cells[index] !== null) return;
    this.timer.cancel();
    this.cells[index] = "X";
    this.renderer.placeMark(index, "X");
    this.sound.place("X");

    const line = Board.findWin(this.cells, "X");
    if (line) return this.finish("you", line);
    if (Board.isFull(this.cells)) return this.finish("tie", null);

    this.turn = "O";
    this.renderer.setMood("think");
    this.renderer.setBoardState("lock");
    this.renderer.setStatus("think");
    const delay = this.aiDelayMin + Math.random() * this.aiDelayJitter;
    this.timer.schedule(() => this.catMove(), delay);
  }

  // ── Cat move (O), scheduled by the timer port after the player moves ──
  catMove() {
    if (this.over || this.turn !== "O") return;
    const index = AI.chooseMove(this.cells, this.difficulty);
    if (index == null) return this.finish("tie", null);
    this.cells[index] = "O";
    this.renderer.placeMark(index, "O");
    this.sound.place("O");

    const line = Board.findWin(this.cells, "O");
    if (line) return this.finish("cat", line);
    if (Board.isFull(this.cells)) return this.finish("tie", null);

    this.turn = "X";
    this.renderer.setMood("neutral");
    this.renderer.setBoardState("play");
    this.renderer.setStatus("turn");
  }

  // ── Round result: who is "you" | "cat" | "tie", and the winning line if any ──
  finish(who, line) {
    this.over = true;
    this.turn = null;
    this.timer.cancel();
    this.renderer.setBoardState("end");
    this.renderer.setMood(who === "you" ? "sad" : who === "cat" ? "happy" : "draw");

    if (who === "you") {
      this.score.you++;
      this.streak++;
      this.sound.win();
    } else if (who === "cat") {
      this.score.cat++;
      this.streak = 0;
      this.sound.lose();
      this.renderer.shakeBoard();
    } else {
      this.score.tie++;
      this.streak = 0;
      this.sound.tie();
    }

    if (line) this.renderer.highlightWin(line);
    this.renderer.setResult(who);
    this.renderer.setStatus(who);
    this.renderTallies();
    this.persist();
  }

  renderTallies() {
    this.renderer.renderTallies({ score: this.score, round: this.round, streak: this.streak });
  }

  persist() {
    this.repository.save({
      diff: this.difficulty,
      score: { ...this.score },
      round: this.round,
      soundOn: this.soundOn,
    });
  }
}
