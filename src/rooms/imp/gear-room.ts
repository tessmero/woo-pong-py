/**
 * @file gear-room.ts
 *
 * Room with spinning gear obstacle.
 */

import { Room } from 'rooms/room'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import type { GearLut } from 'simulation/luts/imp/gear-lut'
import {
  N_GEAR_FRAMES, N_GEAR_TEETH, GEAR_ORBIT_RADIUS,
  BIG_CIRCLE_RADIUS, TOOTH_RADIUS, GEAR_ALPHA, GEAR_BETA,
} from 'simulation/gear-constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { type Vec2 } from 'util/math-util'
import { OBSTACLE_FILL, OBSTACLE_STROKE } from 'gfx/graphics'

export class GearRoom extends Room {
  private center: Vec2 = [0, 0]
  private teeth: Array<Obstacle> = []

  private readonly circleLut = Lut.create('obstacle-lut', 'circle') as ObstacleLut
  private readonly gearLut = Lut.create('gear-lut') as GearLut

  private frameIndex = 0
  override step() {
    this.frameIndex = (this.frameIndex + 1) % N_GEAR_FRAMES
    const toothDelta = N_GEAR_FRAMES / N_GEAR_TEETH
    for (let toothIndex = 0; toothIndex < N_GEAR_TEETH; toothIndex++) {
      const tooth = this.teeth[toothIndex]

      const i = (this.frameIndex + toothDelta * toothIndex) % N_GEAR_FRAMES
      const offset: Vec2 = [this.gearLut.getInt32(i, 0), this.gearLut.getInt32(i, 1)]

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

    const holderLut = Lut.create('obstacle-lut', 'holder') as ObstacleLut

    const dummy = new Obstacle([0, 0], 'holder', holderLut)
    const holderOffset = -dummy.offsetToCenterPoints[0] * VALUE_SCALE
    console.log('holderOffset', holderOffset)
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
      //...this.wedges(),
    ]
  }

  override drawDecorations(ctx: CanvasRenderingContext2D): void {
    return

    const [cx, cy] = this.center
    const N = N_GEAR_TEETH
    const toothDelta = N_GEAR_FRAMES / N

    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      // tooth angle for this frame
      const lutIndex = (this.frameIndex + toothDelta * i) % N_GEAR_FRAMES
      const offset: Vec2 = [this.gearLut.getInt32(lutIndex, 0), this.gearLut.getInt32(lutIndex, 1)]
      const theta = Math.atan2(offset[1], offset[0])

      const nextLutIndex = (this.frameIndex + toothDelta * ((i + 1) % N)) % N_GEAR_FRAMES
      const nextOffset: Vec2 = [this.gearLut.getInt32(nextLutIndex, 0), this.gearLut.getInt32(nextLutIndex, 1)]
      const thetaNext = Math.atan2(nextOffset[1], nextOffset[0])

      const tx = cx + GEAR_ORBIT_RADIUS * Math.cos(theta)
      const ty = cy + GEAR_ORBIT_RADIUS * Math.sin(theta)

      // outer arc on tooth (the large sweep around the outside)
      ctx.arc(tx, ty + this.bounds[1], TOOTH_RADIUS, theta + Math.PI + GEAR_BETA, theta + Math.PI - GEAR_BETA, true)

      // concave bridge arc on center circle between this tooth and the next
      ctx.arc(cx, cy + this.bounds[1], BIG_CIRCLE_RADIUS, theta + GEAR_ALPHA, thetaNext - GEAR_ALPHA, false)
    }
    ctx.closePath()

    ctx.strokeStyle = 'red'
    ctx.stroke()

   ctx.fillStyle = 'red'
   ctx.fillRect( 
    50 * VALUE_SCALE, 
    50 * VALUE_SCALE + this.bounds[1], 
    DISK_RADIUS, DISK_RADIUS 
  )
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
