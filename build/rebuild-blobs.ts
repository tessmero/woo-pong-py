/**
 * @file rebuild-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { LutEncoder } from '../src/simulation/lut-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { DiskDiskLut } from '../src/simulation/luts/imp/disk-disk-lut'
import { ObstacleLut } from '../src/simulation/luts/imp/obstacle-lut'
import { DiskNormalLut } from '../src/simulation/luts/imp/disk-normal-lut'
import { LUT } from '../src/imp-names'

// excuse to import luts and have them registered
const _thing0 = DiskDiskLut
const _thing1 = ObstacleLut
const _thing2 = DiskNormalLut

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
let sourceCode = readFileSync(sourceFilePath, 'utf-8')

for (const lutName of LUT.NAMES) {
  const lut = Lut.create(lutName)
  lut.computeAll()
  const encodedBlob = LutEncoder.encode(lut.tree)

  // Compute the hash of the encoded data
  const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)
  const hash = createHash('sha256').update(buffer).digest('hex')

  // Define the output filename and path
  const filename = `${lutName}-${hash.slice(0, 16)}.bin`
  const outputPath = join(__dirname, '../public/luts', filename)

  // Validate that the encoded data length is a multiple of 2
  if (buffer.length % 2 !== 0) {
    throw new Error('Encoded data length is not a multiple of 2. This may cause issues when loading the blob.')
  }
  // console.log('buffer length', buffer.length)

  // Write the blob file to the public directory
  writeFileSync(outputPath, buffer) // Removed encoding option
  console.log(`Blob file replaced at: ${outputPath}`) // eslint-disable-line no-console

  // Replace the constants for blob URL and hash
  const varPrefix = lutName.replaceAll('-', '_').toUpperCase()
  const urlRegex = `^export const ${varPrefix}_BLOB_URL = .*`
  // console.log(`Regex for URL: ${urlRegex}`)
  const urlMatches = sourceCode.match(new RegExp(urlRegex, 'm'))
  if (!urlMatches || urlMatches.length !== 1) {
    throw new Error(`Expected one match for URL regex, but found ${urlMatches ? urlMatches.length : 0}`)
  }
  sourceCode = sourceCode.replace(
    new RegExp(urlRegex, 'm'),
    `export const ${varPrefix}_BLOB_URL = '/luts/${filename}'`,
  )

  const hashRegex = `^export const ${varPrefix}_BLOB_HASH = .*`
  // console.log(`Regex for HASH: ${hashRegex}`)
  const hashMatches = sourceCode.match(new RegExp(hashRegex, 'm'))
  if (!hashMatches || hashMatches.length !== 1) {
    throw new Error(`Expected one match for HASH regex, but found ${hashMatches ? hashMatches.length : 0}`)
  }
  sourceCode = sourceCode.replace(
    new RegExp(hashRegex, 'm'),
    `export const ${varPrefix}_BLOB_HASH = '${hash}'`,
  )
}

// Write the updated source code back to the file
writeFileSync(sourceFilePath, sourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
