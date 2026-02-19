/**
 * @file icons-gfx-util.ts
 *
 * Icons for buttons.
 */

import type { Rectangle } from 'util/math-util'
import type { IconName } from './button-icons'
import { BUTTON_ICONS } from './button-icons'

// SVG icons: cache per icon as ImageBitmap
const _iconCache: Partial<Record<IconName, ImageBitmap | null>> = {}
const _iconCachePending: Partial<Record<IconName, Promise<ImageBitmap> | null>> = {}

/**
   * Draws the icon. Only draws if already loaded (never triggers async load).
   * If active, draws icon in white; otherwise, uses currentColor (black).
   */
export function drawButton(
  ctx: CanvasRenderingContext2D, rect: Rectangle, icon: IconName, _active: boolean,
) {
  const [x, y, w, h] = rect
  const PADDING_FRAC = 0.18 // 18% padding on each side
  if (_iconCache[icon]) {
    const img = _iconCache[icon]!
    // Calculate padded area
    const padW = w * PADDING_FRAC
    const padH = h * PADDING_FRAC
    const availW = w - 2 * padW
    const availH = h - 2 * padH
    // Maintain aspect ratio
    const imgAspect = img.width / img.height
    const rectAspect = availW / availH
    let drawW = availW, drawH = availH
    if (imgAspect > rectAspect) {
      drawW = availW
      drawH = availW / imgAspect
    }
    else {
      drawH = availH
      drawW = availH * imgAspect
    }
    const drawX = x + (w - drawW) / 2
    const drawY = y + (h - drawH) / 2
    // ctx.save()
    // if (active) {
    //   ctx.globalCompositeOperation = 'destination-out'
    // }
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    // ctx.restore()
  }
  else {
    // Draw a placeholder
    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#888'
    ctx.fillRect(x, y, w, h)
    ctx.restore()
  }
}

/**
   * Preload all icon SVGs as ImageBitmaps. Call this once at startup.
   */
export async function loadAllButtonImages() {
  const iconNames = Object.keys(BUTTON_ICONS) as Array<IconName>
  const cache = _iconCache
  const pending = _iconCachePending
  const promises: Array<Promise<void>> = []
  for (const icon of iconNames) {
    if (!cache[icon] && !pending[icon]) {
      const svg = BUTTON_ICONS[icon]
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)
      const img = new window.Image()
      pending[icon] = new Promise<ImageBitmap>((resolve) => {
        img.onload = () => {
          createImageBitmap(img).then((bitmap) => {
            cache[icon] = bitmap
            resolve(bitmap)
            URL.revokeObjectURL(url)
          })
        }
        img.onerror = () => {
          cache[icon] = null
          resolve(null as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          URL.revokeObjectURL(url)
        }
        img.src = url
      })
      promises.push(pending[icon]!.then(() => {}))
    }
  }
  await Promise.all(promises)
}
