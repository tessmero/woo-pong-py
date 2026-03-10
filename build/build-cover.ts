/**
 * @file build-cover.ts
 *
 * Create 3D cover images with extruded text using Three.js.
 *
 */
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import puppeteer from 'puppeteer'
import { createCanvas, loadImage } from 'canvas'
import { PATTERN, type PatternName } from '../src/imp-names'
import { Pattern } from '../src/gfx/patterns/pattern'
import { BUTTON_ICONS, type IconName } from '../src/gfx/button-icons'
import { VALUE_SCALE } from '../src/simulation/constants'
import { requireImps } from './require-imps'

const SCALE = 5
const COVER_WIDTH = 420 * SCALE
const COVER_HEIGHT = 588 * SCALE
const BSP_PATTERN_SCALE_MULT = 20 / VALUE_SCALE

// Register pattern implementations for build-time usage.
requireImps(PATTERN)

interface CoverOptions {
  topText?: string
  topTextSkew?: number // Horizontal skew in pixels across text height (default: 0)
  mainText: string
  showEdgeTubes?: boolean
  showOuterEdges?: boolean
  edgeTubeRadius?: number
  usePerspective?: boolean
  perspectiveTilt?: number // Degrees to tilt text back (default: 15)
  perspectiveWidthFactor?: number // Horizontal compression/expansion in isometric mode (default: 1)
  // Extrusion appearance control
  extrusionViewAngleX?: number // Horizontal viewing angle in degrees: 0=front, positive=right, negative=left (default: 45)
  extrusionViewAngleY?: number // Vertical viewing angle in degrees: 0=level, positive=above, negative=below (default: 35)
  // Line segments for edge alignment (defaults create horizontal lines)
  topEdgeLeftY?: number // Y position of top edge at left side
  topEdgeRightY?: number // Y position of top edge at right side
  bottomEdgeLeftY?: number // Y position of bottom edge at left side
  bottomEdgeRightY?: number // Y position of bottom edge at right side
  edgeLineX?: number // X distance from center for edge lines (default: 30)
  showGuideLines?: boolean // Show alignment guide lines for debugging
  visibleLetters?: Array<number> | 'all' // Array of letter indices to show, or 'all' for all letters
  // Outlined sphere split line segment. The split uses this line extended to infinity.
  sphereSliceX1?: number
  sphereSliceY1?: number
  sphereSliceX2?: number
  sphereSliceY2?: number
  // Which outlined sphere spiral to render in generateOutlinedSphereHTML.
  // 'both' keeps current behavior, 'first' renders j=0 only, 'second' renders j=1 only.
  outlinedSphereSpiral?: 'both' | 'first' | 'second'
}

type LetterManifestEntry = {
  index: number
  file: string
  x: number
  y: number
  width: number
  height: number
}

const coverImgDir = join(__dirname, '..', 'public', 'cover-images')
const coverCircleIconCache = new Map<IconName, Awaited<ReturnType<typeof loadImage>>>()

async function main() {
  const baseOptions = {
    topText: 'MASTER THE MULTIVERSE!',
    topTextSkew: -20,
    mainText: 'QUANTUM\nWOO PONG',
    usePerspective: true,
    perspectiveTilt: 35,
    perspectiveWidthFactor: 1.8,
    extrusionViewAngleX: -8,
    extrusionViewAngleY: -13,
    topEdgeLeftY: 25,
    topEdgeRightY: 25,
    bottomEdgeLeftY: 8,
    bottomEdgeRightY: 19,
    showEdgeTubes: true,
    showOuterEdges: true,
    showGuideLines: false,
    sphereSliceX1: COVER_WIDTH * 0.6,
    sphereSliceY1: COVER_HEIGHT * 0.2,
    sphereSliceX2: COVER_WIDTH * 0.85,
    sphereSliceY2: COVER_HEIGHT * 0.3,
  }

  // Create background image with top text and frame
  console.log('Creating background image with top text and frame...')
  await createBackgroundImage(join(coverImgDir, 'cover-background.png'), baseOptions)

  console.log('Creating outlined sphere image...')
  const spherePath = join(coverImgDir, 'cover-sphere.png')
  const sphereSpiralAPath = join(coverImgDir, 'cover-sphere-spiral-a.png')
  const sphereSpiralBPath = join(coverImgDir, 'cover-sphere-spiral-b.png')
  const combinedBackgroundPath = join(coverImgDir, 'cover-background-combined.png')

  await createOutlinedSphereImage(spherePath, {
    ...baseOptions,
    outlinedSphereSpiral: 'both',
  })
  await createOutlinedSphereImage(sphereSpiralAPath, {
    ...baseOptions,
    outlinedSphereSpiral: 'first',
  })
  await createOutlinedSphereImage(sphereSpiralBPath, {
    ...baseOptions,
    outlinedSphereSpiral: 'second',
  })

  console.log('Applying fill patterns to outlined sphere images...')
  await applyFillPatternToOutlinedSphereImage(spherePath, 'hex-a')
  await applyFillPatternToOutlinedSphereImage(sphereSpiralAPath, 'hex-a')
  await applyFillPatternToOutlinedSphereImage(sphereSpiralBPath, 'diamond-a')

  // Slice only the first spiral into animated front/back parts.
  await splitOutlinedSphereImageByLine(sphereSpiralAPath, baseOptions)

  console.log('Creating combined background image...')
  await createCombinedCoverBackground(
    combinedBackgroundPath,
    join(coverImgDir, 'cover-background.png'),
    join(coverImgDir, 'cover-sphere-part-b.png'),
    sphereSpiralBPath,
  )


  return

  // First, create full text image
  console.log('Creating full text image...')
  await createCoverImage(join(coverImgDir, 'cover-full.png'), {
    ...baseOptions,
    visibleLetters: 'all',
  })

  // Get the letter count by creating a temporary image to count components
  const letterCount = await getLetterCount(baseOptions)
  console.log(`Found ${letterCount} letter components, creating individual images...`)

  // Create one image per letter
  clearOldLetterImages()
  const letterManifest: Array<LetterManifestEntry> = []
  for (let i = 0; i < letterCount; i++) {
    console.log(`Creating image for letter ${i + 1}/${letterCount}...`)
    const rawLetterPath = join(coverImgDir, `cover-letter-${i}.png`)
    await createCoverImage(rawLetterPath, {
      ...baseOptions,
      visibleLetters: [i],
    })

    const trim = await trimImageToAlphaBounds(rawLetterPath)
    const trimmedName = `cover-letter-${i}-x${trim.x}-y${trim.y}.png`
    const trimmedPath = join(coverImgDir, trimmedName)
    writeFileSync(trimmedPath, trim.png)
    unlinkSync(rawLetterPath)
    console.log(`  wrote trimmed letter image: ${trimmedPath}`)

    letterManifest.push({
      index: i,
      file: trimmedName,
      x: trim.x,
      y: trim.y,
      width: trim.width,
      height: trim.height,
    })
  }

  console.log('Recombining individual letter images...')
  await createRecombinedImage(join(coverImgDir, 'cover-recombined.png'))

  const manifestPath = join(coverImgDir, 'cover-letters-manifest.json')
  writeFileSync(
    manifestPath,
    `${JSON.stringify({
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      letters: letterManifest,
    }, null, 2)}\n`,
  )
  console.log(`  wrote manifest: ${manifestPath}`)

  console.log('Done!')
}

function clearOldLetterImages(): void {
  const files = readdirSync(coverImgDir)
  for (const file of files) {
    if (/^cover-letter-\d+(?:-x-?\d+-y-?\d+)?\.png$/.test(file)) {
      unlinkSync(join(coverImgDir, file))
    }
  }
}

