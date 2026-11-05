/**
 * Timeline: Cinematic Camera Choreography & Physics-based Video Scroll Engine
 * Featuring Smoothed Exponential Interpolation, Planet Flybys, and NASA Touchdown.
 * CAM 1: Distant third-person cinematic chase camera with wider breathing room.
 */

import { Vec3, catmullRomVec3, clamp, lerp } from './math3d.js';

export const CHAPTERS = [
  {
    index: 0,
    timecode: '00:00:00:00',
    progress: 0.0,
    badge: 'PHASE 01',
    title: 'DEEP SPACE DEPARTURE',
    subtitle: 'Crew Dhanesh, Gayathri, Girinanda, Devika, Sravan initiate Earth return burn',
    description: 'Cold-start of the Zero-Point reactor. Anti-gravity repulsors disengage as sub-orbital thrusters spin up to align trajectory toward NASA Kennedy Space Center.',
    telemetry: {
      ORIGIN: 'ORBITAL DOCK',
      DESTINATION: 'NASA KENNEDY',
      CREW: '5/5 ACTIVE',
      STATUS: 'DEPARTURE BURN'
    }
  },
  {
    index: 1,
    timecode: '00:00:15:18',
    progress: 0.25,
    badge: 'PHASE 02',
    title: 'MARS GRAVITATIONAL SLINGSHOT',
    subtitle: 'Hypersonic orbital acceleration corridor past the Red Planet',
    description: 'Engaging magnetic induction rings. Space-time curvature expands along vector -Z, using Mars gravity well for trans-Earth injection.',
    telemetry: {
      ALTITUDE: 'MARS ORBIT',
      VELOCITY: 'MACH 24.2',
      CORRIDOR: 'EARTH VECTOR',
      GRAV_ASSIST: 'CONFIRMED'
    }
  },
  {
    index: 2,
    timecode: '00:00:30:12',
    progress: 0.50,
    badge: 'PHASE 03',
    title: 'LUNAR BYPASS & EARTH SIGHTING',
    subtitle: 'Passing the Moon // Visual acquisition of Earth & Cape Canaveral corridor',
    description: 'Cinematic sweep past lunar maria as Earth looms in the frontal cockpit HUD. Communications link established with NASA Houston Mission Control.',
    telemetry: {
      LUNAR_DIST: '12,400 KM',
      EARTH_BEACON: 'KSC-39A',
      COMM_LINK: 'NASA HOUSTON',
      TRAJECTORY: 'OPTIMAL'
    }
  },
  {
    index: 3,
    timecode: '00:00:45:06',
    progress: 0.75,
    badge: 'PHASE 04',
    title: 'ATMOSPHERIC RE-ENTRY BURN',
    subtitle: 'Thermal phase shields engaged over North American airspace',
    description: 'Hypersonic ionization creates a glowing plasma envelope. Specialist Devika and Lead Sravan vector braking thrusters to align with Florida landing strip.',
    telemetry: {
      ALTITUDE: '64.5 KM',
      VELOCITY: 'MACH 12.8',
      HEAT_SHIELD: '2,650 °C',
      APPROACH: 'FLORIDA PENINSULA'
    }
  },
  {
    index: 4,
    timecode: '00:01:00:00',
    progress: 1.0,
    badge: 'PHASE 05',
    title: 'NASA KENNEDY SPACE CENTER',
    subtitle: 'Touchdown confirmed at NASA Shuttle Landing Facility // Welcome Home Crew',
    description: 'Main gear touchdown on NASA KSC Runway 15/33. Commander Dhanesh, Navigator Gayathri, Engineer Girinanda, Specialist Devika, and Propulsion Lead Sravan have completed the mission successfully.',
    telemetry: {
      LOCATION: 'NASA KSC (FLORIDA)',
      RUNWAY: 'SLF RUNWAY 15/33',
      TOUCHDOWN: '100% SECURED',
      CREW_STATUS: 'ALL 5 NOMINAL'
    }
  }
];

