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
import { Perturbations } from 'simulation/perturbations'
import type { ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

const _obstacles: Array<[Vec2, ShapeName]> = []
const obsSpace = 20
let y = 20
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
        shapeName,
        Lut.create('obstacle-lut', shapeName) as ObstacleLut,
        this,
      )
      obs.isStatic = false

      if ((Perturbations.nextInt() >>> 0) % 2) {
        obs.isFlippedX = true
      }

      return obs
    })
    return [...this.wedges(), ...paddles]
  }
}
