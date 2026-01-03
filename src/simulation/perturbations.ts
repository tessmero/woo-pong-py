/**
 * @file perturbations.ts
 *
 * Pseudo-random adjustments to velocity used for branching.
 */

import type { DiskState } from './disk'

const minSpeed = 10 // only perterb vel along axes greater than this magnitude
const velAxes = [2, 3]


export class Perturbations {
  private static nextInt = _makePRNG(_randomSeed())

  // expose helper publically
  static randomSeed = _randomSeed

  static setSeed(seed: number) {
    Perturbations.nextInt = _makePRNG(seed)
  }

  static perturb(state: DiskState) {
    for (const ax of velAxes) {
      if (Math.abs(state[ax]) > minSpeed) {
        const d6 = (Perturbations.nextInt() >>> 0) % 6
        if (d6 === 0) {
          state[ax] += 1
        }
        else if (d6 === 1) {
          state[ax] -= 1
        }
      }
    }
  }
}

function _randomSeed() {
  return Math.floor(Math.random() * 1e6)
}

// Seedable 32-bit integer-only PRNG (xorshift32)
function _makePRNG(seed) {
  let state = seed | 0
  if (state === 0) state = 1
  return function nextInt() {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return state | 0 
  }
}

// // Example usage:
// const rng = makePRNG(123456);

// // Integers:
// console.log(rng());      // e.g. -1496331659
// console.log(rng());      // e.g. 1681035081

// // If you also want [0, 1) floats from it:
// function makeFloatPRNG(seed) {
//   const nextInt = makePRNG(seed);
//   return function nextFloat() {
//     // >>> 0 converts to unsigned 32-bit, divide by 2^32
//     return (nextInt() >>> 0) / 4294967296;
//   };
// }
