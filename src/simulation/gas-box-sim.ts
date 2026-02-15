/**
 * @file gas-box-sim.ts
 *
 * One set of gas particles that step independently. GasBox holds one or two
 * of these and manages the visual transition between them.
 *
 * Uses Structure-of-Arrays (SoA) layout with typed arrays for cache-friendly
 * iteration and fast numeric loops.
 */

import { GAS_BOX_HEIGHT, GAS_BOX_SOLVE_STEPS, GAS_BOX_WIDTH, N_GAS_BOX_PARTICLES } from './gas-box-constants'
import { Lut } from './luts/lut'

export class GasBoxSim {
  readonly count: number = N_GAS_BOX_PARTICLES

  /** Particle positions (x). */
  readonly px: Int32Array
  /** Particle positions (y). */
  readonly py: Int32Array
  /** Particle velocities (x). */
  readonly dx: Int32Array
  /** Particle velocities (y). */
  readonly dy: Int32Array

  /**
   * After each `step()` call, `wrapped[i]` is 1 if particle `i`
   * crossed a bounding-rect edge on that step, 0 otherwise.
   */
  readonly wrapped: Uint8Array

  constructor(solutionIndex = 0) {
    const n = N_GAS_BOX_PARTICLES
    this.px = new Int32Array(n)
    this.py = new Int32Array(n)
    this.dx = new Int32Array(n)
    this.dy = new Int32Array(n)
    this.wrapped = new Uint8Array(n)

    const lut = Lut.create('gas-box-lut')

    lut.getI32Array(solutionIndex, 'px', this.px)
    lut.getI32Array(solutionIndex, 'py', this.py)
    lut.getI16Array(solutionIndex, 'vx', this.dx)
    lut.getI16Array(solutionIndex, 'vy', this.dy)
  }

  /** Create a GasBoxSim from raw particle arrays (used at build time before the LUT exists). */
  static fromArrays(
    px: Int32Array, py: Int32Array,
    dx: Int32Array, dy: Int32Array,
  ): GasBoxSim {
    const sim = Object.create(GasBoxSim.prototype) as GasBoxSim
    // @ts-expect-error assigning readonly fields in factory
    sim.count = px.length
    // @ts-expect-error assigning readonly fields in factory
    sim.px = px
    // @ts-expect-error assigning readonly fields in factory
    sim.py = py
    // @ts-expect-error assigning readonly fields in factory
    sim.dx = dx
    // @ts-expect-error assigning readonly fields in factory
    sim.dy = dy
    // @ts-expect-error assigning readonly fields in factory
    sim.wrapped = new Uint8Array(px.length)
    sim._debugStepCount = 0
    return sim
  }

  private _debugStepCount = 0

  /** Advance every particle one step, wrapping toroidally. */
  step(isFinal = false) {
    const dsc = this._debugStepCount++
    if (isFinal && (dsc % (GAS_BOX_SOLVE_STEPS / 10) === 0)) {
      console.log('final gas box sim step count', dsc)
    }

    // prevent advancing past solved state
    if (isFinal && this._debugStepCount > GAS_BOX_SOLVE_STEPS) {
      return
    }

    const bw = GAS_BOX_WIDTH
    const bh = GAS_BOX_HEIGHT
    const { px, py, dx, dy, wrapped, count } = this
    for (let i = 0; i < count; i++) {
      let nx = px[i] + dx[i]
      let ny = py[i] + dy[i]

      const w = (nx < 0 || nx >= bw || ny < 0 || ny >= bh) ? 1 : 0
      wrapped[i] = w

      if (nx < 0) nx += bw
      else if (nx >= bw) nx -= bw
      if (ny < 0) ny += bh
      else if (ny >= bh) ny -= bh
      px[i] = nx
      py[i] = ny
    }
  }
}
