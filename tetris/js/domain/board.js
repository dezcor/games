/**
 * Board geometry on the arena grid (ROWS x COLS, 0 = empty).
 * Pure domain: no DOM, storage, audio or time.
 */

const Board = {
    createGrid() {
        const arena = [];
        for (let row = 0; row < ROWS; row++) {
            const newRow = [];
            for (let col = 0; col < COLS; col++) {
                newRow[col] = 0;
            }
            arena.push(newRow);
        }
        return arena;
    },

    clear(grid) {
        grid.forEach((row) => row.fill(0));
    },

    /** True when the matrix placed at pos leaves the board or overlaps a locked cell. */
    collides(grid, matrix, pos) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0) {
                    if (pos.y + y >= ROWS || pos.x + x >= COLS || pos.y + y < 0 || pos.x + x < 0) {
                        return true;
                    }
                    if (grid[y + pos.y] && grid[y + pos.y][x + pos.x] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    /** Locks the matrix into the grid at pos. */
    merge(grid, matrix, pos) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    grid[y + pos.y][x + pos.x] = value;
                }
            });
        });
    },

    /** Indexes of completely filled rows, bottom-up (descending). */
    fullRows(grid) {
        const rows = [];
        for (let y = ROWS - 1; y >= 0; y--) {
            if (grid[y].every((value) => value !== 0)) {
                rows.push(y);
            }
        }
        return rows;
    },

    /** Removes the given rows and adds empty rows on top. */
    removeRows(grid, rows) {
        [...rows].sort((a, b) => b - a).forEach((y) => {
            grid.splice(y, 1);
        });
        for (let i = 0; i < rows.length; i++) {
            grid.unshift(new Array(COLS).fill(0));
        }
    },
};
