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
import { Collisions } from './collisions'

const thick = 10 * valueScale // thickness of walls

const n = 20 // Number of disks to generate
const _disks = Array.from({ length: n }, (_, i) => [
  (20 + i * 2) * valueScale, // x position increases by 20 units per disk
  (20 + i * 1) * valueScale, // y position increases by 10 units per disk
  500 - i * 10, // dx decreases by 10 units per disk
  500 + i * 5, // dy increases by 5 units per disk
])

const _barriers = [
  [0, 0, thick, 100 * valueScale], // left
  [100 * valueScale - thick, 0, thick, 100 * valueScale], // right
  [0, 0, 100 * valueScale, thick], // top
  [0, 100 * valueScale - thick, 100 * valueScale, thick], // bottom
] as const

export class Simulation {
  disks: Array<Disk>
  // obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  constructor() {
    this.disks = _disks.map(pars => Disk.fromJson(pars))
    // this.obstacles = _obstacles.map(pars => new Obstacle(pars))
    this.barriers = _barriers.map(([x, y, w, h]) => new Barrier(x, y, w, h))
  }

  private _stepCount = 0
  get stepCount() { return this._stepCount }
  step() {
    this._stepCount++

    // collide disks with barriers
    for (const disk of this.disks) {
      disk.advance(this.barriers)
    }

    // collide disks with disks
    for (let a = 1; a < this.disks.length; a++) {
      for (let b = 0; b < a; b++) {
        Collisions.collide(this.disks[a], this.disks[b])
      }
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
    // for (const obstacle of this.obstacles) {
    //   Graphics.drawObstacle(ctx, obstacle)
    // }
    for (const barrier of this.barriers) {
      Graphics.drawBarrier(ctx, barrier)
    }
    ctx.restore()
  }
}
