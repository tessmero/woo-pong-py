/**
 * @file simulation.ts
 *
 * Disks and obstacles 2D simulation.
 */

import { Disk } from './disk'
import { Graphics } from './graphics'
import { Obstacle } from './obstacle'

const STEP_DURATION = 4

// air hockey scene
const thick = 10 // thickness of walls

// one sliding disk
const _disks = [
  {
    position: { x: 25, y: 25 },
    velocity: { x: 0.15, y: 0.1 },
    radius: 5,
  },
]

// 5 solid obstacles
const _obstacles = [

  // center obstacle that moves with the mouse
  { center: { x: 50, y: 50 }, radius: 10, n: 10 },

  // four outer walls
  { box: [0, 0, thick, 100] }, // left
  { box: [100 - thick, 0, thick, 100] }, // right
  { box: [0, 0, 100, thick] }, // top
  { box: [0, 100 - thick, 100, thick] }, // bottom
]

export class Simulation {
  disks: Array<Disk>
  obstacles: Array<Obstacle>
  constructor() {
    this.disks = _disks.map(pars => new Disk(pars))
    this.obstacles = _obstacles.map(pars => new Obstacle(pars))
  }

  update(dt: number) {
    const nSteps = Math.round(dt / STEP_DURATION)

    // advance the simulation by n steps
    for (let i = 0; i < nSteps; i++) {
      for (const disk of this.disks) {
        disk.step(this.obstacles)
      }

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
    for (const obstacle of this.obstacles) {
      Graphics.drawObstacle(ctx, obstacle)
    }
    ctx.restore()
  }
}
