/**
 * TouchAdapter — implements InputPort for touch/mouse.
 * Tap reveals a cell; long-press or flag-mode flags it.
 */

let flagMode = false;

function setupTouchButton(selector, onStart, onEnd) {
    const btn = document.querySelector(selector);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.add('pressed');
        if (onStart) onStart();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });

    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        btn.classList.add('pressed');
        if (onStart) onStart();
    });

    btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });

    btn.addEventListener('mouseleave', (e) => {
        btn.classList.remove('pressed');
        if (onEnd) onEnd();
    });
}

// ── Canvas tap / long-press ──
(function setupCanvasInput() {
    const canvas = document.getElementById('minesweeper-canvas');
    if (!canvas) return;

    function getCell(e) {
        const game = window.game;
        if (!game || !game.board) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const pt = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
        const x = (pt.clientX - rect.left) * scaleX;
        const y = (pt.clientY - rect.top) * scaleY;
        const c = Math.floor((x - BOARD_PADDING) / CELL_SIZE);
        const r = Math.floor((y - BOARD_PADDING) / CELL_SIZE);
        if (r < 0 || r >= game.board.rows || c < 0 || c >= game.board.cols) return null;
        return { r, c };
    }

    let pressTimer = null;
    let pressCell = null;

    canvas.addEventListener('touchstart', (e) => {
        const cell = getCell(e);
        if (!cell) return;
        pressCell = cell;
        pressTimer = setTimeout(() => {
            const game = window.game;
            if (game && game.state === 'PLAYING' && !flagMode) {
                game.onCellFlag(cell.r, cell.c);
            }
        }, 300);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
        const cell = pressCell;
        pressCell = null;
        if (!cell) return;
        const game = window.game;
        if (game && game.state === 'PLAYING') {
            if (flagMode) {
                game.onCellFlag(cell.r, cell.c);
            } else {
                game.onCellClick(cell.r, cell.c);
            }
        }
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    // Mouse click reveals
    canvas.addEventListener('click', (e) => {
        const cell = getCell(e);
        if (!cell) return;
        const game = window.game;
        if (game && game.state === 'PLAYING') {
            if (flagMode) {
                game.onCellFlag(cell.r, cell.c);
            } else {
                game.onCellClick(cell.r, cell.c);
            }
        }
    });

    // Mouse right-click flags
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const cell = getCell(e);
        if (!cell) return;
        const game = window.game;
        if (game && game.state === 'PLAYING') {
            game.onCellFlag(cell.r, cell.c);
        }
    });
})();

// ── Touch buttons ──
setupTouchButton('[data-action="flag"]', () => {
    flagMode = !flagMode;
    const btn = document.querySelector('[data-action="flag"]');
    if (btn) btn.classList.toggle('active', flagMode);
}, () => {});

setupTouchButton('[data-action="pause"]', () => {
    const game = window.game;
    if (game && (game.state === 'PLAYING' || game.state === 'PAUSED')) {
        game.togglePause();
    }
}, () => {});

setupTouchButton('[data-action="restart"]', () => {
    const game = window.game;
    if (game && ['PLAYING', 'PAUSED', 'WON', 'LOST'].includes(game.state)) {
        game.restart();
    }
}, () => {});
