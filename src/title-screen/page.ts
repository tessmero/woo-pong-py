/**
 * @file page.ts
 *
 * Base class and registry for title screen pages.
 */

import type { PageName } from 'imp-names'

type Registered = () => Page

export abstract class Page {
  readonly name: PageName = '' as PageName // assigned when registered

  /**
   * Initialize page when it becomes visible.
   */
  init(): void {
    // override in subclasses
  }

  /**
   * Cleanup when page is navigated away from.
   */
  cleanup(): void {
    // override in subclasses
  }

  /**
   * Draw the page content.
   * @param ctx Canvas context
   * @param w Canvas width
   * @param h Canvas height
   */
  abstract draw(ctx: CanvasRenderingContext2D, w: number, h: number): void

  /**
   * Get start button position in normalized coordinates (0-1 range).
   * @returns { x, y } where x and y are fractions of page width/height, or null to hide button
   */
  getStartButtonPosition(): { x: number, y: number } | null {
    return null // default: no button
  }

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<PageName, Registered>> = {}
  static _singletons: Partial<Record<PageName, Page>> = {}

  static register(name: PageName, factory: Registered): void {
    if (name in this._registry) {
      throw new Error(`page already registered: '${name}'`)
    }
    this._registry[name] = factory
    const page = factory()

    // @ts-expect-error assign registered name
    page.name = name

    this._singletons[name] = page
  }

  static create(name: PageName): Page {
    if (!Object.hasOwn(this._singletons, name)) {
      throw new Error(`singleton Page not registered: ${name}`)
    }
    return this._singletons[name] as Page
  }
}
