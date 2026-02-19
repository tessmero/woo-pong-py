/**
 * @file sim-hash.ts
 *
 * Deterministic hash of simulation state for verifying reproducibility.
 * Uses a simple integer hash (FNV-1a style) over all disk states and
 * obstacle positions that change each step.
 */

import { step } from './sim-step'
import type { Simulation } from './simulation'

const HASH_STEP_INTERVAL = 100

/**
 * Compute a deterministic 32-bit hash of the simulation state.
 * Covers all disk positions/velocities and all obstacle positions/collisionRects.
 */
export function computeSimHash(sim: Simulation): number {
  let h = 0x811c9dc5 // FNV offset basis

  for (const disk of sim.disks) {
    const s = disk.currentState
    h = _hash32(h, s.x)
    h = _hash32(h, s.y)
    h = _hash32(h, s.dx)
    h = _hash32(h, s.dy)
  }

  for (const obs of sim.obstacles) {
    h = _hash32(h, obs.pos[0])
    h = _hash32(h, obs.pos[1])
    h = _hash32(h, obs.collisionRect[0])
    h = _hash32(h, obs.collisionRect[1])
  }

  return h >>> 0 // unsigned
}

/** FNV-1a mix: feed a 32-bit integer value into hash state. */
function _hash32(h: number, v: number): number {
  // split value into 4 bytes and mix each
  h ^= (v & 0xFF)
  h = Math.imul(h, 0x01000193)
  h ^= ((v >>> 8) & 0xFF)
  h = Math.imul(h, 0x01000193)
  h ^= ((v >>> 16) & 0xFF)
  h = Math.imul(h, 0x01000193)
  h ^= ((v >>> 24) & 0xFF)
  h = Math.imul(h, 0x01000193)
  return h
}

/**
 * Collect hashes at regular step intervals during a full simulation run.
 * Returns a map of stepCount -> hash.
 */
export function collectSimHashes(sim: Simulation, maxSteps: number): Record<number, number> {
  const hashes: Record<number, number> = {}

  for (let i = 0; i < maxSteps; i++) {
    step(sim)
    if (sim.stepCount % HASH_STEP_INTERVAL === 0) {
      hashes[sim.stepCount] = computeSimHash(sim)
    }
    if (sim.winningDiskIndex !== -1) {
      // also hash at final step
      hashes[sim.stepCount] = computeSimHash(sim)
      break
    }
  }

  return hashes
}

/**
 * Check hash against expected value at current step. Throws on mismatch.
 * Called from Simulation.step() at runtime.
 */
export function checkSimHash(sim: Simulation): void {
  if (sim.stepCount % HASH_STEP_INTERVAL !== 0) return

  const expected = sim.expectedHashes
  if (!expected) return

  const key = sim.stepCount
  if (!(key in expected)) return

  const actual = computeSimHash(sim)
  if (actual !== expected[key]) {
    throw new Error(
      `Determinism check failed at step ${key}: `
      + `expected hash ${(expected[key] >>> 0).toString(16)}, `
      + `got ${(actual >>> 0).toString(16)}`,
    )
  }
}

export { HASH_STEP_INTERVAL }
