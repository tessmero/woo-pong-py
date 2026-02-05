/**
 * @file sound-asset-loader.ts
 *
 * Helper functions to preload and then lookup ogg assets.
 */

import { Howl } from 'howler'
import type { SoundAssetUrl } from './sound-asset-urls'
import { SOUND_ASSET_URLS } from './sound-asset-urls'

const cache = new Map<SoundAssetUrl, Howl>()

export function getSound(url: SoundAssetUrl): Howl {
  return cache.get(url) as Howl
}

// called on startup
export async function loadAllSounds(): Promise<Array<void>> {
  SOUND_ASSET_URLS.map(async (sau) => {
    cache.set(sau, new Howl({
      src: [`sounds/${sau}`],
      format: ['ogg'],
    }))
  })
  return Promise.all(
    Array.from(cache.entries()).map(
      ([url, howl]) =>
        new Promise<void>((resolve, reject) => {
          howl.once('load', () => {
            resolve()
          })
          howl.once('loaderror', (id, err) => {
            // eslint-disable-next-line no-console
            console.error('Failed to load sound asset:', url, err)
            reject(err)
          })
        }),
    ),
  )
}
