/**
 * @file rng.ts
 *
 * Utilities involving random numbers.
 *
 * Provides pseudo-random number generator that can be seeded
 * to consistently produce the same results.
 */

export class SeedablePRNG {
  constructor(private seed: number) {}

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

// randomly choose element from list and maintain types
export function randChoice<TOption>(options: Array<TOption>): TOption {
  return options[Math.floor(Math.random() * options.length)]
}

// randomly shuffle elements in array
export function shuffle<TElement>(array: Array<TElement>): Array<TElement> {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
