/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { topConfig } from 'configs/imp/top-config'
import { Barrier } from './barrier'
import { DISK_COUNT, STEP_DURATION, valueScale } from './constants'
import { Disk } from './disk'
import { Graphics } from './graphics'
import { collideDisks } from './luts/imp/disk-disk-lut'
import { Obstacle } from './obstacle'
import type { Rectangle, Vec2 } from 'util/math-util'
import { Lut } from './luts/lut'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import { SHAPE_PATHS } from './shapes'
import { Perturbations } from './perturbations'

const thick = 1 * valueScale // thickness of walls

const _disks: Array<[number, number, number, number]> = []
for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 2; j++) {
    _disks.push([
      (35 + i * 4) * valueScale, // x position increases by 20 units per disk
      (10 + j * 4) * valueScale, // y position increases by 10 units per disk
      500 - i * 10, // dx decreases by 10 units per disk
      500 + i * 5, // dy increases by 5 units per disk
    ])
  }
}
if (_disks.length !== DISK_COUNT) throw new Error('wrong disk count')

const outerWallWidth = 40 * valueScale
const outerWallHeight = 70 * valueScale
const outerWallXOffset = 30 * valueScale
const outerWallYOffset = 5 * valueScale
const innerWallWidth = 40 * valueScale
const innerWallXOffset = 30 * valueScale
const innerWallSpacing = 20 * valueScale
const innerWallStartY = 30 * valueScale
const innerWallCount = 3

const _barriers = [
  // outer walls (smaller shape centered in the original 100x100 square)
  [outerWallXOffset, outerWallYOffset, thick, outerWallHeight], // left
  [outerWallXOffset + outerWallWidth, outerWallYOffset, thick, outerWallHeight], // right
  [outerWallXOffset, outerWallYOffset, outerWallWidth, thick], // top
  [outerWallXOffset, outerWallYOffset + outerWallHeight, outerWallWidth, thick], // bottom

  // horizontal inner walls at regular intervals
  ...Array.from({ length: innerWallCount }, (_, i) => [
    innerWallXOffset,
    innerWallStartY + i * innerWallSpacing,
    innerWallWidth,
    thick,
  ]),
] as const

const _bottomWall = _barriers[3]
const finishThickness = 10 * valueScale
const _finish: Rectangle = [
  _bottomWall[0], _bottomWall[1] - finishThickness,
  _bottomWall[2], finishThickness,
]

const _obstacles = [
  [[70 * valueScale, 70 * valueScale] as Vec2, 'circle'],
  [[85 * valueScale, 70 * valueScale] as Vec2, 'square'],
  [[95 * valueScale, 70 * valueScale] as Vec2, 'triangle'],
] as const

export class Simulation {
  disks: Array<Disk>
  obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  finish: Barrier

  winningDiskIndex = -1 // index of first disk to hit finish

  constructor() {
    this.disks = _disks.map(pars => Disk.fromJson(pars))
    this.obstacles = _obstacles.map(([pos, shapeName]) => new Obstacle(
      pos,
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
    ))
    this.barriers = _barriers.map(([x, y, w, h]) => new Barrier(x, y, w, h))
    this.finish = new Barrier(..._finish)
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
        this.winningDiskIndex = diskIndex
      }

      Perturbations.perturbDisk(disk.nextState) // add slight adjustments to facilitate branching
    }

    // randomly blink inner walls
    for (let i = 4; i < this.barriers.length; i++) {
      const barrier = this.barriers[i]
      Perturbations.blinkBarrier(barrier)
    }

    Disk.flushStates(this.disks) // commit updates after collisions

    if (this._stepCount % 3 === 0) {
      Disk.updateHistory(this.disks) // add to graphical tail
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

  draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // draw the updated scene
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.scale(10 / valueScale, 10 / valueScale)
    ctx.lineWidth = valueScale
    for (const [diskIndex, disk] of this.disks.entries()) {
      const isSelected = false
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
