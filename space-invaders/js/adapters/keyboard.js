/**
 * KeyboardAdapter — game shortcuts: Enter start, R restart, P / Escape / Enter pause.
 * Movement and fire keys are handled by InputAdapter.
 */
const KeyboardAdapter = {
    init(game) {
        document.addEventListener('keydown', (e) => {
            if (!game.gameStarted) {
                if (e.key === 'Enter') {
                    game.startGame();
                }
                return;
            }
            if (e.key === 'r' || e.key === 'R') {
                game.resetGame();
                return;
            }
            if (game.gameOver) return;
            if (game.isPaused && e.key === 'Enter') {
                game.togglePause();
                return;
            }
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                game.togglePause();
                return;
            }
        });
    },
};
