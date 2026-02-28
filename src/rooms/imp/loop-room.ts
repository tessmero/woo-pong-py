/**
 * @file loop-room.ts
 *
 * Room for loop sim.
 */

import type { GfxRegionName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { Room } from 'rooms/room'
import { STEP_DURATION, VALUE_SCALE } from 'simulation/constants'
import { Disk } from 'simulation/disk'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import { Serializer } from 'simulation/serializer'
import type { ShapeName } from 'simulation/shapes'
import type { Simulation } from 'simulation/simulation'

type SpawnEvent = {
  step: number
  state: [number, number, number, number]
  didPass?: boolean
}

type LoopErrorParams = {
  expected: SpawnEvent
  actual: SpawnEvent
}
export class LoopError extends Error {
  public readonly userId?: string

  constructor(
    public readonly params: LoopErrorParams,
  ) {
    // Call the parent Error constructor
    super(`Loop Error: ${JSON.stringify(params)}`)
  }
}

export class LoopRoom extends Room {
  static {
    Room.register('loop-room', () => new LoopRoom())
  }


  public static topPortalX = 30 * VALUE_SCALE
  public static stepsBack = 1000
  public static spawnStep = 1319
  public static startState: [number, number, number, number] = [2 * VALUE_SCALE, 205, 50, 390]
  public static spawnState: [number, number, number, number] = [414402, 205, 0, 390]

  private readonly spawnEvents: Array<SpawnEvent> = [
    { step: LoopRoom.spawnStep, state: LoopRoom.spawnState, didPass: false },
  ]

  override drawDecorations(ctx: CanvasRenderingContext2D, _pw: PinballWizard, _gfxName: GfxRegionName): void {
    ctx.strokeStyle = 'orange'
    _drawPortal(ctx, LoopRoom.topPortalX, 0)

    ctx.strokeStyle = 'blue'
    _drawPortal(ctx, 50 * VALUE_SCALE, 100 * VALUE_SCALE)
  }

  private didEnterPortal = false

  override update(sim: Simulation, _stepIndex: number): void {
    for (const [i, evt] of this.spawnEvents.entries()) {
      if (!evt.didPass && sim._stepCount === evt.step) {
        console.log(`hit unpassed spawn event on step ${sim._stepCount}`)
        evt.didPass = true
        sim.disks.push(Disk.fromJson(evt.state))
        Disk.flushStates(sim.disks)
        Serializer.captureLoopCheckpoint(sim, i)
      }
    }

    for (const disk of sim.disks) {
      if (disk.currentState.y < 0) {
        throw new Error('disk entered top portal')
      }
      if (!this.didEnterPortal && disk.currentState.y > 100 * VALUE_SCALE) {
        console.log(`disk entered bottom portal on step ${sim._stepCount}`)
        this.didEnterPortal = true

        disk.currentState.y -= 100 * VALUE_SCALE
        disk.currentState.x -= (50 * VALUE_SCALE - LoopRoom.topPortalX)

        // there shuld have been a matching spawn event in the past
        const expected: SpawnEvent = {
          step: sim._stepCount - LoopRoom.stepsBack,
          state: disk.currentState.toArray(),
          didPass: true,
        }
        const eventIndex = 0
        const actual = this.spawnEvents[eventIndex]
        if (_spawnEventsEqual(expected, actual)) {
          // console.log('before looping', sim._stepCount, JSON.stringify(sim.disks[0].currentState.toArray()))

          // console.log(`looped correctly: ${JSON.stringify(actual)}`)
          const remainingSteps = sim.targetStepCount - sim._stepCount
          Serializer.restore(sim, eventIndex) // rewind sim to first checkpoint
          sim._stepCount = actual.step
          sim.t = sim._stepCount * STEP_DURATION
          sim.targetStepCount = sim._stepCount + remainingSteps
          sim.loopDiskIndex = 1

          // console.log('after looping', sim._stepCount, JSON.stringify(sim.disks[0].currentState.toArray()))
        }
        else {
          throw new LoopError({ expected, actual })
        }
      }
    }
  }

  override buildObstacles(): Array<Obstacle> {
    const shape: ShapeName = 'roundrect'
    const shapeLut = Lut.create('obstacle-lut', shape) as ObstacleLut
    const xOff = 50 * VALUE_SCALE - LoopRoom.topPortalX
    const y0 = 0
    const y1 = 100 * VALUE_SCALE
    return [
      new Obstacle([10 * VALUE_SCALE - xOff, y0], shape, shapeLut, this),
      new Obstacle([90 * VALUE_SCALE - xOff, y0], shape, shapeLut, this),
      new Obstacle([10 * VALUE_SCALE, y1], shape, shapeLut, this),
      new Obstacle([90 * VALUE_SCALE, y1], shape, shapeLut, this),
    ]
  }
}

function _spawnEventsEqual(a: SpawnEvent, b: SpawnEvent) {
  return JSON.stringify(a) === JSON.stringify(b)
}

const portalRad = 25 * VALUE_SCALE
const portalThickness = 1 * VALUE_SCALE
function _drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.lineWidth = portalThickness
  ctx.beginPath()
  ctx.moveTo(x - portalRad, y)
  ctx.lineTo(x + portalRad, y)
  ctx.stroke()
}
