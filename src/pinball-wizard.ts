/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { Camera } from 'camera'
import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { topConfig } from 'configs/imp/top-config'
import { DISK_PATTERNS } from 'gfx/disk-gfx'
import { Graphics } from 'gfx/graphics'
import type { ElementId } from 'guis/gui'
import { Gui } from 'guis/gui'
import { toggleElement } from 'guis/gui-html-elements'
import { GUI } from 'imp-names'
import type { BreakoutRoom } from 'rooms/imp/breakout-room'
import { Scrollbar } from 'scrollbar'
import type { Speed } from 'simulation/constants'
import {
  BOBRICK_COUNT, DISK_COUNT, DISK_RADIUS, DISK_RADSQ,
  LOOK_AHEAD_STEPS,
  ROOM_COUNT,
  SPEEDS, STEPS_BEFORE_BRANCH, VALUE_SCALE,
} from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Rectangle } from 'util/math-util'
import { shuffle, type Vec2 } from 'util/math-util'

// can only be constructed once
let didConstruct = false
let didInit = false

export class PinballWizard {
  // sim for live toppling/rewind
  public activeSim!: Simulation // assigned in init
  public gui!: Gui // assigned in init

  public isTitleScreen = true
  public selectedDiskIndex = -1
  public currentRoomIndex = 0 // greatest room index that has had balls

  public readonly camera = new Camera()

  constructor() {
    if (didConstruct) {
      throw new Error('PinballWizard constructed multiple times')
    }
    didConstruct = true
  }

  private _speed: Speed = 'normal'
  public get speed() { return this._speed }
  public set speed(s: Speed) {
    if (this._isHalted) return
    this._speed = s
  }

  private isSeedConfiged = false
  private _race: Array<number> = []
  async init() {
    if (didInit) {
      throw new Error('PinballWizard initialized multiple times')
    }
    didInit = true

    const cfgSeed = topConfig.flatConfig.rngSeed
    this.isSeedConfiged = cfgSeed !== -1 // is seed set manually (used for puppeteer)

    const possibleRaces = Lut.create('race-lut').tree
    this._race = possibleRaces[Math.floor(Math.random() * possibleRaces.length)]
    const commonStartSeed = this.isSeedConfiged ? cfgSeed : this._race[0]

    shuffle(DISK_PATTERNS) // shuffle appearance of bouncing balls

    this.activeSim = new Simulation(commonStartSeed)
    if (!this.isSeedConfiged) {
      this.activeSim.branchSeed = this._race[1] // seed to insert later
    }

    const brickValuesStartIndex = 1 + DISK_COUNT
    const room = this.activeSim.level.rooms.find(room => 'breakoutBricks' in room) as BreakoutRoom
    if (room) {
      for (let i = 0; i < BOBRICK_COUNT; i++) {
        room.breakoutBricks[i].label = `${this._race[i + brickValuesStartIndex]}`
      }
    }

    this.gui = Gui.create('playing-gui')
    this.camera.jumpToRoom(this, 0)

    window.addEventListener('resize', () => this.onResize())
    this.onResize()
  }

  get isHalted() {
    return this._isHalted
  }

