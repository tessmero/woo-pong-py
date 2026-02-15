/**
 * @file rebuild-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { readdirSync, unlinkSync, writeFileSync } from 'fs'
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
import { GearLut } from '../src/simulation/luts/imp/gear-lut'
import { GasBoxLut } from '../src/simulation/luts/imp/gas-box-lut'
import { solvePatternPositions } from './gas-box-pattern-solver'
import { LUT } from '../src/imp-names'
// import { getCollectedSimHashes } from '../src/simulation/luts/imp/race-lut'

import { FourByFour } from '../src/rooms/room-layouts/imp/four-by-four'

import { BasicRoom } from '../src/rooms/imp/basic-room'
import { PongRoom } from '../src/rooms/imp/pong-room'
import { BreakoutRoom } from '../src/rooms/imp/breakout-room'
import { StartRoom } from '../src/rooms/imp/start-room'
import { FinishRoom } from '../src/rooms/imp/finish-room'
import { GearRoom } from '../src/rooms/imp/gear-room'

// excuse to import luts and have them registered
const _luts = [
  DiskDiskLut, ObstacleLut, DiskNormalLut, DiskFrictionLut, RaceLut, GearLut, GasBoxLut,
]

// Inject the build-time pattern solver so GasBoxLut.computeLeaf() can use it
GasBoxLut.patternSolver = solvePatternPositions
const _layouts = [
  FourByFour,
]
const _rooms = [
  BasicRoom, PongRoom, BreakoutRoom, StartRoom, FinishRoom, GearRoom,
]

// GFX_REGION imports and placeholder variable
import { SimGfx } from '../src/gfx/regions/imp/sim-gfx'
import { ScrollbarGfx } from '../src/gfx/regions/imp/scrollbar-gfx'
import { BottomBarGfx } from '../src/gfx/regions/imp/bottom-bar-gfx'
import { TopBarGfx } from '../src/gfx/regions/imp/top-bar-gfx'
import { GlassGfx } from '../src/gfx/regions/imp/glass-gfx'

const _gfxRegions = [
  SimGfx, ScrollbarGfx, BottomBarGfx, TopBarGfx, GlassGfx,
]

// Remove existing files in public/luts
const collisionsDir = join(__dirname, '../public/luts')
const existingFiles = readdirSync(collisionsDir)
existingFiles.forEach((file) => {
  const filePath = join(collisionsDir, file)
  unlinkSync(filePath)
})
console.log(`Removed existing files in: ${collisionsDir}`) // eslint-disable-line no-console

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

  const encodedBlob = LutEncoder.encode(lut.tree, lut)
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

  const lut = Lut.create(lutName)
  lut.computeAll()

  console.log('encoding', lutName) // eslint-disable-line no-console
  const encodedBlob = LutEncoder.encode(lut.tree, lut)
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
    url: `luts/${filename}`,
    hash: hash,
  }
}

// // Write the updated source code back to the file
// const simHashes = getCollectedSimHashes()
// let simHashesExport: string
// if (simHashes) {
//   const hashJson = JSON.stringify(simHashes)
//   simHashesExport = 'export const SIM_HASHES: {\n'
//     + '  startSeed: number\n'
//     + '  branchSeed: number\n'
//     + '  hashes: Record<number, number>\n'
//     + `} = ${hashJson};`
// }
// else {
//   simHashesExport = 'export const SIM_HASHES: {\n'
//     + '  startSeed: number\n'
//     + '  branchSeed: number\n'
//     + '  hashes: Record<number, number>\n'
//     + '} | null = null;'
// }
const simHashesExport = ''

const lutBlobsJson = JSON.stringify(lutBlobs, null, 2)
const lutBlobsStr = `export const LUT_BLOBS = ${lutBlobsJson};`
const newSourceCode = [
  jsdocComment, '', lutBlobsStr, '', simHashesExport, '',
].join('\n')
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')
// eslint-disable-next-line no-console
console.log(`Updated constants in: ${sourceFilePath}`)

// if (simHashes) {
//   const nHashes = Object.keys(simHashes.hashes).length
//   // eslint-disable-next-line no-console
//   console.log(
//     `Wrote ${nHashes} sim hashes`
//     + ` (startSeed=${simHashes.startSeed},`
//     + ` branchSeed=${simHashes.branchSeed})`,
//   )
// }
