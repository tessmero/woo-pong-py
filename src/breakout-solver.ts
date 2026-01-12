/**
 * @file breakout-solver.ts
 *
 * Breakout solver.
 */

import { BOBRICK_COUNT } from 'simulation/constants'

export function solveBreakout(branchSequences: Array<Array<number>>): Array<number> {
  const nBricks = BOBRICK_COUNT
  // Simulated annealing for distinctness and branch sums
  let bestVals = Array(nBricks).fill(0).map(() => Math.round(10 + Math.random() * 80))
  let bestScore = 0
  // Helper to fix branch sums
  function fixBranchSums(vals: Array<number>) {
    for (let iter = 0; iter < 50; iter++) {
      let changed = false
      for (const branch of branchSequences) {
        const score = branch.reduce((sum, idx) => sum + vals[idx], 0)
        if (score !== 100) {
          const error = 100 - score
          const n = branch.length
          for (const idx of branch) {
            vals[idx] += error / n
          }
          for (const idx of branch) {
            vals[idx] = Math.max(0, Math.min(100, vals[idx]))
          }
          changed = true
        }
      }
      if (!changed) break
    }
  }
  // Annealing loop
  for (let temp = 50; temp > 0.1; temp *= 0.95) {
    const vals = bestVals.slice()
    // Randomly perturb a brick
    const idx = Math.floor(Math.random() * nBricks)
    const delta = (Math.random() - 0.5) * temp * 2
    vals[idx] = Math.max(0, Math.min(100, vals[idx] + delta))
    // Fix branch sums
    fixBranchSums(vals)
    // Score: number of distinct values
    const distinct = new Set(vals.map(v => Math.round(v))).size
    if (distinct > bestScore || Math.exp((distinct - bestScore) / temp) > Math.random()) {
      bestVals = vals.slice()
      bestScore = distinct
    }
  }
  // Finalize: round and clamp
  const finalVals = bestVals.map(v => Math.max(0, Math.min(100, Math.round(v))))
  // Final strict correction pass
  for (const branch of branchSequences) {
    const score = branch.reduce((sum, idx) => sum + finalVals[idx], 0)
    if (score !== 100) {
      // Find brick with largest flexibility
      let idx = branch[0]
      let maxFlex = 0
      for (const bidx of branch) {
        const flex = Math.min(100 - finalVals[bidx], finalVals[bidx])
        if (flex > maxFlex) {
          maxFlex = flex
          idx = bidx
        }
      }
      const delta = Math.max(-maxFlex, Math.min(maxFlex, 100 - score))
      finalVals[idx] = Math.max(0, Math.min(100, finalVals[idx] + delta))
    }
  }
  return finalVals
}
