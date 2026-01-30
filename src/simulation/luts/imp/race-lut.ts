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
const maxStepsTotal = 1e7

export type BranchDatum = {
  midSeed: number
  // roomSeqs: Array<Array<number> | null>
}

const leafLength
  = 1 // start seed
    + DISK_COUNT // mid seed for each disk
    // + BOBRICK_COUNT // value for each breakout brick

export class RaceLut extends Lut<RaceLeaf> {
  static {
    Lut.register('race-lut', {
      factory: () => new RaceLut(),
      depth: 1,
      leafLength,
    })
  }

  detail = [nRaces]

  // ts-expect-error race lut
  blobUrl = LUT_BLOBS.RACE_LUT?.url ?? ''

  // ts-expect-error race lut
  blobHash = LUT_BLOBS.RACE_LUT?.hash ?? ''
  // Track stats for reporting and ETA
  private static _raceStats = {
    startTime: Date.now(),
    solved: 0,
    total: nRaces,
    lastReport: Date.now(),
  }

  computeLeaf(index: Array<number>): Array<number> {
    const raceIndex = index[0]
    const stats = RaceLut._raceStats
    if (raceIndex === 0 && stats.solved !== 0) {
      // Reset stats if running again
      stats.startTime = Date.now()
      stats.solved = 0
      stats.lastReport = Date.now()
    }
    console.log(`race-lut leaf ${raceIndex} / ${nRaces}`)// eslint-disable-line no-console
    while (true) {
      const result = _tryComputeLeaf()
      if (result) {
        stats.solved++
        const now = Date.now()
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
            } else if (etaMin > 0) {
              etaStr = `ETA: ${etaMin}m ${etaSec}s.`
            } else {
              etaStr = `ETA: ${etaSec}s.`
            }
          } else {
            etaStr = 'All races complete!'
          }
          console.log(
            `[race-lut] Solved ${stats.solved}/${stats.total} races. ` +
            `Elapsed: ${elapsed.toFixed(1)}s. ` +
            etaStr
          )
        }
        return result
      }
    }
  }

  public async loadAll(): Promise<void> {
    await super.loadAll()

    // console.log('race-lut loadAll:', this.tree)
  }
}

let nextSeed = Perturbations.randomSeed()

function _tryComputeLeaf(): Array<number> | null {
  // console.log('race-lut comput eleaf')

  const commonStartSeed = nextSeed++
  const branches: Array<BranchDatum> = Array.from(
    { length: DISK_COUNT },
    () => ({ midSeed: -1, roomSeqs: [] }),
  )

  // // skip simulations and return dummy race-lut
  // return [
  //   commonStartSeed,
  //   ...branches.map(({ midSeed }) => midSeed),
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
      sim.step()
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
      sim.step()
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

    branches[sim.winningDiskIndex] = {
      midSeed: branchSeed,
      // roomSeqs: roomSeqs,
    }

    if (_stepCount > maxStepsTotal) {
      break
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

  const result = [
    commonStartSeed,
    ...branches.map(({ midSeed }) => midSeed),
    // ...breakoutSolution,
  ]

  if (result.length !== leafLength) {
    throw new Error(`result length (${result.length}) doesn't match leaf length ${leafLength}`)
  }

  // console.log(result)
  // eslint-disable-next-line no-console
  console.log(`solved race with start seed ${commonStartSeed}`)
  return result
}
