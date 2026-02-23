/**
 * @file perturbations.ts
 *
 * Pseudo-random adjustments to velocity used for branching.
 */

import type { Barrier } from './barrier'
import type { DiskState } from './disk'
import type { Obstacle } from './obstacle'

const minSpeed = 10 // only perterb vel along axes greater than this magnitude

let state = 0

export class Perturbations {
  public static nextInt = _makePRNG(_randomSeed())

  // expose helper publically
  static randomSeed = _randomSeed

  static getSeed(): number {
    return state
  }

  static setSeed(seed: number) {
    // console.log('set seed', seed)
    state = seed
    // Perturbations.nextInt = _makePRNG(seed)
  }

  // static blinkBarrier(barrier: Barrier) {
  //   const modVal = (Perturbations.nextInt() >>> 0) % 1000
  //   if (modVal === 0) {
  //     barrier.isHidden = !barrier.isHidden
  //   }
  // }

  // static blinkObstacle(obstacle: Obstacle) {
  //   const modVal = (Perturbations.nextInt() >>> 0) % 1000
  //   if (modVal === 0) {
  //     obstacle.isHidden = !obstacle.isHidden
  //   }
  // }
  // static reverseObstacle(obstacle: Obstacle) {
  //   const modVal = (Perturbations.nextInt() >>> 0) % 1000
  //   if (modVal === 0) {
  //     obstacle.vel[0] *= -1
  //   }
  // }

  static perturbDisk(state: DiskState) {
    // dx
    if (Math.abs(state.dx) > minSpeed) {
      const d6 = (Perturbations.nextInt() >>> 0) % 6
      if (d6 === 0) {
        state.dx += 1
      }
      else if (d6 === 1) {
        state.dx -= 1
      }
    }
    // dy
    if (Math.abs(state.dy) > minSpeed) {
      const d6 = (Perturbations.nextInt() >>> 0) % 6
      if (d6 === 0) {
        state.dy += 1
      }
      else if (d6 === 1) {
        state.dy -= 1
      }
    }
  }
}

function _randomSeed() {
  return Math.floor(Math.random() * 32000)
}

// Seedable 32-bit integer-only PRNG (xorshift32)
function _makePRNG(seed) {
  state = seed | 0
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
