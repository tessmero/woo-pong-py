/**
 * @file hilbert-solver.ts
 *
 * Build-time solver that traces a density-adaptive Hilbert curve through
 * the dark regions of a black-and-white image.
 *
 * For each pattern we:
 *   1. Render the pattern tile onto a 1000 × 500 sampling canvas.
 *   2. Build a darkness map (1 = dark pixel, 0 = light).
 *   3. Recursively subdivide quadrants in Hilbert order, going deeper
 *      where darkness is high and stopping early where it is low.
 *   4. Collect the waypoints (centre of every leaf cell) and trim /
 *      pad to exactly N_HILBERT_POINTS entries.
 *
 * The smallest leaf cells are HILBERT_MIN_CELL pixels wide, which
 * leaves a visible gap of a few pixels between adjacent curve legs.
 *
 * This module is only used at build time (ts-node) and must never be
 * imported in browser code.
 */

import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import {
  HILBERT_WIDTH, HILBERT_HEIGHT,
  N_HILBERT_POINTS, HILBERT_MIN_CELL,
} from '../src/simulation/hilbert-constants'

// ── Dark-map from image file ───────────────────────────────────────────

/**
 * Load a PNG/JPEG image from `imagePath` and return a flat Uint8Array
 * dark-pixel map (1 = dark, 0 = light) at HILBERT_WIDTH × HILBERT_HEIGHT.
 */
function loadDarkMap(imagePath: string): { darkMap: Uint8Array, darkRatio: number } {
  const imgBuf = fs.readFileSync(imagePath)
  const { Image } = require('canvas') // eslint-disable-line @typescript-eslint/no-require-imports
  const img = new Image() // eslint-disable-line new-cap
  img.src = imgBuf

  const cvs = createCanvas(HILBERT_WIDTH, HILBERT_HEIGHT)
  const ctx = cvs.getContext('2d')
  ctx.drawImage(img, 0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)

  const { data } = ctx.getImageData(0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)
  const total = HILBERT_WIDTH * HILBERT_HEIGHT
  const darkMap = new Uint8Array(total)
  let darkCount = 0
  for (let i = 0; i < total; i++) {
    const off = i * 4
    const dark = (data[off] + data[off + 1] + data[off + 2]) < 128 * 3 ? 1 : 0
    darkMap[i] = dark
    darkCount += dark
  }
  return { darkMap, darkRatio: darkCount / total }
}

// ── Summed-area table for fast region queries ──────────────────────────

function buildSAT(darkMap: Uint8Array, w: number, h: number): Float64Array {
  const sat = new Float64Array(w * h)
  for (let y = 0; y < h; y++) {
    let rowSum = 0
    for (let x = 0; x < w; x++) {
      rowSum += darkMap[y * w + x]
      sat[y * w + x] = rowSum + (y > 0 ? sat[(y - 1) * w + x] : 0)
    }
  }
  return sat
}

/** Average darkness in the rectangle [x0, y0) .. [x1, y1) using the SAT. */
function regionDarkness(
  sat: Float64Array, w: number,
  x0: number, y0: number, x1: number, y1: number,
): number {
  x1 = Math.min(x1, w)
  y1 = Math.min(y1, HILBERT_HEIGHT)
  if (x1 <= x0 || y1 <= y0) return 0
  const area = (x1 - x0) * (y1 - y0)
  const br = sat[(y1 - 1) * w + (x1 - 1)]
  const tl = (x0 > 0 && y0 > 0) ? sat[(y0 - 1) * w + (x0 - 1)] : 0
  const tr = (y0 > 0) ? sat[(y0 - 1) * w + (x1 - 1)] : 0
  const bl = (x0 > 0) ? sat[(y1 - 1) * w + (x0 - 1)] : 0
  return (br - tr - bl + tl) / area
}

// ── Adaptive Hilbert recursion ─────────────────────────────────────────

type Point = [number, number]

/**
 * Hilbert curve orientation table.
 *
 * Each of the four rotations (0–3) defines:
 *   - `order`: which quadrant to visit first → last (indices into
 *     [TL=0, TR=1, BL=2, BR=3])
 *   - `child`: what rotation to use for each of the four visits.
 */
const HILBERT: Record<number, { order: [number, number, number, number], child: [number, number, number, number] }> = {
  0: { order: [0, 2, 3, 1], child: [1, 0, 0, 3] }, // U shape (up-right)
  1: { order: [0, 1, 3, 2], child: [0, 1, 1, 2] }, // C shape (left-down)
  2: { order: [3, 1, 0, 2], child: [3, 2, 2, 1] }, // ∩ shape (down-left)
  3: { order: [3, 2, 0, 1], child: [2, 3, 3, 0] }, // reverse-C
}

/** Quadrant top-left offsets (TL=0, TR=1, BL=2, BR=3). */
const QX = [0, 1, 0, 1]
const QY = [0, 0, 1, 1]

