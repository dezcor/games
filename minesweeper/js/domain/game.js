/**
 * Minesweeper Game — pure domain state machine.
 * Receives ports (repository, renderer, input, sound, clock) by injection.
 * No DOM, no localStorage, no audio directly.
 */

function sanitizePlayerName(value) {
    if (typeof value !== 'string') return 'Player';
    const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 12);
    return name || 'Player';
}

function normalizeHighScores(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter((entry) => entry && Number.isFinite(Number(entry.score)))
        .map((entry) => ({
            score: Math.max(0, Math.floor(Number(entry.score))),
            name: sanitizePlayerName(entry.name),
            date: typeof entry.date === 'string' ? entry.date.slice(0, 40) : '',
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

class Game {
    constructor(config, ports) {
        this.config = config;
        this.repository = ports.repository;
        this.renderer = ports.renderer;
        this.input = ports.input;
        this.sound = ports.sound;
        this.clock = ports.clock;

        this.state = 'IDLE';
        this.difficulty = config.difficulty || DEFAULT_DIFFICULTY;
        this.board = null;
        this.score = 0;
        this.time = 0;
        this.playerName = 'Player';
        this.highScores = [];
        this.firstClick = true;
        this.previousBest = 0;
    }

    // ── Load persisted state ──
    init() {
        this.highScores = this.repository.loadHighScores();
        this.playerName = this.repository.loadPlayerName();
        const savedDiff = this.repository.loadDifficulty();
        if (savedDiff && DIFFICULTY_PRESETS[savedDiff]) {
            this.difficulty = savedDiff;
        }
        this.previousBest = this.highScores[0]?.score || 0;
    }

    // ── Start a new game ──
    start(difficulty) {
        if (difficulty && DIFFICULTY_PRESETS[difficulty]) {
            this.difficulty = difficulty;
            this.repository.saveDifficulty(difficulty);
        }
        const preset = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        this.config = preset;
        this.board = new Board(preset.cols, preset.rows, preset.mines);
        this.state = 'PLAYING';
        this.score = 0;
        this.time = 0;
        this.firstClick = true;
        this.previousBest = this.highScores[0]?.score || 0;

        this.clock.reset();
        this.clock.start((seconds) => {
            this.time = seconds;
            this.renderer.drawTimer(seconds);
        });

        this.sound.playClick();
        this.sound.startBgm();
        this.renderer.showOverlay('none');
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
    }

    // ── Cell interactions ──
    onCellClick(r, c) {
        if (this.state !== 'PLAYING' || !this.board) return;
        if (!this.board.minesPlaced) {
            this.board.placeMines(r, c);
            this.firstClick = false;
        }
        const cell = this.board.cells[r][c];
        if (cell.flagged || cell.revealed) return;

        const hitMine = this.board.reveal(r, c);
        if (hitMine) {
            this.onLose();
            return;
        }
        this.score += SCORE_PER_REVEAL;
        if (this.board.isWin()) {
            this.onWin();
            return;
        }
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
    }

    onCellFlag(r, c) {
        if (this.state !== 'PLAYING' || !this.board) return;
        if (!this.board.minesPlaced) return;
        const cell = this.board.cells[r][c];
        if (cell.revealed) return;

        const flagged = this.board.flag(r, c);
        if (flagged) {
            this.score += SCORE_PER_FLAG;
            this.sound.playFlag();
        } else {
            this.score = Math.max(0, this.score - SCORE_PER_FLAG);
            this.sound.playClick();
        }
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
    }

    onChord(r, c) {
        if (this.state !== 'PLAYING' || !this.board) return;
        const hitMine = this.board.chord(r, c);
        if (hitMine) {
            this.onLose();
            return;
        }
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
    }

    // ── Pause / Resume ──
    pause() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.clock.stop();
        this.sound.pauseBgm();
        this.renderer.showOverlay('pause');
    }

    resume() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.clock.start((seconds) => {
            this.time = seconds;
            this.renderer.drawTimer(seconds);
        });
        this.sound.resumeBgm();
        this.renderer.showOverlay('none');
    }

    togglePause() {
        if (this.state === 'PLAYING') this.pause();
        else if (this.state === 'PAUSED') this.resume();
    }

    restart() {
        this.start(this.difficulty);
    }

    // ── Win / Lose ──
    onWin() {
        this.state = 'WON';
        this.clock.stop();
        this.board.flagAllMines();
        this.score += WIN_BONUS;
        this.sound.stopBgm();
        this.sound.playWin();
        this.saveHighScore();
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
        this.renderer.showOverlay('won');
    }

    onLose() {
        this.state = 'LOST';
        this.clock.stop();
        this.board.revealAllMines();
        this.sound.stopBgm();
        this.sound.playExplosion();
        this.sound.playGameOver();
        this.saveHighScore();
        this.renderer.beginFrame();
        this.renderer.drawHud(this);
        this.renderer.showOverlay('lost');
    }

    // ── High score persistence ──
    saveHighScore() {
        const qualifies = this.score > 0 && (
            this.highScores.length < 5 ||
            this.score >= this.highScores[this.highScores.length - 1].score
        );
        if (!qualifies) return;

        const previousBest = this.highScores[0]?.score || 0;
        this.highScores = normalizeHighScores([...this.highScores, {
            score: this.score,
            name: sanitizePlayerName(this.playerName),
            date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }),
        }]);
        this.repository.saveHighScores(this.highScores);

        if (this.score > previousBest) {
            this.sound.playNewHighScore();
            this.renderer.showNewHighScoreNotice();
        }
    }

    setPlayerName(name) {
        this.playerName = sanitizePlayerName(name);
        this.repository.savePlayerName(this.playerName);
    }

    getMedalClass(name, score) {
        if (name === 'Player' && score === 0) return '';
        if (score >= 1000) return 'hs-gold';
        if (score >= 500) return 'hs-silver';
        if (score >= 200) return 'hs-bronze';
        return '';
    }

    minesRemaining() {
        if (!this.board) return this.config.mines;
        return this.config.mines - this.board.countFlags();
    }
}
