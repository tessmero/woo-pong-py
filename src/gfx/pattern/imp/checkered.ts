/**
 * @file checkered.ts
 *
 * Checkered pattern.
 */

import { Pattern } from '../pattern'
import { buildFillStyle, createCheckeredPattern } from '../pattern-util'

export class Checkered extends Pattern {
  static {
    Pattern.register('checkered', () => new Checkered())
  }

  public getScale(): number {
    return 1 / 25
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createCheckeredPattern()
  }
}
