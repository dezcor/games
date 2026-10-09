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
- `shared/arcade.css` — cabinet kit used by the games: round caps (`.cap`), joystick (`.joystick`), control deck (`.deck`), printed labels (`.arcade-key`), top bar (`.top-bar`) with the sound popover. Each game sets its palette and fonts as `:root` tokens.
- `shared/sound-menu.js` — toggles the sound popover (`#sound-controls`) opened by the `.sound-toggle` button.
- `snake/` — self-contained Snake game (only shared file: `../shared/arcade.css`)
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

All games have on-screen touch controls made of `.touch-btn[data-action]` elements, using `touchstart`/`touchend` events with `e.preventDefault()`. Directional input is a joystick: four `.joy-zone` wedges (`joy-up/right/down/left`, or only `joy-left`/`joy-right` inside `.joystick--h` for paddles). Actions are round arcade caps (`.cap`) inside an `.arcade-key` wrapper with a printed `.arcade-label`. A pressed control gets the `pressed` class, which tilts the stick through sibling selectors. Keep `data-action` values in sync with the JS handlers. Snake also supports swipe gestures on the canvas. Touch buttons toggle `keys` object state (DAS system in Tetris/Arkanoid/Space Invaders handles held keys).

## Sprite loading

Asteroids and Space Invaders use SVG sprites loaded via a small `SpriteLoader` helper (defined inline at the top of each game's `game.js`). It fetches the SVG text, wraps it in a Blob URL, and loads it into an `Image` once; subsequent calls return from a `Map` cache. Draw code uses `ctx.drawImage(sprite, ...)` inside the existing canvas pipeline so `shadowBlur`/`globalAlpha`/`rotate`/`filter` keep working.

Assets live in `asteroids/sprites/` and `space-invaders/sprites/`:

- `asteroids/`: `ship.svg` (white, tinted per skin via `source-in` compositing), `asteroid.svg`, `ufo.svg`, `bullet.svg`, `ufo-bullet.svg`, `powerup-{shield,double,life}.svg`
- `space-invaders/`: `player.svg`, `alien-{small,medium,large}.svg`, `ufo.svg`, `bullet.svg`, `alien-bullet.svg`

The 6 ship skins in Asteroids share a single white `ship.svg` and are tinted per skin using `globalCompositeOperation = 'source-in'` with the skin color from the `SHIP_SKINS` array (via `getShipColor()` in `asteroids/js/game.js`). If a sprite fails to load (offline, 404), the code falls back to the previous canvas drawing so gameplay never breaks.

## Design system

Each game is an arcade cabinet with its own identity. Palette, fonts and board frame live in that game's stylesheet (`:root` tokens plus overrides). The physical parts come from `shared/arcade.css`: round caps with a barrel (`.cap` with `.c-*` colors, `.is-xl`/`.is-lg`/`.is-sm`, `.is-ring`, `.is-lit`), the metal bezel and printed label (`.arcade-key`), the joystick and the control deck (`.deck`). Snake, Tetris, Arkanoid, Space Invaders, Asteroids and Minesweeper use it. El Gato loads it for its caps. Una pregunta rara has no arcade controls on purpose.

Shared across games:
- Sound controls (mute SFX, mute BGM, volume slider) in a popover opened by the ♪ button in the top bar (`shared/sound-menu.js`), with persisted settings
- High scores table with medals, name, score, date (`.hs-*` classes)
- `setupTouchButton()` helper for touch/mouse events
- `prefers-reduced-motion` support and `:focus-visible` outlines
- Overlays that hide with `display` from the JS: keep the same ids, because the JS toggles them

Per-game identity:
- Snake: phosphor terminal (VT323), green screen and a red joystick ball
- Tetris: teal/coral neon (Orbitron) with a perspective grid; `North` theme overrides the tokens
- Arkanoid: steel frame and hazard stripes (Bungee), horizontal paddle joystick
- Space Invaders: cream 1978 cabinet with printed labels and a red FIRE cap (Press Start 2P)
- Asteroids: oscilloscope graticule and vector glow (Share Tech Mono)
- Minesweeper: olive field plates, hazard tape and stencil titles (Saira Stencil One); canvas numbers still use Press Start 2P
- El Gato: chalkboard and wooden frame (Caveat + Nunito)
- Una pregunta rara: midnight letter, serif type and ruled paper (Instrument Serif + Caveat)

## No tests, no CI, no linting, no formatting config
