/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { topConfig } from 'configs/imp/top-config'
import { Graphics } from 'gfx/graphics'
import type { ElementId } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import { GUI } from 'imp-names'
import { STEPS_BEFORE_BRANCH } from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

export class PinballWizard {
  // sim for live toppling/rewind
  public activeSim!: Simulation // assigned in init
  public gui!: Gui // assigned in init

  public isPaused = false
  public selectedDiskIndex = -1

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

  update(dt: number) {
    if (!this.isPaused) {
      const wasBranched = this.hasBranched

      this.activeSim.update(dt)

      if (this.hasBranched && !wasBranched) {
        // just branched
        this.onResize()
      }
    }

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
      const y = mousePos[1]
      const delta = y - this.dragY
      Graphics.drawOffset[1] += delta * window.devicePixelRatio
      this.dragY = y
    }

    // idleCountdown = IDLE_DELAY
    const { drawOffset, drawScale } = Graphics

    this.mousePos[0] = (mousePos[0] - drawOffset[0]) / drawScale
    this.mousePos[1] = (mousePos[1] - drawOffset[1]) / drawScale

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
  }

  scroll(delta: number) {
    const { scrollSpeed } = topConfig.flatConfig
    Graphics.drawOffset[1] += delta * scrollSpeed
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
