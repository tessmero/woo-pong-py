/**
 * @file pinball-wizard.ts
 *
 * Main object constructed once in main.ts.
 */

import { setSimAudibleRect } from 'audio/collision-sounds'
import { ballSelectionPanel } from 'overlay-panels/ball-selection-panel'
import { Camera } from 'camera'
import { pinballWizardConfig } from 'configs/imp/pinball-wizard-config'
import { isDevMode, topConfig } from 'configs/imp/top-config'
import { GfxRegion } from 'gfx/regions/gfx-region'
import { Graphics } from 'gfx/graphics'
import type { GfxRegionName } from 'imp-names'
import { SHUFFLED_PATTERN_NAMES } from 'imp-names'
import type { Speed } from 'simulation/constants'
import {
  HALT_LOOK_AHEAD_STEPS,
  HISTORY_CHECKPOINT_STEPS,
  INT32_MAX,
  ROOM_COUNT,
  SPEEDS, STEPS_BEFORE_BRANCH,
} from 'simulation/constants'
import { Lut } from 'simulation/luts/lut'
import { Simulation } from 'simulation/simulation'
import { showControls } from 'util/debug-controls'
import type { Rectangle } from 'util/math-util'
import { lerp, rectContainsPoint, shuffle, type Vec2 } from 'util/math-util'
import { shortVibrate } from 'util/vibrate'
import type { SimGfx } from 'gfx/regions/imp/sim-gfx'
import type { GlassGfx } from 'gfx/regions/imp/glass-gfx'
import { settingsPanel } from 'overlay-panels/settings-panel'
import { Serializer } from 'simulation/serializer'
// import { SIM_HASHES } from 'set-by-build'

// can only be constructed once
let didConstruct = false
let didInit = false

export type SpeedAnim = {
  startTime: number
  endTime: number
  startSpeed: number
  // end speed number is inferred from "speed" property
}

export type InputId = 'mouse' | number

export type GameState = 'loading' | 'title-screen' | 'second-title-screen' | 'playing' | 'home'

export class PinballWizard {
  public activeSim!: Simulation // assigned in init -> reset

  public loadingState: string | null = 'A'
  public gameState: GameState = 'loading'
  // public isTitleScreen = true
  // public isSecondTitleScreen = false
  // public isHomeScreen = false

  public get selectedDiskIndex() {
    return this.activeSim?.selectedDiskIndex ?? -1
  }

  public set selectedDiskIndex(i: number) {
    if (!this.activeSim) return
    this.activeSim.selectedDiskIndex = i
  }

  public followDiskIndex = -1
  public currentRoomIndex = 0 // greatest room index that has had balls

  public camera = new Camera()

  constructor() {
    if (didConstruct) {
      throw new Error('PinballWizard constructed multiple times')
    }
    didConstruct = true
  }

  public rewindToStep(stepCount: number) {
    // round down to nearest checkpoint
    stepCount = HISTORY_CHECKPOINT_STEPS * Math.floor(stepCount / HISTORY_CHECKPOINT_STEPS)

    if (stepCount > this.activeSim._maxStepCount) {
      // cannot go to future
      return
    }

    const i = Math.floor(stepCount / HISTORY_CHECKPOINT_STEPS)
    Serializer.restore(this.activeSim, i)
    // while (this.activeSim._stepCount < stepCount) {
    //   step(this.activeSim)
    // }
  }

  // rough target speed setting
  private _speed: Speed = 'normal'
  public get speed() { return this._speed }
  public set speed(s: Speed) {
    if (this._isHalted && s !== 'paused') {
      shortVibrate(this)

      // user tried to advance, but must select a ball first
      const gfx = GfxRegion.create('sim-gfx') as SimGfx
      gfx.startFlashing()
      return
    }

    if (this._speed === s) {
      return
    }

    shortVibrate(this)

    this._speed = s
    const targetMult = SPEEDS[s]
    if (this._speedMult === targetMult) {
      this._speedAnim = null // already at target speed
    }
    else {
      // start transition to target speed
      this._speedAnim = {
        startTime: performance.now(),
        endTime: performance.now() + topConfig.flatConfig.speedAnimDur,
        startSpeed: this._speedMult,
      }
    }
  }

  private isSeedConfiged = false
  private _raceIndex: number = 0
  async init() {
    if (didInit) {
      throw new Error('PinballWizard initialized multiple times')
    }
    didInit = true

    window.addEventListener('resize', () => this.onResize())
    this.reset()
  }

  reset() {
    settingsPanel.hide(this, true)
    ballSelectionPanel.hide(this, true)

    this.selectedDiskIndex = -1
    this.followDiskIndex = -1
    this.currentRoomIndex = 0 // greatest room index that has had balls
    this.camera = new Camera()
    this._isHalted = false
    this._speedMult = SPEEDS.normal
    this._speed = 'normal'
    this._speedBeforeHalt = 'normal'

    if (this.gameState === 'home') {
      this._resetHome()
    }
    else {
      this._resetPlaying()
    }

    this.camera.jumpToRoom(this, 0)
    this.onResize()
  }

