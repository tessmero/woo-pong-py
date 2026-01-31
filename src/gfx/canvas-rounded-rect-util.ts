/**
 * @file canvas-rounded-rect-util.ts
 *
 * Canvas rounded rectangles.
 */

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
  fillStyle = 'rgba(0,0,0,0.15)',
) {
  const [x, y, w, h] = rect
  const r = Math.min(ROUNDED_RECT_RADIUS, w / 2, h / 2)
  const pad = ROUNDED_RECT_PADDING
  ctx.save()
  ctx.beginPath()
  ctx.rect(x-1, y-1, w+2, h+2)
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
  ctx.fillStyle = fillStyle
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

export const ROUNDED_RECT_FILL_COLOR = '#fff'
export const ROUNDED_RECT_STROKE_COLOR = 'black'
export const ROUNDED_RECT_RADIUS = 12
export const ROUNDED_RECT_PADDING = 3

export type Rectangle = [number, number, number, number]

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D, rect: Rectangle,
  fillStyle = ROUNDED_RECT_FILL_COLOR,
  strokeStyle = ROUNDED_RECT_STROKE_COLOR,
) {
  const [x, y, width, height] = rect
  const r = Math.min(ROUNDED_RECT_RADIUS, width / 2, height / 2)
  const pad = ROUNDED_RECT_PADDING
  ctx.save()
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
  ctx.fillStyle = fillStyle
  ctx.fill()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = 2 * window.devicePixelRatio
  ctx.stroke()
  ctx.restore()
}
