/**
 * Player — pure hunter state machine.
 * No DOM, no storage, no audio. The composition root drives tick().
 *
 * The hunter auto-runs at a fixed screen position (PLAYER_X). Obstacles scroll
 * left; hooking freezes the world, the hunter swings over the obstacle, drops,
 * lands and re-centers.
 *
 * Hook phases (game freezes while active):
 *   fly → latch → hoist → swing → fall → recenter → ground
 * The hoist lifts the hunter straight up at PLAYER_X; the swing is a point
 * pendulum (feet as the mass) about the plank; release fires on the gate
 * (feet past the obstacle's right edge) or after HOOK_MAX_HANG — the figure
 * drops straight down from the gate pose.
 */
const Player = {
    /** @returns {Object} a fresh hunter state */
    create() {
        return {
            x: PLAYER_X,
            feetY: GROUND_Y,
            phase: 'ground',
            phaseTime: 0,
            holdTime: 0,            // total hook time (fly+latch+hoist+swing)
            anchorX: 0,             // plank x (frozen obstacle)
            anchorY: PLANK_Y,       // plank y
            swingR: 0,               // pendulum radius (feet → plank)
            swingTheta: 0,           // angle from vertical (rad) at swing start
            omega: 0,                // swing angular velocity (rad/s)
            theta: 0,                // current swing angle
            fallVY: 0,                // fall vertical velocity (px/s, positive down)
            recenterFromX: 0,        // x the recenter tween started from
            recenterDuration: 0.4,
            cooldown: 0,             // fire cooldown remaining (s)
            lastSwingFeetX: 0,       // for the renderer
            lastSwingFeetY: 0,       // for the renderer
            runPhase: 0,
        };
    },

    /** Lift the swing to the START of the hang. */
    startHook(player, anchorX) {
        player.anchorX = anchorX;
        player.anchorY = PLANK_Y;
        player.swingR = 0;
        player.holdTime = 0;
        player.phase = 'fly';
        player.phaseTime = 0;
        player.omega = SWING_OMEGA0;
        player.cooldown = Math.max(player.cooldown, 0);
    },

    /** Cancel the hook before the swing (fly/latch/hoist) — the hunter just drops. */
    cancelHook(player) {
        player.phase = 'fall';
        player.phaseTime = 0;
        player.fallVY = 0;
        player.recenterFromX = player.x;
    },

    /** One physics step. dt in seconds. Never touches the DOM. */
    step(player, dt, gateX) {
        player.holdTime += dt;
        player.phaseTime += dt;
        if (player.cooldown > 0) player.cooldown = Math.max(0, player.cooldown - dt);

        switch (player.phase) {
            case 'ground': {
                player.x = PLAYER_X;
                player.feetY = GROUND_Y;
                player.omega = 0;
                player.runPhase += dt * 8;
                break;
            }
            case 'fly': {
                if (player.phaseTime >= HOOK_FLY_TIME) {
                    player.phase = 'latch';
                    player.phaseTime = 0;
                }
                break;
            }
            case 'latch': {
                if (player.phaseTime >= HOOK_LATCH_TIME) {
                    player.phase = 'hoist';
                    player.phaseTime = 0;
                }
                break;
            }
            case 'hoist': {
                const progress = Math.min(1, player.phaseTime / HOOK_HOIST_TIME);
                // Crane-style lift: feet stay at PLAYER_X, rise toward the swing pose.
                player.feetY = GROUND_Y + (HOIST_END_FEET_Y - GROUND_Y) * progress;
                player.x = PLAYER_X;
                if (progress >= 1) {
                    player.swingR = Math.hypot(PLAYER_X - player.anchorX, HOIST_END_FEET_Y - player.anchorY);
                    player.swingTheta = Math.atan2(PLAYER_X - player.anchorX, HOIST_END_FEET_Y - player.anchorY);
                    player.theta = player.swingTheta;
                    player.phase = 'swing';
                    player.phaseTime = 0;
                    player.omega = SWING_OMEGA0;
                }
                break;
            }
            case 'swing': {
                // Pendulum about the plank. Feet = pivot + swingR * (sinθ, cosθ).
                const alpha = -(SWING_GRAVITY / player.swingR) * Math.sin(player.theta) - SWING_DAMPING * player.omega;
                player.omega += alpha * dt;
                player.theta += player.omega * dt;
                const feetX = player.anchorX + player.swingR * Math.sin(player.theta);
                const feetY = player.anchorY + player.swingR * Math.cos(player.theta);
                player.lastSwingFeetX = feetX;
                player.lastSwingFeetY = feetY;
                player.x = feetX;
                player.feetY = feetY;
                if (feetX > gateX || player.holdTime >= HOOK_MAX_HANG) {
                    // Released: drop straight down from the gate/timeout pose.
                    player.phase = 'fall';
                    player.phaseTime = 0;
                    player.fallVY = 0;
                    player.recenterFromX = player.x;
                }
                break;
            }
            case 'fall': {
                // Free fall straight down; the world resumes when the hunter lands.
                player.fallVY = Math.min(900, player.fallVY + PLAYER_FALL_GRAVITY * dt);
                player.feetY += player.fallVY * dt;
                if (player.feetY >= GROUND_Y) {
                    player.feetY = GROUND_Y;
                    player.recenterFromX = player.x;
                    player.phase = 'recenter';
                    player.phaseTime = 0;
                    player.omega = 0;
                }
                break;
            }
            case 'recenter': {
                // Slide back to the run line; the world keeps scrolling.
                const progress = Math.min(1, player.phaseTime / player.recenterDuration);
                player.x = player.recenterFromX + (PLAYER_X - player.recenterFromX) * progress;
                player.feetY = GROUND_Y;
                if (progress >= 1) {
                    player.x = PLAYER_X;
                    player.phase = 'ground';
                    player.phaseTime = 0;
                }
                break;
            }
        }
        if (player.holdTime > HOOK_MAX_HANG && player.phase !== 'fall' && player.phase !== 'recenter' && player.phase !== 'ground') {
            // Safety net: never hang longer than the max hang.
            player.phase = 'fall';
            player.phaseTime = 0;
            player.fallVY = 0;
            player.recenterFromX = player.x;
        }
        return player;
    },

    /** @returns {boolean} true while the hook is engaged (fly..fall) */
    isHooking(player) {
        return player.phase !== 'ground' && player.phase !== 'recenter';
    },

    /** @returns {boolean} true while the hunter is airborne (mid-hook) */
    isAirborne(player) {
        return player.phase !== 'ground' && player.feetY < GROUND_Y - 2;
    },

    /** @returns {boolean} true while the hunter is grounded in the run line */
    isGrounded(player) {
        return player.phase === 'ground';
    },
};
