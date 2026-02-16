/**
 * @file breakout-solver.testSKIP.ts
 *
 * Compute brick values for breakout room to have consistent score in all branches.
 */

import { equal, ok } from 'assert'
import { solveBreakout } from '../../src/breakout-solver'

describe(`breakout room solver`, function () {
  it(`computes brick values for input with 10 branches`, function () {
    const solution = solveBreakout(testInput)
    ok(solution.every(v => Number.isInteger(v)),
      `solved brick values should be integers: ${JSON.stringify(solution)}`)
    ok(solution.every(v => (v >= 0) && (v <= 100)),
      `solved brick values should be between 0 and 100: ${JSON.stringify(solution)}`)

    // console.log(JSON.stringify(solution))
    ok(new Set(solution).size > 5, `solution should have many distinct values: ${JSON.stringify(solution)}`)

    for (const branchSequence of testInput) {
      let score = 0
      for (const brickIndex of branchSequence) {
        score += solution[brickIndex]
      }
      equal(score, 100, `solution should result in total score of 100`)
    }
  })
})

const testInput = [
  [
    1, 3, 0, 2, 5, 10, 4, 6,
    9, 8, 11, 7, 14, 12, 13, 16,
    21, 17, 18, 15, 19, 26, 20, 25,
    22,
  ],
  [
    0, 5, 1, 6, 4, 3, 9, 10,
    2, 11, 7, 14, 15, 20, 19, 13,
    8, 16, 18, 23, 12, 21, 25, 24,
  ],
  [
    1, 3, 4, 8, 2, 7, 6, 12,
    13, 9, 17, 11, 14, 18, 22, 16,
    19, 23, 28, 24, 0, 15, 21,
  ],
  [
    0, 5, 10, 1, 6, 15, 4, 2, 11,
    3, 8, 7, 20, 16, 12, 21, 9, 26,
    13, 17, 25, 14, 18, 19, 23, 22, 24,
    28, 27,
  ],
  [
    1, 4, 2, 6, 0, 5, 3, 7,
    11, 10, 15, 16, 12, 13, 17, 21,
    9, 18, 22, 20, 14, 26, 23, 19,
    8, 24, 25, 29,
  ],
  [
    0, 1, 4, 3, 2, 6, 7,
    5, 12, 11, 9, 16, 10, 21,
    8, 17, 26, 22, 27, 20,
  ],
  [
    1, 4, 2, 0, 5, 7, 10,
    12, 8, 3, 9, 6, 11, 15,
    16, 20, 17, 21, 25, 13, 26,
    14,
  ],
  [
    0, 5, 1, 10, 15, 6, 4, 3,
    8, 2, 9, 20, 13, 14, 7, 12,
    19, 24, 17, 18, 29, 11, 16, 23,
    22, 27,
  ],
  [
    0, 3, 4, 1, 8, 5, 13, 9,
    7, 2, 6, 10, 12, 11, 14, 15,
    16, 20, 21, 17, 26, 22, 19, 24,
  ],
  [
    1, 6, 7, 3, 11, 12, 2, 8,
    0, 13, 5, 10, 17, 4, 9, 15,
    20, 16, 18, 21, 26, 23, 22, 25,
    14, 27,
  ],
]
// solution: [
//   10, 4, 2, 5, 2, 2, 1, 4, 4,
//    2, 6, 8, 9, 1, 6, 4, 2, 2,
//    1, 1, 2, 2, 8, 1, 4, 4, 6,
//    2, 5, 4
// ]
