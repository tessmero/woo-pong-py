/**
 * @file two-gears.ts
 *
 * Room layout with two interlocking gears.
 */

import { lerp, twopi, type Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'
import {
  BIG_CIRCLE_RADIUS, GEAR_ORBIT_RADIUS, N_GEAR_FRAMES, N_GEAR_TEETH, TOOTH_RADIUS,
} from 'simulation/gear-constants'
import { VALUE_SCALE } from 'simulation/constants'

export const N_TWO_GEAR_LAYOUTS = 10

export class TwoGears extends RoomLayout {
  static {
    RoomLayout.register('two-gears', () => new TwoGears())
  }

  computePositions(): Array<[number, Vec2]> {
    const result: Array<[number, Vec2]> = []

    for (let i = 0; i < N_TWO_GEAR_LAYOUTS; i++) {
      const roomCenter = [50 * VALUE_SCALE, 50 * VALUE_SCALE]

      // pick positions for gears
      const gearSpacing = GEAR_ORBIT_RADIUS + TOOTH_RADIUS + BIG_CIRCLE_RADIUS
      const middleYOffset = (2 * (Math.random() - 0.5)) * BIG_CIRCLE_RADIUS * 1
      const dx = Math.sqrt(gearSpacing * gearSpacing - middleYOffset * middleYOffset)
      const leftPos: Vec2 = [roomCenter[0] - dx, roomCenter[1]]
      const middlePos: Vec2 = [roomCenter[0], roomCenter[1] + middleYOffset]
      const adjustX = lerp(leftPos[0], middlePos[0]) - roomCenter[0]
      leftPos[0] -= adjustX
      middlePos[0] -= adjustX
      // const rightPos: Vec2 = [this.roomCenter[0] + dx, this.roomCenter[1]]

      // compute interlocking frame indices from gear positions
      const angleToFrame = (angle: number) =>
        ((Math.round(angle / (2 * Math.PI) * N_GEAR_FRAMES) % N_GEAR_FRAMES) + N_GEAR_FRAMES) % N_GEAR_FRAMES
      const pairToFrame = (a, b) => angleToFrame(Math.atan2(b[1] - a[1], b[0] - a[0]))

      const halfToothOffset = angleToFrame(twopi / N_GEAR_TEETH / 2)

      const leftFrame = pairToFrame(leftPos, middlePos)
      const middleFrame = pairToFrame(middlePos, leftPos) + halfToothOffset

      for (const v of ([leftPos, middlePos])) {
        for (const ax of ([0, 1])) {
          v[ax] = Math.round(v[ax])
        }
      }

      result.push(
        [leftFrame, leftPos],
        [middleFrame, middlePos],
      )
    }

    return result
  }
}
