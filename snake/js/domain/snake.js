/**
 * Snake Game — pure domain logic.
 * Receives ports (renderer, input, repository, sound) by injection.
 * No DOM, no localStorage, no audio directly.
 */

const SnakeGame = {
    /** @type {'IDLE'|'PLAYING'|'GAME_OVER'} */
    state: 'IDLE',

    /** Canvas grid size in pixels. */
    gridSize: 20,

    /** Number of tiles per row/column. */
    tileCount: 20,

    /** Current score. */
    score: 0,

    /** Current speed in ms per frame. */
    gameSpeed: 100,

    /** Snake body as array of {x, y} coordinates. */
    snake: [],

    /** Food position {x, y}. */
    food: { x: 0, y: 0 },

    /** Current direction vector. */
    dx: 1,
    dy: 0,

    /** Direction change queue to prevent rapid-reversal issues. */
    directionQueue: [],

    /** Last time the game loop updated. */
    lastTime: 0,

    /** Animation frame id for the game loop. */
    rafId: null,

    /**
     * Initialize the game state.
     * @param {object} ports
     */
    init(ports) {
        this.repository = ports.repository;
        this.renderer = ports.renderer;
        this.input = ports.input;
        this.sound = ports.sound;

        this.score = 0;
        this.gameSpeed = 100;
        this.dx = 1;
        this.dy = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.directionQueue = [];
        this.state = 'IDLE';
        this.lastTime = 0;

        this.generateFood();
    },

    /**
     * Start a new game.
     */
    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.gameSpeed = 100;
        this.dx = 1;
        this.dy = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.directionQueue = [];
        this.lastTime = 0;

        this.sound.ensureAudio();
        this.sound.startBgm();
        this.renderer.hideOverlay();
        this.renderer.beginFrame();
        this.renderer.drawFrame(this.getState());
    },

    /**
     * Main game loop entry.
     * @param {number} currentTime
     */
    loop(currentTime) {
        if (this.state !== 'PLAYING') return;

        if (currentTime - this.lastTime > this.gameSpeed) {
            this.lastTime = currentTime;
            this.update();
            this.renderer.beginFrame();
            this.renderer.drawFrame(this.getState());
        }

        this.rafId = requestAnimationFrame((t) => this.loop(t));
    },

    /**
     * Get a snapshot of the current game state for the renderer.
     * @returns {{snake:Array, food:Object, score:number}}
     */
    getState() {
        return {
            snake: this.snake,
            food: this.food,
            score: this.score
        };
    },

    /**
     * Update game state: move snake, check collisions, eat food.
     */
    update() {
        // Process direction from queue
        if (this.directionQueue.length > 0) {
            const next = this.directionQueue.shift();
            this.dx = next.dx;
            this.dy = next.dy;
        }

        const head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return this.endGame();
        }

        // Check self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return this.endGame();
            }
        }

        // Move snake: add new head
        this.snake.unshift(head);

        // Check food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.sound.playEat();

            if (this.score > (this.repository.loadHighScore() || 0)) {
                this.repository.saveHighScore(this.score);
                this.sound.playNewHighScore();
            }

            this.generateFood();

            // Increase speed
            if (this.gameSpeed > 50) {
                this.gameSpeed -= 2;
            }
        } else {
            // Remove tail
            this.snake.pop();
        }
    },

    /**
     * Generate food at a random position not occupied by the snake.
     */
    generateFood() {
        let foodX, foodY, occupied;
        do {
            foodX = Math.floor(Math.random() * this.tileCount);
            foodY = Math.floor(Math.random() * this.tileCount);
            occupied = false;
            for (let i = 0; i < this.snake.length; i++) {
                if (this.snake[i].x === foodX && this.snake[i].y === foodY) {
                    occupied = true;
                    break;
                }
            }
        } while (occupied);
        this.food = { x: foodX, y: foodY };
    },

    /**
     * Handle game over.
     */
    endGame() {
        this.state = 'GAME_OVER';
        this.sound.playGameOver();
        this.repository.saveHighScore(this.score);
        this.renderer.showGameOver(this.score);
    },

    /**
     * Reset and restart the game.
     */
    reset() {
        // Cancel any existing animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Reset state
        this.state = 'IDLE';
        this.score = 0;
        this.gameSpeed = 100;
        this.dx = 1;
        this.dy = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.directionQueue = [];
        this.lastTime = 0;

        // Generate new food
        this.generateFood();

        // Hide game over overlay
        this.renderer.hideOverlay();

        // Draw initial frame
        this.renderer.beginFrame();
        this.renderer.drawFrame(this.getState());

        // Start game
        this.state = 'PLAYING';
        this.sound.ensureAudio();
        this.sound.startBgm();

        // Start game loop
        this.rafId = requestAnimationFrame((t) => this.loop(t));
    },

    /**
     * Queue a direction change.
     * Prevents reversal and rapid double-input issues.
     * @param {number} dx
     * @param {number} dy
     */
    setDirection(dx, dy) {
        if (this.state !== 'PLAYING') return;

        // Prevent reversal
        if (this.dx === -dx && this.dy === -dy) return;

        // Only queue if there's room (prevents input flooding)
        if (this.directionQueue.length < 2) {
            // Check against last queued direction (or current if queue is empty)
            const lastDir = this.directionQueue.length > 0
                ? this.directionQueue[this.directionQueue.length - 1]
                : { dx: this.dx, dy: this.dy };

            // Prevent reversing the last queued direction too
            if (lastDir.dx === -dx && lastDir.dy === -dy) return;

            this.directionQueue.push({ dx, dy });
            this.sound.playMove();
        }
    },
};
