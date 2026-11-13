/**
 * ArkanoidGame — pure domain state machine.
 * Receives ports (repository, hud, sound, random) by injection.
 * No DOM, no localStorage, no audio, no timers: the composition root drives tick()
 * from the clock port and asks the renderer port to draw the resulting state.
 */

class ArkanoidGame {
    constructor(config, ports) {
        this.width = config.width;
        this.height = config.height;
        this.repository = ports.repository;
        this.hud = ports.hud;
        this.sound = ports.sound;
        this.random = ports.random;

        this.paddle = null;
        this.balls = [];
        this.bricks = [];
        this.powerUps = [];
        this.powerUpSpawnQueue = [];
        this.particles = [];

        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;
        this.playerName = '';

        // Held-key state, keyed by KeyboardEvent.code (touch buttons write the same keys)
        this.held = {};
        this.dasLeft = { code: 'ArrowLeft', pressed: false, timer: 0, state: 'idle' };
        this.dasRight = { code: 'ArrowRight', pressed: false, timer: 0, state: 'idle' };
    }

    // ── Setup ──

    /** Loads the saved player name and builds the first (not yet started) game. */
    boot() {
        this.playerName = this.repository.loadName();
        this.hud.setPlayerName(this.playerName);
        this.initGame();
        this.hud.setOverlayVisible(true);
        this.hud.setOverlayTitle('ARKANOID');
        this.hud.setStartButtonVisible(true);
        this.hud.setBest(this.getBestScore());
    }

    initGame() {
        this.paddle = {
            x: (this.width - PADDLE_WIDTH) / 2,
            y: this.height - 30,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
        };

        this.level = 1;
        this.gameOver = false;
        this.isPaused = true;
        this.gameStarted = false;

        this.balls = [];
        this.spawnBall();

        this.bricks = [];
        this.powerUps = [];
        this.powerUpSpawnQueue = [];
        this.particles = [];

        this.score = 0;
        this.lives = 3;

        this.loadLevel(this.level);
        this.updateUI();
    }

    spawnBall() {
        const sx = this.width / 2;
        const sy = this.height - 50;
        const sd = BASE_SPEED + (this.level - 1) * 0.2;
        this.balls.push({
            x: sx,
            y: sy,
            dx: (this.random.next() > 0.5 ? 1 : -1) * sd,
            dy: -sd,
            radius: BALL_RADIUS,
        });
    }

    loadLevel(lvl) {
        const layout = BrickLevels.layout(lvl);
        const brickColors = BrickLevels.colors(lvl);
        const brickWidth = (this.width - 40) / layout.cols;
        const brickHeight = 20;
        const brickOffsetX = 20;
        const brickOffsetY = 30;

        this.bricks = [];
        for (let row = 0; row < layout.rows; row++) {
            for (let col = 0; col < layout.cols; col++) {
                if (layout.grid[row][col] > 0) {
                    const isSpecial = BrickLevels.isSpecial(lvl, this.random);
                    const brickColor = isSpecial ? '#fbbf24' : (brickColors[layout.grid[row][col]] || brickColors[1]);
                    this.bricks.push({
                        x: brickOffsetX + col * brickWidth,
                        y: brickOffsetY + row * brickHeight,
                        width: brickWidth - 4,
                        height: brickHeight - 3,
                        hp: isSpecial ? 3 : 1,
                        maxHp: isSpecial ? 3 : 1,
                        color: brickColor,
                        isSpecial: isSpecial,
                        alive: true,
                        row: row,
                        col: col,
                        flashTimer: 0,
                    });
                }
            }
        }
    }

    // ── Scores and persistence ──

    getBestScore() {
        const highScores = this.repository.loadHighScores();
        return highScores.length > 0 ? highScores[0].score : 0;
    }

    updateUI() {
        this.hud.updateHud({ score: this.score, level: this.level, lives: this.lives });
        this.hud.setBest(this.getBestScore());
    }

    // ── Flow: game over, level complete, start, pause, restart ──

    handleGameOver() {
        this.gameOver = true;
        this.isPaused = true;

        this.hud.setOverlayVisible(true);
        this.hud.setStartButtonVisible(false);
        this.hud.setOverlayTitle('GAME OVER');

        this.hud.setBest(this.getBestScore());
        const name = this.playerName.trim();
        this.repository.saveHighScore({ score: this.score, name: name || 'Anonymous' });
        this.hud.showHighScores(this.repository.loadHighScores());

        this.sound.playGameOver();
        this.sound.fadeOutBgm(0.8);
        this.hud.alertGameOver();
    }

