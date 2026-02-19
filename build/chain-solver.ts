/**
 * @file chain-solver.ts
 *
 * Build-time solver that traces a smooth path through the dark regions of a black-and-white image
 * by iteratively filling the regions with progressively smaller circles, then connecting their centers
 * with a smooth path from mid-left to mid-right.
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

/**
 * Load a PNG/JPEG image from `imagePath` and return a flat Uint8Array
 * dark-pixel map (1 = dark, 0 = light) at HILBERT_WIDTH × HILBERT_HEIGHT.
 */
function loadDarkMap(imagePath: string): { darkMap: Uint8Array, darkRatio: number } {
  const imgBuf = fs.readFileSync(imagePath)
  const { Image } = require('canvas')
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

/**
 * Find the largest circle that fits in the dark region, avoiding overlap with existing circles.
 */
function findLargestCircle(darkMap: Uint8Array, circles: Array<{ x: number, y: number, r: number }>, minR: number): { x: number, y: number, r: number } | null {
  let best: { x: number, y: number, r: number } | null = null
  let bestR = minR
  for (let y = minR; y < HILBERT_HEIGHT - minR; y += 4) {
    for (let x = minR; x < HILBERT_WIDTH - minR; x += 4) {
      if (darkMap[y * HILBERT_WIDTH + x] === 0) continue
      // Find max radius at this point
      let r = minR
      let ok = true
      while (ok && r < Math.min(HILBERT_WIDTH, HILBERT_HEIGHT) / 4) {
        // Check if circle stays in dark region
        for (let a = 0; a < 360; a += 30) {
          const dx = Math.round(x + r * Math.cos(a * Math.PI / 180))
          const dy = Math.round(y + r * Math.sin(a * Math.PI / 180))
          if (dx < 0 || dx >= HILBERT_WIDTH || dy < 0 || dy >= HILBERT_HEIGHT) { ok = false; break }
          if (darkMap[dy * HILBERT_WIDTH + dx] === 0) { ok = false; break }
        }
        // Check overlap with existing circles
        for (const c of circles) {
          const dist = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2)
          if (dist < r + c.r) { ok = false; break }
        }
        if (ok) r += 2
      }
      if (r > bestR) {
        bestR = r
        best = { x, y, r: r - 2 }
      }
    }
  }
  return best
}

/**
 * Iteratively fill the dark regions with circles, largest first.
 */
function fillCircles(darkMap: Uint8Array, minR: number, maxN: number): Array<{ x: number, y: number, r: number }> {
  const circles: Array<{ x: number, y: number, r: number }> = []
  for (let i = 0; i < maxN; i++) {
    const c = findLargestCircle(darkMap, circles, minR)
    if (!c) break
    circles.push(c)
  }
  return circles
}

/**
 * Trim / pad to exactly N points.
 */
function trimToN(points: Array<[number, number]>): { px: Int32Array, py: Int32Array } {
  while (points.length > N_HILBERT_POINTS) points.pop()
  const px = new Int32Array(N_HILBERT_POINTS)
  const py = new Int32Array(N_HILBERT_POINTS)
  for (let i = 0; i < points.length; i++) {
    px[i] = points[i][0]
    py[i] = points[i][1]
  }
  if (points.length < N_HILBERT_POINTS) px[points.length] = -1
  return { px, py }
}

/**
 * Trace a chain curve through the dark regions of the image at `imagePath`.
 * Returns arrays of pixel coordinates for N_HILBERT_POINTS waypoints.
 */
