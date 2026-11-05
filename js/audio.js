/**
 * AudioSystem: Interactive Sci-Fi Sound Synthesizer via Web Audio API
 * Generates dynamic engine roars, warp effects, and tactical UI audio in real-time.
 */

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.analyser = null;
    this.engineDrone = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isInitialized = false;

    // Throttle / speed feedback state
    this.currentThrottle = 0;
    this.targetThrottle = 0;
  }

  init() {
    if (this.isInitialized) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      // Analyser node for HUD waveform visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  setupEngineSynth() {
    if (!this.ctx) return;

    // Sub-bass rumble oscillator (Sawtooth)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    // Harmonic whine oscillator (Triangle)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    // Filter to give that deep sci-fi propulsion hum
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    osc1.connect(this.engineFilter);
    osc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.engineOsc1 = osc1;
    this.engineOsc2 = osc2;
  }

  updateEngine(throttle, isBoosting) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    // Smooth throttle lerp
    this.targetThrottle = Math.max(0, Math.min(2.5, throttle + (isBoosting ? 1.5 : 0)));
    this.currentThrottle += (this.targetThrottle - this.currentThrottle) * 0.1;

    const baseFreq = 45 + this.currentThrottle * 40;
    const filterFreq = 140 + this.currentThrottle * 650;
    const gainVal = 0.08 + Math.min(0.25, this.currentThrottle * 0.1);

    const now = this.ctx.currentTime;
    if (this.engineOsc1) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.01, now, 0.05);
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
      this.engineGain.gain.setTargetAtTime(gainVal, now, 0.05);
    }
  }

  playUiClick() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (_) {}
  }

  playHotspotChime() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [880, 1320, 1760].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.08, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
    } catch (_) {}
  }

  playWarpBoom() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      // Sub drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (_) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  getWaveformData(outputArray) {
    if (!this.analyser || this.isMuted) {
      outputArray.fill(128);
      return;
    }
    this.analyser.getByteTimeDomainData(outputArray);
  }
}
