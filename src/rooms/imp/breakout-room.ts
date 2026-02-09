/**
 * @file breakout-room.ts
 *
 * Room where numbered bricks disappear after disks collide with them.
 * The total score always ends up at exactly 100.
 */

import { playSound, simAudibleRect } from 'audio/collision-sounds'
import { solveBreakout } from 'breakout-solver'
import { Room } from 'rooms/room'
import { ROOM_LAYOUT_POSITIONS } from 'rooms/room-layouts/set-by-build'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { type ShapeName } from 'simulation/shapes'
import { rectContainsPoint } from 'util/math-util'

export class BreakoutRoom extends Room {
  static {
    Room.register('breakout-room', () => new BreakoutRoom())
  }

  static solve(branchSequences: Array<Array<number>>): Array<number> {
    return solveBreakout(branchSequences)
  }

  public score = 0
  public hitSequence: Array<number> = []

  obstacleHit(obstacle: Obstacle, stepIndex: number): void {
    const brickIndex = this.breakoutBricks.indexOf(obstacle)
    if (brickIndex === -1) {
      return // is flipper
      // throw new Error('could not find brick index')
    }

    // console.log(`hide brick with index ${brickIndex} at step ${stepIndex}`)
    obstacle.hideOnStep = stepIndex // brick disappears when hit

    // play sound if on-screen
    if (rectContainsPoint(simAudibleRect, ...obstacle.pos)) {
      playSound('drop_004.ogg', 0.04, obstacle.pos[0])
    }

    if (this.hitSequence.includes(brickIndex)) {
      throw new Error('brick has already been hit')
    }
    this.hitSequence.push(brickIndex)

    const brickValue = Number(obstacle.label)
    this.score += brickValue
  }

  public breakoutBricks: Array<Obstacle> = []

  buildObstacles(): Array<Obstacle> {
    const _obstacles = ROOM_LAYOUT_POSITIONS['breakout']
    const shapeName: ShapeName = 'breakoutbrick'
    this.breakoutBricks = _obstacles.map(([_group, pos]) => new Obstacle(
      [pos[0], pos[1] + this.bounds[1]],
      shapeName,
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
    return [...this.wedges(), ...this.breakoutBricks]
  }
}
