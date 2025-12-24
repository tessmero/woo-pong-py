/**
 * @file pinball-wizard-state.ts
 *
 * Manages simple high-level game state properties.
 */

export type ActiveMode
  = 'active' // regular gameplay, player removed one block and tower is toppling with live physics
    | 'rewind' // player clicked reset and tower is un-toppling
    | 'hideLevel' // player clicked next level (first phase)
    | 'showLevel' // player clicked next level (second phase)

export class PinballWizardState {
  isActive: boolean = false
  activeTime: number = 0

  isToppled: boolean = false // level solved
  isFailed: boolean = false // level failed

  startLevel() {
    this.isActive = false
    this.isToppled = false
    this.activeTime = 0
  }

  startActive() {
    this.isActive = true
    this.activeTime = 0
    this.isToppled = false
    this.isFailed = false
  }
}
