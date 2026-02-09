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
    'disk-friction-lut', //
    'disk-disk-lut', // bounce two colliding disks
    'obstacle-lut', // identify solid edge when disk collides with obstacle
    'disk-normal-lut', // bounce disk off of solid edge
    'race-lut', // precomputed races (start seed + midpoint seeds for each disk to win)
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
    'breakout-room', // numbered bricks disappear after collision
    // 'sorter-room', // balls pass through or end up in numbered regions
  ],
  SOURCES: ['src/rooms/imp/**/*.ts'],
} as const satisfies ImpManifest
export type RoomName = (typeof ROOM.NAMES)[number]

// basic room layouts
export const ROOM_LAYOUT = {
  NAMES: [
    'four-by-four',
    'breakout', 'honeycomb', 'three-by-three',
  ],
  SOURCES: ['src/room-layouts/**/*.ts'],
} as const satisfies ImpManifest
export type RoomLayoutName = (typeof ROOM_LAYOUT.NAMES)[number]

// main playing screen segments
export const GFX_REGION = {
  NAMES: [

    // always visible
    'sim-gfx', 'scrollbar-gfx', 'bottom-bar-gfx', 'top-bar-gfx',

    'glass-gfx', // overlay that covers main view

    'bsp-gfx', // toggleable ball selection panel
    'settings-gfx', // toggleable settings panel
  ],
  SOURCES: ['src/gfx/regions/imp/'],
} as const satisfies ImpManifest
export type GfxRegionName = (typeof GFX_REGION.NAMES)[number]

export const PATTERN = {
  NAMES: [
    'white', 'black', 'stripe-v', 'stripe-h', 'checkered', 'hex-a', 'hex-b', 'fence',
  ],
  SOURCES: ['src/gfx/patterns/imp'],
} as const satisfies ImpManifest
export type PatternName = (typeof PATTERN.NAMES)[number]
