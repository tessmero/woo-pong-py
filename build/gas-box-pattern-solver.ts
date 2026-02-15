/**
 * @file gas-box-pattern-solver.ts
 *
 * Build-time solver that places N_GAS_BOX_PARTICLES gas particles in a
 * hexagonal grid within the dark (black) regions of each filler pattern.
 *
 * For each pattern we:
 *   1. Get the tile canvas from the Pattern registry
 *   2. Tile it across a sampling canvas at the correct visual scale
 *   3. Count dark vs light pixels to estimate the dark-region ratio
 *   4. Iteratively compute a hex-grid spacing that yields ~1000 particles
 *   5. Return the particle positions in sim-unit coordinates
 *
 * This module is only used at build time (ts-node) and must never be
 * imported in browser code.
 */

import fs from 'fs'
import path from 'path'
import { PATTERN, type PatternName } from '../src/imp-names'
import { Pattern } from '../src/gfx/patterns/pattern'
import { makeCanvas } from '../src/gfx/patterns/pattern-util'
import { VALUE_SCALE } from '../src/simulation/constants'
import { N_GAS_BOX_PARTICLES, GAS_BOX_WIDTH, GAS_BOX_HEIGHT } from '../src/simulation/gas-box-constants'

import { requireImps } from './require-imps'

// Trigger pattern registrations
requireImps(PATTERN)

const N = N_GAS_BOX_PARTICLES
const GBW = GAS_BOX_WIDTH
const GBH = GAS_BOX_HEIGHT

/** Sampling resolution (pixels). Wider because the gas box is 2:1. */
const SAMPLE_W = 400
const SAMPLE_H = 200

/**
 * Additional scale factor applied on top of each pattern's built-in
 * getScale() when computing the tile size on the sampling canvas.
 */
const SOLVER_SCALE = 2

// ── Sampling helpers ───────────────────────────────────────────────────

/**
 * Render the tiled pattern onto a SAMPLE_W × SAMPLE_H canvas and return
 * a Uint8Array dark-pixel map (1 = dark, 0 = light).
 */
function renderDarkMap(name: PatternName): { darkMap: Uint8Array, darkRatio: number } {
  const cvs = makeCanvas(SAMPLE_W, SAMPLE_H)
  const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

  const tile = Pattern.getCanvas(name)

  if (tile) {
    const patScale = Pattern.create(name).getScale()
    const s = SOLVER_SCALE * VALUE_SCALE * patScale * SAMPLE_W / GBW
    ctx.fillStyle = ctx.createPattern(tile, 'repeat')!
    ctx.scale(s, s)
    ctx.imageSmoothingEnabled = false
    ctx.fillRect(0, 0, SAMPLE_W / s, SAMPLE_H / s)
  }
  else {
    ctx.fillStyle = name
    ctx.fillRect(0, 0, SAMPLE_W, SAMPLE_H)
  }

  // Save rendered pattern as PNG for inspection
  const outDir = path.resolve(__dirname, 'pattern-images')
  fs.mkdirSync(outDir, { recursive: true })
  const buf = (cvs as any).toBuffer('image/png') as Buffer
  fs.writeFileSync(path.join(outDir, `${name}.png`), buf)

  const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H)
  const total = SAMPLE_W * SAMPLE_H
  const darkMap = new Uint8Array(total)
  let darkCount = 0
  for (let i = 0; i < total; i++) {
    const off = i * 4
    // Treat a pixel as "dark" when its luminance is closer to 0 than to 255.
    const dark = (data[off] + data[off + 1] + data[off + 2]) < 128 * 3 ? 1 : 0
    darkMap[i] = dark
    darkCount += dark
  }

  return { darkMap, darkRatio: darkCount / total }
}

// ── Hex-grid generation ────────────────────────────────────────────────

/**
 * Generate hex-grid positions over the gas-box area, keeping only
 * those that land on dark pixels according to `darkMap`.
 */
