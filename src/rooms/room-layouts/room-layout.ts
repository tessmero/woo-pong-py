/**
 * @file room-layout.ts
 *
 * Base class for room layouts.
 */

import type { RoomLayoutName } from 'imp-names'
import type { Vec2 } from 'util/math-util'

type Registered = () => RoomLayout

export abstract class RoomLayout {
  abstract computePositions(): Array<[number, Vec2]>

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<RoomLayoutName, Registered>> = {}
  static _singletonLayouts: Partial<Record<RoomLayoutName, RoomLayout>> = {}

  static register(name: RoomLayoutName, reg: Registered): void {
    if (name in this._registry) {
      throw new Error(`room layout already registered: '${name}'`)
    }
    this._registry[name] = reg
    const layout = reg()
    this._singletonLayouts[name] = layout
  }

  static create(name: RoomLayoutName): RoomLayout {
    if (typeof document !== 'undefined') {
      throw new Error('should only be used in build scripts, not in browser')
    }
    if (!Object.hasOwn(this._singletonLayouts, name)) {
      throw new Error(`singleton room layout not registered: ${name}`)
    }
    return this._singletonLayouts[name] as RoomLayout
  }
}
