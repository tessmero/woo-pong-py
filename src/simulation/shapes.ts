/**
 * @file shapes.ts
 *
 * List of shape names and paths.
 */

import { BOBRICK_HEIGHT, BOBRICK_WIDTH } from 'rooms/imp/breakout-room'
import { VALUE_SCALE } from './constants'

export const SHAPE_NAMES = [
  // 'square', 'circle', 'triangle',
  'roundrect',
  'breakoutbrick',
  'diamond',
  'sine',
  'rightwedge',
  'leftwedge',
  'star',
] as const
export type ShapeName = (typeof SHAPE_NAMES)[number]

const mediumRadius = 5 * VALUE_SCALE
const cornerRadius = 1 * VALUE_SCALE
const wedgeWidth = 45 * VALUE_SCALE

function scaleSvgPath(path: string, scale: number): string {
  // This function scales all numbers in the SVG path by the given scale factor.
  // It matches numbers (including decimals, negatives, and exponents) and multiplies them.
  return path.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (num) => {
    return String(parseFloat(num) * scale)
  })
}

export const SHAPE_PATHS: Record<ShapeName, string> = {
  // ...existing code...
  roundrect: generateRoundedRectPath(
    5 * mediumRadius, 1 * mediumRadius, cornerRadius),

  breakoutbrick: generateRoundedRectPath(
    BOBRICK_WIDTH, BOBRICK_HEIGHT, cornerRadius),

  diamond: scaleSvgPath(
    `M197.6 42.4 42.4 197.6a60 60 0 0 0 0 84.8l155.2 155.2a60 60 0 0 0 84.8 0l155.2-155.2a60 60 0 0 0 0-84.8L282.4 42.4a60 60 0 0 0-84.8 0Z`,
    VALUE_SCALE / 40,
  ),

  star: scaleSvgPath(
    `M256 38.013c-22.458 0-66.472 110.3-84.64 123.502-18.17 13.2-136.674 20.975-143.614 42.334-6.94 21.358 84.362 97.303 91.302 118.662 6.94 21.36-22.286 136.465-4.116 149.665 18.17 13.2 118.61-50.164 141.068-50.164 22.458 0 122.9 63.365 141.068 50.164 18.17-13.2-11.056-128.306-4.116-149.665 6.94-21.36 98.242-97.304 91.302-118.663-6.94-21.36-125.444-29.134-143.613-42.335-18.168-13.2-62.182-123.502-84.64-123.502z`,
    VALUE_SCALE / 40,
  ),

  // Long vertical capsule with 5 sine periods along its length.
  sine: generateSineCapsulePath(
    2 * mediumRadius, // approximate width
    10 * mediumRadius, // approximate height
    mediumRadius * 0.4, // horizontal amplitude of the sine
    5, // number of wave periods along vertical axis
  ),
  // Wide right triangle wedge with rounded corners,
  // aligned/centered similarly to breakoutbrick.
  rightwedge: rightTrianglePath(
    wedgeWidth,
    BOBRICK_HEIGHT,
    cornerRadius,
  ),
  leftwedge: mirroredRightTrianglePath(
    wedgeWidth,
    BOBRICK_HEIGHT,
    cornerRadius,
  ),
}

export function rightTrianglePath(width: number, height: number, r: number): string {
  const hw = width / 2, hh = height / 2
  return `M${-hw + r},${hh} `
    + `L${hw - r},${hh} `
    + `Q${hw},${hh} ${hw},${hh - r} `
    + `L${hw},${-hh + r} `
    + `Q${hw},${-hh} ${hw - r},${-hh} `
    + `L${-hw + r},${hh - r} `
    + `Q${-hw},${hh} ${-hw + r},${hh} Z`
}

export function mirroredRightTrianglePath(width: number, height: number, r: number): string {
  const hw = width / 2, hh = height / 2
  return `M${hw - r},${hh} `
    + `Q${hw},${hh} ${hw - r},${hh - r} `
    + `L${-hw + r},${-hh} `
    + `Q${-hw},${-hh} ${-hw},${-hh + r} `
    + `L${-hw},${hh - r} `
    + `Q${-hw},${hh} ${-hw + r},${hh} `
    + `L${hw - r},${hh} Z`
}

export function generateRoundedRectPath(width: number, height: number, cornerRadius: number): string {
  const halfWidth = width / 2
  const halfHeight = height / 2

  return `M${-halfWidth + cornerRadius},${halfHeight} `
    + `L${halfWidth - cornerRadius},${halfHeight} `
    + `Q${halfWidth},${halfHeight} ${halfWidth},${halfHeight - cornerRadius} `
    + `L${halfWidth},${-halfHeight + cornerRadius} `
    + `Q${halfWidth},${-halfHeight} ${halfWidth - cornerRadius},${-halfHeight} `
    + `L${-halfWidth + cornerRadius},${-halfHeight} `
    + `Q${-halfWidth},${-halfHeight} ${-halfWidth},${-halfHeight + cornerRadius} `
    + `L${-halfWidth},${halfHeight - cornerRadius} `
    + `Q${-halfWidth},${halfHeight} ${-halfWidth + cornerRadius},${halfHeight} Z`
}

/**
 * Generate a vertical capsule where the left and right sides are sine waves.
 * The capsule is centered at (0,0) and extends from -height/2 to +height/2 in y.
 * There are `periods` full sine periods along the height.
 */
export function generateSineCapsulePath(
  width: number,
  height: number,
  amplitude: number,
  periods: number,
  segmentsPerPeriod: number = 16,
): string {
  const halfWidth = width / 2
  const halfHeight = height / 2

  // Total segments along one side.
  const totalSegments = periods * segmentsPerPeriod
  const dy = height / totalSegments
  const omega = 2 * Math.PI * periods / height

  const leftPoints: Array<{ x: number, y: number }> = []
  const rightPoints: Array<{ x: number, y: number }> = []

  // Generate points from bottom (-halfHeight) to top (+halfHeight).
  for (let i = 0; i <= totalSegments; i++) {
    const y = -halfHeight + i * dy
    const phase = omega * (y + halfHeight) // 0 at bottom, 2π*periods at top

    const offset = Math.sin(phase) * amplitude

    // Left side is centered at -halfWidth, right side at +halfWidth.
    leftPoints.push({ x: -halfWidth + offset, y })
    rightPoints.push({ x: halfWidth + offset, y })
  }

  // Build path: start at bottom of left side, go up, then across top, down right, and across bottom.
  const parts: Array<string> = []

  // Move to first left point.
  const firstLeft = leftPoints[0]
  parts.push(`M${firstLeft.x},${firstLeft.y}`)

  // Left side up.
  for (let i = 1; i < leftPoints.length; i++) {
    const p = leftPoints[i]
    parts.push(`L${p.x},${p.y}`)
  }

  // Top connection: from last left to last right.
  const lastRight = rightPoints[rightPoints.length - 1]
  parts.push(`L${lastRight.x},${lastRight.y}`)

  // Right side down.
  for (let i = rightPoints.length - 2; i >= 0; i--) {
    const p = rightPoints[i]
    parts.push(`L${p.x},${p.y}`)
  }

  // Close along bottom (implicit line back to firstLeft).
  parts.push('Z')

  return parts.join(' ')
}
