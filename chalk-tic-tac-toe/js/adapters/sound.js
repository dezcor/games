/**
 * SoundAdapter — implements SoundPort.
 * Synthesised with the Web Audio API (oscillators and noise bursts, no audio files).
 * The AudioContext is created on the first sound, after a user gesture.
 */
const SoundAdapter = {
  enabled: true,
  context: null,

  setEnabled(on) {
    this.enabled = Boolean(on);
  },

  ac() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  },

  noiseBurst(duration, frequency) {
    if (!this.enabled) return;
    try {
      const a = this.ac();
      const sr = a.sampleRate;
      const buf = a.createBuffer(1, sr * duration, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.6);
      }
      const src = a.createBufferSource();
      src.buffer = buf;
      const bp = a.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = frequency;
      bp.Q.value = 1.1;
      const g = a.createGain();
      g.gain.setValueAtTime(0.5, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duration);
      src.connect(bp).connect(g).connect(a.destination);
      src.start();
    } catch (error) {
      // Audio can fail in some browsers; a missing sound must never break the game.
    }
  },

  tone(frequency, start, duration, type = "sine", volume = 0.14) {
    if (!this.enabled) return;
    try {
      const a = this.ac();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.value = frequency;
      g.gain.setValueAtTime(0, a.currentTime + start);
      g.gain.linearRampToValueAtTime(volume, a.currentTime + start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + duration);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + start);
      o.stop(a.currentTime + start + duration + 0.05);
    } catch (error) {
      // See noiseBurst.
    }
  },

  place(who) {
    this.noiseBurst(0.09, who === "X" ? 1900 : 1350);
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, i * 0.09, 0.22, "triangle", 0.16));
  },

  lose() {
    [392, 330, 262].forEach((f, i) => this.tone(f, i * 0.12, 0.2, "sine", 0.13));
  },

  tie() {
    this.tone(440, 0, 0.14, "sine", 0.11);
    this.tone(440, 0.16, 0.2, "sine", 0.11);
  },

  ui() {
    this.noiseBurst(0.05, 700);
  },
};
