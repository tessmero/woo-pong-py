/**
 * @file sorter-room.ts
 *
 * Room where disks pass through numbered regions.
 */

import { Room } from 'rooms/room'
import type { Obstacle } from 'simulation/obstacle'

export class SorterRoom extends Room {
  static {
    Room.register('sorter-room', () => new SorterRoom())
  }

  buildObstacles(): Array<Obstacle> {
    return []
  }
}
