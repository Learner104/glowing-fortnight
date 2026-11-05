/**
 * Scene: Procedural 3D Geometry for Starfighter, Planets (Earth, Mars, Moon),
 * NASA Landing Facility, Warp Gates, Monoliths, and Starfield.
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
 * Builds procedural low-load spheres for planets (Earth, Mars, Moon)
 */
export function buildPlanetMesh(radius = 10.0, rings = 16, sectors = 16, type = 'earth') {
  const mesh = new MeshData();

  for (let r = 0; r <= rings; r++) {
    const theta = (r * Math.PI) / rings;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let s = 0; s <= sectors; s++) {
      const phi = (s * 2 * Math.PI) / sectors;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const nx = cosP * sinT;
      const ny = cosT;
      const nz = sinP * sinT;

      const x = nx * radius;
      const y = ny * radius;
      const z = nz * radius;

      // Color generation based on planet type
      let cr = 0.5, cg = 0.5, cb = 0.5, ca = 1.0;

      // Procedural noise approximation using sine harmonics
      const noise = Math.sin(phi * 4.0) * Math.cos(theta * 3.0) + Math.sin(phi * 8.0 + theta * 5.0) * 0.4;

      if (type === 'earth') {
        if (Math.abs(ny) > 0.82) {
          // Polar ice caps
          cr = 0.92; cg = 0.96; cb = 1.0;
        } else if (noise > 0.15) {
          // Continents / Green & Sahara ochre
          cr = 0.22 + noise * 0.2;
          cg = 0.48 + noise * 0.15;
          cb = 0.25;
        } else if (noise > -0.05) {
          // Swirling white clouds
          cr = 0.88; cg = 0.92; cb = 0.98;
        } else {
          // Deep oceans
          cr = 0.08; cg = 0.28; cb = 0.72;
        }
      } else if (type === 'mars') {
        if (Math.abs(ny) > 0.86) {
          // Mars North/South Polar Ice
          cr = 0.95; cg = 0.92; cb = 0.92;
        } else {
          // Red-ochre Martian regolith and dark basalt maria
          const darkMaria = noise > 0.2 ? 0.65 : 1.0;
          cr = (0.85 + noise * 0.1) * darkMaria;
          cg = (0.35 + noise * 0.08) * darkMaria;
          cb = (0.18 + noise * 0.05) * darkMaria;
        }
      } else if (type === 'moon') {
        // Lunar grey with crater maria
        const mare = noise > 0.1 ? 0.55 : 0.78;
        cr = mare + noise * 0.05;
        cg = mare + noise * 0.05;
        cb = mare * 1.05;
      }

      mesh.addVertex(x, y, z, nx, ny, nz, cr, cg, cb, ca);
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const first = r * (sectors + 1) + s;
      const second = first + sectors + 1;

      mesh.addTriangle(first, second, first + 1);
      mesh.addTriangle(second, second + 1, first + 1);
    }
  }

  return mesh;
}

/**
 * Builds NASA Kennedy Space Center Landing Runway & Touchdown Guidance Grid
 */
