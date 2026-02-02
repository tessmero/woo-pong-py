/**
 * @file canvas-text-util.ts
 *
 * Utilities for consistent canvas text rendering.
 */

export const BASE_FONT_SIZE = 100
export const FONT_WEIGHT = 400

/**
 * Set up the canvas context for Rubik font text, centered at (0,0), scaled to fit the given height.
 * Call ctx.save() before and ctx.restore() after.
 * @param ctx CanvasRenderingContext2D
 * @param h Target height for text (e.g. rect height)
 * @param color Fill color
 */
export function setupRubikText(ctx: CanvasRenderingContext2D, h: number, color: string) {
  const scale = (h * 0.55) / BASE_FONT_SIZE
  ctx.translate(0, 0)
  ctx.scale(scale, scale)
  ctx.font = `${FONT_WEIGHT} ${BASE_FONT_SIZE}px Rubik, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
}
