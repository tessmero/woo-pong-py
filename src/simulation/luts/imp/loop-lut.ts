/**
 * loop-lut.ts
 *
 * Time travel loops.
 */

import { LUT_BLOBS } from 'set-by-build'
import type { LeafSchema, LeafValues } from '../lut'
import { i16, i32, Lut } from '../lut'
import { Perturbations } from 'simulation/perturbations'
import { VALUE_SCALE } from 'simulation/constants'
import { Simulation } from 'simulation/simulation'
import { step } from 'simulation/sim-step'
import { LoopError, LoopRoom } from 'rooms/imp/loop-room'

const loopSchema: LeafSchema = [
  i32('startSeed'), // prng seed
  i32('startX'), i32('startY'), i16('startVx'), i16('startVy'), // starting disk state
  i32('spawnX'), i32('spawnY'), i16('spawnVx'), i16('spawnVy'), // spawning/looping disk state
  i32('topPortalX'), // x-position of top portal
  i16('stepsBack'), // steps of backwards time travel
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
    const startX = 10 * VALUE_SCALE
    const startY = 50 * VALUE_SCALE
    const startVx = 100
    const startVy = 0

    const spawnX = 414402
    const spawnY = 205
    const spawnVx = 0
    const spawnVy = 0



    const topPortalX = 50 * VALUE_SCALE // can vary by +- 25 * VALUE_SCALE
    const stepsBack = 1000 // can vary by +- 100

    const x1 = 50 * VALUE_SCALE
    const dt = 1000

    const y0 = 0
    const y1 = 100 * VALUE_SCALE

    LoopRoom.topPortalX = topPortalX
    LoopRoom.stepsBack = stepsBack
    const sim = new Simulation(startSeed, true)
    while (true) {
      try {
        step(sim)
        if (sim.loopDiskIndex === 1) {
          // looped successfully (no error)
          break
        }
      }
      catch (error) {
        if (error instanceof LoopError) {
          console.log('Got loop error:', JSON.stringify(error.params))
        }
        break
      }
    }

    return {
      startSeed,
      startX, startY, startVx, startVy,
      spawnX, spawnY, spawnVx, spawnVy,
      topPortalX, stepsBack,
    }
  }
}
