/**
 * @file gear-constants.ts
 *
 * Shape parameters for the spinning gear obstacle.
 */

import { DISK_RADIUS, VALUE_SCALE } from 'simulation/constants'

/** Number of teeth on the gear. */
export const N_GEAR_TEETH = 6

/** Total animation frames per full gear revolution. */
export const N_GEAR_FRAMES = 6000

if (!Number.isInteger(N_GEAR_FRAMES / N_GEAR_TEETH)) {
  throw new Error('gear frames must be a multiple of gear teeth')
}

/** Distance from gear center to each tooth center. */
export const GEAR_ORBIT_RADIUS = 4 * DISK_RADIUS

/** Effective radius of the big-circle obstacle (SVG radius 200 × scale VALUE_SCALE/10). */
export const BIG_CIRCLE_RADIUS = 150 * VALUE_SCALE / 10

/** Effective radius of each tooth circle obstacle (SVG radius 200 × scale VALUE_SCALE/40). */
export const TOOTH_RADIUS = 200 * VALUE_SCALE / 40

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
