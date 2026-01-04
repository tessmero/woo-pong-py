/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import type { ElementId } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import { GUI } from 'imp-names'
import { STEPS_BEFORE_BRANCH } from 'simulation/constants'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

const cvs = document.getElementById('sim-canvas') as HTMLCanvasElement
const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

export class PinballWizard {
  // sim for live toppling/rewind
  public readonly activeSim = new Simulation()

  public gui!: Gui // assigned in init

  public isPaused = false

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

    this.gui = Gui.create('playing-gui')

    window.addEventListener('resize', () => this.onResize())
    this.onResize()
  }

  update(dt: number) {
    if (!this.isPaused) {
      this.activeSim.update(dt)
    }
    this.activeSim.draw(ctx, cvs.width, cvs.height)

    this.debugBranchCountdown(ctx, cvs.width, cvs.height)
  }

  private debugBranchCountdown(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const thickness = 100
    const progress = Math.min(1, this.activeSim.stepCount / STEPS_BEFORE_BRANCH)

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, w, thickness)

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, w * progress, thickness)
  }

  public drawOffset: Vec2 = [0, 0] // set in draw
  public drawScale: number = 1 // set in draw
  private readonly mousePos: Vec2 = [0, 0]
  move(mousePos: Vec2): Vec2 {
    // idleCountdown = IDLE_DELAY

    this.mousePos[0] = (mousePos[0] - this.drawOffset[0]) / this.drawScale
    this.mousePos[1] = (mousePos[1] - this.drawOffset[1]) / this.drawScale

    // this.gui.move(this, this.mousePos)

    return this.mousePos
  }

  private isMouseDown = false
  down(rawPos: Vec2) {
    const _mousePos = this.move(rawPos)
    this.isMouseDown = true

    // this.gui.down(this, mousePos)

    // const { selectedBoxIndex, hoveredBoxIndex } = this.graphics.boxes
    // console.log('tt down(): ', selectedBoxIndex, hoveredBoxIndex)
  }

  up(_mousePos: Vec2) {
    this.isMouseDown = false
  }

  public didBuildControls = false // set to true after first build

  public rebuildControls() {
    this.didBuildControls = true
    showControls(this, pinballWizardConfig.tree)
  }

  public onResize() {
    cvs.width = cvs.clientWidth * window.devicePixelRatio
    cvs.height = cvs.clientHeight * window.devicePixelRatio

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
