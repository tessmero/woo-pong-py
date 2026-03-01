/**
 * @file sim-step.ts
 *
 * Sim step function.
 */

import type { Simulation } from './simulation'
import { Perturbations } from './perturbations'
import { collideDisks } from './luts/imp/disk-disk-lut'
import { Disk } from './disk'
import { DISK_RADIUS, HISTORY_CHECKPOINT_STEPS, STEPS_BEFORE_BRANCH, VALUE_SCALE } from './constants'
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

// Self-contained Python implementation of activeStep and Perturbations, as a string for export
export const PY_ACTIVE_STEP = `

VALUE_SCALE = ${VALUE_SCALE}
DISK_RADIUS = ${DISK_RADIUS}
BOUNDS_X = 0
BOUNDS_Y = 0
BOUNDS_W = 100 * VALUE_SCALE
BOUNDS_H = 100 * VALUE_SCALE

def pushInBounds(state, radius=0):
  # Clamp disk position to within bounds, and reflect velocity if out of bounds
  bounced = False
  if state.x < BOUNDS_X + radius:
    state.x = BOUNDS_X + radius
    state.dx = abs(state.dx)
    bounced = True
  elif state.x > BOUNDS_X + BOUNDS_W - radius:
    state.x = BOUNDS_X + BOUNDS_W - radius
    state.dx = -abs(state.dx)
    bounced = True
  if state.y < BOUNDS_Y + radius:
    state.y = BOUNDS_Y + radius
    state.dy = abs(state.dy)
    bounced = True
  elif state.y > BOUNDS_Y + BOUNDS_H - radius:
    state.y = BOUNDS_Y + BOUNDS_H - radius
    state.dy = -abs(state.dy)
    bounced = True
  return bounced
import numpy as np

# Assumptions:
# - sim.disks: list of Disk objects, each with .currentState and .nextState (with x, y, dx, dy)
# - sim.winningDiskIndex, sim.maxBallY, sim.finish, sim._stepCount exist
# - collide_disks(a, b, DISK_DISK_LUT) is available
# - No obstacles, no rooms
Perturbations = {
  "minSpeed": 10,
  "state": 0,
}

def randomSeed():
  import numpy as np
  return int(np.random.rand() * 32000)

def setSeed(seed):
  Perturbations["state"] = int(seed)

def getSeed():
  return Perturbations["state"]

def _makePRNG(seed):
  Perturbations["state"] = int(seed) or 1
  def nextInt():
    Perturbations["state"] ^= (Perturbations["state"] << 13) & 0xFFFFFFFF
    Perturbations["state"] ^= (Perturbations["state"] >> 17)
    Perturbations["state"] ^= (Perturbations["state"] << 5) & 0xFFFFFFFF
    Perturbations["state"] &= 0xFFFFFFFF
    return Perturbations["state"]
  return nextInt

Perturbations["nextInt"] = _makePRNG(randomSeed())

def perturbDisk(state):
  # dx
  if abs(state.dx) > Perturbations["minSpeed"]:
    d6 = (Perturbations["nextInt"]() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dx += 1
    elif d6 == 1:
      state.dx -= 1
  # dy
  if abs(state.dy) > Perturbations["minSpeed"]:
    d6 = (Perturbations["nextInt"]() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dy += 1
    elif d6 == 1:
      state.dy -= 1

def advance(disk):
    disk.nextState.x = disk.currentState.x + disk.currentState.dx
    disk.nextState.y = disk.currentState.y + disk.currentState.dy

def flushStates(disks):
    for disk in disks:
        disk.currentState.x = disk.nextState.x
        disk.currentState.y = disk.nextState.y
        disk.currentState.dx = disk.nextState.dx
        disk.currentState.dy = disk.nextState.dy

def active_step(sim, DISK_DISK_LUT):
    # Collide disks with barriers (not present)
    for disk in sim.disks:
        advance(disk)
        pushInBounds(disk.nextState) # force in bounds and bounce
        perturbDisk(disk.nextState)
        disk.nextState.dy += 1  # gravity

    # Collide disks with disks
    for a in range(1, len(sim.disks)):
        for b in range(a):
            collide_disks(sim.disks[a], sim.disks[b], DISK_DISK_LUT)

    flushStates(sim.disks)  # commit updates after collisions
`
