/**
 * @file fence.ts
 *
 * Fence pattern.
 */

import { Pattern } from '../pattern'
import { createFencePattern } from '../pattern-util'

export class Fence extends Pattern {
  static {
    Pattern.register('fence', () => new Fence())
  }

  public getScale(): number {
    return 1 / 20
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createFencePattern()
  }
}
