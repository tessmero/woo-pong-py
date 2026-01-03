/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { topConfig } from 'configs/imp/top-config'
import { Barrier } from './barrier'
import { STEP_DURATION, valueScale } from './constants'
import { Disk } from './disk'
import { Graphics } from './graphics'
import { collideDisks } from './luts/imp/disk-disk-lut'
import { Obstacle } from './obstacle'
import type { Vec2 } from 'util/math-util'
import { Lut } from './luts/lut'
import type { ObstacleLut } from './luts/imp/obstacle-lut'
import { SHAPE_PATHS } from './shapes'

const thick = 1 * valueScale // thickness of walls

const _disks: Array<[number, number, number, number]> = []
for (let i = 0; i < 5; i++) {
  for (let j = 0; j < 5; j++) {
    _disks.push([
      (20 + i * 8) * valueScale, // x position increases by 20 units per disk
      (20 + j * 8) * valueScale, // y position increases by 10 units per disk
      500 - i * 10, // dx decreases by 10 units per disk
      500 + i * 5, // dy increases by 5 units per disk
    ])
  }
}

const _barriers = [

  // test
  // [40 * valueScale, 40 * valueScale, 20 * valueScale, 20 * valueScale],

  // outer walls
  [0, 0, thick, 100 * valueScale], // left
  [100 * valueScale - thick, 0, thick, 100 * valueScale], // right
  [0, 0, 100 * valueScale, thick], // top
  [0, 100 * valueScale - thick, 100 * valueScale, thick], // bottom
] as const

const _obstacles = [
  [[70 * valueScale, 70 * valueScale] as Vec2, 'circle'],
  [[85 * valueScale, 70 * valueScale] as Vec2, 'square'],
  [[95 * valueScale, 70 * valueScale] as Vec2, 'triangle'],
] as const

export class Simulation {
  disks: Array<Disk>
  obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  constructor() {
    this.disks = _disks.map(pars => Disk.fromJson(pars))
    this.obstacles = _obstacles.map(([pos, shapeName]) => new Obstacle(
      pos,
      SHAPE_PATHS[shapeName],
      Lut.create('obstacle-lut', shapeName) as ObstacleLut,
    ))
    this.barriers = _barriers.map(([x, y, w, h]) => new Barrier(x, y, w, h))
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
    for (const disk of this.disks) {
      disk.advance(this.barriers, this.obstacles)
      disk.nextState[3] += 1 // gravity
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
    for (const disk of this.disks) {
      Graphics.drawDisk(ctx, disk)
    }
    for (const obstacle of this.obstacles) {
      Graphics.drawObstacle(ctx, obstacle)
    }
    for (const barrier of this.barriers) {
      Graphics.drawBarrier(ctx, barrier)
    }
    ctx.restore()
  }
}
