/**
 * @file rebuild-blobs.ts
 *
 * Rebuild lookup collision lookup table blobs.
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { CollisionEncoder } from '../src/simulation/collision-encoder'
import { createHash } from 'crypto'
import { Lut } from '../src/simulation/luts/lut'
import { DiskDiskLut } from '../src/simulation/luts/imp/disk-disk-lut'

// excuse to import disk-disk-lut and have it registered
const _thing = DiskDiskLut

// Remove existing files in public/collisions
const collisionsDir = join(__dirname, '../public/collisions')
const existingFiles = readdirSync(collisionsDir)
existingFiles.forEach((file) => {
  const filePath = join(collisionsDir, file)
  unlinkSync(filePath)
})
console.log(`Removed existing files in: ${collisionsDir}`) // eslint-disable-line no-console

// DiskDiskCollisions.computeAll()
// const encodedData = CollisionEncoder.encode(DiskDiskCollisions.cache);

const lut = Lut.create('disk-disk-lut')
lut.computeAll()
const encodedBlob = CollisionEncoder.encode(lut.tree)

// Compute the hash of the encoded data
const buffer = Buffer.from(encodedBlob.buffer, encodedBlob.byteOffset, encodedBlob.byteLength)
const hash = createHash('sha256').update(buffer).digest('hex')

// Define the output filename and path
const filename = `disk-disk-${hash.slice(0, 16)}.bin`
const outputPath = join(__dirname, '../public/collisions', filename)

// Validate that the encoded data length is a multiple of 2
if (encodedBlob.length % 2 !== 0) {
  throw new Error('Encoded data length is not a multiple of 2. This may cause issues when loading the blob.')
}

// Write the blob file to the public directory
writeFileSync(outputPath, buffer) // Removed encoding option
console.log(`Blob file replaced at: ${outputPath}`) // eslint-disable-line no-console

// Update the constants in set-by-build.ts
const sourceFilePath = join(__dirname, '../src/set-by-build.ts')
let sourceCode = readFileSync(sourceFilePath, 'utf-8')

// Replace the constants for blob URL and hash
sourceCode = sourceCode.replace(
  /export const DDCOLLISION_BLOB_URL = ['"`].*?['"`];/,
  `export const DDCOLLISION_BLOB_URL = '/collisions/${filename}';`,
)
sourceCode = sourceCode.replace(
  /export const DDCOLLISION_BLOB_HASH = ['"`].*?['"`];/,
  `export const DDCOLLISION_BLOB_HASH = '${hash}';`,
)

// Write the updated source code back to the file
writeFileSync(sourceFilePath, sourceCode, 'utf-8')
console.log(`Updated constants in: ${sourceFilePath}`) // eslint-disable-line no-console
