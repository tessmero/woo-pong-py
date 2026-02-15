/**
 * @file ferris-wheel-room.ts
 *
 * Room with spinning ferris wheel obstacle.
 */

import { Room } from 'rooms/room'
import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import {
  N_FERRIS_FRAMES, N_FERRIS_CARS, FERRIS_ORBIT_RADIUS,
  FERRIS_HUB_RADIUS,
} from 'simulation/ferris-wheel-constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { GfxRegionName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { type Vec2 } from 'util/math-util'
import { OBSTACLE_FILL, OBSTACLE_STROKE } from 'gfx/graphics'
import type { ShapeName } from 'simulation/shapes'
import { Perturbations } from 'simulation/perturbations'


type Direction = 'clockwise' | 'counter-clockwise'

type Gear = {
  dir: Direction
  frameIndex: number
  center: Obstacle
  teeth: Array<Obstacle>
  obstacles: Array<Obstacle> // center and teeth
}

const possibleShapes: Array<ShapeName> = [

  'diamond',
  // 'flipper',
  'star',
  'pawn',
  'shield',
  'meeple',
  'club',
  'bishop',
  'bolt',
  'airplane',
  'head',
  'note',

]

function randomToothShape(): ShapeName {
  const n = possibleShapes.length
  const i = (Perturbations.nextInt() >>> 0) % n
  return possibleShapes[i]
}

export class FerrisWheelRoom extends Room {
  static {
    Room.register('ferris-wheel-room', () => new FerrisWheelRoom())
  }

  private gears: Array<Gear> = []
  private roomCenter: Vec2 = [0, 0]

  private toothShape = randomToothShape()
  private centerShape: ShapeName = 'circle'
  private readonly circleLut = Lut.create('obstacle-lut', this.toothShape) as ObstacleLut
  private readonly gearLut = Lut.create('gear-lut')

