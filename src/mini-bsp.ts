/**
 * @file mini-bsp.ts
 *
 * Mini view of ball-seelction panel.
 */

// export class MiniBsp {
// static logMiniSvg(w: number, h: number, pw?: PinballWizard) {
//   if (!pw || !pw.activeSim) return
//   const { totalWidth, totalHeight, diskPositions, diskRadius } = ballSelectionPanel
//   const scale = Math.min(w / totalWidth, h / totalHeight)
//   const drawW = totalWidth * scale
//   const drawH = totalHeight * scale
//   const offsetX = (w - drawW) / 2
//   const offsetY = (h - drawH) / 2
//   let svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"
//   xmlns="http://www.w3.org/2000/svg">\n`
//   svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="#ddd"/>\n`
//   for (let i = 0; i < DISK_COUNT; i++) {
//     const disk = pw.activeSim.disks[i]
//     if (!disk) continue
//     const isSelected = (i === pw.selectedDiskIndex)
//     const [cx, cy] = diskPositions[i]
//     // Apply scaling and offset
//     const scx = offsetX + cx * scale
//     const scy = offsetY + cy * scale
//     const sr = diskRadius * 0.8 * scale
//     svg += `<circle cx="${scx}" cy="${scy}" r="${sr}" fill="${isSelected ? 'green' :
// 'black'}" stroke="black" stroke-width="${isSelected ? 4 : 1}"/>\n`
//   }
//   svg += `</svg>`
//   console.log(svg)
// }

//   /**
//        * Draws a scaled-down version of the ball selection panel directly onto the given context.
//        * The drawing is scaled and centered to fit within (w, h), preserving aspect ratio.
//        */
//   static drawMiniView(ctx: CanvasRenderingContext2D, w: number, h: number, pw?: PinballWizard) {
//     // Use a dummy PinballWizard if not provided (for preview/testing)
//     // If not provided, skip drawing
//     if (!pw || !pw.activeSim) return
//     const { totalWidth, totalHeight, diskPositions } = ballSelectionPanel

//     // Compute scale to fit the original panel into (w, h)
//     const scale = Math.min(w / totalWidth, h / totalHeight)
//     const drawW = totalWidth * scale
//     const drawH = totalHeight * scale
//     const offsetX = (w - drawW) / 2
//     const offsetY = (h - drawH) / 2

//     ctx.save()
//     ctx.translate(offsetX, offsetY)
//     ctx.scale(scale, scale)

//     // Background
//     // ctx.fillStyle = 'rgb(221,221,221)'
//     ctx.clearRect(0, 0, totalWidth, totalHeight)

//     // Draw balls
//     for (let i = 0; i < DISK_COUNT; i++) {
//       const disk = pw.activeSim.disks[i]
//       if (!disk) continue
//       const isSelected = (i === pw.selectedDiskIndex)
//       drawDisk(ctx, disk, isSelected, false, ...diskPositions[i])
//     }

//     ctx.restore()
//   }
// }

// function drawDisk(
//   ctx: CanvasRenderingContext2D, disk: Disk,
//   _isSelected = false, _isWinner = false,
//   cx: number, cy: number,
// ) {
//   ctx.beginPath()

//   const [x0, y0] = disk.interpolatedPos.map(v => -v / VALUE_SCALE)

//   const diskRadius = ballSelectionPanel.diskRadius * 0.8

//   ctx.save()
//   ctx.translate(x0, y0)
//   ctx.moveTo(cx - x0, cy - y0)
//   ctx.arc(cx - x0, cy - y0, diskRadius, 0, twopi)
//   ctx.fillStyle = 'black'
//   ctx.fill()
//   ctx.restore()
// }

// // scaled versions of disk-gfx patterns
// const scaledFillers: Partial<Record<DiskPattern, CanvasPattern | string>> = {}
// function getScaledPattern(pattern: DiskPattern): CanvasPattern | string {
//   if (!Object.hasOwn(scaledFillers, pattern)) {
//     scaledFillers[pattern] = _buildScaledPattern(pattern)
//   }
//   return scaledFillers[pattern] as CanvasPattern
// }

// function _buildScaledPattern(pattern: DiskPattern): CanvasPattern | string {
//   const original = PATTERN_FILLERS[pattern]
//   if (original instanceof CanvasPattern) {
//     return buildPattern(pattern, 20 / VALUE_SCALE) // scaled canvas pattern
//   }
//   return original // string
// }
