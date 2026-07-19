/**
 * Input handling for Asteroids
 */
const keys = {};

// Listen for Keyboard Events
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Prevent scrolling with arrow keys and space
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

/**
 * helper to setup touch buttons with visual feedback
 * matches the pattern in other games
 */
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

// Initialize Touch Buttons
setupTouchButton('[data-action="left"]',
    () => { keys['ArrowLeft'] = true; },
    () => { keys['ArrowLeft'] = false; }
);

setupTouchButton('[data-action="right"]',
    () => { keys['ArrowRight'] = true; },
    () => { keys['ArrowRight'] = false; }
);

setupTouchButton('[data-action="shoot"]',
    () => { keys['Space'] = true; },
    () => { keys['Space'] = false; }
);

setupTouchButton('[data-action="pause"]',
    () => { if (typeof game !== 'undefined' && (game.state === 'PLAYING' || game.state === 'PAUSED')) game.togglePause(); },
    () => {}
);

setupTouchButton('[data-action="restart"]',
    () => { if (typeof game !== 'undefined' && (game.state === 'PLAYING' || game.state === 'PAUSED' || game.state === 'GAME_OVER')) game.resetGame(); },
    () => {}
);

/**
 * Note: For Asteroids, we mostly rely on the 'keys' object
 * within the main game loop.
 */
