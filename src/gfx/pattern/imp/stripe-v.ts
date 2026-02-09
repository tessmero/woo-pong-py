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

  public getScale(): number {
    return 2
  }

  protected getCanvas(): HTMLCanvasElement | null {
    return createVerticalStripePattern()
  }
}
