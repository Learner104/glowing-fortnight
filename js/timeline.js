/**
 * Timeline: Cinematic Camera Choreography & Physics-based Video Scroll Engine
 */

import { Vec3, catmullRomVec3, clamp, lerp } from './math3d.js';

export const CHAPTERS = [
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

export class TimelineController {
  constructor() {
    this.currentProgress = 0.0;
    this.targetProgress = 0.0;
    this.scrollVelocity = 0.0;

    // Playback state
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.isDraggingScrubber = false;
    this.isBoosting = false;

    // Camera Mode: 'CHASE' | 'COCKPIT' | 'ORBIT'
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

    // Callbacks
    this.onChapterChange = null;
    this.onProgressSync = null;
    this.activeChapterIndex = 0;

    this.elapsedTime = 0;
  }

  setMouse(x, y) {
    this.targetMouseX = clamp(x, -1, 1);
    this.targetMouseY = clamp(y, -1, 1);
  }

  addScroll(deltaY) {
    const delta = deltaY * 0.00065;
    this.targetProgress = clamp(this.targetProgress + delta, 0.0, 1.0);
  }

  setScrollProgress(progress) {
    this.targetProgress = clamp(progress, 0.0, 1.0);
  }

  seek(progress, syncWindow = true) {
    this.targetProgress = clamp(progress, 0.0, 1.0);
    this.currentProgress = this.targetProgress;
    if (syncWindow && this.onProgressSync) {
      this.onProgressSync(this.targetProgress);
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying && this.currentProgress >= 0.999) {
      this.seek(0.0, true);
    }
    return this.isPlaying;
  }

  update(dt) {
    this.elapsedTime += dt;

    // Autonomous video playback
    if (this.isPlaying && !this.isDraggingScrubber) {
      const step = (dt * 0.06) * this.playbackSpeed;
      this.targetProgress += step;
      if (this.targetProgress >= 1.0) {
        this.targetProgress = 1.0;
        this.isPlaying = false;
      }
      if (this.onProgressSync) {
        this.onProgressSync(this.targetProgress);
      }
    }

    // Boost acceleration
    if (this.isBoosting) {
      this.targetProgress = clamp(this.targetProgress + dt * 0.15, 0.0, 1.0);
      if (this.onProgressSync) {
        this.onProgressSync(this.targetProgress);
      }
    }

    // Silky smooth inertia damping
    const prevProgress = this.currentProgress;
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.1;
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

    // Subtle idle hover vibration
    const idleHover = Math.sin(this.elapsedTime * 2.0) * 0.08;
    shipPos.y += idleHover;

    // Camera Mode overrides
    if (this.cameraMode === 'COCKPIT') {
      // First-person cockpit camera placed inside starfighter
      camPos.set(shipPos.x, shipPos.y + 0.65, shipPos.z - 0.9);
      camTarget.set(shipPos.x + this.mouseX * 2.0, shipPos.y + 0.5 - this.mouseY * 1.5, shipPos.z - 15.0);
    } else if (this.cameraMode === 'ORBIT') {
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
    const pitch = this.mouseY * 0.35 + (this.isBoosting ? -0.15 : 0) + Math.sin(this.elapsedTime * 2.0) * 0.02;
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
