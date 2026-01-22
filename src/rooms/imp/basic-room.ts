/**
 * @file basic-room.ts
 *
 * Room with static obstacles and no special behavior.
 */

import { Room } from 'rooms/room'
import { RoomLayout } from 'rooms/room-layouts/room-layout'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { Perturbations } from 'simulation/perturbations'
import { type ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'


export class BasicRoom extends Room {
  static {
    Room.register('basic-room', () => new BasicRoom())
  }

  buildObstacles(): Array<Obstacle> {
    const isMixed = ((Perturbations.nextInt() >>> 0) % 10) > 8

    const layout = RoomLayout.create('four-by-four').computePositions()

    let shapeName = possibleShapes[(Perturbations.nextInt() >>> 0) % possibleShapes.length]
    const obstacles = layout.map((pos) => {
      if (isMixed) {
        shapeName = possibleShapes[(Perturbations.nextInt() >>> 0) % possibleShapes.length]
      }
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
