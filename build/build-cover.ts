/**
 * @file build-cover.ts
 *
 * Create 3D cover images with extruded text using Three.js.
 *
 * Features:
 * - Flat top text for subtitles (like "AMAZING SCIENCE-FICTION TALES!")
 * - 3D extruded main title text with depth and bevels
 * - Optional edge tubes: black tubes that trace the front face outline
 * - Optional outer edges: duplicated tube geometry layered through extrusion depth
 * - High-contrast lighting: directional lights create solid black faces
 * - Isometric mode: tilt text back with an orthographic camera to preserve
 *   parallel depth lines while keeping a strong 3D look
 *
 * Isometric Mode Details:
 *   When usePerspective is enabled, the text is rotated around the X-axis and
 *   viewed with an orthographic isometric camera. The top and bottom edges of
 *   the text mesh align with the specified line segments while depth remains
 *   parallel instead of converging to a vanishing point.
 *
 *   Edge lines are defined by their left and right Y-coordinates:
 *   - topEdgeLeftY/topEdgeRightY: Y positions at left and right sides of top edge
 *   - bottomEdgeLeftY/bottomEdgeRightY: Y positions for bottom edge
 *   - If left and right Y values differ, the edge will be slanted
 *   - edgeLineX: horizontal distance from center (default: 30)
 *
 *   Use showGuideLines to visualize the alignment boundaries.
 *
 * Usage:
 *   npm run build-cover
 *
 * Customization:
 *   Edit the main() function calls to adjust:
 *   - topText: Flat text at the top
 *   - mainText: The main 3D title
 *   - showEdgeTubes: Add black tube outlines on the front face
 *   - showOuterEdges: Draw duplicated tube outlines behind the title through depth
 *   - edgeTubeRadius: Thickness of the edge tubes (default: 0.4)
 *   - usePerspective: Enable isometric camera and text tilt
 *   - perspectiveTilt: Angle in degrees to tilt text back (default: 20)
 *   - perspectiveWidthFactor: Horizontal compression/expansion in isometric mode
 *   - extrusionViewAngleX: Horizontal viewing angle (0=front, +right, -left, default: 45)
 *   - extrusionViewAngleY: Vertical viewing angle (0=level, +above, -below, default: 31)
 *   - topEdgeLeftY/topEdgeRightY: Y positions for top edge line endpoints
 *   - bottomEdgeLeftY/bottomEdgeRightY: Y positions for bottom edge line endpoints
 *   - edgeLineX: Horizontal distance for edge lines (default: 30)
 *   - showGuideLines: Show red guide lines for alignment debugging
 */
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import puppeteer from 'puppeteer'

const COVER_WIDTH = 420
const COVER_HEIGHT = 588

interface CoverOptions {
  topText?: string
  mainText: string
  showEdgeTubes?: boolean
  showOuterEdges?: boolean
  edgeTubeRadius?: number
  usePerspective?: boolean
  perspectiveTilt?: number // Degrees to tilt text back (default: 15)
  perspectiveWidthFactor?: number // Horizontal compression/expansion in isometric mode (default: 1)
  // Extrusion appearance control
  extrusionViewAngleX?: number // Horizontal viewing angle in degrees: 0=front, positive=right, negative=left (default: 45)
  extrusionViewAngleY?: number // Vertical viewing angle in degrees: 0=level, positive=above, negative=below (default: 35)
  // Line segments for edge alignment (defaults create horizontal lines)
  topEdgeLeftY?: number // Y position of top edge at left side
  topEdgeRightY?: number // Y position of top edge at right side
  bottomEdgeLeftY?: number // Y position of bottom edge at left side
  bottomEdgeRightY?: number // Y position of bottom edge at right side
  edgeLineX?: number // X distance from center for edge lines (default: 30)
  showGuideLines?: boolean // Show alignment guide lines for debugging
}

const coverImgDir = join(__dirname, 'cover-images')

