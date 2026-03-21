/**
 * @file home-level.ts
 *
 * Special level with only one room and no obstacles.
 */

import type { StartLayoutName } from 'imp-names'
import { Level } from 'level'
import type { Obstacle } from 'simulation/obstacle'

export class HomeLevel extends Level {
  constructor() {
    super(1) // one room
  }

  protected override pickStartLayout(): StartLayoutName {
    return 'pool'
  }

  override buildObstacles(): Array<Obstacle> {
    return [] // no obstacles
  }
}
