/**
 * @file obstacle-gfx.ts
 *
 * Helpers using graphics.ts to draw obstacles.
 */

import type { PinballWizard } from 'pinball-wizard'
import type { Obstacle } from 'simulation/obstacle'
import { OBSTACLE_FILL, OBSTACLE_STROKE } from './graphics'
import { VALUE_SCALE } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'

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

    // debug
    debugObstacleShell(ctx, obstacle)

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

function debugObstacleShell(ctx: CanvasRenderingContext2D, obstacle: Obstacle) {
  const { shape, pos } = obstacle
  const lut = Lut.create('obstacle-lut', shape) as ObstacleLut
  const [ni, nj] = lut.detail
  ctx.fillStyle = 'red'
  const rad = .1 * VALUE_SCALE
  for (let i = 0; i < ni; i++) {
    for (let j = 0; j < nj; j++) {
      const leaf = lut.tree[i]![j] as [number, number, number]
      if (leaf) {
        // position of colliding disk relative to obstacle
        const x = lut.indexToXOffset(i - ni/2)
        const y = lut.indexToYOffset(j - nj/2)

        // offset to adjust disk so it just touches obstacle
        const [xAdj, yAdj, _normalIndex] = leaf

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
