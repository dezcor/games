/**
 * TouchAdapter — on-screen controls.
 * Binds only `.touch-btn[data-action]` (the sound buttons also carry
 * `.touch-btn`, and cancelling their touchstart would break their click).
 */
const TouchAdapter = {
    attach(game, input) {
        const actions = {
            left: {
                onStart: () => input.setHeld('ArrowLeft', true),
                onEnd: () => input.setHeld('ArrowLeft', false),
            },
            right: {
                onStart: () => input.setHeld('ArrowRight', true),
                onEnd: () => input.setHeld('ArrowRight', false),
            },
            down: {
                onStart: () => input.setHeld('ArrowDown', true),
                onEnd: () => input.setHeld('ArrowDown', false),
            },
            rotate: {
                onStart: () => {
                    if (game.canPlay()) game.queueRotation();
                },
            },
            drop: {
                onStart: () => {
                    if (game.canPlay()) game.hardDrop();
                },
            },
            restart: {
                onStart: () => game.restart(),
            },
        };

        document.querySelectorAll('.touch-btn[data-action]').forEach((btn) => {
            const action = actions[btn.dataset.action];
            if (action) {
                this.bindButton(btn, action.onStart, action.onEnd);
            }
        });
    },

    bindButton(btn, onStart, onEnd) {
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
        btn.addEventListener('touchcancel', () => {
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
        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });
    },
};
