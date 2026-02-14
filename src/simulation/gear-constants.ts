/**
 * @file gear-constants.ts
 *
 * Shape parameters for the spinning gear obstacle.
 */

import { VALUE_SCALE } from 'simulation/constants'

/** Number of teeth on the gear. */
export const N_GEAR_TEETH = 6

/** Total animation frames per full gear revolution. */
export const N_GEAR_FRAMES = 18000

if (!Number.isInteger(N_GEAR_FRAMES / N_GEAR_TEETH)) {
  throw new Error('gear frames must be a multiple of gear teeth')
}

/** Effective radius of the big-circle obstacle (SVG radius 200 × scale VALUE_SCALE/10). */
export const BIG_CIRCLE_RADIUS = 12 * VALUE_SCALE

/** Effective radius of each tooth circle obstacle (SVG radius 200 × scale VALUE_SCALE/40). */
export const TOOTH_RADIUS = 4.05 * VALUE_SCALE

/** Distance from gear center to each tooth center. */
export const GEAR_ORBIT_RADIUS = BIG_CIRCLE_RADIUS + TOOTH_RADIUS

export const GEAR_FILLET_RADIUS = TOOTH_RADIUS * 0.5

/** Radius of the hole cut out of the gear center. Set to 0 to disable. */
export const GEAR_HOLE_RADIUS = BIG_CIRCLE_RADIUS * 0.4

/** Angle at center circle where a tooth intersects (law of cosines). */
export const GEAR_ALPHA = Math.acos(
  (GEAR_ORBIT_RADIUS ** 2 + BIG_CIRCLE_RADIUS ** 2 - TOOTH_RADIUS ** 2)
  / (2 * GEAR_ORBIT_RADIUS * BIG_CIRCLE_RADIUS),
)

/** Angle at tooth circle where center circle intersects (law of cosines). */
export const GEAR_BETA = Math.acos(
  (GEAR_ORBIT_RADIUS ** 2 + TOOTH_RADIUS ** 2 - BIG_CIRCLE_RADIUS ** 2)
  / (2 * GEAR_ORBIT_RADIUS * TOOTH_RADIUS),
)
