/**
 * @file stripe-h.ts
 *
 * Horizontal stripe pattern.
 */

import { Pattern } from '../pattern'
import { createHorizontalStripePattern } from '../pattern-util'

export class StripeH extends Pattern {
  static {
    Pattern.register('stripe-h', () => new StripeH())
  }

  public getScale(): number {
    return 2
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createHorizontalStripePattern()
  }
}
