/**
 * @file three-by-three.ts
 *
 * Room layout with 9 obstacles in a 3x3 grid, centered at [50 * VALUE_SCALE, 42 * VALUE_SCALE].
 */

import type { Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'
import { VALUE_SCALE } from 'simulation/constants'

export class ThreeByThree extends RoomLayout {
  static {
    RoomLayout.register('three-by-three', () => new ThreeByThree())
  }

  computePositions(): Array<[number, Vec2]> {
    const dx = 270000
    const dy = 220000
    const x0 = 150000
    const y0 = 140000
    const positions: Array<[number, Vec2]> = []
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push([0, [x0 + col * dx, y0 + row * dy]])
      }
    }
    // Center the grid at [50 * VALUE_SCALE, 42 * VALUE_SCALE]
    const centerIndex = 4
    const rawCenter = positions[centerIndex][1]
    const targetCenter: Vec2 = [50 * VALUE_SCALE, 42 * VALUE_SCALE]
    const xShift = targetCenter[0] - rawCenter[0]
    const yShift = targetCenter[1] - rawCenter[1]
    for (const pos of positions) {
      pos[1][0] += xShift
      pos[1][1] += yShift
    }
    return positions
  }
}
