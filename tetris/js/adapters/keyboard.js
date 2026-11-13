/**
 * KeyboardAdapter — implements InputPort (held keys) and maps keyboard
 * commands onto the game.
 *
 * Held keys (arrows) feed the DAS system. Commands:
 *   Enter            start (before the game has started)
 *   R                restart
 *   P / Escape       pause toggle
 *   ArrowUp          rotate
 *   Space            hard drop
 */
const KeyboardAdapter = {
    held: {},

    isHeld(code) {
        return !!this.held[code];
    },

    setHeld(code, value) {
        this.held[code] = value;
    },

    attach(game) {
        window.addEventListener('keydown', (e) => {
            this.setHeld(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.setHeld(e.code, false);
        });

        document.addEventListener('keydown', (e) => {
            this.handleCommand(game, e);
        });
    },

    handleCommand(game, e) {
        if (!game.isStarted()) {
            if (e.key === 'Enter') {
                game.startGame();
            }
            return;
        }
        if (e.key === 'r' || e.key === 'R') {
            game.restart();
            return;
        }
        if (game.isGameOver()) return;
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
            game.togglePause();
            return;
        }
        if (e.key === 'ArrowUp') {
            game.queueRotation();
        } else if (e.key === ' ') {
            game.hardDrop();
        }
    },
};
