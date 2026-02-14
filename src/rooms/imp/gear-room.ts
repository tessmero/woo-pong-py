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
import type { GfxRegionName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
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

    const gearObs = [
      centerObs,
      ...this.teeth,
    ]

    for (const obs of gearObs) {
      obs.isVisible = false
    }

    return [

      // leftHolder,
      // rightHolder,
      ...gearObs,
      ...this.wedges(),
    ]
  }

  private _gearPath: Path2D | null = null
  private _baseTheta = 0

  private _buildGearPath(): Path2D {
    const N = N_GEAR_TEETH
    const toothDelta = N_GEAR_FRAMES / N
    const path = new Path2D()

    // build at frameIndex=0, centered at origin
    const offset0: Vec2 = [this.gearLut.getInt32(0, 0), this.gearLut.getInt32(0, 1)]
    this._baseTheta = Math.atan2(offset0[1], offset0[0])

    for (let i = 0; i < N; i++) {
      const lutIndex = (toothDelta * i) % N_GEAR_FRAMES
      const offset: Vec2 = [this.gearLut.getInt32(lutIndex, 0), this.gearLut.getInt32(lutIndex, 1)]
      const theta = Math.atan2(offset[1], offset[0])

      const nextLutIndex = (toothDelta * ((i + 1) % N)) % N_GEAR_FRAMES
      const nextOffset: Vec2 = [this.gearLut.getInt32(nextLutIndex, 0), this.gearLut.getInt32(nextLutIndex, 1)]
      const thetaNext = Math.atan2(nextOffset[1], nextOffset[0])

      const tx = GEAR_ORBIT_RADIUS * Math.cos(theta)
      const ty = GEAR_ORBIT_RADIUS * Math.sin(theta)

      path.arc(tx, ty, TOOTH_RADIUS, theta + Math.PI + GEAR_BETA, theta + Math.PI - GEAR_BETA, false)
      path.arc(0, 0, BIG_CIRCLE_RADIUS, theta + GEAR_ALPHA, thetaNext - GEAR_ALPHA, false)
    }
    path.closePath()
    return path
  }

  override drawDecorations(ctx: CanvasRenderingContext2D, _pw: PinballWizard, gfxName: GfxRegionName): void {
    if (!this._gearPath) {
      this._gearPath = this._buildGearPath()
    }

    const [cx, cy] = this.center

    // derive rotation from tooth 0's current position
    const tooth0 = this.teeth[0]
    const currentTheta = Math.atan2(tooth0.pos[1] - cy, tooth0.pos[0] - cx)
    const rotation = currentTheta - this._baseTheta

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)

    if (gfxName === 'sim-gfx') {
      ctx.lineWidth = 0.1 * DISK_RADIUS
    }
    else {
      ctx.lineWidth = 1 * DISK_RADIUS
    }

    ctx.fillStyle = OBSTACLE_FILL
    ctx.fill(this._gearPath)
    ctx.strokeStyle = OBSTACLE_STROKE
    ctx.stroke(this._gearPath)
    ctx.restore()
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
