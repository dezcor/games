/**
 * Minesweeper Game Constants
 */

// ── Difficulty Presets ──
const DIFFICULTY_PRESETS = {
    easy: {
        label: 'Fácil',
        color: '#4ade80',
        cols: 9,
        rows: 9,
        mines: 10,
    },
    normal: {
        label: 'Normal',
        color: '#fbbf24',
        cols: 16,
        rows: 16,
        mines: 40,
    },
    hard: {
        label: 'Difícil',
        color: '#f87171',
        cols: 16,
        rows: 24,
        mines: 70,
    },
};
const DEFAULT_DIFFICULTY = 'normal';

// ── Board / Rendering ──
const CELL_SIZE = 24;
const CELL_BORDER = 1;
const BOARD_PADDING = 8;

// ── Cell Colors ──
const CELL_COLORS = {
    hidden: '#2a1f3d',
    hiddenEdge: '#3a2c52',
    revealed: '#1f1830',
    revealedEdge: '#2a2140',
    flagged: '#fbbf24',
    mine: '#ef4444',
    mineHit: '#ff6b8a',
    number: ['#38bdf8', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee', '#e5e7eb', '#f472b6'],
};

// ── Score ──
const SCORE_PER_FLAG = 10;
const SCORE_PER_REVEAL = 5;
const WIN_BONUS = 500;

// ── Persistence Keys ──
const STORAGE_KEY = 'minesweeper_highscores';
const PLAYER_NAME_STORAGE = 'minesweeper_player_name';
const AUDIO_VOLUME_STORAGE = 'minesweeper_audio_volume';
const BGM_VOLUME_STORAGE = 'minesweeper_bgm_volume';
const SFX_MUTED_STORAGE = 'minesweeper_sfx_muted';
const BGM_MUTED_STORAGE = 'minesweeper_bgm_muted';
const DIFFICULTY_STORAGE = 'minesweeper_difficulty';

// ── Input Mapping ──
const INPUT_KEYS = {
    REVEAL: 'Enter',
    FLAG: 'f',
    RESTART: 'r',
    PAUSE: 'Escape',
    PAUSE_ALT: 'p',
    DIFF_EASY: '1',
    DIFF_NORMAL: '2',
    DIFF_HARD: '3',
};

// ── UI Classes ──
const UI_CLASSES = {
    OVERLAY_SHOW: 'overlay-show',
    DIFF_ACTIVE: 'active',
};

// ── BGM Intensity ──
const BGM_INTENSITY = {
    CALM: 0,
    NORMAL: 1,
    PANIC: 2,
};
const BGM_TEMPO = [100, 115, 130];
const BGM_VOLUME = [0.04, 0.08, 0.12];
