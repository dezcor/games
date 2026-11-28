/**
 * DomHudAdapter — implements HudPort (HUD text, overlay, high-score table, name field).
 * DomControlsAdapter — binds the START / PAUSE buttons, the name field and the
 * board surface to the domain. Tapping the board fires the pellet (and starts the
 * round when not started, like Flappy).
 */
const DomHudAdapter = {
    updateHud(hud) {
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = `Score: ${hud.score}`;
    },

    setBest(best) {
        const bestScoreEl = document.getElementById('best-score-value');
        if (bestScoreEl) bestScoreEl.textContent = best;
    },

    setOverlayVisible(visible) {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) overlay.style.display = visible ? 'flex' : 'none';
    },

    setOverlayTitle(text) {
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) overlayTitle.textContent = text;
    },

    setStartButtonVisible(visible) {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.style.display = visible ? 'block' : 'none';
    },

    showHighScores(entries) {
        const tableContainer = document.getElementById('high-scores-table');
        const table = document.getElementById('high-scores-list');

        if (!tableContainer || !table || entries.length === 0) {
            return;
        }

        table.replaceChildren();
        const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '4.', '5.'];

        entries.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = medals[index];

            const name = document.createElement('td');
            name.className = 'hs-name';
            name.textContent = String(entry.name || '');

            const scoreCell = document.createElement('td');
            scoreCell.className = 'hs-score';
            scoreCell.textContent = String(entry.score);

            const date = document.createElement('td');
            date.className = 'hs-date';
            date.textContent = String(entry.date || '');

            row.append(rank, name, scoreCell, date);
            table.appendChild(row);
        });

        tableContainer.style.display = 'block';
    },

    hideHighScores() {
        const highScoresTable = document.getElementById('high-scores-table');
        if (highScoresTable) highScoresTable.style.display = 'none';
    },

    setPlayerName(name) {
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) playerNameInput.value = name;
    },
};

const DomControlsAdapter = {
    attach(input) {
        // A pointer click must not leave a button focused, or the next Space would
        // press it again instead of jumping. Keyboard clicks (detail 0) keep focus.
        document.addEventListener('click', (e) => {
            if (e.detail === 0 || !e.target.closest) return;
            const button = e.target.closest('button');
            if (button) button.blur();
        });

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => input.onStart());
        }

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => input.onTogglePause());
        }

        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.addEventListener('input', () => {
                input.setPlayerName(playerNameInput.value);
            });
        }

        // Tapping / clicking the board fires the pellet (and starts a round if not started).
        const board = document.getElementById('board-wrapper');
        if (!board) return;

        const isUiTarget = (target) => Boolean(
            target && target.closest && target.closest('button, input, a, #high-scores-table')
        );

        board.addEventListener('mousedown', (e) => {
            if (isUiTarget(e.target)) return;
            input.onShoot();
        });

        board.addEventListener('touchstart', (e) => {
            if (isUiTarget(e.target)) return;
            if (e.cancelable) e.preventDefault();
            input.onShoot();
        }, { passive: false });
    },
};
