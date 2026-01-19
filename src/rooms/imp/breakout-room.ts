/**
 * @file breakout-room.ts
 *
 * Room where numbered bricks disappear after disks collide with them.
 * The total score always ends up at exactly 100.
 */

import { solveBreakout } from 'breakout-solver'
import { Room } from 'rooms/room'
import { Scrollbar } from 'scrollbar'
import { BOBRICK_HEIGHT, BOBRICK_PADDING, BOBRICK_WIDTH, VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { type ShapeName } from 'simulation/shapes'
import type { Vec2 } from 'util/math-util'

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

const _obstacles: Array<[Vec2, ShapeName]> = []
for (let row = 0; row < nRows; row++) {
  for (let col = 0; col < nCols; col++) {
    _obstacles.push([[x0 + col * dx, y0 + row * dy] as Vec2, 'breakoutbrick'])
  }
}

export class BreakoutRoom extends Room {
  static {
    Room.register('breakout-room', () => new BreakoutRoom())
  }

  static solve(branchSequences: Array<Array<number>>): Array<number> {
    return solveBreakout(branchSequences)
  }

  public score = 0
  public hitSequence: Array<number> = []

  obstacleHit(obstacle: Obstacle): void {
    const brickIndex = this.breakoutBricks.indexOf(obstacle)
    if (brickIndex === -1) {
      return // is wedge
      // throw new Error('could not find brick index')
    }

    obstacle.isHidden = true // brick disappears when hit
    Scrollbar.isRepaintQueued = true // update mini view of obstacles in scrollbar

    if (this.hitSequence.includes(brickIndex)) {
      throw new Error('brick has already been hit')
    }
    this.hitSequence.push(brickIndex)

    const brickValue = Number(obstacle.label)
    this.score += brickValue
  }

  public breakoutBricks: Array<Obstacle> = []

  buildObstacles(): Array<Obstacle> {
    this.breakoutBricks = _obstacles.map(([pos, shapeName]) => new Obstacle(
      [pos[0], pos[1] + this.bounds[1]],
      shapeName,
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
    return [...this.wedges(), ...this.breakoutBricks]
  }
}
