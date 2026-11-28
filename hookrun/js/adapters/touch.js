/**
 * TouchAdapter — on-screen deck controls (GANCHO + SALTAR + DISPARAR + RESTART caps).
 * Only elements matching .touch-btn[data-action] are game controls.
 * The ♪ and mute buttons carry .touch-btn for styling; preventing their touchstart
 * would break their click.
 */
const TouchAdapter = {
    attach(input) {
        const bindings = {
            gancho: {
                onStart: () => input.onHookStart(),
                onEnd: () => input.onHookEnd(),
            },
            jump: {
                onStart: () => input.onJump(),
                onEnd: null,
            },
            shoot: {
                onStart: () => input.onShoot(),
                onEnd: null,
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
            // Keyboard activation (detail 0); pointers are handled by bindButton.
            // GANCHO is a hold control, so a click means nothing to it.
            if (!binding.onEnd) {
                btn.addEventListener('click', (e) => {
                    if (e.detail === 0) binding.onStart();
                });
            }
        });
    },

    bindButton(btn, onStart, onEnd) {
        // A mouse that merely passes over the control must not release it.
        let mouseHeld = false;

        btn.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.add('pressed');
            if (onStart) onStart();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            if (e.targetTouches.length > 0) return; // another finger still holds it
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        }, { passive: false });

        btn.addEventListener('touchcancel', (e) => {
            if (e.targetTouches.length > 0) return;
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });

        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            mouseHeld = true;
            btn.classList.add('pressed');
            if (onStart) onStart();
        });

        const releaseMouse = () => {
            if (!mouseHeld) return;
            mouseHeld = false;
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        };

        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            releaseMouse();
        });
        btn.addEventListener('mouseleave', releaseMouse);
    },
};
