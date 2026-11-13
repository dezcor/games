/**
 * CanvasRendererAdapter — implements RendererPort.
 * Draws the board on canvas; score, BEST and game-over overlay on DOM.
 */
const CanvasRendererAdapter = {
    canvas: null,
    ctx: null,
    scoreElement: null,
    highScoreElement: null,
    gameOverScreen: null,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('highScore');
        this.gameOverScreen = document.getElementById('game-over');
    },

    drawFrame(game) {
        const ctx = this.ctx;
        const size = GRID_SIZE;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = 'red';
        ctx.fillRect(game.food.x * size, game.food.y * size, size - 2, size - 2);

        game.snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? 'green' : 'lime';
            ctx.fillRect(part.x * size, part.y * size, size - 2, size - 2);
        });
    },

    updateScore(score) {
        this.scoreElement.innerText = score;
    },

    updateHighScore(highScore) {
        this.highScoreElement.innerText = `BEST: ${highScore}`;
    },

    showGameOver(score) {
        const finalScoreEl = document.getElementById('final-score-text');
        if (finalScoreEl) {
            finalScoreEl.textContent = `Score: ${score}`;
        }
        this.gameOverScreen.classList.remove('hidden');
    },

    hideGameOver() {
        this.gameOverScreen.classList.add('hidden');
    },
};
