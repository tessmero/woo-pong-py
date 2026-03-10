/**
 * @file serializer.ts
 *
 * Keep track of complete state at regular checkpoints.
 */

import { DISK_COUNT, HISTORY_CHECKPOINT_STEPS, HISTORY_MAX_ENTRIES, STEP_DURATION } from './constants'
import { Disk } from './disk'
import { Perturbations } from './perturbations'
import type { Simulation } from './simulation'

// const dummy: Vec2 = [0, 0]

const stepInterval = HISTORY_CHECKPOINT_STEPS // steps between checkpoints
const nEntries = HISTORY_MAX_ENTRIES // number of checkpoints to store

const entryLength = DISK_COUNT * 2
const pos = new Int32Array(nEntries * entryLength) // x,y per disk
const vel = new Int16Array(nEntries * entryLength) // dx,dy per disk
const seeds = new Int32Array(nEntries) // rng state seed

let _lastEntryIndex = -1
export class Serializer {
  static reset() {
    _lastEntryIndex = -1
  }

  // used just for loop room
  static captureLoopCheckpoint(sim: Simulation, entryIndex: number) {
    const seed = Perturbations.getSeed()
    _captureCheckpoint(sim, entryIndex, seed)
  }

  // called when periodic checkpoint times are reached
  static passCheckpoint(sim: Simulation) {
    // if (sim.isLoop) return // no regular checkpoints for loop sim
    const seed = Perturbations.getSeed()

    // assert this is a valid step to serialize the sim
    const entryIndex = sim.stepCount / stepInterval
    if (!Number.isInteger(entryIndex)) {
      throw new Error(`cannot serialize sim with stepCount ${sim.stepCount}. 
        Should be a multiple of ${stepInterval}`)
    }

    if (entryIndex <= _lastEntryIndex) {
      // console.log('already passed checkpoint', entryIndex)

      // // already passed this checkpoint

      // // verify seed and disk states
      // _verify(sim, entryIndex, seed)

      // already passed checkpoint, and current state checks out
      return // do nothing
    }

    // reached a new checkpoint
    // assert that we are up-to-date on previous checkpoints
    if (entryIndex !== (_lastEntryIndex + 1)) {
      throw new Error(`previous checkpoint was skipped`)
    }
    _lastEntryIndex = entryIndex

    // capture
    _captureCheckpoint(sim, entryIndex, seed)
    // Perturbations.nextInt()
  }

  static restore(sim: Simulation, entryIndex: number) {
  // console.log(`restore serialized sim entry ${entryIndex} with seed ${seeds[entryIndex]}`)

    Perturbations.setSeed(seeds[entryIndex])
    sim._stepCount = entryIndex * HISTORY_CHECKPOINT_STEPS
    sim.t = sim._stepCount * STEP_DURATION

    let i = entryLength * entryIndex
    let isFirst = true
    for (const disk of sim.disks) {
      disk.nextState.x = pos[i]
      disk.nextState.y = pos[i + 1]
      disk.nextState.dx = vel[i]
      disk.nextState.dy = vel[i + 1]
      if (isFirst) {
        isFirst = false
      }
      // const { x, y, dx, dy } = disk.nextState
      // console.log('restore disk state', x, y, dx, dy)

      i += 2
    }
    Disk.flushStates(sim.disks)
  }
}

export function _verify(sim: Simulation, entryIndex: number, seed: number) {
  // // verify seed
  if (seed !== seeds[entryIndex]) {
    throw new Error('reached checkpoint with different seed again after rewinding')
  }

  // verify disk states
  let i = entryLength * entryIndex
  let isFirst = true
  for (const disk of sim.disks) {
    const { x } = disk.currentState
    if (isFirst) {
      isFirst = false
      // console.log('verify disk state', x, y, dx, dy)
    }
    if (pos[i] !== x) {
      throw new Error('reached checkpoint with different x after rewinding')
    }
    i += 2
  }
}

function _captureCheckpoint(sim: Simulation, entryIndex: number, seed: number) {
  // console.log(`capture serialized sim entry ${entryIndex} with seed ${seed}`)

  seeds[entryIndex] = seed

  // capture disk states
  let i = entryLength * entryIndex
  let isFirst = true
  for (const disk of sim.disks) {
    const { x, y, dx, dy } = disk.currentState
    if (isFirst) {
      isFirst = false
    }
    // console.log(`on step ${sim._stepCount}, captured disk state `, x, y, dx, dy)
    pos[i] = x
    pos[i + 1] = y
    vel[i] = dx
    vel[i + 1] = dy
    i += 2
  }
}
