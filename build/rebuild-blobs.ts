/**
 * @file rebuild-blobs.ts
 * 
 * Rebuild lookup collision lookup table blobs.
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CollisionEncoder } from '../src/simulation/collision-encoder';
import { DiskDiskCollisions } from '../src/simulation/disk-disk-collisions';
import { createHash } from 'crypto';

// Remove existing files in public/collisions
const collisionsDir = join(__dirname, '../public/collisions');
const existingFiles = readdirSync(collisionsDir);
existingFiles.forEach(file => {
  const filePath = join(collisionsDir, file);
  unlinkSync(filePath);
});
console.log(`Removed existing files in: ${collisionsDir}`);

DiskDiskCollisions.computeAll()
const encodedData = CollisionEncoder.encode(DiskDiskCollisions.cache);


// Compute the hash of the encoded data
const hash = createHash('sha256').update(Buffer.from(encodedData)).digest('hex');

// Define the output filename and path
const filename = `disk-disk-${hash.slice(0, 16)}.bin`;
const outputPath = join(__dirname, '../public/collisions', filename);

// Validate that the encoded data length is a multiple of 2
if (encodedData.length % 2 !== 0) {
  throw new Error('Encoded data length is not a multiple of 2. This may cause issues when loading the blob.');
}

// Write the blob file to the public directory
writeFileSync(outputPath, Buffer.from(encodedData)); // Removed encoding option
console.log(`Blob file replaced at: ${outputPath}`);


// Update the constants in set-by-build.ts
const sourceFilePath = join(__dirname, '../src/set-by-build.ts');
let sourceCode = readFileSync(sourceFilePath, 'utf-8');

// Replace the constants for blob URL and hash
sourceCode = sourceCode.replace(
  /export const DDCOLLISION_BLOB_URL = ['"`].*?['"`];/,
  `export const DDCOLLISION_BLOB_URL = '/collisions/${filename}';`
);
sourceCode = sourceCode.replace(
  /export const DDCOLLISION_BLOB_HASH = ['"`].*?['"`];/,
  `export const DDCOLLISION_BLOB_HASH = '${hash}';`
);

// Write the updated source code back to the file
writeFileSync(sourceFilePath, sourceCode, 'utf-8');
console.log(`Updated constants in: ${sourceFilePath}`);