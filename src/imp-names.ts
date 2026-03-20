/**
 * @file imp-names.ts
 *
 * Names for implementations of certain base classes.
 *
 * Used to support to static registery pattern in base classes.
 * Base classes define a static register method that implementations call.
 */

// list of implementations for one base class
export type ImpManifest = {
  NAMES: Array<string> // names to pass to register() and create()
  SOURCES: Array<string> // source file patterns used in tools and tests
}

// guis
export const GUI = {
  NAMES: [
    // 'title-screen-gui',
    // 'warning-gui',
    'playing-gui',
  ],
  SOURCES: ['src/guis/imp/**/*.ts'],
} as const satisfies ImpManifest
export type GuiName = (typeof GUI.NAMES)[number]

// configurables
export const CONFIGURABLE = {
  NAMES: [
    'pinball-wizard-config', // combined tree shown in debug ui
    'layout-config',
    'top-config', 'gfx-config', 'physics-config',
  ],
  SOURCES: ['src/configs/imp/**/*.ts'],
} as const satisfies ImpManifest
export type ConfigurableName = (typeof CONFIGURABLE.NAMES)[number]

// lookup tables
export const LUT = {
  NAMES: [
    'disk-friction-lut', // before -> after velocity being reduced due to friction
    'disk-disk-lut', // bounce two colliding disks
    'obstacle-lut', // identify solid edge when disk collides with obstacle
    'disk-normal-lut', // bounce disk off of solid edge
    'gear-lut', // positions of teeth on a spinning gear
    // 'gas-box-lut',
    // 'hilbert-lut', // density-adaptive Hilbert curve through dark image regions

    'race-lut', // precomputed races (start seed + midpoint seeds for each disk to win)

    // 'loop-lut', // precomputed time travel loop (start seed, start states, portals)

  ],
  SOURCES: ['src/simulation/luts/imp/**/*.ts'],
} as const satisfies ImpManifest
export type LutName = (typeof LUT.NAMES)[number]

// rooms (level segments)
export const ROOM = {
  NAMES: [
    'start-room', 'finish-room',
    'basic-room', // just regular static obstacles
    'pong-room',
    // 'breakout-room', // numbered bricks disappear after collision
    // 'sorter-room', // balls pass through or end up in numbered regions

    'gear-room', // spinning interlocked gears
    'fast-gear-room',
    'ferris-wheel-room', // spinning wheel

    'empty-room', // no obstacles
    // 'loop-room', // used for loop sim
  ],
  SOURCES: ['src/rooms/imp/**/*.ts'],
} as const satisfies ImpManifest
export type RoomName = (typeof ROOM.NAMES)[number]

// room layouts
export const ROOM_LAYOUT = {
  NAMES: [
    'four-by-four',
    'breakout', 'honeycomb', 'three-by-three',

    'two-gears',
  ],
  SOURCES: ['src/rooms/room-layouts/imp/**/*.ts'],
} as const satisfies ImpManifest
export type RoomLayoutName = (typeof ROOM_LAYOUT.NAMES)[number]

// starting pos/vel for balls
export const START_LAYOUT = {
  NAMES: [
    'spin', 'pool',
  ],
  SOURCES: ['src/rooms/start-layouts/imp/**/*.ts'],
} as const satisfies ImpManifest
export type StartLayoutName = (typeof START_LAYOUT.NAMES)[number]

// main playing screen segments
export const GFX_REGION = {
  NAMES: [

    'sim-gfx', 'loop-gfx',
    'scrollbar-gfx', 'bottom-bar-gfx', 'top-bar-gfx',

    'glass-gfx', // overlay that covers main view

    'timeline-gfx', // toggleable timeline
    'bsp-gfx', // toggleable ball selection panel
    'settings-gfx', // toggleable settings panel

    'start-gfx', // temporary layer on top
  ],
  SOURCES: ['src/gfx/regions/imp/'],
} as const satisfies ImpManifest
export type GfxRegionName = (typeof GFX_REGION.NAMES)[number]

export const PATTERN = {
  NAMES: [
    'white', 'black',
    'stripe-v', 'stripe-h', 'hex-a', 'hex-b', 'fence',
    'diamond-a', 'diamond-b', 'brick',
  ],
  SOURCES: ['src/gfx/patterns/imp'],
} as const satisfies ImpManifest
export type PatternName = (typeof PATTERN.NAMES)[number]
export const SHUFFLED_PATTERN_NAMES = [...PATTERN.NAMES]

// title screen pages
export const PAGE = {
  NAMES: [
    'cover-page',
    'second-page',
  ],
  SOURCES: ['src/title-screen/pages/imp/**/*.ts'],
} as const satisfies ImpManifest
export type PageName = (typeof PAGE.NAMES)[number]
