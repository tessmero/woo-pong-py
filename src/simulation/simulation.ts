/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { topConfig } from 'configs/imp/top-config'
import { Barrier } from './barrier'
import { DISK_COUNT, STEP_DURATION, STEPS_BEFORE_BRANCH, VALUE_SCALE } from './constants'
import { Disk } from './disk'
import { Graphics } from '../gfx/graphics'
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
for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 2; j++) {
    _disks.push([
      (35 + i * 4), // x position increases by 20 units per disk
      (10 + j * 4), // y position increases by 10 units per disk
      500 - i * 10, // dx decreases by 10 units per disk
      500 + i * 5, // dy increases by 5 units per disk
    ])
  }
}
if (_disks.length !== DISK_COUNT) throw new Error('wrong disk count')

const outerWallWidth = 40
const outerWallHeight = 70
const outerWallXOffset = 30
const outerWallYOffset = 5

const _barriers = [
  // outer walls (smaller shape centered in the original 100x100 square)
  [outerWallXOffset, outerWallYOffset, thick, outerWallHeight], // left
  [outerWallXOffset + outerWallWidth, outerWallYOffset, thick, outerWallHeight], // right
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
  [[40, 40] as Vec2, 'roundrect'],
  [[60, 40] as Vec2, 'roundrect'],

  [[50, 50] as Vec2, 'roundrect'],

  [[40, 60] as Vec2, 'roundrect'],
  [[60, 60] as Vec2, 'roundrect'],
] as const satisfies Array<[Vec2, ShapeName]>

export class Simulation {
  disks: Array<Disk>
  obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  finish: Barrier

  branchSeed = -1
  winningDiskIndex = -1 // index of first disk to hit finish

  constructor(seed: number) {
    console.log(`construct simulation with starting seed ${seed}`)

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
        console.log(`disk index ${diskIndex} won after ${this._stepCount} steps`)
        this.winningDiskIndex = diskIndex
      }

      Perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching
    }

    // // randomly blink inner walls
    // for (let i = 4; i < this.barriers.length; i++) {
    //   const barrier = this.barriers[i]
    //   Perturbations.blinkBarrier(barrier)
    // }

    // randomly blink inner obstacles
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      Perturbations.blinkObstacle(obstacle)
    }

    Disk.flushStates(this.disks) // commit updates after collisions

    // if (this._stepCount % 3 === 0) {
    Disk.updateHistory(this.disks) // add to graphical tail
    // }

    if (this._stepCount === (STEPS_BEFORE_BRANCH) && this.branchSeed !== -1) {
      console.log('set mid seed')
      Perturbations.setSeed(this.branchSeed)
      console.log(`set branch seed ${this.branchSeed} for sim with step count ${this.stepCount}`)
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

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, selectedDiskIndex: number) {
  // draw the updated scene
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.scale(10 / VALUE_SCALE, 10 / VALUE_SCALE)
    ctx.lineWidth = VALUE_SCALE
    for (const [diskIndex, disk] of this.disks.entries()) {
      const isSelected = (diskIndex === selectedDiskIndex)
      const isWinner = (diskIndex === this.winningDiskIndex)
      Graphics.drawDisk(ctx, disk, isSelected, isWinner)
    }
    for (const obstacle of this.obstacles) {
      Graphics.drawObstacle(ctx, obstacle)
    }
    for (const barrier of this.barriers) {
      Graphics.drawBarrier(ctx, barrier)
    }
    Graphics.drawFinish(ctx, this.finish)
    ctx.restore()
  }
}
