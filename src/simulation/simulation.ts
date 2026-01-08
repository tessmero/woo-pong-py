/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { topConfig } from 'configs/imp/top-config'
import { Barrier } from './barrier'
import { DISK_COUNT, STEP_DURATION, STEPS_BEFORE_BRANCH, VALUE_SCALE } from './constants'
import { Disk } from './disk'
import { collideDisks } from './luts/imp/disk-disk-lut'
import { Obstacle } from './obstacle'
import type { Rectangle, Vec2 } from 'util/math-util'
import { Lut } from './luts/lut'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import type { ShapeName } from './shapes'
import { SHAPE_PATHS } from './shapes'
import { Perturbations } from './perturbations'
import { DISK_PATTERNS } from 'gfx/disk-gfx'

const thick = 1 // thickness of walls

const _disks: Array<[number, number, number, number]> = []
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 2; j++) {
    if( _disks.length === DISK_COUNT ) continue
    _disks.push([
      (20 + i * 10), // x position increases by 20 units per disk
      (20 + j * 10), // y position increases by 10 units per disk
      500 - i * 10, // dx decreases by 10 units per disk
      500 + i * 5, // dy increases by 5 units per disk
    ])
  }
}
if (_disks.length !== DISK_COUNT) throw new Error('wrong disk count')

const outerWallWidth = 100
const outerWallHeight = 700
const outerWallXOffset = 0
const outerWallYOffset = 5

const _barriers = [
  // outer walls (smaller shape centered in the original 100x100 square)
  [outerWallXOffset, outerWallYOffset, thick, outerWallHeight], // left
  [outerWallXOffset + outerWallWidth - thick, outerWallYOffset, thick, outerWallHeight], // right
  [outerWallXOffset, outerWallYOffset, outerWallWidth, thick], // top
  [outerWallXOffset, outerWallYOffset + outerWallHeight, outerWallWidth, thick], // bottom
] as const

const _bottomWall = _barriers[3]
const finishThickness = 10
const _finish: Rectangle = [
  _bottomWall[0], _bottomWall[1] - finishThickness,
  _bottomWall[2], finishThickness,
]

const _obstacles = [
  [[50, 100] as Vec2, 'roundrect'],
  [[50, 200] as Vec2, 'roundrect'],
  [[50, 300] as Vec2, 'roundrect'],
] as const satisfies Array<[Vec2, ShapeName]>

export class Simulation {
  disks: Array<Disk>
  obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  finish: Barrier

  branchSeed = -1
  winningDiskIndex = -1 // index of first disk to hit finish

  constructor(seed: number) {
    // console.log(`construct simulation with starting seed ${seed}`)

    Perturbations.setSeed(seed)

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
    this.obstacles = _obstacles.map(([pos, shapeName]) => new Obstacle(
      pos.map(val => val * VALUE_SCALE) as Vec2,
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
    ))
    this.barriers = _barriers.map(rect =>
      new Barrier(...rect.map(val => val * VALUE_SCALE) as Rectangle))
    this.finish = new Barrier(..._finish.map(val => val * VALUE_SCALE) as Rectangle)
  }

  private _stepCount = 0
  get stepCount() { return this._stepCount }
  step() {
    this._stepCount++

    // udpate inner obstacles
    for( const obs of this.obstacles ){
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
      disk.advance(this.barriers, this.obstacles)
      disk.nextState[3] += 1 // gravity

      if ((this.winningDiskIndex === -1)
        && this.finish.isTouchingDisk(disk.nextState[0], disk.nextState[1])
      ) {
        // console.log(`disk index ${diskIndex} won after ${this._stepCount} steps`)
        this.winningDiskIndex = diskIndex
      }

      // Perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching
    }

    // // randomly blink inner walls
    // for (let i = 4; i < this.barriers.length; i++) {
    //   const barrier = this.barriers[i]
    //   Perturbations.blinkBarrier(barrier)
    // }


    Disk.flushStates(this.disks) // commit updates after collisions

    // if (this._stepCount % 3 === 0) {
    Disk.updateHistory(this.disks) // add to graphical tail
    // }

    if (this._stepCount === (STEPS_BEFORE_BRANCH) && this.branchSeed !== -1) {
      // console.log('set mid seed')
      Perturbations.setSeed(this.branchSeed)
      // console.log(`set branch seed ${this.branchSeed} for sim with step count ${this.stepCount}`)
    }
  }

  update(dt: number) {
    const nSteps = Math.round(dt / STEP_DURATION) * topConfig.flatConfig.speedMultiplier

    // advance the simulation by n steps
    for (let i = 0; i < nSteps; i++) {
      this.step()

      // sanityCheck();
    }
  }
}
