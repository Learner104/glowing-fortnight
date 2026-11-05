#!/usr/bin/env python3
"""
Cinematic Scroll Bundle Builder
Assembles all JS modules + CSS into a single standalone HTML file.
"""
import re, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), encoding='utf-8') as f:
        return f.read()

def strip_module_syntax(js):
    """Remove ES module import/export declarations for bundling."""
    # Remove export { ... } blocks
    js = re.sub(r'\bexport\s*\{[^}]*\}\s*;?', '', js)
    # Remove export default
    js = re.sub(r'\bexport\s+default\s+', '', js)
    # Remove export from class/function/const/let/var declarations
    js = re.sub(r'\bexport\s+(class|function|const|let|var)\b', r'\1', js)
    # Remove single-line import statements
    js = re.sub(r'^import\s+.*?;\s*$', '', js, flags=re.MULTILINE)
    # Remove multi-line import blocks (import {\n  ...\n} from '...')
    js = re.sub(r"^import\s*\{[^}]*\}\s*from\s*['\"][^'\"]*['\"];\s*$", '', js, flags=re.MULTILINE | re.DOTALL)
    js = re.sub(r"import\s*\{[\s\S]*?\}\s*from\s*['\"][^'\"]*['\"];", '', js)
    return js

# Load and strip each module
math3d_js = strip_module_syntax(read('js/math3d.js'))
audio_js = strip_module_syntax(read('js/audio.js'))
scene_js = strip_module_syntax(read('js/scene.js'))
renderer_js = strip_module_syntax(read('js/webgl-renderer.js'))
timeline_js = strip_module_syntax(read('js/timeline.js'))
app_js = strip_module_syntax(read('js/app.js'))

# CSS
css = read('css/style.css')
# Fix --neon-cyan variable reference in CSS (not defined in :root, use hardcoded)
css = css.replace('var(--neon-cyan)', '#00f0ff')

bundled_js = '\n\n'.join([
    '// === MATH3D ===', math3d_js,
    '// === AUDIO ===', audio_js,
    '// === SCENE ===', scene_js,
    '// === WEBGL RENDERER ===', renderer_js,
    '// === TIMELINE ===', timeline_js,
    '// === APP ===', app_js,
])

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CHRONO-7 // Cinematic Space Mission to NASA Kennedy Space Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
{css}
  </style>
