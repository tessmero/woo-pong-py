/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { Camera } from 'camera'
import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { topConfig } from 'configs/imp/top-config'
import { Graphics } from 'gfx/graphics'
import type { ElementId } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import { updateClockLabel } from 'guis/imp/playing-gui'
import { GUI } from 'imp-names'
import type { BreakoutRoom } from 'rooms/imp/breakout-room'
import type { Speed } from 'simulation/constants'
import { BOBRICK_COUNT, DISK_COUNT, DISK_RADIUS, DISK_RADSQ, SPEED_LERP, SPEEDS, STEPS_BEFORE_BRANCH, VALUE_SCALE } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Rectangle } from 'util/math-util'
import { type Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

export class PinballWizard {
  // sim for live toppling/rewind
  public activeSim!: Simulation // assigned in init
  public gui!: Gui // assigned in init

  public isTitleScreen = true
  public speed: Speed = 'normal'
  public selectedDiskIndex = -1

  public readonly camera = new Camera()

  constructor() {
    if (didConstruct) {
      throw new Error('PinballWizard constructed multiple times')
    }
    didConstruct = true
  }

  private _race: Array<number> = []
  async init() {
    if (didInit) {
      throw new Error('PinballWizard initialized multiple times')
    }
    didInit = true

    const cfgSeed = topConfig.flatConfig.seed
    const isSeedConfiged = cfgSeed !== -1 // is seed set manually by user or puppeteer

    this._race = Lut.create('race-lut').tree[0]
    const commonStartSeed = isSeedConfiged ? cfgSeed : this._race[0]

    this.activeSim = new Simulation(commonStartSeed)
    if (!isSeedConfiged) {
      this.activeSim.branchSeed = this._race[1]
    }

    const brickValuesStartIndex = 1 + DISK_COUNT
    const room = this.activeSim.level.rooms.find(room => 'breakoutBricks' in room) as BreakoutRoom
    if (room) {
      for (let i = 0; i < BOBRICK_COUNT; i++) {
        room.breakoutBricks[i].label = `${this._race[i + brickValuesStartIndex]}`
      }
    }

    this.gui = Gui.create('playing-gui')

    window.addEventListener('resize', () => this.onResize())
    this.onResize()
  }

  private _speedMult = 1 // real simulation speed
  update(dt: number) {
    const wasBranched = this.hasBranched

    const targetSpeed = SPEEDS[this.speed]
    const delta = dt * SPEED_LERP
    if (this._speedMult < targetSpeed) {
      this._speedMult = Math.min(targetSpeed, this._speedMult + delta)
    }
    if (this._speedMult > targetSpeed) {
      this._speedMult = Math.max(targetSpeed, this._speedMult - delta)
    }

    this.activeSim.update(dt * this._speedMult)
    if (this.activeSim.winningDiskIndex !== -1) {
      this.speed = 'paused'
      this._speedMult = 0
    }

    if (this.hasBranched && !wasBranched) {
      // just branched
      this.onResize()
    }

    this.camera.update(dt, this)
    Graphics.drawOffset[1] = this.camera.pos * Graphics.drawSimScale
      + Graphics.cvs.height / 2
    Graphics.drawSim(this.activeSim, this.selectedDiskIndex)

    // draw mouse pose
    Graphics.drawCursor(this.mousePos)

    Graphics.drawScrollBar(this)

    updateClockLabel(this.activeSim.stepCount)

    this.debugBranchCountdown(Graphics.ctx, Graphics.cvs.width, Graphics.cvs.height)
  }

  public get hasBranched() {
    return this.activeSim.stepCount >= STEPS_BEFORE_BRANCH
  }

  private debugBranchCountdown(ctx: CanvasRenderingContext2D, w: number, _h: number) {
    const thickness = 20
    const progress = Math.min(1, this.activeSim.stepCount / STEPS_BEFORE_BRANCH)

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, w, thickness)

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, w * progress, thickness)
  }

  locateDiskOnScreen(diskIndex: number): Rectangle {
    const disk = this.activeSim.disks[diskIndex]
    const [rawx, rawy] = disk.interpolatedPos
    const rad = DISK_RADIUS * VALUE_SCALE * Graphics.drawSimScale
    const x = Graphics.drawOffset[0] + rawx * Graphics.drawSimScale
    const y = Graphics.drawOffset[1] + rawy * Graphics.drawSimScale
    return [
      x - rad, y - rad, 2 * rad, 2 * rad,
    ]
  }

  private readonly mousePos: Vec2 = [0, 0]
  private readonly simMousePos: Vec2 = [0, 0]
  move(mousePos: Vec2): Vec2 {
    if (this.isMouseDown) {
      this.camera.drag(this.dragY, mousePos[1])
      this.dragY = mousePos[1]
    }

    // idleCountdown = IDLE_DELAY
    const { drawOffset, drawSimScale } = Graphics

    this.mousePos[0] = (mousePos[0] - drawOffset[0])
    this.mousePos[1] = (mousePos[1] - drawOffset[1])

    // compute mouse pos in terms of simulation units
    const simMouseX = mousePos[0] / drawSimScale * window.devicePixelRatio - drawOffset[0] / drawSimScale
    const simMouseY = mousePos[1] / drawSimScale * window.devicePixelRatio - drawOffset[1] / drawSimScale
    this.simMousePos[0] = simMouseX
    this.simMousePos[1] = simMouseY

    // // // debug, position obstacle on mouse
    // const obs = this.activeSim.obstacles.at(-1) as Obstacle
    // obs.pos[0] = simMouseX
    // obs.pos[1] = simMouseY

    // // debug identify hovered room
    // for (const [roomIndex, room] of this.activeSim.level.rooms.entries()) {
    //   const bounds = room.bounds
    //   if (rectContainsPoint(bounds, simMouseX, simMouseY)) {
    //     console.log(`hovered room ${roomIndex}`)
    //   }
    // }

    // this.gui.move(this, this.mousePos)

    return this.mousePos
  }

  private isMouseDown = false
  private dragY = 0
  down(rawPos: Vec2) {
    const _mousePos = this.move(rawPos)
    this.isMouseDown = true
    this.dragY = rawPos[1]

    for (const [diskIndex, disk] of this.activeSim.disks.entries()) {
      const [x, y] = disk.interpolatedPos
      const distSquared
        = Math.pow(this.simMousePos[0] - x, 2)
          + Math.pow(this.simMousePos[1] - y, 2)
      if (distSquared < DISK_RADSQ) {
        this.selectedDiskIndex = diskIndex
        this.activeSim.branchSeed = this._race[diskIndex + 1]
      }
    }
  }

  up(rawPos: Vec2) {
    this.isMouseDown = false
    this.camera.endDrag()
  }

  public didBuildControls = false // set to true after first build

  public rebuildControls() {
    this.didBuildControls = true
    showControls(this, pinballWizardConfig.tree)
  }

  public onResize() {
    Graphics.onResize()

    // // on title screen, set level bounds to match screen height
    // console.log('poop')
    // this.activeSim.level.bounds[3] = Math.floor(Graphics.cvs.height / Graphics.drawSimScale)

    // console.log('onResize')
    // console.log('this.gui is ', this.gui.constructor.name)
    for (const guiName of GUI.NAMES) {
      const gui = Gui.create(guiName)
      const isVisible = (gui === this.gui)

      // game hud and dialogs
      for (const id in gui.elements) {
        // console.log('toggle element', gui.elements[id]!.htmlElem.innerHTML)
        toggleElement(id as ElementId, isVisible)
      }
      if (this.gui) this.gui.refreshLayout(this)
    }

    if (this.gui) this.gui.showHideElements(this)

    // // update 3d renderer viewport
    // OverlayLayer.onResize()
    // this.graphics.onResize(this)
    // SceneElements.reset(this)
    // GroundGrid.reset(this)
    // SkyGrid.reset(this)
  }
}
