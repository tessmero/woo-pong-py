/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { Camera } from 'camera'
import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { Graphics } from 'gfx/graphics'
import type { ElementId } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import { GUI } from 'imp-names'
import { STEPS_BEFORE_BRANCH, VALUE_SCALE } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import { rectContainsPoint, type Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

export type Speed
  = 'normal' | 'paused' | 'fast'

const speedMultipliers: Record<Speed, number> = {
  normal: 1,
  paused: 0.01,
  fast: 3,
}

export class PinballWizard {
  // sim for live toppling/rewind
  public activeSim!: Simulation // assigned in init
  public gui!: Gui // assigned in init

  public speed: Speed = 'normal'
  public selectedDiskIndex = -1

  public readonly camera = new Camera()

  constructor() {
    if (didConstruct) {
      throw new Error('PinballWizard constructed multiple times')
    }
    didConstruct = true
  }

  async init() {
    if (didInit) {
      throw new Error('PinballWizard initialized multiple times')
    }
    didInit = true

    const seeds = Lut.create('race-lut').tree[0]
    const commonStartSeed = seeds[0]

    this.activeSim = new Simulation(commonStartSeed)
    this.activeSim.branchSeed = seeds[1]

    this.gui = Gui.create('playing-gui')

    window.addEventListener('resize', () => this.onResize())
    this.onResize()
  }

  private _speedMult = 1 // real simulation speed
  update(dt: number) {
    const wasBranched = this.hasBranched

    const targetSpeed = speedMultipliers[this.speed]
    const delta = dt * 1e-3
    if (this._speedMult < targetSpeed) {
      this._speedMult = Math.min(targetSpeed, this._speedMult + delta)
    }
    if (this._speedMult > targetSpeed) {
      this._speedMult = Math.max(targetSpeed, this._speedMult - delta)
    }

    this.activeSim.update(dt * this._speedMult)

    if (this.hasBranched && !wasBranched) {
      // just branched
      this.onResize()
    }

    this.camera.update(dt, this)
    Graphics.drawOffset[1] = this.camera.drawOffset
    Graphics.drawSim(this.activeSim, this.selectedDiskIndex)

    // draw mouse pose
    Graphics.drawCursor(this.mousePos)

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

  private readonly mousePos: Vec2 = [0, 0]
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
    const simMouseX = mousePos[0] / drawSimScale * window.devicePixelRatio
    const simMouseY = mousePos[1] / drawSimScale * window.devicePixelRatio - drawOffset[1] / drawSimScale

    // add adjustment to simMouseY based on this.camera.pos

    // // debug, position obstacle on mouse
    // const obs = this.activeSim.obstacles.at(-1) as Obstacle
    // obs.pos[0] = simMouseX
    // obs.pos[1] = simMouseY

    // debug identify hovered room
    for (const [roomIndex, room] of this.activeSim.level.rooms.entries()) {
      const bounds = room.bounds
      if (rectContainsPoint(bounds, simMouseX, simMouseY)) {
        console.log(`hoevered room ${roomIndex}`)
      }
    }

    // this.gui.move(this, this.mousePos)

    return this.mousePos
  }

  private isMouseDown = false
  private dragY = 0
  down(rawPos: Vec2) {
    const _mousePos = this.move(rawPos)
    this.isMouseDown = true
    this.dragY = rawPos[1]
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
