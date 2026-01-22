/**
 * @file four-by-four.ts
 *
 * Room layout with 16 obstacles.
 */

import type { Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'

export class FourByFour extends RoomLayout {
  static {
    RoomLayout.register('four-by-four', () => new FourByFour())
  }

  computePositions(): Array<Vec2> {
    const _obstacles: Array<Vec2> = []
    const dx = 23
    const dy = 19
    let x = 15
    while (x < 90) {
      let y = 14
      while (y < 85) {
        _obstacles.push([x, y] as Vec2)
        y += dy
      }
      x += dx
    }
    return _obstacles
  }
}
