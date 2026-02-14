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
  BIG_CIRCLE_RADIUS, TOOTH_RADIUS,
  GEAR_FILLET_RADIUS, GEAR_HOLE_RADIUS,
} from 'simulation/gear-constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { GfxRegionName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { type Vec2 } from 'util/math-util'
import { OBSTACLE_FILL, OBSTACLE_STROKE } from 'gfx/graphics'
import { ROOM_LAYOUT_POSITIONS } from 'rooms/room-layouts/set-by-build'
import { Perturbations } from 'simulation/perturbations'
import { N_TWO_GEAR_LAYOUTS } from 'rooms/room-layouts/imp/two-gears'

type DisplayMode = 'circles' | 'fidget-spinner'
const displayMode: DisplayMode = 'fidget-spinner'
// const displayMode: DisplayMode = 'circles'

type Direction = 'clockwise' | 'counter-clockwise'

type Gear = {
  dir: Direction
  frameIndex: number
  center: Obstacle
  teeth: Array<Obstacle>
  obstacles: Array<Obstacle> // center and teeth
}

export class GearRoom extends Room {
  static {
    Room.register('gear-room', () => new GearRoom())
  }

  private gears: Array<Gear> = []
  private roomCenter: Vec2 = [0, 0]

  private readonly circleLut = Lut.create('obstacle-lut', 'circle') as ObstacleLut
  private readonly gearLut = Lut.create('gear-lut') as GearLut

  override step() {
    for (const gear of this.gears) {
      if (gear.dir === 'clockwise') {
        gear.frameIndex = (gear.frameIndex + 1) % N_GEAR_FRAMES
      }
      else {
        gear.frameIndex = (gear.frameIndex - 1 + N_GEAR_FRAMES) % N_GEAR_FRAMES
      }
      const centerPos = gear.center.pos
      const toothDelta = N_GEAR_FRAMES / N_GEAR_TEETH
      for (let toothIndex = 0; toothIndex < N_GEAR_TEETH; toothIndex++) {
        const i = (gear.frameIndex + toothDelta * toothIndex) % N_GEAR_FRAMES
        const offset: Vec2 = [this.gearLut.getInt32(i, 0), this.gearLut.getInt32(i, 1)]

        const cx = centerPos[0] + offset[0]
        const rx = cx - this.circleLut.maxOffsetX

        const cy = centerPos[1] + offset[1]
        const ry = cy - this.circleLut.maxOffsetY
        const tooth = gear.teeth[toothIndex]
        if (!Number.isInteger(cx)) throw new Error('cx must be an integer')
        if (!Number.isInteger(cy)) throw new Error('cy must be an integer')
        if (!Number.isInteger(rx)) throw new Error('rx must be an integer')
        if (!Number.isInteger(ry)) throw new Error('ry must be an integer')
        tooth.pos[0] = cx
        tooth.collisionRect[0] = rx

        tooth.pos[1] = cy
        tooth.collisionRect[1] = ry
      }
    }
  }

  buildObstacles(): Array<Obstacle> {
    this.roomCenter = [50 * VALUE_SCALE, this.bounds[1] + 50 * VALUE_SCALE]

    // const holderLut = Lut.create('obstacle-lut', 'holder') as ObstacleLut

    // // const dummy = new Obstacle([0, 0], 'holder', holderLut)
    // const holderOffset = DISK_RADIUS * 11
    // console.log('holderOffset', holderOffset)
    // const leftHolderPos: Vec2 = [
    //   this.roomCenter[0] - holderOffset,
    //   this.roomCenter[1],
    // ]
    // const leftHolder = new Obstacle(leftHolderPos, 'holder', holderLut)

    // const rightHolderPos: Vec2 = [
    //   this.roomCenter[0] + holderOffset,
    //   this.roomCenter[1],
    // ]
    // const rightHolder = new Obstacle(rightHolderPos, 'holder', holderLut)
    // rightHolder.isFlippedX = true

    // build spinning gears
    const layout = ROOM_LAYOUT_POSITIONS['two-gears'] as Array<[number, Vec2]>

    const i = (Perturbations.nextInt() >>> 0) % N_TWO_GEAR_LAYOUTS
    const [leftFrame, leftPos] = layout[2 * i + 0]
    const [middleFrame, middlePos] = layout[2 * i + 1]

    const posInRoom = ([x, y]) => [x, this.bounds[1] + y] as Vec2

    this.gears.push(this._buildGear(posInRoom(leftPos), 'counter-clockwise', leftFrame))
    this.gears.push(this._buildGear(posInRoom(middlePos), 'clockwise', middleFrame))
    // this.gears.push(this._buildGear(rightPos, 'counter-clockwise', rightFrame))

    return [

      // leftHolder,
      // rightHolder,
      ...this.gears.flatMap(g => g.obstacles),
      ...this.wedges(),
    ]
  }

  private _buildGear(pos: Vec2, dir: Direction, frameIndex: number): Gear {
    // center circle
    const bigCircleLut = Lut.create('obstacle-lut', 'big-circle') as ObstacleLut
    const centerObs = new Obstacle(pos, 'big-circle', bigCircleLut, this)

    // teeth
    const offset: Vec2 = [2 * DISK_RADIUS, DISK_RADIUS]
    const teeth = Array.from(
      { length: N_GEAR_TEETH },
      (_, _toothIndex) => {
        const toothPos: Vec2 = [
          pos[0] + offset[0],
          pos[1] + offset[1],
        ]
        const tooth = new Obstacle(toothPos, 'circle', this.circleLut, this)
        // offset = rotate90(offset)
        return tooth
      },
    )

    // set common properties for center and teeth
    const obstacles = [centerObs, ...teeth]
    for (const obs of obstacles) {
      if (displayMode === 'fidget-spinner') {
        obs.isVisible = false // skip normal obstacle drawing, will draw in drawDecorations
      }
    }

    const gear: Gear = {
      dir,
      frameIndex,
      center: centerObs,
      teeth,
      obstacles,
    }

    return gear
  }

