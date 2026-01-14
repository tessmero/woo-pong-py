/**
 * @file constants.ts
 *
 * Constants.
 */

export type Speed
  = 'normal' | 'paused' | 'fast'

export const SPEEDS: Record<Speed, number> = {
  normal: 1,
  paused: 0.0,
  fast: 1000,
}
export const SPEED_LERP = 1e-1 // lerp towards target speed per ms

export const DISK_COUNT = 10
export const BOBRICK_COUNT = 30

export const ROOM_COUNT = 5

export const RESTITUTION = 1

export const STEP_DURATION = 4
export const VALUE_SCALE = 1e4
export const OBSTACLE_DETAIL_SCALE = 1e3

export const DISK_RADIUS = 3 * VALUE_SCALE
export const DISK_RADSQ = DISK_RADIUS * DISK_RADIUS

export const STEPS_BEFORE_BRANCH = 1e4 // number of steps before branching

export const BOBRICK_WIDTH = 16 * VALUE_SCALE
export const BOBRICK_HEIGHT = 8 * VALUE_SCALE
export const BOBRICK_PADDING = 2 * VALUE_SCALE
