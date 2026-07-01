/**
 * Interface Game
 * @interface
 * @description Defines the structure for a game, requiring a start method.
 */
class Game {
    /**
     * Starts the game loop.
     */
    start() {
        throw new Error("Method 'start()' must be implemented.");
    }
}

/**
 * SnakeGame Implementation
 * @extends Game
 */
class SnakeGame extends Game {
    constructor(canvasId, scoreId, gameOverId) {
        super();
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById(scoreId);
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverScreen = document.getElementById(gameOverId);


        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.highScoreElement.innerText = `High Score: ${this.highScore}`;
        this.dx = 1;
        this.dy = 0;


        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.gameSpeed = 100;
        this.lastTime = 0;
        this.isGameOver = false;

        this.init();
    }

    init() {
        this.generateFood();
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    start() {
        requestAnimationFrame((currentTime) => this.main(currentTime));
    }

    main(currentTime) {
        if (this.isGameOver) return;

        if (currentTime - this.lastTime > this.gameSpeed) {
            this.lastTime = currentTime;
            this.update();
            this.draw();
        }
        requestAnimationFrame((t) => this.main(t));
    }

    update() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Wall Collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return this.endGame();
        }

        // Self Collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return this.endGame();
            }
        }

        this.snake.unshift(head);

        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.scoreElement.innerText = `Score: ${this.score}`;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                this.highScoreElement.innerText = `High Score: ${this.highScore}`;
            }
            this.generateFood();
            if (this.gameSpeed > 50) this.gameSpeed -= 2;
        } else {

            this.snake.pop();
        }
    }

    draw() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);

        this.snake.forEach((part, index) => {
            this.ctx.fillStyle = index === 0 ? 'green' : 'lime';
            this.ctx.fillRect(part.x * this.gridSize, part.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });
    }

    generateFood() {
        this.food.x = Math.floor(Math.random() * this.tileCount);
        this.food.y = Math.floor(Math.random() * this.tileCount);

        this.snake.forEach(part => {
            if (part.x === this.food.x && part.y === this.food.y) {
                this.generateFood();
            }
        });
    }

    endGame() {
        this.isGameOver = true;
        this.gameOverScreen.classList.remove('hidden');
    }

    resetGame() {
        this.score = 0;
        this.dx = 1;
        this.dy = 0;
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.food = { x: 15, y: 15 };
        this.gameSpeed = 100;
        this.isGameOver = false;
        this.scoreElement.innerText = `Score: ${this.score}`;
        this.gameOverScreen.classList.add('hidden');
        this.generateFood();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.main(t));
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                if (this.dy !== 1) { this.dy = -1; this.dx = 0; }
                break;
            case 'ArrowDown':
            case 's':
                if (this.dy !== -1) { this.dy = 1; this.dx = 0; }
                break;
            case 'ArrowLeft':
            case 'a':
                if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
                break;
            case 'ArrowRight':
            case 'd':
                if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
                break;
            case ' ':
                if (this.isGameOver) {
                    this.resetGame();
                }
                break;
        }
    }

}

// Instantiate and start the game
const game = new SnakeGame('gameCanvas', 'score', 'game-over');
game.start();

// Expose resetGame for the button in index.html
window.resetGame = game.resetGame.bind(game);

