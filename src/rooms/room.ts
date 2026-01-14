/**
 * @file room.ts
 *
 * Base class and registry for level segments.
 */

import type { RoomName } from 'imp-names'
import { VALUE_SCALE } from 'simulation/constants'
import type { ObstacleLut } from 'simulation/luts/imp/obstacle-lut'
import { Lut } from 'simulation/luts/lut'
import { Obstacle } from 'simulation/obstacle'
import type { ShapeName } from 'simulation/shapes'
import { SHAPE_PATHS } from 'simulation/shapes'
import type { Rectangle, Vec2 } from 'util/math-util'

const _wedges: Array<[Vec2, ShapeName]> = [
  // [[20 * VALUE_SCALE, 10 * VALUE_SCALE], 'wedge'],
  // [[80 * VALUE_SCALE, 10 * VALUE_SCALE], 'wedge'],
  [[20 * VALUE_SCALE, 100 * VALUE_SCALE], 'leftwedge'],
  [[80 * VALUE_SCALE, 100 * VALUE_SCALE], 'rightwedge'],
]

export abstract class Room {
  readonly name: RoomName = '' as RoomName // re-assigned in create
  readonly bounds: Rectangle = {} as Rectangle // re-assigned in create

  abstract buildObstacles(): Array<Obstacle>

  protected wedges(): Array<Obstacle> {
    return _wedges.map(([pos, shapeName]) => new Obstacle(
      [pos[0], pos[1] + this.bounds[1]],
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
      this,
    ))
  }

  obstacleHit(obstacle: Obstacle): void {
    // do nothing
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
