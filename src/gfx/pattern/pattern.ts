/**
 * @file pattern.ts
 *
 * Base class and registry for disk-filler patterns.
 */

import type { PatternName } from 'imp-names'
import { buildFillStyle } from './pattern-util'

type Registered = () => Pattern
type FillStyle = string | CanvasPattern

export abstract class Pattern {
  readonly name: PatternName = '' as PatternName // assigned when registered

  protected getFillStyle(cvs: HTMLCanvasElement | null): string | CanvasPattern {
    return buildFillStyle(this.name, cvs)
  }

  public getScale() {
    return 1
  }

  // should be overriden for non-solid patterns
  protected getCanvas(): HTMLCanvasElement | null {
    return null
  }

  // static registry pattern
  protected constructor() {}
  static _registry: Partial<Record<PatternName, Registered>> = {}
  static _singletons: Partial<Record<PatternName, Pattern>> = {}
  static _canvases: Partial<Record<PatternName, null | HTMLCanvasElement>> = {}
  static _fillStyles: Partial<Record<PatternName, FillStyle>> = {}

  static register(name: PatternName, reg: Registered): void {
    if (name in this._registry) {
      throw new Error(`pattern already registered: '${name}'`)
    }
    this._registry[name] = reg
    const pattern = reg()

    // @ts-expect-error assign registered name
    pattern.name = name

    const cvs = pattern.getCanvas()

    this._singletons[name] = pattern
    this._canvases[name] = cvs
    this._fillStyles[name] = pattern.getFillStyle(cvs)
  }

  static create(name: PatternName): Pattern {
    if (!Object.hasOwn(this._singletons, name)) {
      throw new Error(`singleton Pattern not registered: ${name}`)
    }
    return this._singletons[name] as Pattern
  }

  static getCanvas(name: PatternName): null | HTMLCanvasElement {
    if (!Object.hasOwn(this._canvases, name)) {
      throw new Error(`singleton Pattern not registered: ${name}`)
    }
    return this._canvases[name] as null | HTMLCanvasElement
  }

  static getFillStyle(name: PatternName): FillStyle {
    if (!Object.hasOwn(this._fillStyles, name)) {
      throw new Error(`singleton Pattern not registered: ${name}`)
    }
    return this._fillStyles[name] as FillStyle
  }
}
