/**
 * @file black.ts
 *
 * Solid black pattern.
 */

import { Pattern } from '../pattern'

export class Black extends Pattern {
  static {
    Pattern.register('black', () => new Black())
  }
}