export function solveChainCurve(imagePath: string, frameIndex: number): {
  px: Int32Array
  py: Int32Array
} {
  // eslint-disable-next-line no-console
  console.log(`  solving chain curve for '${path.basename(imagePath)}'`)

  const { darkMap } = loadDarkMap(imagePath)

  // Fill circles in dark regions
  const minR = 3
  const maxN = 100
  const circles = fillCircles(darkMap, minR, maxN)
  console.log(circles)

  // Compute smooth path through circle centers
  const nOut = N_HILBERT_POINTS

  // Step 1: Identify adjacent circles
  function getAdjacencyList(circles: Array<{ x: number, y: number, r: number }>, threshold = 1.1) {
    const adj: Array<Array<number>> = circles.map(() => [])
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const dx = circles[i].x - circles[j].x
        const dy = circles[i].y - circles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = (circles[i].r + circles[j].r) * threshold
        if (dist < minDist) {
          adj[i].push(j)
          adj[j].push(i)
        }
      }
    }
    return adj
  }
  const adjacencyList = getAdjacencyList(circles)

  // Step 2: Find chain connecting midleft to midright
  // Find closest circle to midleft and midright
  const midleft = { x: 0, y: Math.round(HILBERT_HEIGHT / 2) }
  const midright = { x: HILBERT_WIDTH, y: Math.round(HILBERT_HEIGHT / 2) }
  function closestCircleIndex(pt: { x: number, y: number }) {
    let minIdx = 0, minDist = Infinity
    for (let i = 0; i < circles.length; i++) {
      const dx = circles[i].x - pt.x
      const dy = circles[i].y - pt.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) { minDist = dist; minIdx = i }
    }
    return minIdx
  }
  const startIdx = closestCircleIndex(midleft)
  const endIdx = closestCircleIndex(midright)

  // BFS to find best chain from startIdx to endIdx
  function findBestChain(adj: Array<Array<number>>, start: number, end: number): Array<number> {
    const queue: Array<{ path: Array<number>, visited: Set<number> }> = [{ path: [start], visited: new Set([start]) }]
    let bestPath: Array<number> = []
    while (queue.length) {
      const { path, visited } = queue.shift()!
      const last = path[path.length - 1]
      if (last === end) {
        if (!bestPath.length || path.length < bestPath.length) bestPath = path.slice()
        continue
      }
      for (const next of adj[last]) {
        if (!visited.has(next)) {
          const newVisited = new Set(visited)
          newVisited.add(next)
          queue.push({ path: [...path, next], visited: newVisited })
        }
      }
    }
    return bestPath.length ? bestPath : [start, end]
  }
  let chain = findBestChain(adjacencyList, startIdx, endIdx)

  // Step 3: Compute smooth path along chain
  function computeSmoothPathFromChain(chain: Array<number>, circles: Array<{ x: number, y: number, r: number }>, nOut: number): Array<[number, number]> {
    // Sample points along the chain
    const pts: Array<[number, number]> = chain.map(idx => [circles[idx].x, circles[idx].y])
    // Interpolate to nOut points
    const out: Array<[number, number]> = []
    for (let i = 0; i < nOut; i++) {
      const t = i / (nOut - 1)
      const seg = t * (pts.length - 1)
      const segIdx = Math.floor(seg)
      const segT = seg - segIdx
      if (segIdx < pts.length - 1) {
        const [x0, y0] = pts[segIdx]
        const [x1, y1] = pts[segIdx + 1]
        out.push([
          x0 * (1 - segT) + x1 * segT,
          y0 * (1 - segT) + y1 * segT,
        ])
      }
      else {
        out.push(pts[pts.length - 1])
      }
    }
    return out
  }

  // debug
  // Place a vertex on the center of each circle, ordered left-to-right
  chain = Array.from({ length: circles.length }, (_, i) => i)
  chain.sort((a, b) => circles[a].x - circles[b].x)

  const even = computeSmoothPathFromChain(chain, circles, nOut)

  const { px, py } = trimToN(even)

  // Pin endpoints
  px[0] = 0
  py[0] = Math.round(HILBERT_HEIGHT / 2)
  px[N_HILBERT_POINTS - 1] = HILBERT_WIDTH
  py[N_HILBERT_POINTS - 1] = Math.round(HILBERT_HEIGHT / 2)

  return { px, py }
}
