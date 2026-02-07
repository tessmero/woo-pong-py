/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { Barrier } from './barrier'
import { DISK_COUNT, STEP_DURATION, STEPS_BEFORE_BRANCH, VALUE_SCALE } from './constants'
import { Disk } from './disk'
import { collideDisks } from './luts/imp/disk-disk-lut'
import type { Obstacle } from './obstacle'
import { type Rectangle } from 'util/math-util'
import { Perturbations } from './perturbations'
import { DISK_PATTERNS } from 'gfx/disk-gfx-util'
import { Level } from 'level'
import { SimHistory } from './sim-history'

const _disks: Array<[number, number, number, number]> = []
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 2; j++) {
    if (_disks.length === DISK_COUNT) continue
    _disks.push([
      (20 + i * 10), // x position increases by 20 units per disk
      (20 + j * 10), // y position increases by 10 units per disk
      500 - i * 10, // dx decreases by 10 units per disk
      500 + i * 5, // dy increases by 5 units per disk
    ])
  }
}
if (_disks.length !== DISK_COUNT) throw new Error('wrong disk count')

// const outerWallWidth = 100
// const outerWallHeight = 300
// const outerWallXOffset = 0
// const outerWallYOffset = 0

// const _barriers = [
//   // outer walls (smaller shape centered in the original 100x100 square)
//   [outerWallXOffset, outerWallYOffset, thick, outerWallHeight], // left
//   [outerWallXOffset + outerWallWidth - thick, outerWallYOffset, thick, outerWallHeight], // right
//   [outerWallXOffset, outerWallYOffset, outerWallWidth, thick], // top
//   [outerWallXOffset, outerWallYOffset + outerWallHeight, outerWallWidth, thick], // bottom
// ] as const

export class Simulation {
  readonly level: Level
  readonly disks: Array<Disk>
  readonly obstacles: Array<Obstacle>
  // readonly barriers: Array<Barrier>
  readonly finish: Barrier

  branchSeed = -1
  winningDiskIndex = -1 // index of first disk to hit finish

  maxBallY = -Infinity // record lowest y position for any ball so far

  constructor(seed: number) {
    // console.log(`construct simulation with starting seed ${seed}`)

    Perturbations.setSeed(seed)

    this.level = new Level()

    let diskIndex = 0
    this.disks = _disks.map((pars) => {
      const scaledPars = [...pars]
      scaledPars[0] *= VALUE_SCALE
      scaledPars[1] *= VALUE_SCALE
      const disk = Disk.fromJson(scaledPars)
      // disk.style = DISK_STYLES[diskIndex % DISK_STYLES.length]
      disk.pattern = DISK_PATTERNS[diskIndex % DISK_PATTERNS.length]
      diskIndex++
      return disk
    })

    // this.obstacles = _obstacles.map(([pos, shapeName]) => new Obstacle(
    //   pos.map(val => val * VALUE_SCALE) as Vec2,
    //   SHAPE_PATHS[shapeName],
    //   Lut.create('obstacle-lut', shapeName) as ObstacleLut,
    // ))

    this.obstacles = this.level.buildObstacles()

    // this.barriers = _barriers.map(rect =>
    //   new Barrier(...rect.map(val => val * VALUE_SCALE) as Rectangle))
    this.finish = new Barrier(...this.level.finish.map(val => val * VALUE_SCALE) as Rectangle)
  }

  private _stepCount = 0
  get stepCount() { return this._stepCount }
  step() {
    this._stepCount++

    // udpate inner obstacles
    for (const obs of this.obstacles) {
      obs.step()
      // Perturbations.blinkObstacle(obs)
    }

    // collide disks with disks
    for (let a = 1; a < this.disks.length; a++) {
      for (let b = 0; b < a; b++) {
        collideDisks(this.disks[a], this.disks[b])
      }
    }

    // collide disks with barriers
    for (const [diskIndex, disk] of this.disks.entries()) {
      disk.advance(this.obstacles)

      disk.pushInBounds(this.level.bounds)

      Perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching

      disk.nextState.dy += 1 // gravity

      if ((this.winningDiskIndex === -1)
        && this.finish.isTouchingDisk(disk.nextState.x, disk.nextState.y)
      ) {
        // console.log(`disk index ${diskIndex} won after ${this._stepCount} steps`)
        this.winningDiskIndex = diskIndex
      }

      // update lowest Y
      if (disk.nextState.y > this.maxBallY) {
        this.maxBallY = disk.nextState.y
      }
    }

    Disk.flushStates(this.disks) // commit updates after collisions

    // Disk.updateHistory(this.disks) // add to graphical tail

    if (this._stepCount === (STEPS_BEFORE_BRANCH) && this.branchSeed !== -1) {
      // console.log('set mid seed')
      Perturbations.setSeed(this.branchSeed)
      // console.log(`set branch seed ${this.branchSeed} for sim with step count ${this.stepCount}`)
    }
  }

  private t = 0
  update(dt: number, isBranchingAllowed = true) {
    this.t += dt
    const stepIndex = Math.ceil(this.t / STEP_DURATION)

    // // fraction of last step
    // const stepFrac = (this.t - ((stepIndex - 1) * STEP_DURATION)) / STEP_DURATION

    // advance the simulation by n steps
    while (this._stepCount < stepIndex) {
      if ((!isBranchingAllowed) && (this.stepCount >= (STEPS_BEFORE_BRANCH - 2))) {
        this.t = STEP_DURATION * (STEPS_BEFORE_BRANCH - 2)
        break
      }

      this.step()

      SimHistory.takeSnapshot(this)

      // sanityCheck();
    }

    // // compute interpolated positions
    // for (const disk of this.disks) {
    //   disk.stepFrac = stepFrac
    //   disk.interpolatedPos[0] = lerp(disk.lastStepPos[0], disk.currentState.x, stepFrac)
    //   disk.interpolatedPos[1] = lerp(disk.lastStepPos[1], disk.currentState.y, stepFrac)
    // }
    SimHistory.updateDisplay(this)
  }
}
