/**
 * @file obstacle.ts
 *
 * Solid obstacle defined by a closed path.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import { pointsOnPath } from 'points-on-path'

// // dummy context to call isPointInPath
// const canvas = document.createElement('canvas')
// const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

export class Obstacle {
  readonly boundingRect: Rectangle
  readonly collisionRect: Rectangle
  readonly points: ReadonlyArray<Vec2>

  constructor(
    readonly pos: Vec2,
    readonly path: string,
    readonly lut: ObstacleLut,
  ) {
    this.points = pointsOnPath(path)[0]

    this.collisionRect = [
      pos[0] - lut.maxOffsetX,
      pos[1] - lut.maxOffsetY,
      2 * lut.maxOffsetX,
      2 * lut.maxOffsetY,
    ]
    this.boundingRect = this.collisionRect
  }
}