function hilbertAdaptive(
  sat: Float64Array,
  w: number,
  x: number, y: number,
  cellW: number, cellH: number,
  rotation: number,
): Array<Point> {
  // If cell is at or below the minimum size, emit a single point
  if (cellW <= HILBERT_MIN_CELL || cellH <= HILBERT_MIN_CELL) {
    return [[Math.round(x + cellW / 2), Math.round(y + cellH / 2)]]
  }

  // Check darkness of this region
  const darkness = regionDarkness(sat, w, Math.floor(x), Math.floor(y),
    Math.ceil(x + cellW), Math.ceil(y + cellH))

  // If region is nearly all white, emit just the centre (skip detail)
  if (darkness < 0.02) {
    return [[Math.round(x + cellW / 2), Math.round(y + cellH / 2)]]
  }

  // If region is lightly dark and cells are already fairly small, stop
  if (darkness < 0.15 && cellW <= HILBERT_MIN_CELL * 4) {
    return [[Math.round(x + cellW / 2), Math.round(y + cellH / 2)]]
  }

  const halfW = cellW / 2
  const halfH = cellH / 2

  const { order, child } = HILBERT[rotation]
  const points: Array<Point> = []

  for (let i = 0; i < 4; i++) {
    const q = order[i]
    const subPoints = hilbertAdaptive(
      sat, w,
      x + QX[q] * halfW,
      y + QY[q] * halfH,
      halfW, halfH,
      child[i],
    )
    points.push(...subPoints)
  }

  return points
}

// ── Trim / pad to exactly N points ─────────────────────────────────────

function trimToN(points: Array<Point>): { px: Int32Array, py: Int32Array } {
  // Remove points that fall in near-white regions first (via reverse pop)
  while (points.length > N_HILBERT_POINTS) {
    points.pop()
  }

  // If too few, duplicate last points with tiny offsets
  let idx = 0
  while (points.length < N_HILBERT_POINTS) {
    const [x, y] = points[idx % points.length]
    points.push([
      Math.min(x + 1, HILBERT_WIDTH - 1),
      Math.min(y + 1, HILBERT_HEIGHT - 1),
    ])
    idx++
  }

  const px = new Int32Array(N_HILBERT_POINTS)
  const py = new Int32Array(N_HILBERT_POINTS)
  for (let i = 0; i < N_HILBERT_POINTS; i++) {
    px[i] = points[i][0]
    py[i] = points[i][1]
  }
  return { px, py }
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Trace an adaptive Hilbert curve through the dark regions of the image
 * at `imagePath`.  Returns arrays of pixel coordinates for
 * N_HILBERT_POINTS waypoints.
 */
export function solveHilbertCurve(imagePath: string): {
  px: Int32Array
  py: Int32Array
} {
  // eslint-disable-next-line no-console
  console.log(`  solving hilbert curve for '${path.basename(imagePath)}'`)

  const { darkMap, darkRatio } = loadDarkMap(imagePath)

  // Build summed-area table for fast region queries
  const sat = buildSAT(darkMap, HILBERT_WIDTH, HILBERT_HEIGHT)

  // If the image is entirely white or entirely black, use a uniform
  // Hilbert curve over the full canvas.
  // Otherwise use the adaptive variant.
  let points: Array<Point>

  if (darkRatio < 0.001 || darkRatio > 0.999) {
    // Full uniform curve
    points = hilbertAdaptive(sat, HILBERT_WIDTH, 0, 0,
      HILBERT_WIDTH, HILBERT_HEIGHT, 0)
  }
  else {
    points = hilbertAdaptive(sat, HILBERT_WIDTH, 0, 0,
      HILBERT_WIDTH, HILBERT_HEIGHT, 0)
  }

  // eslint-disable-next-line no-console
  console.log(`    raw waypoints: ${points.length}, darkRatio: ${darkRatio.toFixed(3)}`)

  return trimToN(points)
}

// ── Dummy test-image generator ─────────────────────────────────────────

/**
 * Create a 1000 × 500 black-and-white PNG test image with some simple
 * shapes (circle + rectangle) and save it to `outPath`.
 */
export function createDummyImage(outPath: string): void {
  const cvs = createCanvas(HILBERT_WIDTH, HILBERT_HEIGHT)
  const ctx = cvs.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)

  // Black filled circle in the left third
  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(250, 250, 150, 0, Math.PI * 2)
  ctx.fill()

  // Black filled rectangle in the right third
  ctx.fillRect(600, 100, 300, 300)

  // Black diagonal stripe across the middle
  ctx.save()
  ctx.translate(500, 250)
  ctx.rotate(Math.PI / 6)
  ctx.fillRect(-400, -30, 800, 60)
  ctx.restore()

  const buf = cvs.toBuffer('image/png')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, buf)
  // eslint-disable-next-line no-console
  console.log(`  wrote dummy image: ${outPath}`)
}
