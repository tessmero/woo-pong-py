/**
 * @file basic-room.ts
 *
 * Room with static obstacles and no special behavior.
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
let x = 0
while (x < 100) {
  _obstacles.push([[x, 50] as Vec2, 'star'])
  x += obsSpace
}

export class BasicRoom extends Room {
  static {
    Room.register('basic-room', () => new BasicRoom())
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
