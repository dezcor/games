/**
 * KeyboardAdapter — implements InputPort.
 * Arrow keys move a cursor; Enter/Space reveal, F flag, R restart,
 * P/Escape pause, 1/2/3 select difficulty.
 */

const cursor = { r: 0, c: 0, active: false };

function moveCursor(dr, dc) {
    if (!cursor.active) return;
    const game = window.game;
    if (!game || !game.board) return;
    cursor.r = Math.max(0, Math.min(game.board.rows - 1, cursor.r + dr));
    cursor.c = Math.max(0, Math.min(game.board.cols - 1, cursor.c + dc));
    if (window.CanvasRendererAdapter) window.CanvasRendererAdapter.beginFrame();
}

window.addEventListener('keydown', (e) => {
    const game = window.game;
    if (!game) return;

    switch (e.code) {
        case 'ArrowUp':
            cursor.active = true;
            moveCursor(-1, 0);
            break;
        case 'ArrowDown':
            cursor.active = true;
            moveCursor(1, 0);
            break;
        case 'ArrowLeft':
            cursor.active = true;
            moveCursor(0, -1);
            break;
        case 'ArrowRight':
            cursor.active = true;
            moveCursor(0, 1);
            break;
        case 'Enter':
        case 'Space':
            if (game.state === 'PLAYING') {
                game.onCellClick(cursor.r, cursor.c);
            } else if (game.state === 'IDLE') {
                game.start(game.difficulty);
            }
            break;
        case 'KeyF':
            if (game.state === 'PLAYING') game.onCellFlag(cursor.r, cursor.c);
            break;
        case 'KeyR':
            if (['PLAYING', 'PAUSED', 'WON', 'LOST'].includes(game.state)) game.restart();
            break;
        case 'Escape':
        case 'KeyP':
            game.togglePause();
            break;
        case 'Digit1':
            if (game.state !== 'PLAYING') game.start('easy');
            break;
        case 'Digit2':
            if (game.state !== 'PLAYING') game.start('normal');
            break;
        case 'Digit3':
            if (game.state !== 'PLAYING') game.start('hard');
            break;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});
