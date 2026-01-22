/**
 * @file breakout.ts
 *
 * Room layout with a block of obstacles.
 */

import type { Vec2 } from 'util/math-util'
import { RoomLayout } from '../room-layout'
import { BOBRICK_HEIGHT, BOBRICK_PADDING, BOBRICK_WIDTH, VALUE_SCALE } from 'simulation/constants'

export class Breakout extends RoomLayout {
  static {
    RoomLayout.register('breakout', () => new Breakout())
  }

  computePositions(): Array<[number, Vec2]> {
    const dx = BOBRICK_WIDTH + BOBRICK_PADDING
    const dy = BOBRICK_HEIGHT + BOBRICK_PADDING

    const nCols = 5
    const nRows = 6

    const x0 = Math.floor(
      50 * VALUE_SCALE
      - (nCols * BOBRICK_WIDTH + (nCols - 1) * BOBRICK_PADDING) / 2
      + BOBRICK_WIDTH / 2,
    )

    const y0 = Math.floor(
      50 * VALUE_SCALE
      - (nRows * BOBRICK_HEIGHT + (nRows - 1) * BOBRICK_PADDING) / 2
      + BOBRICK_HEIGHT / 2,
    )

    const _obstacles: Array<[number, Vec2]> = []
    for (let row = 0; row < nRows; row++) {
      for (let col = 0; col < nCols; col++) {
        _obstacles.push([0, [x0 + col * dx, y0 + row * dy]])
      }
    }
    return _obstacles
  }
}
