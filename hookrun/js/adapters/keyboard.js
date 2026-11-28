/**
 * KeyboardAdapter — feeds keyboard input into the domain.
 * Hold ↑ / W (or GANCHO) to hook, Space to fire the pellet; flow keys (Enter, R, P, Escape)
 * go to onKey.
 */
const KeyboardAdapter = {
    attach(input) {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                if (!e.repeat) {
                    e.preventDefault();
                    input.onHookStart();
                }
            }
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                input.onShoot();
            }
            input.onKey(e.key);
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                input.onHookEnd();
            }
        });

        // If the window loses focus the keyup never arrives.
        window.addEventListener('blur', () => input.onHookEnd());
    },
};
