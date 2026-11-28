/**
 * InputPort — inbound commands the adapters send to the domain.
 * Implemented by HookrunGame (domain/game.js); adapters receive it via attach(input).
 * Keyboard, touch and DOM controls all go through these methods.
 */
const InputPort = {
    /** GANCHO hold pressed (arrow keys / ↑). */
    onHookStart() {},
    /** GANCHO hold released (arrow keys / ↑). */
    onHookEnd() {},
    /** DISPARAR / Space pressed. */
    onShoot() {},
    /** Flow keys (Enter, R, P, Escape). Space is handled by onShoot. @param {string} key */
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
