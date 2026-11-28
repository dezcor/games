/**
 * World — pure world state: obstacles, zombies, pellets, particles.
 * No DOM, no storage, no audio. Randomness via the RandomPort.
 *
 * Obstacles are stored in world (distance) coordinates: screen x = worldX - distance.
 * Zombies and pellets are tracked in screen coordinates.
 */
const World = {
    /** @returns {Object} a fresh world state, simulating distance 0 */
    create() {
        return {
            distance: 0,
            nextObstacleWorldX: OBSTACLE_FIRST_DISTANCE,
            nextZombieWorldX: ZOMBIE_FIRST_DISTANCE,
            obstacles: [],
            zombies: [],
            pellets: [],
            particles: [],
            kills: 0,
            killScore: 0,
            hookedObstacle: null,
        };
    },

    reset(world) {
        return Object.assign(world, World.create());
    },

    /** @returns {number} the current auto-run speed (px/s) at this distance */
    speed(world) {
        return Math.min(SPEED_CAP, BASE_SPEED + world.distance / SPEED_FACTOR);
    },

    /** Advance the world by dt seconds. */
    step(world, dt, random) {
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

    /** Weighted pick among the variants unlocked at this distance. */
    pickZombieKind(distance, random, allowBrute) {
        const kinds = Object.keys(ZOMBIE_TYPES).filter((kind) =>
            distance >= ZOMBIE_TYPES[kind].from && (allowBrute || kind !== 'brute'));
        let roll = random.next() * kinds.reduce((sum, kind) => sum + ZOMBIE_TYPES[kind].weight, 0);
        for (const kind of kinds) {
            roll -= ZOMBIE_TYPES[kind].weight;
            if (roll < 0) return kind;
        }
        return kinds[kinds.length - 1];
    },

    createZombie(kind, x, random) {
        const type = ZOMBIE_TYPES[kind];
        return {
            kind: kind,
            x: x,
            hp: type.hp,
            walk: type.minSpeed + random.next() * (type.maxSpeed - type.minSpeed),
            phase: random.next() * 6.28,
            flash: 0,
        };
    },

    /** Spawn packs from the right edge; packs grow with distance, one brute at most. */
    spawnZombies(world, random) {
        if (world.distance + BOARD_WIDTH + 80 < world.nextZombieWorldX) return;
        const maxSize = Math.min(ZOMBIE_PACK_MAX,
            ZOMBIE_PACK_START + Math.floor(world.distance / ZOMBIE_PACK_GROWTH));
        const size = 1 + Math.floor(random.next() * maxSize);
        let x = BOARD_WIDTH + 20 + random.next() * 40;
        let hasBrute = false;
        for (let i = 0; i < size; i++) {
            const kind = World.pickZombieKind(world.distance, random, !hasBrute);
            hasBrute = hasBrute || kind === 'brute';
            world.zombies.push(World.createZombie(kind, x, random));
            x += ZOMBIE_PACK_MIN_GAP + random.next() * (ZOMBIE_PACK_MAX_GAP - ZOMBIE_PACK_MIN_GAP);
        }
        world.nextZombieWorldX += ZOMBIE_MIN_SPACING + random.next() * (ZOMBIE_MAX_SPACING - ZOMBIE_MIN_SPACING);
    },

    updateZombies(world, dt) {
        const speed = World.speed(world);
        for (let i = world.zombies.length - 1; i >= 0; i--) {
            const z = world.zombies[i];
            z.x -= (speed + z.walk) * dt;
            z.phase += dt * 6;
            if (z.flash > 0) z.flash = Math.max(0, z.flash - dt);
            if (z.x < -90) world.zombies.splice(i, 1);
        }
    },

    /** Fire one pellet forward; pellets travel in screen space. */
    fire(world, x, y) {
        world.pellets.push({ x: x, y: y - 22, vx: PELLET_SPEED, traveled: 0 });
        return world.pellets;
    },

    killZombie(world, index, random) {
        const z = world.zombies[index];
        world.zombies.splice(index, 1);
        world.kills++;
        world.killScore += ZOMBIE_TYPES[z.kind].score;
        World.burstParticles(world, z.x, GROUND_Y - 20, random);
    },

    /** A landing hunter crushes the zombies right around the landing spot. */
    stomp(world, x, random) {
        for (let i = world.zombies.length - 1; i >= 0; i--) {
            const offset = world.zombies[i].x - x;
            if (offset >= -STOMP_REACH_BACK && offset <= STOMP_REACH_FRONT) {
                World.killZombie(world, i, random);
            }
        }
    },

    /** Index of the front-most zombie the pellet touches, or -1. */
    pelletTarget(world, pellet) {
        let target = -1;
        for (let j = 0; j < world.zombies.length; j++) {
            const z = world.zombies[j];
            if (Math.abs(pellet.x - z.x) >= ZOMBIE_TYPES[z.kind].hitRadius) continue;
            if (target < 0 || z.x < world.zombies[target].x) target = j;
        }
        return target;
    },

    updatePellets(world, dt, random) {
        for (let i = world.pellets.length - 1; i >= 0; i--) {
            const p = world.pellets[i];
            p.x += p.vx * dt;
            p.traveled += p.vx * dt;
            const target = World.pelletTarget(world, p);
            if (target >= 0) {
                const z = world.zombies[target];
                z.hp--;
                if (z.hp <= 0) {
                    World.killZombie(world, target, random);
                } else {
                    z.flash = ZOMBIE_HIT_FLASH;
                }
                world.pellets.splice(i, 1);
                continue;
            }
            if (p.traveled >= PELLET_RANGE || p.x > BOARD_WIDTH + 30) {
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
