/**
 * KeyboardAdapter — feeds keyboard input into the domain.
 * Held keys (arrows) go to setHeld; flow keys (Enter, R, P, Escape) go to onKey.
 */
const KeyboardAdapter = {
    attach(input) {
        window.addEventListener('keydown', (e) => {
            input.setHeld(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            input.setHeld(e.code, false);
        });

        document.addEventListener('keydown', (e) => {
            input.onKey(e.key);
        });
    },
};
