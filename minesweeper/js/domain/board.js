/**
 * Minesweeper Board — pure domain logic.
 * No DOM, no localStorage, no audio. Depends only on primitives.
 */

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
];

function createCell() {
    return {
        mine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
        exploded: false,
    };
}

class Board {
    constructor(cols, rows, mines) {
        this.cols = cols;
        this.rows = rows;
        this.mines = mines;
        this.cells = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                row.push(createCell());
            }
            this.cells.push(row);
        }
        this.minesPlaced = false;
    }

    // ── Mine placement (guarantees the first click is safe) ──
    placeMines(safeR, safeC) {
        if (this.minesPlaced) return;
        const total = this.cols * this.rows;
        if (this.mines >= total) {
            // Degenerate: fill everything except the safe cell.
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    this.cells[r][c].mine = true;
                }
            }
            this.cells[safeR][safeC].mine = false;
            this.minesPlaced = true;
            this.computeAdjacency();
            return;
        }

        // Collect candidate cells (all except the safe cell and its neighbors).
        const candidates = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (r === safeR && c === safeC) continue;
                let adjacentToSafe = false;
                for (const [dr, dc] of DIRECTIONS) {
                    if (r + dr === safeR && c + dc === safeC) {
                        adjacentToSafe = true;
                        break;
                    }
                }
                if (!adjacentToSafe) candidates.push([r, c]);
            }
        }

        // Fisher-Yates shuffle and pick `mines` cells.
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = candidates[i];
            candidates[i] = candidates[j];
            candidates[j] = tmp;
        }
        for (let i = 0; i < this.mines; i++) {
            const [r, c] = candidates[i];
            this.cells[r][c].mine = true;
        }

        this.minesPlaced = true;
        this.computeAdjacency();
    }

    computeAdjacency() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                let count = 0;
                for (const [dr, dc] of DIRECTIONS) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (this.cells[nr][nc].mine) count++;
                    }
                }
                this.cells[r][c].adjacentMines = count;
            }
        }
    }

    inBounds(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    // ── Reveal with flood-fill for zero-adjacency cells ──
    reveal(r, c) {
        const cell = this.cells[r][c];
        if (!cell || cell.revealed || cell.flagged) return false;

        if (cell.mine) {
            cell.revealed = true;
            cell.exploded = true;
            return true; // hit a mine
        }

        this._floodReveal(r, c);
        return false;
    }

    _floodReveal(r, c) {
        const cell = this.cells[r][c];
        if (!cell || cell.revealed || cell.flagged) return;
        cell.revealed = true;
        if (cell.adjacentMines === 0) {
            for (const [dr, dc] of DIRECTIONS) {
                const nr = r + dr;
                const nc = c + dc;
                if (this.inBounds(nr, nc)) {
                    this._floodReveal(nr, nc);
                }
            }
        }
    }

    flag(r, c) {
        const cell = this.cells[r][c];
        if (!cell || cell.revealed) return false;
        cell.flagged = !cell.flagged;
        return cell.flagged;
    }

    unflag(r, c) {
        const cell = this.cells[r][c];
        if (!cell || !cell.flagged) return false;
        cell.flagged = false;
        return true;
    }

    // ── Chord: reveal neighbors of a flagged-surrounded number cell ──
    chord(r, c) {
        const cell = this.cells[r][c];
        if (!cell || !cell.revealed || cell.adjacentMines === 0) return false;

        let flaggedCount = 0;
        for (const [dr, dc] of DIRECTIONS) {
            const nr = r + dr;
            const nc = c + dc;
            if (this.inBounds(nr, nc) && this.cells[nr][nc].flagged) flaggedCount++;
        }
        if (flaggedCount !== cell.adjacentMines) return false;

        let hitMine = false;
        for (const [dr, dc] of DIRECTIONS) {
            const nr = r + dr;
            const nc = c + dc;
            if (this.inBounds(nr, nc)) {
                const neighbor = this.cells[nr][nc];
                if (neighbor.flagged) continue;
                if (neighbor.mine && !neighbor.revealed) {
                    neighbor.revealed = true;
                    neighbor.exploded = true;
                    hitMine = true;
                } else if (!neighbor.revealed) {
                    this._floodReveal(nr, nc);
                }
            }
        }
        return hitMine;
    }

    // ── Win detection: all non-mine cells revealed ──
    isWin() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r][c];
                if (!cell.mine && !cell.revealed) return false;
            }
        }
        return true;
    }

    // ── Auto-flag remaining mines after a win ──
    flagAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r][c];
                if (cell.mine && !cell.flagged) cell.flagged = true;
            }
        }
    }

    // ── Reveal all mines after a loss ──
    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.cells[r][c];
                if (cell.mine && !cell.revealed) {
                    cell.revealed = true;
                    cell.exploded = true;
                }
            }
        }
    }

    countFlags() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].flagged) count++;
            }
        }
        return count;
    }

    countRevealed() {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].revealed) count++;
            }
        }
        return count;
    }
}
