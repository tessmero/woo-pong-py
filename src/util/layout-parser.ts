/**
 * @file layout-parser.ts
 *
 * Compute rectangles relative to viewport, based on css rules.
 * Used to position flat elements and camera-locked meshes.
 */

import { setLayoutUtilMode } from 'guis/layout-util'
import { typedEntries } from './typed-entries'
import type { Rectangle } from './math-util'

export function parseLayoutRectangles(screenRect: Rectangle, css: CssLayout): ComputedRects {
  const glp = new GuiLayoutParser(screenRect, css)
  return glp._computedRects as ComputedRects
}

// input named rulesets
export type CssLayout<TLayoutKey extends string = string>
  = Readonly<Partial<Record<
    TLayoutKey, CssRuleset<TLayoutKey>
  >>>

// output named rectangles
export type ComputedRects = Readonly<Record<string, Rectangle>>

// A ruleset describing one rectangle
export type CssRuleset<TLayoutKey extends string = string> = Readonly<Partial<
  { [K in CssKey | `${CssKey}@${AtCond}`]: CssValue }
  & { [K in 'parent' | `parent@${AtCond}`]: TLayoutKey }
  & { children: CssLayout<string> }
>>

type BasicKey = 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'
type ConditionalKey = `min-${BasicKey}` | `max-${BasicKey}`
export type CssKey = BasicKey | ConditionalKey | 'margin'
export type AtCond
  = 'portrait' | 'landscape' // desktop
    | 'sm-portrait' | 'sm-landscape' // mobile
export type CssValue = number | `${number}%` | 'auto' | (() => number)

export class GuiLayoutParser<TLayoutKey extends string> {
  public readonly _computedRects: Partial<Record<TLayoutKey, Rectangle>> = {}

  public isPortrait = false
  public isLandscape = false
  public static isSmall = false
  private parent: Rectangle

  private _currentLayoutKey: string = ''
  private _childrenToParse: Record<string, CssLayout> = {}

  constructor(screenRect: Rectangle, css: CssLayout) {
    // pick orientation
    if (screenRect[2] > screenRect[3]) {
      this.isLandscape = true
    }
    else {
      this.isPortrait = true
    }

    // pick 'sm' (small window or mobile screen) vs desktop screen
    const pxThreshold = 600
    if ((screenRect[2] < pxThreshold || screenRect[3] < pxThreshold)) {
      GuiLayoutParser.isSmall = true
    }
    else {
      GuiLayoutParser.isSmall = false
    }
    // GuiLayoutParser.isSmall = false

    // pass config to layout-util
    setLayoutUtilMode(this)

    this.parent = screenRect
    for (const [key, rules] of Object.entries(css)) {
      this.parent = screenRect
      this._currentLayoutKey = key
      // this._computedRects[key] = this.floorRect(this.computeRect(rules as CssRuleset))
      this._computedRects[key] = this.computeRect(rules as CssRuleset)
      // const [x,y,w,h] = this.computeRect(rules as CssRuleset);

      // //@ts-expect-error
      // const pinballWizard = window.pinballWizard

      // const cvsWidth = pinballWizard.layeredViewport.canvas.width
      // const cvsPx = parseInt(pinballWizard.layeredViewport.canvas.style.width)
      // const dpr = window.devicePixelRatio
      // let scale = 1

      // this._computedRects[key]  = [
      //   (x * scale ),
      //   (y * scale ),
      //   w * scale, h * scale,
      // ]
    }

    // parse any sub-layouts defined in 'children' properties
    const toParse = this._childrenToParse
    while (Object.keys(toParse).length > 0) {
      const parentKey = Object.keys(toParse)[0]
      const subLayout = toParse[parentKey]
      delete toParse[parentKey]
      const parentRect = this._computedRects[parentKey]
      const { _computedRects: subRects } = new GuiLayoutParser(parentRect, subLayout)
      for (const subKey in subRects) {
        this._computedRects[`${parentKey}.${subKey}`] = subRects[subKey]
      }
    }
  }

  // private floorRect(rect: Rectangle): Rectangle {
  //   return [
  //     Math.floor(rect[0]),
  //     Math.floor(rect[1]),
  //     Math.floor(rect[2]),
  //     Math.floor(rect[3]),
  //   ]
  // }

