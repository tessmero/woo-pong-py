/**
 * @file collision-encoder.ts
 *
 * Utility to encode and decode the collision cache structure to and from a binary blob file.
 */

import { offsetDetail, speedDetail, type CachedCollision } from './collisions';

export class CollisionEncoder {
  /**
   * Encodes the collision cache into a binary blob.
   * @param cache The collision cache to encode.
   * @returns A Int16Array representing the encoded binary data.
   */
  static encode(cache: Array<Array<Array<Array<CachedCollision>>>>): Int16Array {
    const chunks: number[] = [];

    for (const dxArr of cache) {
      for (const dyArr of dxArr) {
        for (const vxArr of dyArr) {
          for (const col of vxArr) {
            if (col === null) {
              chunks.push(0); // Null marker
            } else {
              chunks.push(1); // Non-null marker
              chunks.push(...col.map(Math.round));
            }
          }
        }
      }
    }

    return new Int16Array(chunks);
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
  ): Array<Array<Array<Array<CachedCollision>>>> {
    const cache: Array<Array<Array<Array<CachedCollision>>>> = [];
    let index = 0;

    for (let dxi = -offsetDetail; dxi <= offsetDetail; dxi++) {
      const dxArr: Array<Array<Array<CachedCollision>>> = [];
      cache.push(dxArr);

      for (let dyi = -offsetDetail; dyi <= offsetDetail; dyi++) {
        const dyArr: Array<Array<CachedCollision>> = [];
        dxArr.push(dyArr);

        for (let vxi = -speedDetail; vxi <= speedDetail; vxi++) {
          const vxArr: Array<CachedCollision> = [];
          dyArr.push(vxArr);

          for (let vyi = -speedDetail; vyi <= speedDetail; vyi++) {
            const marker = blob[index++];

            if (marker === 0) {
              vxArr.push(null);
            } else {
              const cx = blob[index++];
              const cy = blob[index++];
              const cdx = blob[index++];
              const cdy = blob[index++];
              vxArr.push([cx, cy, cdx, cdy]);
            }
          }
        }
      }
    }

    return cache;
  }
}