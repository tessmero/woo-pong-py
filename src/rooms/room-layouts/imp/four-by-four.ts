/**
 * @file four-by-four.ts
 *
 * Room layout with 16 obstacles.
 */

import type { Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'
import { VALUE_SCALE } from 'simulation/constants'

export class FourByFour extends RoomLayout {
  static {
    RoomLayout.register('four-by-four', () => new FourByFour())
  }

  computePositions(): Array<[number, Vec2]> {
    const dx = 230000;
    const dy = 190000;
    const x0 = 150000;
    const y0 = 140000;
    const positions: Array<[number, Vec2]> = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        positions.push([0, [x0 + col * dx, y0 + row * dy]]);
      }
    }
    return positions;
  }
}
