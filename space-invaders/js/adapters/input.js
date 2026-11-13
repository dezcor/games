/**
 * InputAdapter — implements InputPort.
 * Holds the held-key state written by the keyboard and touch adapters.
 */
const InputAdapter = {
    keys: {},

    // Kept from the original input.js; not called by the game (see the migration report).
    dasLeft: { _pressed: false, _timer: 0, _state: 'idle', key: 'ArrowLeft' },
    dasRight: { _pressed: false, _timer: 0, _state: 'idle', key: 'ArrowRight' },

    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => this.clear());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.clear();
        });
    },

    isDown(code) {
        return !!this.keys[code];
    },

    setDown(code, value) {
        this.keys[code] = value;
    },

    clear() {
        Object.keys(this.keys).forEach((key) => {
            this.keys[key] = false;
        });

        [this.dasLeft, this.dasRight].forEach((direction) => {
            direction._pressed = false;
            direction._timer = 0;
            direction._state = 'idle';
        });

        document.querySelectorAll('.touch-btn.pressed').forEach((button) => {
            button.classList.remove('pressed');
        });
    },

    handleDAS(direction, action) {
        const keyCode = direction.key;
        const isDown = this.keys[keyCode];

        if (isDown) {
            if (!direction._pressed) {
                action();
                direction._pressed = true;
                direction._timer = 0;
                direction._state = 'das_wait';
            } else if (direction._state === 'das_wait') {
                direction._timer++;
                if (direction._timer >= 8) {
                    action();
                    direction._state = 'arr';
                    direction._timer = 0;
                }
            } else if (direction._state === 'arr') {
                direction._timer++;
                if (direction._timer >= 3) {
                    action();
                    direction._timer = 0;
                }
            }
        } else {
            direction._pressed = false;
            direction._timer = 0;
            direction._state = 'idle';
        }
    },
};
