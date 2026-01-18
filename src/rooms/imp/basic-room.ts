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
import { Perturbations } from 'simulation/perturbations'
import { type ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

const _obstacles: Array<[Vec2]> = []
const dx = 20
const dy = 20
let x = 18
while (x < 85) {
  let y = 18
  while (y < 85) {
    _obstacles.push([[x, y] as Vec2])
    y += dy
  }
  x += dx
}

export class BasicRoom extends Room {
  static {
    Room.register('basic-room', () => new BasicRoom())
  }

  buildObstacles(): Array<Obstacle> {
    const possibleShapes: Array<ShapeName> = [

      'diamond',
      // 'flipper',
      'star',
      'pawn',
      'shield',
      'meeple',
      'club',
      'bishop',
      'bolt',
      'airplane',
      'head',
      'note',

    ]
    const obstacles = _obstacles.map(([pos]) => {
      const i = (Perturbations.nextInt() >>> 0)
      const shapeName = possibleShapes[i % possibleShapes.length]
      const result = new Obstacle(
        [pos[0] * VALUE_SCALE, pos[1] * VALUE_SCALE + this.bounds[1]],
        shapeName,
        Lut.create('obstacle-lut', shapeName) as ObstacleLut,
        this,
      )

      if ((Perturbations.nextInt() >>> 0) % 2) {
        result.isFlippedX = true
      }
      return result
    })
    return [...this.wedges(), ...obstacles]
  }
}
