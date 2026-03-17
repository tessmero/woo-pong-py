// --- Build Python package zip with standard module structure ---

/**
 * @file build-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { readdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { LutEncoder } from '../src/simulation/lut-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { SHAPE_NAMES } from '../src/simulation/shapes'
import { getCollectedSimHashes } from '../src/simulation/luts/imp/race-lut'

import type { ObstacleLut } from '../src/simulation/luts/imp/obstacle-lut'
// import { GasBoxLut } from '../src/simulation/luts/imp/gas-box-lut'
// import { HilbertLut } from '../src/simulation/luts/imp/hilbert-lut'
import { LUT, ROOM, ROOM_LAYOUT, GFX_REGION, START_LAYOUT } from '../src/imp-names'
import { requireImps } from './require-imps'
import { Spin } from '../src/rooms/start-layouts/imp/spin'

requireImps(LUT, ROOM, ROOM_LAYOUT, GFX_REGION, START_LAYOUT)

// test
const _test = [Spin]

// // Inject the build-time pattern solver so GasBoxLut.computeLeaf() can use it
// GasBoxLut.patternSolver = solvePatternPositions

// // Generate the dummy Hilbert test image and inject the solver
// const hilbertImgDir = join(__dirname, 'hilbert-images')
// const hilbertImgPath = join(hilbertImgDir, 'dummy.png')
// if (!existsSync(hilbertImgPath)) {
//   createDummyImage(hilbertImgPath)
// }
// HilbertLut.hilbertSolver = (frameIndex: number) =>
//   solveHilbertCurve(hilbertImgPath, frameIndex)
// // HilbertLut.hilbertSolver = (frameIndex: number) =>
// //   solveChainCurve(hilbertImgPath, frameIndex)

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

  // // write python object
  // const pyName = shapeName.replaceAll('-', '_').toUpperCase()
  // const pyFilepath = join(__dirname,
  //   `../public/py/${pyName}.py`,
  // )
  // const pyContent = exportLutAsPython(lut, pyName)
  // writeFileSync(pyFilepath, pyContent)

  // Read back and verify
  const originalData = lut.data.slice()
  const fileBuf = require('fs').readFileSync(outputPath) // eslint-disable-line @typescript-eslint/no-require-imports
  const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength)
  const int16 = new Int16Array(arrayBuf)
  lut.loadFromBlob(int16)
  // Compare the original and loaded data buffers
  const dataEqual = originalData.length === lut.data.length && originalData.every((v, i) => v === lut.data[i])
  if (!dataEqual) {
    // Show a preview of the first mismatch
    let mismatchIdx = 0
    while (mismatchIdx < originalData.length && originalData[mismatchIdx] === lut.data[mismatchIdx]) mismatchIdx++
    const context = 5
    const origPreview = originalData.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
    const loadedPreview = lut.data.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
    throw new Error(
      `Decoded LUT data does not match original for ${shapeName}.\n`
      + `First mismatch at index ${mismatchIdx}:\n`
      + `Original: [${origPreview.join(', ')}]\n`
      + `Loaded:   [${loadedPreview.join(', ')}]`,
    )
  }

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
  if (lutName === 'obstacle-lut') {
    continue // skip obstacle-lut, because it is not a singleton
  }

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

  writeFileSync(outputPath, buffer)
  console.log(`Blob file replaced at: ${outputPath}`) // eslint-disable-line no-console

  // // write python object
  // const pyName = lutName.replaceAll('-', '_').toUpperCase()
  // const pyFilepath = join(__dirname,
  //   `../public/py/${pyName}.py`,
  // )
  // const pyContent = exportLutAsPython(lut, pyName)
  // writeFileSync(pyFilepath, pyContent)

  // Read back and verify
  const originalData = lut.data.slice()

  const fileBuf = require('fs').readFileSync(outputPath) // eslint-disable-line @typescript-eslint/no-require-imports
  const arrayBuf = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength)
  const int16 = new Int16Array(arrayBuf)
  lut.loadFromBlob(int16)
  // Compare the original and loaded data buffers
  const dataEqual = originalData.length === lut.data.length && originalData.every((v, i) => v === lut.data[i])
  if (!dataEqual) {
    // Show a preview of the first mismatch
    let mismatchIdx = 0
    while (mismatchIdx < originalData.length && originalData[mismatchIdx] === lut.data[mismatchIdx]) mismatchIdx++
    const context = 5
    const origPreview = originalData.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
    const loadedPreview = lut.data.slice(Math.max(0, mismatchIdx - context), mismatchIdx + context)
    throw new Error(
      `Decoded LUT data does not match original for ${lutName}.\n`
      + `First mismatch at index ${mismatchIdx}:\n`
      + `Original: [${origPreview.join(', ')}]\n`
      + `Loaded:   [${loadedPreview.join(', ')}]`,
    )
  }

  // // debug
  // if (lutName === 'race-lut') {
  //   console.log(JSON.stringify(originalData))
  // }

  const varPrefix = lutName.replaceAll('-', '_').toUpperCase()
  lutBlobs[varPrefix] = {
    url: `luts/${filename}`,
    hash: hash,
  }
}

// Write the updated source code back to the file
const simHashes = getCollectedSimHashes()
let simHashesExport: string
if (simHashes) {
  const hashJson = JSON.stringify(simHashes)
  simHashesExport = 'export const SIM_HASHES: {\n'
    + '  startSeed: number\n'
    + '  branchSeed: number\n'
    + '  hashes: Record<number, number>\n'
    + `} = ${hashJson};`
}
else {
  simHashesExport = 'export const SIM_HASHES: {\n'
    + '  startSeed: number\n'
    + '  branchSeed: number\n'
    + '  hashes: Record<number, number>\n'
    + '} | null = null;'
}
// const simHashesExport = ''

const lutBlobsJson = JSON.stringify(lutBlobs, null, 2)
const lutBlobsStr = `export const LUT_BLOBS = ${lutBlobsJson};`
const newSourceCode = [
  jsdocComment, '', lutBlobsStr, '', simHashesExport, '',
].join('\n')
writeFileSync(sourceFilePath, newSourceCode, 'utf-8')

// eslint-disable-next-line no-console
console.log(`Updated constants in: ${sourceFilePath}`)

if (simHashes) {
  const nHashes = Object.keys(simHashes.hashes).length
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${nHashes} sim hashes`
    + ` (startSeed=${simHashes.startSeed},`
    + ` branchSeed=${simHashes.branchSeed})`,
  )
}
