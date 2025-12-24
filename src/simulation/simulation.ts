/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { Barrier } from './barrier'
import { Disk } from './disk'
import { Graphics } from './graphics'

const STEP_DURATION = 4

const thick = 10 // thickness of walls


const _barriers = [
  [0, 0, thick, 100], // left
  [100 - thick, 0, thick, 100], // right
  [0, 0, 100, thick], // top
  [0, 100 - thick, 100, thick], // bottom
] as const

export class Simulation {
  disks: Array<Disk>
  // obstacles: Array<Obstacle>
  barriers: Array<Barrier>
  constructor() {
    this.disks = [new Disk()]
    // this.obstacles = _obstacles.map(pars => new Obstacle(pars))
    this.barriers = _barriers.map(([x, y, w, h]) => new Barrier(x, y, w, h))
  }

  step() {
    for (const disk of this.disks) {
      disk.advance(this.barriers)
    }
  }

  update(dt: number) {
    const nSteps = Math.round(dt / STEP_DURATION)

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
    ctx.scale(10, 10)
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
