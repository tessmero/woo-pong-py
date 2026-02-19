/**
 * @file race-lut.ts
 *
 * Race lut.
 */

import { LUT_BLOBS } from 'set-by-build'
import { Lut, i32 } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import { DISK_COUNT, HISTORY_MAX_STEPS, INT32_MAX, STEPS_BEFORE_BRANCH } from 'simulation/constants'
import { Perturbations } from 'simulation/perturbations'
import { Simulation } from 'simulation/simulation'
import { GAS_BOX_SOLVE_STEPS } from 'simulation/gas-box/gas-box-constants'
import { step } from 'simulation/sim-step'

export type RaceLeaf = LeafValues

const nRaces = 1
const maxStepsTotal = 1e7

export type BranchDatum = {
  midSeed: number
  finalStepCount: number
}

/** Schema: startSeed (i32) + per-disk midSeed (i32) and finalStepCount (i32). */
const raceSchema: LeafSchema = [
  i32('startSeed'),
  ...Array.from({ length: DISK_COUNT }, (_, d) => [
    i32(`d${d}_midSeed`), i32(`d${d}_finalStepCount`),
  ]).flat(),
]

export class RaceLut extends Lut {
  static {
    Lut.register('race-lut', {
      factory: () => new RaceLut(),
      depth: 1,
      schema: raceSchema,
    })
  }

  schema = raceSchema
  detail = [nRaces]

  // ts-expect-error race lut
  blobUrl = LUT_BLOBS.RACE_LUT?.url ?? ''

  // ts-expect-error race lut
  blobHash = LUT_BLOBS.RACE_LUT?.hash ?? ''
  // Track stats for reporting and ETA
  private static _raceStats = {
    startTime: performance.now(),
    solved: 0,
    total: nRaces,
    lastReport: performance.now(),
  }

  computeLeaf(index: Array<number>): LeafValues {
    const raceIndex = index[0]
    const stats = RaceLut._raceStats
    if (raceIndex === 0 && stats.solved !== 0) {
      // Reset stats if running again
      stats.startTime = performance.now()
      stats.solved = 0
      stats.lastReport = performance.now()
    }
    console.log(`race-lut leaf ${raceIndex} / ${nRaces}`)// eslint-disable-line no-console
    while (true) {
      const result = _tryComputeLeaf()
      if (result) {
        stats.solved++
        const now = performance.now()
        const elapsed = (now - stats.startTime) / 1000 // seconds
        const avgPerRace = elapsed / stats.solved
        const remaining = stats.total - stats.solved
        const eta = avgPerRace * remaining
        // Only print if at least 1s since last report or last race
        if (now - stats.lastReport > 1000 || stats.solved === stats.total) {
          stats.lastReport = now
          let etaStr = ''
          if (remaining > 0) {
            const etaH = Math.floor(eta / 3600)
            const etaMin = Math.floor((eta % 3600) / 60)
            const etaSec = Math.round(eta % 60)
            if (etaH > 0) {
              etaStr = `ETA: ${etaH}h ${etaMin}m ${etaSec}s.`
            }
            else if (etaMin > 0) {
              etaStr = `ETA: ${etaMin}m ${etaSec}s.`
            }
            else {
              etaStr = `ETA: ${etaSec}s.`
            }
          }
          else {
            etaStr = 'All races complete!'
          }

          // eslint-disable-next-line no-console
          console.log(
            `[race-lut] Solved ${stats.solved}/${stats.total} races. `
            + `Elapsed: ${elapsed.toFixed(1)}s. `
            + etaStr,
          )
        }

        // console.log('solved race', result)

        return result
      }
    }
  }

  public override async loadAll(): Promise<void> {
    await super.loadAll()

    // console.log('race-lut loadAll:', this.tree)
  }
}

let nextSeed = Perturbations.randomSeed()

