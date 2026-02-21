/**
 * @file spin.ts
 *
 * Ralls start in spinning layout.
 */

import { pio2, twopi, type Vec2 } from 'util/math-util'
import { StartLayout } from '../start-layout'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'

const releaseSpeed = 5

export class Spin extends StartLayout {
  static {
    StartLayout.register('spin', () => new Spin())
  }

  _computePosVels(): Array<[Vec2, Vec2]> {
    const center = [50 * VALUE_SCALE, 50 * VALUE_SCALE]
    const ringRadius = 20 * VALUE_SCALE

    const result: Array<[Vec2, Vec2]> = []
    for (let i = 0; i < DISK_COUNT; i++) {
      const angle = twopi * i / DISK_COUNT
      result.push([
        [
          Math.round(center[0] + ringRadius * Math.cos(angle)),
          Math.round(center[1] + ringRadius * Math.sin(angle)),
        ],
        [
          Math.round(releaseSpeed * Math.cos(angle - pio2)),
          Math.round(releaseSpeed * Math.sin(angle - pio2)),
        ],
      ])
    }
    return result
  }
}
