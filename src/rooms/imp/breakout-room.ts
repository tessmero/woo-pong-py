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

  obstacleHit(obstacle: Obstacle): void {
    obstacle.isHidden = true
  }

  buildObstacles(): Array<Obstacle> {
    return _obstacles.map(([pos, shapeName]) => new Obstacle(
      [pos[0], pos[1] + this.bounds[1]],
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
  }
}
