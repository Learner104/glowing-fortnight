
// ===== js/math3d.js =====
/**
 * Math3D: High-performance 3D Vector, Matrix, and Spline utilities
 * Specially optimized for 60FPS cinematic camera paths and WebGL projection.
 */

class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v) {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    if (len > 0.00001) {
      this.scale(1 / len);
    }
    return this;
  }

  lerp(target, alpha) {
    this.x += (target.x - this.x) * alpha;
    this.y += (target.y - this.y) * alpha;
    this.z += (target.z - this.z) * alpha;
    return this;
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

class Mat4 {
  constructor() {
    // 16 floats, column-major order for WebGL
    this.elements = new Float32Array(16);
    this.identity();
  }

  identity() {
    const e = this.elements;
    e[0] = 1; e[4] = 0; e[8] = 0;  e[12] = 0;
    e[1] = 0; e[5] = 1; e[9] = 0;  e[13] = 0;
    e[2] = 0; e[6] = 0; e[10] = 1; e[14] = 0;
    e[3] = 0; e[7] = 0; e[11] = 0; e[15] = 1;
    return this;
  }

  copy(m) {
    this.elements.set(m.elements);
    return this;
  }

  clone() {
    const m = new Mat4();
    m.copy(this);
    return m;
  }

  multiply(m) {
    return Mat4.multiplyMatrices(this, this, m);
  }

  premultiply(m) {
    return Mat4.multiplyMatrices(this, m, this);
  }

  static multiplyMatrices(out, a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = out.elements;

    const a11 = ae[0], a12 = ae[4], a13 = ae[8],  a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9],  a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

    const b11 = be[0], b12 = be[4], b13 = be[8],  b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9],  b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

    te[0]  = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4]  = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8]  = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    te[1]  = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5]  = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9]  = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    te[2]  = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6]  = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    te[3]  = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7]  = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return out;
  }

  perspective(fovyRad, aspect, near, far) {
    const f = 1.0 / Math.tan(fovyRad / 2);
    const nf = 1 / (near - far);
    const e = this.elements;

    e[0] = f / aspect;
    e[1] = 0;
    e[2] = 0;
    e[3] = 0;

    e[4] = 0;
    e[5] = f;
    e[6] = 0;
    e[7] = 0;

    e[8] = 0;
    e[9] = 0;
    e[10] = (far + near) * nf;
    e[11] = -1;

    e[12] = 0;
    e[13] = 0;
    e[14] = (2 * far * near) * nf;
    e[15] = 0;

    return this;
  }

  lookAt(eye, target, up) {
    const z = new Vec3().copy(eye).sub(target).normalize();
    const x = new Vec3().copy(up).cross(z).normalize();
    const y = new Vec3().copy(z).cross(x).normalize();

    const e = this.elements;
    e[0] = x.x;
    e[1] = y.x;
    e[2] = z.x;
    e[3] = 0;

    e[4] = x.y;
    e[5] = y.y;
    e[6] = z.y;
    e[7] = 0;

    e[8] = x.z;
    e[9] = y.z;
    e[10] = z.z;
    e[11] = 0;

    e[12] = -x.dot(eye);
    e[13] = -y.dot(eye);
    e[14] = -z.dot(eye);
    e[15] = 1;

    return this;
  }

  translate(x, y, z) {
    const e = this.elements;
    e[12] += e[0] * x + e[4] * y + e[8] * z;
    e[13] += e[1] * x + e[5] * y + e[9] * z;
    e[14] += e[2] * x + e[6] * y + e[10] * z;
    e[15] += e[3] * x + e[7] * y + e[11] * z;
    return this;
  }

  rotateY(angleRad) {
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    const rot = new Mat4();
    rot.elements[0] = c;
    rot.elements[2] = -s;
    rot.elements[8] = s;
    rot.elements[10] = c;
    return this.multiply(rot);
  }

  rotateX(angleRad) {
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    const rot = new Mat4();
    rot.elements[5] = c;
    rot.elements[6] = s;
    rot.elements[9] = -s;
    rot.elements[10] = c;
    return this.multiply(rot);
  }

  rotateZ(angleRad) {
    const c = Math.cos(angleRad);
    const s = Math.sin(angleRad);
    const rot = new Mat4();
    rot.elements[0] = c;
    rot.elements[1] = s;
    rot.elements[4] = -s;
    rot.elements[5] = c;
    return this.multiply(rot);
  }

  scale(sx, sy, sz) {
    const e = this.elements;
    e[0] *= sx; e[4] *= sy; e[8]  *= sz;
    e[1] *= sx; e[5] *= sy; e[9]  *= sz;
    e[2] *= sx; e[6] *= sy; e[10] *= sz;
    e[3] *= sx; e[7] *= sy; e[11] *= sz;
    return this;
  }

  /**
   * Transforms a 3D point and projects to 2D normalized screen coordinate (-1..1)
   */
  projectPoint(v) {
    const e = this.elements;
    const x = v.x, y = v.y, z = v.z;
    const w = e[3] * x + e[7] * y + e[11] * z + e[15];

    if (Math.abs(w) < 0.0001) return null;

    const outX = (e[0] * x + e[4] * y + e[8]  * z + e[12]) / w;
    const outY = (e[1] * x + e[5] * y + e[9]  * z + e[13]) / w;
    const outZ = (e[2] * x + e[6] * y + e[10] * z + e[14]) / w;

    return { x: outX, y: outY, z: outZ, visible: outZ > -1 && outZ < 1 && w > 0 };
  }
}

/**
 * Catmull-Rom Spline for silky smooth camera flight interpolation
 */
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function catmullRomVec3(p0, p1, p2, p3, t, out = new Vec3()) {
  out.x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
  out.y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
  out.z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
  return out;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}


// ===== js/audio.js =====
/**
 * AudioSystem: Interactive Sci-Fi Sound Synthesizer via Web Audio API
 * Generates dynamic engine roars, warp effects, and tactical UI audio in real-time.
 */

class AudioSystem {
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


// ===== js/scene.js =====
/**
 * Scene: Procedural 3D Geometry for Starfighter, Warp Gates, Monoliths, and Starfield
 */



class MeshData {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.colors = [];
    this.indices = [];
  }

  addVertex(x, y, z, nx, ny, nz, r, g, b, a = 1.0) {
    this.positions.push(x, y, z);
    this.normals.push(nx, ny, nz);
    this.colors.push(r, g, b, a);
    return (this.positions.length / 3) - 1;
  }

  addTriangle(i1, i2, i3) {
    this.indices.push(i1, i2, i3);
  }

  addQuad(i1, i2, i3, i4) {
    this.indices.push(i1, i2, i3);
    this.indices.push(i1, i3, i4);
  }
}

/**
 * Builds the high-tech Valkyrie-VII / Aegis Quantum Fighter
 */
