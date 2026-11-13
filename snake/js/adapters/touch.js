/**
 * TouchAdapter — implements InputPort (touch part).
 * Joystick zones + RESTART cap via data-action buttons; swipe gestures on the canvas.
 */

// ── Arcade deck buttons ──
(function setupTouchButtons() {
    const dirMap = {
        'up': [0, -1],
        'down': [0, 1],
        'left': [-1, 0],
        'right': [1, 0],
    };

    // Only data-action buttons are game controls. The ♪ and mute buttons also carry
    // .touch-btn for styling; preventing touchstart on them would suppress their click.
    document.querySelectorAll('.touch-btn[data-action]').forEach((btn) => {
        const action = btn.dataset.action;

        const onStart = () => {
            btn.classList.add('pressed');
            const game = window.game;
            if (!game || !game.input) return;
            if (dirMap[action]) {
                game.input.onDirection(dirMap[action][0], dirMap[action][1]);
            } else if (action === 'restart') {
                game.input.onRestart();
            }
        };

        const onEnd = () => {
            btn.classList.remove('pressed');
        };

        btn.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            onStart();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            onEnd();
        }, { passive: false });

        btn.addEventListener('touchcancel', () => {
            onEnd();
        });

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            onStart();
        });

        btn.addEventListener('mouseup', () => {
            onEnd();
        });

        btn.addEventListener('mouseleave', () => {
            onEnd();
        });
    });
})();

// ── Swipe gestures on the canvas ──
(function setupSwipe() {
    const canvas = document.getElementById('gameCanvas');
    let startX = 0;
    let startY = 0;

    canvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        const game = window.game;
        if (!game || !game.input) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        const minSwipe = 20;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipe) {
                game.input.onDirection(deltaX > 0 ? 1 : -1, 0);
            }
        } else {
            if (Math.abs(deltaY) > minSwipe) {
                game.input.onDirection(0, deltaY > 0 ? 1 : -1);
            }
        }
    }, { passive: true });
})();
