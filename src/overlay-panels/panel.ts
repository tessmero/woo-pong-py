/**
 * @file panel.ts
 *
 * Base class for panels, containers that manage dedicated canvases
 * for certain gfx regions.
 */

import type { PinballWizard } from 'pinball-wizard'

export abstract class Panel {
  private readonly _cvs: HTMLCanvasElement

  constructor(
    canvasId: string,
  ) {
    this._cvs = ((typeof document === 'undefined')
      ? null
      : document.getElementById(canvasId)) as HTMLCanvasElement
  }

  protected abstract _hide(pw: PinballWizard)
  protected abstract _show(pw: PinballWizard)

  public setCanvasSize(w: number, h: number) {
    this._cvs.width = w
    this._cvs.height = h
  }

  public get isShowing() {
    return this._cvs.style.display !== 'none'
  }

  public show(pw: PinballWizard, skipResize = false) {
    // this._cvs.style.setProperty('display', 'block')
    this._show(pw)
    if (!skipResize) {
      pw.onResize()
    }
  }

  public hide(pw: PinballWizard, skipResize = false) {
    // this._cvs.style.setProperty('display', 'none')
    this._hide(pw)
    if (!skipResize) {
      pw.onResize()
    }
  }

  public toggle(pw: PinballWizard) {
    if (this.isShowing) {
      this.hide(pw)
    }
    else {
      this.show(pw)
    }
  }
}
