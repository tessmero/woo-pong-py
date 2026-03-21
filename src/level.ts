/**
 * @file level.ts
 *
 * Construct level composed of rooms using prng.
 */

import type { RoomName, StartLayoutName } from 'imp-names'
import { Room } from 'rooms/room'
import { ROOM_COUNT, VALUE_SCALE } from 'simulation/constants'
import type { Obstacle } from 'simulation/obstacle'
import { Perturbations } from 'simulation/perturbations'
import type { Rectangle } from 'util/math-util'

const roomPadding = 10 // space between 100x100 rooms
const startPadding = 10
const endPadding = 10


const thick = 1 // thickness of walls

const possibleStarts: Array<StartLayoutName> = [
  // 'pool',
  'spin',
]
function randomStartLayout(): StartLayoutName {
  return possibleStarts[
    (Perturbations.nextInt() >>> 0) % possibleStarts.length
  ]
}

export class Level {
  public readonly rooms: Array<Room>
  public readonly startLayout: StartLayoutName
  private readonly _bounds: Rectangle
  private readonly _finish: Rectangle
  constructor(roomCount = ROOM_COUNT) {
    this.startLayout = this.pickStartLayout()
    
    const totalHeight = startPadding
      + 100 * roomCount
      + roomPadding * (roomCount - 1)
      + endPadding

    const finishThickness = 50
    this._finish = [
      0, totalHeight - finishThickness,
      100, finishThickness,
    ]

    this._bounds = ([
      thick, thick,
      100 - 2 * thick,
      totalHeight - 2 * thick,
    ]).map(v => v * VALUE_SCALE) as Rectangle
    this.rooms = Array.from({ length: roomCount }, (_, roomIndex) => {
      const roomOffset = VALUE_SCALE * (
        startPadding
        + (100 + roomPadding) * roomIndex
      )
      const roomBounds: Rectangle = [
        0, roomOffset, 100 * VALUE_SCALE, 100 * VALUE_SCALE,
      ]

      return randomRoom(roomIndex, roomBounds)
    })
  }

  protected pickStartLayout(): StartLayoutName {
    return randomStartLayout()
  }

  get finish(): Rectangle { return this._finish }

  get bounds(): Rectangle { return this._bounds }

  buildObstacles(): Array<Obstacle> {

    const result: Array<Obstacle> = []
    for (const [_roomIndex, room] of this.rooms.entries()) {
      result.push(...room.buildObstacles())
    }

    // result.push(new Obstacle(
    //   [50 * VALUE_SCALE, 100 * VALUE_SCALE],
    //   SHAPE_PATHS.roundrect,
    //   Lut.create('obstacle-lut', 'roundrect') as ObstacleLut)
    // )

    return result
  }

  // buildGasBoxes(): Array<GasBox> {
  //   const result: Array<GasBox> = []
  //   // place gas box in last room
  //   const [rx, ry, rw, rh] = this.rooms.at(-1)!.bounds
  //   result.push(new GasBox([rx + rw / 2, ry + rh / 4]))
  //   return result
  // }
}

function randomRoom(roomIndex: number, bounds: Rectangle) {
  if (roomIndex === 0) {
    return Room.create('start-room', bounds)
  }

  if (roomIndex === (ROOM_COUNT - 1)) {
    return Room.create('finish-room', bounds)
  }

  // return Room.create('basic-room',bounds)

  // return Room.create('pong-room', bounds)

  const i = Perturbations.nextInt() >>> 0
  const roomName = randomRoomNames[i % randomRoomNames.length]

  // // prevent multiple breakout rooms
  // if (roomName === 'breakout-room') {
  //   roomName = 'basic-room'
  // }
  return Room.create(roomName, bounds)
}

const randomRoomNames: Array<RoomName> = [
  'gear-room',
  'fast-gear-room',
  'ferris-wheel-room',
  'ferris-wheel-room',

  // 'basic-room',
  'basic-room',
  'basic-room',
  // 'breakout-room',
  // //  'pong-room',
]
