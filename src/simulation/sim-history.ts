/**
 * @file sim-history.ts
 *
 * Keep track of disk states in recent history of simulation.
 * Used to simulate in advance and suport audio latency correction.
 */

import { topConfig } from 'configs/imp/top-config'
import { DISK_COUNT, LATENCY_LOOK_AHEAD_STEPS, TAIL_STEPS } from './constants'
import type { Simulation } from './simulation'
import type { Vec2 } from 'util/math-util'
import { GfxRegion } from 'gfx/gfx-region'
import type { ScrollbarGfx } from 'gfx/imp/scrollbar-gfx'
import { playImpact, playSound } from 'audio/collision-sounds'

const entryLength = DISK_COUNT * 2 // xy per disk
const nEntries = LATENCY_LOOK_AHEAD_STEPS + TAIL_STEPS // number of steps to store
const bufferLength = nEntries * entryLength // xy per desk per stored step

const buffer = new Float32Array(bufferLength)

let entryIndex = 0 // index of entry to write on next snapshot

const dummy: Vec2 = [0, 0]

const tailEps = 0// 0.1 * DISK_RADIUS // skip drawing tail segments within eps of neighbors

export class SimHistory {
  // set all disks' displayPos with past snapshot
  static updateDisplay(sim: Simulation) {
    const stepsBack = topConfig.flatConfig.audioLatencySteps

    // update disks
    let diskIndex = 0
    for (const { displayPos } of sim.disks) {
      SimHistory.getPos(diskIndex++, stepsBack, displayPos)
    }

    // update obstacles
    const displayStep = sim.stepCount - stepsBack
    // console.log('update obstacles display step:', displayStep)
    for (const obs of sim.obstacles) {
      if (obs.isHidden) continue
      if (obs.hideOnStep === -1) continue
      if (displayStep >= obs.hideOnStep) {

        obs.isHidden = true

        // clear rectangle in scrollbar obstacle graphics buffer
        ;(GfxRegion.create('scrollbar-gfx') as ScrollbarGfx).hideObstacle(obs)
      } else {
        // // obstacle will be hidden soon
        // console.log(`obstacle not yet actually hidden (${obs.hideOnStep} < ${displayStep})`)
      }
    }
  }

  static getPos(diskIndex: number, stepsBack: number, out = dummy): Vec2 {
    const oldEntryIndex = (entryIndex - 1 - stepsBack + nEntries) % nEntries
    let i = oldEntryIndex * entryLength + 2 * diskIndex// index in buffer
    out[0] = buffer[i++]
    out[1] = buffer[i++]
    return out
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

  // x,y,cumulative distance along graphical tail
  static tail(diskIndex: number): Array<[number, number, number]> {
    const result: Array<[number, number, number]> = []
    let lastX = 0
    let lastY = 0
    let cumulativeDistance = 0
    let lastDrawnCumDist = 0
    const stepsBack = topConfig.flatConfig.audioLatencySteps
    for (let i = 0; i < TAIL_STEPS; i += 10) {
      const [x, y] = SimHistory.getPos(diskIndex, stepsBack + i)
      // const x = this._history[realIndex]
      // const y = this._history[realIndex + 1]

      if (i > 0) {
        const segLen = Math.hypot(x - lastX, y - lastY)
        cumulativeDistance += segLen
      }
      lastX = x
      lastY = y

      if (
        ((cumulativeDistance - lastDrawnCumDist) < tailEps)
        && (i < (TAIL_STEPS - 1))
      ) {
        // skip drawing small segment

      }
      else {
        result.push([Math.round(x), Math.round(y), Math.round(cumulativeDistance)])
        lastDrawnCumDist = cumulativeDistance
      }
    }
    return result
  }
}
