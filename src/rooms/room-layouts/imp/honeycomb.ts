/**
 * @file honeycomb.ts
 *
 * Room layout with seven obstacles.
 */

import type { Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'

const rows = [
  {
    count: 2,
    offset: 0.5,
  },
  {
    count: 3,
    offset: 0,
  },
  {
    count: 2,
    offset: 0.5,
  },
]

export class Honeycomb extends RoomLayout {
  static {
    RoomLayout.register('honeycomb', () => new Honeycomb())
  }

  computePositions(): Array<[number, Vec2]> {
    const dx = 20 * VALUE_SCALE
    const dy = 20 * VALUE_SCALE
    const diskRadius = DISK_RADIUS
    const padding = Math.floor(DISK_RADIUS * 0.1)

    // compute disk positions on canvas
    const positions: Array<[number, Vec2]> = []
    let rowIndex = 0
    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        positions.push([0, [
          padding + diskRadius + (row.offset + i) * dx,
          padding + diskRadius + rowIndex * dy,
        ]])
      }
      rowIndex++
    }

    const centerIndex = 3
    const rawCenter = positions[centerIndex][1]
    const targetCenter: Vec2 = [50 * VALUE_SCALE, 50 * VALUE_SCALE]
    const x0 = targetCenter[0] - rawCenter[0]
    const y0 = targetCenter[1] - rawCenter[1]
    for (const pos of positions) {
      pos[1][0] += x0
      pos[1][1] += y0
    }

    return positions
  }
}
