/**
 * @file shapes.ts
 *
 * List of shape names and paths.
 */

import { circleObsRadius } from './constants'

export const SHAPE_NAMES = ['square', 'circle', 'triangle'] as const
export type ShapeName = (typeof SHAPE_NAMES)[number]

export const SHAPE_PATHS: Record<ShapeName, string> = {

  square: `M${-circleObsRadius},${circleObsRadius} `
    + `L${circleObsRadius},${circleObsRadius} `
    + `L${circleObsRadius},${-circleObsRadius} `
    + `L${-circleObsRadius},${-circleObsRadius} Z`,

  circle: `M0,${-circleObsRadius} `
    + `A${circleObsRadius},${circleObsRadius} 0 1,0 0,${circleObsRadius} `
    + `A${circleObsRadius},${circleObsRadius} 0 1,0 0,${-circleObsRadius} Z`,

  triangle: `M0,${-circleObsRadius} `
    + `L${-circleObsRadius},${circleObsRadius} `
    + `L${circleObsRadius},${circleObsRadius} Z`,
}