function buildStarfighterMesh(hullColor = [0.15, 0.18, 0.24], neonColor = [0.0, 0.95, 1.0]) {
  const mesh = new MeshData();

  const [hr, hg, hb] = hullColor;
  const [nr, ng, nb] = neonColor;
  const glassColor = [0.05, 0.5, 0.8, 0.85];
  const darkPanel = [0.08, 0.09, 0.12, 1.0];
  const exhaustColor = [nr, ng, nb, 1.0];

  function addFacet(p1, p2, p3, color) {
    const v1 = new Vec3(...p1);
    const v2 = new Vec3(...p2);
    const v3 = new Vec3(...p3);
    const norm = new Vec3().copy(v2).sub(v1).cross(new Vec3().copy(v3).sub(v1)).normalize();

    const i1 = mesh.addVertex(p1[0], p1[1], p1[2], norm.x, norm.y, norm.z, ...color);
    const i2 = mesh.addVertex(p2[0], p2[1], p2[2], norm.x, norm.y, norm.z, ...color);
    const i3 = mesh.addVertex(p3[0], p3[1], p3[2], norm.x, norm.y, norm.z, ...color);
    mesh.addTriangle(i1, i2, i3);
  }

  function addQuadFacet(p1, p2, p3, p4, color) {
    addFacet(p1, p2, p3, color);
    addFacet(p1, p3, p4, color);
  }

  // 1. NOSE CONE & MAIN FUSELAGE
  // Nose tip
  const nose = [0, 0.1, -4.2];
  // Mid body vertices
  const midTop = [0, 0.65, -0.6];
  const midLeft = [-0.9, 0.15, -0.4];
  const midRight = [0.9, 0.15, -0.4];
  const midBottom = [0, -0.35, -0.4];

  // Nose facets
  addFacet(nose, midTop, midRight, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);
  addFacet(nose, midLeft, midTop, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);
  addFacet(nose, midRight, midBottom, darkPanel);
  addFacet(nose, midBottom, midLeft, darkPanel);

  // Cockpit glass canopy
  const canopyTip = [0, 0.45, -2.8];
  const canopyPeak = [0, 0.85, -1.2];
  const canopyL = [-0.35, 0.4, -1.2];
  const canopyR = [0.35, 0.4, -1.2];
  const canopyRear = [0, 0.7, -0.5];

  addFacet(canopyTip, canopyPeak, canopyR, glassColor);
  addFacet(canopyTip, canopyL, canopyPeak, glassColor);
  addFacet(canopyPeak, canopyRear, canopyR, glassColor);
  addFacet(canopyPeak, canopyL, canopyRear, glassColor);

  // Aft Fuselage
  const aftTop = [0, 0.55, 2.4];
  const aftLeft = [-0.8, 0.1, 2.5];
  const aftRight = [0.8, 0.1, 2.5];
  const aftBottom = [0, -0.3, 2.4];

  addQuadFacet(midTop, midRight, aftRight, aftTop, [hr, hg, hb, 1.0]);
  addQuadFacet(midTop, aftTop, aftLeft, midLeft, [hr, hg, hb, 1.0]);
  addQuadFacet(midBottom, aftBottom, aftRight, midRight, darkPanel);
  addQuadFacet(midBottom, midLeft, aftLeft, aftBottom, darkPanel);

  // 2. MAIN WINGS (Swept back delta wings with glowing neon leading edge strip)
  const wingTipL = [-4.6, 0.05, 1.8];
  const wingTipR = [4.6, 0.05, 1.8];
  const wingTrailL = [-3.8, 0.08, 2.8];
  const wingTrailR = [3.8, 0.08, 2.8];
  const wingRootLeadL = [-0.85, 0.2, -1.8];
  const wingRootLeadR = [0.85, 0.2, -1.8];
  const wingRootTrailL = [-0.85, 0.15, 2.2];
  const wingRootTrailR = [0.85, 0.15, 2.2];

  // Upper wing surfaces
  addQuadFacet(wingRootLeadL, wingTipL, wingTrailL, wingRootTrailL, [hr * 1.1, hg * 1.1, hb * 1.1, 1.0]);
  addQuadFacet(wingRootLeadR, wingRootTrailR, wingTrailR, wingTipR, [hr * 1.1, hg * 1.1, hb * 1.1, 1.0]);

  // Lower wing surfaces
  addQuadFacet(wingRootLeadL, wingRootTrailL, wingTrailL, wingTipL, darkPanel);
  addQuadFacet(wingRootLeadR, wingTipR, wingTrailR, wingRootTrailR, darkPanel);

  // Wing Neon Energy Emitting Strips (glowing edges)
  const neonOffset = 0.03;
  const wingTipLNeon = [-4.65, 0.05 + neonOffset, 1.8];
  const wingRootLeadLNeon = [-0.85, 0.2 + neonOffset, -1.75];
  addQuadFacet(wingRootLeadL, wingRootLeadLNeon, wingTipLNeon, wingTipL, [nr, ng, nb, 1.0]);

  const wingTipRNeon = [4.65, 0.05 + neonOffset, 1.8];
  const wingRootLeadRNeon = [0.85, 0.2 + neonOffset, -1.75];
  addQuadFacet(wingRootLeadR, wingTipR, wingTipRNeon, wingRootLeadRNeon, [nr, ng, nb, 1.0]);

  // Wingtip vertical stabilizer fins
  const finTopL = [-4.5, 1.1, 2.4];
  const finTopR = [4.5, 1.1, 2.4];
  addFacet(wingTipL, finTopL, wingTrailL, [hr * 1.3, hg * 1.3, hb * 1.3, 1.0]);
  addFacet(wingTipR, wingTrailR, finTopR, [hr * 1.3, hg * 1.3, hb * 1.3, 1.0]);

  // 3. TWIN VECTOR THRUSTERS
  function addThruster(offsetX) {
    const s = 0.45;
    const zRear = 2.9;
    const zFront = 1.0;
    const yCenter = 0.1;

    const tF1 = [offsetX - s, yCenter - s, zFront];
    const tF2 = [offsetX + s, yCenter - s, zFront];
    const tF3 = [offsetX + s, yCenter + s, zFront];
    const tF4 = [offsetX - s, yCenter + s, zFront];

    const tR1 = [offsetX - s * 0.9, yCenter - s * 0.9, zRear];
    const tR2 = [offsetX + s * 0.9, yCenter - s * 0.9, zRear];
    const tR3 = [offsetX + s * 0.9, yCenter + s * 0.9, zRear];
    const tR4 = [offsetX - s * 0.9, yCenter + s * 0.9, zRear];

    addQuadFacet(tF1, tR1, tR2, tF2, darkPanel);
    addQuadFacet(tF2, tR2, tR3, tF3, darkPanel);
    addQuadFacet(tF3, tR3, tR4, tF4, darkPanel);
    addQuadFacet(tF4, tR4, tR1, tF1, darkPanel);

    // Glowing exhaust nozzle ring
    addQuadFacet(tR1, tR4, tR3, tR2, exhaustColor);
  }

  addThruster(-1.1);
  addThruster(1.1);

  // 4. FORWARD CANARD STABILIZERS
  const canardTipL = [-1.9, 0.25, -2.2];
  const canardTrailL = [-1.5, 0.25, -1.6];
  const canardRootL = [-0.5, 0.3, -2.1];
  addFacet(canardRootL, canardTipL, canardTrailL, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);

  const canardTipR = [1.9, 0.25, -2.2];
  const canardTrailR = [1.5, 0.25, -1.6];
  const canardRootR = [0.5, 0.3, -2.1];
  addFacet(canardRootR, canardTrailR, canardTipR, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);

  return mesh;
}

/**
 * Builds the animated rotating Quantum Core Rings (torus-like geometry)
 */
function buildRingMesh(radius = 1.2, tubeRadius = 0.08, segments = 24, tubeSegments = 6, color = [0.0, 0.9, 1.0, 0.9]) {
  const mesh = new MeshData();

  for (let i = 0; i < segments; i++) {
    const u0 = (i / segments) * Math.PI * 2;
    const u1 = ((i + 1) / segments) * Math.PI * 2;

    for (let j = 0; j < tubeSegments; j++) {
      const v0 = (j / tubeSegments) * Math.PI * 2;
      const v1 = ((j + 1) / tubeSegments) * Math.PI * 2;

      function getVertex(u, v) {
        const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y = tubeRadius * Math.sin(v);
        const z = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);

        const nx = Math.cos(v) * Math.cos(u);
        const ny = Math.sin(v);
        const nz = Math.cos(v) * Math.sin(u);

        return { x, y, z, nx, ny, nz };
      }

      const p00 = getVertex(u0, v0);
      const p10 = getVertex(u1, v0);
      const p11 = getVertex(u1, v1);
      const p01 = getVertex(u0, v1);

      const i0 = mesh.addVertex(p00.x, p00.y, p00.z, p00.nx, p00.ny, p00.nz, ...color);
      const i1 = mesh.addVertex(p10.x, p10.y, p10.z, p10.nx, p10.ny, p10.nz, ...color);
      const i2 = mesh.addVertex(p11.x, p11.y, p11.z, p11.nx, p11.ny, p11.nz, ...color);
      const i3 = mesh.addVertex(p01.x, p01.y, p01.z, p01.nx, p01.ny, p01.nz, ...color);

      mesh.addQuad(i0, i1, i2, i3);
    }
  }

  return mesh;
}

/**
 * Builds the Hexagonal Warp Acceleration Gate mesh
 */
