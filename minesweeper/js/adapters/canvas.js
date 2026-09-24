/**
 * CanvasRendererAdapter — implements RendererPort.
 * Draws the board on canvas; HUD/overlay/high-scores on DOM.
 */
const CanvasRendererAdapter = {
    game: null,
    canvas: null,
    ctx: null,

    init(game) {
        this.game = game;
        this.canvas = document.getElementById('minesweeper-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        const preset = this.game.config;
        this.canvas.width = preset.cols * CELL_SIZE + BOARD_PADDING * 2;
        this.canvas.height = preset.rows * CELL_SIZE + BOARD_PADDING * 2;
    },

    // ── Board drawing ──
    beginFrame() {
        this.resize();
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#0d0714';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
    },

    drawBoard() {
        const board = this.game.board;
        if (!board) return;
        for (let r = 0; r < board.rows; r++) {
            for (let c = 0; c < board.cols; c++) {
                this.drawCell(board.cells[r][c], r, c);
            }
        }
        if (typeof cursor !== 'undefined' && cursor.active) {
            this.drawCursor(cursor.r, cursor.c);
        }
    },

    drawCursor(r, c) {
        const ctx = this.ctx;
        const x = BOARD_PADDING + c * CELL_SIZE;
        const y = BOARD_PADDING + r * CELL_SIZE;
        const size = CELL_SIZE - CELL_BORDER;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    },

    drawCell(cell, r, c) {
        const ctx = this.ctx;
        const x = BOARD_PADDING + c * CELL_SIZE;
        const y = BOARD_PADDING + r * CELL_SIZE;
        const size = CELL_SIZE - CELL_BORDER;

        if (cell.revealed) {
            ctx.fillStyle = CELL_COLORS.revealed;
            ctx.fillRect(x, y, size, size);
            ctx.strokeStyle = CELL_COLORS.revealedEdge;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
            if (cell.mine) {
                this.drawMine(x, y, size, cell.exploded);
            } else if (cell.adjacentMines > 0) {
                this.drawNumber(x, y, size, cell.adjacentMines);
            }
        } else {
            ctx.fillStyle = CELL_COLORS.hidden;
            ctx.fillRect(x, y, size, size);
            ctx.fillStyle = CELL_COLORS.hiddenEdge;
            ctx.fillRect(x, y, size, 2);
            ctx.fillRect(x, y, 2, size);
            if (cell.flagged) {
                this.drawFlag(x, y, size);
            }
        }
    },

    drawMine(x, y, size, exploded) {
        const ctx = this.ctx;
        const cx = x + size / 2;
        const cy = y + size / 2;
        const radius = size * 0.28;

        ctx.save();
        if (exploded) {
            ctx.shadowColor = CELL_COLORS.mineHit;
            ctx.shadowBlur = 12;
        }
        ctx.fillStyle = exploded ? CELL_COLORS.mineHit : CELL_COLORS.mine;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Spikes
        ctx.strokeStyle = exploded ? '#fff' : '#1a1028';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const inner = radius + 1;
            const outer = radius + size * 0.16;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            ctx.stroke();
        }
    },

    drawFlag(x, y, size) {
        const ctx = this.ctx;
        const cx = x + size / 2;
        const cy = y + size / 2;

        // Pole
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.3);
        ctx.lineTo(cx, cy + size * 0.3);
        ctx.stroke();

        // Flag
        ctx.fillStyle = CELL_COLORS.flagged;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.3);
        ctx.lineTo(cx + size * 0.3, cy - size * 0.15);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
    },

    drawNumber(x, y, size, n) {
        const ctx = this.ctx;
        const color = CELL_COLORS.number[n - 1] || '#e5e7eb';
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(size * 0.5)}px 'Press Start 2P', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(n), x + size / 2, y + size / 2 + 1);
    },

    // ── HUD (DOM) ──
    drawHud(game) {
        const minesEl = document.getElementById('mines');
        const timerEl = document.getElementById('timer');
        const diffEl = document.getElementById('difficulty-label');
        if (minesEl) minesEl.textContent = `Mines: ${game.minesRemaining()}`;
        if (timerEl) timerEl.textContent = `Time: ${game.time}`;
        if (diffEl) {
            diffEl.textContent = game.config.label;
            diffEl.style.color = game.config.color;
        }
    },

    drawTimer(seconds) {
        const timerEl = document.getElementById('timer');
        if (timerEl) timerEl.textContent = `Time: ${seconds}`;
    },

    // ── Overlay (DOM) ──
    showOverlay(type) {
        const overlay = document.getElementById('pause-overlay');
        const gameOverCard = document.getElementById('game-over-card');
        const title = document.getElementById('overlay-title');
        const gameOverTitle = document.getElementById('game-over-title');
        const difficultySelection = document.getElementById('difficulty-selection');
        const startBtn = document.getElementById('start-btn');
        const nameInputContainer = document.getElementById('name-input-container');
        if (!overlay) return;

        if (type === 'none') {
            overlay.style.display = 'none';
            if (gameOverCard) gameOverCard.style.display = 'none';
            if (nameInputContainer) nameInputContainer.style.display = 'none';
            return;
        }

        if (type === 'menu') {
            overlay.style.display = 'flex';
            if (gameOverCard) gameOverCard.style.display = 'none';
            if (title) title.textContent = 'MINESWEEPER';
            if (difficultySelection) difficultySelection.style.display = 'block';
            if (startBtn) startBtn.style.display = 'block';
            if (nameInputContainer) nameInputContainer.style.display = 'inline-block';
            return;
        }

        if (type === 'pause') {
            overlay.style.display = 'flex';
            if (gameOverCard) gameOverCard.style.display = 'none';
            if (title) title.textContent = 'PAUSA';
            if (difficultySelection) difficultySelection.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
            if (nameInputContainer) nameInputContainer.style.display = 'none';
            return;
        }

        if (type === 'won' || type === 'lost') {
            overlay.style.display = 'flex';
            if (gameOverCard) gameOverCard.style.display = 'flex';
            if (title) title.style.display = 'none';
            if (difficultySelection) difficultySelection.style.display = 'none';
            if (startBtn) startBtn.style.display = 'none';
            if (nameInputContainer) nameInputContainer.style.display = 'none';
            if (gameOverTitle) {
                if (type === 'won') {
                    gameOverTitle.textContent = '¡VICTORIA!';
                    gameOverTitle.style.color = '#4ade80';
                } else {
                    gameOverTitle.textContent = 'GAME OVER';
                    gameOverTitle.style.color = '#f87171';
                }
            }
            const finalScore = document.getElementById('final-score');
            const finalTime = document.getElementById('final-time');
            if (finalScore) finalScore.textContent = `Score: ${this.game.score}`;
            if (finalTime) finalTime.textContent = `Time: ${this.game.time}s`;
            this.renderHighScores(this.game.highScores);
            return;
        }
    },

    // ── High scores (DOM) ──
    renderHighScores(scores) {
        const table = document.getElementById('high-scores-list');
        if (!table) return;
        table.replaceChildren();
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.className = `hs-row-${index + 1}`;

            const rank = document.createElement('td');
            rank.className = 'hs-rank';
            rank.textContent = String(index + 1);

            const name = document.createElement('td');
            name.className = `hs-name ${this.game.getMedalClass(entry.name, entry.score)}`;
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
    },

    showNewHighScoreNotice() {
        const existing = document.getElementById('new-highscore-notice');
        if (existing) existing.remove();
        const notice = document.createElement('div');
        notice.id = 'new-highscore-notice';
        notice.textContent = '¡NUEVO RÉCORD!';
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    },
};
