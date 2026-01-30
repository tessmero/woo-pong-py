/**
 * @file basic-room.ts
 *
 * Room with static obstacles and no special behavior.
 */

import type { RoomLayoutName } from 'imp-names'
import { Room } from 'rooms/room'
import { ROOM_LAYOUT_POSITIONS } from 'rooms/room-layouts/set-by-build'
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

    const layoutName = randomLayout()
    // const layout = RoomLayout.create(layoutName).computePositions()
    const layout = ROOM_LAYOUT_POSITIONS[layoutName]
    const groupShapes: Record<number, ShapeName> = {}

    const obstacles = layout.map((entry) => {
      const group = entry[0] as number
      const pos = entry[1] as Vec2
      let shapeName: ShapeName
      if (isMixed) {
        shapeName = randomShape()
      }
      else {
        if (!Object.hasOwn(groupShapes, group)) {
          groupShapes[group] = randomShape()
        }
        shapeName = groupShapes[group]
      }
      const result = new Obstacle(
        [pos[0], pos[1] + this.bounds[1]],
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

const possibleLayouts: Array<RoomLayoutName> = [
  'honeycomb',
  'three-by-three',
  // 'four-by-four',
]

function randomLayout(): RoomLayoutName {
  return possibleLayouts[
    (Perturbations.nextInt() >>> 0) % possibleLayouts.length
  ]
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

function randomShape(): ShapeName {
  return possibleShapes[
    (Perturbations.nextInt() >>> 0) % possibleShapes.length
  ]
}