async function trimImageToAlphaBounds(imagePath: string): Promise<{ png: Buffer, x: number, y: number, width: number, height: number }> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  const dataUrl = `data:image/png;base64,${readFileSync(imagePath).toString('base64')}`

  await page.setContent(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;background:transparent;"></body>
</html>`)

  const result = await page.evaluate(async (src: string) => {
    const loadImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load source image'))
        img.src = url
      })

    const img = await loadImage(src)
    const srcCanvas = document.createElement('canvas')
    srcCanvas.width = img.width
    srcCanvas.height = img.height
    const srcCtx = srcCanvas.getContext('2d')
    if (!srcCtx) throw new Error('Missing source canvas context')
    srcCtx.drawImage(img, 0, 0)

    const imageData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height)
    const data = imageData.data

    let minX = srcCanvas.width
    let minY = srcCanvas.height
    let maxX = -1
    let maxY = -1

    for (let y = 0; y < srcCanvas.height; y++) {
      for (let x = 0; x < srcCanvas.width; x++) {
        const alpha = data[(y * srcCanvas.width + x) * 4 + 3]
        if (alpha === 0) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }

    if (maxX < minX || maxY < minY) {
      const tinyCanvas = document.createElement('canvas')
      tinyCanvas.width = 1
      tinyCanvas.height = 1
      return {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        dataUrl: tinyCanvas.toDataURL('image/png'),
      }
    }

    const cropW = maxX - minX + 1
    const cropH = maxY - minY + 1
    const outCanvas = document.createElement('canvas')
    outCanvas.width = cropW
    outCanvas.height = cropH
    const outCtx = outCanvas.getContext('2d')
    if (!outCtx) throw new Error('Missing output canvas context')
    outCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH)

    return {
      x: minX,
      y: minY,
      width: cropW,
      height: cropH,
      dataUrl: outCanvas.toDataURL('image/png'),
    }
  }, dataUrl)

  await browser.close()

  const base64 = String(result.dataUrl).replace(/^data:image\/png;base64,/, '')
  return {
    png: Buffer.from(base64, 'base64'),
    x: result.x,
    y: result.y,
    width: result.width,
    height: result.height,
  }
}

async function createRecombinedImage(outPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: COVER_WIDTH, height: COVER_HEIGHT })

  const letterFiles = readdirSync(coverImgDir)
    .map((name) => {
      const match = /^cover-letter-(\d+)-x(-?\d+)-y(-?\d+)\.png$/.exec(name)
      if (!match) return null
      return {
        name,
        index: Number(match[1]),
        x: Number(match[2]),
        y: Number(match[3]),
      }
    })
    .filter((entry): entry is { name: string, index: number, x: number, y: number } => entry !== null)
    .sort((a, b) => a.index - b.index)

  const letterImages = letterFiles.map((file) => {
    const png = readFileSync(join(coverImgDir, file.name))
    return {
      x: file.x,
      y: file.y,
      dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    }
  })

  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; padding: 0; background: transparent; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="recombined" width="${COVER_WIDTH}" height="${COVER_HEIGHT}"></canvas>
  <script>
    window.renderComplete = false;
  </script>
</body>
</html>`)

  await page.evaluate(async (images: Array<{ x: number, y: number, dataUrl: string }>) => {
    const canvas = document.getElementById('recombined') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context not available')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 32)}...`))
        img.src = src
      })

    for (const image of images) {
      const img = await loadImage(image.dataUrl)
      ctx.drawImage(img, image.x, image.y)
    }

    ;(window as any).renderComplete = true
  }, letterImages)

  await page.waitForFunction(() => (window as any).renderComplete === true, { timeout: 10000 })
  const screenshot = await page.screenshot({ type: 'png', omitBackground: true })

  await browser.close()

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, screenshot)
  console.log(`  wrote recombined image: ${outPath}`)
}

async function getLetterCount(options: CoverOptions): Promise<number> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // Suppress logs for counting
  await page.setViewport({ width: 100, height: 100 })

  const html = generateThreeJSHTML({ ...options, visibleLetters: 'all' })
  await page.setContent(html)

  await page.waitForFunction(() => (window as any).letterCount !== undefined, { timeout: 10000 })
  const letterCount = await page.evaluate(() => (window as any).letterCount)

  await browser.close()

  return letterCount
}

main().catch(console.error)