function hexGridFiltered(
  spacing: number,
  darkMap: Uint8Array,
): Array<[number, number]> {
  const rowH = spacing * Math.sqrt(3) / 2
  const positions: Array<[number, number]> = []

  for (let row = 0; ; row++) {
    const y = row * rowH
    if (y >= GBH) break
    const xOff = (row & 1) * spacing / 2
    for (let col = 0; ; col++) {
      const x = xOff + col * spacing
      if (x >= GBW) break

      // Map sim-unit position to a sample pixel
      const px = Math.min(Math.floor(x / GBW * SAMPLE_W), SAMPLE_W - 1)
      const py = Math.min(Math.floor(y / GBH * SAMPLE_H), SAMPLE_H - 1)
      if (darkMap[py * SAMPLE_W + px]) {
        positions.push([x, y])
      }
    }
  }
  return positions
}

/** Uniform hex grid (no filtering — used for solid colours). */
function hexGridUniform(): Array<[number, number]> {
  const cellArea = (GBW * GBH) / N
  const spacing = Math.sqrt(cellArea * 2 / Math.sqrt(3))
  const rowH = spacing * Math.sqrt(3) / 2
  const positions: Array<[number, number]> = []
  for (let row = 0; ; row++) {
    const y = row * rowH
    if (y >= GBH) break
    const xOff = (row & 1) * spacing / 2
    for (let col = 0; ; col++) {
      const x = xOff + col * spacing
      if (x >= GBW) break
      positions.push([x, y])
    }
  }
  return positions
}

// ── Trim / pad to exactly N particles ──────────────────────────────────

function trimToN(positions: Array<[number, number]>): { px: Int32Array, py: Int32Array } {
  // If too many, evenly thin from the list
  while (positions.length > N) {
    // Remove the last element (least significant position)
    positions.pop()
  }
  // If too few, duplicate existing positions with tiny offsets
  let idx = 0
  while (positions.length < N) {
    const [x, y] = positions[idx % positions.length]
    positions.push([
      Math.min(x + 1, GBW - 1),
      Math.min(y + 1, GBH - 1),
    ])
    idx++
  }

  const px = new Int32Array(N)
  const py = new Int32Array(N)
  for (let i = 0; i < N; i++) {
    px[i] = Math.round(positions[i][0])
    py[i] = Math.round(positions[i][1])
  }
  return { px, py }
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Compute solved-state particle positions for pattern at `patternIndex`.
 *
 * Returns arrays of sim-unit coordinates for 1000 particles arranged in
 * a hex grid that fills the dark regions of the given pattern.
 */
export function solvePatternPositions(patternIndex: number): {
  px: Int32Array
  py: Int32Array
} {
  const name = PATTERN.NAMES[patternIndex]
  // eslint-disable-next-line no-console
  console.log(`  solving gas-box pattern '${name}' (${patternIndex + 1}/${PATTERN.NAMES.length})`)

  const { darkMap, darkRatio } = renderDarkMap(name)

  // Solid colours or very low dark ratio → uniform hex grid
  if (darkRatio < 0.001 || darkRatio > 0.999) {
    return trimToN(hexGridUniform())
  }

  // Estimate initial hex spacing from dark ratio
  //   N ≈ darkRatio · area / ((√3/2)·s²)
  //   s = sqrt(darkRatio · area · 2 / (√3 · N))
  const area = GBW * GBH
  let spacing = Math.sqrt(darkRatio * area * 2 / (Math.sqrt(3) * N))

  // Iteratively refine spacing until we hit close to N particles
  for (let iter = 0; iter < 100; iter++) {
    const pts = hexGridFiltered(spacing, darkMap)
    const count = pts.length
    if (count === 0) { spacing *= 0.8; continue }
    if (Math.abs(count - N) <= 10) break
    // Scale spacing proportionally: fewer particles → smaller spacing
    spacing *= Math.sqrt(count / N)
  }

  const positions = hexGridFiltered(spacing, darkMap)
  return trimToN(positions)
}
