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
import { createCanvas, registerFont } from 'canvas'
import {
  HILBERT_WIDTH, HILBERT_HEIGHT,
  N_HILBERT_POINTS, HILBERT_MIN_CELL,
} from '../src/hilbert-constants'

// ── Dark-map from image file ───────────────────────────────────────────

/**
 * Load a PNG/JPEG image from `imagePath` and return a flat Uint8Array
 * dark-pixel map (1 = dark, 0 = light) at HILBERT_WIDTH × HILBERT_HEIGHT.
 */
function loadDarkMap(imagePath: string): { darkMap: Uint8Array, darkRatio: number } {
  const imgBuf = fs.readFileSync(imagePath)
  const { Image } = require('canvas') // eslint-disable-line @typescript-eslint/no-require-imports
  const img = new Image()
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
  if (darkness < 0.15 && cellW <= HILBERT_MIN_CELL * 4 && cellH <= HILBERT_MIN_CELL * 4) {
    return [[Math.round(x + cellW / 2), Math.round(y + cellH / 2)]]
  }

  // ── Aspect-ratio correction ──────────────────────────────────────
  // When the cell is significantly non-square, split only along the
  // longer axis (binary split) to produce sub-cells closer to square
  // before applying the standard 4-quadrant Hilbert recursion.
  // The second half is reversed for spatial locality (serpentine).
  const aspect = cellW / cellH
  if (aspect > 1.5) {
    const halfW = cellW / 2
    const a = hilbertAdaptive(sat, w, x, y, halfW, cellH, rotation)
    const b = hilbertAdaptive(sat, w, x + halfW, y, halfW, cellH, rotation)
    b.reverse()
    return [...a, ...b]
  }
  if (aspect < 1 / 1.5) {
    const halfH = cellH / 2
    const a = hilbertAdaptive(sat, w, x, y, cellW, halfH, rotation)
    const b = hilbertAdaptive(sat, w, x, y + halfH, cellW, halfH, rotation)
    b.reverse()
    return [...a, ...b]
  }

  // ── Standard 4-quadrant Hilbert recursion ─────────────────────────
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

// ── Smooth and redistribute evenly along arc length ────────────────────

/**
 * Smooth a polyline with a moving-average kernel of radius `r`, then
 * resample it at `outN` points spaced evenly along the arc length.
 */
function smoothAndRedistribute(
  raw: Array<Point>, smoothRadius: number, outN: number,
): Array<Point> {
  if (raw.length < 2) return raw

  // ── 1. Moving-average smooth ──────────────────────────────────────
  const sm: Array<Point> = new Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    let sx = 0, sy = 0, cnt = 0
    const lo = Math.max(0, i - smoothRadius)
    const hi = Math.min(raw.length - 1, i + smoothRadius)
    for (let j = lo; j <= hi; j++) {
      sx += raw[j][0]
      sy += raw[j][1]
      cnt++
    }
    sm[i] = [sx / cnt, sy / cnt]
  }

  // ── 2. Compute cumulative arc-length ──────────────────────────────
  const arcLen = new Float64Array(sm.length)
  arcLen[0] = 0
  for (let i = 1; i < sm.length; i++) {
    const dx = sm[i][0] - sm[i - 1][0]
    const dy = sm[i][1] - sm[i - 1][1]
    arcLen[i] = arcLen[i - 1] + Math.sqrt(dx * dx + dy * dy)
  }
  const totalLen = arcLen[sm.length - 1]
  if (totalLen === 0) return raw.slice(0, outN)

  // ── 3. Resample at uniform arc-length intervals ───────────────────
  const out: Array<Point> = new Array(outN)
  out[0] = sm[0]
  out[outN - 1] = sm[sm.length - 1]

  let seg = 1 // current segment index in the smoothed polyline
  for (let i = 1; i < outN - 1; i++) {
    const target = totalLen * i / (outN - 1)
    // Advance segment pointer until we bracket the target distance
    while (seg < sm.length - 1 && arcLen[seg] < target) seg++
    const segStart = arcLen[seg - 1]
    const segEnd = arcLen[seg]
    const t = segEnd > segStart ? (target - segStart) / (segEnd - segStart) : 0
    out[i] = [
      Math.round(sm[seg - 1][0] + t * (sm[seg][0] - sm[seg - 1][0])),
      Math.round(sm[seg - 1][1] + t * (sm[seg][1] - sm[seg - 1][1])),
    ]
  }

  return out
}

// ── Trim / pad to exactly N points ─────────────────────────────────────

