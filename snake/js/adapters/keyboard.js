/**
 * KeyboardAdapter — implements InputPort (keyboard part).
 * Arrows/WASD change direction; Space restarts after game over.
 */

window.addEventListener('keydown', (e) => {
    const game = window.game;
    if (!game || !game.input) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            game.input.onDirection(0, -1);
            break;
        case 'ArrowDown':
        case 's':
            game.input.onDirection(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
            game.input.onDirection(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
            game.input.onDirection(1, 0);
            break;
        case ' ':
            if (game.isGameOver) {
                game.input.onRestart();
            }
            break;
    }
});
