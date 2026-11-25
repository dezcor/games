/**
 * KeyboardAdapter — feeds keyboard input into the domain.
 * Flow keys (Enter, R, P, Escape) go to onKey; Space is press/hold for the flap.
 */
const KeyboardAdapter = {
    attach(input) {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) input.onFlapStart();
            input.onKey(e.key);
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') input.onFlapEnd();
        });

        // If the window loses focus the keyup never arrives.
        window.addEventListener('blur', () => input.onFlapEnd());
    },
};