function trimToN(points: Array<Point>): { px: Int32Array, py: Int32Array } {
  // Remove points that fall in near-white regions first (via reverse pop)
  while (points.length > N_HILBERT_POINTS) {
    points.pop()
  }

  const px = new Int32Array(N_HILBERT_POINTS)
  const py = new Int32Array(N_HILBERT_POINTS)
  for (let i = 0; i < points.length; i++) {
    px[i] = points[i][0]
    py[i] = points[i][1]
  }

  if (points.length < N_HILBERT_POINTS) {
    px[points.length] = -1
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

  // The canvas must be an exact multiple of the height so we can tile it
  // with square cells left-to-right (avoids scrambled Hilbert ordering).
  const nCols = HILBERT_WIDTH / HILBERT_HEIGHT
  if (!Number.isInteger(nCols) || nCols < 1) {
    throw new Error(
      `HILBERT_WIDTH (${HILBERT_WIDTH}) must be a positive integer multiple `
      + `of HILBERT_HEIGHT (${HILBERT_HEIGHT})`,
    )
  }

  // Fill the canvas with nCols square cells, each HILBERT_HEIGHT wide.
  // Each cell enters at top-left and exits at top-right (rotation 0),
  // so adjacent cells connect naturally left-to-right.
  const cellSize = HILBERT_HEIGHT
  const points: Array<Point> = []

  for (let col = 0; col < nCols; col++) {
    const sub = hilbertAdaptive(
      sat, HILBERT_WIDTH,
      col * cellSize, 0,
      cellSize, cellSize,
      0,
    )
    points.push(...sub)
  }

  // eslint-disable-next-line no-console
  console.log(`    raw waypoints: ${points.length}, darkRatio: ${darkRatio.toFixed(3)}`)

  // Smooth the raw curve and redistribute points evenly along arc length.
  const nOut = N_HILBERT_POINTS // Math.min(points.length, N_HILBERT_POINTS)
  const even = smoothAndRedistribute(points, 3, nOut)

  const { px, py } = trimToN(even)

  // Pin endpoints so the curve always enters from the left edge
  // and exits at the right edge, both at mid-height.
  px[0] = 0
  py[0] = Math.round(HILBERT_HEIGHT / 2)
  px[N_HILBERT_POINTS - 1] = HILBERT_WIDTH
  py[N_HILBERT_POINTS - 1] = Math.round(HILBERT_HEIGHT / 2)

  return { px, py }
}

// ── Dummy test-image generator ─────────────────────────────────────────

/**
 * Create a 1000 × 200 black-and-white PNG test image with some simple
 * shapes (circle + rectangle) and save it to `outPath`.
 */
export function createDummyImage(outPath: string): void {
  const cvs = createCanvas(HILBERT_WIDTH, HILBERT_HEIGHT)
  const ctx = cvs.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)

  ctx.fillStyle = '#000000'

  // Register the Rubik font
  registerFont(
    path.join(
      __dirname,
      '../public/fonts/Rubik-VariableFont_wght.ttf',
    ),
    { family: 'Rubik' },
  )

  ctx.font = `${Math.floor(HILBERT_HEIGHT * 0.8)}px Rubik, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('QUANTUM', HILBERT_WIDTH / 2, HILBERT_HEIGHT / 2)
  ctx.lineWidth = 5
  ctx.strokeText('QUANTUM', HILBERT_WIDTH / 2, HILBERT_HEIGHT / 2)

  ctx.fillStyle = 'black'
  const w = HILBERT_WIDTH/5
  const h = HILBERT_HEIGHT/100
  ctx.fillRect(0,HILBERT_HEIGHT/2 - h/2, w, h)
  ctx.fillRect(HILBERT_WIDTH - w,HILBERT_HEIGHT/2 - h/2, w, h)

  // // Black filled circle in the left third
  // ctx.beginPath()
  // ctx.arc(250, 250, 150, 0, Math.PI * 2)
  // ctx.fill()

  // // Black filled rectangle in the right third
  // ctx.fillRect(600, 100, 300, 300)

  // // Black diagonal stripe across the middle
  // ctx.save()
  // ctx.translate(500, 250)
  // ctx.rotate(Math.PI / 6)
  // ctx.fillRect(-400, -30, 800, 60)
  // ctx.restore()

  const buf = cvs.toBuffer('image/png')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, buf)
  // eslint-disable-next-line no-console
  console.log(`  wrote dummy image: ${outPath}`)
}