  private _resetHome() {
    const homeSeed = 1234
    this.activeSim = new Simulation(homeSeed, true)
    this.activeSim.t = 0
    this.activeSim._stepCount = 0
  }

  private _resetPlaying() {
    const cfgSeed = topConfig.flatConfig.rngSeed
    this.isSeedConfiged = cfgSeed !== -1 // is seed set manually (used for puppeteer)

    const raceLut = Lut.create('race-lut')
    const raceCount = raceLut.detail[0]
    this._raceIndex = Math.floor(Math.random() * raceCount)
    const startSeed = raceLut.get(this._raceIndex, 'startSeed')
    // this._race = [startSeed]
    // for (let d = 0; d < DISK_COUNT; d++) {
    //   this._race.push(raceLut.get(raceIndex, `d${d}_midSeed`))
    //   this._race.push(raceLut.get(raceIndex, `d${d}_finalStepCount`))
    // }
    // console.log('decoded race', this._race)
    const commonStartSeed = this.isSeedConfiged ? cfgSeed : startSeed

    shuffle(SHUFFLED_PATTERN_NAMES) // shuffle appearance of bouncing balls

    this.activeSim = new Simulation(commonStartSeed)

    // // skip throwing animation in dev mode
    // if (isDevMode) {
    //   this.activeSim.t = 0
    //   this.activeSim._stepCount = 0
    // }

    if (!this.isSeedConfiged) {
      this.activeSim.branchSeed = 29137 // seed to insert later
      this.activeSim.finalStepCount = INT32_MAX

      // // attach build-time determinism hashes if seeds match
      // if (SIM_HASHES
      //   && SIM_HASHES.startSeed === commonStartSeed
      //   && SIM_HASHES.branchSeed === 29137
      // ) {
      //   console.log('attached build-time hashes')
      //   this.activeSim.expectedHashes = SIM_HASHES.hashes
      // }
    }
  }

  get isHalted() {
    return this._isHalted
  }

  private _speedMult = SPEEDS.normal // real simulation speed
  private _speedAnim: SpeedAnim | null = null // ongoing transition to target speed
  private _isHalted = false // near branch point iwth no selection
  private _speedBeforeHalt: Speed = 'normal'

  update(dt: number) {
    // check if mouse has moved since last update
    if (!this._hasMoved) {
      // emulate mouse move
      this.move(this._lastRawPos, this._lastInputId)
      // this.move([-100,-100],'mouse')
      // this.hoveredDiskIndex = -1
      // console.log('mouse was emulated')
    }
    else {
      // console.log('mouse was really moved')
    }
    this._hasMoved = false

    Graphics.updateBspAnim(dt)
    Graphics.updateStgAnim(dt);
    (GfxRegion.create('glass-gfx') as GlassGfx).update(this, dt)
    const wasBranched = this.hasBranched
    const wasFinished = this.hasFinished

    // anticipate halting needed soon
    if ((!this._isHalted)
      && (this.activeSim.stepCount >= (STEPS_BEFORE_BRANCH - HALT_LOOK_AHEAD_STEPS))
      && (this.selectedDiskIndex === -1)) {
      if (this._speed !== 'paused') {
        this._speedBeforeHalt = this._speed
        this.speed = 'paused'
      }

      settingsPanel.hide(this)
      ballSelectionPanel.show(this)

      // console.log('sim may need to halt soon, near branching time with no selection')

      if (this._speedMult === 0) {
        this._isHalted = true // real speed has reached 0 before emergency halt
        // this.onResize()
      }
    }

    if (this._speedAnim) {
      const { startSpeed, startTime, endTime } = this._speedAnim
      const t = performance.now()
      const frac = (t - startTime) / (endTime - startTime)
      if (frac >= 1) {
        // animation finished
        this._speedMult = SPEEDS[this._speed]
        this._speedAnim = null
      }
      else {
        this._speedMult = lerp(startSpeed, SPEEDS[this._speed], frac)
      }
    }

    // check if emergency halt should override speed
    if ((!this._isHalted)
      && (this.activeSim.stepCount >= (STEPS_BEFORE_BRANCH - 5))
      && (this.selectedDiskIndex === -1)) {
      // hit emergency halt somehow (maybe sim was too fast to stop in time)
      if (this._speed !== 'paused') {
        this._speedBeforeHalt = this._speed
      }
      this._isHalted = true
      this._speedMult = 0
      this._speed = 'paused'
      this._speedAnim = null

      settingsPanel.hide(this)
      ballSelectionPanel.show(this)
      // this.onResize()
      // console.log('sim halted, near branching time with no selection')
    }

    const isBranchingAllowed = this.selectedDiskIndex !== -1

    setSimAudibleRect(this.simViewRect) // update reiogn in sim where sounds are audible

    // advance physics, append to sim-history, set display positions, play sounds
    this.activeSim.update(dt * this._speedMult, isBranchingAllowed)

    if (this.hasBranched && !wasBranched) {
      // just branched
      // this.onResize()
      // ballSelectionPanel.hide(this)
    }

    if (this.hasFinished && !wasFinished) {
      // console.log('finished with final step count', this.activeSim.stepCount)
      // just finished
      // ballSelectionPanel.hide(this)
      this.onResize()
      // Graphics.targetPixelAnim = 1
    }

    this.camera.update(dt, this)

    Graphics.draw(this)

    // this.debugBranchCountdown(Graphics.ctx, Graphics.cvs.width, Graphics.cvs.height)

    // jump to room with selected ball
    if (this.followDiskIndex !== -1) {
      if (this.camera.isIdle) {
        const pos = this.activeSim.disks[this.followDiskIndex].displayPos
        const roomIndex = this.activeSim.level.rooms.findIndex(
          room => rectContainsPoint(room.bounds, ...pos),
        )
        if (roomIndex !== -1) {
          this.camera.jumpToRoom(this, roomIndex)
        }
      }
    }
    else {
      // no disk selected
    // check if next room was reached
      const nextRoomIndex = this.currentRoomIndex + 1
      if (nextRoomIndex < ROOM_COUNT) {
        if (this.activeSim.maxBallY > this.activeSim.level.rooms[nextRoomIndex].bounds[1]) {
          // just reached new room
          this.currentRoomIndex = nextRoomIndex
          this.camera.jumpToRoom(this, this.currentRoomIndex)
        }
      }
    }
  }

