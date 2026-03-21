/**
 * @file home-level.ts
 *
 * Special level with only one room and no obstacles.
 */

import { Level } from 'level'
import { Obstacle } from 'simulation/obstacle'

export class HomeLevel extends Level {
  constructor() {
    super(1) // one room
  }

  override buildObstacles(): Array<Obstacle> {
    return [] // no obstacles
  }
}
