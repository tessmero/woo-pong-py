/**
 * @file constants.ts
 *
 * Constants.
 */

export type Speed
  = 'normal' | 'paused' | 'fast'

export const SPEEDS: Record<Speed, number> = {
  normal: 4,
  paused: 0.0,
  fast: 10,
}

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
export const LOOK_AHEAD_STEPS = 700 // start halting when this close to branch time with no selection

export const BOBRICK_WIDTH = 16 * VALUE_SCALE
export const BOBRICK_HEIGHT = 8 * VALUE_SCALE
export const BOBRICK_PADDING = 2 * VALUE_SCALE
