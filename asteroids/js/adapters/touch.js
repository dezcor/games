/**
 * Touch and mouse adapter for the on-screen deck. Binds only `.touch-btn[data-action]` elements
 * (the sound buttons also carry .touch-btn and must keep their native click).
 */
const TouchAdapter = {
    held: { left: false, right: false, thrust: false, shoot: false },
    controls: null,

    // Held-state for InputPort; keyboard state is merged in game.js.
    isHeld(code) {
        switch (code) {
            case 'ArrowLeft': return this.held.left;
            case 'ArrowRight': return this.held.right;
            case 'ArrowUp': return this.held.thrust;
            case 'Space': return this.held.shoot;
            default: return false;
        }
    },

    // controls: { getState(), hyperspace(), togglePause(), restart() }
    init(controls) {
        this.controls = controls;

        this.setupButton('[data-action="left"]',
            () => { this.held.left = true; },
            () => { this.held.left = false; }
        );
        this.setupButton('[data-action="right"]',
            () => { this.held.right = true; },
            () => { this.held.right = false; }
        );
        this.setupButton('[data-action="thrust"]',
            () => { this.held.thrust = true; },
            () => { this.held.thrust = false; }
        );
        this.setupButton('[data-action="shoot"]',
            () => { this.held.shoot = true; },
            () => { this.held.shoot = false; }
        );
        this.setupButton('[data-action="hyperespace"]',
            () => {
                if (this.controls.getState() === 'PLAYING') this.controls.hyperspace();
            },
            () => {}
        );
        this.setupButton('[data-action="pause"]',
            () => {
                const state = this.controls.getState();
                if (state === 'PLAYING' || state === 'PAUSED') this.controls.togglePause();
            },
            () => {}
        );
        this.setupButton('[data-action="restart"]',
            () => {
                if (['PLAYING', 'PAUSED', 'GAME_OVER'].includes(this.controls.getState())) this.controls.restart();
            },
            () => {}
        );
    },

    setupButton(selector, onStart, onEnd) {
        const btn = document.querySelector(`.touch-btn${selector}`);
        if (!btn) return;

        btn.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.add('pressed');
            if (onStart) onStart();
        }, { passive: false });

        btn.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        }, { passive: false });

        btn.addEventListener('touchcancel', () => {
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });

        // Mouse fallback
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            btn.classList.add('pressed');
            if (onStart) onStart();
        });

        btn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });

        btn.addEventListener('mouseleave', () => {
            btn.classList.remove('pressed');
            if (onEnd) onEnd();
        });
    },
};
