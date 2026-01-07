/**
 * @file shapes.ts
 *
 * List of shape names and paths.
 */

import { VALUE_SCALE } from './constants'

export const SHAPE_NAMES = [
  // 'square', 'circle', 'triangle',
  'roundrect',
] as const
export type ShapeName = (typeof SHAPE_NAMES)[number]

const mediumRadius = 5 * VALUE_SCALE
const cornerRadius = 1 * VALUE_SCALE

export const SHAPE_PATHS: Record<ShapeName, string> = {

  // square: `M${-mediumRadius},${mediumRadius} `
  //   + `L${mediumRadius},${mediumRadius} `
  //   + `L${mediumRadius},${-mediumRadius} `
  //   + `L${-mediumRadius},${-mediumRadius} Z`,

  // circle: `M0,${-mediumRadius} `
  //   + `A${mediumRadius},${mediumRadius} 0 1,0 0,${mediumRadius} `
  //   + `A${mediumRadius},${mediumRadius} 0 1,0 0,${-mediumRadius} Z`,

  // triangle: `M0,${-mediumRadius} `
  //   + `L${-mediumRadius},${mediumRadius} `
  //   + `L${mediumRadius},${mediumRadius} Z`,

  roundrect: generateRoundedRectPath(
    3 * mediumRadius, 0.5 * mediumRadius, cornerRadius),
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
