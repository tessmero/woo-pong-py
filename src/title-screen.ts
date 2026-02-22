/**
 * @file title-screen.ts
 *
 * Title screen with 3-body problem animation.
 */

import { Pattern } from 'gfx/patterns/pattern'
import { buildFillStyle } from 'gfx/patterns/pattern-util'
import type { PatternName } from 'imp-names'
import { VALUE_SCALE } from 'simulation/constants'
import { HILBERT_HEIGHT, HILBERT_WIDTH, N_HILBERT_FRAMES, N_HILBERT_POINTS } from 'hilbert-constants'
import type { HilbertLut } from 'simulation/luts/imp/hilbert-lut'
import { Lut } from 'simulation/luts/lut'
import type { Vec2 } from 'util/math-util'
import { lerp, twopi } from 'util/math-util'

let _isHilbertEnabled = false

export function onTitleScreenResize() {
  // Graphics.onResize()

  const { cvs, ctx } = getTitleScreenCanvas()
  cvs.width = cvs.clientWidth * window.devicePixelRatio
  cvs.height = cvs.clientHeight * window.devicePixelRatio
}

export class TitleScreen {
  static update(dt: number) {
    getScaledPattern('diamond-a')
    // _updateTitleSim(dt)
    // _drawTitleSim()

    const { cvs, ctx } = getTitleScreenCanvas()
    // const cvs = Graphics._canvases['main']
    // const ctx = Graphics._contexts['main']
    if (!ctx) return
    const w = cvs.width, h = cvs.height
    ctx.clearRect(0, 0, w, h)

    _drawQuantum()
    if (_isHilbertEnabled) {
      _drawWooPong()
    }
  }

  static startHilbert() {
    _isHilbertEnabled = true
  }
}

type Body = {
  pos: Vec2
  vel: Vec2
  trail: Float32Array
}

// Parameters for a visually appealing, centered 3-body animation
const BODY_RADIUS = 15
const INIT_RADIUS = 0.22 // relative to canvas min(width, height)
const INIT_SPEED = 1e-4 // relative to canvas min(width, height) per second

// Track last n positions for each body
const TRAIL_LENGTH = 100
const bodies: Array<Body> = Array.from({ length: 3 }, (_, i) => {
  const angle = twopi * i / 3
  const pos: Vec2 = [Math.cos(angle) * INIT_RADIUS, Math.sin(angle) * INIT_RADIUS]
  const speed = (Math.random() + 1) * INIT_SPEED
  const tangent = [Math.sin(angle), -Math.cos(angle)]
  const vel: Vec2 = [tangent[0] * speed, tangent[1] * speed]
  return { pos, vel, trail: new Float32Array(2 * TRAIL_LENGTH) }
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
      const force = G / distSq
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

const _hilbertDelay = 500
const _hilbertDuration = 2000
let _hilbertStartTime = 0
let didInitHilbert = false
const n = N_HILBERT_POINTS
let hilbertLut: HilbertLut | null = null
const drawnX = new Int32Array(n)
const drawnY = new Int32Array(n)

const titlesDeltaY = HILBERT_HEIGHT * 0.7
const titleCenterYFraction = 0.3 // fraction of screen height from top

let _canvasAndContext
export function getTitleScreenCanvas():
{ cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  if (!_canvasAndContext) {
    const iframe = document.getElementById('title-iframe') as HTMLIFrameElement

    const inner = iframe.contentDocument as Document
    const cvs = inner.getElementById('bg-canvas') as HTMLCanvasElement
    _canvasAndContext = {
      cvs, ctx: cvs.getContext('2d'),
    }
  }
  return _canvasAndContext
}

let anim
function _drawQuantum() {
  const { cvs, ctx } = getTitleScreenCanvas()
  // const cvs = Graphics._canvases['main']
  // const ctx = Graphics._contexts['main']
  if (!ctx) return
  const w = cvs.width, h = cvs.height
  const x0 = (w - HILBERT_WIDTH) / 2

  const titleYCenter = h * titleCenterYFraction
  const quantumYCenter = titleYCenter - titlesDeltaY / 2
  const y0 = quantumYCenter - HILBERT_HEIGHT / 2

  if (!didInitHilbert && _isHilbertEnabled) {
    didInitHilbert = true
    hilbertLut = Lut.create('hilbert-lut') as HilbertLut
    _hilbertStartTime = performance.now() + _hilbertDelay
  }

  ctx.beginPath()
  const t = performance.now()
  let rawAnim = 0
  if (_isHilbertEnabled) {
    if (t < _hilbertStartTime) {
      anim = 0
    }
    else {
      rawAnim = Math.min(1, (t - _hilbertStartTime) / _hilbertDuration)
      anim = rawAnim
      // Use a symmetric scaled logistic function centered at x=0.5
      // anim = 1 / (1 + exp(-k(x-0.5)))
      // Normalize so anim(0) = 0, anim(1) = 1
      const x = anim
      const k = 20
      const x0 = 0.5
      anim = 1 / (1 + Math.exp(-k * (x - x0)))
      const anim0 = 1 / (1 + Math.exp(-k * (0 - x0)))
      const anim1 = 1 / (1 + Math.exp(-k * (1 - x0)))
      anim = (anim - anim0) / (anim1 - anim0)
    }
  }
  else {
    anim = 0
  }

  const time = performance.now() / 1e3
  const amplitude = HILBERT_HEIGHT * 0.35
  // Animate over 10 frames based on time
  const nFrames = N_HILBERT_FRAMES
  let frameIndex = 0
  let frameFraction = 0
  if (_isHilbertEnabled && hilbertLut) {
    // 0..1 over _hilbertDuration
    const frame = Math.min(nFrames, (Math.pow(rawAnim, 4) * nFrames))
    frameIndex = Math.floor(frame)
    frameFraction = frame - frameIndex
  }
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) // 0..1
    const lineX = HILBERT_WIDTH * t
    // Sine wave anchored at both endpoints, traveling left-to-right
    const envelope = Math.sin(Math.PI * t)
    const lineY = HILBERT_HEIGHT / 2
      + amplitude * envelope * Math.sin(twopi * 3 * t - time * 5)

    // --- Animated oscillation in the normal direction of the Hilbert curve ---
    // Compute tangent and normal from Hilbert curve (finite difference)
    let hx = -1, hy = -1
    if (hilbertLut) {
      // Gaussian kernel smoothing over all frames
      const sigma = 0.7 // Controls the width of the smoothing window (tune as needed)
      let sumWeights = 0
      let sumHx = 0
      let sumHy = 0
      const center = frameIndex + frameFraction
      for (let f = 0; f < nFrames; f++) {
        // Compute shortest distance in cyclic frame space
        const df = f - center
        // // Wrap cyclically
        // if (df > nFrames / 2) df -= nFrames;
        // if (df < -nFrames / 2) df += nFrames;
        const weight = Math.exp(-0.5 * (df / sigma) * (df / sigma))
        const hxF = hilbertLut.getI16ArrayValue(f, 'px', i)
        const hyF = hilbertLut.getI16ArrayValue(f, 'py', i)
        sumHx += hxF * weight
        sumHy += hyF * weight
        sumWeights += weight
      }
      hx = sumHx / sumWeights
      hy = sumHy / sumWeights
    }
    if (hx === -1) continue
    let nx = 0, ny = 0
    if (i > 0 && i < n - 1) {
      const dx = drawnX[i + 1] - drawnX[i - 1]
      const dy = drawnY[i + 1] - drawnY[i - 1]
      const len = Math.hypot(dx, dy) || 1
      // Normal is (-dy, dx)
      nx = -dy / len
      ny = dx / len
    }
    // Oscillation parameters
    const oscAmp = amplitude * 0.01 // no envelope, constant amplitude
    const osc = anim * oscAmp * Math.sin(150 * t - time * 4)
    // Apply only as we approach the Hilbert curve
    const oscMix = 1
    const x = x0 + lerp(lineX, hx, anim)
    const y = lerp(lineY, hy, anim)
    drawnX[i] = x
    drawnY[i] = y
    ctx.lineTo(x + nx * osc * oscMix, y0 + y + ny * osc * oscMix)
  }
  ctx.imageSmoothingEnabled = false

  // ctx.lineWidth = 3
  // ctx.strokeStyle = '#fff'
  // ctx.stroke()

  ctx.lineWidth = 1.5
  ctx.strokeStyle = '#000'
  ctx.stroke()
}

