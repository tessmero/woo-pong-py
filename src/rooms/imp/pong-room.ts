/**
 * @file pong-room.ts
 *
 * Room with moving barriers.
 */

import { Room } from 'rooms/room'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

const _obstacles: Array<[Vec2, ShapeName]> = []
const obsSpace = 40
let y = 0
while (y < 100) {
  _obstacles.push([[50, y] as Vec2, 'roundrect'])
  y += obsSpace
}

export class PongRoom extends Room {
  static {
    Room.register('pong-room', () => new PongRoom())
  }

  buildObstacles(): Array<Obstacle> {
    const paddles = _obstacles.map(([pos, shapeName]) => {
      const obs = new Obstacle(
        [pos[0] * VALUE_SCALE, pos[1] * VALUE_SCALE + this.bounds[1]],
        SHAPE_PATHS[shapeName],
        Lut.create('obstacle-lut', shapeName) as ObstacleLut,
        this,
      )
      obs.isStatic = false
      return obs
    })
    return [...this.wedges(), ...paddles]
  }
}