  private computeRect(css: CssRuleset): Rectangle {
    let rect: Rectangle = [...this.parent]

    for (const [cssKey, cssVal] of typedEntries(css)) {
      if (cssKey === 'parent') {
        if (!(cssVal in this._computedRects)) {
          throw new Error(`layout parent '${cssVal}' not defined by any previous rulesets`)
        }
        this.parent = this._computedRects[cssVal] as Rectangle
        rect = [...this.parent]
      }
      else if (cssKey.startsWith('parent@')) {
        const [_prefix, suffix] = cssKey.split('@')
        if ((typeof (cssVal) !== 'string') || !(cssVal in this._computedRects)) {
          throw new Error(`layout parent '${cssVal}' not defined by any previous rulesets`)
        }
        if (suffix === 'portrait') {
          if (this.isPortrait) {
            this.parent = this._computedRects[cssVal] as Rectangle
            rect = [...this.parent]
          }
        }
        else if (suffix === 'landscape') {
          if (this.isLandscape) {
            this.parent = this._computedRects[cssVal] as Rectangle
            rect = [...this.parent]
          }
        }
        else if (suffix === 'sm-portrait') {
          if (this.isPortrait && GuiLayoutParser.isSmall) {
            this.parent = this._computedRects[cssVal] as Rectangle
            rect = [...this.parent]
          }
        }
        else if (suffix === 'sm-landscape') {
          if (this.isLandscape && GuiLayoutParser.isSmall) {
            this.parent = this._computedRects[cssVal] as Rectangle
            rect = [...this.parent]
          }
        }
        else {
          throw new Error(`invalid @ condition suffix: '${suffix}'. expected portait or landscape.`)
        }
      }
      else if (cssKey === 'children') {
        this._childrenToParse[this._currentLayoutKey] = cssVal as CssLayout
      }
      else {
        // Standard CSS rule application
        if (cssKey.includes('@')) {
          const [prefix, suffix] = cssKey.split('@')
          if (suffix === 'portrait') {
            if (this.isPortrait) {
              rect = this.applyRule(rect, prefix as CssKey, cssVal as CssValue)
            }
          }
          else if (suffix === 'landscape') {
            if (this.isLandscape) {
              rect = this.applyRule(rect, prefix as CssKey, cssVal as CssValue)
            }
          }
          else if (suffix === 'sm-portrait') {
            if (this.isPortrait && GuiLayoutParser.isSmall) {
              rect = this.applyRule(rect, prefix as CssKey, cssVal as CssValue)
            }
          }
          else if (suffix === 'sm-landscape') {
            if (this.isLandscape && GuiLayoutParser.isSmall) {
              rect = this.applyRule(rect, prefix as CssKey, cssVal as CssValue)
            }
          }
          else {
            throw new Error(`invalid @ condition suffix: '${suffix}'. expected portait or landscape.`)
          }
        }
        else {
          // csskey has no @ condition
          rect = this.applyRule(rect, cssKey as CssKey, cssVal as CssValue)
        }
      }
    }

    return [rect[0], rect[1], rect[2], rect[3]]
  }

  private applyRule(
    rect: Rectangle,
    cssKey: CssKey,
    cssVal: CssValue,
  ): Rectangle {
    const [x, y, w, h] = rect
    const [px, py, pw, ph] = this.parent

    const parseVal = (key: string, value: CssValue): number => {
      if (typeof value === 'function') {
        value = value() // call function and get numeric value
      }
      if (typeof value === 'string' && value.endsWith('%')) {
        const pct = parseFloat(value) / 100
        return ['left', 'right', 'width', 'margin'].includes(key) ? pw * pct : ph * pct
      }
      else if (value === 'auto') {
        if (key === 'width') return px + pw - x
        if (key === 'height') return py + ph - y
        return ['left', 'right'].includes(key) ? (pw - w) / 2 : (ph - h) / 2
      }
      else if (typeof value === 'number' && value < 0) {
        if (key === 'width') return pw + value
        if (key === 'height') return ph + value
      }
      return Number(value)
    }

    // // Check for min- or max- prefixes
    const conditionDashKey = cssKey.split('-')
    if (conditionDashKey.length === 2) {
      const [cnd, key] = conditionDashKey
      let limiter: (a: number, b: number) => number

      if (cnd === 'min') {
        limiter = Math.max
      }
      else if (cnd === 'max') {
        limiter = Math.min
      }
      else {
        throw new Error('only min- or max- prefixed allowed')
      }

      if (key === 'width') {
        return [x, y, limiter(w, parseVal('width', cssVal)), h]
      }
      else if (key === 'height') {
        return [x, y, w, limiter(h, parseVal('height', cssVal))]
      }
      else if (key === 'left') {
        return [limiter(x, parseVal('left', cssVal)), y, w, h]
      }
      else {
        throw new Error('only min/max-width, -height, or -left allowed')
      }
    }

    // Handle basic keys and margin
    switch (cssKey) {
      case 'left': return [px + parseVal('left', cssVal), y, w, h]
      case 'right': return [px + pw - w - parseVal('right', cssVal), y, w, h]
      case 'top': return [x, py + parseVal('top', cssVal), w, h]
      case 'bottom': return [x, py + ph - h - parseVal('bottom', cssVal), w, h]
      case 'width': return [x, y, parseVal('width', cssVal), h]
      case 'height': return [x, y, w, parseVal('height', cssVal)]
      case 'margin': {
        const d = parseVal('margin', cssVal)
        return [x + d, y + d, w - 2 * d, h - 2 * d]
      }
      default: return rect
    }
  }
}
