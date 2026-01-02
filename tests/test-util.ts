/**
 * @file test-util.ts
 *
 * Test util.
 */

import { offsetDetail, speedDetail } from '../src/simulation/luts/imp/disk-disk-lut'
import { obsOffsetDetail } from '../src/simulation/luts/imp/obstacle-lut'

// generate random lookup key in disk-disk coliision data
const nOffsets = 2 * offsetDetail + 1
const nSpeeds = 2 * speedDetail + 1
export function randomDiskDiskIndex() {
  return [
    Math.floor(nOffsets * Math.random()),
    Math.floor(nOffsets * Math.random()),
    Math.floor(nSpeeds * Math.random()),
    Math.floor(nSpeeds * Math.random()),
  ]
}

const nObsOffsets = 2 * obsOffsetDetail + 1
export function randomObstacleOffsetIndex() {
  return [
    Math.floor(nObsOffsets * Math.random()),
    Math.floor(nObsOffsets * Math.random()),
  ]
}