let indexInTrail = 0

function _drawTitleSim() {
  const { cvs, ctx } = getTitleScreenCanvas()
  // const cvs = Graphics._canvases['main']
  // const ctx = Graphics._contexts['main']
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
    // ctx.shadowColor = '#999'
    // ctx.shadowBlur = 8 * window.devicePixelRatio
    ctx.fill()
    // ctx.shadowBlur = 0
  }
}

function _drawWooPong() {
  const { cvs, ctx } = getTitleScreenCanvas()
  // const cvs = Graphics._canvases['main']
  // const ctx = Graphics._contexts['main']
  if (!ctx) return
  const w = cvs.width, h = cvs.height
  const x0 = (w - HILBERT_WIDTH) / 2
  // const y0 = HILBERT_HEIGHT

  const titleYCenter = h * titleCenterYFraction
  const wooPongYCenter = titleYCenter + titlesDeltaY / 2

  ctx.globalAlpha = anim

  ctx.font = `normal 1000 ${Math.floor(HILBERT_HEIGHT * 0.7)}px Rubik, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // ctx.shadowColor = '#fff'
  // ctx.shadowBlur = HILBERT_HEIGHT * 0.12
  ctx.fillStyle = getScaledPattern('diamond-a')
  ctx.strokeStyle = 'black'// getScaledPattern('hex-b')
  ctx.lineWidth = 5

  // Draw centered in the Hilbert rectangle
  const t = performance.now()
  const x = x0 + HILBERT_WIDTH / 2
  const y = wooPongYCenter

  ctx.lineWidth = 12
  ctx.strokeStyle = 'black'
  ctx.strokeText('Woo Pong', x, y)

  // ctx.lineWidth = 4
  // ctx.strokeStyle = 'white'
  // ctx.strokeText('Woo Pong', x, y)

  ctx.save()
  ctx.strokeStyle = getScaledPattern('hex-a')
  ctx.lineWidth = 4
  const strokeAnimX = t * 1e-1
  ctx.translate(strokeAnimX, 0)
  ctx.strokeText('Woo Pong', x - strokeAnimX, y)
  ctx.restore()

  ctx.globalAlpha = 1
}

// scaled versions of disk-gfx patterns
const scaledFillers: Partial<Record<PatternName, CanvasPattern | string>> = {}
function getScaledPattern(pattern: PatternName): CanvasPattern | string {
  if (!Object.hasOwn(scaledFillers, pattern)) {
    scaledFillers[pattern] = _buildScaledPattern(pattern)
  }
  return scaledFillers[pattern] as CanvasPattern
}

function _buildScaledPattern(pattern: PatternName): CanvasPattern | string {
  const original = Pattern.getFillStyle(pattern)
  if (original instanceof CanvasPattern) {
    return buildFillStyle(pattern, Pattern.getCanvas(pattern), 10 / VALUE_SCALE) // scaled canvas pattern
  }
  return original // string
}
