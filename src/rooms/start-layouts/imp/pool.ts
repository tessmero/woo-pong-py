/**
 * @file pool.ts
 *
 * Room layout with 16 obstacles.
 */

import type { Vec2 } from 'util/math-util'
import { StartLayout } from '../start-layout'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'

export class Pool extends StartLayout {
  static {
    StartLayout.register('pool', () => new Pool())
  }

  override _computePosVels(): Array<[Vec2, Vec2]> {
    const riskRadius = DISK_RADIUS
    const centerPos: Vec2 = [50 * VALUE_SCALE, 50 * VALUE_SCALE]
    const rows = 4 // Pyramid with 4 rows: 1+2+3+4=10 disks
    const diskSpacing = riskRadius * 2.2 // Slightly more than diameter for separation
    const positions: Array<Vec2> = []
    let y = centerPos[1]
    for (let row = 0; row < rows; row++) {
      const numDisks = row + 1
      const rowWidth = (numDisks - 1) * diskSpacing
      const xStart = centerPos[0] - rowWidth / 2
      for (let i = 0; i < numDisks; i++) {
        positions.push([xStart + i * diskSpacing, y])
      }
      y += diskSpacing
    }
    // All disks start with zero velocity
    return positions.map(pos => [pos, [0, 0]])
  }
}
