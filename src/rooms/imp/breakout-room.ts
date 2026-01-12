/**
 * @file breakout-room.ts
 *
 * Room where numbered bricks disappear after disks collide with them.
 * The total score always ends up at exactly 100.
 */

import { Room } from 'rooms/room'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { SHAPE_PATHS, type ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

export const BOBRICK_WIDTH = 16 * VALUE_SCALE
export const BOBRICK_HEIGHT = 8 * VALUE_SCALE
export const BOBRICK_PADDING = 2 * VALUE_SCALE

const dx = BOBRICK_WIDTH + BOBRICK_PADDING
const dy = BOBRICK_HEIGHT + BOBRICK_PADDING

const nCols = 5
const nRows = 6

const x0 = Math.floor(
  50 * VALUE_SCALE
  - (nCols * BOBRICK_WIDTH + (nCols - 1) * BOBRICK_PADDING) / 2
  + BOBRICK_WIDTH / 2,
)

const y0 = Math.floor(
  50 * VALUE_SCALE
  - (nRows * BOBRICK_HEIGHT + (nRows - 1) * BOBRICK_PADDING) / 2
  + BOBRICK_HEIGHT / 2,
)

const _obstacles: Array<[Vec2, ShapeName]> = []
for (let row = 0; row < nRows; row++) {
  for (let col = 0; col < nCols; col++) {
    _obstacles.push([[x0 + col * dx, y0 + row * dy] as Vec2, 'breakoutbrick'])
  }
}

export class BreakoutRoom extends Room {
  static {
    Room.register('breakout-room', () => new BreakoutRoom())
  }

  static solve(branchSequences: Array<Array<number>>): Array<number> {
    return solve(branchSequences)
  }

  public hitSequence: Array<number> = []

  obstacleHit(obstacle: Obstacle): void {
    obstacle.isHidden = true

    const brickIndex = this.breakoutBricks.indexOf(obstacle)
    if (brickIndex === -1) {
      throw new Error('could not find brick index')
    }
    if (this.hitSequence.includes(brickIndex)) {
      throw new Error('brick has already been hit')
    }
    this.hitSequence.push(brickIndex)
  }

  public breakoutBricks: Array<Obstacle> = []

  buildObstacles(): Array<Obstacle> {
    this.breakoutBricks = _obstacles.map(([pos, shapeName]) => new Obstacle(
      [pos[0], pos[1] + this.bounds[1]],
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
    return this.breakoutBricks
  }
}

function solve(branchSequences: Array<Array<number>>): Array<number> {
  const nBricks = 30
  const m = branchSequences.length

  // 1) Compute base value from average hits
  let totalHits = 0
  for (const b of branchSequences) totalHits += b.length
  const avgLen = totalHits / m
  const base = 100 / avgLen // target average value per hit

  // Start from all bricks at this base value
  const baseVals = Array(nBricks).fill(base)

  // 2) Build homogeneous system A * d = 0  (offsets d)
  // We don't need RHS, just A.
  const A: Array<Array<number>> = Array.from({ length: m }, () =>
    Array(nBricks).fill(0),
  )
  for (let r = 0; r < m; r++) {
    for (const idx of branchSequences[r]) {
      if (idx >= 0 && idx < nBricks) A[r][idx] = 1
    }
  }

  // 3) Gaussian elimination on A to find nullspace basis for d
  const mat: Array<Array<number>> = A.map(row => row.concat()) // copy
  const pivotCol: Array<number> = Array(m).fill(-1)
  let row = 0

  for (let col = 0; col < nBricks && row < m; col++) {
    let pivot = row
    while (pivot < m && Math.abs(mat[pivot][col]) < 1e-9) pivot++
    if (pivot === m) continue;

    [mat[row], mat[pivot]] = [mat[pivot], mat[row]]

    const div = mat[row][col]
    for (let c = col; c < nBricks; c++) mat[row][c] /= div

    for (let r = 0; r < m; r++) {
      if (r === row) continue
      const factor = mat[r][col]
      if (Math.abs(factor) < 1e-9) continue
      for (let c = col; c < nBricks; c++) {
        mat[r][c] -= factor * mat[row][c]
      }
    }

    pivotCol[row] = col
    row++
  }

  const isPivot = Array(nBricks).fill(false)
  for (const c of pivotCol) if (c >= 0) isPivot[c] = true
  const freeCols: Array<number> = []
  for (let c = 0; c < nBricks; c++) if (!isPivot[c]) freeCols.push(c)

  const nullBasis: Array<Array<number>> = []

  for (const freeCol of freeCols) {
    const v = Array(nBricks).fill(0)
    v[freeCol] = 1

    for (let r = 0; r < m; r++) {
      const pc = pivotCol[r]
      if (pc < 0) continue

      let sumFree = 0
      for (const fc of freeCols) {
        if (fc === freeCol) sumFree += mat[r][fc] * v[fc]
      }
      v[pc] = -sumFree
    }

    nullBasis.push(v)
  }

  // 4) Build integer offsets around 0 using nullspace
  function randomIntegerOffsets(
    nullB: Array<Array<number>>,
    magnitude = 2,
  ): Array<number> {
    const d = Array(nBricks).fill(0)
    for (const basisVec of nullB) {
      const coeff = Math.floor((Math.random() * 2 * magnitude + 1) - magnitude)
      if (coeff === 0) continue
      for (let i = 0; i < nBricks; i++) {
        d[i] += coeff * Math.round(basisVec[i])
      }
    }
    return d
  }

  const offsets = randomIntegerOffsets(nullBasis, 2)

  // 5) Combine base + offsets, round, clamp
  const vals = baseVals.map((v, i) => Math.round(v + offsets[i]))

  // Optional: clamp to non-negative and reasonable max (e.g. 0..100)
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] < 0) vals[i] = 0
    if (vals[i] > 100) vals[i] = 100
  }

  // 6) Final small integer correction to enforce exact 100 per branch
  function fixBranchSums(ints: Array<number>): void {
    for (const branch of branchSequences) {
      let sum = 0
      for (const idx of branch) sum += ints[idx]

      let diff = 100 - sum
      let safety = 1000
      while (diff !== 0 && safety-- > 0) {
        if (diff > 0) {
          const idx = branch[Math.floor(Math.random() * branch.length)]
          if (ints[idx] < 100) {
            ints[idx] += 1
            diff -= 1
          }
        }
        else {
          const candidates = branch.filter(i => ints[i] > 0)
          if (!candidates.length) break
          const idx = candidates[Math.floor(Math.random() * candidates.length)]
          ints[idx] -= 1
          diff += 1
        }
      }
    }
  }

  fixBranchSums(vals)

  return vals
}
