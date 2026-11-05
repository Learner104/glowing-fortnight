# PROJECT CHRONO-7 // AEGIS QUANTUM FIGHTER
### High-End 3D Interactive Cinematic Video-Scroll Web Experience

An ultra-premium, 60FPS interactive 3D web experience built with native WebGL, custom camera spline choreography, a video timeline scrubbing engine, and real-time Web Audio synthesis.

---

## 🌟 Key Features

1. **Video-Scrubbing Cinematic Flight Timeline**
   - **Scroll as Video Scrubber**: Scrolling forward/backward with your trackpad, mouse wheel, or touch smoothly scrubs through the 3D cinematic camera reel just like a 4K 60FPS video player.
   - **Interactive Timeline Scrubber**: Drag the scrubber handle or click any chapter milestone marker at the bottom to jump instantaneously across flight phases.
   - **Autonomous Reel Playback**: Hit `[PLAY REEL]` to sit back and watch the cinematic sequence play automatically at 60 FPS, with real-time SMPTE timecodes (`TC 00:0X:YY:ZZ`).

2. **3D Real-Time WebGL Engine**
   - **Hero Starfighter (Aegis Valkyrie-VII)**: Multi-faceted geometric starfighter with carbon-nanotube fuselage, swept wings, neon rim lighting (Fresnel reflection), and rotating dual-tier quantum core rings.
   - **Dynamic Lighting & Shaders**: Specular Blinn-Phong highlights, volumetric distance fog, speed-distorted starfield particles, and animated plasma thruster flame plumes.
   - **5 Distinct Cinematic Chapters**:
     - **Phase 01: Orbital Launch Departure** (Low-angle heroic camera, thruster pre-flight ignition)
     - **Phase 02: Warp Tunnel Acceleration** (Rear-chase warp speed through hexagonal quantum gates)
     - **Phase 03: Deep Nebula Monolith** (Sweeping orbital pan past ancient space spires)
     - **Phase 04: Singularity Overdrive** (Dramatic frontal hero shot with shield surge and shockwaves)
     - **Phase 05: The Quantum Nexus** (Arrival at orbital nexus, 360° interactive inspection & diagnostic mode)

3. **Game-Like Interactivity**
   - **Mouse Flight Parallax & Steering**: Moving your cursor tilts and banks the starfighter with realistic roll, pitch, and yaw.
   - **Interactive 3D Subsystem Hotspots**: Screen-space projected target markers track the 3D ship subsystems (Dark Matter Core, Vector Thruster Array, Neuro-Sync Cockpit, Phase Shields). Clicking any marker opens an interactive diagnostic panel with specs and a power-routing slider.
   - **Multiple Camera Angles**:
     - `CAM 1: CHASE` (Cinematic third-person follow)
     - `CAM 2: COCKPIT` (First-person immersive cockpit flight view with flight reticle)
     - `CAM 3: ORBIT 360°` (Free drag-to-rotate camera)
   - **Hyper-Boost Overdrive**: Hold `SPACE` or click `[⚡ HYPER-BOOST]` to trigger screen shake, chromatic aberration, warp speedlines, and a deep auditory boom.
   - **Fighter Material Lab**: Customize ship hull plating and plasma energy hue (Cyber Cyan, Solar Flare, Void Purple, Crimson Overdrive, Titanium Phantom).

4. **Native Web Audio Synthesizer (Zero External Audio Dependencies)**
   - Continuous procedural dual-oscillator propulsion drone that dynamically modulates frequency, filter cutoff, and distortion based on scroll velocity and throttle.
   - Real-time HUD waveform oscilloscope canvas.
   - Tactical UI sound effects (beeps, warp booms, subsystem diagnostic chimes).

---

## 🎮 Controls & Shortcuts

| Action | Control |
|---|---|
| **Scrub Cinematic Video** | Mouse Wheel / Trackpad Scroll / Arrow Keys |
| **Steer Starfighter** | Move Mouse Cursor |
| **Drag Timeline** | Click or Drag Bottom Scrubber Track |
| **Hyper-Boost Overdrive** | Hold `SPACE` or Click `[⚡ HYPER-BOOST]` |
| **Cycle Camera Angles** | Press `C` or Click Camera Pills (`CHASE`, `COCKPIT`, `ORBIT`) |
| **Toggle Audio Synthesizer** | Press `M` or Click Audio Icon |
| **Jump to Phase 1 - 5** | Press Keys `1`, `2`, `3`, `4`, `5` |
| **Rotate 360° in Orbit Mode** | Click and Drag on 3D Viewport |

---

## 🚀 How to Run & View

### Option A: Open Standalone HTML Directly
Open the self-contained bundle in any web browser:
```bash
file:///home/learner/.gemini/antigravity/scratch/cinematic-scroll/standalone.html
```

### Option B: Local Web Server
Run the local HTTP server:
```bash
cd /home/learner/.gemini/antigravity/scratch/cinematic-scroll
python3 serve.py
```
Open `http://localhost:51247/index.html` in your browser.
