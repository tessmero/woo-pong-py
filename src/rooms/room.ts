/**
 * @file room.ts
 *
 * Base class and registry for level segments.
 */

import type { RoomName } from 'imp-names'
import type { Obstacle } from 'simulation/obstacle'
import type { Rectangle } from 'util/math-util'

export abstract class Room {
  readonly name = '' // re-assigned in create
  readonly bounds: Rectangle = {} as Rectangle // re-assigned in create

  abstract buildObstacles(): Array<Obstacle>

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
