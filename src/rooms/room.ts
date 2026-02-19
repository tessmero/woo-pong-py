/**
 * @file room.ts
 *
 * Base class and registry for level segments.
 */

import type { GfxRegionName, RoomName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { ShapeName } from 'simulation/shapes'
import type { Rectangle, Vec2 } from 'util/math-util'

const _wedges: Array<[Vec2, ShapeName, boolean?]> = [
  // [[20 * VALUE_SCALE, 10 * VALUE_SCALE], 'wedge'],
  // [[80 * VALUE_SCALE, 10 * VALUE_SCALE], 'wedge'],
  [[15 * VALUE_SCALE, 100 * VALUE_SCALE], 'flipper', true],
  [[85 * VALUE_SCALE, 100 * VALUE_SCALE], 'flipper'], // shape has flipped X
]

export abstract class Room {
  readonly name: RoomName = '' as RoomName // re-assigned in create
  readonly bounds: Rectangle = {} as Rectangle // re-assigned in create

  abstract buildObstacles(): Array<Obstacle>

  protected wedges(): Array<Obstacle> {
    return _wedges.map(([pos, shapeName, isFlippedX]) => {
      const result = new Obstacle(
        [pos[0], pos[1] + this.bounds[1]],
        shapeName,
        Lut.create('obstacle-lut', shapeName) as ObstacleLut,
        this,
      )
      if (isFlippedX) {
        result.isFlippedX = true
      }
      return result
    },
    )
  }

  obstacleHit(_obstacle: Obstacle, _stepIndex: number): void {
    // do nothing
  }

  update(_stepIndex: number): void {
    // do nothing
  }

  drawDecorationsBelow(_ctx: CanvasRenderingContext2D, _pw: PinballWizard, _gfxName: GfxRegionName): void {
    // do nothing – override to draw behind obstacles
  }

  drawDecorations(_ctx: CanvasRenderingContext2D, _pw: PinballWizard, _gfxName: GfxRegionName): void {
    // do nothing – override to draw above obstacles
  }

  // static registry pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _registry: Record<RoomName, () => Room> = {} as any

  protected constructor() {}

  static register(name: RoomName, factory: () => Room): void {
    if (name in this._registry) {
      throw new Error(`Room already registered: '${name}'`)
    }
    this._registry[name] = factory
  }

  static create(name: RoomName, bounds: Rectangle): Room {
    if (!(name in this._registry)) {
      throw new Error(`room not registered: ${name}`)
    }
    const factory = this._registry[name]
    const instance = factory()

    // Room
    // post-construction setup

    // @ts-expect-error assign bounds
    instance.bounds = bounds

    // @ts-expect-error assign name
    instance.name = name

    return instance
  }
}
