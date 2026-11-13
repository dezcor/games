/**
 * Keyboard adapter: held-key state (for InputPort) and game shortcuts (R, Escape, Enter, H, tutorial keys).
 */
const KeyboardAdapter = {
    keys: {},

    // Held-key tracking. Runs at script load so keys are recorded from the start.
    track() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    },

    isHeld(code) {
        return !!this.keys[code];
    },

    // Shortcuts are bound after the sprites load, as in the original setupInput().
    // game: AsteroidsGame (state + commands); ui: DomUi (tutorial overlay).
    bindShortcuts(game, ui) {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (ui.isTutorialOpen()) {
                if (e.key === 'Escape') {
                    ui.closeTutorialFromCheckbox();
                    e.preventDefault();
                    return;
                }
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    ui.tutorialNext();
                    e.preventDefault();
                    return;
                }
                if (e.key === 'ArrowLeft') {
                    ui.tutorialPrev();
                    e.preventDefault();
                    return;
                }
                return;
            }
            if (e.key === 'r' || e.key === 'R') {
                if (game.state === 'PLAYING' || game.state === 'PAUSED' || game.state === 'GAME_OVER') {
                    game.resetGame();
                }
            } else if (e.key === 'Escape') {
                if (game.state === 'PLAYING' || game.state === 'PAUSED') {
                    game.togglePause();
                }
            } else if (e.key === 'Enter') {
                if (game.state === 'MENU' || game.state === 'GAME_OVER') {
                    game.startGame();
                }
            } else if (e.key === 'h' || e.key === 'H') {
                if (game.state === 'PLAYING') {
                    game.tryHyperspace();
                }
            }
        });
    },
};
