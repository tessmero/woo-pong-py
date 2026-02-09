/**
 * @file title-screen.ts
 *
 * Title screen with 3-body problem animation.
 */

import { Graphics } from 'gfx/graphics'
import type { Vec2 } from 'util/math-util'
import { twopi } from 'util/math-util'

export class TitleScreen {
  static update(dt: number) {
    _updateTitleSim(dt)
    _drawTitleSim()
  }
}

type Body = {
  pos: Vec2
  vel: Vec2
}

// Parameters for a visually appealing, centered 3-body animation
const BODY_RADIUS = 15
const INIT_RADIUS = 0.22 // relative to canvas min(width, height)
const INIT_SPEED = 1e-4 // relative to canvas min(width, height) per second
const MASSES = [1, 1, 1]

// Track last 10 positions for each body
const TRAIL_LENGTH = 100
const bodies: Array<Body & { mass: number, trail: Float32Array }> = [0, 1, 2].map((i) => {
  const angle = twopi * i / 3
  const pos: Vec2 = [Math.cos(angle) * INIT_RADIUS, Math.sin(angle) * INIT_RADIUS]
  const speed = (Math.random() + 1) * INIT_SPEED
  const tangent = [Math.sin(angle), -Math.cos(angle)]
  const vel: Vec2 = [tangent[0] * speed, tangent[1] * speed]
  return { pos, vel, mass: MASSES[i], trail: new Float32Array(2 * TRAIL_LENGTH) }
})

const acc: Vec2 = [0, 0]
function _updateTitleSim(dt: number) {
  const G = 1e-8
  for (let a = 0; a < bodies.length; a++) {
    acc[0] = 0
    acc[1] = 0
    for (let b = 0; b < bodies.length; b++) {
      if (a === b) continue
      const dx = bodies[b].pos[0] - bodies[a].pos[0]
      const dy = bodies[b].pos[1] - bodies[a].pos[1]
      const distSq = dx * dx + dy * dy + 0.001
      const dist = Math.sqrt(distSq)
      const force = G * bodies[b].mass / distSq
      acc[0] += force * dx / dist
      acc[1] += force * dy / dist
    }
    bodies[a].vel[0] += acc[0] * dt
    bodies[a].vel[1] += acc[1] * dt
  }
  for (let a = 0; a < bodies.length; a++) {
    const { pos, trail } = bodies[a]
    pos[0] += bodies[a].vel[0] * dt
    pos[1] += bodies[a].vel[1] * dt
    // Update trail
    trail[indexInTrail * 2] = pos[0]
    trail[indexInTrail * 2 + 1] = pos[1]
  }
  indexInTrail = (indexInTrail + 1) % TRAIL_LENGTH
}

let indexInTrail = 0

function _drawTitleSim() {
  const cvs = Graphics._mainCvs
  const ctx = Graphics._mainCtx
  if (!ctx) return
  const w = cvs.width, h = cvs.height
  const scale = Math.min(w, h) * 1
  // White background
  ctx.save()
  ctx.globalAlpha = 1.0
  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Draw trails (dotted lines)
  //   ctx.save()
  ctx.fillStyle = '#888'
  //   ctx.setLineDash([4, 6])
  //   ctx.lineWidth = 2
  const rad = 1 * window.devicePixelRatio
  for (const body of bodies) {
    if (body.trail.length > 1) {
      // ctx.beginPath();
      let ti = indexInTrail
      for (let i = 0; i < body.trail.length; i++) {
        const tx = body.trail[ti * 2]
        const ty = body.trail[ti * 2 + 1]
        ti = (ti + 1) % TRAIL_LENGTH
        const px = w / 2 + tx * scale
        const py = h / 2 + ty * scale
        ctx.fillRect(px - rad, py - rad, 2 * rad, 2 * rad)
        // if (i === 0) ctx.moveTo(px, py);
        // else ctx.lineTo(px, py);
      }
      // ctx.stroke();
    }
  }
  //   ctx.setLineDash([])
  //   ctx.restore()

  // Draw bodies (black)
  for (const body of bodies) {
    const x = w / 2 + body.pos[0] * scale
    const y = h / 2 + body.pos[1] * scale
    ctx.beginPath()
    ctx.arc(x, y, BODY_RADIUS * window.devicePixelRatio, 0, 2 * Math.PI)
    ctx.fillStyle = '#aaa'
    ctx.shadowColor = '#999'
    ctx.shadowBlur = 8 * window.devicePixelRatio
    ctx.fill()
    ctx.shadowBlur = 0
  }
}
