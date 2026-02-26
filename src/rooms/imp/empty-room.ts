/**
 * @file empty-room.ts
 *
 * Empty room.
 */

import { Room } from 'rooms/room'
import type { Obstacle } from 'simulation/obstacle'

export class EmptyRoom extends Room {
  override buildObstacles(): Array<Obstacle> {
    return [] // no obstacles
  }

  static {
    Room.register('empty-room', () => new EmptyRoom())
  }
}
