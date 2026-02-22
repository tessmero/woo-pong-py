/**
 * @file spin.ts
 *
 * Ralls start in spinning layout.
 */

import { pio2, twopi, type Vec2 } from 'util/math-util'
import { StartLayout } from '../start-layout'
import { DISK_COUNT, VALUE_SCALE } from 'simulation/constants'


const center = [50 * VALUE_SCALE, 50 * VALUE_SCALE]
const ringRadius = 20 * VALUE_SCALE
const finalAngularSpeed = 1e-2 // radians per step
const releaseSpeed = -ringRadius * finalAngularSpeed

export class Spin extends StartLayout {
  static {
    StartLayout.register('spin', () => new Spin())
  }

  override getAnimPos(diskIndex: number, stepIndex: number, out: Vec2): void {
    const angle = twopi * diskIndex / DISK_COUNT + stepIndex * finalAngularSpeed
    out[0] = Math.round(center[0] + ringRadius * Math.cos(angle))
    out[1] = Math.round(center[1] + ringRadius * Math.sin(angle))
  }

  _computePosVels(): Array<[Vec2, Vec2]> {
    const finalPosVels: Array<[Vec2, Vec2]> = []
    for (let i = 0; i < DISK_COUNT; i++) {
      const angle = twopi * i / DISK_COUNT
      finalPosVels.push([
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
    return finalPosVels
  }
}
