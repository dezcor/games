/**
 * FlappyGame - pure domain state machine.
 * Receives ports (repository, hud, sound, random) by injection.
 * No DOM, no localStorage, no audio, no timers: the composition root drives tick()
 * from the clock port and asks the renderer port to draw the resulting state.
 */

class FlappyGame {
    constructor(config, ports) {
        this.width = config.width;
        this.height = config.height;
        this.repository = ports.repository;
        this.hud = ports.hud;
        this.sound = ports.sound;
        this.random = ports.random;

        this.bird = null;
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.playerName = '';
        this.northTheme = false;

        this.pipeSpawnTimer = 0;
        this.countdown = 0;
        this.flapHeld = false;
        this.flapHoldTime = 0;
    }

    // �� Setup ��

    /** Loads the saved player name and builds the first (not yet started) game. */
    boot() {
        this.playerName = this.repository.loadName();
        this.hud.setPlayerName(this.playerName);
        this.northTheme = this.isNorthTheme(this.playerName);
        this.hud.setNorthTheme(this.northTheme);
        this.initGame();
        this.hud.setOverlayVisible(true);
        this.hud.setOverlayTitle(this.northTheme ? 'NORTH' : 'FLAPPY');
        this.hud.setStartButtonVisible(true);
        this.hud.setBest(this.getBestScore());
    }

    isNorthTheme(name) {
        const normalized = String(name || '').toLowerCase().replace(/\s+/g, '');
        return NORTH_ALIASES.includes(normalized);
    }

    pickNorthTitle() {
        const index = Math.min(
            NORTH_GAME_OVER_TITLES.length - 1,
            Math.floor(this.random.next() * NORTH_GAME_OVER_TITLES.length)
        );
        return NORTH_GAME_OVER_TITLES[index];
    }

    initGame() {
        this.bird = Bird.create();
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.pipeSpawnTimer = 0;
        this.countdown = 0;
        this.flapHeld = false;
        this.flapHoldTime = 0;
        this.updateUI();
    }

    // �� Scores and persistence ��

    getBestScore() {
        const highScores = this.repository.loadHighScores();
        return highScores.length > 0 ? highScores[0].score : 0;
    }

    updateUI() {
        this.hud.updateHud({ score: this.score });
        this.hud.setBest(this.getBestScore());
    }

    // �� Flow: game over, start, pause, restart ��

    handleGameOver() {
        this.gameOver = true;
        this.isPaused = true;
        this.flapHeld = false;

        this.hud.setOverlayVisible(true);
        this.hud.setStartButtonVisible(false);
        this.hud.setOverlayTitle(this.northTheme ? this.pickNorthTitle() : 'GAME OVER');

        this.hud.setBest(this.getBestScore());
        const name = this.playerName.trim();
        this.repository.saveHighScore({ score: this.score, name: name || 'Anonymous' });
        this.hud.showHighScores(this.repository.loadHighScores());

        this.sound.playGameOver();
        this.sound.fadeOutBgm(0.8);
    }

    /** Starts a round with a countdown so the player has time to get ready. */
    startGame() {
        if (this.gameStarted) return;

        this.bird = Bird.create();
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStarted = true;
        this.pipeSpawnTimer = 0;
        this.countdown = COUNTDOWN_SECONDS;
        this.flapHeld = false;
        this.flapHoldTime = 0;

        this.hud.setOverlayVisible(false);
        this.hud.setStartButtonVisible(false);
        this.hud.hideHighScores();
        this.updateUI();

        // First pipe waits just off-screen while the countdown runs.
        this.spawnPipe();

        // Called from the start gesture, so the audio context can unlock.
        this.sound.startBgm();
    }

    /** Called once the countdown reaches zero: real play begins. */
    beginPlay() {
        this.hud.setOverlayVisible(false);
        this.hud.setOverlayTitle(this.northTheme ? 'NORTH' : 'FLAPPY');
        // Small starting hop so the round does not begin with a dead drop.
        this.flapHeld = false;
        this.flapHoldTime = 0;
        Bird.flap(this.bird);
        this.sound.playFlap();
    }

