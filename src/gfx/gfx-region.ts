/**
 * @file gfx-region.ts
 *
 * Base class for gfx regions in the main sim/scrollbar/controls view.
 */

import type { GfxRegionName } from 'imp-names'
import type { Rectangle } from 'util/math-util'

type Registered = () => GfxRegion

const GFX_DEBUG_COLORS: Record<GfxRegionName, string> = {
  'bottom-bar-gfx': 'white',
  'top-bar-gfx': 'lightblue',
  'scrollbar-gfx': 'orange',
  'bsp-gfx': 'violet',
  'sim-gfx': 'green',
}

export class GfxRegion {
  readonly name: GfxRegionName = '' as GfxRegionName // assigned when registered

  draw(ctx: CanvasRenderingContext2D, rect: Rectangle) {

    console.log('debug gfx reigion', JSON.stringify(rect))

    ctx.lineWidth = 4
    ctx.strokeStyle = GFX_DEBUG_COLORS[this.name]
    ctx.strokeRect(...rect)
  }

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<GfxRegionName, Registered>> = {}
  static _singletonInstances: Partial<Record<GfxRegionName, GfxRegion>> = {}

  static register(name: GfxRegionName, reg: Registered): void {
    if (name in this._registry) {
      throw new Error(`room layout already registered: '${name}'`)
    }
    this._registry[name] = reg
    const gfx = reg()

    // @ts-expect-error assign registered name
    gfx.name = name

    this._singletonInstances[name] = gfx
  }

  static create(name: GfxRegionName): GfxRegion {
    if (!Object.hasOwn(this._singletonInstances, name)) {
      throw new Error(`singleton room layout not registered: ${name}`)
    }
    return this._singletonInstances[name] as GfxRegion
  }
}
