/**
 * @file gfx-region.ts
 *
 * Base class for gfx regions in the main sim/scrollbar/controls view.
 */

import type { CanvasName } from 'gfx/graphics'
import type { GfxRegionName } from 'imp-names'
import type { InputId, PinballWizard } from 'pinball-wizard'
import type { Rectangle, Vec2 } from 'util/math-util'

type Registered = () => GfxRegion

const _GFX_DEBUG_COLORS: Record<GfxRegionName, string> = {
  'bottom-bar-gfx': 'white',
  'top-bar-gfx': 'lightblue',
  'scrollbar-gfx': 'orange',
  'bsp-gfx': 'violet',
  'sim-gfx': 'green',
  'glass-gfx': 'yellow',
  'settings-gfx': 'black',
  'start-gfx': 'purple',
}

export abstract class GfxRegion {
  readonly name: GfxRegionName = '' as GfxRegionName // assigned when registered

  public targetCanvas: CanvasName = 'main'
  public shouldDraw(_pw: PinballWizard) {
    return true
  }

  onResize(_rect: Rectangle) {
    // do nothing
  }

  draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle) {
    // console.log('debug gfx reigion', JSON.stringify(rect))
    // ctx.lineWidth = 4
    // ctx.strokeStyle = GFX_DEBUG_COLORS[this.name]
    // ctx.strokeRect(...rect)

    this._draw(ctx, pw, rect)
  }

  abstract down(pw: PinballWizard, mousePos: Vec2, inputId: InputId): boolean
  abstract move(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void
  abstract leave(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void
  abstract up(pw: PinballWizard, mousePos: Vec2, inputId: InputId): void
  protected abstract _draw(ctx: CanvasRenderingContext2D, pw: PinballWizard, rect: Rectangle)

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<GfxRegionName, Registered>> = {}
  static _singletonInstances: Partial<Record<GfxRegionName, GfxRegion>> = {}

  static register(name: GfxRegionName, reg: Registered): void {
    if (name in this._registry) {
      throw new Error(`gfx region already registered: '${name}'`)
    }
    this._registry[name] = reg
    const gfx = reg()

    // @ts-expect-error assign registered name
    gfx.name = name

    this._singletonInstances[name] = gfx
  }

  static create(name: GfxRegionName): GfxRegion {
    if (!Object.hasOwn(this._singletonInstances, name)) {
      throw new Error(`singleton GfxRegion not registered: ${name}`)
    }
    return this._singletonInstances[name] as GfxRegion
  }
}