    togglePause() {
        if (!this.gameStarted || this.gameOver || this.countdown > 0) return;
        this.isPaused = !this.isPaused;
        this.flapHeld = false;
        this.hud.setOverlayVisible(this.isPaused);
        if (!this.isPaused) {
            this.hud.setOverlayTitle(this.northTheme ? 'NORTH' : 'FLAPPY');
        }
        if (this.isPaused) {
            this.sound.pauseBgm();
        } else {
            this.sound.resumeBgm();
        }
    }

    resetGame() {
        if (!this.gameStarted) return;
        this.initGame();
        this.startGame();
    }

    // �� Physics ��

    currentSpeed() {
        return BASE_SPEED + this.score * SPEED_INCREMENT;
    }

    spawnPipe() {
        this.pipes.push(Pipes.create(this.random));
    }

    updatePipes(dt) {
        const dx = this.currentSpeed() * dt * 60;
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            Pipes.step(pipe, dx);

            if (!pipe.passed && Pipes.isPassed(pipe)) {
                pipe.passed = true;
                this.score += SCORE_PER_PIPE;
                this.updateUI();
                this.sound.playScore();
            }

            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(i, 1);
            }
        }

        this.pipeSpawnTimer += dt * 60;
        while (this.pipeSpawnTimer >= PIPE_SPACING) {
            this.pipeSpawnTimer -= PIPE_SPACING;
            this.spawnPipe();
        }
    }

    checkCollisions() {
        for (const pipe of this.pipes) {
            if (Pipes.collides(pipe, this.bird)) {
                this.handleGameOver();
                return;
            }
        }
        if (Bird.isGrounded(this.bird)) {
            this.handleGameOver();
        }
    }

    // �� Input handling ��

    /** Press: start a flap burst. Holding keeps the bird rising for FLAP_HOLD_MAX. */
    startFlap() {
        if (!this.gameStarted || this.isPaused || this.gameOver || this.countdown > 0) return;
        this.flapHeld = true;
        this.flapHoldTime = 0;
        this.bird.vy = FLAP_VELOCITY;
        this.sound.playFlap();
    }

    /** Release: stop the lift now; gravity resumes on the next tick. */
    stopFlap() {
        this.flapHeld = false;
    }

    /** One simulation step. `dt` is the elapsed seconds since the previous frame. */
    tick(dt = 1 / 60) {
        if (this.countdown > 0) {
            this.countdown -= dt;
            if (this.countdown <= 0) {
                this.countdown = 0;
                this.beginPlay();
            }
            return;
        }

        if (!this.isPaused && !this.gameOver && this.gameStarted) {
            let thrusting = false;
            if (this.flapHeld) {
                thrusting = this.flapHoldTime < FLAP_HOLD_MAX;
                this.flapHoldTime += dt;
                if (this.flapHoldTime >= FLAP_HOLD_MAX) this.flapHeld = false;
            }
            Bird.step(this.bird, dt, thrusting);
            this.updatePipes(dt);
            this.checkCollisions();
        }
    }

    // �� Inbound commands (the InputPort surface used by adapters) ��

    onFlapStart() {
        if (!this.gameStarted) {
            this.startGame();
            return;
        }
        if (this.gameOver) {
            this.resetGame();
            return;
        }
        this.startFlap();
    }

    onFlapEnd() {
        this.stopFlap();
    }

    onKey(key) {
        if (!this.gameStarted) {
            if (key === 'Enter') {
                this.startGame();
            }
            return;
        }
        if (key === 'r' || key === 'R') {
            this.resetGame();
            return;
        }
        if (this.gameOver) {
            if (key === 'Enter') this.resetGame();
            return;
        }
        if (this.isPaused && key === 'Enter') {
            this.togglePause();
            return;
        }
        if (key === 'p' || key === 'P' || key === 'Escape') {
            this.togglePause();
        }
    }

    onStart() {
        this.startGame();
    }

    onTogglePause() {
        this.togglePause();
    }

    onRestart() {
        this.resetGame();
    }

    setPlayerName(name) {
        this.playerName = name;
        this.northTheme = this.isNorthTheme(name);
        this.hud.setNorthTheme(this.northTheme);
        this.repository.saveName(name);
    }
}
