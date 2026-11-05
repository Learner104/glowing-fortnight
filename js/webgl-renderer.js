/**
 * WebGLRenderer: High-performance 3D WebGL Pipeline with Fresnel Shading,
 * Starfield Streaks, Dynamic Lighting, and 2D Hotspot Projection.
 */

import { Mat4, Vec3 } from './math3d.js';
import {
  buildStarfighterMesh,
  buildRingMesh,
  buildHexGateMesh,
  buildMonolithMesh,
  buildFlameMesh,
  generateStarfieldData,
  SHIP_HOTSPOTS
} from './scene.js';

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
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

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

  // Safe positive depth calculation to prevent negative point sizes or division by zero
  float depth = max(0.2, -viewPos.z);
  float streak = 1.0 + min(uScrollSpeed * 2.5, 6.0);
  gl_PointSize = clamp(aSize * (160.0 / depth) * streak * uPixelRatio, 1.5, 64.0);

  vColor = aColor;
}
`;

const FS_POINTS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec4 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float alpha = smoothstep(0.5, 0.0, dist) * vColor.a;
  gl_FragColor = vec4(vColor.rgb, alpha);
}
`;

export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance' });

    if (!this.gl) {
      throw new Error('WebGL not supported in this browser.');
    }

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

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
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (this.width !== w || this.height !== h || this.canvas.width !== Math.floor(w * this.pixelRatio)) {
      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * this.pixelRatio);
      this.canvas.height = Math.floor(h * this.pixelRatio);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
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
