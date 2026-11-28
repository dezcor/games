/**
 * Player — pure hunter state machine.
 * No DOM, no storage, no audio. The composition root drives tick().
 *
 * The hunter auto-runs at a fixed screen position (PLAYER_X). The world never
 * stops: hooking lifts the hunter, who hangs from the obstacle's plank while it
 * scrolls underneath, then drops once it is behind.
 *
 * Hook phases:
 *   fly → latch → hoist → swing → fall → ground
 * The hoist lifts the hunter straight up at PLAYER_X; during the swing the plank
 * travels from ahead to behind; release fires on the gate (the obstacle's right
 * edge, plus a margin, has passed the hunter) or after HOOK_MAX_HANG.
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
            anchorX: 0,             // plank x on screen (follows the obstacle)
            theta: 0,               // body tilt toward the plank (rad)
            fallVY: 0,              // fall vertical velocity (px/s, positive down)
            fallHeight: 0,          // height above ground where the last fall began
            runPhase: 0,
        };
    },

    /** Throw the hook at the plank. */
    startHook(player, anchorX) {
        player.anchorX = anchorX;
        player.holdTime = 0;
        player.theta = 0;
        player.phase = 'fly';
        player.phaseTime = 0;
    },

    /** Let go of the rope — the hunter drops straight down. */
    release(player) {
        player.phase = 'fall';
        player.phaseTime = 0;
        player.fallVY = 0;
        player.fallHeight = GROUND_Y - player.feetY;
    },

    /** Body tilt that follows the rope. */
    ropeTilt(player) {
        return SWING_TILT * Math.atan2(player.anchorX - player.x, player.feetY - PLANK_Y);
    },

    /** One physics step. dt in seconds. gateX is the plank-side release line. */
    step(player, dt, gateX) {
        player.phaseTime += dt;
        if (player.phase !== 'ground' && player.phase !== 'fall') player.holdTime += dt;

        switch (player.phase) {
            case 'ground': {
                player.x = PLAYER_X;
                player.feetY = GROUND_Y;
                player.runPhase += dt * 8;
                break;
            }
            case 'fly': {
                if (player.phaseTime >= HOOK_FLY_TIME) {
                    player.phase = 'latch';
                    player.phaseTime -= HOOK_FLY_TIME;
                }
                break;
            }
            case 'latch': {
                if (player.phaseTime >= HOOK_LATCH_TIME) {
                    player.phase = 'hoist';
                    player.phaseTime -= HOOK_LATCH_TIME;
                }
                break;
            }
            case 'hoist': {
                const progress = Math.min(1, player.phaseTime / HOOK_HOIST_TIME);
                // Ease-out lift: fast off the ground so the obstacle is cleared early.
                const eased = 1 - (1 - progress) * (1 - progress);
                player.feetY = GROUND_Y + (HOIST_END_FEET_Y - GROUND_Y) * eased;
                player.theta = Player.ropeTilt(player) * progress;
                if (progress >= 1) {
                    player.phase = 'swing';
                    player.phaseTime = 0;
                }
                break;
            }
            case 'swing': {
                // Pendulum dip: lowest when the plank is straight overhead.
                const angle = Math.atan2(player.anchorX - player.x, HOIST_END_FEET_Y - PLANK_Y);
                const blend = Math.min(1, player.phaseTime / SWING_BLEND_TIME);
                player.feetY = HOIST_END_FEET_Y + SWING_DIP * Math.max(0, Math.cos(angle)) * blend;
                player.theta = Player.ropeTilt(player);
                if (player.x > gateX || player.holdTime >= HOOK_MAX_HANG) {
                    Player.release(player);
                }
                break;
            }
            case 'fall': {
                player.fallVY = Math.min(900, player.fallVY + PLAYER_FALL_GRAVITY * dt);
                player.feetY += player.fallVY * dt;
                player.theta *= Math.max(0, 1 - 8 * dt);
                if (player.feetY >= GROUND_Y) {
                    player.feetY = GROUND_Y;
                    player.theta = 0;
                    player.phase = 'ground';
                    player.phaseTime = 0;
                }
                break;
            }
        }
        if (player.holdTime >= HOOK_MAX_HANG && player.phase !== 'fall' && player.phase !== 'ground') {
            // Safety net: never hang longer than the max hang.
            Player.release(player);
        }
        return player;
    },

    /** @returns {boolean} true while the hook is engaged (fly..fall) */
    isHooking(player) {
        return player.phase !== 'ground';
    },
};
