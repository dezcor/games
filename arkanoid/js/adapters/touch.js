/**
 * TouchAdapter — on-screen deck controls (joystick zones + RESTART cap).
 * Only elements matching .touch-btn[data-action] are game controls. The ♪ and mute
 * buttons carry .touch-btn for styling; preventing their touchstart would break their click.
 */
const TouchAdapter = {
    attach(input) {
        const bindings = {
            left: {
                onStart: () => input.setHeld('ArrowLeft', true),
                onEnd: () => input.setHeld('ArrowLeft', false),
            },
            right: {
                onStart: () => input.setHeld('ArrowRight', true),
                onEnd: () => input.setHeld('ArrowRight', false),
            },
            restart: {
                onStart: () => input.onRestart(),
                onEnd: null,
            },
        };

        document.querySelectorAll('.touch-btn[data-action]').forEach((btn) => {
            const binding = bindings[btn.dataset.action];
            if (!binding) return;
            this.bindButton(btn, binding.onStart, binding.onEnd);
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
