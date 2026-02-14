/**
 * @file gas-box-gfx-util.ts
 *
 * Helpers for drawing GasBox instances in the simulation view.
 */

import type { PinballWizard } from 'pinball-wizard'
import { OBSTACLE_STROKE } from 'gfx/graphics'
import { VALUE_SCALE } from 'simulation/constants'
import { GAS_BOX_PARTICLE_RADIUS } from 'simulation/gas-box-constants'

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
    ctx.strokeRect(bx, by, bw, bh)

    // draw initial-sim particles (red)
    ctx.fillStyle = INITIAL_PARTICLE_COLOR
    const initSim = box.initialSim
    for (let i = 0; i < initSim.count; i++) {
      if (box.initialRetired[i]) continue
      ctx.fillRect(bx + initSim.px[i] - GAS_BOX_PARTICLE_RADIUS,
        by + initSim.py[i] - GAS_BOX_PARTICLE_RADIUS,
        2 * GAS_BOX_PARTICLE_RADIUS,
        2 * GAS_BOX_PARTICLE_RADIUS,
      )
    }

    // draw final-sim particles (blue) — only those activated during transition
    if (box.finalSim) {
      ctx.fillStyle = FINAL_PARTICLE_COLOR
      const finalSim = box.finalSim
      for (let i = 0; i < finalSim.count; i++) {
        if (!box.finalActive[i]) continue
        ctx.fillRect(bx + finalSim.px[i] - GAS_BOX_PARTICLE_RADIUS,
          by + finalSim.py[i] - GAS_BOX_PARTICLE_RADIUS,
          2 * GAS_BOX_PARTICLE_RADIUS,
          2 * GAS_BOX_PARTICLE_RADIUS,
        )
      }
    }
  }
}
