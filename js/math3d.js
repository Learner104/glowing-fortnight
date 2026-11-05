/**
 * Math3D: High-performance 3D Vector, Matrix, and Spline utilities
 * Specially optimized for 60FPS cinematic camera paths and WebGL projection.
 */

export class Vec3 {
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

export class Mat4 {
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
export function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

export function catmullRomVec3(p0, p1, p2, p3, t, out = new Vec3()) {
  out.x = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
  out.y = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
  out.z = catmullRom(p0.z, p1.z, p2.z, p3.z, t);
  return out;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
