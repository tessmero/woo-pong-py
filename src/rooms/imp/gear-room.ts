/**
 * @file gear-room.ts
 *
 * Room with spinning gear obstacle.
 */

import { Room } from 'rooms/room'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import type { GearLut } from 'simulation/luts/imp/gear-lut'
import { N_GEAR_FRAMES, N_GEAR_TEETH } from 'simulation/luts/imp/gear-lut'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { type Vec2 } from 'util/math-util'

export class GearRoom extends Room {
  private center: Vec2 = [0, 0]
  private teeth: Array<Obstacle> = []

  private readonly circleLut = Lut.create('obstacle-lut', 'circle') as ObstacleLut
  private readonly gearLut = Lut.create('gear-lut') as GearLut

  private frameIndex = 0
  step() {
    this.frameIndex = (this.frameIndex + 1) % N_GEAR_FRAMES
    const toothDelta = N_GEAR_FRAMES / N_GEAR_TEETH
    for (let toothIndex = 0; toothIndex < N_GEAR_TEETH; toothIndex++) {
      const tooth = this.teeth[toothIndex]

      const i = (this.frameIndex + toothDelta * toothIndex) % N_GEAR_FRAMES
      const offset = this.gearLut.tree[i] as Vec2

      tooth.pos[0] = this.center[0] + offset[0]
      tooth.collisionRect[0]
        = tooth.pos[0] - this.circleLut.maxOffsetX

      tooth.pos[1] = this.center[1] + offset[1]
      tooth.collisionRect[1]
        = tooth.pos[1] - this.circleLut.maxOffsetY
    }
  }

  buildObstacles(): Array<Obstacle> {
    this.center = [50 * VALUE_SCALE, this.bounds[1] + 50 * VALUE_SCALE]

    const holderOffset = 10 * DISK_RADIUS
    const holderLut = Lut.create('obstacle-lut', 'holder') as ObstacleLut

    const leftHolderPos: Vec2 = [
      this.center[0] - holderOffset,
      this.center[1],
    ]
    const leftHolder = new Obstacle(leftHolderPos, 'holder', holderLut)


    const rightHolderPos: Vec2 = [
      this.center[0] + holderOffset,
      this.center[1],
    ]
    const rightHolder = new Obstacle(rightHolderPos, 'holder', holderLut)
    rightHolder.isFlippedX = true

    // center circle
    const bigCircleLut = Lut.create('obstacle-lut', 'big-circle') as ObstacleLut
    const centerObs = new Obstacle(this.center, 'big-circle', bigCircleLut, this)

    // teeth
    let offset: Vec2 = [2 * DISK_RADIUS, DISK_RADIUS]
    this.teeth = Array.from(
      { length: N_GEAR_TEETH },
      (_, _toothIndex) => {
        const toothPos: Vec2 = [
          this.center[0] + offset[0],
          this.center[1] + offset[1],
        ]
        const tooth = new Obstacle(toothPos, 'circle', this.circleLut, this)
        offset = rotate90(offset)
        return tooth
      },
    )

    return [
      leftHolder,
      rightHolder,
      centerObs,
      ...this.teeth,
      ...this.wedges(),
    ]
  }

  static {
    Room.register('gear-room', () => new GearRoom())
  }
}

function rotate90(pos: Vec2): Vec2 {
  return [
    -pos[1],
    pos[0],
  ]
}
