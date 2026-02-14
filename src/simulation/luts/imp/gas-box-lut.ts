/**
 * @file gas-box-lut.ts
 *
 * Initial states for gas box particles.
 */

import { GAS_BOX_HEIGHT, GAS_BOX_MAX_SPEED, GAS_BOX_WIDTH, N_GAS_BOX_PARTICLES, GAS_BOX_SOLVE_STEPS, GAS_BOX_MIN_SPEED } from 'simulation/gas-box-constants'
import { INT32_MAX, INT32_MIN, INT16_MAX, INT16_MIN } from 'simulation/constants'
import { Lut } from '../lut'
import { PATTERN } from 'imp-names'
import { LUT_BLOBS } from 'set-by-build'
import { GasBoxSim } from 'simulation/gas-box-sim'

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

  override computeLeaf(_index: Array<number>): TLeaf {
    const bw = GAS_BOX_WIDTH
    const bh = GAS_BOX_HEIGHT

    // build typed arrays from random initial state
    const px = new Int32Array(N_GAS_BOX_PARTICLES)
    const py = new Int32Array(N_GAS_BOX_PARTICLES)
    const dx = new Int32Array(N_GAS_BOX_PARTICLES)
    const dy = new Int32Array(N_GAS_BOX_PARTICLES)
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      px[i] = Math.floor(bw * i / N_GAS_BOX_PARTICLES)
      py[i] = Math.floor(bh * i / N_GAS_BOX_PARTICLES)
      const angle = Math.random() * 2 * Math.PI
      const radius = GAS_BOX_MIN_SPEED
        + (GAS_BOX_MAX_SPEED - GAS_BOX_MIN_SPEED) * Math.sqrt(Math.random())
      dx[i] = Math.round(radius * Math.cos(angle))
      dy[i] = Math.round(radius * Math.sin(angle))
    }

    // advance simulation using GasBoxSim
    const sim = GasBoxSim.fromArrays(px, py, dx, dy)
    for (let step = 0; step < GAS_BOX_SOLVE_STEPS; step++) {
      sim.step()
    }

    // save unsolved state with reversed velocities
    const result: Array<number> = []
    for (let i = 0; i < N_GAS_BOX_PARTICLES; i++) {
      result.push(
        sim.px[i], sim.py[i], -sim.dx[i], -sim.dy[i],
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