export function buildNasaRunwayMesh() {
  const mesh = new MeshData();

  // Runway strip: 24m wide, 140m long at destination
  const rwW = 12.0;
  const rwLen = 70.0;
  const rwColor = [0.08, 0.10, 0.14, 1.0];
  const lineCol = [0.0, 0.95, 1.0, 1.0];
  const amberCol = [1.0, 0.7, 0.1, 1.0];

  // Runway Tarmac plane
  const i1 = mesh.addVertex(-rwW, -1.5, -rwLen, 0, 1, 0, ...rwColor);
  const i2 = mesh.addVertex(rwW, -1.5, -rwLen, 0, 1, 0, ...rwColor);
  const i3 = mesh.addVertex(rwW, -1.5, rwLen, 0, 1, 0, ...rwColor);
  const i4 = mesh.addVertex(-rwW, -1.5, rwLen, 0, 1, 0, ...rwColor);
  mesh.addQuad(i1, i2, i3, i4);

  // Centerline Dashes
  for (let z = -rwLen + 5; z < rwLen - 5; z += 12) {
    const c1 = mesh.addVertex(-0.4, -1.48, z - 3, 0, 1, 0, ...lineCol);
    const c2 = mesh.addVertex(0.4, -1.48, z - 3, 0, 1, 0, ...lineCol);
    const c3 = mesh.addVertex(0.4, -1.48, z + 3, 0, 1, 0, ...lineCol);
    const c4 = mesh.addVertex(-0.4, -1.48, z + 3, 0, 1, 0, ...lineCol);
    mesh.addQuad(c1, c2, c3, c4);
  }

  // Runway Approach Edge Guidance Lights (dual rows of glowing beacons)
  for (let z = -rwLen; z <= rwLen; z += 10) {
    // Left edge light
    const l1 = mesh.addVertex(-rwW - 0.3, -1.45, z - 0.4, 0, 1, 0, ...amberCol);
    const l2 = mesh.addVertex(-rwW + 0.3, -1.45, z - 0.4, 0, 1, 0, ...amberCol);
    const l3 = mesh.addVertex(-rwW + 0.3, -1.45, z + 0.4, 0, 1, 0, ...amberCol);
    const l4 = mesh.addVertex(-rwW - 0.3, -1.45, z + 0.4, 0, 1, 0, ...amberCol);
    mesh.addQuad(l1, l2, l3, l4);

    // Right edge light
    const r1 = mesh.addVertex(rwW - 0.3, -1.45, z - 0.4, 0, 1, 0, ...amberCol);
    const r2 = mesh.addVertex(rwW + 0.3, -1.45, z - 0.4, 0, 1, 0, ...amberCol);
    const r3 = mesh.addVertex(rwW + 0.3, -1.45, z + 0.4, 0, 1, 0, ...amberCol);
    const r4 = mesh.addVertex(rwW - 0.3, -1.45, z + 0.4, 0, 1, 0, ...amberCol);
    mesh.addQuad(r1, r2, r3, r4);
  }

  return mesh;
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
  const nose = [0, 0.1, -4.2];
  const midTop = [0, 0.65, -0.6];
  const midLeft = [-0.9, 0.15, -0.4];
  const midRight = [0.9, 0.15, -0.4];
  const midBottom = [0, -0.35, -0.4];

  addFacet(nose, midTop, midRight, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);
  addFacet(nose, midLeft, midTop, [hr * 1.2, hg * 1.2, hb * 1.2, 1.0]);
  addFacet(nose, midRight, midBottom, darkPanel);
  addFacet(nose, midBottom, midLeft, darkPanel);

  // Cockpit canopy
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

  addQuadFacet(wingRootLeadL, wingTipL, wingTrailL, wingRootTrailL, [hr * 1.1, hg * 1.1, hb * 1.1, 1.0]);
  addQuadFacet(wingRootLeadR, wingRootTrailR, wingTrailR, wingTipR, [hr * 1.1, hg * 1.1, hb * 1.1, 1.0]);
  addQuadFacet(wingRootLeadL, wingRootTrailL, wingTrailL, wingTipL, darkPanel);
  addQuadFacet(wingRootLeadR, wingTipR, wingTrailR, wingRootTrailR, darkPanel);

  // Glowing neon leading edge
  const neonOffset = 0.03;
  const wingTipLNeon = [-4.65, 0.05 + neonOffset, 1.8];
  const wingRootLeadLNeon = [-0.85, 0.2 + neonOffset, -1.75];
  addQuadFacet(wingRootLeadL, wingRootLeadLNeon, wingTipLNeon, wingTipL, [nr, ng, nb, 1.0]);

  const wingTipRNeon = [4.65, 0.05 + neonOffset, 1.8];
  const wingRootLeadRNeon = [0.85, 0.2 + neonOffset, -1.75];
  addQuadFacet(wingRootLeadR, wingTipR, wingTipRNeon, wingRootLeadRNeon, [nr, ng, nb, 1.0]);

  // Wingtip stabilizers
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
    addQuadFacet(tR1, tR4, tR3, tR2, exhaustColor);
  }

  addThruster(-1.1);
  addThruster(1.1);

  // 4. CANARD STABILIZERS
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

export function buildHexGateMesh(radius = 14.0, thickness = 1.4, depth = 3.0, color = [0.0, 0.85, 1.0, 0.9]) {
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

    const f1 = mesh.addVertex(x0In, y0In, zFront, 0, 0, 1, ...color);
    const f2 = mesh.addVertex(x1In, y1In, zFront, 0, 0, 1, ...color);
    const f3 = mesh.addVertex(x1Out, y1Out, zFront, 0, 0, 1, ...color);
    const f4 = mesh.addVertex(x0Out, y0Out, zFront, 0, 0, 1, ...color);
    mesh.addQuad(f1, f2, f3, f4);

    const b1 = mesh.addVertex(x0In, y0In, zFront, -Math.cos(a0), -Math.sin(a0), 0, color[0], color[1], color[2], 1.0);
    const b2 = mesh.addVertex(x0In, y0In, zBack, -Math.cos(a0), -Math.sin(a0), 0, color[0], color[1], color[2], 1.0);
    const b3 = mesh.addVertex(x1In, y1In, zBack, -Math.cos(a1), -Math.sin(a1), 0, color[0], color[1], color[2], 1.0);
    const b4 = mesh.addVertex(x1In, y1In, zFront, -Math.cos(a1), -Math.sin(a1), 0, color[0], color[1], color[2], 1.0);
    mesh.addQuad(b1, b2, b3, b4);
  }

  return mesh;
}

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

  addFace([-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd], [0, 0, 1], color);
  addFace([hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd], [0, 0, -1], color);
  addFace([-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd], [-1, 0, 0], color);
  addFace([hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd], [1, 0, 0], color);

  const grooveW = 0.25;
  addFace([-grooveW, -hh, hd + 0.05], [grooveW, -hh, hd + 0.05], [grooveW, hh, hd + 0.05], [-grooveW, hh, hd + 0.05], [0, 0, 1], accentColor);

  return mesh;
}

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

