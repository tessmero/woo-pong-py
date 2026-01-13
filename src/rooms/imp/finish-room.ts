/**
 * @file finish-room.ts
 *
 * Last/bottom room with finish line.
 */

import { Room } from 'rooms/room'
import type { Obstacle } from 'simulation/obstacle'

export class FinishRoom extends Room {
  static {
    Room.register('finish-room', () => new FinishRoom())
  }

  buildObstacles(): Array<Obstacle> {
    return [...this.wedges()]
  }
}
