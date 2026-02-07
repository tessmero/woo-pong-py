/**
 * @file obstacle.ts
 *
 * One specific solid obstacle in level.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { centeredPointsOnPath, transformPoints, type ObstacleLut } from './luts/imp/obstacle-lut'
import { VALUE_SCALE } from './constants'
import { Perturbations } from './perturbations'
import type { Room } from 'rooms/room'
import type { ShapeName } from './shapes'
import { SHAPE_PATHS } from './shapes'

// // dummy context to call isPointInPath
// const canvas = document.createElement('canvas')
// const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

export class Obstacle {
  readonly boundingRect: Rectangle
  readonly collisionRect: Rectangle
  readonly points: ReadonlyArray<Vec2>

  isStatic = true // disable movement

  // movement only for pong paddles
  readonly vel: Vec2 = [100, 0]
  readonly minX = 20 * VALUE_SCALE
  readonly maxX = 80 * VALUE_SCALE

  private _isFlippedX = false
  set isFlippedX(value: boolean) {
    this._isFlippedX = value
    if (this._isFlippedX) {
      flipPointsX(this)
    }
  }

  get isFlippedX() { return this._isFlippedX }

  hideOnStep = -1
  isHidden = false
  label: string | null = null

  constructor(
    readonly pos: Vec2,
    readonly shape: ShapeName,
    readonly lut: ObstacleLut,
    readonly room?: Room,
  ) {
    const shapeParams = SHAPE_PATHS[shape]
    const { baseSvg } = shapeParams

    const isTruncated = (shape === 'flipper')
    this.points = centeredPointsOnPath(baseSvg, isTruncated)
    transformPoints(this.points, shapeParams)

    this.collisionRect = [
      pos[0] - lut.maxOffsetX,
      pos[1] - lut.maxOffsetY,
      2 * lut.maxOffsetX,
      2 * lut.maxOffsetY,
    ]
    this.boundingRect = this.collisionRect
  }

  step() {
    if (this.isStatic) return

    Perturbations.reverseObstacle(this)

    const { pos, vel, minX, maxX, lut } = this

    if (vel[0] < 0 && pos[0] < minX) {
      vel[0] *= -1
    }
    else if (vel[0] > 0 && pos[0] > maxX) {
      vel[0] *= -1
    }

    pos[0] += vel[0]
    pos[1] += vel[1]

    this.collisionRect[0] = pos[0] - lut.maxOffsetX
    this.collisionRect[1] = pos[1] - lut.maxOffsetY
  }
}

function flipPointsX(obs: Obstacle) {
  const { points } = obs
  for (const p of points) {
    p[0] = -p[0]
  }
}
