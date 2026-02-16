/**
 * @file create-hilbert-test-image.ts
 *
 * Standalone script that generates a 1000 × 500 black-and-white dummy
 * PNG image for testing the Hilbert curve solver.
 *
 * Usage:  npx ts-node build/create-hilbert-test-image.ts
 */

import path from 'path'
import { createDummyImage } from './hilbert-solver'

const outPath = path.resolve(__dirname, 'hilbert-images', 'dummy.png')
createDummyImage(outPath)
