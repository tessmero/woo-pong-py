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

const _obstacles: Array<[Vec2, ShapeName]> = []
const obsSpace = 40
let y = 0
while (y < 100) {
  _obstacles.push([[50, y] as Vec2, 'breakoutbrick'])
  y += obsSpace
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
      [pos[0] * VALUE_SCALE, pos[1] * VALUE_SCALE + this.bounds[1]],
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
  }
}