function _tryComputeLeaf(): LeafValues | null {
  // console.log('race-lut comput eleaf')

  const commonStartSeed = nextSeed++
  const branches: Array<BranchDatum> = Array.from(
    { length: DISK_COUNT },
    () => ({ midSeed: -1, finalStepCount: INT32_MAX }),
  )

  // // return dummy race-lut to skip simulations
  // return [
  //   commonStartSeed,
  //   ...branches.flatMap(() => [12345,INT32_MAX]),
  //   // ...breakoutSolution,
  // ]

  console.log(`attempting to solve race with start seed ${commonStartSeed}...`)// eslint-disable-line no-console

  let _simCount = 0
  let _stepCount = 0

  while (branches.some(({ midSeed }) => midSeed === -1)) {
    _simCount++

    // run common start
    // console.log('race-lut reset sim')
    const sim = new Simulation(commonStartSeed)
    for (let i = 0; i < STEPS_BEFORE_BRANCH; i++) {
      step(sim)
      _stepCount++
    }
    // console.log('race-lut finish common start')
    if (sim.winningDiskIndex !== -1) {
      throw new Error('sim already has winning disk before branching')
    }

    // branch, find winning disk, and set the mid seed for that disk
    const branchSeed = Perturbations.randomSeed()
    Perturbations.setSeed(branchSeed)
    // console.log('race-lut set branch seed')
    // console.log(`set branch seed ${branchSeed} for sim with step count ${sim.stepCount}`)
    while (sim.winningDiskIndex === -1 && _stepCount < maxStepsTotal) {
      step(sim)
      _stepCount++
    }

    // console.log(`got winning disk ${sim.winningDiskIndex}`
    //   + ` (${DISK_PATTERNS[sim.winningDiskIndex % DISK_PATTERNS.length]}) after ${_stepCount} steps`)

    // // get breakout sequences
    // const roomSeqs: Array<Array<number> | null> = []
    // for (const [_roomIndex, room] of sim.level.rooms.entries()) {
    //   if (room instanceof BreakoutRoom) {
    //     // console.log(`breakout room at index ${roomIndex} had sequence ${JSON.stringify(room.hitSequence)}`)
    //     roomSeqs.push(room.hitSequence)
    //   }
    //   else {
    //     roomSeqs.push(null)
    //   }
    // }

    // make sure level solution leaves enough time for gas box to resolve
    const minSteps = STEPS_BEFORE_BRANCH + GAS_BOX_SOLVE_STEPS
    if (sim.stepCount < (minSteps)) {
      // throw new Error(`level finished ${minSteps - sim.stepCount} steps too early`)

      // eslint-disable-next-line no-console
      console.log(`level finished ${minSteps - sim.stepCount} steps too early`)

      break // give up on this starting seed
    }

    if (sim.stepCount > HISTORY_MAX_STEPS) {
      console.log(`level ran ${sim.stepCount - HISTORY_MAX_STEPS} steps too long`)
      continue // don't use this branch as a solution
    }

    // record this solution as a branch
    branches[sim.winningDiskIndex] = {
      midSeed: branchSeed,
      finalStepCount: sim.stepCount,
      // roomSeqs: roomSeqs,
    }

    // use as dummy data for all disks to trigger early finish
    for (let i = 0; i < DISK_COUNT; i++) {
      branches[i] = branches[sim.winningDiskIndex]
    }

    if (_stepCount > maxStepsTotal) {
      // console.log('')
      break // give up on this starting seed, taking too long to find all branches
    }
  }

  if (branches.some(({ midSeed }) => midSeed === -1)) {
    // leaf failed
    console.log(`failed race with start seed ${commonStartSeed}`)// eslint-disable-line no-console
    return null
  }

  // // solve breakout room
  // let breakoutSolution: Array<number> = []
  // for (let roomIndex = 0; roomIndex < ROOM_COUNT; roomIndex++) {
  //   if (branches.some(branch => branch.roomSeqs[roomIndex])) {
  //     console.log('computing breakout room at index', roomIndex)
  //     // if (branches.some(branch => !branch.roomSeqs[roomIndex])) {
  //     //   throw new Error('branches have breakout rooms at different indices')
  //     // }
  //   }
  //   else {
  //     continue // room is not breakout room
  //   }
  //   const branchSequences = branches.map((branch,branchIndex) => {
  //     const result =branch.roomSeqs[roomIndex] as Array<number>
  //     if( !result ) throw new Error(`branch at index ${branchIndex} has no seq`)
  //     console.log(`branch at index ${branchIndex} has seq ${JSON.stringify(result)}`)
  //     return result
  //   }).filter(Boolean)
  //   breakoutSolution = BreakoutRoom.solve(branchSequences)
  //   console.log(branchSequences)
  //   console.log('solution:', breakoutSolution)
  // }

  // console.log(`found seeds for race with ${DISK_COUNT} disks`
  //   + ` after ${simCount} simulations and ${stepCount} total steps`)

  const result: LeafValues = { startSeed: commonStartSeed }
  for (let d = 0; d < DISK_COUNT; d++) {
    result[`d${d}_midSeed`] = branches[d].midSeed
    result[`d${d}_finalStepCount`] = branches[d].finalStepCount
  }

  // console.log(result)
  // eslint-disable-next-line no-console
  console.log(`solved race with start seed ${commonStartSeed}`)

  // _verifyRace(commonStartSeed, branches)

  return result
}

function _verifyRace(
  commonStartSeed: number,
  branches: Array<BranchDatum>,
): void {
  for (const [winningDiskIndex, { midSeed }] of branches.entries()) {
    const sim = new Simulation(commonStartSeed)
    // const hashes: Record<number, number> = {}
    for (let i = 0; i < STEPS_BEFORE_BRANCH; i++) {
      step(sim)
      // if (sim.stepCount % HASH_STEP_INTERVAL === 0) {
      //   hashes[sim.stepCount] = computeSimHash(sim)
      // }
    }
    if (sim.winningDiskIndex !== -1) {
      throw new Error('failed verification (win before branching)')
    }
    const branchSeed = midSeed
    Perturbations.setSeed(branchSeed)
    while (sim.winningDiskIndex === -1 && sim.stepCount < maxStepsTotal) {
      step(sim)
      // if (sim.stepCount % HASH_STEP_INTERVAL === 0) {
      //   hashes[sim.stepCount] = computeSimHash(sim)
      // }
    }
    // // also hash at the winning step
    // hashes[sim.stepCount] = computeSimHash(sim)

    if (sim.winningDiskIndex !== winningDiskIndex) {
      throw new Error('failed verification (wrong winning disk)')
    }

    // // store hashes for disk 0 (the default runtime branch)
    // if (winningDiskIndex === 0 as number) {
    //   _collectedHashes = {
    //     startSeed: commonStartSeed,
    //     branchSeed: midSeed,
    //     hashes,
    //   }
    // }
  }
}

// let _collectedHashes: {
//   startSeed: number
//   branchSeed: number
//   hashes: Record<number, number>
// } | null = null

// /** Called by rebuild-blobs.ts to retrieve hashes computed during verification. */
// export function getCollectedSimHashes() {
//   return _collectedHashes
// }
