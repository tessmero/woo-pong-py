/**
 * @file ferris-wheel-constants.ts
 *
 * Shape parameters for the ferris wheel obstacle.
 */

import { VALUE_SCALE } from 'simulation/constants'
import { GEAR_ORBIT_RADIUS } from './gear-constants'

/** Number of cars on the ferris wheel. */
export const N_FERRIS_CARS = 6

/** Total animation frames per full ferris wheel revolution. */
export const N_FERRIS_FRAMES = 18000

if (!Number.isInteger(N_FERRIS_FRAMES / N_FERRIS_CARS)) {
  throw new Error('ferris wheel frames must be a multiple of car count')
}

/** Radius of the ferris wheel hub (big center circle). */
export const FERRIS_HUB_RADIUS = 4.05 * VALUE_SCALE

/** Radius of each car's collision circle. */
export const FERRIS_CAR_RADIUS = 4.05 * VALUE_SCALE

/** Distance from ferris wheel center to each car center. */
export const FERRIS_ORBIT_RADIUS = 2 * GEAR_ORBIT_RADIUS

/** Radius of the decorative hole in the hub. Set to 0 to disable. */
export const FERRIS_HOLE_RADIUS = FERRIS_HUB_RADIUS * 0.4
