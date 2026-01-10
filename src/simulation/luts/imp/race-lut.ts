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
import { DISK_PATTERNS } from 'gfx/disk-gfx'

export type RaceLeaf = Array<number>

const nRaces = 1
const maxStepsTotal = 1e6

export class RaceLut extends Lut<RaceLeaf> {
  static {
    Lut.register('race-lut', {
      factory: () => new RaceLut(),
      depth: 1,
      leafLength: 1 + DISK_COUNT, // 1 start seed + mid seed for each disk
    })
  }

  detail = [nRaces]

  // ts-expect-error race lut
  blobUrl = LUT_BLOBS.RACE_LUT?.url ?? ''

  // ts-expect-error race lut
  blobHash = LUT_BLOBS.RACE_LUT?.hash ?? ''
  computeLeaf(_index: Array<number>) {
    console.log('race-lut comput eleaf')

    const commonStartSeed = Perturbations.randomSeed()
    const midSeeds = Array.from({ length: DISK_COUNT }, () => -1)

    let _simCount = 0
    let _stepCount = 0

    while (midSeeds.some(val => val === -1)) {
      _simCount++

      // run common start
      console.log('race-lut reset sim')
      const sim = new Simulation(commonStartSeed)
      for (let i = 0; i < STEPS_BEFORE_BRANCH; i++) {
        sim.step()
        _stepCount++
      }
      console.log('race-lut finish common start')
      if (sim.winningDiskIndex !== -1) {
        throw new Error('sim already has winning disk before branching')
      }

      // branch, find winning disk, and set the mid seed for that disk
      const branchSeed = Perturbations.randomSeed()
      Perturbations.setSeed(branchSeed)
      console.log('race-lut set branch seed')
      // console.log(`set branch seed ${branchSeed} for sim with step count ${sim.stepCount}`)
      while (sim.winningDiskIndex === -1 && _stepCount < maxStepsTotal) {
        sim.step()
        _stepCount++
      }

      console.log(`got winning disk ${sim.winningDiskIndex}`
        + ` (${DISK_PATTERNS[sim.winningDiskIndex % DISK_PATTERNS.length]}) after ${_stepCount} steps`)

      midSeeds[sim.winningDiskIndex] = branchSeed

      if (_stepCount > maxStepsTotal) {
        break
      }
    }

    // console.log(`found seeds for race with ${DISK_COUNT} disks`
    //   + ` after ${simCount} simulations and ${stepCount} total steps`)

    const result = [commonStartSeed, ...midSeeds]

    // console.log(result)
    return result
  }

  public async loadAll(): Promise<void> {
    await super.loadAll()

    // console.log('race-lut loadAll:', this.tree)
  }
}
