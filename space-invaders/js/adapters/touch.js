/**
 * TouchAdapter — drives InputPort and game actions from the on-screen controls.
 * Joystick zones set held keys; FIRE holds Space; PAUSE and RESTART call the game.
 */
const TouchAdapter = {
    init(game) {
        const bindings = {
            left: {
                start: () => InputAdapter.setDown('ArrowLeft', true),
                end: () => InputAdapter.setDown('ArrowLeft', false),
            },
            right: {
                start: () => InputAdapter.setDown('ArrowRight', true),
                end: () => InputAdapter.setDown('ArrowRight', false),
            },
            shoot: {
                start: () => InputAdapter.setDown('Space', true),
                end: () => InputAdapter.setDown('Space', false),
            },
            pause: {
                start: () => game.togglePause(),
                end: () => {},
            },
            restart: {
                start: () => game.resetGame(),
                end: () => {},
            },
        };

        // Only data-action buttons are game controls. The ♪ and mute buttons also carry
        // .touch-btn for styling; preventing touchstart on them would suppress their click.
        document.querySelectorAll('.touch-btn[data-action]').forEach((btn) => {
            const binding = bindings[btn.dataset.action];
            if (binding) this.setupButton(btn, binding.start, binding.end);
        });
    },

    setupButton(btn, onStart, onEnd) {
        let touchActive = false;

        btn.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            touchActive = true;
            btn.classList.add('pressed');
            if (onStart) onStart();
        }, { passive: false });
        btn.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            touchActive = false;
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        }, { passive: false });
        btn.addEventListener('touchcancel', () => {
            touchActive = false;
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });
        btn.addEventListener('mousedown', (e) => {
            if (touchActive) return;
            e.preventDefault();
            btn.classList.add('pressed');
            if (onStart) onStart();
        });
        btn.addEventListener('mouseup', (e) => {
            if (touchActive) return;
            e.preventDefault();
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });
        btn.addEventListener('mouseleave', () => {
            if (touchActive) return;
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });
    },
};
