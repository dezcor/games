/**
 * Mirrors the keyboard on the on-screen controls: while a key is held, every
 * control that lists it in `data-keys` (space-separated KeyboardEvent.code
 * values, e.g. data-keys="ArrowLeft KeyA") gets the same `pressed` class the
 * touch handlers use, so caps sink and the joystick tilts.
 * Purely visual: the games keep handling the keys themselves.
 */
(function () {
    const byKey = new Map();

    document.querySelectorAll('[data-keys]').forEach((el) => {
        el.dataset.keys.split(/\s+/).filter(Boolean).forEach((code) => {
            if (!byKey.has(code)) byKey.set(code, []);
            byKey.get(code).push(el);
        });
    });

    if (!byKey.size) return;

    const held = new Set();

    function isTyping(target) {
        return target instanceof HTMLElement &&
            (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    }

    function refresh(el) {
        const down = el.dataset.keys.split(/\s+/).some((code) => held.has(code));
        el.classList.toggle('pressed', down);
    }

    function release(code) {
        if (!held.delete(code)) return;
        (byKey.get(code) || []).forEach(refresh);
    }

    // Capture phase: a game that stops propagation must not hide the key from us
    window.addEventListener('keydown', (e) => {
        if (e.repeat || !byKey.has(e.code) || isTyping(e.target)) return;
        held.add(e.code);
        byKey.get(e.code).forEach(refresh);
    }, true);

    window.addEventListener('keyup', (e) => release(e.code), true);

    // Keys released while the window is unfocused never send keyup
    window.addEventListener('blur', () => [...held].forEach(release));
})();
