/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { Barrier } from './barrier'
import { DISK_COUNT, INT32_MAX, STEP_DURATION, STEPS_BEFORE_BRANCH, VALUE_SCALE } from './constants'
import { Disk } from './disk'
import type { Obstacle } from './obstacle'
import { type Rectangle } from 'util/math-util'
import { Perturbations } from './perturbations'
import { Level } from 'level'
import { SimHistory } from './sim-short-history'
import { SHUFFLED_PATTERN_NAMES } from 'imp-names'
import { START_LAYOUT_POSVELS } from 'rooms/start-layouts/set-by-build'
import { step } from './sim-step'
import { Serializer } from './serializer'
import { StartLayout } from 'rooms/start-layouts/start-layout'

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
  // readonly gasBoxes: Array<GasBox>
  // readonly barriers: Array<Barrier>
  readonly finish: Barrier

  finalStepCount = INT32_MAX

  branchSeed = -1
  selectedDiskIndex = -1 // index of first disk to hit finish
  winningDiskIndex = -1 // index of first disk to hit finish

  /** Expected hashes at interval steps, set from build-time data for determinism checking. */
  expectedHashes: Record<number, number> | null = null

  maxBallY = -Infinity // record lowest y position for any ball so far

  public _stepCount: number// = -1000
  public _maxStepCount = -1e8
  get stepCount() { return this._stepCount }
  public t: number// = this._stepCount * STEP_DURATION

  constructor(seed: number) {
    // console.log(`construct simulation with starting seed ${seed}`)

    Perturbations.setSeed(seed)

    this.level = new Level()
    const sl = StartLayout.create(this.level.startLayout)
    const animDur = sl.animDur
    this._stepCount = -animDur
    this.t = this._stepCount * STEP_DURATION
    // console.log(`got anim dur ${animDur} for start layout ${this.level.startLayout}`)

    const posVels = START_LAYOUT_POSVELS[this.level.startLayout]

    // let diskIndex = 0
    // this.disks = _disks.map((pars) => {
    this.disks = Array.from({ length: DISK_COUNT }, (_, diskIndex) => {
      // const scaledPars = [...pars]
      // scaledPars[0] *= VALUE_SCALE
      // scaledPars[1] *= VALUE_SCALE
      // const disk = Disk.fromJson(scaledPars)
      const [[x, y], [vx, vy]] = posVels[diskIndex]
      const disk = Disk.fromJson([x, y, vx, vy])
      disk.pattern = SHUFFLED_PATTERN_NAMES[diskIndex % SHUFFLED_PATTERN_NAMES.length]
      // diskIndex++
      return disk
    })

    // this.obstacles = _obstacles.map(([pos, shapeName]) => new Obstacle(
    //   pos.map(val => val * VALUE_SCALE) as Vec2,
    //   SHAPE_PATHS[shapeName],
    //   Lut.create('obstacle-lut', shapeName) as ObstacleLut,
    // ))

    this.obstacles = this.level.buildObstacles()
    // this.gasBoxes = this.level.buildGasBoxes()

    // this.barriers = _barriers.map(rect =>
    //   new Barrier(...rect.map(val => val * VALUE_SCALE) as Rectangle))
    this.finish = new Barrier(...this.level.finish.map(val => val * VALUE_SCALE) as Rectangle)

    Serializer.reset()
  }

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

      step(this)

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
