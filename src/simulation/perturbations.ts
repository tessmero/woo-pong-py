/**
 * @file perturbations.ts
 *
 * Pseudo-random adjustments to velocity used for branching.
 */

import type { DiskState } from './disk'

const minSpeed = 10 // only perterb vel along axes greater than this magnitude

export class Perturbations {
  private state = 0
  public nextInt = this._makePRNG()

  // expose helper publically
  static randomSeed = _randomSeed

  getSeed(): number {
    return this.state
  }

  setSeed(seed: number) {
    // console.log('set seed', seed)
    this.state = seed
    // Perturbations.nextInt = _makePRNG(seed)
  }

  perturbDisk(state: DiskState) {
    // dx
    if (Math.abs(state.dx) > minSpeed) {
      const d6 = (this.nextInt() >>> 0) % 6
      if (d6 === 0) {
        state.dx += 1
      }
      else if (d6 === 1) {
        state.dx -= 1
      }
    }
    // dy
    if (Math.abs(state.dy) > minSpeed) {
      const d6 = (this.nextInt() >>> 0) % 6
      if (d6 === 0) {
        state.dy += 1
      }
      else if (d6 === 1) {
        state.dy -= 1
      }
    }
  }

  // Seedable 32-bit integer-only PRNG (xorshift32)
  _makePRNG() {
    if (this.state === 0) this.state = 1
    const pert = this
    return function nextInt() {
      pert.state ^= pert.state << 13
      pert.state ^= pert.state >>> 17
      pert.state ^= pert.state << 5
      return pert.state | 0
    }
  }
}

function _randomSeed() {
  return Math.floor(Math.random() * 32000)
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
