/**
 * Input handling for Asteroids
 * Manages keyboard state and touch controls
 */

const keys = {};

// ── Keyboard ──
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ── Touch Controls ──
let touchLeft = false;
let touchRight = false;
let touchThrust = false;
let touchShoot = false;
let touchPause = false;
let touchRestart = false;

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

    // Mouse fallback
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

// Map touch buttons to key states
setupTouchButton('[data-action="left"]',
    () => { touchLeft = true; },
    () => { touchLeft = false; }
);
setupTouchButton('[data-action="right"]',
    () => { touchRight = true; },
    () => { touchRight = false; }
);
setupTouchButton('[data-action="thrust"]',
    () => { touchThrust = true; },
    () => { touchThrust = false; }
);
setupTouchButton('[data-action="shoot"]',
    () => { touchShoot = true; },
    () => { touchShoot = false; }
);
setupTouchButton('[data-action="pause"]',
    () => { touchPause = true; },
    () => { touchPause = false; }
);
setupTouchButton('[data-action="restart"]',
    () => { touchRestart = true; },
    () => { touchRestart = false; }
);

// ── Unified key accessor (combines keyboard + touch) ──
function isKeyActive(code) {
    switch (code) {
        case 'ArrowLeft':   return !!keys['ArrowLeft']   || touchLeft;
        case 'ArrowRight':  return !!keys['ArrowRight']  || touchRight;
        case 'ArrowUp':     return !!keys['ArrowUp']     || touchThrust;
        case 'Space':       return !!keys['Space']       || touchShoot;
        case 'Escape':      return !!keys['Escape'];
        default:            return !!keys[code];
    }
}
