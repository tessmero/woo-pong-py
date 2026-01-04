/**
 * @file race-lut.ts
 *
 * Race lut.
 */

import { LUT_BLOBS } from 'set-by-build'
import { Lut } from '../lut'
import { DISK_COUNT, STEPS_BEFORE_BRANCH } from 'simulation/constants'
import { Perturbations } from 'simulation/perturbations'
import { Simulation } from 'simulation/simulation'

export type RaceLeaf = Array<number>

const nRaces = 1

export class RaceLut extends Lut<RaceLeaf> {
  static {
    Lut.register('race-lut', {
      factory: () => new RaceLut(),
      depth: 1,
      leafLength: 1 + DISK_COUNT, // 1 start seed + mid seed for each disk
    })
  }

  detail = [nRaces]

  // @ts-expect-error race lut
  blobUrl = LUT_BLOBS.RACE_LUT?.url ?? ''

  // @ts-expect-error race lut
  blobHash = LUT_BLOBS.RACE_LUT?.hash ?? ''
  computeLeaf(_index: Array<number>) {
    const commonStartSeed = Perturbations.randomSeed()
    const midSeeds = Array.from({ length: DISK_COUNT }, () => -1)

    let simCount = 0
    let stepCount = 0

    while (midSeeds.some(val => val === -1)) {
      simCount++

      // run common start
      Perturbations.setSeed(commonStartSeed)
      const sim = new Simulation()
      for (let i = 0; i < STEPS_BEFORE_BRANCH; i++) {
        sim.step()
        stepCount++
      }
      if (sim.winningDiskIndex !== -1) {
        throw new Error('sim already has winning disk before branching')
      }

      // branch, find winning disk, and set the mid seed for that disk
      const branchSeed = Perturbations.randomSeed()
      Perturbations.setSeed(branchSeed)
      while (sim.winningDiskIndex === -1) {
        sim.step()
        stepCount++
      }
      midSeeds[sim.winningDiskIndex] = branchSeed
    }

    console.log(`found seeds for race with ${DISK_COUNT} disks`
      + ` after ${simCount} simulations and ${stepCount} total steps`)

    return [commonStartSeed, ...midSeeds]
  }
}
