/**
 * @file stripe-v.ts
 *
 * Vertical stripe pattern.
 */

import { Pattern } from '../pattern'
import { createVerticalStripePattern } from '../pattern-util'

export class StripeV extends Pattern {
  static {
    Pattern.register('stripe-v', () => new StripeV())
  }

  public override getScale(): number {
    return 2 / 256
  }

  protected override getCanvas(): HTMLCanvasElement | null {
    return createVerticalStripePattern()
  }
}
