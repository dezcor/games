/**
 * Tetromino shapes and matrix helpers.
 * Pure domain: no DOM, storage, audio or time.
 */

const PIECE_TYPES = 'IJLOSTZ';

const TETRIMINOS = {
    'I': {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: 'I',
    },
    'J': {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: 'J',
    },
    'L': {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: 'L',
    },
    'O': {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: 'O',
    },
    'S': {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        color: 'S',
    },
    'T': {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: 'T',
    },
    'Z': {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        color: 'Z',
    },
};

const Pieces = {
    /** @param {{next: function(): number}} random RandomPort */
    randomType(random) {
        return PIECE_TYPES[(PIECE_TYPES.length * random.next()) | 0];
    },

    /** Builds a fresh matrix whose filled cells hold the piece type. */
    createMatrix(type) {
        const piece = TETRIMINOS[type];
        return piece.shape.map((row) => row.map((val) => (val !== 0 ? type : 0)));
    },

    /** Rotates in place: dir > 0 clockwise, otherwise counter-clockwise. */
    rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach((row) => row.reverse());
        } else {
            matrix.reverse();
        }
    },
};