function buildHexGateMesh(radius = 12.0, thickness = 1.0, depth = 2.5, color = [0.0, 0.85, 1.0, 0.9]) {
  const mesh = new MeshData();
  const sides = 6;

  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;

    const rInner = radius;
    const rOuter = radius + thickness;

    const x0In = Math.cos(a0) * rInner, y0In = Math.sin(a0) * rInner;
    const x1In = Math.cos(a1) * rInner, y1In = Math.sin(a1) * rInner;
    const x0Out = Math.cos(a0) * rOuter, y0Out = Math.sin(a0) * rOuter;
    const x1Out = Math.cos(a1) * rOuter, y1Out = Math.sin(a1) * rOuter;

    const zFront = depth * 0.5;
    const zBack = -depth * 0.5;

    // Front face
    const f1 = mesh.addVertex(x0In, y0In, zFront, 0, 0, 1, ...color);
    const f2 = mesh.addVertex(x1In, y1In, zFront, 0, 0, 1, ...color);
    const f3 = mesh.addVertex(x1Out, y1Out, zFront, 0, 0, 1, ...color);
    const f4 = mesh.addVertex(x0Out, y0Out, zFront, 0, 0, 1, ...color);
    mesh.addQuad(f1, f2, f3, f4);

    // Inner bevel face (intense neon glow)
    const b1 = mesh.addVertex(x0In, y0In, zFront, -Math.cos(a0), -Math.sin(a0), 0, color[0], color[1], color[2], 1.0);
    const b2 = mesh.addVertex(x0In, y0In, zBack, -Math.cos(a0), -Math.sin(a0), 0, color[0], color[1], color[2], 1.0);
    const b3 = mesh.addVertex(x1In, y1In, zBack, -Math.cos(a1), -Math.sin(a1), 0, color[0], color[1], color[2], 1.0);
    const b4 = mesh.addVertex(x1In, y1In, zFront, -Math.cos(a1), -Math.sin(a1), 0, color[0], color[1], color[2], 1.0);
    mesh.addQuad(b1, b2, b3, b4);
  }

  return mesh;
}

/**
 * Builds floating deep-space Monolith / Cyber spire
 */
function buildMonolithMesh(w = 4.0, h = 30.0, d = 4.0, color = [0.08, 0.1, 0.15, 1.0], accentColor = [1.0, 0.35, 0.1, 1.0]) {
  const mesh = new MeshData();
  const hw = w * 0.5, hh = h * 0.5, hd = d * 0.5;

  function addFace(p1, p2, p3, p4, norm, col) {
    const i1 = mesh.addVertex(p1[0], p1[1], p1[2], norm[0], norm[1], norm[2], ...col);
    const i2 = mesh.addVertex(p2[0], p2[1], p2[2], norm[0], norm[1], norm[2], ...col);
    const i3 = mesh.addVertex(p3[0], p3[1], p3[2], norm[0], norm[1], norm[2], ...col);
    const i4 = mesh.addVertex(p4[0], p4[1], p4[2], norm[0], norm[1], norm[2], ...col);
    mesh.addQuad(i1, i2, i3, i4);
  }

  // 4 vertical faces
  addFace([-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd], [0, 0, 1], color);
  addFace([hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd], [0, 0, -1], color);
  addFace([-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd], [-1, 0, 0], color);
  addFace([hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd], [1, 0, 0], color);

  // Glowing cyber rune groove running down the front face
  const grooveW = 0.25;
  addFace([-grooveW, -hh, hd + 0.05], [grooveW, -hh, hd + 0.05], [grooveW, hh, hd + 0.05], [-grooveW, hh, hd + 0.05], [0, 0, 1], accentColor);

  return mesh;
}

/**
 * Builds dynamic Thruster Flame cone
 */
function buildFlameMesh(length = 3.5, radius = 0.45, segments = 12, flameColor = [0.0, 0.8, 1.0]) {
  const mesh = new MeshData();
  const [fr, fg, fb] = flameColor;

  const tipIndex = mesh.addVertex(0, 0, length, 0, 0, 1, fr, fg, fb, 0.0);

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;

    const x0 = Math.cos(a0) * radius;
    const y0 = Math.sin(a0) * radius;
    const x1 = Math.cos(a1) * radius;
    const y1 = Math.sin(a1) * radius;

    const v0 = mesh.addVertex(x0, y0, 0, 0, 0, -1, 1.0, 1.0, 1.0, 1.0);
    const v1 = mesh.addVertex(x1, y1, 0, 0, 0, -1, 1.0, 1.0, 1.0, 1.0);

    mesh.addTriangle(v0, v1, tipIndex);
  }

  return mesh;
}

/**
 * Procedural Starfield & Cosmic Dust generator (2,500 particles)
 */
function generateStarfieldData(count = 2500, spreadX = 140, spreadY = 90, spreadZ = 450) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 4);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const colIdx = i * 4;

    positions[idx] = (Math.random() - 0.5) * spreadX;
    positions[idx + 1] = (Math.random() - 0.5) * spreadY;
    positions[idx + 2] = -Math.random() * spreadZ + 20;

    const brightness = 0.5 + Math.random() * 0.5;
    const tint = Math.random();
    if (tint < 0.6) {
      // White-cyan star
      colors[colIdx] = 0.7 * brightness;
      colors[colIdx + 1] = 0.9 * brightness;
      colors[colIdx + 2] = 1.0 * brightness;
    } else if (tint < 0.85) {
      // Violet nebula dust
      colors[colIdx] = 0.8 * brightness;
      colors[colIdx + 1] = 0.3 * brightness;
      colors[colIdx + 2] = 1.0 * brightness;
    } else {
      // Gold pulsar
      colors[colIdx] = 1.0 * brightness;
      colors[colIdx + 1] = 0.7 * brightness;
      colors[colIdx + 2] = 0.2 * brightness;
    }
    colors[colIdx + 3] = brightness;

    sizes[i] = 1.5 + Math.random() * 3.5;
  }

  return { positions, colors, sizes, count };
}

/**
 * 3D Subsystem Hotspot Definitions on the starfighter
 */
const SHIP_HOTSPOTS = [
  {
    id: 'reactor',
    name: 'DARK MATTER CORE',
    sub: 'Zero-Point Quantum Singularity',
    localPos: new Vec3(0, 0.45, 0.4),
    specs: {
      Output: '4.8 TeraWatts',
      Stability: '99.98%',
      Coolant: 'Cryo-Liquid Helium',
      Phase: 'Active Resonance'
    },
    description: 'Generates localized anti-gravity curvature and powers the dual hyperspace drives with zero thermal waste.'
  },
  {
    id: 'thruster',
    name: 'VECTOR EXHAUST ARRAY',
    sub: 'Twin Mag-Lev Ion Propulsors',
    localPos: new Vec3(1.1, 0.1, 2.7),
    specs: {
      Thrust: '12.4 MegaNewtons',
      Isp: '18,500 sec',
      Gimbal: '±35° Dual Axis',
      Fuel: 'Metallic Hydrogen'
    },
    description: 'High-thrust vectoring bells allow instantaneous pitch, yaw, and translation at near-luminal velocities.'
  },
  {
    id: 'cockpit',
    name: 'NEURO-SYNC COCKPIT',
    sub: 'Holographic Neural Cockpit Interface',
    localPos: new Vec3(0, 0.75, -1.2),
    specs: {
      Latency: '< 0.12 ms',
      Optics: 'Photonic Telemetry HUD',
      LifeSupport: 'Atmosphere Class 1',
      Ejection: 'Stasis Warp Pod'
    },
    description: 'Pilot consciousness links directly into the ship telemetry for reflex-speed dogfighting and trajectory plotting.'
  },
  {
    id: 'shields',
    name: 'PHASE DEFLECTION MATRIX',
    sub: 'Electromagnetic Flux Barrier',
    localPos: new Vec3(-3.2, 0.15, 1.2),
    specs: {
      Absorption: '850 GigaJoules',
      Recharge: '4.2 sec',
      Harmonic: 'Multi-Band Prism',
      Coverage: '360° Spherical Bubble'
    },
    description: 'Disperses kinetic micro-meteorites and high-energy particle beams across a polarized energy envelope.'
  }
];


// ===== js/webgl-renderer.js =====
/**
 * WebGLRenderer: High-performance 3D WebGL Pipeline with Fresnel Shading,
 * Starfield Streaks, Dynamic Lighting, and 2D Hotspot Projection.
 */




const VS_LIT = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec4 aColor;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uNormalMatrix;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vEyeDir;

