/**
 * CanvasRendererAdapter — implements RendererPort.
 * Draws the board from the domain state: gothic night sky, gothic skyline, fog,
 * road, obstacles with planks, hunter (running/hanging/falling), zombies, pellets.
 */
const CanvasRendererAdapter = {
    canvas: null,
    context: null,
    stars: [],
    farBuildings: [],
    nearBuildings: [],

    init() {
        this.canvas = document.getElementById('hookrun');
        this.context = this.canvas.getContext('2d');

        // Deterministic, seeded skyline/star fields (one per session).
        let seed = 1337;
        const rand = () => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        };
        this.stars = [];
        for (let i = 0; i < 46; i++) {
            this.stars.push({
                x: rand() * this.canvas.width,
                y: rand() * this.canvas.height * 0.45,
                r: 0.4 + rand() * 1.1,
                tw: rand() * 6.28,
                bright: 0.4 + rand() * 0.6,
            });
        }
        this.farBuildings = [];
        let x = 0;
        while (x < 1100) {
            this.farBuildings.push({ x: x, w: 34 + rand() * 60, h: 44 + rand() * 66, spire: rand() < 0.35 });
            x += 44 + rand() * 70;
        }
        this.nearBuildings = [];
        x = 0;
        while (x < 1100) {
            this.nearBuildings.push({ x: x, w: 46 + rand() * 80, h: 52 + rand() * 92, spire: rand() < 0.3 });
            x += 66 + rand() * 82;
        }
    },

    draw(game) {
        const context = this.context;
        const canvas = this.canvas;
        if (!context || !canvas) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        this.drawSky(context, canvas);
        this.drawMoon(context, canvas);
        this.drawSkyline(context, canvas, game.world.distance, this.farBuildings, 0.10, 0.55, '#10172a', 0.95);
        this.drawSkyline(context, canvas, game.world.distance, this.nearBuildings, 0.22, 0.98, '#0a0f1c', 1);
        this.drawFog(context, canvas);
        this.drawGround(context, canvas, game.world, game.world.distance);
        this.drawWalls(context, canvas, game.world, game.world.distance);
        this.drawTraps(context, canvas, game.world, game.world.distance);
        this.drawPlanks(context, canvas, game.world, game.world.distance);
        this.drawPowers(context, game.world);
        this.drawZombies(context, game.world);
        this.drawHunter(context, game);
        this.drawShield(context, game);
        this.drawPellets(context, game.world);
        this.drawParticles(context, game.world);

        if (game.countdown > 0) {
            this.drawCountdown(context, canvas, Math.ceil(game.countdown));
        } else if (!game.gameOver && !game.isPaused && game.gameStarted) {
            this.drawVignette(context, canvas);
        }
        if (game.gameStarted && !game.gameOver) {
            this.drawPowerHud(context, canvas, game);
        }
    },

    // ── Power-ups ──

    powerStyles: {
        rapid: { color: '#ffd60a', icon: '»' },
        doubleJump: { color: '#4ade80', icon: '⇈' },
        shield: { color: '#5ee7ff', icon: '◆' },
        pierce: { color: '#ff9f43', icon: '➤' },
        bomb: { color: '#ff5e5e', icon: '✸' },
    },

    drawPowers(context, world) {
        const t = performance.now() * 0.001;
        for (const power of world.powers) {
            const x = power.worldX - world.distance;
            if (x < -20 || x > BOARD_WIDTH + 20) continue;
            const style = this.powerStyles[power.kind];
            const y = POWER_Y + Math.sin(t * 4 + power.worldX) * 2;
            context.save();
            context.shadowColor = style.color;
            context.shadowBlur = 14;
            context.fillStyle = '#0a1220';
            context.strokeStyle = style.color;
            context.lineWidth = 2.5;
            context.beginPath();
            context.arc(x, y, POWER_RADIUS, 0, Math.PI * 2);
            context.fill();
            context.stroke();
            context.shadowBlur = 0;
            context.fillStyle = style.color;
            context.font = '700 15px "Chakra Petch", "Inter", sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(style.icon, x, y + 1);
            context.restore();
        }
    },

    /** Bubble around the hunter: steady with a shield, blinking while it breaks. */
    drawShield(context, game) {
        const blinking = game.invulnerable > 0 && Math.floor(game.invulnerable * 10) % 2 === 0;
        if (!game.powers.shield && !blinking) return;
        context.save();
        context.shadowColor = '#5ee7ff';
        context.shadowBlur = 12;
        context.strokeStyle = 'rgba(94, 231, 255, 0.85)';
        context.fillStyle = 'rgba(94, 231, 255, 0.1)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(game.player.x + 2, game.player.feetY - 19, 26, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.restore();
    },

    /** Active powers with their seconds left, plus the name of the last pickup. */
    drawPowerHud(context, canvas, game) {
        context.save();
        context.textBaseline = 'middle';
        context.font = '700 11px "Chakra Petch", "Inter", sans-serif';
        context.textAlign = 'left';

        let row = 0;
        for (const kind of Object.keys(POWER_TYPES)) {
            if (!Powers.isActive(game.powers, kind)) continue;
            const type = POWER_TYPES[kind];
            const style = this.powerStyles[kind];
            const left = game.powers.timers[kind];
            const text = `${style.icon} ${type.label}${left ? ` ${Math.ceil(left)}s` : ''}`;
            const y = 16 + row * 18;
            context.fillStyle = 'rgba(5, 8, 15, 0.7)';
            context.fillRect(8, y - 8, 118, 16);
            context.fillStyle = style.color;
            context.fillText(text, 13, y + 1);
            if (left) {
                context.fillRect(8, y + 6, 118 * (left / type.duration), 2);
            }
            row++;
        }

        if (game.notice) {
            context.textAlign = 'center';
            context.font = '700 22px "Saira Stencil One", "Arial Narrow", sans-serif';
            context.globalAlpha = Math.min(1, game.notice.time * 2);
            context.fillStyle = this.powerStyles[game.notice.kind].color;
            context.fillText(`¡${POWER_TYPES[game.notice.kind].label}!`, canvas.width / 2, canvas.height * 0.3);
        }
        context.restore();
    },

    // ── Background ──

    drawSky(context, canvas) {
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#05080f');
        gradient.addColorStop(0.55, '#0a1220');
        gradient.addColorStop(1, '#16202f');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const t = performance.now() * 0.001;
        context.fillStyle = '#fff';
        for (const star of this.stars) {
            const a = star.bright * (0.55 + 0.45 * Math.sin(t * 1.5 + star.tw));
            context.globalAlpha = Math.max(0.08, a);
            context.fillRect(star.x, star.y, star.r, star.r);
        }
        context.globalAlpha = 1;
    },

    drawMoon(context, canvas) {
        const mx = canvas.width * 0.76;
        const my = 54;
        context.save();
        context.shadowColor = 'rgba(230, 226, 212, 0.55)';
        context.shadowBlur = 26;
        context.fillStyle = '#e6e2d4';
        context.beginPath();
        context.arc(mx, my, 24, 0, Math.PI * 2);
        context.fill();
        context.restore();
        // Craters
        context.fillStyle = 'rgba(180, 175, 160, 0.45)';
        context.beginPath();
        context.arc(mx - 6, my - 4, 4.5, 0, Math.PI * 2);
        context.arc(mx + 7, my + 5, 3.4, 0, Math.PI * 2);
        context.arc(mx - 2, my + 8, 2.4, 0, Math.PI * 2);
        context.fill();
    },

    drawSkyline(context, canvas, distance, buildings, factor, baseAlpha, color, alpha) {
        const tile = 1100;
        const offset = (distance * factor) % tile;
        context.fillStyle = color;
        context.globalAlpha = alpha * 0.85;
        for (let rep = -1; rep < 2; rep++) {
            for (const b of buildings) {
                const sx = b.x - offset + rep * tile;
                if (sx + b.w < -20 || sx > canvas.width + 20) continue;
                const top = 306 - b.h - 40;
                context.fillRect(sx, top, b.w, b.h + 60);
                if (b.spire) {
                    context.beginPath();
                    context.moveTo(sx + b.w * 0.5 - b.w * 0.16, top);
                    context.lineTo(sx + b.w * 0.5, top - 22);
                    context.lineTo(sx + b.w * 0.5 + b.w * 0.16, top);
                    context.closePath();
                    context.fill();
                }
                // tiny lit window
                if (Math.floor(b.x) % 3 === 0) {
                    context.fillStyle = 'rgba(250, 220, 140, 0.5)';
                    context.fillRect(sx + b.w * 0.4, top + 22, 3, 4);
                    context.fillStyle = color;
                }
            }
        }
        context.globalAlpha = 1;
    },

    drawFog(context, canvas) {
        const gradient = context.createLinearGradient(0, canvas.height - 130, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(46, 62, 88, 0)');
        gradient.addColorStop(1, 'rgba(46, 62, 88, 0.28)');
        context.fillStyle = gradient;
        context.fillRect(0, canvas.height - 130, canvas.width, 130);
    },

    // ── Ground ──

    drawGround(context, canvas, world, distance) {
        // Slab
        context.fillStyle = '#131b26';
        context.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
        // Glow top edge of the road
        context.fillStyle = '#2b3a55';
        context.fillRect(0, GROUND_Y, canvas.width, 3);
        // Faded steel line under the lip
        context.fillStyle = 'rgba(0,0,0,0.35)';
        context.fillRect(0, GROUND_Y + 3, canvas.width, 2);

        // Scrolling hazard hatches
        context.save();
        context.strokeStyle = 'rgba(255, 180, 60, 0.28)';
        context.lineWidth = 3;
        const spacing = 30;
        const offset = -(distance % spacing);
        for (let x = offset; x < canvas.width; x += spacing) {
            context.beginPath();
            context.moveTo(x, GROUND_Y + 22);
            context.lineTo(x + 14, GROUND_Y + 34);
            context.stroke();
        }
        context.restore();

        // Pits (holes cut into the ground)
        for (const ob of world.obstacles) {
            if (ob.type !== 'pit') continue;
            const sx = ob.worldX - distance;
            if (sx + ob.width < -10 || sx > canvas.width + 10) continue;
            // Dark hole
            context.fillStyle = '#05070c';
            context.fillRect(sx, GROUND_Y, ob.width, canvas.height - GROUND_Y);
            context.fillStyle = 'rgba(0,0,0,0.8)';
            context.fillRect(sx + 2, GROUND_Y, 3, canvas.height - GROUND_Y);
            context.fillRect(sx + ob.width - 5, GROUND_Y, 3, canvas.height - GROUND_Y);

            // Hazard lip edges
            this.drawHazardStrip(context, sx - 3, GROUND_Y, 3, canvas.height - GROUND_Y);
            this.drawHazardStrip(context, sx + ob.width, GROUND_Y, 3, canvas.height - GROUND_Y);
        }
    },

    drawHazardStrip(context, x, y, w, h) {
        context.save();
        context.beginPath();
        context.rect(x, y, w, h);
        context.clip();
        const stripe = 7;
        for (let yy = -h; yy < h + stripe; yy += stripe * 2) {
            context.fillStyle = '#d98e2b';
            context.fillRect(x, y + yy, w, stripe);
        }
        context.restore();
    },

    // ── Obstacles ──

    drawWalls(context, canvas, world, distance) {
        for (const ob of world.obstacles) {
            if (ob.type !== 'wall') continue;
            const sx = ob.worldX - distance;
            if (sx + ob.width < -10 || sx > canvas.width + 10) continue;
            const top = GROUND_Y - ob.height;

            // Body
            const gradient = context.createLinearGradient(sx, top, sx, GROUND_Y);
            gradient.addColorStop(0, '#33405e');
            gradient.addColorStop(1, '#1b2438');
            context.fillStyle = gradient;
            context.fillRect(sx, top, ob.width, ob.height);

            // Masonry lines
            context.strokeStyle = 'rgba(0,0,0,0.4)';
            context.lineWidth = 1;
            const rowH = 16;
            for (let y = top + rowH; y < GROUND_Y; y += rowH) {
                context.beginPath();
                context.moveTo(sx + 2, y);
                context.lineTo(sx + ob.width - 2, y);
                context.stroke();
            }
            let row = 0;
            for (let y = top + rowH; y < GROUND_Y; y += rowH) {
                const vx = sx + ((row % 2) ? 12 : 24) + (row % 2 === 0 ? 8 : 0);
                context.beginPath();
                context.moveTo(vx, y - rowH);
                context.lineTo(vx, y);
                context.stroke();
                row++;
            }

            // Front lip highlight
            context.fillStyle = '#48577b';
            context.fillRect(sx, top, ob.width, 3);

            // Hazard strip above the wall lip
            this.drawHazardStrip(context, sx + 3, top - 6, ob.width - 6, 6);
        }
    },

    drawPlanks(context, canvas, world, distance) {
        for (const ob of world.obstacles) {
            if (!OBSTACLE_TYPES[ob.type].hookable) continue;
            const sx = ob.worldX - distance;
            if (sx + ob.width < -20 || sx > canvas.width + 20) continue;
            // Free beams glow green so they read as a way over the crowd.
            const free = ob.type === 'anchor';
            const cx = sx + ob.width / 2;
            const plankW = Math.max(64, ob.width + 24);

            // Beam
            context.fillStyle = free ? '#1f5a39' : '#223048';
            context.fillRect(cx - plankW / 2, PLANK_Y - 5, plankW, 8);
            context.fillStyle = free ? '#4ade80' : '#31456b';
            context.fillRect(cx - plankW / 2, PLANK_Y - 6, plankW, 2);

            // Rivets
            context.fillStyle = '#c8b98a';
            for (let gx = cx - plankW / 2 + 10; gx < cx + plankW / 2 - 8; gx += 14) {
                context.beginPath();
                context.arc(gx, PLANK_Y - 1, 1.4, 0, Math.PI * 2);
                context.fill();
            }

            // Anchor ring below the center
            context.strokeStyle = free ? '#d6ffc7' : '#d8d2c4';
            context.lineWidth = 2;
            context.save();
            if (free) {
                context.shadowColor = '#4ade80';
                context.shadowBlur = 10;
            }
            context.beginPath();
            context.arc(cx, PLANK_Y + 8, free ? 5 : 3.5, 0, Math.PI * 2);
            context.stroke();
            context.restore();
        }
    },

    // ── Traps (jump over them) ──

    drawTraps(context, canvas, world, distance) {
        const t = performance.now() * 0.001;
        for (const ob of world.obstacles) {
            if (OBSTACLE_TYPES[ob.type].hookable) continue;
            const sx = ob.worldX - distance;
            if (sx + ob.width < -10 || sx > canvas.width + 10) continue;
            context.save();
            context.translate(sx, GROUND_Y);
            if (ob.type === 'fire') this.drawFire(context, ob.width, ob.height, t);
            else if (ob.type === 'spikes') this.drawSpikes(context, ob.width, ob.height);
            else this.drawElectricFence(context, ob.width, ob.height, t);
            context.restore();
        }
    },

    /** Flickering flames over a bed of logs; drawn from the ground up. */
    drawFire(context, width, height, t) {
        context.shadowColor = '#ff7a1a';
        context.shadowBlur = 14;
        const layers = [
            { color: '#e2431e', scale: 1, tongues: 4 },
            { color: '#ff9f1c', scale: 0.72, tongues: 3 },
            { color: '#ffe66d', scale: 0.45, tongues: 2 },
        ];
        layers.forEach((layer, n) => {
            const step = width / layer.tongues;
            context.fillStyle = layer.color;
            context.beginPath();
            context.moveTo(0, 0);
            for (let i = 0; i < layer.tongues; i++) {
                const flicker = 0.82 + 0.18 * Math.sin(t * 13 + i * 2.1 + n);
                context.lineTo(step * (i + 0.5) + Math.sin(t * 9 + i + n) * 3, -height * layer.scale * flicker);
                context.lineTo(step * (i + 1), -height * layer.scale * 0.28);
            }
            context.lineTo(width, 0);
            context.closePath();
            context.fill();
        });
        context.shadowBlur = 0;
        context.fillStyle = '#4a2b18';
        context.fillRect(-2, -4, width + 4, 4);
    },

    /** Spiked fence: two rails and sharp pickets. */
    drawSpikes(context, width, height) {
        context.fillStyle = '#6d7787';
        context.fillRect(0, -height * 0.55, width, 3);
        context.fillRect(0, -height * 0.2, width, 3);
        const count = Math.max(3, Math.round(width / 9));
        const step = width / count;
        for (let i = 0; i < count; i++) {
            const x = step * i + step * 0.5;
            context.fillStyle = '#9aa5b5';
            context.fillRect(x - 1.5, -height + 9, 3, height - 9);
            context.fillStyle = '#e6ebf2';
            context.beginPath();
            context.moveTo(x - 4, -height + 10);
            context.lineTo(x, -height);
            context.lineTo(x + 4, -height + 10);
            context.closePath();
            context.fill();
        }
    },

    /** Two posts with live arcs between them. */
    drawElectricFence(context, width, height, t) {
        context.fillStyle = '#5b6475';
        context.fillRect(0, -height, 4, height);
        context.fillRect(width - 4, -height, 4, height);
        context.fillStyle = '#ffd60a';
        context.fillRect(-1, -height, 6, 5);
        context.fillRect(width - 5, -height, 6, 5);

        context.shadowColor = '#5ee7ff';
        context.shadowBlur = 10;
        context.strokeStyle = '#b8f4ff';
        context.lineWidth = 1.6;
        for (let wire = 1; wire <= 3; wire++) {
            const y = -height * (wire / 3.4);
            context.beginPath();
            context.moveTo(3, y);
            for (let i = 1; i < 4; i++) {
                const jitter = Math.sin(t * 31 + wire * 5 + i * 7) * 4;
                context.lineTo(3 + ((width - 6) * i) / 4, y + jitter);
            }
            context.lineTo(width - 3, y);
            context.stroke();
        }
    },

    // ── Zombies ──

    drawZombies(context, world) {
        for (const z of world.zombies) {
            const type = ZOMBIE_TYPES[z.kind];
            const style = this.zombieStyles[z.kind];
            const palette = z.flash > 0
                ? { body: '#e6e2d4', head: '#ffffff', eye: '#ff5e3a' }
                : style;

            context.save();
            context.translate(z.x, GROUND_Y + Math.sin(z.phase * 2) * 0.7);
            context.scale(-style.scale, style.scale); // they face the hunter
            if (z.kind === 'crawler') {
                this.drawCrawlerFigure(context, palette, z.phase);
            } else {
                this.drawZombieFigure(context, palette, z.phase, style.lean);
            }
            context.restore();

            // Remaining hits, for the variants that take more than one
            if (type.hp > 1) {
                for (let i = 0; i < type.hp; i++) {
                    context.fillStyle = i < z.hp ? '#ff5e5e' : '#3a3f52';
                    context.fillRect(z.x - type.hp * 4 + i * 8, GROUND_Y - type.height - 18, 6, 4);
                }
            }
        }
    },

    zombieStyles: {
        walker: { body: '#3f7a45', head: '#5a9a5c', eye: '#c8ff6a', scale: 1, lean: 4 },
        runner: { body: '#9a4234', head: '#c4604e', eye: '#ffd60a', scale: 1, lean: 11 },
        crawler: { body: '#4a6496', head: '#7590c0', eye: '#7ff3ff', scale: 1, lean: 0 },
        brute: { body: '#6f4a86', head: '#9569ac', eye: '#ff5e5e', scale: 1.4, lean: 3 },
    },

    /** Upright zombie, drawn around its feet and facing +x. */
    drawZombieFigure(context, palette, phase, lean) {
        context.rotate(Math.sin(phase) * 0.07);

        context.strokeStyle = palette.body;
        context.lineWidth = 5;
        context.lineCap = 'round';

        // Legs
        const swing = Math.sin(phase) * 9;
        context.beginPath();
        context.moveTo(0, -14);
        context.lineTo(swing, 0);
        context.moveTo(0, -14);
        context.lineTo(-swing, 0);
        context.stroke();

        // Torso (hunched forward)
        context.beginPath();
        context.moveTo(0, -14);
        context.lineTo(lean, -26);
        context.stroke();

        // Arm reaching toward the player
        context.beginPath();
        context.moveTo(lean, -25);
        context.lineTo(lean + 10, -20);
        context.stroke();

        this.drawZombieHead(context, palette, lean + 2, -30);
    },

    /** Low zombie dragging itself along the road. */
    drawCrawlerFigure(context, palette, phase) {
        const reach = Math.sin(phase) * 4;

        context.strokeStyle = palette.body;
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.beginPath();
        // Trailing legs, back, and the two arms pulling forward
        context.moveTo(-16, -2);
        context.lineTo(-8, -8);
        context.lineTo(5, -12);
        context.lineTo(14 + reach, -1);
        context.moveTo(2, -11);
        context.lineTo(8 - reach, -1);
        context.stroke();

        this.drawZombieHead(context, palette, 10, -17);
    },

    drawZombieHead(context, palette, x, y) {
        context.fillStyle = palette.head;
        context.beginPath();
        context.arc(x, y, 5.5, 0, Math.PI * 2);
        context.fill();

        // Glowing eyes
        context.save();
        context.shadowColor = palette.eye;
        context.shadowBlur = 6;
        context.fillStyle = palette.eye;
        context.beginPath();
        context.arc(x + 2, y - 2, 1.4, 0, Math.PI * 2);
        context.arc(x + 4, y + 1.5, 1.4, 0, Math.PI * 2);
        context.fill();
        context.restore();
    },

    // ── Hunter (player) ──

    drawHunter(context, game) {
        const player = game.player;
        const canvas = this.canvas;
        const bob = Math.sin(player.runPhase * 2) * 2;

        context.save();
        context.translate(player.x, player.feetY);
        context.rotate(player.theta);

        const swinging = player.phase === 'swing' || player.phase === 'hoist';
        const airborne = player.phase === 'jump' || player.phase === 'fall';
        const running = !swinging && !airborne;
        const legSwing = running ? Math.sin(player.runPhase) * 7 : 0;
        const bodyBob = running ? bob : (swinging ? Math.sin(game.world.distance * 0.02) * 2 : 0);

        // Legs
        context.strokeStyle = '#46403a';
        context.lineWidth = 4.5;
        context.lineCap = 'round';
        context.beginPath();
        if (swinging) {
            // Dangled kicking legs
            context.moveTo(0, -16);
            context.lineTo(-3, 0);
            context.moveTo(0, -16);
            context.lineTo(3, -2);
        } else if (airborne) {
            context.moveTo(0, -16);
            context.lineTo(-7, -2);
            context.moveTo(0, -16);
            context.lineTo(7, 0);
        } else {
            context.moveTo(0, -16);
            context.lineTo(-3, -legSwing * 0.5);
            context.moveTo(0, -16);
            context.lineTo(3, legSwing * 0.5);
        }
        context.stroke();

        // Torso (rust jacket)
        context.save();
        context.translate(0, bodyBob - 16);
        context.strokeStyle = '#b4582e';
        context.lineWidth = 9;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, -11);
        context.stroke();

        // Gun arm pointing toward the direction of target (right)
        const gunY = -7;
        context.strokeStyle = '#2a2a32';
        context.lineWidth = 3.5;
        context.beginPath();
        context.moveTo(0, -7);
        context.lineTo(18, gunY);
        context.stroke();

        // Head
        context.fillStyle = '#d8d2c4';
        context.beginPath();
        context.arc(2, -17, 5.5, 0, Math.PI * 2);
        context.fill();

        // Scarf / neck accent
        context.fillStyle = '#e8b34a';
        context.fillRect(-1, -15, 6, 3);

        context.restore();

        context.restore();

        // Rope — drawn in absolute coordinates from the plank to the hunter's head
        if (player.phase === 'fly' || player.phase === 'hoist' || player.phase === 'swing' || player.phase === 'latch') {
            this.drawRope(context, canvas, game);
        }
    },

    drawRope(context, canvas, game) {
        const player = game.player;
        const anchorX = player.anchorX;
        const hookY = PLANK_Y + 9;

        const phase = player.phase;
        const theta = player.theta;

        // Hunter head in absolute coordinates (figure rotates about the feet)
        const headX = player.x + 2 * Math.cos(theta) + 33 * Math.sin(theta);
        const headY = player.feetY + 2 * Math.sin(theta) - 33 * Math.cos(theta);

        context.save();
        context.strokeStyle = '#8d8378';
        context.lineWidth = 2.5;
        context.lineCap = 'round';
        context.beginPath();

        let clawX;
        let clawY;
        if (phase === 'fly') {
            // The hook flies from the hunter toward the plank; the rope trails from the head.
            const t = Math.min(1, player.phaseTime / HOOK_FLY_TIME);
            clawX = player.x + (anchorX - player.x) * t;
            clawY = headY + (hookY - headY) * t;
            context.moveTo(headX, headY);
            context.lineTo(clawX, clawY);
            context.stroke();
        } else {
            // Latched: the rope runs from the plank anchor down to the hunter's head.
            clawX = anchorX;
            clawY = hookY;
            context.moveTo(anchorX, hookY);
            context.lineTo(headX, headY);
            context.stroke();
        }

        // Hook tip — small claw drawn at the active tip
        context.save();
        context.translate(clawX, clawY);
        context.rotate(theta);
        context.beginPath();
        context.arc(0, 0, 3, 0.3, Math.PI - 0.3);
        context.stroke();
        context.restore();

        context.restore();

        // Latch ring marker when the hook is latched (fly finished)
        if (phase !== 'fly') {
            context.save();
            context.strokeStyle = '#e8b34a';
            context.lineWidth = 1.5;
            context.beginPath();
            context.arc(anchorX, hookY, 5.5, 0, Math.PI * 2);
            context.stroke();
            context.restore();
        }
    },

    // ── Pellets and particles ──

    drawPellets(context, world) {
        for (const p of world.pellets) {
            const dir = p.vx > 0 ? 1 : -1;
            const color = p.hits > 1 || p.struck.length > 0 ? '#ff9f43' : '#ffd60a';
            context.save();
            context.shadowColor = color;
            context.shadowBlur = 8;
            context.strokeStyle = color;
            context.lineWidth = 2.5;
            context.beginPath();
            context.moveTo(p.x - dir * PELLET_HALF_LENGTH * 2, p.y);
            context.lineTo(p.x, p.y);
            context.stroke();
            context.fillStyle = '#fff6c0';
            context.beginPath();
            context.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    },

    drawParticles(context, world) {
        for (const p of world.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            context.save();
            context.globalAlpha = alpha;
            context.fillStyle = '#d6e8a0';
            context.beginPath();
            context.arc(p.x, p.y, p.size * alpha + 0.6, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    },

    drawCountdown(context, canvas, value) {
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.38;
        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '700 84px "Saira Stencil One", "Arial Narrow", sans-serif';
        context.fillStyle = '#e6e2d4';
        context.shadowColor = 'rgba(230, 226, 212, 0.5)';
        context.shadowBlur = 24;
        context.fillText(String(value), cx, cy);
        context.shadowBlur = 0;
        context.font = '600 13px "Chakra Petch", "Inter", sans-serif';
        context.fillStyle = 'rgba(230, 226, 212, 0.85)';
        context.fillText('PRESS GANCHO PER BEAM · JUMP THE TRAPS', cx, cy + 58);
        context.restore();
    },

    drawVignette(context, canvas) {
        const gradient = context.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.height * 0.45,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.75
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.38)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
    },
};