  private _speedMult = 1 // real simulation speed
  private _isHalted = false // near branch point iwth no selection
  update(dt: number) {
    const wasBranched = this.hasBranched
    const wasFinished = this.hasFinished

    // anticpiate halting needed soon
    if ((!this._isHalted)
      && (this.activeSim.stepCount >= (STEPS_BEFORE_BRANCH - LOOK_AHEAD_STEPS))
      && (this.selectedDiskIndex === -1)) {
      this._speed = 'paused'
      console.log('sim may need to halt soon, near branching time with no selection')

      if (this._speedMult === 0) {
        this._isHalted = true // real speed has reached 0 before emergency halt
        this.onResize()
      }
    }

    const targetSpeed = SPEEDS[this.speed]
    const delta = dt * topConfig.flatConfig.speedLerp
    if (this._speedMult < targetSpeed) {
      this._speedMult = Math.min(targetSpeed, this._speedMult + delta)
    }
    if (this._speedMult > targetSpeed) {
      this._speedMult = Math.max(targetSpeed, this._speedMult - delta)
    }

    // check if emergency halt should override speed
    if ((!this._isHalted)
      && (this.activeSim.stepCount >= (STEPS_BEFORE_BRANCH - 5))
      && (this.selectedDiskIndex === -1)) {
      // hit emergency halt somehow (maybe sim was too fast to stop in time)
      this._isHalted = true
      this._speedMult = 0
      this._speed = 'paused'
      this.onResize()
      // console.log('sim halted, near branching time with no selection')
    }

    const isBranchingAllowed = this.selectedDiskIndex !== -1
    this.activeSim.update(dt * this._speedMult, isBranchingAllowed)

    if (this.activeSim.winningDiskIndex !== -1) {
      // race finished
      this._speed = 'paused'
      this._isHalted = true
      this._speedMult = 0
    }

    if (this.hasBranched && !wasBranched) {
      // just branched
      this.onResize()
    }

    if (this.hasFinished && !wasFinished) {
      // just finished
      this.onResize()
    }

    this.camera.update(dt, this)
    Graphics.drawOffset[1] = this.camera.pos * Graphics.drawSimScale
      + Graphics.cvs.height / 2

    Graphics.drawSim(this)

    // // update simViewRect y-value
    // const { drawOffset, drawSimScale } = Graphics
    // this.simViewRect[1] = -drawOffset[1] / drawSimScale

    // always repaint scrollbar
    Scrollbar.isRepaintQueued = true

    // repaint scrollbar if necessary
    if (Scrollbar.isRepaintQueued) {
      Scrollbar.isRepaintQueued = false
      Scrollbar.repaint(this)
    }

    this.debugBranchCountdown(Graphics.ctx, Graphics.cvs.width, Graphics.cvs.height)

    // check if next room was reached
    const nextRoomIndex = this.currentRoomIndex + 1
    if (nextRoomIndex < ROOM_COUNT) {
      if (this.activeSim.maxBallY > this.activeSim.level.rooms[nextRoomIndex].bounds[1]) {
      // just reached new room
        this.currentRoomIndex = nextRoomIndex
        this.camera.jumpToRoom(this, this.currentRoomIndex)
      }
    }

    //
    this.gui.update(this, dt)
  }

  public get hasBranched() {
    return this.activeSim.stepCount >= STEPS_BEFORE_BRANCH
  }

  public get hasFinished() {
    return this.activeSim.winningDiskIndex !== -1
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
  public readonly simMousePos: Vec2 = [0, 0]
  public readonly simViewRect: Rectangle = [1, 1, 1, 1]
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

    // this.simViewRect[0] = drawOffset[0] / drawSimScale
    // this.simViewRect[1] = -drawOffset[1] / drawSimScale
    // if( this.activeSim )this.simViewRect[2] = this.activeSim.level.bounds[2]
    // this.simViewRect[3] = window.innerHeight / drawSimScale * window.devicePixelRatio

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

    if (!this.hasBranched) {
      for (const [diskIndex, disk] of this.activeSim.disks.entries()) {
        const [x, y] = disk.interpolatedPos
        const distSquared
          = Math.pow(this.simMousePos[0] - x, 2)
            + Math.pow(this.simMousePos[1] - y, 2)
        if (distSquared < DISK_RADSQ) {
          this.selectedDiskIndex = diskIndex

          if (this._isHalted) {
            this._speed = 'normal'
            this._isHalted = false
          }

          this.onResize()

          if (!this.isSeedConfiged)
            this.activeSim.branchSeed = this._race[diskIndex + 1]
        }
      }
    }
  }

  up(_rawPos: Vec2) {
    this.isMouseDown = false
    this.camera.endDrag()
  }

  public didBuildControls = false // set to true after first build

  public rebuildControls() {
    this.didBuildControls = true
    showControls(this, pinballWizardConfig.tree)
  }

  public onResize() {
    Graphics.onResize(this)

    // // update simViewRect width and height
    // const { drawOffset, drawSimScale } = Graphics
    // this.simViewRect[0] = drawOffset[0] / drawSimScale
    // this.simViewRect[1] = -drawOffset[1] / drawSimScale
    // if (this.activeSim) this.simViewRect[2] = this.activeSim.level.bounds[2]
    // this.simViewRect[3] = window.innerHeight / drawSimScale * window.devicePixelRatio

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
  }
}
