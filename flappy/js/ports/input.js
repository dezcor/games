/**
 * InputPort - inbound commands the adapters send to the domain.
 * Implemented by FlappyGame (domain/game.js); adapters receive it via attach(input).
 * Keyboard, touch and DOM controls all go through these methods.
 */
const InputPort = {
    /** Flap pressed (Space / FLAP cap / board press). Starts the lift burst. */
    onFlapStart() {},
    /** Flap released (Space up / cap up / board release). Stops the lift. */
    onFlapEnd() {},
    /** Keydown flow keys (Enter, R, P, Escape). Space is handled by onFlapStart/onFlapEnd. @param {string} key KeyboardEvent.key */
    onKey(key) {},
    /** START button. */
    onStart() {},
    /** Pause button (or P / Escape). */
    onTogglePause() {},
    /** RESTART cap (or R). */
    onRestart() {},
    /** MODE cap (or M): switch hold / classic flap. */
    onToggleMode() {},
    /** Player name field changed. @param {string} name */
    setPlayerName(name) {},
};
