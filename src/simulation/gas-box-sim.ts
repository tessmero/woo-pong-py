/**
 * @file gas-box-sim.ts
 *
 * One set of gas particles that step independently. GasBox holds one or two
 * of these and manages the visual transition between them.
 */

import { N_GAS_BOX_PARTICLES } from './gas-box-constants'
import type { GasBoxLut } from './luts/imp/gas-box-lut'
import { Lut } from './luts/lut'
import { mod, type Rectangle } from 'util/math-util'

/** State of one gas particle. */
export interface GasParticle {
  x: number
  y: number
  dx: number
  dy: number
}

export class GasBoxSim {
  readonly particles: Array<GasParticle>

  /**
   * After each `step()` call, `wrapped[i]` is `true` if particle `i`
   * crossed a bounding-rect edge on that step.
   */
  readonly wrapped: Array<boolean>

  constructor(boundingRect: Rectangle) {
    const [bx, by, bw, bh] = boundingRect
    this.particles = []
    this.wrapped = []

    const lut = Lut.create('gas-box-lut') as GasBoxLut

    let indexInLeaf = 0
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
    //   const fx = ((Perturbations.nextInt() >>> 0) % 1000) / 1000
    //   const fy = ((Perturbations.nextInt() >>> 0) % 1000) / 1000
    //   const sx = ((Perturbations.nextInt() >>> 0) % (2 * GAS_BOX_MAX_SPEED + 1)) - GAS_BOX_MAX_SPEED
    //   const sy = ((Perturbations.nextInt() >>> 0) % (2 * GAS_BOX_MAX_SPEED + 1)) - GAS_BOX_MAX_SPEED

      const xHi = lut.getInt16(0, indexInLeaf++) & 0xFFFF
      const xLo = lut.getInt16(0, indexInLeaf++) & 0xFFFF
      const yHi = lut.getInt16(0, indexInLeaf++) & 0xFFFF
      const yLo = lut.getInt16(0, indexInLeaf++) & 0xFFFF
      const x = (xHi << 16) | xLo
      const y = (yHi << 16) | yLo
      const dx = lut.getInt16(0, indexInLeaf++)
      const dy = lut.getInt16(0, indexInLeaf++)

      this.particles.push({
        x, y, dx, dy,
      })
      this.wrapped.push(false)
    }
  }

  /** Advance every particle one step, wrapping toroidally. */
  step(boundingRect: Rectangle) {
    const [_bx, _by, bw, bh] = boundingRect
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      const nx = p.x + p.dx
      const ny = p.y + p.dy

      this.wrapped[i] = (nx < 0 || nx >= bw || ny < 0 || ny >= bh)

      p.x = mod(nx, bw)
      p.y = mod(ny, bh)
    }
  }
}
