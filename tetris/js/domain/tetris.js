/**
 * TetrisGame — pure domain state machine.
 * Receives ports by injection (repository, renderer, input, sound, clock, random).
 * No DOM, no localStorage, no audio, no time sources directly.
 *
 * Port usage:
 *   input.isHeld(code)        held-key state for DAS
 *   renderer.*                HUD, overlays, notices, drawing (receives a view snapshot)
 *   repository.*              high scores and player name
 *   sound.*                   SFX and BGM
 *   clock.start(cb)           frame loop (cb runs once per frame)
 *   clock.today()             date label for high score entries
 *   random.next()             [0, 1) randomness for pieces and easter egg phrases
 */

class TetrisGame {
    constructor(ports) {
        this.repository = ports.repository;
        this.renderer = ports.renderer;
        this.input = ports.input;
        this.sound = ports.sound;
        this.clock = ports.clock;
        this.random = ports.random;

        this.grid = Board.createGrid();
        this.player = {
            pos: { x: 0, y: 0 },
            currentPos: { x: 0, y: 0 },
            matrix: null,
            score: 0,
            level: 1,
            linesCleared: 0,
            oldMatrix: null,
            rotationProgress: 0,
        };
        this.nextMatrix = null;
        this.rowsToClear = [];
        this.gravityTimer = 0;
        this.lastClearWasTetris = false;
        this.das = new DelayedAutoShift();
        this.rotationQueue = [];
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.previousBestScore = 0;
    }

    // ── Setup ──

    init() {
        this.player.matrix = this.spawnPiece();
        this.previousBestScore = this.bestScore();
        this.refreshBest();
        this.renderer.setOverlayVisible(true);
        this.renderer.setOverlayTitle('TETRIS');
        this.renderer.setStartButtonVisible(true);
    }

    /** Starts the frame loop (runs for the lifetime of the page). */
    start() {
        this.clock.start(() => this.frame());
    }

    // ── Queries used by the input adapters ──

    isStarted() {
        return this.gameStarted;
    }

    isGameOver() {
        return this.gameOver;
    }

    canPlay() {
        return !this.isPaused && !this.gameOver;
    }

    refreshNorthTheme() {
        this.renderer.setNorthTheme(HighScores.isNorthName(this.renderer.getPlayerName()));
    }

    // ── Commands ──

    startGame() {
        this.gameStarted = true;
        this.isPaused = false;
        this.renderer.setOverlayVisible(false);
        this.renderer.setStartButtonVisible(false);
        this.sound.startBgm();
    }

    togglePause() {
        if (!this.gameStarted) return;
        this.isPaused = !this.isPaused;
        this.renderer.setOverlayVisible(this.isPaused);
        this.renderer.setStartButtonVisible(false);
        if (this.isPaused) {
            this.sound.pauseBgm();
        } else {
            this.sound.resumeBgm();
        }
    }

    restart() {
        if (!this.gameStarted) return;
        const p = this.player;
        Board.clear(this.grid);
        p.score = 0;
        p.level = 1;
        p.linesCleared = 0;
        p.matrix = this.spawnPiece();
        this.gameOver = false;
        this.isPaused = false;
        this.das.reset();
        this.rotationQueue = [];
        this.rowsToClear = [];
        this.lastClearWasTetris = false;
        this.previousBestScore = this.bestScore();

        this.renderer.setOverlayVisible(false);
        this.renderer.setOverlayTitle('PAUSE');
        this.renderer.hideHighScores();
        this.refreshBest();

        this.sound.startBgm();
    }

    queueRotation() {
        if (this.rotationQueue.length < MAX_ROTATION_QUEUE) {
            this.rotationQueue.push({ type: 'rotate', dir: 1 });
        }
    }

    /** Drops the piece to its landing row and locks it. */
    hardDrop() {
        const p = this.player;
        while (!Board.collides(this.grid, p.matrix, p.pos)) {
            p.pos.y++;
        }
        p.pos.y--;
        Board.merge(this.grid, p.matrix, p.pos);
        this.clearLines();
        this.scoreUpdate();
        this.sound.playHardDrop();
        p.matrix = this.spawnPiece();
        p.currentPos.x = p.pos.x;
        p.currentPos.y = p.pos.y;
        if (Board.collides(this.grid, p.matrix, p.pos)) {
            this.handleGameOver();
        }
    }

