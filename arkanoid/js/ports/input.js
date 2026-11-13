/**
 * InputPort — inbound commands the adapters send to the domain.
 * Implemented by ArkanoidGame (domain/game.js); adapters receive it via attach(input).
 * Keyboard, pointer, touch and DOM controls all go through these methods.
 */
const InputPort = {
    /** Held-key state (keyboard and touch both write here). @param {string} code KeyboardEvent.code, e.g. 'ArrowLeft' @param {boolean} isDown */
    setHeld(code, isDown) {},
    /** Pointer position on the canvas in canvas pixels; the paddle centres on it. @param {number} canvasX */
    setPointerX(canvasX) {},
    /** Click on the canvas: start, or resume when paused. */
    onCanvasClick() {},
    /** Keydown flow keys (Enter, R, P, Escape). @param {string} key KeyboardEvent.key */
    onKey(key) {},
    /** START button. */
    onStart() {},
    /** Pause button (or P / Escape). */
    onTogglePause() {},
    /** RESTART cap (or R). */
    onRestart() {},
    /** Player name field changed. @param {string} name */
    setPlayerName(name) {},
};