export function generateStarfieldData(count = 2500, spreadX = 160, spreadY = 110, spreadZ = 550) {
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
      colors[colIdx] = 0.7 * brightness;
      colors[colIdx + 1] = 0.9 * brightness;
      colors[colIdx + 2] = 1.0 * brightness;
    } else if (tint < 0.85) {
      colors[colIdx] = 0.8 * brightness;
      colors[colIdx + 1] = 0.3 * brightness;
      colors[colIdx + 2] = 1.0 * brightness;
    } else {
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
    description: 'Powers the spacecraft re-entry trajectory towards NASA Kennedy Space Center with zero thermal loss.'
  },
  {
    id: 'thruster',
    name: 'VECTOR EXHAUST ARRAY',
    sub: 'Twin Mag-Lev Propulsors',
    localPos: new Vec3(1.1, 0.1, 2.7),
    specs: {
      Thrust: '12.4 MegaNewtons',
      Isp: '18,500 sec',
      Gimbal: '±35° Dual Axis',
      Fuel: 'Metallic Hydrogen'
    },
    description: 'Vector bells calibrated for trans-atmospheric braking burn before Cape Canaveral touchdown.'
  },
  {
    id: 'cockpit',
    name: 'CREW COCKPIT BRIDGE',
    sub: 'NASA Flight Deck & Life Support',
    localPos: new Vec3(0, 0.75, -1.2),
    specs: {
      Commander: 'Dhanesh',
      CrewCount: '5 Active Personnel',
      LifeSupport: 'Nominal 100%',
      CommLink: 'Houston NASA Direct'
    },
    description: 'Pressurized avionics bridge seating Dhanesh, Gayathri, Girinanda, Devika, and Sravan.'
  },
  {
    id: 'shields',
    name: 'RE-ENTRY ABLATIVE MATRIX',
    sub: 'Electromagnetic Thermal Deflector',
    localPos: new Vec3(-3.2, 0.15, 1.2),
    specs: {
      Absorption: '850 GigaJoules',
      MaxTemp: '3,200 °C',
      PlasmaBleed: '100% Polarized',
      DescentPath: 'KSC Corridor 39A'
    },
    description: 'Protects the spacecraft and crew during hypersonic re-entry into Earth atmosphere.'
  }
];

/**
 * Crew Members Manifest
 */
export const CREW_MEMBERS = [
  {
    name: 'DHANESH',
    role: 'MISSION COMMANDER',
    specialty: 'Flight Deck & Master Telemetry',
    status: '100% NOMINAL',
    bpm: '68 BPM',
    avatar: '👨‍🚀',
    accent: '#00f0ff'
  },
  {
    name: 'GAYATHRI',
    role: 'CHIEF NAVIGATOR',
    specialty: 'Orbital Mechanics & Earth Descent Vector',
    status: '100% NOMINAL',
    bpm: '71 BPM',
    avatar: '👩‍🚀',
    accent: '#00ff88'
  },
  {
    name: 'GIRINANDA',
    role: 'SYSTEMS ENGINEER',
    specialty: 'Quantum Singularity & Power Grid',
    status: '100% NOMINAL',
    bpm: '74 BPM',
    avatar: '👩‍🚀',
    accent: '#ffaa00'
  },
  {
    name: 'DEVIKA',
    role: 'SCIENCE SPECIALIST',
    specialty: 'Atmospheric Physics & Life Support',
    status: '100% NOMINAL',
    bpm: '65 BPM',
    avatar: '👩‍🚀',
    accent: '#bd00ff'
  },
  {
    name: 'SRAVAN',
    role: 'PROPULSION LEAD',
    specialty: 'Vector Thrusters & NASA Touchdown Burn',
    status: '100% NOMINAL',
    bpm: '70 BPM',
    avatar: '👨‍🚀',
    accent: '#ff2a55'
  }
];
