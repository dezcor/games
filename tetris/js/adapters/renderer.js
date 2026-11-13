/**
 * TetrisRendererAdapter — implements RendererPort.
 * Canvas drawing for the board and next-piece preview, plus the DOM HUD,
 * overlays, banners, high score table and the North theme class.
 */
const TetrisRendererAdapter = {
    canvas: null,
    context: null,
    nextCanvas: null,
    nextContext: null,

    init() {
        this.canvas = document.getElementById('tetris');
        this.context = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextContext = this.nextCanvas.getContext('2d');

        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;

        this.context.scale(BLOCK_SIZE, BLOCK_SIZE);
        this.nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);
    },

    draw(view) {
        const ctx = this.context;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, COLS, ROWS);

        this.drawMatrix(view.grid, { x: 0, y: 0 });

        // Clear flash (single fading frame per cleared row)
        view.clearingRows.forEach((row) => {
            ctx.globalAlpha = row.alpha > 0.5 ? 1.0 : row.alpha * 2;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, row.y, COLS, 1);
            ctx.globalAlpha = 1.0;
        });

        // Ghost piece
        ctx.globalAlpha = 0.3;
        this.drawMatrix(view.ghost.matrix, view.ghost.pos);
        ctx.globalAlpha = 1.0;

        // Active piece (rotation animation when a rotation snapshot is present)
        const piece = view.piece;
        if (piece.rotation) {
            const from = piece.rotation.from;
            const cols = from[0].length;
            const rows = from.length;
            const centerX = piece.pos.x + cols / 2;
            const centerY = piece.pos.y + rows / 2;
            const angle = (1 - piece.rotation.progress) * Math.PI / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            this.drawMatrix(from, { x: -cols / 2, y: -rows / 2 });
            ctx.restore();
        } else {
            this.drawMatrix(piece.matrix, piece.pos);
        }

        // Next piece preview
        const nctx = this.nextContext;
        nctx.fillStyle = '#000';
        nctx.fillRect(0, 0, 4, 4);
        if (view.next) {
            const offsetX = Math.round((4 - view.next[0].length) / 2);
            const offsetY = Math.round((4 - view.next.length) / 2);
            this.drawMatrix(view.next, { x: offsetX, y: offsetY }, nctx);
        }
    },

    drawMatrix(matrix, offset, ctx = this.context) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    ctx.fillStyle = COLORS[value] || '#fff';
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                } else {
                    ctx.strokeStyle = '#111';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    },

    updateHud(score, level) {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${score}`;
        }
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = `Level: ${level}`;
        }
    },

    setBestScore(value) {
        const bestScoreEl = document.getElementById('best-score-value');
        if (bestScoreEl) {
            bestScoreEl.textContent = value;
        }
    },

    showComboBanner(label, points) {
        const banner = document.getElementById('combo-banner');
        if (!banner) return;
        banner.textContent = `${label}  +${points}`;
        banner.classList.remove('show');
        void banner.offsetWidth; // restart animation
        banner.classList.add('show');
    },

    showNewHighScore(text) {
        const existing = document.getElementById('new-highscore-notice');
        if (existing) {
            existing.remove();
        }

        const notice = document.createElement('div');
        notice.id = 'new-highscore-notice';
        notice.textContent = text;
        this.canvas.parentElement.appendChild(notice);

        setTimeout(() => {
            notice.remove();
        }, NOTICE_DURATION_MS);
    },

    setOverlayVisible(visible) {
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.style.display = visible ? 'flex' : 'none';
        }
    },

    setOverlayTitle(text) {
        const overlayTitle = document.getElementById('overlay-title');
        if (overlayTitle) {
            overlayTitle.textContent = text;
        }
    },

    setStartButtonVisible(visible) {
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.style.display = visible ? 'block' : 'none';
        }
    },

    setHighScores(entries) {
        const tableContainer = document.getElementById('high-scores-table');
        const table = document.getElementById('high-scores-list');
        if (!tableContainer || !table || entries.length === 0) {
            return;
        }

        table.replaceChildren();
        const medals = ['🥇', '🥈', '🥉', '4.', '5.'];

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
        if (highScoresTable) {
            highScoresTable.style.display = 'none';
        }
    },

    setNorthTheme(on) {
        document.body.classList.toggle('north-theme', on);
    },

    getPlayerName() {
        const nameInput = document.getElementById('player-name');
        return nameInput ? nameInput.value : '';
    },

    setPlayerName(name) {
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.value = name;
        }
    },

    /** Wiring helper for the composition root: fires on every name edit. */
    onPlayerNameInput(callback) {
        const nameInput = document.getElementById('player-name');
        if (nameInput) {
            nameInput.addEventListener('input', callback);
        }
    },

    alertGameOver() {
        alert('Game Over! Press R to restart');
    },
};
