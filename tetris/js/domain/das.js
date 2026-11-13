/**
 * Delayed Auto Shift: held-key repeat with an initial delay, then a fast rate.
 * Pure domain: the held state is passed in by the caller each frame.
 */

class DelayedAutoShift {
    constructor() {
        this.reset();
    }

    reset() {
        this.states = { left: 'idle', right: 'idle', down: 'idle' };
        this.timers = { left: 0, right: 0, down: 0 };
    }

    /**
     * Advances one direction by one frame.
     * @param {string} direction 'left' | 'right' | 'down'
     * @param {boolean} isHeld whether the key is currently down
     * @param {function} action called when the piece should move
     */
    update(direction, isHeld, action) {
        const state = this.states[direction];

        if (isHeld) {
            if (state === 'idle') {
                action();
                this.states[direction] = 'das_wait';
                this.timers[direction] = 0;
            } else if (state === 'das_wait') {
                this.timers[direction]++;
                if (this.timers[direction] >= DAS_DELAY) {
                    action();
                    this.states[direction] = 'arr';
                    this.timers[direction] = 0;
                }
            } else if (state === 'arr') {
                this.timers[direction]++;
                if (this.timers[direction] >= ARR_RATE) {
                    action();
                    this.timers[direction] = 0;
                }
            }
        } else {
            this.states[direction] = 'idle';
            this.timers[direction] = 0;
        }
    }
}
