/**
 * CanvasAdapter — implements RendererPort.
 * Draws the snake game on canvas.
 */
const CanvasAdapter = {
    canvas: null,
    ctx: null,
    gridSize: 20,

    /**
     * Initialize the adapter with the canvas element.
     * @param {string} canvasId
     */
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = this.canvas.width / 20; // 400/20 = 20 tiles
    },

    beginFrame() {
        const ctx = this.ctx;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawFrame(state) {
        const ctx = this.ctx;
        const gs = this.gridSize;

        // Draw food
        ctx.fillStyle = 'red';
        ctx.fillRect(
            state.food.x * gs,
            state.food.y * gs,
            gs - 2,
            gs - 2
        );

        // Draw snake
        state.snake.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? 'green' : 'lime';
            ctx.fillRect(
                part.x * gs,
                part.y * gs,
                gs - 2,
                gs - 2
            );
        });
    },

    showGameOver(score) {
        const gameOverScreen = document.getElementById('game-over');
        const finalScoreEl = document.getElementById('final-score-text');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
        }
        if (finalScoreEl) {
            finalScoreEl.textContent = `Score: ${score}`;
        }
    },

    hideOverlay() {
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
        }
    },
};
