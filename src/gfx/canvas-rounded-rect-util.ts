/**
 * @file canvas-rounded-rect-util.ts
 * 
 * Canvas rounded rectangles.
 */

export const ROUNDED_RECT_FILL_COLOR = '#fff';
export const ROUNDED_RECT_STROKE_COLOR = '#222';
export const ROUNDED_RECT_RADIUS = 12;
export const ROUNDED_RECT_PADDING = 3;


export type Rectangle = [number, number, number, number];

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D, rect: Rectangle,
  fillStyle = ROUNDED_RECT_FILL_COLOR,
  strokeStyle = ROUNDED_RECT_STROKE_COLOR,
) {
  const [x, y, width, height] = rect;
  const r = Math.min(ROUNDED_RECT_RADIUS, width / 2, height / 2);
  const pad = ROUNDED_RECT_PADDING;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + pad + r, y + pad);
  ctx.lineTo(x + width - pad - r, y + pad);
  ctx.quadraticCurveTo(x + width - pad, y + pad, x + width - pad, y + pad + r);
  ctx.lineTo(x + width - pad, y + height - pad - r);
  ctx.quadraticCurveTo(x + width - pad, y + height - pad, x + width - pad - r, y + height - pad);
  ctx.lineTo(x + pad + r, y + height - pad);
  ctx.quadraticCurveTo(x + pad, y + height - pad, x + pad, y + height - pad - r);
  ctx.lineTo(x + pad, y + pad + r);
  ctx.quadraticCurveTo(x + pad, y + pad, x + pad + r, y + pad);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2 * window.devicePixelRatio;
  ctx.stroke();
  ctx.restore();
}
