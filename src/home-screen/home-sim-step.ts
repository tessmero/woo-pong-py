/**
 * @file home-sim-step.ts
 *
 * Repalces sim-step function for home screen simulation.
 */

import { dirxml } from 'console'
import { Disk } from 'simulation/disk'
import { collideDisks } from 'simulation/luts/imp/disk-disk-lut'
import type { Simulation } from 'simulation/simulation'

export function homeSimStep(sim: Simulation) {
  sim._stepCount++
  _activeStep(sim)
}

// t<0 regular real-physics step
function _activeStep(sim: Simulation) {

  // collide disks with obstacles
  for (const [_diskIndex, disk] of sim.disks.entries()) {
    // //debug
    // console.log(`update disk with x ${disk.currentState.x}`)

    disk.advance(sim.obstacles, sim.stepCount)
    disk.pushInBounds(sim)
    sim.perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching

    // if( !sim.isLoop ) {
    disk.nextState.dy += 1 // gravity
    // }
  }

  // collide disks with disks
  for (let a = 1; a < sim.disks.length; a++) {
    for (let b = 0; b < a; b++) {
      collideDisks(sim.disks[a], sim.disks[b])
    }
  }

  // update stats
  for (const [diskIndex, disk] of sim.disks.entries()) {
    if ((sim.winningDiskIndex === -1)
      && sim.finish.isTouchingDisk(disk.nextState.x, disk.nextState.y)
    ) {
      // console.log(`disk index ${diskIndex} won after ${sim._stepCount} steps`)
      sim.winningDiskIndex = diskIndex
      sim.seedUponWinning = sim.perturbations.getSeed()
    }
  }

  Disk.flushStates(sim.disks) // commit updates after collisions

  // // check determinism hash at interval steps
  // checkSimHash(sim)

  // Disk.updateHistory(sim.disks) // add to graphical tail
}