</head>
<body>
  <!-- Scroll Spacer: drives native window.scrollY -->
  <div id="scroll-spacer"></div>

  <!-- Fixed Cinematic Viewport -->
  <div class="cinematic-viewport">
    <canvas id="webgl-canvas"></canvas>

    <!-- Film post-processing layers -->
    <div class="cinema-grain"></div>
    <div class="scanlines"></div>

    <!-- 3D Hotspot Screen-Space overlay -->
    <div id="hotspots-layer"></div>

    <!-- Main UI HUD Layer -->
    <div class="ui-layer">

      <!-- TOP HEADER HUD -->
      <header class="hud-header">
        <div class="hud-left">
          <div class="rec-badge">
            <div class="rec-dot"></div>
            <span>LIVE</span>
          </div>
          <div id="timecode-display" class="timecode">TC 00:00:00:00</div>
          <div class="system-title">CHRONO-7 // MISSION FLIGHT DECK</div>
          <div class="nasa-destination-pill">
            <span>🏁</span>
            <span>DEST: NASA KSC</span>
          </div>
        </div>

        <div class="hud-center">
          <div class="cam-btn-group">
            <button class="cam-pill active" data-cam-mode="CHASE">CAM 1</button>
            <button class="cam-pill" data-cam-mode="COCKPIT">COCKPIT</button>
            <button class="cam-pill" data-cam-mode="ORBIT">ORBIT 360</button>
          </div>
        </div>

        <div class="hud-right">
          <!-- Crew Manifest Toggle -->
          <button class="hud-btn-toggle btn-crew-toggle" id="btn-crew-toggle" title="Toggle Crew Manifest">
            <div class="vital-dot"></div>
            <span>👥 CREW</span>
          </button>
          <!-- Phase Info Toggle -->
          <button class="hud-btn-toggle active" id="btn-toggle-phase-card" title="Toggle Phase Info [I]">
            📜 PHASE INFO
          </button>
          <!-- Cinema Mode Toggle -->
          <button class="hud-btn-toggle" id="btn-toggle-cinema-mode" title="Cinema Mode [H]">
            👁 CINEMA
          </button>
          <!-- Customizer Toggle -->
          <button class="hud-btn-toggle" id="btn-toggle-customizer" title="Ship Customizer">
            🎨 CUSTOMIZE
          </button>
          <!-- Audio Visualizer -->
          <div class="audio-box">
            <canvas id="audio-visualizer" width="60" height="24"></canvas>
            <button class="icon-btn" id="btn-audio-toggle" title="Toggle Audio [M]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          </div>
          <!-- FPS Counter -->
          <div class="hud-stat-pill" id="fps-counter">-- FPS</div>
        </div>
      </header>

      <!-- MIDDLE INTERACTIVE AREA -->
      <div class="hud-middle">

        <!-- CREW MANIFEST PANEL (Left) -->
        <div class="crew-manifest-panel hidden" id="crew-manifest-panel">
          <div class="crew-header">
            <div class="crew-title">👥 CREW MANIFEST</div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <div class="crew-count-badge">5 CREW // ALL NOMINAL</div>
              <button class="btn-card-close" id="btn-close-crew" title="Close Crew Panel">✕</button>
            </div>
          </div>
          <div class="crew-list" id="crew-roster-list">
            <!-- Populated by JavaScript -->
          </div>
        </div>

        <!-- CHAPTER INFO CARD (Right) -->
        <div class="chapter-card" id="chapter-info-card">
          <div class="card-top-bar">
            <span id="ch-badge" class="ch-badge">PHASE 01</span>
            <button class="btn-card-close" id="btn-close-chapter-card" title="Hide Phase Info [I]">✕</button>
          </div>
          <h2 id="ch-title" class="ch-title">DEEP SPACE DEPARTURE</h2>
          <div id="ch-subtitle" class="ch-subtitle">Initiating departure burn toward NASA KSC</div>
          <p id="ch-description" class="ch-desc">Loading mission data...</p>

          <div class="card-cta-row">
            <button id="btn-card-play" class="btn-primary">
              <span>▶ PLAY REEL</span>
            </button>
            <button id="btn-hyper-boost" class="btn-primary btn-boost">
              <span>⚡ BOOST</span>
            </button>
          </div>

          <div class="telem-grid" id="ch-telemetry">
            <!-- Populated by JavaScript -->
          </div>
        </div>

        <!-- FLIGHT GAUGES (Far right) -->
        <div class="flight-gauges">
          <div class="gauge-row">
            <div class="gauge-label">VELOCITY</div>
            <div class="gauge-value" id="hud-mach-speed">MACH 1.2</div>
          </div>
          <div class="gauge-row">
            <div class="gauge-label">G-FORCE</div>
            <div class="gauge-value" id="hud-gforce">1.0 G</div>
          </div>
        </div>

      </div><!-- end hud-middle -->

      <!-- BOTTOM SCRUBBER / TIMELINE -->
      <footer class="hud-footer">
        <div class="scrubber-container" id="scrubber-track">
          <div class="scrubber-track">
            <div class="scrubber-fill" id="scrubber-fill"></div>
            <div id="scrubber-chapters"></div>
            <div class="scrubber-handle" id="scrubber-handle"></div>
          </div>
        </div>

        <div class="footer-controls">
          <div class="controls-left">
            <button id="btn-play-pause" class="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <span>PLAY REEL</span>
            </button>
            <div class="scroll-hint">
              <div class="mouse-icon"></div>
              <span>SCROLL TO FLY</span>
            </div>
          </div>
          <div class="controls-right">
            <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);">KEYS: C=CAM &nbsp; H=CINEMA &nbsp; I=PHASE &nbsp; Z=ZOOM &nbsp; SPACE=BOOST</span>
          </div>
        </div>
      </footer>

    </div><!-- end ui-layer -->

    <!-- RESTORE PHASE BUTTON (shown when phase card is hidden) -->
    <button class="btn-restore-phase hidden" id="btn-restore-phase">
      📜 SHOW PHASE
    </button>

    <!-- DIAGNOSTIC MODAL (Hotspot drill-down) -->
    <div class="modal-overlay hidden" id="diagnostic-modal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <div class="modal-title" id="diag-title">SYSTEM DIAGNOSTIC</div>
            <div class="modal-sub" id="diag-sub">Sub-system Analysis</div>
          </div>
          <button class="close-btn" id="btn-close-diag">✕</button>
        </div>
        <p id="diag-desc" style="font-size:0.85rem;color:#8a9bb8;margin-bottom:1rem;line-height:1.5;"></p>
        <div class="diag-specs" id="diag-specs-grid"></div>
        <div class="slider-group">
          <div class="slider-label">
            <span>POWER ALLOCATION</span>
            <span id="diag-power-val">100%</span>
          </div>
          <input type="range" class="styled-slider" id="diag-power-slider" min="0" max="100" value="100">
        </div>
      </div>
    </div>

    <!-- CUSTOMIZER FLYOUT PANEL -->
    <div class="flyout-panel hidden" id="customizer-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
        <span style="font-family:var(--font-mono);font-size:0.8rem;font-weight:700;color:#fff;">🎨 SHIP CUSTOMIZER</span>
        <button class="btn-card-close" id="btn-close-customizer">✕</button>
      </div>
      <div style="font-family:var(--font-mono);font-size:0.72rem;color:#8a9bb8;margin-bottom:0.5rem;">SELECT HULL COLOR SCHEME</div>
      <div class="preset-list" id="color-preset-buttons">
        <!-- Populated by JavaScript -->
      </div>
    </div>

    <!-- TOUCHDOWN TRANSITION MODAL (Auto-triggered at NASA KSC arrival) -->
    <div class="modal-overlay hidden" id="touchdown-transition-modal">
      <div class="touchdown-modal-card">
        <div class="touchdown-icon">🛬</div>
        <h2 class="touchdown-h1">TOUCHDOWN CONFIRMED</h2>
        <div class="touchdown-sub">NASA KENNEDY SPACE CENTER // RUNWAY 15/33 SECURED</div>
        <p style="font-size: 0.82rem; color: #8a9bb8; margin-bottom: 1rem;">
          Redirecting to Mission Celebration in <strong id="touchdown-countdown" style="color: #00ff88;">3s</strong>
        </p>
        <div class="touchdown-btn-row">
          <a href="landing.html" class="btn-celebrate-now">🎆 CELEBRATE NOW</a>
          <button class="btn-stay" id="btn-stay-on-page">STAY &amp; WATCH</button>
        </div>
      </div>
    </div>

  </div><!-- end cinematic-viewport -->

  <script>
{bundled_js}

// Stay on page button handler
document.addEventListener('DOMContentLoaded', function() {{
  var stayBtn = document.getElementById('btn-stay-on-page');
  if (stayBtn) {{
    stayBtn.addEventListener('click', function() {{
      var modal = document.getElementById('touchdown-transition-modal');
      if (modal) modal.classList.add('hidden');
      if (window.app) {{
        window.app.touchdownTransitionTriggered = false;
      }}
    }});
  }}
}});
  </script>
</body>
</html>"""

# Output files
out_index = os.path.join(BASE, 'index.html')
out_standalone = os.path.join(BASE, 'standalone.html')

with open(out_index, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"✅ Written: {out_index} ({len(html):,} bytes)")

with open(out_standalone, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"✅ Written: {out_standalone} ({len(html):,} bytes)")

print("Build complete!")
