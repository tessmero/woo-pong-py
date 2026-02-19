/**
 * @file constants.ts
 *
 * Constants.
 */

export type Speed
  = 'normal' | 'paused' | 'fast' | 'faster'

export const SPEEDS: Record<Speed, number> = {
  paused: 0.0,
  normal: 2,
  fast: 6,
  faster: 30,
}

export const INT16_MIN = -32768
export const INT16_MAX = 32767

export const INT32_MIN = -2147483648
export const INT32_MAX = 2147483647

export const DISK_COUNT = 10
export const BOBRICK_COUNT = 30

export const ROOM_COUNT = 9

export const RESTITUTION = 0.95

export const STEP_DURATION = 4 // millisecs per step
export const VALUE_SCALE = 1e4
export const OBSTACLE_DETAIL_SCALE = 1e3

export const DISK_RADIUS = 4 * VALUE_SCALE
export const DISK_RADSQ = DISK_RADIUS * DISK_RADIUS

// radius for purposes of clicking disks in simulation
export const CLICKABLE_RADIUS = DISK_RADIUS * 2
export const CLICKABLE_RADSQ = CLICKABLE_RADIUS * CLICKABLE_RADIUS

// number of past steps to store for purposes of drawing tails behind disks
export const TAIL_STEPS = 100

export const HISTORY_MAX_ENTRIES = 100
export const HISTORY_CHECKPOINT_STEPS = 1e3 // take checkpoint ever n steps

// maximum allowed simulation length
export const HISTORY_MAX_STEPS = HISTORY_MAX_ENTRIES * HISTORY_CHECKPOINT_STEPS

// number of steps to simulate ahead of time to support audio latency correction
export const LATENCY_LOOK_AHEAD_STEPS = Math.floor(1000 / STEP_DURATION) // (1 second)

export const STEPS_BEFORE_BRANCH = 1.5e4 // number of steps before branching (30 sec)
export const HALT_LOOK_AHEAD_STEPS = 200 // start halting when this close to branch time with no selection

export function stepsToSeconds(steps: number) {
  return Math.floor(steps * STEP_DURATION / SPEEDS.normal / 1000)
}
export const SECONDS_BEFORE_BRANCH = stepsToSeconds(STEPS_BEFORE_BRANCH)

export const BOBRICK_WIDTH = 16 * VALUE_SCALE
export const BOBRICK_HEIGHT = 8 * VALUE_SCALE
export const BOBRICK_PADDING = 2 * VALUE_SCALE
