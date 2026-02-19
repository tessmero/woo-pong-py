/**
 * @file chain-solver.ts
 *
 * Build-time solver that traces a red line (chain) from the left edge to the right edge
 * of a black-and-white image. The red line is extracted by finding red pixels in the image.
 * The result is smoothed and resampled to match the Hilbert solver output.
 *
 * This module is only used at build time (ts-node) and must never be imported in browser code.
 */

import fs from 'fs'
import path from 'path'
import { createCanvas } from 'canvas'
import {
  HILBERT_WIDTH, HILBERT_HEIGHT,
  N_HILBERT_POINTS,
} from '../src/hilbert-constants'

type Point = [number, number]

/**
 * Extracts the red line from the image at `imagePath`.
 * Returns an array of [x, y] points where the red line is found.
 */
function extractRedLine(imagePath: string): Array<Point> {
  const imgBuf = fs.readFileSync(imagePath)
  const { Image } = require('canvas') // eslint-disable-line @typescript-eslint/no-require-imports
  const img = new Image()
  img.src = imgBuf

  const cvs = createCanvas(HILBERT_WIDTH, HILBERT_HEIGHT)
  const ctx = cvs.getContext('2d')
  ctx.drawImage(img, 0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)

  const { data } = ctx.getImageData(0, 0, HILBERT_WIDTH, HILBERT_HEIGHT)
  const points: Array<Point> = []

  // For each x, find the y with the strongest red pixel
  for (let x = 0; x < HILBERT_WIDTH; x++) {
    let maxRed = 0
    let bestY = -1
    for (let y = 0; y < HILBERT_HEIGHT; y++) {
      const off = (y * HILBERT_WIDTH + x) * 4
      const r = data[off]
      const g = data[off + 1]
      const b = data[off + 2]
      // Heuristic: strong red, not white, not black
      if (r > 180 && g < 100 && b < 100 && r > maxRed) {
        maxRed = r
        bestY = y
      }
    }
    if (bestY >= 0) {
      points.push([x, bestY])
    }
  }
  return points
}

/**
 * Smooth a polyline with a moving-average kernel of radius `r`, then
 * resample it at `outN` points spaced evenly along the arc length.
 * (Copied from hilbert-solver.ts)
 */
function smoothAndRedistribute(
  raw: Array<Point>, smoothRadius: number, outN: number,
): Array<Point> {
  if (raw.length < 2) return raw

  // 1. Moving-average smooth
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

  // 2. Compute cumulative arc-length
  const arcLen = new Float64Array(sm.length)
  arcLen[0] = 0
  for (let i = 1; i < sm.length; i++) {
    const dx = sm[i][0] - sm[i - 1][0]
    const dy = sm[i][1] - sm[i - 1][1]
    arcLen[i] = arcLen[i - 1] + Math.sqrt(dx * dx + dy * dy)
  }
  const totalLen = arcLen[sm.length - 1]
  if (totalLen === 0) return raw.slice(0, outN)

  // 3. Resample at uniform arc-length intervals
  const out: Array<Point> = new Array(outN)
  out[0] = sm[0]
  out[outN - 1] = sm[sm.length - 1]

  let seg = 1 // current segment index in the smoothed polyline
  for (let i = 1; i < outN - 1; i++) {
    const target = totalLen * i / (outN - 1)
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

/**
 * Trace a chain curve (red line) through the image at `imagePath`.
 * Returns arrays of pixel coordinates for N_HILBERT_POINTS waypoints.
 */
export function solveChainCurve(imagePath: string): {
  px: Int32Array
  py: Int32Array
} {
  // eslint-disable-next-line no-console
  console.log(`  solving chain curve for '${path.basename(imagePath)}'`)

  const points = extractRedLine(imagePath)
  const nOut = N_HILBERT_POINTS
  const even = smoothAndRedistribute(points, 3, nOut)

  const px = new Int32Array(N_HILBERT_POINTS)
  const py = new Int32Array(N_HILBERT_POINTS)
  for (let i = 0; i < even.length; i++) {
    px[i] = even[i][0]
    py[i] = even[i][1]
  }

  // Pin endpoints to left and right edges at the detected y
  px[0] = 0
  py[0] = even[0][1]
  px[N_HILBERT_POINTS - 1] = HILBERT_WIDTH
  py[N_HILBERT_POINTS - 1] = even[even.length - 1][1]

  return { px, py }
}