async function main() {


  // Example: Extrusions appear to extend down and to the left
  await createCoverImage(join(coverImgDir, 'extrude-left-down.png'), {
    mainText: 'QUANTUM',
    usePerspective: true,
    perspectiveTilt: 25,
    perspectiveWidthFactor: 2,
    extrusionViewAngleX: -15, 
    extrusionViewAngleY: -15,
    topEdgeLeftY: 18,
    topEdgeRightY: 18,
    bottomEdgeLeftY: 8,
    bottomEdgeRightY: 12,
    showEdgeTubes: true,
    showOuterEdges: true,
    showGuideLines: true,
  })
}

main().catch(console.error)

async function createCoverImage(outPath: string, options: CoverOptions): Promise<void> {
  const {
    topText = '',
    mainText,
    showEdgeTubes = false,
    edgeTubeRadius = 0.4,
  } = options

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // Enable console logging from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', error => console.error('PAGE ERROR:', error))

  await page.setViewport({ width: COVER_WIDTH, height: COVER_HEIGHT })

  // Generate HTML with Three.js scene
  const html = generateThreeJSHTML(options)
  await page.setContent(html)

  // Wait for rendering to complete
  await page.waitForFunction(() => (window as any).renderComplete === true, { timeout: 10000 })

  // Take screenshot
  const screenshot = await page.screenshot({ type: 'png' })

  await browser.close()

  // Save to file
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, screenshot)
  // eslint-disable-next-line no-console
  console.log(`  wrote cover image: ${outPath}`)
}

