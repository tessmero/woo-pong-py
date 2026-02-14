/**
 * @file hex-a.ts
 *
 * Checkered pattern.
 */

import { Pattern } from '../pattern'
import { createHexDotsPattern } from '../pattern-util'

export class HexA extends Pattern {
  static {
    Pattern.register('hex-a', () => new HexA())
  }

  public override getScale(): number {
    return 1 / 100
  }

  protected override getCanvas(): HTMLCanvasElement | null {
    return createHexDotsPattern('#000', '#fff')
  }
}