// Ship flight waypoints along the Z corridor
const SHIP_WAYPOINTS = [
  { scroll: 0.0,  pos: new Vec3(0, 0.0, 0) },
  { scroll: 0.25, pos: new Vec3(0, 0.0, -60) },
  { scroll: 0.50, pos: new Vec3(0, 0.0, -140) },
  { scroll: 0.75, pos: new Vec3(0, 0.0, -230) },
  { scroll: 1.0,  pos: new Vec3(0, -0.4, -320) }
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

    // Distant Chase Camera settings (feels like looking from a cinematic distance)
    this.baseChaseDistance = 16.5;
    this.baseChaseHeight = 4.2;

    // Interactive free rotation angles for Orbit mode
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
    const dtClamped = Math.min(dt, 0.05);
    this.elapsedTime += dtClamped;

    // Autonomous video playback
    if (this.isPlaying && !this.isDraggingScrubber) {
      const step = (dtClamped * 0.06) * this.playbackSpeed;
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
      this.targetProgress = clamp(this.targetProgress + dtClamped * 0.15, 0.0, 1.0);
      if (this.onProgressSync) {
        this.onProgressSync(this.targetProgress);
      }
    }

    // Exponential smoothing for buttery 60+ FPS motion
    const prevProgress = this.currentProgress;
    const smoothFactor = 1.0 - Math.exp(-8.5 * dtClamped);
    this.currentProgress += (this.targetProgress - this.currentProgress) * smoothFactor;
    this.scrollVelocity = (this.currentProgress - prevProgress) / Math.max(dtClamped, 0.001);

    // Exponential mouse steering smoothing
    const mouseSmooth = 1.0 - Math.exp(-7.5 * dtClamped);
    this.mouseX += (this.targetMouseX - this.mouseX) * mouseSmooth;
    this.mouseY += (this.targetMouseY - this.mouseY) * mouseSmooth;

    // Orbit angles smoothing
    const orbitSmooth = 1.0 - Math.exp(-8.0 * dtClamped);
    this.orbitYaw += (this.targetOrbitYaw - this.orbitYaw) * orbitSmooth;
    this.orbitPitch += (this.targetOrbitPitch - this.orbitPitch) * orbitSmooth;

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

    // Interpolate spacecraft position along the flight runway
    const keys = SHIP_WAYPOINTS;
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
    const rawT = segDuration > 0.0001 ? (p - k1.scroll) / segDuration : 0;
    const t = clamp(rawT, 0, 1);

    const shipPos = catmullRomVec3(k0.pos, k1.pos, k2.pos, k3.pos, t);

    // Subtle gentle engine hover vibration (settles smoothly upon touchdown in Phase 5)
    const hoverAmplitude = Math.max(0.005, 0.05 * (1.0 - Math.pow(p, 4.0)));
    const idleHover = Math.sin(this.elapsedTime * 2.2) * hoverAmplitude;
    shipPos.y += idleHover;

    const camPos = new Vec3();
    const camTarget = new Vec3();

    // 1. COCKPIT MODE (Inside the flight bridge)
    if (this.cameraMode === 'COCKPIT') {
      camPos.set(shipPos.x, shipPos.y + 0.65, shipPos.z - 0.9);
      camTarget.set(shipPos.x + this.mouseX * 2.0, shipPos.y + 0.5 - this.mouseY * 1.5, shipPos.z - 18.0);
    }
    // 2. ORBIT 360 MODE (Free user drag rotation with distant vantage)
    else if (this.cameraMode === 'ORBIT') {
      const radius = 14.5;
      camPos.x = shipPos.x + Math.sin(this.orbitYaw) * Math.cos(this.orbitPitch) * radius;
      camPos.y = shipPos.y + Math.sin(this.orbitPitch) * radius;
      camPos.z = shipPos.z + Math.cos(this.orbitYaw) * Math.cos(this.orbitPitch) * radius;
      camTarget.copy(shipPos).add(new Vec3(0, 0.4, 0));
    }
    // 3. CAM 1: DISTANT CINEMATIC CHASE CAMERA
    // Positioned at a majestic distance behind and above the spacecraft.
    // Gives breathing room to view the entire craft, glowing engine exhaust, planets, and gates.
    else {
      const boostPullback = this.isBoosting ? 3.5 : 0;
      const speedPullback = Math.min(2.5, Math.abs(this.scrollVelocity) * 0.9);
      const chaseDistance = this.baseChaseDistance + boostPullback + speedPullback;
      const chaseHeight = this.baseChaseHeight;

      // Camera positioned at a cinematic distance behind the ship with graceful parallax
      camPos.x = shipPos.x + this.mouseX * 2.2;
      camPos.y = shipPos.y + chaseHeight - this.mouseY * 1.1;
      camPos.z = shipPos.z + chaseDistance;

      // Focus camera slightly ahead through the nose of the ship
      camTarget.x = shipPos.x + this.mouseX * 0.8;
      camTarget.y = shipPos.y + 0.5 - this.mouseY * 0.4;
      camTarget.z = shipPos.z - 15.0;
    }

    // Ship flight banking (reacts to mouse steering)
    const roll = this.mouseX * -0.5 - this.scrollVelocity * 0.12;
    const pitch = this.mouseY * 0.32 + (this.isBoosting ? -0.15 : 0) + (p > 0.95 ? -0.04 : 0);
    const yaw = this.mouseX * -0.26;

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
    const totalFrames = Math.floor(this.currentProgress * 60 * 60);
    const frames = totalFrames % 60;
    const totalSeconds = Math.floor(totalFrames / 60);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    const pad = (n) => String(n).padStart(2, '0');
    return `00:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }
}
