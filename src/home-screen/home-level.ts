/**
 * @file home-level.ts
 *
 * Special level with only one room and no obstacles.
 */

import type { StartLayoutName } from 'imp-names'
import { Level } from 'level'
import type { Obstacle } from 'simulation/obstacle'
import type { Perturbations } from 'simulation/perturbations'

export class HomeLevel extends Level {
  constructor(perturbations: Perturbations) {
    super(perturbations, 1) // one room
  }

  protected override pickStartLayout(): StartLayoutName {
    return 'pool'
  }

  override buildObstacles(): Array<Obstacle> {
    return HomeLevel.homeObstacles
  }

  public static homeObstacles: Array<Obstacle> = []
}
