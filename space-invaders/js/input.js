const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleDAS(direction, action) {
    const keyCode = direction.key;
    const isDown = keys[keyCode];

    if (isDown) {
        if (!direction._pressed) {
            action();
            direction._pressed = true;
            direction._timer = 0;
            direction._state = 'das_wait';
        } else if (direction._state === 'das_wait') {
            direction._timer++;
            if (direction._timer >= 8) {
                action();
                direction._state = 'arr';
                direction._timer = 0;
            }
        } else if (direction._state === 'arr') {
            direction._timer++;
            if (direction._timer >= 3) {
                action();
                direction._timer = 0;
            }
        }
    } else {
        direction._pressed = false;
        direction._timer = 0;
        direction._state = 'idle';
    }
}

let dasLeft = { _pressed: false, _timer: 0, _state: 'idle', key: 'ArrowLeft' };
let dasRight = { _pressed: false, _timer: 0, _state: 'idle', key: 'ArrowRight' };

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
    () => { if (typeof togglePause === 'function' && gameStarted && !gameOver) togglePause(); },
    () => {}
);

setupTouchButton('[data-action="restart"]',
    () => { if (typeof resetGame === 'function' && gameStarted) resetGame(); },
    () => {}
);