void main() {
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vec4 viewPos = uView * worldPos;
  gl_Position = uProjection * viewPos;

  vPosition = worldPos.xyz;
  vNormal = normalize((uNormalMatrix * vec4(aNormal, 0.0)).xyz);
  vEyeDir = normalize(-viewPos.xyz);
  vColor = aColor;
}
`;

const FS_LIT = `
precision highp float;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vColor;
varying vec3 vEyeDir;

uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;
uniform vec3 uNeonColor;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform float uScrollSpeed;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(vEyeDir);

  // Diffuse
  float diff = max(dot(N, L), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular Blinn-Phong
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 32.0);
  vec3 specular = spec * vec3(1.0, 1.0, 1.0) * 0.7;

  // Fresnel Edge Glow for cybernetic look
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 rimGlow = fresnel * uNeonColor * (0.8 + uScrollSpeed * 0.4);

  vec3 base = vColor.rgb * (uAmbientColor + diffuse) + specular + rimGlow;

  // Depth fog
  float dist = length(vPosition);
  float fogFactor = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 0.95);
  vec3 finalColor = mix(base, uFogColor, fogFactor);

  gl_FragColor = vec4(finalColor, vColor.a);
}
`;

const VS_POINTS = `
attribute vec3 aPosition;
attribute vec4 aColor;
attribute float aSize;

uniform mat4 uView;
uniform mat4 uProjection;
uniform float uScrollSpeed;
uniform float uPixelRatio;

varying vec4 vColor;

