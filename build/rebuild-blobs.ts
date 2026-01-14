/**
 * @file rebuild-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { LutEncoder } from '../src/simulation/lut-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { SHAPE_NAMES } from '../src/simulation/shapes'

import { DiskDiskLut } from '../src/simulation/luts/imp/disk-disk-lut'
import { ObstacleLut } from '../src/simulation/luts/imp/obstacle-lut'
import { DiskNormalLut } from '../src/simulation/luts/imp/disk-normal-lut'
import { DiskFrictionLut } from '../src/simulation/luts/imp/disk-friction-lut'
import { RaceLut } from '../src/simulation/luts/imp/race-lut'
import { LUT } from '../src/imp-names'

import { BasicRoom } from '../src/rooms/imp/basic-room'
import { PongRoom } from '../src/rooms/imp/pong-room'
import { BreakoutRoom } from '../src/rooms/imp/breakout-room'
import { StartRoom } from '../src/rooms/imp/start-room'
import { FinishRoom } from '../src/rooms/imp/finish-room'

// excuse to import luts and have them registered
const _luts = [
  DiskDiskLut, ObstacleLut, DiskNormalLut, DiskFrictionLut, RaceLut,
]
const _rooms = [
  BasicRoom, PongRoom, BreakoutRoom, StartRoom, FinishRoom,
]

// // Remove existing files in public/luts
// const collisionsDir = join(__dirname, '../public/luts')
// const existingFiles = readdirSync(collisionsDir)
// existingFiles.forEach((file) => {
//   const filePath = join(collisionsDir, file)
//   unlinkSync(filePath)
// })
// console.log(`Removed existing files in: ${collisionsDir}`) // eslint-disable-line no-console

// Update the constants in set-by-build.ts
const sourceFilePath = join(__dirname, '../src/set-by-build.ts')
const jsdocComment = `/**
 * @file set-by-build.ts
 *
 * This file gets modified by npm scripts in build folder.
 */`

const lutBlobs: Record<string, { url: string, hash: string, xRad?: number, yRad?: number }> = {}

// write obstacle luts' blobs
for (const shapeName of SHAPE_NAMES) {
  const lut = Lut.create('obstacle-lut', shapeName)
  lut.computeAll()

  const encodedBlob = LutEncoder.encode(lut.tree)
  const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)

  if (buffer.length % 2 !== 0) {
    throw new Error('Encoded data length is not a multiple of 2. This may cause issues when loading the blob.')
  }

  const hash = createHash('sha256').update(buffer).digest('hex')
  const filename = `${shapeName}-${hash.slice(0, 16)}.bin`
  const outputPath = join(__dirname, '../public/luts', filename)

  writeFileSync(outputPath, buffer) // Removed encoding option
  console.log(`Blob file replaced at: ${outputPath}`) // eslint-disable-line no-console

  const varPrefix = shapeName.replaceAll('-', '_').toUpperCase()
  lutBlobs[varPrefix] = {
    url: `luts/${filename}`,
    hash: hash,
    xRad: (lut as ObstacleLut).obsOffsetDetailX,
    yRad: (lut as ObstacleLut).obsOffsetDetailY,
  }
}

// write singleton luts' blobs
for (const lutName of LUT.NAMES) {
  if (lutName === 'obstacle-lut') continue

  if( lutName === 'race-lut' ) continue /// 2026-01-14 skip long step

  const lut = Lut.create(lutName)
  lut.computeAll()

  console.log('encoding', lutName)
  const encodedBlob = LutEncoder.encode(lut.tree)
  const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)

  if (buffer.length % 2 !== 0) {
    throw new Error('Encoded data length is not a multiple of 2. This may cause issues when loading the blob.')
  }

  const hash = createHash('sha256').update(buffer).digest('hex')
  const filename = `${lutName}-${hash.slice(0, 16)}.bin`
  const outputPath = join(__dirname, '../public/luts', filename)

  writeFileSync(outputPath, buffer) // Removed encoding option
  console.log(`Blob file replaced at: ${outputPath}`) // eslint-disable-line no-console

  const varPrefix = lutName.replaceAll('-', '_').toUpperCase()
  lutBlobs[varPrefix] = {
    url: `/luts/${filename}`,
    hash: hash,
  }
  console.log('C')
}

// Write the updated source code back to the file
const newSourceCode = `${jsdocComment}\n\nexport const LUT_BLOBS = ${JSON.stringify(lutBlobs, null, 2)};`
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
