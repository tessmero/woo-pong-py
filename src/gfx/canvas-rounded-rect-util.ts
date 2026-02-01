/**
 * @file canvas-rounded-rect-util.ts
 *
 * Canvas rounded rectangles.
 */

import { OBSTACLE_FILL } from './graphics'

/**
 * Draws a filled frame region between a rounded rectangle and a regular rectangle.
 * The frame is the area between the outer (rect) and the inner (rounded rect).
 * @param ctx Canvas context
 * @param rect The outer rectangle [x, y, w, h]
 * @param fillStyle Fill color for the frame
 * @param strokeStyle Stroke color for the rounded rect border
 */

/**
 * Fills the frame region between a rounded rectangle and a regular rectangle.
 * The frame is the area between the outer (rect) and the inner (rounded rect).
 */
export function fillFrameBetweenRectAndRounded(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  expand = 1,
) {
  const [x, y, w, h] = rect
  const r = Math.min(ROUNDED_RECT_RADIUS, w / 2, h / 2)
  const pad = ROUNDED_RECT_PADDING
  ctx.save()
  ctx.beginPath()
  ctx.rect(x - expand, y - expand, w + 2 * expand, h + 2 * expand)
  ctx.moveTo(x + pad + r, y + pad)
  ctx.lineTo(x + w - pad - r, y + pad)
  ctx.quadraticCurveTo(x + w - pad, y + pad, x + w - pad, y + pad + r)
  ctx.lineTo(x + w - pad, y + h - pad - r)
  ctx.quadraticCurveTo(x + w - pad, y + h - pad, x + w - pad - r, y + h - pad)
  ctx.lineTo(x + pad + r, y + h - pad)
  ctx.quadraticCurveTo(x + pad, y + h - pad, x + pad, y + h - pad - r)
  ctx.lineTo(x + pad, y + pad + r)
  ctx.quadraticCurveTo(x + pad, y + pad, x + pad + r, y + pad)
  ctx.closePath()
  ctx.fillStyle = OBSTACLE_FILL
  ctx.fill('evenodd')
  ctx.restore()
}

/**
 * Strokes the inner rounded rectangle only (no fill, no frame).
 */
export function strokeInnerRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  strokeStyle = ROUNDED_RECT_STROKE_COLOR,
) {
  const [x, y, w, h] = rect
  const r = Math.min(ROUNDED_RECT_RADIUS, w / 2, h / 2)
  const pad = ROUNDED_RECT_PADDING
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + pad + r, y + pad)
  ctx.lineTo(x + w - pad - r, y + pad)
  ctx.quadraticCurveTo(x + w - pad, y + pad, x + w - pad, y + pad + r)
  ctx.lineTo(x + w - pad, y + h - pad - r)
  ctx.quadraticCurveTo(x + w - pad, y + h - pad, x + w - pad - r, y + h - pad)
  ctx.lineTo(x + pad + r, y + h - pad)
  ctx.quadraticCurveTo(x + pad, y + h - pad, x + pad, y + h - pad - r)
  ctx.lineTo(x + pad, y + pad + r)
  ctx.quadraticCurveTo(x + pad, y + pad, x + pad + r, y + pad)
  ctx.closePath()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = 3 * window.devicePixelRatio
  ctx.stroke()
  ctx.restore()
}

export const ROUNDED_RECT_FILL_COLOR = '#ccc'
export const ACTIVE_FILL_COLOR = '#999'
export const ROUNDED_RECT_STROKE_COLOR = 'black'
export const ROUNDED_RECT_RADIUS = 12
export const ROUNDED_RECT_PADDING = 3

export type Rectangle = [number, number, number, number]
const shadedColor = '#888'
const litColor = '#eee'
const activeShadedColor = '#858585'
const activeLitColor = '#bbb'

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D, rect: Rectangle,
  isActive = false, skipSlivers = false,
) {
  const [x, y, width, height] = rect
  const r = Math.min(ROUNDED_RECT_RADIUS, width / 2, height / 2)
  const pad = ROUNDED_RECT_PADDING
  ctx.save()
  // Draw main filled rounded rect
  ctx.beginPath()
  ctx.moveTo(x + pad + r, y + pad)
  ctx.lineTo(x + width - pad - r, y + pad)
  ctx.quadraticCurveTo(x + width - pad, y + pad, x + width - pad, y + pad + r)
  ctx.lineTo(x + width - pad, y + height - pad - r)
  ctx.quadraticCurveTo(x + width - pad, y + height - pad, x + width - pad - r, y + height - pad)
  ctx.lineTo(x + pad + r, y + height - pad)
  ctx.quadraticCurveTo(x + pad, y + height - pad, x + pad, y + height - pad - r)
  ctx.lineTo(x + pad, y + pad + r)
  ctx.quadraticCurveTo(x + pad, y + pad, x + pad + r, y + pad)
  ctx.closePath()
  ctx.fillStyle = isActive ? ACTIVE_FILL_COLOR : ROUNDED_RECT_FILL_COLOR
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 2 * window.devicePixelRatio
  ctx.stroke()

  if (!skipSlivers) {
  // --- Draw lit top sliver ---
    const sliverFrac = 0.2 // fraction of height for sliver thickness
    const sliverCurve = 10
    const sliverPad = pad + 1
    const sliverR = Math.max(r - 1, 2)
    const sliverH = Math.max(2, Math.floor((height - 2 * sliverPad) * sliverFrac))
    ctx.beginPath()
    ctx.moveTo(x + sliverPad + sliverR, y + sliverPad)
    ctx.lineTo(x + width - sliverPad - sliverR, y + sliverPad)
    ctx.quadraticCurveTo(x + width - sliverPad, y + sliverPad, x + width - sliverPad, y + sliverPad + sliverR)
    ctx.lineTo(x + width - sliverPad, y + sliverPad + sliverH)

    // ctx.lineTo(x + sliverPad, y + sliverPad + sliverH)
    ctx.quadraticCurveTo(
      x + width / 2, y + sliverPad + sliverH - sliverCurve, // control
      x + sliverPad, y + sliverPad + sliverH, // end
    )

    ctx.lineTo(x + sliverPad, y + sliverPad + sliverR)
    ctx.quadraticCurveTo(x + sliverPad, y + sliverPad, x + sliverPad + sliverR, y + sliverPad)
    ctx.closePath()
    ctx.fillStyle = isActive ? activeShadedColor : litColor // top
    ctx.fill()

    // --- Draw shaded bottom sliver ---
    ctx.beginPath()
    ctx.moveTo(x + sliverPad + sliverR, y + height - sliverPad)
    ctx.lineTo(x + width - sliverPad - sliverR, y + height - sliverPad)
    ctx.quadraticCurveTo(x + width - sliverPad, y + height - sliverPad, x + width - sliverPad, y + height - sliverPad - sliverR)
    ctx.lineTo(x + width - sliverPad, y + height - sliverPad - sliverH)

    // ctx.lineTo(x + sliverPad, y + height - sliverPad - sliverH)
    ctx.quadraticCurveTo(
      x + width / 2, y + height - sliverPad - sliverH + sliverCurve, // control
      x + sliverPad, y + height - sliverPad - sliverH, // end
    )

    ctx.lineTo(x + sliverPad, y + height - sliverPad - sliverR)
    ctx.quadraticCurveTo(x + sliverPad, y + height - sliverPad, x + sliverPad + sliverR, y + height - sliverPad)
    ctx.closePath()
    ctx.fillStyle = isActive ? activeLitColor : shadedColor // bottom
    ctx.fill()
  }
}