void main() {
  vec4 viewPos = uView * vec4(aPosition, 1.0);
  gl_Position = uProjection * viewPos;

  // Streak stars proportionally to scroll velocity
  float streak = 1.0 + min(uScrollSpeed * 2.5, 6.0);
  gl_PointSize = max(1.5, aSize * (150.0 / -viewPos.z) * streak) * uPixelRatio;

  vColor = aColor;
}
`;

const FS_POINTS = `
precision mediump float;
varying vec4 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist) * vColor.a;
  gl_FragColor = vec4(vColor.rgb, alpha);
}
`;

class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance' });

    if (!this.gl) {
      throw new Error('WebGL not supported in this browser.');
    }

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;

    this.litProgram = null;
    this.pointsProgram = null;

    // Camera and Matrices
    this.cameraPos = new Vec3(0, 2, 7);
    this.cameraTarget = new Vec3(0, 0, 0);
    this.cameraUp = new Vec3(0, 1, 0);
    this.cameraFov = 45 * (Math.PI / 180);

    this.viewMatrix = new Mat4();
    this.projMatrix = new Mat4();
    this.viewProjMatrix = new Mat4();

    // Scene animation variables
    this.shipRoll = 0;
    this.shipPitch = 0;
    this.shipYaw = 0;
    this.quantumRingAngle1 = 0;
    this.quantumRingAngle2 = 0;

    // Theme & palette
    this.neonColor = [0.0, 0.95, 1.0];
    this.hullColor = [0.15, 0.18, 0.24];
    this.fogColor = [0.02, 0.04, 0.08];

    // Gate positions along the flight runway
    this.gateZPositions = [-25, -60, -110, -170, -240, -320, -410, -510];

    // Monoliths on side flanks
    this.monoliths = [
      { pos: new Vec3(-22, 0, -50), scale: new Vec3(1.2, 1.8, 1.2), rot: 0.3 },
      { pos: new Vec3(22, 5, -80), scale: new Vec3(1.5, 2.2, 1.5), rot: -0.4 },
      { pos: new Vec3(-28, -2, -140), scale: new Vec3(2.0, 3.0, 2.0), rot: 0.8 },
      { pos: new Vec3(26, 8, -200), scale: new Vec3(1.8, 2.8, 1.8), rot: -0.7 },
      { pos: new Vec3(-32, 10, -280), scale: new Vec3(2.5, 3.5, 2.5), rot: 1.1 },
      { pos: new Vec3(35, -5, -360), scale: new Vec3(2.2, 4.0, 2.2), rot: -0.5 },
      { pos: new Vec3(-24, 6, -460), scale: new Vec3(3.0, 4.5, 3.0), rot: 0.4 }
    ];

    this.init();
  }

  init() {
    const gl = this.gl;
    gl.clearColor(0.02, 0.03, 0.07, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Blending for glow and particles
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Compile Shaders
    this.litProgram = this.createProgram(VS_LIT, FS_LIT);
    this.pointsProgram = this.createProgram(VS_POINTS, FS_POINTS);

    // Build mesh buffers
    this.initMeshes();
    this.initStarfield();

    this.resize();
  }

  createShader(type, src) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  createProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  createMeshBuffer(meshData) {
    const gl = this.gl;
    const vao = {
      posBuffer: gl.createBuffer(),
      normBuffer: gl.createBuffer(),
      colBuffer: gl.createBuffer(),
      idxBuffer: gl.createBuffer(),
      indexCount: meshData.indices.length
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, vao.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.positions), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vao.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vao.colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.colors), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.indices), gl.STATIC_DRAW);

    return vao;
  }

  initMeshes() {
    this.shipVao = this.createMeshBuffer(buildStarfighterMesh(this.hullColor, this.neonColor));
    this.ringVao1 = this.createMeshBuffer(buildRingMesh(1.4, 0.06, 32, 6, [...this.neonColor, 0.95]));
    this.ringVao2 = this.createMeshBuffer(buildRingMesh(1.8, 0.05, 36, 6, [1.0, 0.25, 0.8, 0.85]));
    this.gateVao = this.createMeshBuffer(buildHexGateMesh(14.0, 1.4, 3.0, [...this.neonColor, 0.9]));
    this.monolithVao = this.createMeshBuffer(buildMonolithMesh(5, 35, 5, [0.06, 0.08, 0.12, 1.0], this.neonColor));
    this.flameVao = this.createMeshBuffer(buildFlameMesh(3.8, 0.42, 16, this.neonColor));
  }

  updateCustomColors(hull, neon) {
    this.hullColor = hull;
    this.neonColor = neon;
    this.initMeshes();
  }

  initStarfield() {
    const gl = this.gl;
    this.starData = generateStarfieldData(3000, 160, 110, 550);

    this.starVao = {
      posBuffer: gl.createBuffer(),
      colBuffer: gl.createBuffer(),
      sizeBuffer: gl.createBuffer(),
      count: this.starData.count
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.starData.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.starData.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.starData.sizes, gl.STATIC_DRAW);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (this.width !== w || this.height !== h) {
      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * this.pixelRatio);
      this.canvas.height = Math.floor(h * this.pixelRatio);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render(state) {
    const gl = this.gl;
    this.resize();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = this.width / Math.max(1, this.height);
    const dynamicFov = this.cameraFov + (state.isBoosting ? 18 : 0) * (Math.PI / 180);
    this.projMatrix.perspective(dynamicFov, aspect, 0.1, 800.0);
    this.viewMatrix.lookAt(this.cameraPos, this.cameraTarget, this.cameraUp);

    // Compute ViewProj for 3D hotspots
    Mat4.multiplyMatrices(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

    // 1. RENDER STARFIELD
    this.renderStarfield(state);

    // 2. RENDER MONOLITHS & ENVIRONMENT
    this.renderEnvironment(state);

    // 3. RENDER WARP GATES
    this.renderWarpGates(state);

    // 4. RENDER STARFIGHTER
    this.renderStarfighter(state);

    // Return projected hotspots for 2D UI overlay
    return this.calculateProjectedHotspots(state);
  }

  renderStarfield(state) {
    const gl = this.gl;
    gl.useProgram(this.pointsProgram);

    // Bind Star buffers
    const pLoc = gl.getAttribLocation(this.pointsProgram, 'aPosition');
    const cLoc = gl.getAttribLocation(this.pointsProgram, 'aColor');
    const sLoc = gl.getAttribLocation(this.pointsProgram, 'aSize');

    gl.enableVertexAttribArray(pLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.posBuffer);
    gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(cLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.colBuffer);
    gl.vertexAttribPointer(cLoc, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(sLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.starVao.sizeBuffer);
    gl.vertexAttribPointer(sLoc, 1, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointsProgram, 'uView'), false, this.viewMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.pointsProgram, 'uProjection'), false, this.projMatrix.elements);
    gl.uniform1f(gl.getUniformLocation(this.pointsProgram, 'uScrollSpeed'), Math.abs(state.scrollVelocity) + (state.isBoosting ? 3.5 : 0));
    gl.uniform1f(gl.getUniformLocation(this.pointsProgram, 'uPixelRatio'), this.pixelRatio);

    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(gl.POINTS, 0, this.starVao.count);
    gl.enable(gl.DEPTH_TEST);

    gl.disableVertexAttribArray(pLoc);
    gl.disableVertexAttribArray(cLoc);
    gl.disableVertexAttribArray(sLoc);
  }

  drawMesh(vao, modelMatrix, scrollSpeed) {
    const gl = this.gl;

    const pLoc = gl.getAttribLocation(this.litProgram, 'aPosition');
    const nLoc = gl.getAttribLocation(this.litProgram, 'aNormal');
    const cLoc = gl.getAttribLocation(this.litProgram, 'aColor');

    gl.enableVertexAttribArray(pLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vao.posBuffer);
    gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(nLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vao.normBuffer);
    gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(cLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, vao.colBuffer);
    gl.vertexAttribPointer(cLoc, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vao.idxBuffer);

    // Normal matrix
    const normMat = modelMatrix.clone();

    gl.uniformMatrix4fv(gl.getUniformLocation(this.litProgram, 'uModel'), false, modelMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.litProgram, 'uView'), false, this.viewMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.litProgram, 'uProjection'), false, this.projMatrix.elements);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.litProgram, 'uNormalMatrix'), false, normMat.elements);

    gl.uniform3f(gl.getUniformLocation(this.litProgram, 'uLightDir'), 0.5, 0.8, 0.4);
    gl.uniform3f(gl.getUniformLocation(this.litProgram, 'uLightColor'), 1.0, 0.98, 0.95);
    gl.uniform3f(gl.getUniformLocation(this.litProgram, 'uAmbientColor'), 0.22, 0.24, 0.32);
    gl.uniform3f(gl.getUniformLocation(this.litProgram, 'uNeonColor'), this.neonColor[0], this.neonColor[1], this.neonColor[2]);
    gl.uniform3f(gl.getUniformLocation(this.litProgram, 'uFogColor'), this.fogColor[0], this.fogColor[1], this.fogColor[2]);
    gl.uniform1f(gl.getUniformLocation(this.litProgram, 'uFogNear'), 40.0);
    gl.uniform1f(gl.getUniformLocation(this.litProgram, 'uFogFar'), 380.0);
    gl.uniform1f(gl.getUniformLocation(this.litProgram, 'uScrollSpeed'), scrollSpeed);

    gl.drawElements(gl.TRIANGLES, vao.indexCount, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(pLoc);
    gl.disableVertexAttribArray(nLoc);
    gl.disableVertexAttribArray(cLoc);
  }

  renderEnvironment(state) {
    const gl = this.gl;
    gl.useProgram(this.litProgram);

    // Monoliths along flight lane
    for (const m of this.monoliths) {
      const model = new Mat4();
      model.translate(m.pos.x, m.pos.y, m.pos.z);
      model.rotateY(m.rot);
      model.scale(m.scale.x, m.scale.y, m.scale.z);
      this.drawMesh(this.monolithVao, model, Math.abs(state.scrollVelocity));
    }
  }

  renderWarpGates(state) {
    const gl = this.gl;
    gl.useProgram(this.litProgram);

    // Rotating hexagonal gates that the craft zooms through
    this.gateZPositions.forEach((zPos, index) => {
      const model = new Mat4();
      model.translate(0, 0, zPos);
      model.rotateZ(state.time * 0.4 + index * 0.7);
      this.drawMesh(this.gateVao, model, Math.abs(state.scrollVelocity));
    });
  }

  renderStarfighter(state) {
    const gl = this.gl;
    gl.useProgram(this.litProgram);

    // Ship base world transform
    this.shipModelMatrix = new Mat4();
    this.shipModelMatrix.translate(state.shipPos.x, state.shipPos.y, state.shipPos.z);

    // Steering roll, pitch, and yaw bank
    this.shipModelMatrix.rotateY(this.shipYaw);
    this.shipModelMatrix.rotateX(this.shipPitch);
    this.shipModelMatrix.rotateZ(this.shipRoll);

    // Draw starfighter fuselage & wings
    this.drawMesh(this.shipVao, this.shipModelMatrix, Math.abs(state.scrollVelocity));

    // Spinning Quantum Core Rings around the hull
    const ring1Mat = this.shipModelMatrix.clone();
    ring1Mat.translate(0, 0.45, 0.3);
    ring1Mat.rotateZ(this.quantumRingAngle1);
    ring1Mat.rotateX(0.3);
    this.drawMesh(this.ringVao1, ring1Mat, Math.abs(state.scrollVelocity));

    const ring2Mat = this.shipModelMatrix.clone();
    ring2Mat.translate(0, 0.45, 0.3);
    ring2Mat.rotateZ(-this.quantumRingAngle2);
    ring2Mat.rotateY(0.4);
    this.drawMesh(this.ringVao2, ring2Mat, Math.abs(state.scrollVelocity));

    // Dynamic Thruster Flame Plumes
    const flameScale = 1.0 + Math.min(2.5, Math.abs(state.scrollVelocity) * 1.5 + (state.isBoosting ? 2.0 : 0)) + Math.sin(state.time * 25.0) * 0.12;
    const flameLMat = this.shipModelMatrix.clone();
    flameLMat.translate(-1.1, 0.1, 2.9);
    flameLMat.scale(1.0, 1.0, flameScale);
    this.drawMesh(this.flameVao, flameLMat, Math.abs(state.scrollVelocity));

    const flameRMat = this.shipModelMatrix.clone();
    flameRMat.translate(1.1, 0.1, 2.9);
    flameRMat.scale(1.0, 1.0, flameScale);
    this.drawMesh(this.flameVao, flameRMat, Math.abs(state.scrollVelocity));
  }

  calculateProjectedHotspots(state) {
    if (!this.shipModelMatrix) return [];

    const projected = [];
    const w = this.width;
    const h = this.height;

    // Full ModelViewProjection Matrix for the starfighter
    const mvp = new Mat4();
    Mat4.multiplyMatrices(mvp, this.viewProjMatrix, this.shipModelMatrix);

    for (const spot of SHIP_HOTSPOTS) {
      const proj = mvp.projectPoint(spot.localPos);
      if (proj && proj.visible) {
        // Convert normalized device coords (-1..1) to screen pixels
        const screenX = (proj.x * 0.5 + 0.5) * w;
        const screenY = (-proj.y * 0.5 + 0.5) * h;

        projected.push({
          id: spot.id,
          name: spot.name,
          sub: spot.sub,
          specs: spot.specs,
          description: spot.description,
          x: screenX,
          y: screenY,
          depth: proj.z
        });
      }
    }

    return projected;
  }
}


// ===== js/timeline.js =====
/**
 * Timeline: Cinematic Camera Choreography & Physics-based Video Scroll Engine
 */



const CHAPTERS = [
  {
    index: 0,
    timecode: '00:00:00:00',
    progress: 0.0,
    badge: 'PHASE 01',
    title: 'ORBITAL LAUNCH DEPARTURE',
    subtitle: 'Valkyrie-VII pre-flight telemetry check & thruster ignition sequence',
    description: 'Cold-start of the Zero-Point reactor. Anti-gravity repulsors disengage as sub-orbital thrusters spin up to baseline idle.',
    telemetry: {
      ALTITUDE: '420.5 KM',
      VELOCITY: '1,240 M/S',
      REACTOR: 'ONLINE (98.4%)',
      PRESSURE: '0.0001 BAR'
    }
  },
  {
    index: 1,
    timecode: '00:00:15:18',
    progress: 0.25,
    badge: 'PHASE 02',
    title: 'WARP TUNNEL ACCELERATION',
    subtitle: 'Hexagonal gate resonance & trans-luminal corridor entry',
    description: 'Engaging magnetic induction rings. Space-time curvature expands along vector -Z, creating an artificial gravitational slipstream.',
    telemetry: {
      ALTITUDE: '1,850 KM',
      VELOCITY: 'MACH 18.2',
      CORRIDOR: 'LOCKED // GATES 1-8',
      DEFLECTION: 'ACTIVE'
    }
  },
  {
    index: 2,
    timecode: '00:00:30:12',
    progress: 0.50,
    badge: 'PHASE 03',
    title: 'DEEP NEBULA MONOLITH',
    subtitle: 'Orbital celestial sweep past ancient alien relativistic relays',
    description: 'Wide cinematic pan around the starboard wing as high-energy cosmic radiation reflects off the composite stealth nanocoating.',
    telemetry: {
      ALTITUDE: 'DEEP ORBIT',
      VELOCITY: '0.12 C',
      INTERFERENCE: '0.04% (NOMINAL)',
      GRAV_WELL: 'STABLE'
    }
  },
  {
    index: 3,
    timecode: '00:00:45:06',
    progress: 0.75,
    badge: 'PHASE 04',
    title: 'SINGULARITY OVERDRIVE',
    subtitle: 'Polarized phase shield surge & hyper-thruster combustion',
    description: 'All kinetic deflectors overcharged. Plasma nozzles expand to maximum aperture, emitting concentrated violet ion trails.',
    telemetry: {
      ALTITUDE: 'SUB-WARP 4',
      VELOCITY: '0.88 C',
      THERMAL: '8,400 K',
      SHIELD_FLUX: 'MAXIMUM'
    }
  },
  {
    index: 4,
    timecode: '00:01:00:00',
    progress: 1.0,
    badge: 'PHASE 05',
    title: 'THE QUANTUM NEXUS',
    subtitle: 'Arrival at command station // 360° tactical inspection & config',
    description: 'Full docking lock confirmed. Systems enter passive surveillance mode. Subsystems ready for interactive diagnostics & configuration.',
    telemetry: {
      ALTITUDE: 'NEXUS DOCK 07',
      VELOCITY: '0.0 M/S (LOCKED)',
      INTERFACE: 'DIAGNOSTIC 360',
      STATUS: 'MISSION READY'
    }
  }
];

// 5 Cinematic Camera Waypoints along the scroll track
const CAMERA_KEYFRAMES = [
  // 0: Phase 1 - Low angle heroic tilt
  {
    scroll: 0.0,
    camPos: new Vec3(2.5, -0.6, 5.2),
    camTarget: new Vec3(0, 0.4, 0.0),
    shipPos: new Vec3(0, 0, 0),
    fov: 46
  },
  // 1: Phase 2 - High-speed rear chase camera
  {
    scroll: 0.25,
    camPos: new Vec3(0.0, 1.6, 6.8),
    camTarget: new Vec3(0, 0.2, -4.0),
    shipPos: new Vec3(0, 0, -50),
    fov: 52
  },
  // 2: Phase 3 - Sweeping side dynamic orbit
  {
    scroll: 0.50,
    camPos: new Vec3(-7.5, 3.2, 3.5),
    camTarget: new Vec3(0, 0.2, 0.0),
    shipPos: new Vec3(0, 0, -120),
    fov: 48
  },
  // 3: Phase 4 - Dramatic frontal face-to-face overcharge
  {
    scroll: 0.75,
    camPos: new Vec3(1.8, 1.2, -7.5),
    camTarget: new Vec3(0, 0.1, -0.5),
    shipPos: new Vec3(0, 0, -220),
    fov: 50
  },
  // 4: Phase 5 - Nexus elevated isometric 360 vantage
  {
    scroll: 1.0,
    camPos: new Vec3(5.0, 3.5, 6.2),
    camTarget: new Vec3(0, 0.2, 0.0),
    shipPos: new Vec3(0, 0, -320),
    fov: 45
  }
];

class TimelineController {
  constructor() {
    this.currentProgress = 0.0;
    this.targetProgress = 0.0;
    this.scrollVelocity = 0.0;

    // Playback state
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.isDraggingScrubber = false;
    this.isBoosting = false;

    // Camera Mode: 'CHASE' | 'COCKPIT' | 'ORBIT' | 'FREE'
    this.cameraMode = 'CHASE';

    // Interactive free rotation angles for Phase 5 / inspect mode
    this.orbitYaw = 0.6;
    this.orbitPitch = 0.3;
    this.targetOrbitYaw = 0.6;
    this.targetOrbitPitch = 0.3;

    // Mouse parallax steering
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    // Audio & UI callbacks
    this.onChapterChange = null;
    this.activeChapterIndex = 0;
  }

  setMouse(x, y) {
    this.targetMouseX = clamp(x, -1, 1);
    this.targetMouseY = clamp(y, -1, 1);
  }

  addScroll(deltaY) {
    // Smooth scrolling sensitivity
    const delta = deltaY * 0.00065;
    this.targetProgress = clamp(this.targetProgress + delta, 0.0, 1.0);
  }

  seek(progress) {
    this.targetProgress = clamp(progress, 0.0, 1.0);
    this.currentProgress = this.targetProgress;
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  update(dt) {
    // Autonomous video playback
    if (this.isPlaying && !this.isDraggingScrubber) {
      const step = (dt * 0.05) * this.playbackSpeed;
      this.targetProgress += step;
      if (this.targetProgress >= 1.0) {
        this.targetProgress = 1.0;
        this.isPlaying = false;
      }
    }

    // Boost acceleration
    if (this.isBoosting) {
      this.targetProgress = clamp(this.targetProgress + dt * 0.12, 0.0, 1.0);
    }

    // Silky smooth inertia damping
    const prevProgress = this.currentProgress;
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.085;
    this.scrollVelocity = (this.currentProgress - prevProgress) / Math.max(dt, 0.001);

    // Mouse smoothing
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

    // Orbit angles smoothing
    this.orbitYaw += (this.targetOrbitYaw - this.orbitYaw) * 0.1;
    this.orbitPitch += (this.targetOrbitPitch - this.orbitPitch) * 0.1;

    // Check chapter transitions
    const newChapterIndex = this.getCurrentChapterIndex();
    if (newChapterIndex !== this.activeChapterIndex) {
      this.activeChapterIndex = newChapterIndex;
      if (this.onChapterChange) {
        this.onChapterChange(CHAPTERS[newChapterIndex]);
      }
    }

    return this.calculateCameraFrame();
  }

  getCurrentChapterIndex() {
    const p = this.currentProgress;
    if (p < 0.20) return 0;
    if (p < 0.45) return 1;
    if (p < 0.70) return 2;
    if (p < 0.88) return 3;
    return 4;
  }

  calculateCameraFrame() {
    const p = this.currentProgress;

    // Find bounding keyframe indices
    const keys = CAMERA_KEYFRAMES;
    let segIndex = 0;
    for (let i = 0; i < keys.length - 1; i++) {
      if (p >= keys[i].scroll && p <= keys[i + 1].scroll) {
        segIndex = i;
        break;
      }
    }

    const k0 = keys[Math.max(0, segIndex - 1)];
    const k1 = keys[segIndex];
    const k2 = keys[Math.min(keys.length - 1, segIndex + 1)];
    const k3 = keys[Math.min(keys.length - 1, segIndex + 2)];

    const segDuration = k2.scroll - k1.scroll;
    const localT = segDuration > 0.0001 ? (p - k1.scroll) / segDuration : 0;
    const t = clamp(localT, 0, 1);

    // Spline interpolated camera and target positions
    const camPos = catmullRomVec3(k0.camPos, k1.camPos, k2.camPos, k3.camPos, t);
    const camTarget = catmullRomVec3(k0.camTarget, k1.camTarget, k2.camTarget, k3.camTarget, t);
    const shipPos = catmullRomVec3(k0.shipPos, k1.shipPos, k2.shipPos, k3.shipPos, t);

    // Camera Mode overrides
    if (this.cameraMode === 'COCKPIT') {
      // First-person cockpit camera placed inside starfighter
      camPos.set(shipPos.x, shipPos.y + 0.65, shipPos.z - 0.9);
      camTarget.set(shipPos.x + this.mouseX * 2.0, shipPos.y + 0.5 - this.mouseY * 1.5, shipPos.z - 15.0);
    } else if (this.cameraMode === 'ORBIT' || (this.cameraMode === 'FREE' && p >= 0.88)) {
      // 360 degree orbital inspect camera
      const radius = 7.5;
      camPos.x = shipPos.x + Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch) * radius;
      camPos.y = shipPos.y + Math.sin(this.orbitPitch) * radius;
      camPos.z = shipPos.z + Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch) * radius;
      camTarget.copy(shipPos).add(new Vec3(0, 0.3, 0));
    } else {
      // Chase / Cinematic mode with mouse parallax
      camPos.x += this.mouseX * 1.2;
      camPos.y += -this.mouseY * 0.8;
      camTarget.x += this.mouseX * 0.5;
    }

    // Ship banking reactions
    const roll = this.mouseX * -0.55 - this.scrollVelocity * 0.15;
    const pitch = this.mouseY * 0.35 + (this.isBoosting ? -0.15 : 0);
    const yaw = this.mouseX * -0.3;

    return {
      camPos,
      camTarget,
      shipPos,
      roll,
      pitch,
      yaw,
      progress: this.currentProgress,
      velocity: this.scrollVelocity,
      isBoosting: this.isBoosting
    };
  }

  getTimecodeString() {
    const totalFrames = Math.floor(this.currentProgress * 60 * 60); // 60 seconds * 60 FPS
    const frames = totalFrames % 60;
    const totalSeconds = Math.floor(totalFrames / 60);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    const pad = (n) => String(n).padStart(2, '0');
    return `00:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }
}


