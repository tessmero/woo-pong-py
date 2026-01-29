/**
 * @file obstacle-gfx-util.ts
 *
 * Helpers using graphics.ts to draw obstacles.
 */

import type { PinballWizard } from 'pinball-wizard'
import type { Obstacle } from 'simulation/obstacle'
import { OBSTACLE_FILL, OBSTACLE_STROKE } from 'gfx/graphics'
import { VALUE_SCALE } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { getDetailedPoints, type ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import type { Vec2 } from 'util/math-util'

export function drawObstacles(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
  const { simViewRect } = pw
  const sim = pw.activeSim

  const vy0 = simViewRect[1]
  const vy1 = vy0 + simViewRect[3]
  ctx.lineWidth = 0.4 * VALUE_SCALE
  for (const obstacle of sim.obstacles) {
    const [_x, y, _w, h] = obstacle.collisionRect
    if (y > vy1) {
      // console.log('skip obstacle below view')
      continue // obstacle is below view
    }
    if ((y + h) < vy0) {
      // console.log('skip obstacle above view')
      continue // obstacle is above view
    }
    traceObstacle(ctx, obstacle)

    ctx.fillStyle = OBSTACLE_FILL
    ctx.fill()

    ctx.strokeStyle = OBSTACLE_STROKE
    ctx.stroke()

    // debug all adjusted positions
    // debugObstacleShell(ctx, obstacle)

    // debug detailed points
    // debugDetailedPoints(ctx, obstacle)

    // debug just adjusted position for mouse
    debugCollisionAtMousePos(ctx, obstacle, pw.simMousePos)

    // // debug
    // ctx.strokeStyle = 'red'
    // ctx.lineWidth = 1 * VALUE_SCALE
    // ctx.strokeRect(...boundingRect)
  }
}

// used in drawObstacle for main view. also used in scrollbar.ts
export function traceObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  const {
    isHidden, pos, points,
    // boundingRect, collisionRect
  } = obstacle

  if (isHidden) return

  ctx.beginPath()
  for (const [x, y] of points) {
    ctx.lineTo(pos[0] + x, pos[1] + y)
  }
  ctx.closePath()
}

function debugCollisionAtMousePos(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  mousePos: Vec2,
) {
  const { shape, pos } = obstacle
  const lut = Lut.create('obstacle-lut', shape) as ObstacleLut
  // const [ni, nj] = lut.detail
  const radi = lut.obsOffsetDetailX
  const radj = lut.obsOffsetDetailY
  const rad = 1 * VALUE_SCALE
  const i = lut.offsetToXIndex(mousePos[0] - pos[0]) + radi
  const j = lut.offsetToYIndex(mousePos[1] - pos[1]) + radj

  // adjusted position in world
  ctx.fillStyle = 'black'
  ctx.fillRect(
    mousePos[0] - rad,
    mousePos[1] - rad,
    2 * rad, 2 * rad,
  )

  let leaf
  try {
    leaf = lut.tree[i]![j] as [number, number, number]
  }
  catch {
    return
  }

  if (leaf) {
    // position of colliding disk relative to obstacle
    const x = lut.indexToXOffset(i - radi)
    const y = lut.indexToYOffset(j - radj)

    // offset to adjust disk so it just touches obstacle
    const [xAdj, yAdj, _normalIndex] = leaf

    // check if adjusted position still collides
    const isGood = _checkIfGood(lut, x + xAdj, y + yAdj)
    ctx.fillStyle = isGood ? 'green' : 'red'

    // adjusted position in world
    ctx.fillRect(
      pos[0] + x + xAdj - rad,
      pos[1] + y + yAdj - rad,
      2 * rad, 2 * rad,
    )
  }
}

function debugDetailedPoints(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
) {
  const { pos, shape } = obstacle
  const detailedPoints = getDetailedPoints(shape)

  const rad = 0.1 * VALUE_SCALE
  ctx.fillStyle = 'orange'
  for (const p of detailedPoints) {
    ctx.fillRect(
      pos[0] + p[0],
      pos[1] + p[1],
      2 * rad, 2 * rad,
    )
  }
}

// show all adjusted positions for colliding disks
function debugObstacleShell(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
) {
  const { shape, pos, isFlippedX } = obstacle
  const lut = Lut.create('obstacle-lut', shape) as ObstacleLut
  const [ni, nj] = lut.detail
  const radi = lut.obsOffsetDetailX
  const radj = lut.obsOffsetDetailY
  const rad = 0.1 * VALUE_SCALE
  for (let i = 0; i < ni; i++) {
    for (let j = 0; j < nj; j++) {
      const leaf = lut.tree[i]![j] as [number, number, number]
      if (leaf) {
        // position of colliding disk relative to obstacle
        let x
        if (isFlippedX) {
          x = lut.indexToXOffset((ni - i) - radi)
        }
        else {
          x = lut.indexToXOffset(i - radi)
        }

        const y = lut.indexToYOffset(j - radj)

        // offset to adjust disk so it just touches obstacle
        let [xAdj, yAdj, _normalIndex] = leaf
        if (isFlippedX) {
          xAdj *= -1
        }

        // check if adjusted position still collides
        const isGood = _checkIfGood(lut, x + xAdj, y + yAdj)
        ctx.fillStyle = isGood ? 'green' : 'red'

        // adjusted position in world
        ctx.fillRect(
          pos[0] + x + xAdj - rad,
          pos[1] + y + yAdj - rad,
          2 * rad, 2 * rad,
        )
      }
    }
  }
}

function _checkIfGood(lut: ObstacleLut, x: number, y: number) {
  const radi = lut.obsOffsetDetailX
  const radj = lut.obsOffsetDetailY
  const ti = lut.offsetToXIndex(x)
  const tj = lut.offsetToYIndex(y)
  let isGood
  try {
    isGood = !lut.tree[ti + radi]![tj + radj]
    if (!isGood) {
      isGood = !lut.tree[ti + radi + 1]![tj + radj + 1]
    }
  }
  catch {
    isGood = true
  }

  return isGood
}
