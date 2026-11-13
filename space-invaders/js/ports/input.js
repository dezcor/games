/**
 * InputPort — held-key state read by the domain each frame.
 * Keyboard and touch adapters write into it; the domain only reads.
 * Implemented by adapters/input.js.
 */
const InputPort = {
    /** @param {string} code KeyboardEvent.code style name, e.g. 'ArrowLeft', 'Space'. @returns {boolean} */
    isDown(code) {},
    /** Sets a held key state (used by touch buttons). */
    setDown(code, value) {},
    /** Releases every held key and clears pressed button styling. */
    clear() {},
};
