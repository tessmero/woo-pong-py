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
import { SHAPE_PATHS, type ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

const _obstacles: Array<[Vec2]> = []
const dx = 20
const dy = 20
let x = 10
while (x < 80) {
  let y = 10
  while (y < 80) {
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
    const possibleShapes: Array<ShapeName> = ['diamond', 'star']
    const i = (Perturbations.nextInt() >>> 0)
    const shapeName = possibleShapes[i % possibleShapes.length]
    const obstacles = _obstacles.map(([pos]) => new Obstacle(
      [pos[0] * VALUE_SCALE, pos[1] * VALUE_SCALE + this.bounds[1]],
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
    return [...this.wedges(), ...obstacles]
  }
}
