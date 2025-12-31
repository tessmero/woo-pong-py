/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { PinballWizardState } from 'pinball-wizard-state'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

const cvs = document.getElementById('sim-canvas') as HTMLCanvasElement
const ctx = cvs.getContext('2d') as CanvasRenderingContext2D

export class PinballWizard {
  public readonly state: PinballWizardState = new PinballWizardState()

  // sim for live toppling/rewind
  public readonly activeSim = new Simulation()

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

    function updateCvs() {
      cvs.width = cvs.clientWidth * window.devicePixelRatio
      cvs.height = cvs.clientHeight * window.devicePixelRatio
    }
    window.addEventListener('resize', () => updateCvs())
    updateCvs()
  }

  update(dt: number) {
    // if (this.state.isActive) {
    this.activeSim.update(dt)
    // }
    this.activeSim.draw(ctx, cvs.width, cvs.height)
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
}
