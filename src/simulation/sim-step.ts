/**
 * @file sim-step.ts
 *
 * Sim step function.
 */

import type { Simulation } from './simulation'
import { Perturbations } from './perturbations'
import { collideDisks } from './luts/imp/disk-disk-lut'
import { Disk } from './disk'
import { HISTORY_CHECKPOINT_STEPS, STEPS_BEFORE_BRANCH } from './constants'
import { Serializer } from 'simulation/serializer'
import { StartLayout } from 'rooms/start-layouts/start-layout'
import type { Vec2 } from 'util/math-util'

let didDebugStart = false

export function step(sim: Simulation) {
  // debug
  if (!didDebugStart) {
    didDebugStart = true
    // Timeline.toggle(false)
    // console.log(`start sim with step count ${sim.stepCount}`)
  }

  if ((sim._stepCount >= 0) && (sim._stepCount % HISTORY_CHECKPOINT_STEPS === 0)) {
    Serializer.passCheckpoint(sim) // save keyframe for rewinding
  }

  sim._stepCount++
  sim._maxStepCount = Math.max(sim._stepCount, sim._maxStepCount)

  // if (sim._stepCount > sim.finalStepCount) {
  //   return // prevent simulating past the moment a disk wins
  // }

  if (sim._stepCount < 0) {
    _startStep(sim)
    return
  }

  // if (sim._stepCount + GAS_BOX_SOLVE_STEPS === sim.finalStepCount) {
  //   const diskIndex = sim.selectedDiskIndex
  //   const disk = sim.disks[diskIndex]
  //   const solutionIndex = disk ? PATTERN.NAMES.indexOf(disk.pattern) : 0
  //   // console.log('start final simulation for gas box', solutionIndex)
  //   sim.gasBoxes[0].setFinalSimulation(new GasBoxSim(solutionIndex))
  // }

  if (sim._stepCount === (STEPS_BEFORE_BRANCH) && sim.branchSeed !== -1) {
    // console.log('set mid seed')
    Perturbations.setSeed(sim.branchSeed)
    // console.log(`set branch seed ${sim.branchSeed} for sim with step count ${sim.stepCount}`)
  }
  else if (sim._stepCount === (STEPS_BEFORE_BRANCH)) {
    throw new Error('reached steps_before_branch wtih no branchSeed')
  }

  _activeStep(sim)
}

const pos: Vec2 = [0, 0]

// t<0 scripted step
function _startStep(sim: Simulation) {
  const startLayout = StartLayout.create(sim.level.startLayout)
  for (const [diskIndex, disk] of sim.disks.entries()) {
    startLayout.getAnimPos(diskIndex, sim.stepCount, pos)
    disk.currentState.x = pos[0]
    disk.currentState.y = pos[1]
  }
  // // // update rooms
  // for (const room of sim.level.rooms) {
  //   room.update(sim.stepCount)
  // }
}

// t<0 regular real-physics step
function _activeStep(sim: Simulation) {
  // // update rooms
  for (const room of sim.level.rooms) {
    room.update(sim, sim.stepCount)
  }

  // // update gas boxes
  // for (const box of sim.gasBoxes) {
  //   box.step()
  // }

  // // udpate inner obstacles
  // for (const obs of sim.obstacles) {
  //   obs.step()
  //   // Perturbations.blinkObstacle(obs)
  // }

  // collide disks with barriers
  for (const [_diskIndex, disk] of sim.disks.entries()) {
    // //debug
    // console.log(`update disk with x ${disk.currentState.x}`)

    disk.advance(sim.obstacles, sim.stepCount)
    disk.pushInBounds(sim)
    Perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching

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
    }

    // update lowest Y
    if (disk.nextState.y > sim.maxBallY) {
      sim.maxBallY = disk.nextState.y
    }
  }

  Disk.flushStates(sim.disks) // commit updates after collisions

  // // check determinism hash at interval steps
  // checkSimHash(sim)

  // Disk.updateHistory(sim.disks) // add to graphical tail
}
