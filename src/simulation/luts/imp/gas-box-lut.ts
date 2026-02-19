/**
 * @file gas-box-lut.ts
 *
 * Initial states for gas box particles.
 *
 * Each leaf corresponds to one filler pattern. At build time a solver
 * places 1000 particles in a hexagonal grid covering the dark regions
 * of the pattern image — that arrangement is the "solved" state the
 * particles converge to when replayed forward at runtime.
 */

import {
  GAS_BOX_MAX_SPEED, N_GAS_BOX_PARTICLES, GAS_BOX_SOLVE_STEPS, GAS_BOX_MIN_SPEED,
} from 'simulation/gas-box/gas-box-constants'
import { Lut, i16Array, i32Array } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import { PATTERN } from 'imp-names'
import { LUT_BLOBS } from 'set-by-build'
import { GasBoxSim } from 'simulation/gas-box/gas-box-sim'

/** Schema: four arrays — positions (i32) and velocities (i16), each length N_GAS_BOX_PARTICLES. */
const gasBoxSchema: LeafSchema = [
  i32Array('px', N_GAS_BOX_PARTICLES),
  i32Array('py', N_GAS_BOX_PARTICLES),
  i16Array('vx', N_GAS_BOX_PARTICLES),
  i16Array('vy', N_GAS_BOX_PARTICLES),
]

/** Injected at build time by rebuild-blobs.ts — not available in the browser. */
type PatternSolver = (patternIndex: number) => { px: Int32Array, py: Int32Array }

export class GasBoxLut extends Lut {
  schema = gasBoxSchema
  override detail = [PATTERN.NAMES.length] // one solution for each pattern

  blobUrl = LUT_BLOBS.GAS_BOX_LUT.url
  blobHash = LUT_BLOBS.GAS_BOX_LUT.hash

  /**
   * Set by the build script before `computeAll()` is called.
   * Maps a pattern index to solved particle positions.
   */
  static patternSolver: PatternSolver | null = null

  override computeLeaf(index: Array<number>): LeafValues {
    const solver = GasBoxLut.patternSolver
    if (!solver) throw new Error('GasBoxLut.patternSolver not set — only available at build time')

    // Solved-state positions from the pattern solver
    const { px, py } = solver(index[0])

    // Random velocities
    const dx = new Int32Array(N_GAS_BOX_PARTICLES)
    const dy = new Int32Array(N_GAS_BOX_PARTICLES)
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      const angle = Math.random() * 2 * Math.PI
      const radius = GAS_BOX_MIN_SPEED
        + (GAS_BOX_MAX_SPEED - GAS_BOX_MIN_SPEED) * Math.sqrt(Math.random())
      dx[i] = Math.round(radius * Math.cos(angle))
      dy[i] = Math.round(radius * Math.sin(angle))
    }

    // Advance simulation using GasBoxSim
    const sim = GasBoxSim.fromArrays(px, py, dx, dy)
    for (let step = 0; step < GAS_BOX_SOLVE_STEPS; step++) {
      sim.step()
    }

    // Save unsolved state with reversed velocities
    const result: LeafValues = {
      px: Array.from(sim.px),
      py: Array.from(sim.py),
      vx: Array.from(sim.dx, v => -v),
      vy: Array.from(sim.dy, v => -v),
    }

    return result
  }

  static {
    Lut.register('gas-box-lut', {
      factory: () => new GasBoxLut(),
      depth: 1,
      schema: gasBoxSchema,
    })
  }
}
