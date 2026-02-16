/**
 * @file hilbert-constants.ts
 *
 * Constants for the Hilbert-curve LUT.
 *
 * The curve is encoded as a sequence of (x, y) waypoints at pixel
 * precision inside a 1000 × 500 logical canvas.  An adaptive Hilbert
 * subdivision recurses deeper in dark image regions and stops early in
 * light ones, leaving a gap of a few pixels in the smallest cells.
 */

/** Logical width of the Hilbert image canvas (pixels). */
export const HILBERT_WIDTH = 1000

/** Logical height of the Hilbert image canvas (pixels). */
export const HILBERT_HEIGHT = 500

/**
 * Maximum number of waypoints stored per pattern.
 * Chosen large enough to faithfully trace every dark region at pixel
 * precision, while keeping the blob size reasonable.
 */
export const N_HILBERT_POINTS = 30000

/**
 * Minimum cell size (pixels) at the deepest recursion level.
 * Cells this size or smaller are not subdivided further, producing a
 * visible gap of a few pixels between adjacent curve legs.
 */
export const HILBERT_MIN_CELL = 2