    // ── Frame loop ──

    frame() {
        this.handleInput();
        this.easePiece();
        this.advanceRotation();
        if (!this.isPaused && !this.gameOver) {
            this.applyGravity();
        }
        this.advanceClearingRows();
        this.render();
    }

    handleInput() {
        if (this.isPaused || this.gameOver) return;

        this.das.update('left', this.input.isHeld(HELD_KEYS.left), () => this.movePlayer(-1, 0));
        this.das.update('right', this.input.isHeld(HELD_KEYS.right), () => this.movePlayer(1, 0));
        this.das.update('down', this.input.isHeld(HELD_KEYS.down), () => this.movePlayer(0, 1));

        if (this.rotationQueue.length > 0) {
            const event = this.rotationQueue.shift();
            if (event.type === 'rotate') {
                this.playerRotate(event.dir);
            }
        }
    }

    /** Glides the drawn position towards the logical position. */
    easePiece() {
        const p = this.player;
        p.currentPos.x = this.lerp(p.currentPos.x, p.pos.x, ANIMATION_SPEED);
        p.currentPos.y = this.lerp(p.currentPos.y, p.pos.y, ANIMATION_SPEED);
    }

    advanceRotation() {
        const p = this.player;
        if (p.rotationProgress > 0) {
            p.rotationProgress -= ROTATION_STEP;
            if (p.rotationProgress < 0) {
                p.rotationProgress = 0;
                p.oldMatrix = null;
            }
        }
    }

    applyGravity() {
        this.gravityTimer++;
        if (this.gravityTimer < this.gravityInterval()) return;

        this.gravityTimer = 0;
        const p = this.player;
        if (!Board.collides(this.grid, p.matrix, { x: p.pos.x, y: p.pos.y + 1 })) {
            p.pos.y++;
        } else {
            Board.merge(this.grid, p.matrix, p.pos);
            this.clearLines();
            this.scoreUpdate();
            this.spawnNextAfterLock();
        }
    }

    advanceClearingRows() {
        this.rowsToClear.forEach((row) => {
            row.alpha -= ROW_FADE_STEP;
        });
        this.rowsToClear = this.rowsToClear.filter((row) => row.alpha > 0);
    }

    /** Builds the view snapshot and hands it to the renderer. */
    render() {
        const p = this.player;
        const ghostPos = { ...p.pos };
        while (!Board.collides(this.grid, p.matrix, ghostPos)) {
            ghostPos.y++;
        }
        ghostPos.y--;

        const rotating = p.rotationProgress > 0 && p.oldMatrix;
        this.renderer.draw({
            grid: this.grid,
            clearingRows: this.rowsToClear,
            ghost: { matrix: p.matrix, pos: ghostPos },
            piece: {
                matrix: p.matrix,
                pos: p.currentPos,
                rotation: rotating ? { from: p.oldMatrix, progress: p.rotationProgress } : null,
            },
            next: this.nextMatrix,
        });
    }

    // ── Movement and rotation ──

    movePlayer(dx, dy) {
        if (this.gameOver || this.isPaused) return;
        const p = this.player;
        p.pos.x += dx;
        p.pos.y += dy;
        if (Board.collides(this.grid, p.matrix, p.pos)) {
            p.pos.x -= dx;
            p.pos.y -= dy;
            if (dy > 0) {
                Board.merge(this.grid, p.matrix, p.pos);
                this.clearLines();
                this.spawnNextAfterLock();
            }
        }
        this.scoreUpdate();
        if (dx !== 0) {
            this.sound.playMove();
        }
    }

