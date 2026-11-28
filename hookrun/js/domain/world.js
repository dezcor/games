/**
 * World — pure world state: obstacles, zombies, pellets, particles.
 * No DOM, no storage, no audio. Randomness via the RandomPort.
 *
 * Obstacles are stored in world (distance) coordinates so the world freezes
 * cleanly while the hook is engaged: screen x = worldX - distance.
 * Zombies and pellets are tracked in screen coordinates (they freeze with the world).
 */
const World = {
    /** @returns {Object} a fresh world state, simulating distance 0 */
    create() {
        return {
            distance: 0,
            nextObstacleWorldX: OBSTACLE_FIRST_DISTANCE,
            nextZombieWorldX: ZOMBIE_FIRST_DISTANCE,
            nextPursuerWorldX: PURSUER_FIRST_DISTANCE,
            obstacles: [],
            zombies: [],
            pellets: [],
            particles: [],
            kills: 0,
            hookedObstacle: null,
        };
    },

    reset(world) {
        const fresh = World.create();
        world.distance = fresh.distance;
        world.nextObstacleWorldX = fresh.nextObstacleWorldX;
        world.nextZombieWorldX = fresh.nextZombieWorldX;
        world.nextPursuerWorldX = fresh.nextPursuerWorldX;
        world.obstacles = fresh.obstacles;
        world.zombies = fresh.zombies;
        world.pellets = fresh.pellets;
        world.particles = fresh.particles;
        world.kills = fresh.kills;
        world.hookedObstacle = fresh.hookedObstacle;
        return world;
    },

    /** @returns {number} the current auto-run speed (px/s) at this distance */
    speed(world) {
        return Math.min(SPEED_CAP, BASE_SPEED + world.distance / SPEED_FACTOR);
    },

    /**
     * Advance the world by dt seconds. `frozen` freezes everything except the
     * caller (engaged during the hook so world and hunter never fight each other).
     */
    step(world, dt, random, frozen) {
        if (frozen) return;
        const dx = World.speed(world) * dt;
        world.distance += dx;
        World.spawnObstacles(world, random);
        World.spawnZombies(world, random);
        World.updatePellets(world, dt, random);
        World.updateZombies(world, dt);
        World.updateParticles(world, dt);
        World.prune(world);
    },

    /** Spawn obstacles ahead of the right edge of the screen. */
    spawnObstacles(world, random) {
        const horizon = world.distance + BOARD_WIDTH + 60;
        while (horizon >= world.nextObstacleWorldX) {
            const isWall = random.next() < 0.55;
            const width = isWall
                ? WALL_MIN_WIDTH + random.next() * (WALL_MAX_WIDTH - WALL_MIN_WIDTH)
                : PIT_MIN_WIDTH + random.next() * (PIT_MAX_WIDTH - PIT_MIN_WIDTH);
            const height = isWall
                ? WALL_MIN_HEIGHT + random.next() * (WALL_MAX_HEIGHT - WALL_MIN_HEIGHT)
                : 0;
            world.obstacles.push({
                type: isWall ? 'wall' : 'pit',
                worldX: world.nextObstacleWorldX,
                width: width,
                height: height,
                hooked: false,
            });
            const spacing = OBSTACLE_MIN_SPACING + random.next() * (OBSTACLE_MAX_SPACING - OBSTACLE_MIN_SPACING);
            world.nextObstacleWorldX = world.nextObstacleWorldX + width + spacing;
        }
    },

    /** Spawn route zombies (right edge) and pursuers (left edge). */
    spawnZombies(world, random) {
        const horizon = world.distance + BOARD_WIDTH + 80;
        if (horizon >= world.nextZombieWorldX) {
            world.zombies.push({
                x: BOARD_WIDTH + 20 + random.next() * 60,
                pursuer: false,
                walk: ZOMBIE_MIN_SPEED + random.next() * (ZOMBIE_MAX_SPEED - ZOMBIE_MIN_SPEED),
                phase: random.next() * 6.28,
            });
            world.nextZombieWorldX += ZOMBIE_MIN_SPACING + random.next() * (ZOMBIE_MAX_SPACING - ZOMBIE_MIN_SPACING);
        }
        if (horizon >= world.nextPursuerWorldX) {
            world.zombies.push({
                x: -30 - random.next() * 40,
                pursuer: true,
                walk: 0,
                phase: random.next() * 6.28,
            });
            world.nextPursuerWorldX += PURSUER_MIN_SPACING + random.next() * (PURSUER_MAX_SPACING - PURSUER_MIN_SPACING);
        }
    },

    updateZombies(world, dt) {
        const speed = World.speed(world);
        for (let i = world.zombies.length - 1; i >= 0; i--) {
            const z = world.zombies[i];
            if (z.pursuer) {
                z.x += PURSUER_SPEED * dt;
            } else {
                z.x -= (speed + z.walk) * dt;
            }
            z.phase += dt * 6;
            if (z.pursuer && z.x > BOARD_WIDTH + 80) world.zombies.splice(i, 1);
            else if (!z.pursuer && z.x < -90) world.zombies.splice(i, 1);
        }
    },

    /** Fire pellets from the gun; pellets travel in screen space and kill zombies. */
    fire(world, x, y) {
        const gunY = y - 22;
        world.pellets.push({ x: x, y: gunY, vx: PELLET_SPEED, traveled: 0 });
        world.pellets.push({ x: x, y: gunY, vx: -PELLET_SPEED, traveled: 0 });
        return world.pellets;
    },

    updatePellets(world, dt, random) {
        for (let i = world.pellets.length - 1; i >= 0; i--) {
            const p = world.pellets[i];
            p.x += p.vx * dt;
            p.traveled += Math.abs(p.vx) * dt;
            let hit = false;
            for (let j = world.zombies.length - 1; j >= 0; j--) {
                const z = world.zombies[j];
                if (Math.abs(p.x - z.x) < 18 && Math.abs(p.y - (GROUND_Y - 18)) < 28) {
                    world.zombies.splice(j, 1);
                    world.kills++;
                    World.burstParticles(world, z.x, GROUND_Y - 20, random);
                    hit = true;
                    break;
                }
            }
            if (hit) {
                world.pellets.splice(i, 1);
                continue;
            }
            if (p.traveled >= PELLET_RANGE || p.x < -30 || p.x > BOARD_WIDTH + 30) {
                world.pellets.splice(i, 1);
            }
        }
    },

    burstParticles(world, x, y, random) {
        for (let i = 0; i < 10; i++) {
            const angle = random.next() * Math.PI * 2;
            const speed = 40 + random.next() * 150;
            world.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                life: 0.35 + random.next() * 0.3,
                maxLife: 0.65,
                size: 2 + random.next() * 3,
            });
        }
    },

    updateParticles(world, dt) {
        for (let i = world.particles.length - 1; i >= 0; i--) {
            const p = world.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 420 * dt;
            if (p.life <= 0) world.particles.splice(i, 1);
        }
    },

    prune(world) {
        world.obstacles = world.obstacles.filter((ob) => ob.worldX + ob.width - world.distance > -60);
    },
};
