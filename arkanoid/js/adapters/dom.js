/**
 * DomHudAdapter — implements HudPort (HUD text, overlay, high-score table, name field).
 * DomControlsAdapter — binds the START / PAUSE buttons and the name field to the domain.
 */
const DomHudAdapter = {
    updateHud(hud) {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const livesEl = document.getElementById('lives');
        if (scoreEl) scoreEl.textContent = `Score: ${hud.score}`;
        if (levelEl) levelEl.textContent = `Level: ${hud.level}`;
        if (livesEl) livesEl.textContent = `Lives: ${hud.lives}`;
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

    alertGameOver() {
        alert('Game Over! Press R to restart');
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
    },
};
