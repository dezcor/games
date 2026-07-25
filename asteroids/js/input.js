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
setupTouchButton('[data-action="hyperespace"]',
    () => {
        if (typeof game !== 'undefined' && game.state === 'PLAYING') {
            game.tryHyperspace();
        }
    },
    () => {}
);
setupTouchButton('[data-action="pause"]',
    () => {
        if (typeof game !== 'undefined' && (game.state === 'PLAYING' || game.state === 'PAUSED')) {
            game.togglePause();
        }
    },
    () => {}
);
setupTouchButton('[data-action="restart"]',
    () => {
        if (typeof game !== 'undefined' && ['PLAYING', 'PAUSED', 'GAME_OVER'].includes(game.state)) {
            game.resetGame();
        }
    },
    () => {}
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

// ── Pinch-to-zoom + double-tap reset (portrait) ──
(function setupPinchZoom() {
    const wrapper = document.getElementById('board-wrapper');
    const canvas = document.getElementById('asteroids-canvas');
    const indicator = document.getElementById('zoom-indicator');
    if (!wrapper || !canvas) return;

    const MIN_SCALE = 1;
    const MAX_SCALE = 2;
    let scale = 1;
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let lastTap = 0;
    let indicatorTimer = null;

    function isPortrait() {
        return window.matchMedia && window.matchMedia('(orientation: portrait)').matches;
    }

    function getDistance(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
    }

    function applyScale(next) {
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
        if (scale === 1) {
            wrapper.style.transform = '';
        } else {
            wrapper.style.transform = `scale(${scale})`;
        }
        if (indicator) {
            indicator.textContent = `${Math.round(scale * 100)}%`;
            indicator.classList.add('visible');
            clearTimeout(indicatorTimer);
            indicatorTimer = setTimeout(() => indicator.classList.remove('visible'), 900);
        }
    }

    function resetZoom() {
        scale = 1;
        wrapper.style.transform = '';
        if (indicator) {
            indicator.textContent = '100%';
            indicator.classList.add('visible');
            clearTimeout(indicatorTimer);
            indicatorTimer = setTimeout(() => indicator.classList.remove('visible'), 900);
        }
    }

    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            pinchStartDist = getDistance(e.touches[0], e.touches[1]);
            pinchStartScale = scale;
            if (e.cancelable) e.preventDefault();
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTap < 300) {
                resetZoom();
            }
            lastTap = now;
        }
    }, { passive: false });

    wrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const d = getDistance(e.touches[0], e.touches[1]);
            if (pinchStartDist > 0) {
                const ratio = d / pinchStartDist;
                applyScale(pinchStartScale * ratio);
            }
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            pinchStartDist = 0;
        }
    });

    function onOrientationChange() {
        if (!isPortrait()) resetZoom();
    }
    window.addEventListener('orientationchange', onOrientationChange);
    window.addEventListener('resize', onOrientationChange);
})();
