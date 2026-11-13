/**
 * DomHudAdapter — implements HudPort.
 * Score/lives/combo text, overlays, buttons, banners, feedback and the high score table.
 * Also binds the player name field and the difficulty buttons.
 */
const DomHudAdapter = {
    updateHud({ score, lives, comboCount }) {
        const scoreEl = document.getElementById('score');
        const livesEl = document.getElementById('lives');
        const comboEl = document.getElementById('combo-display');
        if (scoreEl) scoreEl.textContent = `Score: ${score}`;
        if (livesEl) livesEl.textContent = `Lives: ${lives}`;
        if (comboEl) {
            comboEl.textContent = comboCount > 1 ? `Combo x${comboCount}` : '';
            comboEl.classList.toggle('active', comboCount > 1);
        }
    },

    setBest(best) {
        const bestScoreEl = document.getElementById('best-score-value');
        if (bestScoreEl) {
            bestScoreEl.textContent = best;
        }
    },

    setPauseControl({ label, paused }) {
        const pauseButton = document.getElementById('pause-btn');
        const touchPauseButton = document.querySelector('[data-action="pause"]');

        if (pauseButton) {
            pauseButton.textContent = label;
            pauseButton.setAttribute('aria-label', label);
            pauseButton.setAttribute('aria-pressed', String(paused));
        }
        if (touchPauseButton) {
            touchPauseButton.textContent = label === 'Resume' ? '>' : '||';
            touchPauseButton.setAttribute('aria-label', label);
            touchPauseButton.setAttribute('title', label);
            touchPauseButton.setAttribute('aria-pressed', String(paused));
        }
    },

    setOverlay({ visible, title }) {
        const overlay = document.getElementById('pause-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        if (overlay) {
            overlay.style.display = visible ? 'flex' : 'none';
        }
        if (overlayTitle) overlayTitle.textContent = title;
    },

    showStartButton() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.style.display = 'block';
    },

    hideStartButton() {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.style.display = 'none';
    },

    showGameOver({ score, level }) {
        const overlay = document.getElementById('pause-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const startBtn = document.getElementById('start-btn');
        const gameOverStats = document.getElementById('game-over-stats');
        const finalScore = document.getElementById('final-score');
        const finalLevel = document.getElementById('final-level');
        const quickRestartBtn = document.getElementById('quick-restart-btn');

        if (overlay) overlay.style.display = 'flex';
        if (startBtn) startBtn.style.display = 'none';
        if (overlayTitle) overlayTitle.textContent = 'GAME OVER';

        if (finalScore) finalScore.textContent = `Score: ${score}`;
        if (finalLevel) finalLevel.textContent = `Level: ${level}`;
        if (gameOverStats) gameOverStats.style.display = 'flex';
        if (quickRestartBtn) quickRestartBtn.style.display = 'block';
    },

    hideGameOverView() {
        const gameOverStats = document.getElementById('game-over-stats');
        if (gameOverStats) gameOverStats.style.display = 'none';

        const quickRestartBtn = document.getElementById('quick-restart-btn');
        if (quickRestartBtn) quickRestartBtn.style.display = 'none';
    },

    renderHighScores(highScores) {
        const tableContainer = document.getElementById('high-scores-table');
        const table = document.getElementById('high-scores-list');

        if (!tableContainer || !table) {
            return;
        }

        table.replaceChildren();
        const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '4.', '5.'];

        highScores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = medals[index];

            const name = document.createElement('td');
            name.className = 'hs-name';
            name.textContent = entry.name;

            const score = document.createElement('td');
            score.className = 'hs-score';
            score.textContent = String(entry.score);

            const date = document.createElement('td');
            date.className = 'hs-date';
            date.textContent = entry.date;

            row.append(rank, name, score, date);
            table.appendChild(row);
        });

        tableContainer.style.display = highScores.length > 0 ? 'block' : 'none';
    },

    hideHighScores() {
        const highScoresTable = document.getElementById('high-scores-table');
        if (highScoresTable) highScoresTable.style.display = 'none';
    },

    showNewHighScore() {
        const canvas = document.getElementById('invaders');
        const existing = document.getElementById('new-highscore-notice');
        if (existing) existing.remove();

        const notice = document.createElement('div');
        notice.id = 'new-highscore-notice';
        notice.textContent = 'NEW HIGH SCORE!';
        canvas.parentElement.appendChild(notice);

        setTimeout(() => notice.remove(), 2500);
    },

    showLevelBanner(text, color) {
        const banner = document.getElementById('level-banner');
        if (!banner) return;
        banner.textContent = text;
        banner.style.color = color || '#4ade80';
        banner.style.textShadow = `0 0 16px ${color || '#4ade80'}80, 0 0 32px ${color || '#4ade80'}40`;
        banner.style.display = 'block';
        banner.style.animation = 'none';
        banner.offsetHeight;
        banner.style.animation = 'bannerPop 1.8s ease-out forwards';
        setTimeout(() => { banner.style.display = 'none'; }, 1800);
    },

    showScoreFeedback(text, color = '#fbbf24') {
        const canvas = document.getElementById('invaders');
        const feedback = document.createElement('div');
        feedback.className = 'score-feedback';
        feedback.style.setProperty('--feedback-color', color);
        feedback.textContent = text;
        canvas.parentElement.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1500);
    },

    flashScore() {
        const scoreEl = document.getElementById('score');
        if (!scoreEl) return;
        scoreEl.classList.remove('score-flash');
        scoreEl.offsetHeight;
        scoreEl.classList.add('score-flash');
        setTimeout(() => scoreEl.classList.remove('score-flash'), 400);
    },

    restartBoardAnimation(className) {
        const boardWrapper = document.getElementById('board-wrapper');
        if (boardWrapper) {
            boardWrapper.classList.remove(className);
            boardWrapper.offsetHeight;
            boardWrapper.classList.add(className);
        }
    },

    bindPlayerName(repository) {
        const playerNameInput = document.getElementById('player-name');
        if (!playerNameInput) return;

        playerNameInput.value = repository.getSavedName();
        playerNameInput.addEventListener('input', () => {
            const sanitized = HighScoreRules.sanitizePlayerName(playerNameInput.value);
            if (playerNameInput.value !== sanitized) playerNameInput.value = sanitized;
            repository.savePlayerName(sanitized);
        });
    },

    bindDifficultyButtons(game, repository) {
        const container = document.getElementById('difficulty-buttons');
        if (!container) return;

        const savedDiff = repository.getSavedDifficulty();

        Object.keys(DIFFICULTY_PRESETS).forEach((diff) => {
            const btn = container.querySelector(`[data-diff="${diff}"]`);
            if (!btn) return;

            if (diff === savedDiff) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                if (game.gameStarted && !game.gameOver) return;
                if (!game.setDifficulty(diff)) return;

                Object.keys(DIFFICULTY_PRESETS).forEach((d) => {
                    const b = container.querySelector(`[data-diff="${d}"]`);
                    if (b) b.classList.remove('active');
                });
                btn.classList.add('active');
                repository.saveDifficulty(diff);

                if (!game.gameStarted || game.gameOver) {
                    game.initGame();
                    game.updateUI();
                }
            });
        });
    },
};
