/**
 * DustAdapter — decorative chalk dust on a full-screen canvas (no game state).
 * The animation loop runs only while the page is visible: it pauses when the tab is hidden
 * and resumes with a single loop when it comes back.
 */
const DustAdapter = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  particles: [],
  bursts: [],
  rafId: null,
  running: false,

  init() {
    this.canvas = document.getElementById("dust");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    for (let i = 0; i < 42; i++) {
      this.particles.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: 0.6 + Math.random() * 1.9,
        vx: (Math.random() - 0.5) * 0.14,
        vy: -0.05 - Math.random() * 0.18,
        a: 0.04 + Math.random() * 0.09,
      });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  },

  resize() {
    this.width = this.canvas.width = innerWidth;
    this.height = this.canvas.height = innerHeight;
  },

  /** Decorative only: users who ask for reduced motion get a still, empty canvas. */
  reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  start() {
    if (this.running || this.reducedMotion()) return;
    this.running = true;
    this.rafId = requestAnimationFrame(() => this.frame());
  },

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
  },

  /** Puff of 16 particles at (x, y), used when a mark lands. */
  burst(x, y, color) {
    if (!this.running) return;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.4;
      this.bursts.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.5,
        life: 1,
        col: color,
        r: 0.8 + Math.random() * 1.8,
      });
    }
  },

  frame() {
    if (!this.running) return;
    this.draw();
    this.rafId = requestAnimationFrame(() => this.frame());
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -6) {
        p.y = this.height + 6;
        p.x = Math.random() * this.width;
      }
      if (p.x < -6) p.x = this.width + 6;
      if (p.x > this.width + 6) p.x = -6;
      ctx.globalAlpha = p.a;
      ctx.fillStyle = "#f2ecdd";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fill();
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.05;
      b.life -= 0.022;
      if (b.life <= 0) {
        this.bursts.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = b.life * 0.8;
      ctx.fillStyle = b.col;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};
