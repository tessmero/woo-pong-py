/**
 * @file loop-room.ts
 *
 * Room for loop sim.
 */

import type { GfxRegionName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { Room } from 'rooms/room'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { ShapeName } from 'simulation/shapes'
import type { Simulation } from 'simulation/simulation'

export class LoopRoom extends Room {
  static {
    Room.register('loop-room', () => new LoopRoom())
  }

  override drawDecorations(ctx: CanvasRenderingContext2D, _pw: PinballWizard, _gfxName: GfxRegionName): void {
    ctx.strokeStyle = 'orange'
    _drawPortal(ctx, 50 * VALUE_SCALE, 0)

    ctx.strokeStyle = 'blue'
    _drawPortal(ctx, 50 * VALUE_SCALE, 100 * VALUE_SCALE)
  }

  override update(sim: Simulation, _stepIndex: number): void {
    for (const disk of sim.disks) {
      if (disk.currentState.y > 100 * VALUE_SCALE) {
        disk.currentState.y -= 100 * VALUE_SCALE
      }
    }
  }

  override buildObstacles(): Array<Obstacle> {
    const shape: ShapeName = 'roundrect'
    const shapeLut = Lut.create('obstacle-lut', shape) as ObstacleLut
    const x0 = 10 * VALUE_SCALE
    const x1 = 90 * VALUE_SCALE
    const y0 = 0
    const y1 = 100 * VALUE_SCALE
    return [
      new Obstacle([x0, y0], shape, shapeLut, this),
      new Obstacle([x1, y0], shape, shapeLut, this),
      new Obstacle([x0, y1], shape, shapeLut, this),
      new Obstacle([x1, y1], shape, shapeLut, this),
    ]
  }
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