  private _gearPath: Path2D | null = null
  private _baseTheta = 0

  private _buildGearPath(): Path2D {
    const N = N_GEAR_TEETH
    const toothDelta = N_GEAR_FRAMES / N
    const path = new Path2D()
    const rFillet = GEAR_FILLET_RADIUS

    // build at frameIndex=0, centered at origin
    const offset0: Vec2 = [this.gearLut.getInt32(0, 0), this.gearLut.getInt32(0, 1)]
    this._baseTheta = Math.atan2(offset0[1], offset0[0])

    // Fillet centers lie at the intersection of two circles:
    //   - radius (BIG_CIRCLE_RADIUS + rFillet) from the origin
    //   - radius (TOOTH_RADIUS + rFillet) from the tooth center
    // Precompute the along-tooth-axis (fDist) and perpendicular (fPerp) offsets.
    const d = GEAR_ORBIT_RADIUS
    const R1 = BIG_CIRCLE_RADIUS + rFillet
    const R2 = TOOTH_RADIUS + rFillet
    const fDist = (R1 * R1 - R2 * R2 + d * d) / (2 * d)
    const fPerp = Math.sqrt(R1 * R1 - fDist * fDist)

    for (let i = 0; i < N; i++) {
      const lutIndex = (toothDelta * i) % N_GEAR_FRAMES
      const offset: Vec2 = [this.gearLut.getInt32(lutIndex, 0), this.gearLut.getInt32(lutIndex, 1)]
      const theta = Math.atan2(offset[1], offset[0])

      const nextLutIndex = (toothDelta * ((i + 1) % N)) % N_GEAR_FRAMES
      const nextOffset: Vec2 = [this.gearLut.getInt32(nextLutIndex, 0), this.gearLut.getInt32(nextLutIndex, 1)]
      const thetaNext = Math.atan2(nextOffset[1], nextOffset[0])

      const cosT = Math.cos(theta)
      const sinT = Math.sin(theta)
      const tx = GEAR_ORBIT_RADIUS * cosT
      const ty = GEAR_ORBIT_RADIUS * sinT

      // Fillet center A (bridge→tooth junction, before tooth arc)
      const fAx = fDist * cosT + fPerp * sinT
      const fAy = fDist * sinT - fPerp * cosT
      const fA_bridge = Math.atan2(fAy, fAx)
      const fA_tooth = Math.atan2(fAy - ty, fAx - tx)

      // Fillet center B (tooth→bridge junction, after tooth arc)
      const fBx = fDist * cosT - fPerp * sinT
      const fBy = fDist * sinT + fPerp * cosT
      const fB_tooth = Math.atan2(fBy - ty, fBx - tx)
      const fB_bridge = Math.atan2(fBy, fBx)

      // Fillet A arc: bridge tangent → tooth tangent
      path.arc(fAx, fAy, rFillet, fA_bridge + Math.PI, fA_tooth + Math.PI, true)

      // Trimmed outer tooth arc
      path.arc(tx, ty, TOOTH_RADIUS, fA_tooth, fB_tooth, false)

      // Fillet B arc: tooth tangent → bridge tangent
      path.arc(fBx, fBy, rFillet, fB_tooth + Math.PI, fB_bridge + Math.PI, true)

      // Trimmed bridge arc on big circle (to next tooth's fillet A)
      const cosN = Math.cos(thetaNext)
      const sinN = Math.sin(thetaNext)
      const fANextBridge = Math.atan2(fDist * sinN - fPerp * cosN, fDist * cosN + fPerp * sinN)
      path.arc(0, 0, BIG_CIRCLE_RADIUS, fB_bridge, fANextBridge, false)
    }
    path.closePath()

    // Cut out a center hole (drawn counter-clockwise to create a hole via even-odd / winding rule)
    if (GEAR_HOLE_RADIUS > 0) {
      path.moveTo(GEAR_HOLE_RADIUS, 0)
      path.arc(0, 0, GEAR_HOLE_RADIUS, 0, 2 * Math.PI, true)
      path.closePath()
    }

    return path
  }

  override drawDecorations(ctx: CanvasRenderingContext2D, pw: PinballWizard, gfxName: GfxRegionName): void {
    if (displayMode === 'circles') {
      return // obstacles were already drawn as circles
    }

    if (gfxName === 'sim-gfx') {
      ctx.lineWidth = 0.1 * DISK_RADIUS
    }
    else {
      ctx.lineWidth = 1 * DISK_RADIUS
    }

    for (const gear of this.gears) {
      this._drawGear(ctx, gear, pw)
    }
  }

  private _drawGear(ctx: CanvasRenderingContext2D, gear: Gear, _pw: PinballWizard) {
    if (!this._gearPath) {
      this._gearPath = this._buildGearPath()
    }

    const [cx, cy] = gear.center.pos

    // derive rotation from tooth 0's current position
    const tooth0 = gear.teeth[0]
    const currentTheta = Math.atan2(tooth0.pos[1] - cy, tooth0.pos[0] - cx)
    const rotation = currentTheta - this._baseTheta

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)

    ctx.fillStyle = OBSTACLE_FILL
    ctx.fill(this._gearPath)
    ctx.strokeStyle = OBSTACLE_STROKE
    ctx.stroke(this._gearPath)
    ctx.restore()
  }
}

function rotate90(pos: Vec2): Vec2 {
  return [
    -pos[1],
    pos[0],
  ]
}
