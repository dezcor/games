/**
 * DomHudAdapter — implements HudPort (HUD text, overlay, high-score table, name field).
 * DomControlsAdapter — binds the START / PAUSE buttons and the name field to the domain.
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

            const score = document.createElement('td');
            score.className = 'hs-score';
            score.textContent = String(entry.score);

            const date = document.createElement('td');
            date.className = 'hs-date';
            date.textContent = String(entry.date || '');

            row.append(rank, name, score, date);
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

    setNorthTheme(on) {
        document.body.classList.toggle('north-theme', on);
    },

    setFlapMode(mode) {
        const btn = document.querySelector('[data-action="mode"]');
        if (!btn) return;
        const classic = mode === MODE_CLASSIC;
        btn.dataset.mode = mode;
        btn.title = classic ? 'Switch to hold-to-rise mode' : 'Switch to classic flap mode';
        btn.setAttribute('aria-label', btn.title);
        const label = btn.parentElement && btn.parentElement.querySelector('.arcade-label');
        if (label) label.textContent = classic ? 'MODE · CLASSIC' : 'MODE · HOLD';
    },
};

const DomControlsAdapter = {
    attach(input) {
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

        // Tapping / clicking the board flaps (and starts or restarts a round).
        const board = document.getElementById('board-wrapper');
        if (!board) return;

        const isUiTarget = (target) => Boolean(
            target && target.closest && target.closest('button, input, a, #high-scores-table')
        );

        board.addEventListener('mousedown', (e) => {
            if (isUiTarget(e.target)) return;
            input.onFlapStart();
        });

        board.addEventListener('touchstart', (e) => {
            if (isUiTarget(e.target)) return;
            if (e.cancelable) e.preventDefault();
            input.onFlapStart();
        }, { passive: false });

        // Releasing anywhere (or losing focus) ends the lift so it never sticks.
        window.addEventListener('mouseup', () => input.onFlapEnd());
        window.addEventListener('touchend', () => input.onFlapEnd());
        window.addEventListener('touchcancel', () => input.onFlapEnd());
        window.addEventListener('blur', () => input.onFlapEnd());
    },
};