  public get hasBranched() {
    return this.activeSim._maxStepCount >= STEPS_BEFORE_BRANCH
  }

  public get hasFinished() {
    return this.activeSim.winningDiskIndex !== -1
  }

  public readonly mousePos: Vec2 = [0, 0]
  public readonly simMousePos: Vec2 = [0, 0]
  public readonly simViewRect: Rectangle = [1, 1, 1, 1]
  public hoveredDiskIndex = -1

  private _hasMoved = false
  private _lastRawPos: Vec2 = [0, 0]
  private _lastInputId: InputId = -1
  move(rawPos: Vec2, inputId: InputId): Vec2 {
    this._hasMoved = true
    this._lastRawPos = rawPos
    this._lastInputId = inputId
    for (const [name, rect] of Object.entries(Graphics.regions)) {
      const gfx = GfxRegion.create(name as GfxRegionName)
      if (gfx.shouldDraw(this) && rectContainsPoint(rect, ...rawPos)) {
        gfx.move(this, rawPos, inputId)
      }
      else {
        gfx.leave(this, rawPos, inputId)
      }
    }
    return this.mousePos
  }

  public draggingId: InputId | null = null
  public get isMouseDown() {
    return this.draggingId !== null
  }

  public dragY = 0

  down(rawPos: Vec2, inputId: InputId) {
    const _mousePos = this.move(rawPos, inputId)

    // for (const [name, rect] of Object.entries(Graphics.regions)) {
    for (const name of Graphics.revRegionNames) {
      const rect = Graphics.regions[name] as Rectangle
      if (rectContainsPoint(rect, ...rawPos)) {
        const gfx = GfxRegion.create(name as GfxRegionName)
        const isConsumed = gfx.down(this, rawPos, inputId)
        if (isConsumed) break
      }
    }
    // this.isMouseDown = true
    // this.dragY = rawPos[1]
    // this.trySelectDisk(this.hoveredDiskIndex)
    // Graphics.cvs.style.setProperty('cursor', 'default')
  }

  up(rawPos: Vec2, inputId: InputId) {
    for (const [name, _rect] of Object.entries(Graphics.regions)) {
      // if (rectContainsPoint(rect, ...rawPos)) {
      const gfx = GfxRegion.create(name as GfxRegionName)
      gfx.up(this, rawPos, inputId)
      // }
    }
  }

  private _tryFollowdisk(diskIndex: number) {
    if (this.hasBranched && this.followDiskIndex === diskIndex) {
      this.followDiskIndex = -1 // deselect
    }
    else {
      this.followDiskIndex = diskIndex
    }
  }

  trySelectDisk(diskIndex: number) {
    if (diskIndex === -1) return
    if (this.hasBranched) {
      this._tryFollowdisk(diskIndex)
      shortVibrate(this)
      return
    }

    this.selectedDiskIndex = diskIndex
    this._tryFollowdisk(diskIndex)
    shortVibrate(this)

    if (this._isHalted) {
      this._isHalted = false
      this.speed = this._speedBeforeHalt

      ballSelectionPanel.hide(this)
    }

    // this.onResize()

    if (!this.isSeedConfiged) {
      const raceLut = Lut.create('race-lut')
      this.activeSim.branchSeed = raceLut.get(this._raceIndex, `d${diskIndex}_midSeed`)
      this.activeSim.finalStepCount = raceLut.get(this._raceIndex, `d${diskIndex}_finalStepCount`)

      // console.log('planned branch seed', this.activeSim.branchSeed)
      // console.log('set finalStepCount', this.activeSim.finalStepCount)
    }
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
  }
}