  override step() {
    for (const gear of this.gears) {
      if (gear.dir === 'clockwise') {
        gear.frameIndex = (gear.frameIndex + 1) % N_FERRIS_FRAMES
      }
      else {
        gear.frameIndex = (gear.frameIndex - 1 + N_FERRIS_FRAMES) % N_FERRIS_FRAMES
      }
      const centerPos = gear.center.pos
      const toothDelta = N_FERRIS_FRAMES / N_FERRIS_CARS
      for (let toothIndex = 0; toothIndex < N_FERRIS_CARS; toothIndex++) {
        const i = (gear.frameIndex + toothDelta * toothIndex) % N_FERRIS_FRAMES
        const offset: Vec2 = [this.gearLut.get(i, 'x'), this.gearLut.get(i, 'y')]

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

    const dir = Math.random() < 0.5 ? 'clockwise' : 'counter-clockwise'
    const frameIndex = 0
    this.gears.push(this._buildGear(this.roomCenter, dir, frameIndex))

    return [

      // leftHolder,
      // rightHolder,
      ...this.gears.flatMap(g => g.obstacles),
      ...this.wedges(),
    ]
  }

  private _buildGear(pos: Vec2, dir: Direction, frameIndex: number): Gear {
    // center circle
    const bigCircleLut = Lut.create('obstacle-lut', this.centerShape) as ObstacleLut
    const centerObs = new Obstacle(pos, this.centerShape, bigCircleLut, this)

    // teeth
    const offset: Vec2 = [2 * DISK_RADIUS, DISK_RADIUS]
    const teeth = Array.from(
      { length: N_FERRIS_CARS },
      (_, _toothIndex) => {
        const toothPos: Vec2 = [
          pos[0] + offset[0],
          pos[1] + offset[1],
        ]
        const tooth = new Obstacle(toothPos, this.toothShape, this.circleLut, this)
        // offset = rotate90(offset)
        return tooth
      },
    )

    // // set common properties for center and teeth
    const obstacles = [centerObs, ...teeth]
    // for (const obs of obstacles) {
    //   if (displayMode === 'fidget-spinner') {
    //     obs.isVisible = false // skip normal obstacle drawing, will draw in drawDecorations
    //   }
    // }

    const gear: Gear = {
      dir,
      frameIndex,
      center: centerObs,
      teeth,
      obstacles,
    }

    return gear
  }

  private _spokesPath: Path2D | null = null
  private _baseTheta = 0

  private _buildSpokesPath(): Path2D {
    const N = N_FERRIS_CARS
    const toothDelta = N_FERRIS_FRAMES / N
    const path = new Path2D()

    // build at frameIndex=0, centered at origin
    const offset0: Vec2 = [this.gearLut.get(0, 'x'), this.gearLut.get(0, 'y')]
    this._baseTheta = Math.atan2(offset0[1], offset0[0])

    // Each spoke is a triangle tapering from a wide base on the big circle
    // to a sharp point at the tooth center. Fraction of the inter-tooth angle
    // spanned by the spoke base.
    const spokeWidthFraction = 0.4
    const angleBetweenTeeth = (2 * Math.PI) / N
    const spokeHalfAngle = (angleBetweenTeeth * spokeWidthFraction) / 2

    // Collect tooth angles from the LUT
    const thetas: Array<number> = []
    for (let i = 0; i < N; i++) {
      const lutIndex = (toothDelta * i) % N_FERRIS_FRAMES
      const offset: Vec2 = [this.gearLut.get(lutIndex, 'x'), this.gearLut.get(lutIndex, 'y')]
      thetas.push(Math.atan2(offset[1], offset[0]))
    }

    // --- Outer contour: pointed spokes connected by big-circle arcs ---
    for (let i = 0; i < N; i++) {
      const theta = thetas[i]
      const thetaNext = thetas[(i + 1) % N]

      const tipX = FERRIS_ORBIT_RADIUS * Math.cos(theta)
      const tipY = FERRIS_ORBIT_RADIUS * Math.sin(theta)

      const leftAngle = theta - spokeHalfAngle
      const rightAngle = theta + spokeHalfAngle
      const nextLeftAngle = thetaNext - spokeHalfAngle

      if (i === 0) {
        path.moveTo(
          FERRIS_HUB_RADIUS * Math.cos(leftAngle),
          FERRIS_HUB_RADIUS * Math.sin(leftAngle),
        )
      }

      // Left edge up to the sharp tip
      path.lineTo(tipX, tipY)

      // Right edge back down to the big circle
      path.lineTo(
        FERRIS_HUB_RADIUS * Math.cos(rightAngle),
        FERRIS_HUB_RADIUS * Math.sin(rightAngle),
      )

      // Arc along hub circle to the next spoke's left base
      path.arc(0, 0, FERRIS_HUB_RADIUS, rightAngle, nextLeftAngle, false)
    }
    path.closePath()

    // --- Cross-braces inside each spoke for a bridge-truss look ---
    const nBraces = 2
    for (let i = 0; i < N; i++) {
      const theta = thetas[i]
      const leftAngle = theta - spokeHalfAngle
      const rightAngle = theta + spokeHalfAngle

      const tipX = FERRIS_ORBIT_RADIUS * Math.cos(theta)
      const tipY = FERRIS_ORBIT_RADIUS * Math.sin(theta)

      const leftBaseX = FERRIS_HUB_RADIUS * Math.cos(leftAngle)
      const leftBaseY = FERRIS_HUB_RADIUS * Math.sin(leftAngle)
      const rightBaseX = FERRIS_HUB_RADIUS * Math.cos(rightAngle)
      const rightBaseY = FERRIS_HUB_RADIUS * Math.sin(rightAngle)

      for (let b = 1; b <= nBraces; b++) {
        const t = b / (nBraces + 1)
        // Interpolate along left and right spoke edges
        const lx = leftBaseX + t * (tipX - leftBaseX)
        const ly = leftBaseY + t * (tipY - leftBaseY)
        const rx = rightBaseX + t * (tipX - rightBaseX)
        const ry = rightBaseY + t * (tipY - rightBaseY)

        path.moveTo(lx, ly)
        path.lineTo(rx, ry)
      }
    }

    // // Center hole circle
    // if (FERRIS_HOLE_RADIUS > 0) {
    //   path.moveTo(FERRIS_HOLE_RADIUS, 0)
    //   path.arc(0, 0, FERRIS_HOLE_RADIUS, 0, 2 * Math.PI, true)
    //   path.closePath()
    // }

    return path
  }

  override drawDecorations(ctx: CanvasRenderingContext2D, pw: PinballWizard, gfxName: GfxRegionName): void {
    // if (displayMode === 'circles') {
    //   return // obstacles were already drawn as circles
    // }

    if (gfxName === 'sim-gfx') {
      ctx.lineWidth = 0.1 * DISK_RADIUS
    }
    else {
      ctx.lineWidth = 1 * DISK_RADIUS
    }

    for (const gear of this.gears) {
      this._drawSpokes(ctx, gear, pw)
    }
  }

  private _drawSpokes(ctx: CanvasRenderingContext2D, gear: Gear, _pw: PinballWizard) {
    if (!this._spokesPath) {
      this._spokesPath = this._buildSpokesPath()
    }

    const [cx, cy] = gear.center.pos

    // derive rotation from tooth 0's current position
    const tooth0 = gear.teeth[0]
    const currentTheta = Math.atan2(tooth0.pos[1] - cy, tooth0.pos[0] - cx)
    const rotation = currentTheta - this._baseTheta

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)

    // ctx.fillStyle = OBSTACLE_FILL
    // ctx.fill(this._spokesPath)
    ctx.strokeStyle = 'red'
    ctx.stroke(this._spokesPath)
    ctx.restore()
  }
}

function rotate90(pos: Vec2): Vec2 {
  return [
    -pos[1],
    pos[0],
  ]
}
