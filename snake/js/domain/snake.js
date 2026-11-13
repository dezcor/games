/**
 * SnakeGame — pure domain state machine.
 * Receives ports (repository, renderer, input, sound, clock) by injection.
 * No DOM, no localStorage, no audio directly.
 */

class SnakeGame {
    constructor(config, ports) {
        this.tileCount = config.tileCount;
        this.repository = ports.repository;
        this.renderer = ports.renderer;
        this.input = ports.input;
        this.sound = ports.sound;
        this.clock = ports.clock;

        this.score = 0;
        this.highScore = 0;
        this.dx = 1;
        this.dy = 0;
        this.snake = [];
        this.food = null;
        this.gameSpeed = INITIAL_GAME_SPEED;
        this.lastTime = 0;
        this.isGameOver = false;
    }

    // ── Load persisted state and set up the first game ──
    init() {
        this.highScore = this.repository.loadHighScore();
        this.renderer.updateHighScore(this.highScore);
        this.resetState(0);
    }

    // ── Kick off BGM and the frame loop ──
    start() {
        this.sound.startBgm();
        this.clock.start((currentTime) => this.frame(currentTime));
    }

    // ── Restart after game over (or from the deck RESTART cap) ──
    resetGame() {
        this.resetState(this.clock.now());
        this.sound.startBgm();
        this.clock.start((currentTime) => this.frame(currentTime));
    }

    resetState(lastTime) {
        this.score = 0;
        this.dx = 1;
        this.dy = 0;
        this.snake = START_SNAKE.map((part) => ({ x: part.x, y: part.y }));
        this.gameSpeed = INITIAL_GAME_SPEED;
        this.isGameOver = false;
        this.lastTime = lastTime;
        this.renderer.updateScore(this.score);
        this.renderer.hideGameOver();
        this.generateFood();
    }

    // ── Frame loop (driven by the clock port) ──
    frame(currentTime) {
        if (this.isGameOver) return;
        if (currentTime - this.lastTime > this.gameSpeed) {
            this.lastTime = currentTime;
            this.update();
            this.renderer.drawFrame(this);
        }
    }

    // ── One step of the game ──
    update() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return this.endGame();
        }

        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return this.endGame();
            }
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.renderer.updateScore(this.score);
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.repository.saveHighScore(this.highScore);
                this.renderer.updateHighScore(this.highScore);
                this.sound.playNewHighScore();
            } else {
                this.sound.playEat();
            }
            this.generateFood();
            if (this.gameSpeed > MIN_GAME_SPEED) this.gameSpeed -= SPEED_STEP;
        } else {
            this.snake.pop();
        }
    }

    generateFood() {
        // Uniform over the free cells; terminates even on a full board
        // (where the old recursive re-roll would overflow the stack).
        const occupied = new Set(this.snake.map((part) => `${part.x},${part.y}`));
        const free = [];
        for (let y = 0; y < this.tileCount; y++) {
            for (let x = 0; x < this.tileCount; x++) {
                if (!occupied.has(`${x},${y}`)) free.push({ x, y });
            }
        }
        if (free.length === 0) return; // board full: every move loses, food position is moot
        this.food = free[Math.floor(Math.random() * free.length)];
    }

    endGame() {
        this.isGameOver = true;
        this.clock.stop();
        this.renderer.showGameOver(this.score);
        this.sound.playGameOver();
    }

    // ── Input port callbacks ──
    onDirection(dx, dy) {
        if (this.isGameOver) return;
        if (this.dx === -dx && this.dy === -dy) return;
        this.dx = dx;
        this.dy = dy;
        this.sound.playMove();
    }

    onRestart() {
        this.resetGame();
    }
}
