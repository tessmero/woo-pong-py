/**
 * @file disk-gfx.ts
 *
 * Disk graphics.
 */

import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'
import { tailLength, type Disk } from 'simulation/disk'
import { twopi } from 'util/math-util'

export function drawDisk(
  ctx: CanvasRenderingContext2D, disk: Disk,
  isSelected = false, isWinner = false,
) {
  const [cx, cy, _dx, _dy] = disk.currentState

  const edgeRad = VALUE_SCALE * 0.1 * (isSelected ? 2 : 1)
  const tailShrinkRatio = 2
  // ctx.strokeStyle = 'black'
  // ctx.beginPath()
  // ctx.arc(cx, cy, DISK_RADIUS, 0, twopi)
  // ctx.stroke()

  // draw outline
  ctx.fillStyle = 'black'
  ctx.beginPath()
  let i = 0
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) + edgeRad, 0, twopi)
  for (const [x, y] of disk.history()) {
    // draw point in tail
    ctx.moveTo(x, y)
    ctx.arc(x, y, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) + edgeRad, 0, twopi)
    i++
  }
//   ctx.fill()

  // fill disk
  ctx.fillStyle = 'white'
  if (isWinner) {
    ctx.fillStyle = 'black'
  }
  i = 0
  const headRadius = Math.max(0, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) - edgeRad)
  fillDiskPattern(ctx, cx, cy, headRadius, disk.pattern)
  for (const [x, y] of disk.history()) {
    // draw point in tail
    const tailRadius = Math.max(0, DISK_RADIUS * (1 - i * tailShrinkRatio / tailLength) - edgeRad)
    fillDiskPattern(ctx, x, y, tailRadius, disk.pattern)
    i++
  }
//   ctx.fill()
}

export const DISK_PATTERNS = [
  'white', 'black', 'v-stripe', 'h-stripe',
] as const

export type DiskPattern = (typeof DISK_PATTERNS)[number]

type Filler = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
) => void

const stripeThickness = DISK_RADIUS / 2

const PATTERN_FILLERS: Record<DiskPattern, Filler> = {
  'black': (ctx, x, y, radius) => {
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, 0, twopi)
    ctx.fill()
  },
  'white': (ctx, x, y, radius) => {
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, 0, twopi)
    ctx.fill()
  },
  'v-stripe': (ctx, x, y, radius) => {
    // // Draw a white circle background
    // ctx.fillStyle = 'white'
    // ctx.beginPath()
    // ctx.moveTo(x, y)
    // ctx.arc(x, y, radius, 0, twopi)
    // ctx.fill()

    // Draw vertical black stripes, anchored to world coordinates
    const stripeWidth = stripeThickness;
    const left = x - radius;
    const top = y - radius;
    const right = x + radius;
    const bottom = y + radius;
    // Anchor stripes to world coordinates (stripe origin at x=0)
    const firstStripeX = left - ((left % (2 * stripeWidth) + 2 * stripeWidth) % (2 * stripeWidth));
    for (let sx = firstStripeX; sx < right; sx += 2 * stripeWidth) {
      ctx.fillStyle = 'black';
      // For each vertical stripe, clip the corners to the circle
      // For each y (top and bottom), find the intersection with the circle for sx and sx+stripeWidth
      // Only draw if the intersection exists (inside the circle)
      const x0 = Math.max(sx, left);
      const x1 = Math.min(sx + stripeWidth, right);
      // For each x0, x1, compute the y-range inside the circle
      ctx.beginPath();
      for (let xi of [x0, x1]) {
        // Top intersection
        const dx = xi - x;
        if (Math.abs(dx) <= radius) {
          const dy = Math.sqrt(radius * radius - dx * dx);
          ctx.moveTo(xi, y - dy);
          ctx.lineTo(xi, y + dy);
        }
      }
      // Connect the four corners (top x0, top x1, bottom x1, bottom x0)
      // Only if both x0 and x1 are inside the circle
      const dx0 = x0 - x;
      const dx1 = x1 - x;
      if (Math.abs(dx0) <= radius && Math.abs(dx1) <= radius) {
        const dy0 = Math.sqrt(radius * radius - dx0 * dx0);
        const dy1 = Math.sqrt(radius * radius - dx1 * dx1);
        ctx.beginPath();
        ctx.moveTo(x0, y - dy0);
        ctx.lineTo(x1, y - dy1);
        ctx.lineTo(x1, y + dy1);
        ctx.lineTo(x0, y + dy0);
        ctx.closePath();
        ctx.fill();
      }
    }
  },
  'h-stripe': (ctx, x, y, radius) => {
    // // Draw a white circle background
    // ctx.fillStyle = 'white'
    // ctx.beginPath()
    // ctx.moveTo(x, y)
    // ctx.arc(x, y, radius, 0, twopi)
    // ctx.fill()

    // Draw horizontal black stripes, anchored to world coordinates
    const stripeWidth = stripeThickness;
    const left = x - radius;
    const top = y - radius;
    const right = x + radius;
    const bottom = y + radius;
    // Anchor stripes to world coordinates (stripe origin at y=0)
    const firstStripeY = top - ((top % (2 * stripeWidth) + 2 * stripeWidth) % (2 * stripeWidth));
    for (let sy = firstStripeY; sy < bottom; sy += 2 * stripeWidth) {
      ctx.fillStyle = 'black';
      // For each horizontal stripe, clip the corners to the circle
      // For each x (left and right), find the intersection with the circle for sy and sy+stripeWidth
      // Only draw if the intersection exists (inside the circle)
      const y0 = Math.max(sy, top);
      const y1 = Math.min(sy + stripeWidth, bottom);
      // For each y0, y1, compute the x-range inside the circle
      const dy0 = y0 - y;
      const dy1 = y1 - y;
      if (Math.abs(dy0) <= radius && Math.abs(dy1) <= radius) {
        const dx0 = Math.sqrt(radius * radius - dy0 * dy0);
        const dx1 = Math.sqrt(radius * radius - dy1 * dy1);
        ctx.beginPath();
        ctx.moveTo(x - dx0, y0);
        ctx.lineTo(x + dx0, y0);
        ctx.lineTo(x + dx1, y1);
        ctx.lineTo(x - dx1, y1);
        ctx.closePath();
        ctx.fill();
      }
    }
  },
}

function fillDiskPattern(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, radius: number,
  pattern: DiskPattern,
) {
  PATTERN_FILLERS[pattern](ctx, x, y, radius)
}
