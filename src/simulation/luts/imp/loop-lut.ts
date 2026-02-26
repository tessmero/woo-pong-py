/**
 * loop-lut.ts
 *
 * Time travel loops.
 */

import { LUT_BLOBS } from 'set-by-build'
import type { LeafSchema, LeafValues } from '../lut'
import { i32, Lut } from '../lut'
import { Perturbations } from 'simulation/perturbations'
import { VALUE_SCALE } from 'simulation/constants'
import { Simulation } from 'simulation/simulation'

const loopSchema: LeafSchema = [
  i32('startSeed'), // prng seed
  i32('x'), i32('y'), i32('vx'), i32('vy'), // starting disk state
  i32('x0'), // x-position of top portal
  i32('x1'), // x-position of bottom portal
  i32('dt'), // milliseconds of backwards time travel
]
export class LoopLut extends Lut {
  static {
    Lut.register('loop-lut', {
      factory: () => new LoopLut(),
      depth: 1,
      schema: loopSchema,
    })
  }

  override detail = [1]
  override blobUrl = LUT_BLOBS.LOOP_LUT.url
  override blobHash = LUT_BLOBS.LOOP_LUT.hash
  override schema = loopSchema
  override computeLeaf(_index: Array<number>): LeafValues | null {
    const startSeed = Perturbations.randomSeed()
    const x = 10 * VALUE_SCALE
    const y = 50 * VALUE_SCALE
    const vx = 100
    const vy = 0

    const x0 = 50 * VALUE_SCALE
    const x1 = 50 * VALUE_SCALE
    const dt = 1000

    const y0 = 0
    const y1 = 100 * VALUE_SCALE

    const sim = new Simulation(startSeed, true)

    return {
      startSeed,
      x, y, vx, vy,
      x0, x1, dt,
    }
  }
}
