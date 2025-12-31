/**
 * @file collision-encoder.ts
 *
 * Utility to encode and decode the collision cache structure to and from a binary blob file.
 */

export type CachedCollision = null | [number, number, number, number] // x,y,dx,dy
export const speedDetail = 20 // half size of cache along relative vx and vy

export const offsetDetail = 10 // hald size of cache along dx and dy

export type DDCollisionTree = Array<Array<Array<Array<CachedCollision>>>>

export class CollisionEncoder {
  /**
   * Encodes the collision cache into a binary blob.
   * @param cache The collision cache to encode.
   * @returns A Int16Array representing the encoded binary data.
   */
  static encode(cache: DDCollisionTree): Int16Array {
    const chunks: Array<number> = []

    for (const dxArr of cache) {
      for (const dyArr of dxArr) {
        for (const vxArr of dyArr) {
          for (const col of vxArr) {
            if (col === null) {
              chunks.push(0) // Null marker
            }
            else {
              chunks.push(1) // Non-null marker
              chunks.push(...col.map(Math.round))
            }
          }
        }
      }
    }

    // Ensure the chunks array length is even
    if (chunks.length % 2 !== 0) {
      chunks.push(0) // Add padding to align with Int16Array requirements
    }

    return new Int16Array(chunks)
  }

  /**
   * Decodes a binary blob into the collision cache structure.
   * @param blob The binary blob to decode.
   * @param offsetDetail The offset detail used to construct the cache dimensions.
   * @param speedDetail The speed detail used to construct the cache dimensions.
   * @returns The decoded collision cache.
   */
  static decode(
    blob: Int16Array,
  ): DDCollisionTree {
    const cache: DDCollisionTree = []
    let index = 0

    for (let dxi = -offsetDetail; dxi <= offsetDetail; dxi++) {
      const dxArr: Array<Array<Array<CachedCollision>>> = []
      cache.push(dxArr)

      for (let dyi = -offsetDetail; dyi <= offsetDetail; dyi++) {
        const dyArr: Array<Array<CachedCollision>> = []
        dxArr.push(dyArr)

        for (let vxi = -speedDetail; vxi <= speedDetail; vxi++) {
          const vxArr: Array<CachedCollision> = []
          dyArr.push(vxArr)

          for (let vyi = -speedDetail; vyi <= speedDetail; vyi++) {
            const marker = blob[index++]

            if (marker === 0) {
              vxArr.push(null)
            }
            else {
              const cx = blob[index++]
              const cy = blob[index++]
              const cdx = blob[index++]
              const cdy = blob[index++]
              vxArr.push([cx, cy, cdx, cdy])
            }
          }
        }
      }
    }

    return cache
  }
}
