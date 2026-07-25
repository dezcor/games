# Games Hub

Static HTML/JS/CSS games collection (Snake, Tetris, Arkanoid, Asteroids, Space Invaders). No build tools, no dependencies, no tests.

## Serve locally

```sh
# Any static server works, e.g.:
python3 -m http.server 8000
npx serve .
```

## Structure

- `index.html` — games hub listing (links to all games)
- `snake/` — self-contained Snake game
  - Scripts loaded in order: `sound.js` → `game.js`
  - `SnakeGame` class extends `Game` base
- `tetris/` — Tetris with modular JS
  - Script load order (HTML order): `constants.js` → `tetriminos.js` → `input.js` → `sound.js` → `game.js`
  - Flat functions (no classes), module-level state (`player`, `grid`, `keys`)
  - Board: 12×20 grid, 20px blocks
- `arkanoid/` — Arkanoid/Breakout with levels
  - Script load order: `constants.js` → `bricks.js` → `input.js` → `sound.js` → `game.js`
  - Flat functions, module-level state
  - 3 levels with different brick layouts, special bricks, power-ups
  - Board: 480×400 canvas
- `asteroids/` — Asteroids with power-ups, UFO, achievements
  - Script load order: `constants.js` → `input.js` → `sound.js` → `game.js`
  - Single class-style `game = { ... }` object with methods
  - Board: 800×600 canvas
  - 4 difficulty presets, ship skins, 5 achievements, tutorial
- `space-invaders/` — Space Invaders with levels
  - Script load order: `constants.js` → `input.js` → `sound.js` → `game.js`
  - Flat functions, module-level state
  - Aliens speed up as fewer remain, difficulty increases per level
  - Board: 240×400 canvas

## Game controls

**Snake:** Arrow keys / WASD to steer, Space to restart after game over. Direction reversal blocked.

**Tetris:** ← → ↓ to move, ↑ to rotate, Space hard-drop, P / Escape pause, R restart, Enter start. DAS/ARR input system (170ms delay, 50ms repeat).

**Arkanoid:** ← → to move paddle, P / Escape pause, R restart, Enter start. Mouse controls paddle position.

**Asteroids:** ←/→ or A/D to rotate, ↑/W to thrust, Space to shoot, H for hyperspace, P / Escape pause, R restart, Enter start. Pinch-zoom (1x-2x) and double-tap reset on the canvas in portrait orientation.

**Space Invaders:** ← → or A/D to move, Space/Enter to shoot, P / Escape pause, R restart, Enter start.

## Audio

All games use Web Audio API with synthesized oscillators (no audio files). `SoundManager` handles SFX, `MusicPlayer` handles BGM via scheduler. Each game has its own duplicated copy.

Audio requires a user gesture to start (browser autoplay policy). All games call `SoundManager.ensureAudio()` on first sound play.

Volume (SFX + BGM) and mute states are persisted per game in `localStorage` for all 5 games.

## localStorage keys

- `snakeHighScore` — Snake high score (number)
- `snake_audio_volume` / `snake_sfx_muted` — Snake audio prefs
- `tetris_highscores` — Tetris top 5 (JSON array)
- `tetris_player_name` — Tetris player name (string)
- `tetris_audio_volume` / `tetris_sfx_muted` / `tetris_bgm_volume` / `tetris_bgm_muted` — Tetris audio prefs
- `arkanoid_highscores` — Arkanoid top 5 (JSON array)
- `arkanoid_player_name` — Arkanoid player name (string)
- `arkanoid_audio_volume` / `arkanoid_sfx_muted` / `arkanoid_bgm_volume` / `arkanoid_bgm_muted` — Arkanoid audio prefs
- `si_highscores` — Space Invaders top 5 (JSON array)
- `si_player_name` — Space Invaders player name (string)
- `si_audio_volume` / `si_sfx_muted` / `si_bgm_volume` / `si_bgm_muted` — Space Invaders audio prefs
- `asteroid_highscores` / `asteroid_player_name` — Asteroids high scores + name
- `asteroid_audio_volume` / `asteroid_sfx_muted` / `asteroid_bgm_volume` / `asteroid_bgm_muted` — Asteroids audio prefs
- `asteroid_difficulty` — Asteroids selected difficulty
- `asteroid_ship_skin` — Asteroids selected ship color (`cyan`/`amber`/`green`/`pink`/`white`/`magenta`)
- `asteroid_achievements` — Asteroids achievements map (JSON `{ id: { unlocked, date } }`)
- `asteroid_tutorial_dismissed` — Asteroids tutorial "do not show again" flag

## Easter egg

Tetris player name `JonSnow` / `Jon` / `JSnow` (case-insensitive, whitespace-stripped) activates a "North theme": GoT-flavored game over messages, blue accent color (`#88ccff`), and darker CSS theme.

In Asteroids, the same aliases (`jsnow` / `jonsnow` / `jon` / legacy `jsnof`) also grant a gold medal in the high scores table.

## Touch controls

All games have on-screen touch buttons using `touchstart`/`touchend` events with `e.preventDefault()`. Snake also supports swipe gestures on the canvas. Touch buttons toggle `keys` object state (DAS system in Tetris/Arkanoid/Space Invaders handles held keys).

## Design system

All games share:
- `Press Start 2P` + `Inter` fonts
- `#1a1028` background with radial gradient accent
- CRT scanline overlay (`body::after`)
- `fadeUp` entrance animation
- `backdrop-filter: blur()` on overlays
- Pill-shaped buttons and UI controls
- `rgba(255,255,255,0.06)` button backgrounds
- `#fbbf24` focus outlines
- `prefers-reduced-motion` support
- Identical sound control UI (mute SFX, mute BGM, volume slider)
- High scores table with medals, name, score, date
- `setupTouchButton()` helper for touch/mouse events

## No tests, no CI, no linting, no formatting config