function generateThreeJSHTML(options: CoverOptions): string {
  const {
    topText = '',
    mainText,
    showEdgeTubes = false,
    showOuterEdges = false,
    edgeTubeRadius = 0.1,
    usePerspective = false,
    perspectiveTilt = 20,
    perspectiveWidthFactor = 1,
    extrusionViewAngleX = 45,
    extrusionViewAngleY = 31,
    topEdgeLeftY = 15,
    topEdgeRightY = 15,
    bottomEdgeLeftY = -15,
    bottomEdgeRightY = -15,
    edgeLineX = 30,
    showGuideLines = false,
  } = options

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
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
    import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
    import { FontLoader } from 'three/addons/loaders/FontLoader.js';

    window.renderComplete = false;

    const COVER_WIDTH = ${COVER_WIDTH};
    const COVER_HEIGHT = ${COVER_HEIGHT};

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Camera setup
    const aspect = COVER_WIDTH / COVER_HEIGHT;
    let camera;
    
    ${usePerspective
      ? `
    // Isometric view: orthographic projection from a diagonal camera angle.
    // This preserves parallel depth lines and avoids FOV/vanishing-point distortion.
    // Camera position is calculated from viewing angles using spherical coordinates.
    const cameraDistance = 87.6;
    const angleXRad = THREE.MathUtils.degToRad(${extrusionViewAngleX}); // Horizontal angle (azimuthal)
    const angleYRad = THREE.MathUtils.degToRad(${extrusionViewAngleY}); // Vertical angle (elevation)
    
    // Convert spherical coordinates to Cartesian
    const cameraX = cameraDistance * Math.cos(angleYRad) * Math.sin(angleXRad);
    const cameraY = cameraDistance * Math.sin(angleYRad);
    const cameraZ = cameraDistance * Math.cos(angleYRad) * Math.cos(angleXRad);
    
    const isoFrustumSize = 54;
    camera = new THREE.OrthographicCamera(
      -isoFrustumSize * aspect / 2,
      isoFrustumSize * aspect / 2,
      isoFrustumSize / 2,
      -isoFrustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, 0);
    
    console.log('Camera position:', cameraX.toFixed(2), cameraY.toFixed(2), cameraZ.toFixed(2));
    `
      : `
    // Orthographic camera for flat look
    const frustumSize = 50;
    camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    `}

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(COVER_WIDTH, COVER_HEIGHT);
    document.body.appendChild(renderer.domElement);
    const extrudeDepth = 4;

    // High-contrast lighting for solid black faces
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 10);
    scene.add(keyLight);

    const sideLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sideLight.position.set(-10, 0, 5);
    scene.add(sideLight);

    // Minimal ambient for high contrast
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);

    const group = new THREE.Group();

    ${showGuideLines
      ? `
    // Add guide lines to show alignment boundaries
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 5 });
    
    ${usePerspective
      ? `
    // For isometric camera, to make lines appear horizontal on screen,
    // we need to adjust Z as X changes based on the camera viewing angle.
    // The ratio depends on how the camera projects the X and Z axes onto the screen.
    const isoRatio = cameraX / Math.max(0.01, cameraZ);
    
    const avgTargetHeight = ((${topEdgeLeftY} - ${bottomEdgeLeftY}) + (${topEdgeRightY} - ${bottomEdgeRightY})) / 2;
    const tiltRadians = THREE.MathUtils.degToRad(${perspectiveTilt});
    const tiltDepthRange = Math.tan(Math.abs(tiltRadians)) * avgTargetHeight * 0.35;
    const tiltSign = Math.sign(${perspectiveTilt}) || 1;
    
    // Calculate base depth for top edge (v ≈ 1 at top)
    const topV = 1;
    const topCenteredV = (topV - 0.5) * 2;
    const topBaseDepth = THREE.MathUtils.clamp(-tiltSign * topCenteredV * tiltDepthRange, -8, 8);
    
    // Calculate base depth for bottom edge (v ≈ 0 at bottom)
    const bottomV = 0;
    const bottomCenteredV = (bottomV - 0.5) * 2;
    const bottomBaseDepth = THREE.MathUtils.clamp(-tiltSign * bottomCenteredV * tiltDepthRange, -8, 8);
    
    // Top guide line: Z adjusts as X changes to appear horizontal
    const topLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${topEdgeLeftY}, topBaseDepth + ${edgeLineX} * isoRatio),
      new THREE.Vector3(${edgeLineX}, ${topEdgeRightY}, topBaseDepth - ${edgeLineX} * isoRatio)
    ]);
    const topLine = new THREE.Line(topLineGeo, lineMaterial);
    scene.add(topLine);
    
    // Bottom guide line: Z adjusts as X changes to appear horizontal
    const bottomLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${bottomEdgeLeftY}, bottomBaseDepth + ${edgeLineX} * isoRatio),
      new THREE.Vector3(${edgeLineX}, ${bottomEdgeRightY}, bottomBaseDepth - ${edgeLineX} * isoRatio)
    ]);
    const bottomLine = new THREE.Line(bottomLineGeo, lineMaterial);
    scene.add(bottomLine);
    
    console.log('Isometric ratio (X/Z adjustment):', isoRatio.toFixed(3));
    `
      : `
    // Top guide line (can be slanted)
    const topLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${topEdgeLeftY}, 0),
      new THREE.Vector3(${edgeLineX}, ${topEdgeRightY}, 0)
    ]);
    const topLine = new THREE.Line(topLineGeo, lineMaterial);
    scene.add(topLine);
    
    // Bottom guide line (can be slanted)
    const bottomLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${bottomEdgeLeftY}, 0),
      new THREE.Vector3(${edgeLineX}, ${bottomEdgeRightY}, 0)
    ]);
    const bottomLine = new THREE.Line(bottomLineGeo, lineMaterial);
    scene.add(bottomLine);
    `}
    `
      : ''}

    // Load font and create text
    const loader = new FontLoader();
    loader.load(
      'https://cdn.jsdelivr.net/npm/three@0.181.2/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        // Top flat text
        ${topText
          ? `
        const topTextGeo = new TextGeometry('${topText}', {
          font: font,
          size: 2,
          depth: 0.1,
        });
        topTextGeo.computeBoundingBox();
        const topTextWidth = topTextGeo.boundingBox.max.x - topTextGeo.boundingBox.min.x;
        
        const topTextMesh = new THREE.Mesh(
          topTextGeo,
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        topTextMesh.position.set(-topTextWidth / 2, 18, 0);
        group.add(topTextMesh);
        `
          : ''}

        // Main extruded text
        const textGeo = new TextGeometry('${mainText}', {
          font: font,
          size: 8,
          depth: extrudeDepth,
          curveSegments: 12,
          bevelEnabled: false,
        });

        textGeo.translate(0,0,-extrudeDepth)
        textGeo.computeBoundingBox();
        const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

        // Map text vertices so each X column spans between the configured
        // top and bottom guide lines. This creates left/right perspective
        // variation when guide-line spacing differs across X.
        ${usePerspective
          ? `
        const isoRatio = cameraX / Math.max(0.01, cameraZ);
        warpGeometryToEdgeLines(textGeo, {
          edgeLineX: ${edgeLineX},
          topEdgeLeftY: ${topEdgeLeftY},
          topEdgeRightY: ${topEdgeRightY},
          bottomEdgeLeftY: ${bottomEdgeLeftY},
          bottomEdgeRightY: ${bottomEdgeRightY},
          extrudeDepth,
          perspectiveTilt: ${perspectiveTilt},
          perspectiveWidthFactor: ${perspectiveWidthFactor},
          isoRatio: isoRatio,
        });
        `
          : ''}

        // Main text mesh
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0xff4444,
          metalness: 0.3,
          roughness: 0.7,
        });
        const textMesh = new THREE.Mesh(textGeo, textMaterial);
        ${usePerspective
          ? 'textMesh.position.set(0, 0, 0);'
          : 'textMesh.position.set(-textWidth / 2, -4, 0);'}
        group.add(textMesh);
        
        // DEBUG: Add green sphere at text mesh center
        const centerSphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const centerSphereMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const centerSphere = new THREE.Mesh(centerSphereGeo, centerSphereMat);
        centerSphere.position.copy(textMesh.position);
        group.add(centerSphere);

        // Perspective placement is baked into the geometry in warpGeometryToEdgeLines().

        // Edge tubes and optional outer edge layers based on front-face loops
        ${showEdgeTubes || showOuterEdges
          ? `
        const frontEdgeLoops = extractFrontEdgeLoops(textGeo);
        console.log('Found', frontEdgeLoops.length, 'loops');
        frontEdgeLoops.forEach((loop, idx) => {
          if (loop.length < 2) return;
          
          console.log('Loop', idx, ':', loop.length, 'points, first point x:', loop[0].x, 'y:', loop[0].y, 'z:', loop[0].z);
          
            // DEBUG: Check loop connectivity
            let maxGap = 0;
            let avgGap = 0;
            for (let k = 1; k < loop.length; k++) {
              const gap = loop[k].distanceTo(loop[k - 1]);
              avgGap += gap;
              if (gap > maxGap) maxGap = gap;
            }
            avgGap /= (loop.length - 1);
            console.log('Loop', idx, 'max gap:', maxGap.toFixed(3), 'avg gap:', avgGap.toFixed(3));
          
          
          const curve = new EdgeCurve(loop);
          const tubeRadius = ${edgeTubeRadius * 2};
          const tubularSegments = 1000 // Math.max(20, Math.floor(loop.length / 10));
          console.log('Creating tube with radius', tubeRadius, 'and', tubularSegments, 'tubular segments');

          const buildTubeGeoAtOffset = (zOffset) => {
            const tubeGeo = new THREE.TubeGeometry(
              curve,
              tubularSegments,
              tubeRadius,
              8,
              true
            );
            tubeGeo.translate(0, 0, extrudeDepth + zOffset);
            return tubeGeo;
          };

          if (${showOuterEdges}) {
            const outerLayerCount = Math.max(2, Math.floor(extrudeDepth * 8));
            const outerStep = outerLayerCount > 1 ? extrudeDepth / (outerLayerCount - 1) : extrudeDepth;
            const outerMaterial = new THREE.MeshBasicMaterial({
              color: 0x000000,
              depthWrite: false,
              depthTest: false,
            });

            for (let layer = 0; layer < outerLayerCount; layer++) {
              const zOffset = -layer * outerStep;
              const outerMesh = new THREE.Mesh(buildTubeGeoAtOffset(zOffset), outerMaterial);
              outerMesh.renderOrder = -999; // Draw before everything else to sit visually behind.
              outerMesh.position.set(textMesh.position.x, textMesh.position.y, 0);
              group.add(outerMesh);
            }
          }

          if (${showEdgeTubes}) {
            const tubeMaterial = new THREE.MeshBasicMaterial({
              color: 0x000000,
              depthWrite: false,
              depthTest: false,
            });
            const tubeMesh = new THREE.Mesh(buildTubeGeoAtOffset(0), tubeMaterial);
            tubeMesh.renderOrder = 999; // Force to render last/on top.
            // The loop points are in geometry space (already includes the z=-4 translation)
            // So we only need to apply the x,y offset from textMesh
            tubeMesh.position.set(textMesh.position.x, textMesh.position.y, 0);
            console.log('Tube mesh', idx, 'position x:', tubeMesh.position.x, 'y:', tubeMesh.position.y, 'z:', tubeMesh.position.z);
            group.add(tubeMesh);
          }
        });
        `
          : ''}

        scene.add(group);

        // Render
        renderer.render(scene, camera);
        window.renderComplete = true;
      }
    );

    // Helper function to extract front face edge loops (one per letter/hole)
    function warpGeometryToEdgeLines(geometry, config) {
      const {
        edgeLineX,
        topEdgeLeftY,
        topEdgeRightY,
        bottomEdgeLeftY,
        bottomEdgeRightY,
        extrudeDepth,
        perspectiveTilt,
        perspectiveWidthFactor,
        isoRatio,
      } = config;

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const minX = bbox.min.x;
      const maxX = bbox.max.x;
      const centerX = (minX + maxX) / 2;
      const minY = bbox.min.y;
      const maxY = bbox.max.y;
      const halfWidth = Math.max(1e-6, (maxX - minX) / 2);
      const height = Math.max(1e-6, maxY - minY);

      const position = geometry.attributes.position;
      const avgTargetHeight =
        ((topEdgeLeftY - bottomEdgeLeftY) + (topEdgeRightY - bottomEdgeRightY)) / 2;

      // Apply depth shift by vertical position so perspectiveTilt behaves like
      // rotation around the X axis (top recedes, bottom comes forward).
      const tiltRadians = THREE.MathUtils.degToRad(perspectiveTilt);
      const tiltDepthRange = Math.tan(Math.abs(tiltRadians)) * avgTargetHeight * 0.35;
      const tiltSign = Math.sign(perspectiveTilt) || 1;

      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        // Keep mapping centered while allowing width tuning with perspectiveWidthFactor.
        const centeredU = (x - centerX) / (halfWidth * Math.max(1e-6, perspectiveWidthFactor));
        const u = THREE.MathUtils.clamp((centeredU + 1) / 2, 0, 1);
        const v = (y - minY) / height;

        const targetX = THREE.MathUtils.lerp(-edgeLineX, edgeLineX, u);
        const topY = THREE.MathUtils.lerp(topEdgeLeftY, topEdgeRightY, u);
        const bottomY = THREE.MathUtils.lerp(bottomEdgeLeftY, bottomEdgeRightY, u);
        const targetY = THREE.MathUtils.lerp(bottomY, topY, v);

        // Depth varies by row instead of column to avoid Y-axis-style skew.
        const centeredV = (v - 0.5) * 2;
        const baseDepthShift = THREE.MathUtils.clamp(
          -tiltSign * centeredV * tiltDepthRange,
          -8,
          8
        );

        // For isometric camera, to make lines appear horizontal on screen,
        // Z must be adjusted based on X position using the camera-dependent ratio.
        const isoZAdjustment = -targetX * isoRatio;

        // Preserve front/back layering while shifting each X column in depth.
        const depthT = (z + extrudeDepth) / Math.max(1e-6, extrudeDepth);
        const targetZ = baseDepthShift + isoZAdjustment + THREE.MathUtils.lerp(-extrudeDepth, 0, depthT);

        position.setXYZ(i, targetX, targetY, targetZ);
      }

      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }

    function extractFrontEdgeLoops(geometry) {
      const position = geometry.attributes.position;
      const index = geometry.index;

      if (!position || position.count === 0) {
        return [];
      }

      const vertexIdByKey = new Map(); // key "x,y" -> stable id
      const vertexById = new Map(); // id -> Vector3
      const edgeUseCount = new Map(); // edge "a:b" -> triangle use count
      let nextVertexId = 0;

      function vertexKey(x, y) {
        return x.toFixed(5) + ',' + y.toFixed(5);
      }

      function getFrontVertexId(v) {
        const key = vertexKey(v.x, v.y);
        if (!vertexIdByKey.has(key)) {
          const id = nextVertexId++;
          vertexIdByKey.set(key, id);
          vertexById.set(id, new THREE.Vector3(v.x, v.y, v.z));
        }
        return vertexIdByKey.get(key);
      }

      function addEdgeById(a, b) {
        if (a === b) return;
        const edgeKey = a < b ? a + ':' + b : b + ':' + a;
        edgeUseCount.set(edgeKey, (edgeUseCount.get(edgeKey) || 0) + 1);
      }

      const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);
      for (let t = 0; t < triangleCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

        const v0 = new THREE.Vector3(position.getX(i0), position.getY(i0), position.getZ(i0));
        const v1 = new THREE.Vector3(position.getX(i1), position.getY(i1), position.getZ(i1));
        const v2 = new THREE.Vector3(position.getX(i2), position.getY(i2), position.getZ(i2));

        // Keep only cap triangles that face the camera/front direction.
        const e1 = new THREE.Vector3().subVectors(v1, v0);
        const e2 = new THREE.Vector3().subVectors(v2, v0);
        const triNormal = new THREE.Vector3().crossVectors(e1, e2);
        if (triNormal.lengthSq() > 1e-12) {
          triNormal.normalize();
        }

        if (triNormal.z < -0.35) {
          const a = getFrontVertexId(v0);
          const b = getFrontVertexId(v1);
          const c = getFrontVertexId(v2);
          addEdgeById(a, b);
          addEdgeById(b, c);
          addEdgeById(c, a);
        }
      }

      const adjacency = new Map(); // id -> Set<neighborId>
      const boundaryEdges = [];
      edgeUseCount.forEach((count, edgeKey) => {
        if (count !== 1) return;
        const [aStr, bStr] = edgeKey.split(':');
        const a = Number(aStr);
        const b = Number(bStr);
        boundaryEdges.push([a, b]);

        if (!adjacency.has(a)) adjacency.set(a, new Set());
        if (!adjacency.has(b)) adjacency.set(b, new Set());
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
      });

      const usedEdgeKeys = new Set();
      function undirectedEdgeKey(a, b) {
        return a < b ? a + ':' + b : b + ':' + a;
      }

      const loops = [];
      for (const [startA, startB] of boundaryEdges) {
        const seedKey = undirectedEdgeKey(startA, startB);
        if (usedEdgeKeys.has(seedKey)) continue;

        const loopIds = [startA, startB];
        usedEdgeKeys.add(seedKey);

        let prev = startA;
        let current = startB;
        let guard = 0;
        const maxSteps = boundaryEdges.length + 10;

        while (guard++ < maxSteps) {
          if (current === startA) {
            break;
          }

          const neighbors = adjacency.get(current);
          if (!neighbors || neighbors.size === 0) {
            break;
          }

          let next = null;
          for (const candidate of neighbors) {
            if (candidate === prev) continue;
            const candidateEdgeKey = undirectedEdgeKey(current, candidate);
            if (usedEdgeKeys.has(candidateEdgeKey)) continue;
            next = candidate;
            break;
          }

          if (next === null) {
            for (const candidate of neighbors) {
              if (candidate === prev) continue;
              next = candidate;
              break;
            }
          }

          if (next === null) {
            break;
          }

          const nextEdgeKey = undirectedEdgeKey(current, next);
          usedEdgeKeys.add(nextEdgeKey);
          loopIds.push(next);
          prev = current;
          current = next;
        }

        if (loopIds.length > 3 && loopIds[loopIds.length - 1] === loopIds[0]) {
          const loop = loopIds.map((id) => vertexById.get(id).clone());
          loops.push(loop);
        }
      }

      return loops;
    }

    // Custom curve for tube geometry
    class EdgeCurve extends THREE.Curve {
      constructor(points) {
        super();
        this.points = points;
      }

      getPoint(t) {
        const totalPoints = this.points.length - 1;
        const scaledT = t * totalPoints;
        const index = Math.floor(scaledT);
        const nextIndex = Math.min(index + 1, totalPoints);
        const localT = scaledT - index;
        
        return new THREE.Vector3().lerpVectors(
          this.points[index],
          this.points[nextIndex],
          localT
        );
      }
    }
  </script>
</body>
</html>`
}