    handleLevelComplete() {
        if (this.level >= 3) {
            this.handleGameOver();
            return;
        }

        this.level++;
        this.loadLevel(this.level);
        this.paddle.x = (this.width - PADDLE_WIDTH) / 2;
        this.balls = [];
        this.spawnBall();
        this.powerUps = [];
        this.powerUpSpawnQueue = [];
        this.particles = [];

        this.isPaused = true;
        this.hud.setOverlayVisible(true);
        this.hud.setOverlayTitle(`LEVEL ${this.level}`);

        this.sound.playLevelComplete();
        this.sound.pauseBgm();
    }

    startGame() {
        this.gameStarted = true;
        this.isPaused = false;
        this.hud.setOverlayVisible(false);
        this.hud.setOverlayTitle('ARKANOID');
        this.hud.setStartButtonVisible(false);
        this.sound.startBgm();
    }

    togglePause() {
        if (!this.gameStarted) return;
        this.isPaused = !this.isPaused;
        this.hud.setOverlayVisible(this.isPaused);
        if (!this.isPaused) {
            this.hud.setOverlayTitle('ARKANOID');
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
        this.isPaused = false;
        this.gameStarted = true;

        this.hud.setOverlayVisible(false);
        this.hud.setOverlayTitle('ARKANOID');
        this.hud.hideHighScores();

        this.hud.setBest(this.getBestScore());
        this.sound.startBgm();
    }

    // ── Paddle ──

    setPaddleX(val) {
        this.paddle.x = Math.max(0, Math.min(this.width - PADDLE_WIDTH, val));
    }

    // ── Physics ──

    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (this.random.next() - 0.5) * 4,
                dy: (this.random.next() - 0.5) * 4,
                radius: this.random.next() * 2 + 1,
                color: color,
                alpha: 1,
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateBalls() {
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            ball.x += ball.dx;
            ball.y += ball.dy;

            // NaN safety guard
            if (isNaN(ball.x) || isNaN(ball.y) || isNaN(ball.dx) || isNaN(ball.dy)) {
                ball.x = this.width / 2;
                ball.y = this.height - 50;
                ball.dx = (this.random.next() > 0.5 ? 1 : -1) * (BASE_SPEED + (this.level - 1) * 0.2);
                ball.dy = -(BASE_SPEED + (this.level - 1) * 0.2);
                continue;
            }

            // Wall collisions
            if (ball.x - ball.radius <= 0) {
                ball.x = ball.radius;
                ball.dx = Math.abs(ball.dx);
                this.sound.playBounce();
            }
            if (ball.x + ball.radius >= this.width) {
                ball.x = this.width - ball.radius;
                ball.dx = -Math.abs(ball.dx);
                this.sound.playBounce();
            }
            if (ball.y - ball.radius <= 0) {
                ball.y = ball.radius;
                ball.dy = Math.abs(ball.dy);
                this.sound.playBounce();
            }

            // Bottom - lose ball. The removed ball still goes through the paddle and brick
            // checks below in this same iteration (as in the original).
            if (ball.y + ball.radius >= this.height) {
                this.balls.splice(i, 1);
                if (this.balls.length === 0) {
                    this.lives--;
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.handleGameOver();
                        return;
                    } else {
                        this.sound.playLoseLife();
                        this.spawnBall();
                    }
                }
            }

            // Paddle
            if (
                ball.dy > 0 &&
                ball.y + ball.radius >= this.paddle.y &&
                ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
                ball.x + ball.radius >= this.paddle.x &&
                ball.x - ball.radius <= this.paddle.x + this.paddle.width
            ) {
                BallPhysics.paddleBounce(ball, this.paddle, this.width, this.random);
                this.sound.playPaddleHit();
            }

            // Brick collisions (first brick hit wins)
            for (const brick of this.bricks) {
                if (!brick.alive) continue;

                const contact = BallPhysics.brickContact(ball, brick);
                if (!contact) continue;

                brick.hp--;
                brick.flashTimer = 4;

                if (brick.hp <= 0) {
                    brick.alive = false;
                    this.score += brick.isSpecial ? 30 : 10;
                    this.updateUI();
                    this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 8);

                    if (brick.isSpecial) {
                        this.sound.playSpecialBrickBreak();
                        this.powerUpSpawnQueue.push({ x: brick.x + brick.width / 2, y: brick.y + brick.height / 2 });
                    } else {
                        this.sound.playBrickBreak();
                    }
                } else {
                    this.sound.playBrickBreak();
                }

                BallPhysics.reflect(ball, contact);
                BallPhysics.clampAngle(ball, this.random);

                break;
            }
        }
    }

    spawnPowerUp(x, y, type) {
        this.powerUps.push({
            x: x,
            y: y,
            width: 20,
            height: 14,
            dy: 2,
            type: type,
            color: POWER_UP_COLORS[type] || '#22d3ee',
        });
    }

    randomPowerUpType() {
        return this.random.next() < 0.5 ? POWER_UP_TYPES.MULTI_BALL : POWER_UP_TYPES.EXTRA_LIFE;
    }

    applyPowerUp(type) {
        this.sound.playPowerUp();

        if (type === POWER_UP_TYPES.MULTI_BALL) {
            const originalBall = this.balls[0];
            if (originalBall) {
                const speed = BallPhysics.speed(originalBall);
                const baseAngle = Math.atan2(originalBall.dy, originalBall.dx);
                const sx = Math.max(BALL_RADIUS, Math.min(this.width - BALL_RADIUS, originalBall.x));
                const sy = Math.max(BALL_RADIUS, Math.min(this.height - BALL_RADIUS, originalBall.y));
                for (let i = 0; i < 2; i++) {
                    const spread = (i === 0 ? 1 : -1) * (Math.PI / 7);
                    let ndx = Math.cos(baseAngle + spread);
                    let ndy = Math.sin(baseAngle + spread);
                    // If the source ball is heading down, launch the clones upward so the
                    // power-up isn't wasted on balls that would die right away with it.
                    if (originalBall.dy > 0 && ndy > 0) {
                        ndy = -Math.max(Math.abs(ndy), 0.5);
                    }
                    const nlen = Math.hypot(ndx, ndy) || 1;
                    this.balls.push({
                        x: sx,
                        y: sy,
                        dx: (ndx / nlen) * speed,
                        dy: (ndy / nlen) * speed,
                        radius: BALL_RADIUS,
                    });
                }
            }
        } else if (type === POWER_UP_TYPES.EXTRA_LIFE) {
            this.lives = Math.min(this.lives + 1, 9);
            this.updateUI();
        }
    }

    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.y += pu.dy;

            if (pu.y > this.height) {
                this.powerUps.splice(i, 1);
                continue;
            }

            if (
                pu.y + pu.height >= this.paddle.y &&
                pu.y <= this.paddle.y + this.paddle.height &&
                pu.x + pu.width >= this.paddle.x &&
                pu.x <= this.paddle.x + this.paddle.width
            ) {
                this.applyPowerUp(pu.type);
                this.createParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.color, 12);
                this.powerUps.splice(i, 1);
            }
        }

        if (this.powerUpSpawnQueue.length > 0 && this.powerUps.length < 2) {
            const spawn = this.powerUpSpawnQueue.shift();
            this.spawnPowerUp(spawn.x, spawn.y, this.randomPowerUpType());
        }
    }

    checkLevelComplete() {
        for (const brick of this.bricks) {
            if (brick.alive) return;
        }
        this.handleLevelComplete();
    }

    // ── Input handling (held keys: DAS = delayed auto-shift, 170 ms then 50 ms repeat) ──

    dasStep(direction, action) {
        const isDown = this.held[direction.code];

        if (isDown) {
            if (!direction.pressed) {
                action();
                direction.pressed = true;
                direction.timer = 0;
                direction.state = 'das_wait';
            } else if (direction.state === 'das_wait') {
                direction.timer++;
                if (direction.timer >= 10) {
                    action();
                    direction.state = 'arr';
                    direction.timer = 0;
                }
            } else if (direction.state === 'arr') {
                direction.timer++;
                if (direction.timer >= 3) {
                    action();
                    direction.timer = 0;
                }
            }
        } else {
            direction.pressed = false;
            direction.timer = 0;
            direction.state = 'idle';
        }
    }

    handleInput() {
        if (this.isPaused || this.gameOver) return;

        this.dasStep(this.dasLeft, () => {
            this.setPaddleX(this.paddle.x - 6);
        });
        this.dasStep(this.dasRight, () => {
            this.setPaddleX(this.paddle.x + 6);
        });
    }

    /** One simulation step (called once per frame by the composition root). */
    tick() {
        this.handleInput();

        if (!this.isPaused && !this.gameOver && this.gameStarted) {
            this.updateBalls();
            this.updatePowerUps();
            this.updateParticles();
            this.bricks.forEach(b => { if (b.flashTimer > 0) b.flashTimer--; });
            this.checkLevelComplete();
        }
    }

    // ── Inbound commands (the InputPort surface used by adapters) ──

    setHeld(code, isDown) {
        this.held[code] = isDown;
    }

    setPointerX(canvasX) {
        if (!this.gameStarted || this.isPaused || this.gameOver) return;
        this.setPaddleX(canvasX - this.paddle.width / 2);
    }

    onCanvasClick() {
        if (!this.gameStarted) {
            this.startGame();
        } else if (this.isPaused && !this.gameOver) {
            this.togglePause();
        }
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
        if (this.gameOver) return;
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
        this.repository.saveName(name);
    }
}
