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
 * - Perspective mode: tilt text back to create classic comic book cover effect
 *   where top edge is horizontal and bottom edge recedes with perspective
 *
 * Perspective Mode Details:
 *   When usePerspective is enabled, the text is rotated around the X-axis and
 *   viewed with a perspective camera. The top and bottom edges of the text mesh
 *   align with the specified line segments, creating the classic comic book effect
 *   where the title appears to recede into the distance.
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
 *   - usePerspective: Enable perspective camera and text tilt
 *   - perspectiveTilt: Angle in degrees to tilt text back (default: 20)
 *   - perspectiveWidthFactor: Horizontal compression/expansion in perspective mode
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
  perspectiveWidthFactor?: number // Horizontal compression/expansion in perspective mode (default: 1)
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
  // Create multiple test images
  // await createCoverImage(join(coverImgDir, 'basic.png'), {
  //   mainText: 'QUANTUM',
  //   topText: 'AMAZING SCIENCE-FICTION TALES!',
  // })

  // await createCoverImage(join(coverImgDir, 'with-tubes.png'), {
  //   mainText: 'STRANGE',
  //   topText: 'DC COMICS',
  //   showEdgeTubes: true,
  // })

  // await createCoverImage(join(coverImgDir, 'with-outline.png'), {
  //   mainText: 'ADVENTURES',
  //   showOuterEdges: true,
  //   outerEdgeDilation: 0.5,
  // })

  // await createCoverImage(join(coverImgDir, 'all-features.png'), {
  //   mainText: 'QUANTUM',
  //   topText: 'AMAZING SCIENCE-FICTION TALES!',
  //   showEdgeTubes: true,
  //   showOuterEdges: true,
  //   edgeTubeRadius: 0.3,
  //   outerEdgeDilation: 0.6,
  // })

  // await createCoverImage(join(coverImgDir, 'perspective.png'), {
  //   mainText: 'STRANGE',
  //   topText: 'AMAZING SCIENCE-FICTION TALES!',
  //   usePerspective: true,
  //   perspectiveTilt: 20,
  //   showOuterEdges: true,
  //   showGuideLines: true,
  // })

  // await createCoverImage(join(coverImgDir, 'perspective-adventures.png'), {
  //   mainText: 'ADVENTURES',
  //   topText: 'DC COMICS',
  //   usePerspective: true,
  //   perspectiveTilt: 25,
  //   showEdgeTubes: true,
  //   showGuideLines: true,
  // })

  // // Classic comic book style with strong perspective
  // await createCoverImage(join(coverImgDir, 'comic-style.png'), {
  //   mainText: 'STRANGE',
  //   topText: 'AMAZING SCIENCE-FICTION TALES!',
  //   usePerspective: true,
  //   perspectiveTilt: 30,
  //   topEdgeLeftY: 12,
  //   topEdgeRightY: 12,
  //   bottomEdgeLeftY: -18,
  //   bottomEdgeRightY: -18,
  //   showOuterEdges: true,
  //   outerEdgeDilation: 0.8,
  // })

  // Slanted edges - top horizontal, bottom slopes down to right
  await createCoverImage(join(coverImgDir, 'slanted.png'), {
    mainText: 'QUANTUM',
    topText: 'DC COMICS',
    usePerspective: true,
    perspectiveTilt: 25,
    perspectiveWidthFactor: 2,
    topEdgeLeftY: 18,
    topEdgeRightY: 18,
    bottomEdgeLeftY: 14,
    bottomEdgeRightY: 14,
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
    // Perspective camera for 3D depth effect
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 5, 60);
    camera.lookAt(0, 0, 0);
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
        warpGeometryToEdgeLines(textGeo, {
          edgeLineX: ${edgeLineX},
          topEdgeLeftY: ${topEdgeLeftY},
          topEdgeRightY: ${topEdgeRightY},
          bottomEdgeLeftY: ${bottomEdgeLeftY},
          bottomEdgeRightY: ${bottomEdgeRightY},
          extrudeDepth,
          perspectiveTilt: ${perspectiveTilt},
          perspectiveWidthFactor: ${perspectiveWidthFactor},
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

      // Use a conservative depth ramp so wider columns appear slightly closer,
      // reinforcing perspective without causing extreme distortion.
      const cameraDistance = 60;
      const tiltStrength = Math.sin(Math.abs(perspectiveTilt) * Math.PI / 180);

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

        const localHeight = Math.max(1e-6, topY - bottomY);
        const relativeScale = localHeight / Math.max(1e-6, avgTargetHeight);
        const targetZFromScale = cameraDistance * (1 - 1 / Math.max(1e-6, relativeScale));
        const clampedDepthShift = THREE.MathUtils.clamp(targetZFromScale * tiltStrength * 0.35, -8, 8);

        // Preserve front/back layering while shifting each X column in depth.
        const depthT = (z + extrudeDepth) / Math.max(1e-6, extrudeDepth);
        const targetZ = clampedDepthShift + THREE.MathUtils.lerp(-extrudeDepth, 0, depthT);

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
