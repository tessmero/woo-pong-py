/**
 * @file hex-b.ts
 *
 * Hex pattern.
 */

import { Pattern } from '../pattern'
import { createHexDotsPattern } from '../pattern-util'

export class HexB extends Pattern {
  static {
    Pattern.register('hex-b', () => new HexB())
  }

  public getScale(): number {
    return 1 / 100
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createHexDotsPattern('#fff', '#000', 100)
  }
}
