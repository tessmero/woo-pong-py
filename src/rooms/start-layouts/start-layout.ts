/**
 * @file start-layout.ts
 *
 * Base class for start layouts.
 */

import type { StartLayoutName } from 'imp-names'
import type { Vec2 } from 'util/math-util'

type Registered = () => StartLayout

export abstract class StartLayout {
  animDur = 0 // steps to run animation before starting real sim
  getAnimPos(_diskIndex: number, _stepIndex: number, _out: Vec2) {
    // set out with position of disk at step in animation
  }

  public computePosVels(): Array<[Vec2, Vec2]> {
    if (typeof document !== 'undefined') {
      throw new Error('should only be used in build scripts, not in browser')
    }
    return this._computePosVels()
  }

  // position and velocity at start of real sim
  protected abstract _computePosVels(): Array<[Vec2, Vec2]>

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<StartLayoutName, Registered>> = {}
  static _singletonLayouts: Partial<Record<StartLayoutName, StartLayout>> = {}

  static register(name: StartLayoutName, reg: Registered): void {
    if (name in this._registry) {
      throw new Error(`start layout already registered: '${name}'`)
    }
    this._registry[name] = reg
    const layout = reg()
    this._singletonLayouts[name] = layout
  }

  static create(name: StartLayoutName): StartLayout {
    if (!Object.hasOwn(this._singletonLayouts, name)) {
      throw new Error(`singleton start layout not registered: ${name}`)
    }
    return this._singletonLayouts[name] as StartLayout
  }
}
