/**
 * @file gas-box-constants.ts
 * 
 * Gass box constants.
 */

import { VALUE_SCALE } from "./constants"

export const N_GAS_BOX_PARTICLES = 100

export const GAS_BOX_WIDTH = 20 * VALUE_SCALE
export const GAS_BOX_HEIGHT = 20 * VALUE_SCALE

export const GAS_BOX_MAX_SPEED = 80 // per-axis max speed in sim-units

export const GAS_BOX_SOLVE_STEPS = 10000 // number of steps for final simulation to reach solved state