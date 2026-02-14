/**
 * @file gas-box-lut.ts
 *
 * Initial states for gas box particles.
 */

import { GAS_BOX_HEIGHT, GAS_BOX_MAX_SPEED, GAS_BOX_WIDTH, N_GAS_BOX_PARTICLES, GAS_BOX_SOLVE_STEPS } from 'simulation/gas-box-constants'
import { INT32_MAX, INT32_MIN, INT16_MAX, INT16_MIN } from 'simulation/constants'
import { Lut } from '../lut'
import { PATTERN } from 'imp-names'
import { LUT_BLOBS } from 'set-by-build'
import { Perturbations } from 'simulation/perturbations'
import { mod } from 'util/math-util'

const leafLength = N_GAS_BOX_PARTICLES * 6 // xHi,xLo,yHi,yLo,vx,vy for each particle

type TLeaf = Array<number>

export class GasBoxLut extends Lut<TLeaf> {
  override detail = [PATTERN.NAMES.length] // one solution for each pattern

  blobUrl = LUT_BLOBS.GAS_BOX_LUT.url
  blobHash = LUT_BLOBS.GAS_BOX_LUT.hash

  override assertValidLeaf(leaf: TLeaf) {
    for (let i = 0; i < leaf.length; i++) {
      const value = leaf[i]
      if (!Number.isInteger(value)) {
        throw new Error(`${value} is non-integer`)
      }
      const isXY = (i % 4) < 2 // x and y are at offsets 0,1 within each group of 4
      if (isXY) {
        if (value < INT32_MIN || value > INT32_MAX) {
          throw new Error(`${value} is outside of int32 range.`)
        }
      }
      else {
        if (value < INT16_MIN || value > INT16_MAX) {
          throw new Error(`${value} is outside of int16 range.`)
        }
      }
    }
  }

  override encodeLeaf(leaf: TLeaf): Array<number> {
    const encoded: Array<number> = []
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      const base = i * 4
      const x = leaf[base]
      const y = leaf[base + 1]
      const vx = leaf[base + 2]
      const vy = leaf[base + 3]
      encoded.push(
        (x >> 16) & 0xFFFF, // xHi
        x & 0xFFFF, // xLo
        (y >> 16) & 0xFFFF, // yHi
        y & 0xFFFF, // yLo
        vx,
        vy,
      )
    }
    // Convert unsigned to signed int16 for storage
    return encoded.map(v => (v > INT16_MAX) ? v - 0x10000 : v)
  }

  override decodeLeaf(values: Array<number>): TLeaf {
    const decoded: Array<number> = []
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      const base = i * 6
      const xHi = values[base] & 0xFFFF
      const xLo = values[base + 1] & 0xFFFF
      const yHi = values[base + 2] & 0xFFFF
      const yLo = values[base + 3] & 0xFFFF
      const vx = values[base + 4]
      const vy = values[base + 5]
      decoded.push(
        (xHi << 16) | xLo,
        (yHi << 16) | yLo,
        vx,
        vy,
      )
    }
    return decoded
  }

  override computeLeaf(index: Array<number>): TLeaf {
    const bw = GAS_BOX_WIDTH
    const bh = GAS_BOX_HEIGHT

    // set solved state
    const particles: Array<[number, number, number, number]> = []
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      const fx = Math.round(i * bw / N_GAS_BOX_PARTICLES)// ((Perturbations.nextInt() >>> 0) % bw)
      const fy = Math.round(i * bh / N_GAS_BOX_PARTICLES)// ((Perturbations.nextInt() >>> 0) % bh)
      const sx = ((Perturbations.nextInt() >>> 0) % (2 * GAS_BOX_MAX_SPEED + 1)) - GAS_BOX_MAX_SPEED
      const sy = ((Perturbations.nextInt() >>> 0) % (2 * GAS_BOX_MAX_SPEED + 1)) - GAS_BOX_MAX_SPEED
      particles.push([fx, fy, sx, sy])
    }

    // advance simulation
    for (let step = 0; step < GAS_BOX_SOLVE_STEPS; step++) {
      for (const p of particles) {
        p[0] = mod(p[0] + p[2], bw)
        p[1] = mod(p[1] + p[3], bh)
      }
    }

    // save unsolved state with reversed velocities
    const result: Array<number> = []
    for (const [fx, fy, sx, sy] of particles) {
      result.push (
        fx, fy, -sx, -sy,
      )
    }

    return result
  }

  static {
    Lut.register('gas-box-lut', {
      factory: () => new GasBoxLut(),
      depth: 1,
      leafLength,
    })
  }
}
