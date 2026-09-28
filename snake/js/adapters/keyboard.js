/**
 * KeyboardAdapter — implements InputPort.
 * Handles keyboard input for Snake game.
 */
const KeyboardAdapter = {
    /**
     * Initialize keyboard listeners.
     * @param {SnakeGame} game
     */
    init(game) {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e, game));
    },

    handleKeyDown(e, game) {
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                e.preventDefault();
                game.input.onDirectionChange(0, -1);
                break;
            case 'ArrowDown':
            case 's':
                e.preventDefault();
                game.input.onDirectionChange(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                e.preventDefault();
                game.input.onDirectionChange(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
                e.preventDefault();
                game.input.onDirectionChange(1, 0);
                break;
            case ' ':
                e.preventDefault();
                if (game.state === 'GAME_OVER') {
                    game.input.onRestart();
                }
                break;
        }
    },
};
