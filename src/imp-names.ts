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

// configurables
export const CONFIGURABLE = {
  NAMES: [
    'pinball-wizard-config', // combined tree shown in debug ui
    'top-config', 'gfx-config', 'physics-config',
    'layout-config', // adjust gui layouts at runtime
  ],
  SOURCES: ['src/configs/imp/**/*.ts'],
} as const satisfies ImpManifest
export type ConfigurableName = (typeof CONFIGURABLE.NAMES)[number]

// lookup tables
export const LUT = {
  NAMES: [
    'disk-disk-lut',
  ],
  SOURCES: ['src/simulation/luts/imp/**/*.ts'],
} as const satisfies ImpManifest
export type LutName = (typeof LUT.NAMES)[number]
