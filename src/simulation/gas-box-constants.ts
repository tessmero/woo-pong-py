/**
 * @file gas-box-constants.ts
 * 
 * Gass box constants.
 */

import { VALUE_SCALE } from "./constants"

export const N_GAS_BOX_PARTICLES = 1000

export const GAS_BOX_PARTICLE_RADIUS = VALUE_SCALE / 5

export const GAS_BOX_WIDTH = 100 * VALUE_SCALE
export const GAS_BOX_HEIGHT = 50 * VALUE_SCALE

export const GAS_BOX_MIN_SPEED = 40 // min speed in sim-units
export const GAS_BOX_MAX_SPEED = 80 // max speed in sim-units

export const GAS_BOX_SOLVE_STEPS = 20000 // number of steps for final simulation to reach solved state