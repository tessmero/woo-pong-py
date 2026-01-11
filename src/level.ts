/**
 * @file level.ts
 *
 * Construct level composed of rooms using prng.
 */

import { ROOM } from 'imp-names'
import { Room } from 'rooms/room'
import { VALUE_SCALE } from 'simulation/constants'
import type { Obstacle } from 'simulation/obstacle'
import { Perturbations } from 'simulation/perturbations'
import type { Rectangle } from 'util/math-util'

const nRooms = 4
const roomPadding = 10 // space between 100x100 rooms
const startPadding = 10
const endPadding = 10

const totalHeight = startPadding
  + 100 * nRooms
  + roomPadding * (nRooms - 1)
  + endPadding

const finishThickness = 10
const _finish: Rectangle = [
  0, totalHeight - finishThickness,
  100, finishThickness,
]

const thick = 1 // thickness of walls

const _bounds: Rectangle = ([
  thick, thick,
  100 - 2 * thick,
  totalHeight - 2 * thick,
]).map(v => v * VALUE_SCALE) as Rectangle

export class Level {
  public readonly rooms: Array<Room>
  constructor() {
    this.rooms = Array.from({ length: nRooms }, (_,roomIndex) => {
      
      const roomOffset = VALUE_SCALE * (
        startPadding
        + (100 + roomPadding) * roomIndex
      )
      const roomBounds: Rectangle = [
        0, roomOffset, 100 * VALUE_SCALE, 100 * VALUE_SCALE
      ]
      return randomRoom(roomBounds)
    })
  }

  get finish(): Rectangle { return _finish }

  get bounds(): Rectangle { return _bounds }

  get roomBounds(): Array<Rectangle> {
    const result: Array<Rectangle> = []
    for (const [roomIndex, room] of this.rooms.entries()) {
      const roomOffset = VALUE_SCALE * (
        startPadding
        + (100 + roomPadding) * roomIndex
      )
      result.push([
        0, roomOffset,
        100 * VALUE_SCALE, 100 * VALUE_SCALE,
      ])
    }
    return result
  }

  buildObstacles(): Array<Obstacle> {
    const result: Array<Obstacle> = []
    for (const [_roomIndex, room] of this.rooms.entries()) {
      result.push(...room.buildObstacles())
    }
    return result
  }
}

function randomRoom(bounds: Rectangle) {
  const i = Perturbations.nextInt() >>> 0
  const roomName = ROOM.NAMES[i % ROOM.NAMES.length]
  return Room.create(roomName, bounds)
}