// ===== js/app.js =====
/**
 * App: Master Controller & Interactive HUD Coordinator
 */





// Color Presets for Starfighter Customizer
const COLOR_PRESETS = [
  {
    name: 'CYBER-CYAN (DEFAULT)',
    hull: [0.12, 0.16, 0.22],
    neon: [0.0, 0.95, 1.0],
    badgeColor: '#00f0ff'
  },
  {
    name: 'SOLAR FLARE',
    hull: [0.18, 0.14, 0.10],
    neon: [1.0, 0.65, 0.05],
    badgeColor: '#ffaa00'
  },
  {
    name: 'VOID PURPLE',
    hull: [0.14, 0.10, 0.20],
    neon: [0.85, 0.15, 1.0],
    badgeColor: '#bd00ff'
  },
  {
    name: 'CRIMSON OVERDRIVE',
    hull: [0.18, 0.08, 0.08],
    neon: [1.0, 0.2, 0.3],
    badgeColor: '#ff2a55'
  },
  {
    name: 'TITANIUM PHANTOM',
    hull: [0.45, 0.48, 0.52],
    neon: [0.95, 0.98, 1.0],
    badgeColor: '#ffffff'
  }
];

class Application {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.hudCanvas = document.getElementById('audio-visualizer');
    this.hotspotContainer = document.getElementById('hotspots-layer');

