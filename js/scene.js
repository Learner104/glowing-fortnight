/**
 * Scene: Procedural 3D Geometry for Starfighter, Warp Gates, Monoliths, and Starfield
 */

import { Vec3 } from './math3d.js';

export class MeshData {
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
export function buildStarfighterMesh(hullColor = [0.15, 0.18, 0.24], neonColor = [0.0, 0.95, 1.0]) {
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
export function buildRingMesh(radius = 1.2, tubeRadius = 0.08, segments = 24, tubeSegments = 6, color = [0.0, 0.9, 1.0, 0.9]) {
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
export function buildHexGateMesh(radius = 12.0, thickness = 1.0, depth = 2.5, color = [0.0, 0.85, 1.0, 0.9]) {
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
export function buildMonolithMesh(w = 4.0, h = 30.0, d = 4.0, color = [0.08, 0.1, 0.15, 1.0], accentColor = [1.0, 0.35, 0.1, 1.0]) {
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
export function buildFlameMesh(length = 3.5, radius = 0.45, segments = 12, flameColor = [0.0, 0.8, 1.0]) {
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
export function generateStarfieldData(count = 2500, spreadX = 140, spreadY = 90, spreadZ = 450) {
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
export const SHIP_HOTSPOTS = [
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
