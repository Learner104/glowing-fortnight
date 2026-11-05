const fs = require('fs');

function cleanModule(code) {
  // Remove multiline or single line imports
  code = code.replace(/import\s*\{[\s\S]*?\}\s*from\s*['\"][^'\"]+['\"];?/g, '');
  code = code.replace(/import\s+[^;]+from\s*['\"][^'\"]+['\"];?/g, '');
  code = code.replace(/import\s*['\"][^'\"]+['\"];?/g, '');
  // Remove exports
  code = code.replace(/export\s+class\s+/g, 'class ');
  code = code.replace(/export\s+function\s+/g, 'function ');
  code = code.replace(/export\s+const\s+/g, 'const ');
  code = code.replace(/export\s+let\s+/g, 'let ');
  code = code.replace(/export\s+var\s+/g, 'var ');
  code = code.replace(/export\s+default\s+/g, '');
  code = code.replace(/export\s*\{[\s\S]*?\};?/g, '');
  return code;
}

const baseDir = '/home/learner/.gemini/antigravity/scratch/cinematic-scroll';
const files = [
  'js/math3d.js',
  'js/audio.js',
  'js/scene.js',
  'js/webgl-renderer.js',
  'js/timeline.js',
  'js/app.js'
];

let bundle = '';
for (const file of files) {
  const src = fs.readFileSync(baseDir + '/' + file, 'utf8');
  bundle += '\n// ===== ' + file + ' =====\n' + cleanModule(src) + '\n';
}

fs.writeFileSync(baseDir + '/bundle.js', bundle);
console.log('Saved bundle.js successfully!');
