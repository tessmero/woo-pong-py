/**
 * @file shapes.ts
 *
 * List of shape names and paths.
 */

import { circleObsRadius } from './constants'

export const SHAPE_PATHS = {

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
} as const

export type ShapeName = keyof typeof SHAPE_PATHS
