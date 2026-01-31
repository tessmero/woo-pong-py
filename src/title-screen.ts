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
const bodies: Array<Body & { mass: number, trail: Array<Vec2> }> = [0, 1, 2].map((i) => {
  const angle = twopi * i / 3
  const pos: Vec2 = [Math.cos(angle) * INIT_RADIUS, Math.sin(angle) * INIT_RADIUS]
  const speed = (Math.random() + 1) * INIT_SPEED
  const tangent = [Math.sin(angle), -Math.cos(angle)]
  const vel: Vec2 = [tangent[0] * speed, tangent[1] * speed]
  return { pos, vel, mass: MASSES[i], trail: [pos.slice() as Vec2] }
})

function _updateTitleSim(dt: number) {
  const G = 1e-8
  for (let a = 0; a < bodies.length; a++) {
    const acc: Vec2 = [0, 0]
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
    bodies[a].pos[0] += bodies[a].vel[0] * dt
    bodies[a].pos[1] += bodies[a].vel[1] * dt
    // Update trail
    bodies[a].trail.push([bodies[a].pos[0], bodies[a].pos[1]])
    if (bodies[a].trail.length > TRAIL_LENGTH) bodies[a].trail.shift()
  }
}

function _drawTitleSim() {
  const cvs = Graphics._mainCvs
  const ctx = Graphics._mainCtx
  if (!ctx) return
  const w = cvs.width, h = cvs.height
  const scale = Math.min(w, h) * 0.5
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
  for (const body of bodies) {
    if (body.trail.length > 1) {
      // ctx.beginPath();
      for (let i = 0; i < body.trail.length; i++) {
        const [tx, ty] = body.trail[i]
        const px = w / 2 + tx * scale
        const py = h / 2 + ty * scale
        ctx.fillRect(px, py, 1, 1)
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
    const [x, y] = [w / 2 + body.pos[0] * scale, h / 2 + body.pos[1] * scale]
    ctx.beginPath()
    ctx.arc(x, y, BODY_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = '#aaa'
    ctx.shadowColor = '#999'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.shadowBlur = 0
  }
}
