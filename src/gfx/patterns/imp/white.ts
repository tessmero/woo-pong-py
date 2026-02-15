/**
 * @file white.ts
 *
 * Solid white pattern.
 */

import { Pattern } from '../pattern'

export class White extends Pattern {
  static {
    Pattern.register('white', () => new White())
  }
}
