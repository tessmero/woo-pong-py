/**
 * @file start-room.ts
 *
 * First/top room where balls spawn.
 */

import { Room } from 'rooms/room'
import type { Obstacle } from 'simulation/obstacle'

export class StartRoom extends Room {
  static {
    Room.register('start-room', () => new StartRoom())
  }

  buildObstacles(): Array<Obstacle> {
    return [...this.wedges()]
  }
}
