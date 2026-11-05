/**
 * App: Master Controller & Interactive HUD Coordinator
 */

import { AudioSystem } from './audio.js';
import { WebGLRenderer } from './webgl-renderer.js';
import { TimelineController, CHAPTERS } from './timeline.js';

// Color Presets for Starfighter Customizer
export const COLOR_PRESETS = [
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

    try {
      this.renderer = new WebGLRenderer(this.canvas);
    } catch (err) {
      console.error('WebGL Initialization Error:', err);
      alert('WebGL could not be initialized. Please ensure hardware acceleration is enabled in your browser.');
      return;
    }

    this.audio = new AudioSystem();
    this.timeline = new TimelineController();

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    this.audioWaveData = new Uint8Array(64);
    this.activeHotspotId = null;
    this.isSyncingScroll = false;

    this.initUI();
    this.bindEvents();
    this.setupTimelineScrubber();
    this.setupScrollSync();

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
          this.timeline.seek(ch.progress, true);
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

  setupScrollSync() {
    // Window scroll event drives the 3D cinematic timeline
    window.addEventListener('scroll', () => {
      if (this.isSyncingScroll) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
        this.timeline.setScrollProgress(progress);
      }
    }, { passive: true });

    // Timeline changes drive window.scrollY
    this.timeline.onProgressSync = (progress) => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        this.isSyncingScroll = true;
        window.scrollTo(0, progress * maxScroll);
        requestAnimationFrame(() => {
          this.isSyncingScroll = false;
        });
      }
    };
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
    let isPointerDown = false;

    const updateSeekFromEvent = (e) => {
      const rect = scrubberTrack.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.timeline.seek(progress, true);
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
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        window.scrollBy(0, e.deltaY);
      } else {
        this.timeline.addScroll(e.deltaY);
      }
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
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        window.scrollBy(0, deltaY);
      } else {
        this.timeline.addScroll(deltaY);
      }
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
        this.timeline.seek(CHAPTERS[idx].progress, true);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        this.timeline.seek(Math.min(1, this.timeline.targetProgress + 0.05), true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        this.timeline.seek(Math.max(0, this.timeline.targetProgress - 0.05), true);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.timeline.isBoosting = false;
        document.body.classList.remove('hyper-boost-active');
      }
    });

    // Play / Pause Buttons
    const handlePlayToggle = () => {
      this.audio.init();
      const playing = this.timeline.togglePlay();
      this.audio.playUiClick();
      const playBtn = document.getElementById('btn-play-pause');
      const cardPlayBtn = document.getElementById('btn-card-play');

      const btnHtml = playing ?
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> <span>PAUSE</span>` :
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> <span>PLAY REEL</span>`;

      if (playBtn) playBtn.innerHTML = btnHtml;
      if (cardPlayBtn) cardPlayBtn.innerHTML = playing ? `<span>⏸ PAUSE REEL</span>` : `<span>▶ PLAY REEL</span>`;
    };

    const playBtn = document.getElementById('btn-play-pause');
    if (playBtn) playBtn.addEventListener('click', handlePlayToggle);

    const cardPlayBtn = document.getElementById('btn-card-play');
    if (cardPlayBtn) cardPlayBtn.addEventListener('click', handlePlayToggle);

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
function startApplication() {
  if (!window.app) {
    window.app = new Application();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}
