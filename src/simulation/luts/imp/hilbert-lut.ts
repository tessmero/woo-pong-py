/**
 * @file hilbert-lut.ts
 *
 * Lookup table for density-adaptive Hilbert curves.
 *
 * Each leaf stores one curve as a pair of coordinate arrays (px, py)
 * with N_HILBERT_POINTS waypoints in pixel coordinates (0..999 × 0..499).
 *
 * At build time a solver traces the curve through the dark regions of
 * a source image; at runtime the curve is loaded from a blob.
 */

import { N_HILBERT_FRAMES, N_HILBERT_POINTS } from 'hilbert-constants'
import { Lut, i16Array } from '../lut'
import type { LeafSchema, LeafValues } from '../lut'
import { LUT_BLOBS } from 'set-by-build'

/** Schema: two i32 arrays — x and y coordinates, each N_HILBERT_POINTS long. */
const hilbertSchema: LeafSchema = [
  i16Array('px', N_HILBERT_POINTS),
  i16Array('py', N_HILBERT_POINTS),
]

/**
 * Injected at build time by rebuild-blobs.ts — not available in the browser.
 * Maps a leaf index to computed Hilbert curve waypoints.
 */
type HilbertSolver = (index: number) => { px: Int32Array, py: Int32Array }

export class HilbertLut extends Lut {
  schema = hilbertSchema

  /** One leaf per source image. For now just the single dummy image (index 0). */
  override detail = [N_HILBERT_FRAMES]

  blobUrl = LUT_BLOBS.HILBERT_LUT.url
  blobHash = LUT_BLOBS.HILBERT_LUT.hash

  /**
   * Set by the build script before `computeAll()` is called.
   * Maps a leaf index to solved Hilbert curve waypoints.
   */
  static hilbertSolver: HilbertSolver | null = null

  override computeLeaf(index: Array<number>): LeafValues {
    const solver = HilbertLut.hilbertSolver
    if (!solver) throw new Error('HilbertLut.hilbertSolver not set — only available at build time')

    const { px, py } = solver(index[0])

    const result = {
      px: Array.from(px),
      py: Array.from(py),
    }

    // trim from start
    for (let i = 0; i < 50; i++) {
      result.px[i] = -1
    }

    // trim from end
    for (let i = 0; i < 2; i++) {
      result.px[px.length - i - 1] = -1
    }

    return result
  }

  static {
    Lut.register('hilbert-lut', {
      factory: () => new HilbertLut(),
      depth: 1,
      schema: hilbertSchema,
    })
  }
}
