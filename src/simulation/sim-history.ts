/**
 * @file sim-history.ts
 *
 * Keep track of disk states in recent history of simulation.
 * Used to simulate in advance and suport audio latency correction.
 */

import { topConfig } from 'configs/imp/top-config'
import { DISK_COUNT, LATENCY_LOOK_AHEAD_STEPS, TAIL_STEPS } from './constants'
import type { Simulation } from './simulation'

const entryLength = DISK_COUNT * 2 // xy per disk
const nEntries = LATENCY_LOOK_AHEAD_STEPS + TAIL_STEPS // number of steps to store
const bufferLength = nEntries * entryLength // xy per desk per stored step

const buffer = new Float32Array(bufferLength)

let entryIndex = 0 // index of entry to write on next snapshot

export class SimHistory {
  // set all disks' displayPos with past snapshot
  static updateDisplay(sim: Simulation) {
    const stepsBack = topConfig.flatConfig.audioLatencySteps
    const oldEntryIndex = (entryIndex - 1 - stepsBack + nEntries) % nEntries
    let i = oldEntryIndex * entryLength // index in buffer
    for (const { displayPos } of sim.disks) {
      displayPos[0] = buffer[i++]
      displayPos[1] = buffer[i++]
    }
  }

  // append snapshot of all disks
  static takeSnapshot(sim: Simulation) {
    let i = entryIndex * entryLength // index in buffer
    for (const { currentState } of sim.disks) {
      buffer[i++] = currentState.x
      buffer[i++] = currentState.y
    }

    // advance index for next snapshot
    entryIndex = (entryIndex + 1) % nEntries
  }
}
