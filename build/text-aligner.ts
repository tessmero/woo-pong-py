/**
 * @file text-aligner.ts
 *
 * Generate an interactive HTML tool for aligning cover 3D text with orbit/FOV controls.
 *
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { DEFAULT_TEXT_ALIGN_CAMERA } from './build-cover'

const COVER_WIDTH = 420
const COVER_HEIGHT = 588

const rubikFontDataUrl = `data:font/ttf;base64,${readFileSync(
  join(__dirname, '..', 'public', 'fonts', 'Expectative-grK1.ttf'),
).toString('base64')}`

const outPath = join(__dirname, '..', 'public', 'cover-images', 'text-aligner.html')
const startAlign = DEFAULT_TEXT_ALIGN_CAMERA
const startFov = startAlign.fov
const startMeshScale = startAlign.meshScale ?? 1
const startExtrusionDepth = startAlign.extrusionDepth ?? 4
const startTwist = 0

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cover Text Aligner</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f1115;
      --panel: #1b1f27;
      --line: #2d3442;
      --text: #d9e0ee;
      --accent: #66d2ff;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Rubik", "Segoe UI", sans-serif;
      background: radial-gradient(circle at 30% 20%, #1d2431 0%, var(--bg) 50%);
      color: var(--text);
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(360px, 420px) minmax(480px, 1fr);
      gap: 18px;
      padding: 18px;
    }

    .panel {
      background: color-mix(in srgb, var(--panel) 92%, black 8%);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }

    h1 {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    p {
      margin: 0 0 10px;
      line-height: 1.4;
      font-size: 13px;
      color: #b8c2d6;
    }

    .control-row {
      display: grid;
      grid-template-columns: 95px 1fr 82px;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
    }

    .control-row label {
      font-size: 13px;
      color: #9cb0cf;
    }

    input[type="range"],
    input[type="number"] {
      width: 100%;
      accent-color: var(--accent);
      background: #131824;
      color: var(--text);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 32px;
      padding: 0 8px;
    }

    button {
      margin-top: 12px;
      width: 100%;
      border: 1px solid #3883a6;
      background: linear-gradient(180deg, #4bb6e6 0%, #2d8fbf 100%);
      color: #021018;
      font-weight: 700;
      border-radius: 10px;
      min-height: 36px;
      cursor: pointer;
    }

    button:hover { filter: brightness(1.05); }

    textarea {
      width: 100%;
      margin-top: 10px;
      min-height: 220px;
      resize: vertical;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: #0f131d;
      color: #d2ddf2;
      padding: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.45;
    }

    .viewport-wrap {
      position: relative;
      border-radius: 14px;
      border: 1px solid var(--line);
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 28%, rgba(93, 165, 209, 0.22), transparent 60%),
        #080b11;
      aspect-ratio: ${COVER_WIDTH} / ${COVER_HEIGHT};
      height: min(calc(100vh - 36px), 100%);
      max-height: calc(100vh - 36px);
      justify-self: center;
      width: auto;
    }

    #view {
      width: 100%;
      height: 100%;
      display: block;
    }

    .guide-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
    }

    .guide-line {
      fill: none;
      stroke: rgba(0, 255, 102, 0.95);
      stroke-width: 3;
      vector-effect: non-scaling-stroke;
    }

    .badge {
      margin-top: 8px;
      font-size: 11px;
      color: #9db1cf;
    }

    @media (max-width: 1050px) {
      body {
        grid-template-columns: 1fr;
      }

      .viewport-wrap {
        width: 100%;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <aside class="panel">
    <h1>Cover Text Aligner</h1>
    <p>
      Drag to orbit, wheel to zoom. Tune FOV, scale, depth, and twist.
      Export JSON and paste into DEFAULT_TEXT_ALIGN_CAMERA in build/build-cover.ts.
    </p>

    <div class="control-row">
      <label for="fovRange">FOV</label>
      <input id="fovRange" type="range" min="10" max="110" step="0.1" value="${startFov}">
      <input id="fovInput" type="number" min="10" max="110" step="0.1" value="${startFov}">
    </div>

    <div class="control-row">
      <label for="scaleRange">Mesh Scale</label>
      <input id="scaleRange" type="range" min="0.2" max="3" step="0.01" value="${startMeshScale}">
      <input id="scaleInput" type="number" min="0.2" max="3" step="0.01" value="${startMeshScale}">
    </div>

    <div class="control-row">
      <label for="depthRange">Extrude</label>
      <input id="depthRange" type="range" min="0.2" max="12" step="0.1" value="${startExtrusionDepth}">
      <input id="depthInput" type="number" min="0.2" max="12" step="0.1" value="${startExtrusionDepth}">
    </div>

    <div class="control-row">
      <label for="twistRange">Cam Twist</label>
      <input id="twistRange" type="range" min="-180" max="180" step="0.1" value="${startTwist}">
      <input id="twistInput" type="number" min="-180" max="180" step="0.1" value="${startTwist}">
    </div>

    <button id="exportBtn" type="button">Export Camera JSON To Clipboard</button>
    <div id="status" class="badge">Ready.</div>

    <textarea id="jsonOut" spellcheck="false" readonly></textarea>
  </aside>

  <main class="viewport-wrap">
    <canvas id="view"></canvas>
    <svg class="guide-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <!-- View-locked visual guides (old top/bottom alignment lines) -->
      <line class="guide-line" x1="20" y1="18" x2="80" y2="18"></line>
      <line class="guide-line" x1="20" y1="58" x2="80" y2="48"></line>
    </svg>
  </main>

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.181.2/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
    import { FontLoader } from 'three/addons/loaders/FontLoader.js';
    import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';

    const FONT_TTF_URL = ${JSON.stringify(rubikFontDataUrl)};
    const START_ALIGN = ${JSON.stringify(startAlign)};
    const MAIN_TEXT = 'QUANTUM\\nWOO PONG';

    const canvas = document.getElementById('view');
    const wrap = canvas.parentElement;
    const fovRange = document.getElementById('fovRange');
    const fovInput = document.getElementById('fovInput');
    const scaleRange = document.getElementById('scaleRange');
    const scaleInput = document.getElementById('scaleInput');
    const depthRange = document.getElementById('depthRange');
    const depthInput = document.getElementById('depthInput');
    const twistRange = document.getElementById('twistRange');
    const twistInput = document.getElementById('twistInput');
    const exportBtn = document.getElementById('exportBtn');
    const jsonOut = document.getElementById('jsonOut');
    const status = document.getElementById('status');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(START_ALIGN.fov, 1, 0.1, 1000);
    camera.position.set(START_ALIGN.position.x, START_ALIGN.position.y, START_ALIGN.position.z);
    if (START_ALIGN.up) {
      camera.up.set(START_ALIGN.up.x, START_ALIGN.up.y, START_ALIGN.up.z);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(START_ALIGN.target.x, START_ALIGN.target.y, START_ALIGN.target.z);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    camera.lookAt(controls.target);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(0, 0, 120);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x5af0f0, 1.6);
    fillLight.position.set(120, -150, 80);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(140, 14, 0x334055, 0x1f2736);
    grid.position.y = -26;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    const textGroup = new THREE.Group();
    scene.add(textGroup);

    const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0 });

    let currentFont = null;
    let meshScale = START_ALIGN.meshScale ?? 1;
    let extrusionDepth = START_ALIGN.extrusionDepth ?? 4;
    let cameraTwistDeg = ${startTwist};
    const baseUp = camera.up.clone().normalize();

    function buildMultilineText(font) {
      const size = 8;
      const depth = extrusionDepth;
      const lines = MAIN_TEXT.split('\\n');
      const lineHeight = size * 1.2;
      const topBaselineY = ((lines.length - 1) * lineHeight) / 2;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const baselineY = topBaselineY - lineIdx * lineHeight;

        const chars = [];
        for (const char of line) {
          if (char === ' ') {
            chars.push({ char, geometry: null, width: size * 0.5, bbox: null });
            continue;
          }
          const geo = new TextGeometry(char, {
            font,
            size,
            depth,
            curveSegments: 12,
            bevelEnabled: false,
          });
          geo.computeBoundingBox();
          const bbox = geo.boundingBox;
          chars.push({
            char,
            geometry: geo,
            width: bbox.max.x - bbox.min.x,
            bbox,
          });
        }

        const lineWidth = chars.reduce((sum, c) => sum + c.width, 0);
        let cursorX = -lineWidth / 2;

        for (const c of chars) {
          if (c.geometry) {
            const letterGeo = c.geometry.clone();
            letterGeo.translate(cursorX - c.bbox.min.x, baselineY, -depth);
            textGroup.add(new THREE.Mesh(letterGeo, textMaterial));
          }
          cursorX += c.width;
        }
      }

      textGroup.scale.setScalar(meshScale);
    }

    function clearTextMeshes() {
      while (textGroup.children.length > 0) {
        const child = textGroup.children.pop();
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          for (const m of child.material) m.dispose();
        }
      }
    }

    function rebuildText() {
      if (!currentFont) return;
      clearTextMeshes();
      buildMultilineText(currentFont);
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function clamp(v, min, max, fallback) {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    }

    function applyCameraTwist() {
      const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
      const up = baseUp.clone().applyAxisAngle(dir, THREE.MathUtils.degToRad(cameraTwistDeg));
      camera.up.copy(up);
      camera.lookAt(controls.target);
    }

    function getCameraJson() {
      const toNum = (v) => Number(v.toFixed(4));
      return {
        fov: toNum(camera.fov),
        position: {
          x: toNum(camera.position.x),
          y: toNum(camera.position.y),
          z: toNum(camera.position.z),
        },
        target: {
          x: toNum(controls.target.x),
          y: toNum(controls.target.y),
          z: toNum(controls.target.z),
        },
        up: {
          x: toNum(camera.up.x),
          y: toNum(camera.up.y),
          z: toNum(camera.up.z),
        },
        meshScale: toNum(meshScale),
        extrusionDepth: toNum(extrusionDepth),
      };
    }

    function refreshJsonPreview() {
      jsonOut.value = JSON.stringify(getCameraJson(), null, 2) + '\\n';
    }

    function setStatus(message) {
      status.textContent = message;
    }

    function applyFov(value) {
      const fov = clamp(value, 10, 110, 38);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      fovRange.value = String(fov);
      fovInput.value = String(fov);
      refreshJsonPreview();
    }

    function applyMeshScale(value) {
      meshScale = clamp(value, 0.2, 3, 1);
      textGroup.scale.setScalar(meshScale);
      scaleRange.value = String(meshScale);
      scaleInput.value = String(meshScale);
      refreshJsonPreview();
    }

    function applyExtrusionDepth(value) {
      extrusionDepth = clamp(value, 0.2, 12, 4);
      depthRange.value = String(extrusionDepth);
      depthInput.value = String(extrusionDepth);
      rebuildText();
      refreshJsonPreview();
    }

    function applyTwist(value) {
      cameraTwistDeg = clamp(value, -180, 180, 0);
      twistRange.value = String(cameraTwistDeg);
      twistInput.value = String(cameraTwistDeg);
      applyCameraTwist();
      refreshJsonPreview();
    }

    fovRange.addEventListener('input', () => applyFov(fovRange.value));
    fovInput.addEventListener('change', () => applyFov(fovInput.value));

    scaleRange.addEventListener('input', () => applyMeshScale(scaleRange.value));
    scaleInput.addEventListener('change', () => applyMeshScale(scaleInput.value));

    depthRange.addEventListener('input', () => applyExtrusionDepth(depthRange.value));
    depthInput.addEventListener('change', () => applyExtrusionDepth(depthInput.value));

    twistRange.addEventListener('input', () => applyTwist(twistRange.value));
    twistInput.addEventListener('change', () => applyTwist(twistInput.value));

    exportBtn.addEventListener('click', async () => {
      const text = JSON.stringify(getCameraJson(), null, 2);
      try {
        await navigator.clipboard.writeText(text + '\\n');
        setStatus('Camera JSON copied to clipboard.');
      }
      catch {
        setStatus('Clipboard blocked. Copy from the text area below.');
      }
      refreshJsonPreview();
      jsonOut.focus();
      jsonOut.select();
    });

    window.addEventListener('resize', resize);

    const ttfLoader = new TTFLoader();
    const fontLoader = new FontLoader();
    ttfLoader.load(
      FONT_TTF_URL,
      (json) => {
        currentFont = fontLoader.parse(json);
        rebuildText();
        resize();
        applyFov(START_ALIGN.fov);
        applyMeshScale(START_ALIGN.meshScale ?? 1);
        applyExtrusionDepth(START_ALIGN.extrusionDepth ?? 4);
        applyTwist(${startTwist});
        setStatus('Font loaded. Orbit and tune controls, then export.');
      },
      undefined,
      (error) => {
        console.error(error);
        setStatus('Failed to load font.');
      },
    );

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      applyCameraTwist();
      refreshJsonPreview();
      renderer.render(scene, camera);
    }

    animate();
  </script>
</body>
</html>
`

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, html)
// eslint-disable-next-line no-console
console.log(`wrote text aligner: ${outPath}`)