    this.audio = new AudioSystem();
    this.renderer = new WebGLRenderer(this.canvas);
    this.timeline = new TimelineController();

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    this.audioWaveData = new Uint8Array(64);
    this.activeHotspotId = null;

    this.initUI();
    this.bindEvents();
    this.setupTimelineScrubber();

    // Start render loop
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  initUI() {
    // Populate chapter markers in scrubber
    const chapterMarksContainer = document.getElementById('scrubber-chapters');
    if (chapterMarksContainer) {
      chapterMarksContainer.innerHTML = '';
      CHAPTERS.forEach((ch, idx) => {
        const mark = document.createElement('div');
        mark.className = 'chapter-mark';
        mark.style.left = `${ch.progress * 100}%`;
        mark.title = `${ch.badge}: ${ch.title}`;
        mark.innerHTML = `
          <div class="mark-pin"></div>
          <div class="mark-label">${ch.badge}</div>
        `;
        mark.addEventListener('click', (e) => {
          e.stopPropagation();
          this.audio.init();
          this.audio.playUiClick();
          this.timeline.seek(ch.progress);
        });
        chapterMarksContainer.appendChild(mark);
      });
    }

    // Populate theme presets in customizer panel
    const presetContainer = document.getElementById('color-preset-buttons');
    if (presetContainer) {
      presetContainer.innerHTML = '';
      COLOR_PRESETS.forEach((preset, idx) => {
        const btn = document.createElement('button');
        btn.className = `preset-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerHTML = `
          <span class="color-dot" style="background: ${preset.badgeColor}; box-shadow: 0 0 10px ${preset.badgeColor}"></span>
          <span class="preset-name">${preset.name}</span>
        `;
        btn.addEventListener('click', () => {
          this.audio.init();
          this.audio.playUiClick();
          document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderer.updateCustomColors(preset.hull, preset.neon);
          document.documentElement.style.setProperty('--neon-accent', preset.badgeColor);
        });
        presetContainer.appendChild(btn);
      });
    }

    // Connect timeline chapter change to HUD story cards
    this.timeline.onChapterChange = (chapter) => {
      this.updateChapterCard(chapter);
    };

    // Initialize first chapter
    this.updateChapterCard(CHAPTERS[0]);
  }

  updateChapterCard(chapter) {
    const card = document.getElementById('chapter-info-card');
    if (!card) return;

    card.classList.remove('fade-in');
    void card.offsetWidth; // Force CSS reflow
    card.classList.add('fade-in');

    document.getElementById('ch-badge').textContent = chapter.badge;
    document.getElementById('ch-title').textContent = chapter.title;
    document.getElementById('ch-subtitle').textContent = chapter.subtitle;
    document.getElementById('ch-description').textContent = chapter.description;

    const telemList = document.getElementById('ch-telemetry');
    if (telemList) {
      telemList.innerHTML = '';
      for (const [key, val] of Object.entries(chapter.telemetry)) {
        const item = document.createElement('div');
        item.className = 'telem-item';
        item.innerHTML = `<span class="telem-key">${key}:</span> <span class="telem-val">${val}</span>`;
        telemList.appendChild(item);
      }
    }
  }

  setupTimelineScrubber() {
    const scrubberTrack = document.getElementById('scrubber-track');
    const scrubHandle = document.getElementById('scrubber-handle');
    const scrubFill = document.getElementById('scrubber-fill');

    let isPointerDown = false;

    const updateSeekFromEvent = (e) => {
      const rect = scrubberTrack.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.timeline.seek(progress);
    };

    scrubberTrack.addEventListener('pointerdown', (e) => {
      this.audio.init();
      isPointerDown = true;
      this.timeline.isDraggingScrubber = true;
      updateSeekFromEvent(e);
      scrubberTrack.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (isPointerDown) {
        updateSeekFromEvent(e);
      }
    });

    window.addEventListener('pointerup', () => {
      if (isPointerDown) {
        isPointerDown = false;
        this.timeline.isDraggingScrubber = false;
      }
    });
  }

  bindEvents() {
    // Wheel event for silky video scroll
    window.addEventListener('wheel', (e) => {
      this.audio.init();
      this.timeline.addScroll(e.deltaY);
    }, { passive: true });

    // Touch swipe handling
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      this.audio.init();
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = (touchStartY - currentY) * 2.2;
      touchStartY = currentY;
      this.timeline.addScroll(deltaY);
    }, { passive: true });

    // Mouse movement for 3D parallax steering & free orbit
    let isOrbitDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      this.timeline.setMouse(normX, normY);

      if (isOrbitDragging && (this.timeline.cameraMode === 'ORBIT' || this.timeline.currentProgress >= 0.88)) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        this.timeline.targetOrbitYaw -= dx * 0.008;
        this.timeline.targetOrbitPitch = Math.max(-1.2, Math.min(1.2, this.timeline.targetOrbitPitch + dy * 0.008));
      }
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.audio.init();
      isOrbitDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isOrbitDragging = false;
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (e.code === 'Space') {
        e.preventDefault();
        this.timeline.isBoosting = true;
        this.audio.playWarpBoom();
        document.body.classList.add('hyper-boost-active');
      } else if (e.key === 'c' || e.key === 'C') {
        this.cycleCamera();
      } else if (e.key === 'm' || e.key === 'M') {
        this.toggleAudioMute();
      } else if (e.key >= '1' && e.key <= '5') {
        const idx = parseInt(e.key) - 1;
        this.timeline.seek(CHAPTERS[idx].progress);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        this.timeline.addScroll(80);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        this.timeline.addScroll(-80);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.timeline.isBoosting = false;
        document.body.classList.remove('hyper-boost-active');
      }
    });

    // Play / Pause Button
    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.audio.init();
        const playing = this.timeline.togglePlay();
        this.audio.playUiClick();
        playBtn.innerHTML = playing ?
          `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> <span>PAUSE</span>` :
          `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> <span>PLAY REEL</span>`;
      });
    }

    // Boost Button
    const boostBtn = document.getElementById('btn-hyper-boost');
    if (boostBtn) {
      const activateBoost = (e) => {
        e.preventDefault();
        this.audio.init();
        this.timeline.isBoosting = true;
        this.audio.playWarpBoom();
        document.body.classList.add('hyper-boost-active');
      };
      const deactivateBoost = (e) => {
        e.preventDefault();
        this.timeline.isBoosting = false;
        document.body.classList.remove('hyper-boost-active');
      };

      boostBtn.addEventListener('mousedown', activateBoost);
      boostBtn.addEventListener('mouseup', deactivateBoost);
      boostBtn.addEventListener('touchstart', activateBoost);
      boostBtn.addEventListener('touchend', deactivateBoost);
    }

    // Camera Mode Buttons
    document.querySelectorAll('[data-cam-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.init();
        this.audio.playUiClick();
        const mode = btn.getAttribute('data-cam-mode');
        this.setCameraMode(mode);
      });
    });

    // Sound Mute Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.audio.init();
        this.toggleAudioMute();
      });
    }

    // Customizer Modal Toggle
    const customizerToggle = document.getElementById('btn-toggle-customizer');
    const customizerPanel = document.getElementById('customizer-panel');
    const closeCustomizer = document.getElementById('btn-close-customizer');

    if (customizerToggle && customizerPanel) {
      customizerToggle.addEventListener('click', () => {
        this.audio.init();
        this.audio.playUiClick();
        customizerPanel.classList.toggle('hidden');
      });
    }
    if (closeCustomizer && customizerPanel) {
      closeCustomizer.addEventListener('click', () => {
        this.audio.playUiClick();
        customizerPanel.classList.add('hidden');
      });
    }

    // Modal close for Hotspot Telemetry
    const closeDiag = document.getElementById('btn-close-diag');
    const diagModal = document.getElementById('diagnostic-modal');
    if (closeDiag && diagModal) {
      closeDiag.addEventListener('click', () => {
        this.audio.playUiClick();
        diagModal.classList.add('hidden');
        this.activeHotspotId = null;
      });
    }

    // Power allocation slider inside diagnostic modal
    const powerSlider = document.getElementById('diag-power-slider');
    const powerVal = document.getElementById('diag-power-val');
    if (powerSlider && powerVal) {
      powerSlider.addEventListener('input', (e) => {
        powerVal.textContent = `${e.target.value}%`;
      });
    }
  }

  setCameraMode(mode) {
    this.timeline.cameraMode = mode;
    document.querySelectorAll('[data-cam-mode]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-cam-mode') === mode);
    });
  }

  cycleCamera() {
    const modes = ['CHASE', 'COCKPIT', 'ORBIT'];
    const curIdx = modes.indexOf(this.timeline.cameraMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    this.setCameraMode(nextMode);
  }

  toggleAudioMute() {
    const isMuted = this.audio.toggleMute();
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      btn.innerHTML = isMuted ?
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>` :
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      btn.classList.toggle('muted', isMuted);
    }
  }

  renderLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    // Calculate FPS
    this.frameCount++;
    if (timestamp - this.fpsTimer >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (timestamp - this.fpsTimer));
      document.getElementById('fps-counter').textContent = `${fps} FPS`;
      this.frameCount = 0;
      this.fpsTimer = timestamp;
    }

    // 1. Update Timeline & Physics
    const camFrame = this.timeline.update(dt);

    // 2. Update Audio Synthesizer
    this.audio.updateEngine(Math.abs(camFrame.velocity), camFrame.isBoosting);

    // 3. Update WebGL Camera & Ship orientation
    this.renderer.cameraPos.copy(camFrame.camPos);
    this.renderer.cameraTarget.copy(camFrame.camTarget);
    this.renderer.shipRoll = camFrame.roll;
    this.renderer.shipPitch = camFrame.pitch;
    this.renderer.shipYaw = camFrame.yaw;

    // Spin quantum core rings
    const ringSpeed = 1.8 + Math.abs(camFrame.velocity) * 3.0 + (camFrame.isBoosting ? 6.0 : 0);
    this.renderer.quantumRingAngle1 += dt * ringSpeed;
    this.renderer.quantumRingAngle2 += dt * (ringSpeed * 1.3);

    // 4. Render 3D Scene
    const projectedHotspots = this.renderer.render({
      time: timestamp * 0.001,
      scrollVelocity: camFrame.velocity,
      isBoosting: camFrame.isBoosting,
      shipPos: camFrame.shipPos
    });

    // 5. Update 2D Interactive Hotspots Overlay
    this.updateHotspotsUI(projectedHotspots);

    // 6. Update HUD Elements
    this.updateHUD(camFrame);

    // 7. Draw Audio Waveform Oscilloscope
    this.drawAudioVisualizer();

    requestAnimationFrame((t) => this.renderLoop(t));
  }

