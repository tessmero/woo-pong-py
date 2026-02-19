/**
 * @file build-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LutEncoder } from '../src/simulation/lut-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { SHAPE_NAMES } from '../src/simulation/shapes'

import type { ObstacleLut } from '../src/simulation/luts/imp/obstacle-lut'
import { GasBoxLut } from '../src/simulation/luts/imp/gas-box-lut'
import { HilbertLut } from '../src/simulation/luts/imp/hilbert-lut'
import { solvePatternPositions } from './gas-box-pattern-solver'
import { solveHilbertCurve, createDummyImage } from './hilbert-solver'
import { LUT, ROOM, ROOM_LAYOUT, GFX_REGION } from '../src/imp-names'
import { requireImps } from './require-imps'
import { solveChainCurve } from './chain-solver'

requireImps(LUT, ROOM, ROOM_LAYOUT, GFX_REGION)

// Inject the build-time pattern solver so GasBoxLut.computeLeaf() can use it
GasBoxLut.patternSolver = solvePatternPositions

// Generate the dummy Hilbert test image and inject the solver
const hilbertImgDir = join(__dirname, 'hilbert-images')
const hilbertImgPath = join(hilbertImgDir, 'dummy.png')
if (!existsSync(hilbertImgPath)) {
  createDummyImage(hilbertImgPath)
}
// HilbertLut.hilbertSolver = (frameIndex: number) =>
//   solveHilbertCurve(hilbertImgPath, frameIndex)
HilbertLut.hilbertSolver = (frameIndex: number) =>
  solveChainCurve(hilbertImgPath)

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