async function createBackgroundImage(outPath: string, options: CoverOptions): Promise<void> {
  const { topText = '', topTextSkew = 0 } = options
  const backgroundPath = join(__dirname, 'background.png')

  // Create canvas
  const canvas = createCanvas(COVER_WIDTH, COVER_HEIGHT)
  const ctx = canvas.getContext('2d')

  // Draw base background image scaled to full height; any extra width is clipped equally on both sides.
  const backgroundImage = await loadImage(backgroundPath)
  const scaledBackgroundWidth = backgroundImage.width * (COVER_HEIGHT / backgroundImage.height)
  const backgroundOffsetX = (COVER_WIDTH - scaledBackgroundWidth) / 2
  ctx.drawImage(backgroundImage, backgroundOffsetX, 0, scaledBackgroundWidth, COVER_HEIGHT)

  // Draw thick frame for debugging
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 1 * SCALE // 10 units thick in scaled coordinates
  ctx.strokeRect(0, 0, COVER_WIDTH, COVER_HEIGHT)

  // draw circular icons
  await _drawCircleIcon(
    ctx as unknown as CanvasRenderingContext2D,
    20 * SCALE, 20 * SCALE,
    'eye',
    'NON EST',
    'ARBITRIUM',
  )
  await _drawCircleIcon(
    ctx as unknown as CanvasRenderingContext2D,
    COVER_WIDTH - 20 * SCALE, 20 * SCALE,
    'eye',
    'NON EST',
    'ARBITRIUM',
  )

  // Draw top text
  if (topText) {
    ctx.font = `bold ${18 * SCALE}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const textY = COVER_HEIGHT * 0.025
    ctx.fillStyle = 'white'

    if (Math.abs(topTextSkew) < 0.001) {
      ctx.fillText(topText, COVER_WIDTH / 2, textY)
      ctx.strokeStyle = 'black'
      ctx.lineWidth = 0.5 * SCALE
      ctx.strokeText(topText, COVER_WIDTH / 2, textY)
    }
    else {
      const metrics = ctx.measureText(topText)
      const textW = Math.ceil(Math.max(1, metrics.width + 8 * SCALE))
      const textH = Math.ceil(26 * SCALE)

      // Draw the non-skewed text to a temporary canvas first.
      const tempCanvas = createCanvas(textW, textH)
      const tempCtx = tempCanvas.getContext('2d')
      tempCtx.font = ctx.font
      tempCtx.textAlign = 'center'
      tempCtx.textBaseline = 'middle'
      tempCtx.fillStyle = 'white'
      tempCtx.strokeStyle = 'black'
      tempCtx.lineWidth = 0.5 * SCALE
      tempCtx.fillText(topText, textW / 2, textH / 2)
      tempCtx.strokeText(topText, textW / 2, textH / 2)

      const topLeftX = Math.round(COVER_WIDTH / 2 - textW / 2)
      const topLeftY = Math.round(textY - textH / 2)
      const sliceHeight = 1

      // Re-draw in thin horizontal slices with progressive horizontal offset.
      for (let y = 0; y < textH; y += sliceHeight) {
        const skewOffset = (y / textH - 0.5) * topTextSkew
        ctx.drawImage(
          tempCanvas,
          0,
          y,
          textW,
          sliceHeight,
          topLeftX + skewOffset,
          topLeftY + y,
          textW,
          sliceHeight,
        )
      }
    }
  }

  // Draw ordered list
  // _drawOrderedList(ctx as unknown as CanvasRenderingContext2D)

  // Save to file
  mkdirSync(dirname(outPath), { recursive: true })
  const buffer = canvas.toBuffer('image/png')
  writeFileSync(outPath, buffer)
  // eslint-disable-next-line no-console
  console.log(`  wrote background image: ${outPath}`)
}

async function _drawCircleIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  iconName: IconName,
  topText: string,
  bottomText: string,
): Promise<void> {
  const outerRadius = 18 * SCALE
  const innerRadius = 12 * SCALE

  // Draw outer circle
  ctx.beginPath()
  ctx.arc(x, y, outerRadius, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.stroke()

  // Draw inner circle
  ctx.beginPath()
  ctx.arc(x, y, innerRadius, 0, 2 * Math.PI)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.stroke()

  _drawRingTextWithPixelMapping(ctx, x, y, innerRadius, outerRadius, topText, true)
  _drawRingTextWithPixelMapping(ctx, x, y, innerRadius, outerRadius, bottomText, false)

  const icon = await _getCoverCircleIcon(iconName)
  const iconSize = innerRadius * 1.7
  ctx.drawImage(
    icon as unknown as CanvasImageSource,
    x - iconSize / 2,
    y - iconSize / 2,
    iconSize,
    iconSize,
  )
}

function _drawRingTextWithPixelMapping(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  text: string,
  isTop: boolean,
): void {
  const label = text.trim()
  if (!label) return

  const ringThickness = Math.max(1, outerRadius - innerRadius)
  const fontSize = Math.max(1, Math.floor(ringThickness * 0.9))
  const padX = Math.ceil(fontSize * 0.8)
  const padY = Math.ceil(fontSize * 0.4)

  const measureCanvas = createCanvas(8, 8)
  const measureCtx = measureCanvas.getContext('2d')
  measureCtx.font = `bold ${fontSize}px sans-serif`
  const measuredW = Math.ceil(measureCtx.measureText(label).width)

  const textW = Math.max(1, measuredW + padX * 2)
  const textH = Math.max(1, Math.ceil(ringThickness) + padY * 2)

  const textCanvas = createCanvas(textW, textH)
  const textCtx = textCanvas.getContext('2d')
  textCtx.clearRect(0, 0, textW, textH)
  textCtx.font = `bold ${fontSize}px sans-serif`
  textCtx.textAlign = 'center'
  textCtx.textBaseline = 'middle'
  textCtx.fillStyle = 'black'
  textCtx.fillText(label, textW / 2, textH / 2)
  const textData = textCtx.getImageData(0, 0, textW, textH).data

  const arcLength = measuredW * 1.15
  const midRadius = (innerRadius + outerRadius) * 0.5
  const angleSpan = Math.max(0.001, arcLength / Math.max(1, midRadius))
  const angleCenter = isTop ? -Math.PI / 2 : Math.PI / 2
  const angleStart = angleCenter - angleSpan / 2

  const boxLeft = Math.floor(cx - outerRadius)
  const boxTop = Math.floor(cy - outerRadius)
  const boxSize = Math.ceil(outerRadius * 2)
  const dstImage = ctx.getImageData(boxLeft, boxTop, boxSize, boxSize)
  const dst = dstImage.data

  for (let py = 0; py < boxSize; py++) {
    const worldY = boxTop + py + 0.5
    for (let px = 0; px < boxSize; px++) {
      const worldX = boxLeft + px + 0.5
      const dx = worldX - cx
      const dy = worldY - cy
      const r = Math.hypot(dx, dy)

      if (r < innerRadius || r > outerRadius) continue

      let angle = Math.atan2(dy, dx)
      if (angle < 0) angle += 2 * Math.PI

      let relAngle = angle - angleStart
      while (relAngle < 0) relAngle += 2 * Math.PI
      while (relAngle >= 2 * Math.PI) relAngle -= 2 * Math.PI
      if (relAngle > angleSpan) continue

      let u = relAngle / angleSpan
      if (!isTop) u = 1 - u  // Flip horizontal coordinate for bottom text
      let v = (r - innerRadius) / ringThickness
      if (!isTop) v = 1 - v // Flip vertical coordinate for bottom text
      if (v < 0 || v > 1) continue

      const srcX = Math.max(0, Math.min(textW - 1, Math.floor(u * (textW - 1))))
      const srcY = textH - 1 - Math.max(0, Math.min(textH - 1, Math.floor(v * (textH - 1))))
      const srcIndex = (srcY * textW + srcX) * 4
      const srcAlpha = textData[srcIndex + 3]
      if (srcAlpha < 8) continue

      const dstIndex = (py * boxSize + px) * 4
      dst[dstIndex] = 0
      dst[dstIndex + 1] = 0
      dst[dstIndex + 2] = 0
      dst[dstIndex + 3] = Math.max(dst[dstIndex + 3], srcAlpha)
    }
  }

  ctx.putImageData(dstImage, boxLeft, boxTop)
}

function _toSolidBlackSvg(svg: string): string {
  return svg
    .replace(/currentColor/g, '#000')
    .replace(/fill="none"/g, 'fill="#000"')
}

async function _getCoverCircleIcon(iconName: IconName): Promise<Awaited<ReturnType<typeof loadImage>>> {
  const cached = coverCircleIconCache.get(iconName)
  if (cached) return cached

  const solidSvg = _toSolidBlackSvg(BUTTON_ICONS[iconName])
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(solidSvg).toString('base64')}`
  const icon = await loadImage(svgDataUrl)
  coverCircleIconCache.set(iconName, icon)
  return icon
}

function _drawOrderedList(ctx: CanvasRenderingContext2D): void {
  const listItems = [
    { number: '1.', strong: 'Observe', description: 'Watch and remain open-minded' },
    { number: '2.', strong: 'Choose', description: 'Predict which ball will finish first' },
    { number: '3.', strong: 'Grow', description: 'Unlock the power of your subconscious' },
  ]

  const startY = COVER_HEIGHT * 0.4
  const itemSpacing = COVER_HEIGHT * 0.1
  const leftMargin = COVER_WIDTH * 0.1
  const maxWidth = COVER_WIDTH * 0.8

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.lineWidth = 0.75 * SCALE
  ctx.strokeStyle = 'black'

  listItems.forEach((item, index) => {
    const y = startY + index * itemSpacing

    // Draw number
    ctx.font = `bold ${20 * SCALE}px sans-serif`
    ctx.fillStyle = 'white'
    ctx.fillText(item.number, leftMargin, y)
    ctx.strokeText(item.number, leftMargin, y)

    // Draw strong text (title)
    ctx.font = `bold ${18 * SCALE}px sans-serif`
    const numberWidth = ctx.measureText(item.number).width
    const titleX = leftMargin + numberWidth + 15 * SCALE
    ctx.fillStyle = 'white'
    ctx.fillText(item.strong, titleX, y)
    ctx.strokeText(item.strong, titleX, y)

    // Draw description text
    ctx.font = `${14 * SCALE}px sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    const descriptionY = y + 22 * SCALE
    ctx.fillText(item.description, titleX, descriptionY)
    // ctx.strokeText(item.description, titleX, descriptionY)
  })
}

async function createCoverImage(outPath: string, options: CoverOptions): Promise<void> {
  const {
    topText = '',
    mainText,
    showEdgeTubes = false,
    edgeTubeRadius = 0.4,
  } = options

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  // Enable console logging from the page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', error => console.error('PAGE ERROR:', error))

  await page.setViewport({ width: COVER_WIDTH, height: COVER_HEIGHT })

  // Generate HTML with Three.js scene
  const html = generateThreeJSHTML(options)
  await page.setContent(html)

  // Wait for rendering to complete
  await page.waitForFunction(
    () => (window as any).renderComplete === true,
    { timeout: 120000 },
  )

  // Take screenshot
  const screenshot = await page.screenshot({ type: 'png', omitBackground: true })

  await browser.close()

  // Save to file
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, screenshot)
  // eslint-disable-next-line no-console
  console.log(`  wrote cover image: ${outPath}`)
}

async function createOutlinedSphereImage(outPath: string, options: CoverOptions): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: COVER_WIDTH, height: COVER_HEIGHT })

  const html = generateOutlinedSphereHTML(options)
  await page.setContent(html)

  await page.waitForFunction(
    () => (window as any).renderComplete === true,
    { timeout: 120000 },
  )

  const screenshot = await page.screenshot({ type: 'png', omitBackground: true })

  await browser.close()

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, screenshot)
  // eslint-disable-next-line no-console
  console.log(`  wrote outlined sphere image: ${outPath}`)
}

const outlinedSpherePatternDarkMaskCache = new Map<string, Uint8Array>()

async function applyFillPatternToOutlinedSphereImage(imagePath: string, patternName: PatternName): Promise<void> {
  const image = await loadImage(imagePath)
  const width = image.width
  const height = image.height

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const darkMap = _getOutlinedSpherePatternDarkMap(patternName, width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const a = data[idx + 3]
      if (a < 100) continue

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Only apply patterns on bright grayscale pixels (white/gray sphere regions).
      if (!_isPatternTargetPixel(r, g, b)) continue

      const isBlackPatternRegion = darkMap[y * width + x] === 1
      if (!isBlackPatternRegion) continue

      const shade = 0.8
      data[idx] = Math.round(r * shade)
      data[idx + 1] = Math.round(g * shade)
      data[idx + 2] = Math.round(b * shade)
    }
  }

  ctx.putImageData(imageData, 0, 0)
  writeFileSync(imagePath, canvas.toBuffer('image/png'))
  // eslint-disable-next-line no-console
  console.log(`  applied fill pattern: ${imagePath}`)
}

function _isPatternTargetPixel(r: number, g: number, b: number): boolean {
  // const maxChannelDelta = Math.max(
  //   Math.abs(r - g),
  //   Math.abs(r - b),
  //   Math.abs(g - b),
  // )
  // if (maxChannelDelta > 16) return false

  const brightness = (r + g + b) // / 3
  return brightness >= 30
}

function _getOutlinedSpherePatternDarkMap(patternName: PatternName, width: number, height: number): Uint8Array {
  const cacheKey = `${patternName}:${width}x${height}`
  const cached = outlinedSpherePatternDarkMaskCache.get(cacheKey)
  if (cached) return cached

  const darkMap = new Uint8Array(width * height)
  const tile = Pattern.getCanvas(patternName)

  if (tile) {
    const patternScale = BSP_PATTERN_SCALE_MULT * VALUE_SCALE * Pattern.create(patternName).getScale()
    const safeScale = Math.max(1e-4, patternScale)
    const tileCtx = tile.getContext('2d') as CanvasRenderingContext2D
    const tileW = Math.max(1, tile.width)
    const tileH = Math.max(1, tile.height)
    const tileData = tileCtx.getImageData(0, 0, tileW, tileH).data

    for (let y = 0; y < height; y++) {
      const sy = ((Math.floor(y / safeScale) % tileH) + tileH) % tileH
      for (let x = 0; x < width; x++) {
        const sx = ((Math.floor(x / safeScale) % tileW) + tileW) % tileW
        const off = (sy * tileW + sx) * 4
        darkMap[y * width + x] = (tileData[off] + tileData[off + 1] + tileData[off + 2]) < 128 * 3 ? 1 : 0
      }
    }
  }
  else {
    // Solid fallback for non-canvas patterns (e.g. 'black', 'white').
    const solidIsDark = patternName === 'black'
    darkMap.fill(solidIsDark ? 1 : 0)
  }

  outlinedSpherePatternDarkMaskCache.set(cacheKey, darkMap)
  return darkMap
}

async function splitOutlinedSphereImageByLine(imagePath: string, options: CoverOptions): Promise<void> {
  const {
    sphereSliceX1 = COVER_WIDTH * 0.33,
    sphereSliceY1 = COVER_HEIGHT * 0.6,
    sphereSliceX2 = COVER_WIDTH * 0.67,
    sphereSliceY2 = COVER_HEIGHT * 0.38,
  } = options

  const sourceImage = await loadImage(imagePath)
  const width = sourceImage.width
  const height = sourceImage.height

  const srcCanvas = createCanvas(width, height)
  const srcCtx = srcCanvas.getContext('2d')
  srcCtx.clearRect(0, 0, width, height)
  srcCtx.drawImage(sourceImage, 0, 0)

  const sourceData = srcCtx.getImageData(0, 0, width, height)
  const src = sourceData.data

  const partACanvas = createCanvas(width, height)
  const partAContext = partACanvas.getContext('2d')
  const partAData = partAContext.createImageData(width, height)
  const dstA = partAData.data

  const partBCanvas = createCanvas(width, height)
  const partBContext = partBCanvas.getContext('2d')
  const partBData = partBContext.createImageData(width, height)
  const dstB = partBData.data

  const dx = sphereSliceX2 - sphereSliceX1
  const dy = sphereSliceY2 - sphereSliceY1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const alpha = src[idx + 3]
      if (alpha === 0) continue

      // Sign of cross-product gives side of the infinite line through p1->p2.
      const side = (x + 0.5 - sphereSliceX1) * dy - (y + 0.5 - sphereSliceY1) * dx

      if (side >= 0) {
        dstA[idx] = src[idx]
        dstA[idx + 1] = src[idx + 1]
        dstA[idx + 2] = src[idx + 2]
        dstA[idx + 3] = src[idx + 3]
      }
      else {
        dstB[idx] = src[idx]
        dstB[idx + 1] = src[idx + 1]
        dstB[idx + 2] = src[idx + 2]
        dstB[idx + 3] = src[idx + 3]
      }
    }
  }

  partAContext.putImageData(partAData, 0, 0)
  partBContext.putImageData(partBData, 0, 0)

  const debugCanvas = createCanvas(width, height)
  const debugContext = debugCanvas.getContext('2d')
  debugContext.clearRect(0, 0, width, height)
  debugContext.drawImage(sourceImage, 0, 0)

  // Draw long line to visualize the infinite split plus the explicit segment and endpoints.
  const len = Math.hypot(dx, dy)
  if (len > 0.0001) {
    const ux = dx / len
    const uy = dy / len
    const maxLen = Math.max(width, height) * 2
    const ex1 = sphereSliceX1 - ux * maxLen
    const ey1 = sphereSliceY1 - uy * maxLen
    const ex2 = sphereSliceX2 + ux * maxLen
    const ey2 = sphereSliceY2 + uy * maxLen

    debugContext.strokeStyle = 'rgba(0, 255, 255, 0.75)'
    debugContext.lineWidth = 2
    debugContext.beginPath()
    debugContext.moveTo(ex1, ey1)
    debugContext.lineTo(ex2, ey2)
    debugContext.stroke()
  }

  debugContext.strokeStyle = 'rgba(255, 80, 0, 0.95)'
  debugContext.lineWidth = 4
  debugContext.beginPath()
  debugContext.moveTo(sphereSliceX1, sphereSliceY1)
  debugContext.lineTo(sphereSliceX2, sphereSliceY2)
  debugContext.stroke()

  debugContext.fillStyle = 'rgba(255, 80, 0, 1)'
  debugContext.beginPath()
  debugContext.arc(sphereSliceX1, sphereSliceY1, 8, 0, Math.PI * 2)
  debugContext.fill()
  debugContext.beginPath()
  debugContext.arc(sphereSliceX2, sphereSliceY2, 8, 0, Math.PI * 2)
  debugContext.fill()

  const dir = dirname(imagePath)
  const partAPath = join(dir, 'cover-sphere-part-a.png')
  const partBPath = join(dir, 'cover-sphere-part-b.png')
  const debugPath = join(dir, 'cover-sphere-debug.png')

  writeFileSync(partAPath, partACanvas.toBuffer('image/png'))
  writeFileSync(partBPath, partBCanvas.toBuffer('image/png'))
  writeFileSync(debugPath, debugCanvas.toBuffer('image/png'))

  // eslint-disable-next-line no-console
  console.log(`  wrote sphere part image: ${partAPath}`)
  // eslint-disable-next-line no-console
  console.log(`  wrote sphere part image: ${partBPath}`)
  // eslint-disable-next-line no-console
  console.log(`  wrote sphere debug image: ${debugPath}`)
}

async function createCombinedCoverBackground(
  outPath: string,
  backgroundPath: string,
  firstSpiralBackPath: string,
  secondSpiralPath: string,
): Promise<void> {
  const [backgroundImage, firstSpiralBackImage, secondSpiralImage] = await Promise.all([
    loadImage(backgroundPath),
    loadImage(firstSpiralBackPath),
    loadImage(secondSpiralPath),
  ])

  const width = backgroundImage.width
  const height = backgroundImage.height
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Preserve cover page layering while reducing runtime draw calls.
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(backgroundImage, 0, 0, width, height)
  ctx.drawImage(firstSpiralBackImage, 0, 0, width, height)
  ctx.drawImage(secondSpiralImage, 0, 0, width, height)

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, canvas.toBuffer('image/png'))
  // eslint-disable-next-line no-console
  console.log(`  wrote combined background image: ${outPath}`)
}

function generateOutlinedSphereHTML(options: CoverOptions): string {
  const {
    usePerspective = false,
    extrusionViewAngleX = 45,
    extrusionViewAngleY = 31,
    outlinedSphereSpiral = 'both',
  } = options

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';

    window.renderComplete = false;

    const COVER_WIDTH = ${COVER_WIDTH};
    const COVER_HEIGHT = ${COVER_HEIGHT};
    const aspect = COVER_WIDTH / COVER_HEIGHT;

    const scene = new THREE.Scene();
    scene.background = null;

    let camera;
    ${usePerspective
      ? `
    const cameraDistance = 87.6;
    const angleXRad = THREE.MathUtils.degToRad(${extrusionViewAngleX});
    const angleYRad = THREE.MathUtils.degToRad(${extrusionViewAngleY});
    const cameraX = cameraDistance * Math.cos(angleYRad) * Math.sin(angleXRad);
    const cameraY = cameraDistance * Math.sin(angleYRad);
    const cameraZ = cameraDistance * Math.cos(angleYRad) * Math.cos(angleXRad);

    const frustumSize = 54;
    camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, 0);
    `
      : `
    const frustumSize = 50;
    camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    `}

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(COVER_WIDTH, COVER_HEIGHT);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    const lightA = new THREE.DirectionalLight('rgb(255, 174, 238)', 2.2);
    lightA.position.set(-2000,-2000, 100);
    scene.add(lightA);

    const lightB = new THREE.DirectionalLight('rgb(84, 253, 253)', 2.2);
    lightB.position.set(1000, 1000, 100);
    scene.add(lightB);

    const fillLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(fillLight);

    const sphereGroup = new THREE.Group();
    const SPIRAL_SELECTION = ${JSON.stringify(outlinedSphereSpiral)};
    const sphereCount = 1;//10000;
    const diskCount = 1;//10000;
    const headRadius = 1;
    const tailRadius = 0;
    const spiralTurns = 2;
    const spiralSpread = 19;
    const tailDepth = -28;
    const headDepth = 6;
    const verticalSquash = 1;
    const cameraDir = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0)).normalize();

    const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
    const diskGeometry = new THREE.CircleGeometry(1, 32);
    const sphereMaterialA = new THREE.MeshStandardMaterial({
      color: 'rgb(255,255,255)',
      roughness: 0.32,
      metalness: 0.0,
    });
    const sphereMaterialB = new THREE.MeshStandardMaterial({
      color: 'rgb(255,255,255)',
      roughness: 0.32,
      metalness: 0.0,
    });
    const diskMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    for (let i = 0; i < sphereCount; i++) {
      const p = i / Math.max(1, sphereCount - 1);
      const baseAngle = 1.5 + p * spiralTurns * Math.PI * 2;
      for (let j = 0; j < 2; j++) {
        if (SPIRAL_SELECTION === 'first' && j !== 0) continue;
        if (SPIRAL_SELECTION === 'second' && j !== 1) continue;
        const angle = baseAngle + j * Math.PI
        const radius = THREE.MathUtils.lerp(tailRadius, headRadius, Math.pow(p, 1.8));
        let orbit = spiralSpread * Math.pow(p,.5);// * Math.pow(1 - p, 1.12);
        if( j === 1 ){
          orbit *= .5
        }
        const x = Math.cos(angle) * orbit;
        const y = Math.sin(angle) * orbit * verticalSquash + (1-p) * 10;
        const z = THREE.MathUtils.lerp(tailDepth, headDepth, p);
        const center = new THREE.Vector3(x, y, z);

        // Each outlined segment is a white sphere with a slightly larger disk facing the camera.
        if (i < diskCount) {
          const disk = new THREE.Mesh(diskGeometry, diskMaterial);
          disk.position.copy(center);
          disk.lookAt(camera.position);
          disk.scale.setScalar(radius * 1.2);
          disk.position.addScaledVector(cameraDir, -Math.max(0.06, radius * 0.05));
          sphereGroup.add(disk);
        }

        const sphere = new THREE.Mesh(sphereGeometry, j ? sphereMaterialA : sphereMaterialB );
        sphere.position.copy(center);
        sphere.scale.setScalar(radius);
        sphereGroup.add(sphere);
      }
    }

    scene.add(sphereGroup);

    renderer.render(scene, camera);
    window.renderComplete = true;
  </script>
</body>
</html>`
}

function generateThreeJSHTML(options: CoverOptions): string {
  const {
    topText = '',
    mainText,
    showEdgeTubes = false,
    showOuterEdges = false,
    edgeTubeRadius = 0.1,
    usePerspective = false,
    perspectiveTilt = 20,
    perspectiveWidthFactor = 1,
    extrusionViewAngleX = 45,
    extrusionViewAngleY = 31,
    topEdgeLeftY = 15,
    topEdgeRightY = 15,
    bottomEdgeLeftY = -15,
    bottomEdgeRightY = -15,
    edgeLineX = 30,
    showGuideLines = false,
    visibleLetters = 'all',
  } = options

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.181.2/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
    import { FontLoader } from 'three/addons/loaders/FontLoader.js';

    window.renderComplete = false;
    const MAIN_TEXT = \`${mainText}\`
    const VISIBLE_LETTERS = ${JSON.stringify(visibleLetters)};

    const COVER_WIDTH = ${COVER_WIDTH};
    const COVER_HEIGHT = ${COVER_HEIGHT};

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera setup
    const aspect = COVER_WIDTH / COVER_HEIGHT;
    let camera;
    
    ${usePerspective
      ? `
    // Isometric view: orthographic projection from a diagonal camera angle.
    // This preserves parallel depth lines and avoids FOV/vanishing-point distortion.
    // Camera position is calculated from viewing angles using spherical coordinates.
    const cameraDistance = 87.6;
    const angleXRad = THREE.MathUtils.degToRad(${extrusionViewAngleX}); // Horizontal angle (azimuthal)
    const angleYRad = THREE.MathUtils.degToRad(${extrusionViewAngleY}); // Vertical angle (elevation)
    
    // Convert spherical coordinates to Cartesian
    const cameraX = cameraDistance * Math.cos(angleYRad) * Math.sin(angleXRad);
    const cameraY = cameraDistance * Math.sin(angleYRad);
    const cameraZ = cameraDistance * Math.cos(angleYRad) * Math.cos(angleXRad);
    
    const isoFrustumSize = 54;
    camera = new THREE.OrthographicCamera(
      -isoFrustumSize * aspect / 2,
      isoFrustumSize * aspect / 2,
      isoFrustumSize / 2,
      -isoFrustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(0, 0, 0);
    
    console.log('Camera position:', cameraX.toFixed(2), cameraY.toFixed(2), cameraZ.toFixed(2));
    `
      : `
    // Orthographic camera for flat look
    const frustumSize = 50;
    camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    `}

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(COVER_WIDTH, COVER_HEIGHT);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);
    const extrudeDepth = 4;

    // bright front
    const frontLight = new THREE.DirectionalLight(0xffffff, 100);
    frontLight.position.set(0,0,1000);
    scene.add(frontLight);

    // // red left
    // const leftLight = new THREE.DirectionalLight(0xff0000, 0.8);
    // leftLight.position.set(-1000, 0, 0);
    // scene.add(leftLight);

    // blue bottom
    const bottomLight = new THREE.DirectionalLight('rgb(56,221,221)', 5);
    bottomLight.position.set(500, -1000, 0);
    scene.add(bottomLight);

    // Minimal ambient for high contrast
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);

    const group = new THREE.Group();

    ${showGuideLines
      ? `
    // Add guide lines to show alignment boundaries
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 5 });
    
    ${usePerspective
      ? `
    // For isometric camera, to make lines appear horizontal on screen,
    // we need to adjust Z as X changes based on the camera viewing angle.
    // The ratio depends on how the camera projects the X and Z axes onto the screen.
    const isoRatio = cameraX / Math.max(0.01, cameraZ);
    
    const avgTargetHeight = ((${topEdgeLeftY} - ${bottomEdgeLeftY}) + (${topEdgeRightY} - ${bottomEdgeRightY})) / 2;
    const tiltRadians = THREE.MathUtils.degToRad(${perspectiveTilt});
    const tiltDepthRange = Math.tan(Math.abs(tiltRadians)) * avgTargetHeight * 0.35;
    const tiltSign = Math.sign(${perspectiveTilt}) || 1;
    
    // Calculate base depth for top edge (v ≈ 1 at top)
    const topV = 1;
    const topCenteredV = (topV - 0.5) * 2;
    const topBaseDepth = THREE.MathUtils.clamp(-tiltSign * topCenteredV * tiltDepthRange, -8, 8);
    
    // Calculate base depth for bottom edge (v ≈ 0 at bottom)
    const bottomV = 0;
    const bottomCenteredV = (bottomV - 0.5) * 2;
    const bottomBaseDepth = THREE.MathUtils.clamp(-tiltSign * bottomCenteredV * tiltDepthRange, -8, 8);
    
    // Top guide line: Z adjusts as X changes to appear horizontal
    const topLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${topEdgeLeftY}, topBaseDepth + ${edgeLineX} * isoRatio),
      new THREE.Vector3(${edgeLineX}, ${topEdgeRightY}, topBaseDepth - ${edgeLineX} * isoRatio)
    ]);
    const topLine = new THREE.Line(topLineGeo, lineMaterial);
    scene.add(topLine);
    
    // Bottom guide line: Z adjusts as X changes to appear horizontal
    const bottomLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${bottomEdgeLeftY}, bottomBaseDepth + ${edgeLineX} * isoRatio),
      new THREE.Vector3(${edgeLineX}, ${bottomEdgeRightY}, bottomBaseDepth - ${edgeLineX} * isoRatio)
    ]);
    const bottomLine = new THREE.Line(bottomLineGeo, lineMaterial);
    scene.add(bottomLine);
    
    console.log('Isometric ratio (X/Z adjustment):', isoRatio.toFixed(3));
    `
      : `
    // Top guide line (can be slanted)
    const topLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${topEdgeLeftY}, 0),
      new THREE.Vector3(${edgeLineX}, ${topEdgeRightY}, 0)
    ]);
    const topLine = new THREE.Line(topLineGeo, lineMaterial);
    scene.add(topLine);
    
    // Bottom guide line (can be slanted)
    const bottomLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-${edgeLineX}, ${bottomEdgeLeftY}, 0),
      new THREE.Vector3(${edgeLineX}, ${bottomEdgeRightY}, 0)
    ]);
    const bottomLine = new THREE.Line(bottomLineGeo, lineMaterial);
    scene.add(bottomLine);
    `}
    `
      : ''}

    // Load font and create text
    const loader = new FontLoader();
    loader.load(
      'https://cdn.jsdelivr.net/npm/three@0.181.2/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {

        // Main extruded text - create merged geometry first
        const { mergedGeo: mergedTextGeo, letterTriangleRanges } = createMultilineTextGeometry(MAIN_TEXT, {
          font: font,
          size: 8,
          depth: extrudeDepth,
          curveSegments: 12,
          bevelEnabled: false,
        });

        mergedTextGeo.translate(0, 0, -extrudeDepth);
        
        // Map text vertices so each X column spans between the configured
        // top and bottom guide lines. This warps the ENTIRE text block.
        ${usePerspective
          ? `
        const isoRatio = cameraX / Math.max(0.01, cameraZ);
        warpGeometryToEdgeLines(mergedTextGeo, {
          edgeLineX: ${edgeLineX},
          topEdgeLeftY: ${topEdgeLeftY},
          topEdgeRightY: ${topEdgeRightY},
          bottomEdgeLeftY: ${bottomEdgeLeftY},
          bottomEdgeRightY: ${bottomEdgeRightY},
          extrudeDepth,
          perspectiveTilt: ${perspectiveTilt},
          perspectiveWidthFactor: ${perspectiveWidthFactor},
          isoRatio: isoRatio,
        });
        `
          : ''}

        // Now separate the warped geometry back into individual letters using the tracked ranges
        const letterGeometries = separateByTriangleRanges(mergedTextGeo, letterTriangleRanges);
        console.log('Separated into', letterGeometries.length, 'letter components');
        
        // Store letter count for external access
        window.letterCount = letterGeometries.length;

        // Determine which letters to show based on VISIBLE_LETTERS
        const visibilityMask = letterGeometries.map((_, idx) => {
          if (VISIBLE_LETTERS === 'all') return true;
          if (Array.isArray(VISIBLE_LETTERS)) return VISIBLE_LETTERS.includes(idx);
          return false;
        });
        const visibleCount = visibilityMask.filter(v => v).length;
        console.log('Showing', visibleCount, 'of', letterGeometries.length, 'letters');

        // Process each letter geometry
        letterGeometries.forEach((letterGeo, letterIdx) => {
          if (!visibilityMask[letterIdx]) {
            console.log('Hiding letter', letterIdx);
            return; // Skip hidden letters
          }

          // Main text mesh for this letter
          const textMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
          });
          const letterMesh = new THREE.Mesh(letterGeo, textMaterial);
          letterMesh.position.set(0, 0, 0);
          group.add(letterMesh);

          // Edge tubes and optional outer edge layers based on front-face loops
          ${showEdgeTubes || showOuterEdges
            ? `
          const frontEdgeLoops = extractFrontEdgeLoops(letterGeo);
          console.log('Letter', letterIdx, ': Found', frontEdgeLoops.length, 'loops');
          frontEdgeLoops.forEach((loop, loopIdx) => {
            if (loop.length < 2) return;
            
            const curve = new EdgeCurve(loop);
            const tubeRadius = ${edgeTubeRadius};
            // Keep tube detail proportional to loop complexity to avoid pathological render times.
            const tubularSegments = 1000 // Math.max(120, Math.ceil(loop.length * 4));

            const buildTubeGeoAtOffset = (zOffset, tubeRadius) => {
              const tubeGeo = new THREE.TubeGeometry(
                curve,
                tubularSegments,
                tubeRadius,
                8,
                true
              );
              tubeGeo.translate(0, 0, extrudeDepth + zOffset);
              return tubeGeo;
            };

            if (${showOuterEdges}) {
              const outerLayerCount = Math.max(2, Math.floor(extrudeDepth * 8));
              const outerStep = outerLayerCount > 1 ? extrudeDepth / (outerLayerCount - 1) : extrudeDepth;
              const outerMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                depthWrite: false,
                depthTest: false,
              });

              for (let layer = 0; layer < outerLayerCount; layer++) {
                const zOffset = -layer * outerStep;
                const outerMesh = new THREE.Mesh(buildTubeGeoAtOffset(zOffset, tubeRadius * 2), outerMaterial);
                outerMesh.renderOrder = -999;
                outerMesh.position.set(letterMesh.position.x, letterMesh.position.y, 0);
                group.add(outerMesh);
              }
            }

            if (${showEdgeTubes}) {
              const tubeMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                depthWrite: false,
                depthTest: false,
              });
              const tubeMesh = new THREE.Mesh(buildTubeGeoAtOffset(0, tubeRadius), tubeMaterial);
              tubeMesh.renderOrder = 999;
              tubeMesh.position.set(letterMesh.position.x, letterMesh.position.y, 0);
              group.add(tubeMesh);
            }
          });
          `
            : ''}
        });

        scene.add(group);

        // Render
        renderer.render(scene, camera);
        window.renderComplete = true;
      }
    );

    function createMultilineTextGeometry(text, textOptions) {
      const lines = String(text).split('\\n');
      const lineCount = Math.max(1, lines.length);
      const lineHeight = textOptions.size * 1.2;
      const topBaselineY = ((lineCount - 1) * lineHeight) / 2;
      const letterGeometries = [];

      for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
        const line = lines[lineIdx];
        if (!line || line.length === 0) continue;

        // Create geometries for each character to get their individual widths
        const charInfos = [];
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === ' ') {
            charInfos.push({ char, geometry: null, width: textOptions.size * 0.5 });
            continue;
          }

          const charGeo = new TextGeometry(char, textOptions);
          charGeo.computeBoundingBox();
          const bbox = charGeo.boundingBox;
          const width = bbox.max.x - bbox.min.x;
          charInfos.push({ char, geometry: charGeo, width, bbox });
        }

        // Calculate total line width to center it
        const totalWidth = charInfos.reduce((sum, info) => sum + info.width, 0);
        const lineStartX = -totalWidth / 2;

        // Position each character
        let currentX = lineStartX;
        const baselineY = topBaselineY - lineIdx * lineHeight;

        for (const info of charInfos) {
          if (info.geometry) {
            const charGeo = info.geometry.clone();
            // Position relative to its own bbox
            charGeo.translate(currentX - info.bbox.min.x, baselineY, 0);
            letterGeometries.push(charGeo);
          }
          currentX += info.width;
        }
      }

      // Track which triangles belong to which letter
      const letterTriangleRanges = [];
      let triangleOffset = 0;
      
      for (const geo of letterGeometries) {
        const triCount = Math.floor(geo.attributes.position.count / 3);
        letterTriangleRanges.push({
          start: triangleOffset,
          end: triangleOffset + triCount
        });
        triangleOffset += triCount;
      }

      return {
        mergedGeo: mergeGeometries(letterGeometries),
        letterTriangleRanges
      };
    }

    function mergeGeometries(geometries) {
      if (!geometries || geometries.length === 0) {
        return new THREE.BufferGeometry();
      }

      const nonIndexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
      let totalPositionValues = 0;
      for (const g of nonIndexed) {
        totalPositionValues += g.attributes.position.array.length;
      }

      const mergedPositions = new Float32Array(totalPositionValues);
      let positionOffset = 0;
      for (const g of nonIndexed) {
        const source = g.attributes.position.array;
        mergedPositions.set(source, positionOffset);
        positionOffset += source.length;
      }

      const merged = new THREE.BufferGeometry();
      merged.setAttribute('position', new THREE.BufferAttribute(mergedPositions, 3));
      merged.computeVertexNormals();
      merged.computeBoundingBox();
      merged.computeBoundingSphere();
      return merged;
    }

    function separateByTriangleRanges(geometry, letterTriangleRanges) {
      const position = geometry.attributes.position;
      const letterGeometries = [];

      for (const range of letterTriangleRanges) {
        const triCount = range.end - range.start;
        const vertexCount = triCount * 3;
        const positions = new Float32Array(vertexCount * 3);

        for (let i = 0; i < triCount; i++) {
          const srcTri = range.start + i;
          for (let v = 0; v < 3; v++) {
            const srcIdx = srcTri * 3 + v;
            const dstIdx = i * 3 + v;
            positions[dstIdx * 3 + 0] = position.getX(srcIdx);
            positions[dstIdx * 3 + 1] = position.getY(srcIdx);
            positions[dstIdx * 3 + 2] = position.getZ(srcIdx);
          }
        }

        const letterGeo = new THREE.BufferGeometry();
        letterGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        letterGeo.computeVertexNormals();
        letterGeometries.push(letterGeo);
      }

      return letterGeometries;
    }

    function separateIntoConnectedComponents(geometry) {
      const position = geometry.attributes.position;
      const triangleCount = Math.floor(position.count / 3);
      
      if (triangleCount === 0) return [];

      // Build vertex connectivity - which triangles share vertices
      const vertexToTriangles = new Map();
      
      for (let t = 0; t < triangleCount; t++) {
        for (let v = 0; v < 3; v++) {
          const idx = t * 3 + v;
          const x = position.getX(idx);
          const y = position.getY(idx);
          const z = position.getZ(idx);
          const key = x.toFixed(6) + ',' + y.toFixed(6) + ',' + z.toFixed(6);
          
          if (!vertexToTriangles.has(key)) {
            vertexToTriangles.set(key, []);
          }
          vertexToTriangles.get(key).push(t);
        }
      }

      // Build triangle adjacency graph
      const triangleNeighbors = new Map();
      for (let t = 0; t < triangleCount; t++) {
        triangleNeighbors.set(t, new Set());
      }

      for (const triangles of vertexToTriangles.values()) {
        // All triangles sharing this vertex are neighbors
        for (let i = 0; i < triangles.length; i++) {
          for (let j = i + 1; j < triangles.length; j++) {
            triangleNeighbors.get(triangles[i]).add(triangles[j]);
            triangleNeighbors.get(triangles[j]).add(triangles[i]);
          }
        }
      }

      // Find connected components using flood fill
      const visited = new Set();
      const components = [];

      for (let seed = 0; seed < triangleCount; seed++) {
        if (visited.has(seed)) continue;

        const component = [];
        const queue = [seed];
        visited.add(seed);

        while (queue.length > 0) {
          const t = queue.shift();
          component.push(t);

          for (const neighbor of triangleNeighbors.get(t)) {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          }
        }

        components.push(component);
      }

      console.log('Found', components.length, 'connected components');

      // Create separate geometries for each component
      const componentGeometries = [];
      
      for (const component of components) {
        const vertexCount = component.length * 3;
        const positions = new Float32Array(vertexCount * 3);
        
        for (let i = 0; i < component.length; i++) {
          const t = component[i];
          for (let v = 0; v < 3; v++) {
            const srcIdx = t * 3 + v;
            const dstIdx = i * 3 + v;
            positions[dstIdx * 3 + 0] = position.getX(srcIdx);
            positions[dstIdx * 3 + 1] = position.getY(srcIdx);
            positions[dstIdx * 3 + 2] = position.getZ(srcIdx);
          }
        }

        const compGeo = new THREE.BufferGeometry();
        compGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        compGeo.computeVertexNormals();
        componentGeometries.push(compGeo);
      }

      return componentGeometries;
    }

    // Helper function to extract front face edge loops (one per letter/hole)
    function warpGeometryToEdgeLines(geometry, config) {
      const {
        edgeLineX,
        topEdgeLeftY,
        topEdgeRightY,
        bottomEdgeLeftY,
        bottomEdgeRightY,
        extrudeDepth,
        perspectiveTilt,
        perspectiveWidthFactor,
        isoRatio,
      } = config;

      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const minX = bbox.min.x;
      const maxX = bbox.max.x;
      const centerX = (minX + maxX) / 2;
      const minY = bbox.min.y;
      const maxY = bbox.max.y;
      const halfWidth = Math.max(1e-6, (maxX - minX) / 2);
      const height = Math.max(1e-6, maxY - minY);

      const position = geometry.attributes.position;
      const avgTargetHeight =
        ((topEdgeLeftY - bottomEdgeLeftY) + (topEdgeRightY - bottomEdgeRightY)) / 2;

      // Apply depth shift by vertical position so perspectiveTilt behaves like
      // rotation around the X axis (top recedes, bottom comes forward).
      const tiltRadians = THREE.MathUtils.degToRad(perspectiveTilt);
      const tiltDepthRange = Math.tan(Math.abs(tiltRadians)) * avgTargetHeight * 0.35;
      const tiltSign = Math.sign(perspectiveTilt) || 1;

      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const y = position.getY(i);
        const z = position.getZ(i);

        // Keep mapping centered while allowing width tuning with perspectiveWidthFactor.
        const centeredU = (x - centerX) / (halfWidth * Math.max(1e-6, perspectiveWidthFactor));
        const u = THREE.MathUtils.clamp((centeredU + 1) / 2, 0, 1);
        const v = (y - minY) / height;

        const targetX = THREE.MathUtils.lerp(-edgeLineX, edgeLineX, u);
        const topY = THREE.MathUtils.lerp(topEdgeLeftY, topEdgeRightY, u);
        const bottomY = THREE.MathUtils.lerp(bottomEdgeLeftY, bottomEdgeRightY, u);
        const targetY = THREE.MathUtils.lerp(bottomY, topY, v);

        // Depth varies by row instead of column to avoid Y-axis-style skew.
        const centeredV = (v - 0.5) * 2;
        const baseDepthShift = THREE.MathUtils.clamp(
          -tiltSign * centeredV * tiltDepthRange,
          -8,
          8
        );

        // For isometric camera, to make lines appear horizontal on screen,
        // Z must be adjusted based on X position using the camera-dependent ratio.
        const isoZAdjustment = -targetX * isoRatio;

        // Preserve front/back layering while shifting each X column in depth.
        const depthT = (z + extrudeDepth) / Math.max(1e-6, extrudeDepth);
        const targetZ = baseDepthShift + isoZAdjustment + THREE.MathUtils.lerp(-extrudeDepth, 0, depthT);

        position.setXYZ(i, targetX, targetY, targetZ);
      }

      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }

    function extractFrontEdgeLoops(geometry) {
      const position = geometry.attributes.position;
      const index = geometry.index;

      if (!position || position.count === 0) {
        return [];
      }

      const vertexIdByKey = new Map(); // key "x,y" -> stable id
      const vertexById = new Map(); // id -> Vector3
      const edgeUseCount = new Map(); // edge "a:b" -> triangle use count
      let nextVertexId = 0;

      function vertexKey(x, y) {
        return x.toFixed(5) + ',' + y.toFixed(5);
      }

      function getFrontVertexId(v) {
        const key = vertexKey(v.x, v.y);
        if (!vertexIdByKey.has(key)) {
          const id = nextVertexId++;
          vertexIdByKey.set(key, id);
          vertexById.set(id, new THREE.Vector3(v.x, v.y, v.z));
        }
        return vertexIdByKey.get(key);
      }

      function addEdgeById(a, b) {
        if (a === b) return;
        const edgeKey = a < b ? a + ':' + b : b + ':' + a;
        edgeUseCount.set(edgeKey, (edgeUseCount.get(edgeKey) || 0) + 1);
      }

      const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);
      for (let t = 0; t < triangleCount; t++) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

        const v0 = new THREE.Vector3(position.getX(i0), position.getY(i0), position.getZ(i0));
        const v1 = new THREE.Vector3(position.getX(i1), position.getY(i1), position.getZ(i1));
        const v2 = new THREE.Vector3(position.getX(i2), position.getY(i2), position.getZ(i2));

        // Keep only cap triangles that face the camera/front direction.
        const e1 = new THREE.Vector3().subVectors(v1, v0);
        const e2 = new THREE.Vector3().subVectors(v2, v0);
        const triNormal = new THREE.Vector3().crossVectors(e1, e2);
        if (triNormal.lengthSq() > 1e-12) {
          triNormal.normalize();
        }

        if (triNormal.z < -0.35) {
          const a = getFrontVertexId(v0);
          const b = getFrontVertexId(v1);
          const c = getFrontVertexId(v2);
          addEdgeById(a, b);
          addEdgeById(b, c);
          addEdgeById(c, a);
        }
      }

      const adjacency = new Map(); // id -> Set<neighborId>
      const boundaryEdges = [];
      edgeUseCount.forEach((count, edgeKey) => {
        if (count !== 1) return;
        const [aStr, bStr] = edgeKey.split(':');
        const a = Number(aStr);
        const b = Number(bStr);
        boundaryEdges.push([a, b]);

        if (!adjacency.has(a)) adjacency.set(a, new Set());
        if (!adjacency.has(b)) adjacency.set(b, new Set());
        adjacency.get(a).add(b);
        adjacency.get(b).add(a);
      });

      const usedEdgeKeys = new Set();
      function undirectedEdgeKey(a, b) {
        return a < b ? a + ':' + b : b + ':' + a;
      }

      const loops = [];
      for (const [startA, startB] of boundaryEdges) {
        const seedKey = undirectedEdgeKey(startA, startB);
        if (usedEdgeKeys.has(seedKey)) continue;

        const loopIds = [startA, startB];
        usedEdgeKeys.add(seedKey);

        let prev = startA;
        let current = startB;
        let guard = 0;
        const maxSteps = boundaryEdges.length + 10;

        while (guard++ < maxSteps) {
          if (current === startA) {
            break;
          }

          const neighbors = adjacency.get(current);
          if (!neighbors || neighbors.size === 0) {
            break;
          }

          let next = null;
          for (const candidate of neighbors) {
            if (candidate === prev) continue;
            const candidateEdgeKey = undirectedEdgeKey(current, candidate);
            if (usedEdgeKeys.has(candidateEdgeKey)) continue;
            next = candidate;
            break;
          }

          if (next === null) {
            for (const candidate of neighbors) {
              if (candidate === prev) continue;
              next = candidate;
              break;
            }
          }

          if (next === null) {
            break;
          }

          const nextEdgeKey = undirectedEdgeKey(current, next);
          usedEdgeKeys.add(nextEdgeKey);
          loopIds.push(next);
          prev = current;
          current = next;
        }

        if (loopIds.length > 3 && loopIds[loopIds.length - 1] === loopIds[0]) {
          const loop = loopIds.map((id) => vertexById.get(id).clone());
          loops.push(loop);
        }
      }

      return loops;
    }

    // Custom curve for tube geometry
    class EdgeCurve extends THREE.Curve {
      constructor(points) {
        super();
        this.points = points;
      }

      getPoint(t) {
        const totalPoints = this.points.length - 1;
        const scaledT = t * totalPoints;
        const index = Math.floor(scaledT);
        const nextIndex = Math.min(index + 1, totalPoints);
        const localT = scaledT - index;
        
        return new THREE.Vector3().lerpVectors(
          this.points[index],
          this.points[nextIndex],
          localT
        );
      }
    }
  </script>
</body>
</html>`
}