  updateHotspotsUI(hotspots) {
    if (!this.hotspotContainer) return;

    // Keep existing elements or update positions
    hotspots.forEach(spot => {
      let el = document.getElementById(`hotspot-pin-${spot.id}`);
      if (!el) {
        el = document.createElement('div');
        el.id = `hotspot-pin-${spot.id}`;
        el.className = 'hotspot-marker';
        el.innerHTML = `
          <div class="hotspot-pulse"></div>
          <div class="hotspot-point"></div>
          <div class="hotspot-callout">
            <span class="hotspot-title">${spot.name}</span>
            <span class="hotspot-sub">${spot.sub}</span>
          </div>
        `;
        el.addEventListener('click', () => {
          this.audio.init();
          this.audio.playHotspotChime();
          this.openDiagnosticModal(spot);
        });
        this.hotspotContainer.appendChild(el);
      }

      el.style.transform = `translate3d(${spot.x}px, ${spot.y}px, 0)`;
      el.classList.toggle('active', this.activeHotspotId === spot.id);
    });
  }

  openDiagnosticModal(spot) {
    this.activeHotspotId = spot.id;
    const modal = document.getElementById('diagnostic-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('diag-title').textContent = spot.name;
    document.getElementById('diag-sub').textContent = spot.sub;
    document.getElementById('diag-desc').textContent = spot.description;

    const specsContainer = document.getElementById('diag-specs-grid');
    if (specsContainer) {
      specsContainer.innerHTML = '';
      for (const [k, v] of Object.entries(spot.specs)) {
        const item = document.createElement('div');
        item.className = 'diag-spec-box';
        item.innerHTML = `<div class="spec-k">${k}</div><div class="spec-v">${v}</div>`;
        specsContainer.appendChild(item);
      }
    }
  }

  updateHUD(camFrame) {
    // Video Timecode display
    const tcStr = this.timeline.getTimecodeString();
    document.getElementById('timecode-display').textContent = `TC ${tcStr}`;

    // Timeline Scrubber Fill and Handle
    const pct = camFrame.progress * 100;
    const fill = document.getElementById('scrubber-fill');
    const handle = document.getElementById('scrubber-handle');
    if (fill) fill.style.width = `${pct}%`;
    if (handle) handle.style.left = `${pct}%`;

    // Speedometer & G-Force
    const machSpeed = (1.2 + camFrame.progress * 24.8 + (camFrame.isBoosting ? 18.5 : 0)).toFixed(1);
    const speedEl = document.getElementById('hud-mach-speed');
    if (speedEl) speedEl.textContent = `MACH ${machSpeed}`;

    const gForce = (1.0 + Math.abs(camFrame.velocity) * 2.8 + (camFrame.isBoosting ? 4.5 : 0)).toFixed(1);
    const gForceEl = document.getElementById('hud-gforce');
    if (gForceEl) gForceEl.textContent = `${gForce} G`;
  }

  drawAudioVisualizer() {
    if (!this.hudCanvas) return;
    const ctx = this.hudCanvas.getContext('2d');
    const w = this.hudCanvas.width;
    const h = this.hudCanvas.height;

    this.audio.getWaveformData(this.audioWaveData);

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-accent') || '#00f0ff';
    ctx.beginPath();

    const sliceWidth = w / 64;
    let x = 0;

    for (let i = 0; i < 64; i++) {
      const v = this.audioWaveData[i] / 128.0;
      const y = (v * h) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
  }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new Application();
});

