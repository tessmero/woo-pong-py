/**
 * @file gas-box-gfx-util.ts
 *
 * Helpers for drawing GasBox instances in the simulation view.
 */

import type { PinballWizard } from 'pinball-wizard'
import { OBSTACLE_STROKE } from 'gfx/graphics'
import { VALUE_SCALE } from 'simulation/constants'

const PARTICLE_RADIUS = 0.8 * VALUE_SCALE
const BOX_LINE_WIDTH = 0.4 * VALUE_SCALE

// Debug colors: red for initial sim, blue for final sim.
const INITIAL_PARTICLE_COLOR = 'rgb(200, 60, 60)'
const FINAL_PARTICLE_COLOR = 'rgb(60, 60, 200)'

export function drawGasBoxes(ctx: CanvasRenderingContext2D, pw: PinballWizard) {
  const { simViewRect } = pw
  const sim = pw.activeSim

  const vy0 = simViewRect[1]
  const vy1 = vy0 + simViewRect[3]

  for (const box of sim.gasBoxes) {
    if (!box.isVisible) continue

    const [bx, by, bw, bh] = box.boundingRect

    // cull boxes outside the vertical view
    if (by > vy1) continue
    if (by + bh < vy0) continue

    // draw bounding rectangle
    ctx.lineWidth = BOX_LINE_WIDTH
    ctx.strokeStyle = OBSTACLE_STROKE
    ctx.fillStyle = 'rgba(40, 40, 40, 0.15)'
    ctx.fillRect(bx, by, bw, bh)
    ctx.strokeRect(bx, by, bw, bh)

    // draw initial-sim particles (red)
    ctx.fillStyle = INITIAL_PARTICLE_COLOR
    const initParticles = box.initialSim.particles
    for (let i = 0; i < initParticles.length; i++) {
      if (box.initialRetired[i]) continue
      const p = initParticles[i]
      // ctx.beginPath()
      // ctx.arc(bx + p.x, by + p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
      // ctx.fill()
      ctx.fillRect(bx + p.x - PARTICLE_RADIUS,
        by + p.y - PARTICLE_RADIUS,
        2 * PARTICLE_RADIUS,
        2 * PARTICLE_RADIUS,
      )
    }

    // draw final-sim particles (blue) — only those activated during transition
    if (box.finalSim) {
      ctx.fillStyle = FINAL_PARTICLE_COLOR
      const finalParticles = box.finalSim.particles
      for (let i = 0; i < finalParticles.length; i++) {
        if (!box.finalActive[i]) continue
        const p = finalParticles[i]
        // ctx.beginPath()
        // ctx.arc(bx + p.x, by + p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
        // ctx.fill()
        ctx.fillRect(bx + p.x - PARTICLE_RADIUS,
          by + p.y - PARTICLE_RADIUS,
          2 * PARTICLE_RADIUS,
          2 * PARTICLE_RADIUS,
        )
      }
    }
  }
}