    playerRotate(dir) {
        if (this.gameOver || this.isPaused) return;
        const p = this.player;

        // Snapshot for the rotation animation (kept even if the rotation fails).
        p.oldMatrix = p.matrix.map((row) => [...row]);
        p.rotationProgress = 1;

        const startX = p.pos.x;
        let offset = 1;
        Pieces.rotate(p.matrix, dir);
        while (Board.collides(this.grid, p.matrix, p.pos)) {
            p.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > p.matrix.length) {
                Pieces.rotate(p.matrix, -dir);
                p.pos.x = startX;
                return;
            }
        }
        p.currentPos.x = p.pos.x;
        this.sound.playRotate();
    }

    /** Places the next piece at the top centre. Game over when it cannot fit. */
    spawnNextAfterLock() {
        const p = this.player;
        p.pos.y = 0;
        p.currentPos.y = 0;
        p.matrix = this.nextMatrix;
        p.rotationProgress = 0;
        p.oldMatrix = null;
        this.nextMatrix = this.createPiece();
        p.pos.x = Math.floor((COLS - p.matrix[0].length) / 2);
        p.currentPos.x = p.pos.x;
        if (Board.collides(this.grid, p.matrix, p.pos)) {
            this.handleGameOver();
        }
    }

    spawnPiece() {
        const p = this.player;
        const matrix = this.nextMatrix || this.createPiece();
        this.nextMatrix = this.createPiece();
        p.pos.x = Math.floor((COLS - matrix[0].length) / 2);
        p.pos.y = 0;
        p.currentPos.x = p.pos.x;
        p.currentPos.y = p.pos.y;
        p.rotationProgress = 0;
        p.oldMatrix = null;
        return matrix;
    }

    createPiece() {
        return Pieces.createMatrix(Pieces.randomType(this.random));
    }

    // ── Line clears, scoring, game over ──

    clearLines() {
        const fullRows = Board.fullRows(this.grid);
        if (fullRows.length === 0) return;

        const p = this.player;
        const lines = fullRows.length;
        const isTetris = lines === 4;
        const isBackToBack = isTetris && this.lastClearWasTetris;
        const points = Scoring.linePoints(lines, p.level, isBackToBack);

        p.score += points;
        p.linesCleared += lines;
        p.level = Scoring.levelFor(p.linesCleared);
        this.lastClearWasTetris = isTetris;

        fullRows.forEach((y) => {
            this.rowsToClear.push({ y, alpha: 1.0 });
        });
        Board.removeRows(this.grid, fullRows);

        if (isTetris) {
            this.renderer.showComboBanner(isBackToBack ? 'BACK-TO-BACK TETRIS' : 'TETRIS', points);
        } else if (lines >= 2) {
            this.renderer.showComboBanner(lines === 2 ? 'DOUBLE' : 'TRIPLE', points);
        }

        if (p.score > this.previousBestScore) {
            this.previousBestScore = p.score;
            this.refreshBest();
            this.renderer.showNewHighScore(
                this.isNorth() ? this.pick(NORTHERN_RECORD_PHRASES) : 'NEW HIGH SCORE!'
            );
        }

        this.sound.playLineClear(lines);
    }

    handleGameOver() {
        this.gameOver = true;
        this.isPaused = true;
        this.das.reset();
        this.rotationQueue = [];

        this.renderer.setOverlayVisible(true);
        this.renderer.setStartButtonVisible(false);
        this.renderer.setOverlayTitle(
            this.isNorth() ? this.pick(NORTHERN_GAME_OVER_PHRASES) : 'GAME OVER'
        );

        this.refreshBest();
        this.saveHighScore(this.player.score);
        this.renderer.setHighScores(this.repository.loadHighScores());

        this.sound.playGameOver();
        this.sound.fadeOutBgm(0.8);
        this.renderer.alertGameOver();
    }

    saveHighScore(score) {
        const name = String(this.renderer.getPlayerName() || '').trim();
        const entry = {
            score: score,
            name: name || 'Anonymous',
            date: this.clock.today(),
        };
        const top = HighScores.insert(this.repository.loadHighScores(), entry);
        this.repository.saveHighScores(top);
    }

    // ── Helpers ──

    scoreUpdate() {
        this.renderer.updateHud(this.player.score, this.player.level);
        this.refreshBest();
    }

    bestScore() {
        return HighScores.best(this.repository.loadHighScores());
    }

    refreshBest() {
        this.renderer.setBestScore(this.bestScore());
    }

    isNorth() {
        return HighScores.isNorthName(this.renderer.getPlayerName());
    }

    pick(list) {
        return list[Math.floor(this.random.next() * list.length)];
    }

    gravityInterval() {
        const speeds = GRAVITY_SPEEDS;
        return speeds[Math.min(this.player.level - 1, speeds.length - 1)] || 5;
    }

    lerp(start, end, t) {
        return start + (end - start) * t;
    }
}
