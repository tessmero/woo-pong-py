/**
 * @file gui.ts
 *
 * Object that keeps track of layout and hovered/clicked state for some elements.
 * Hover, click, and unclick methods are called in mouse-touch-input.
 */

import type { Rectangle, Vec2 } from 'util/math-util'
import { parseLayoutRectangles, type ComputedRects, type CssLayout } from 'util/layout-parser'
import type { GuiName } from 'imp-names'
import type { PinballWizard } from 'pinball-wizard'
import { buildHtmlElement, updateElement } from './gui-html-elements'
import type { IconName } from 'gfx/button-icons'

// export function setMouseCursor(cursor: 'pointer' | 'default') {
//   document.documentElement.style.cursor = cursor; // set displayed cursor
//   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   // TestSupport // support automated report on tessmero.github.io
//   (window as any).mouseCursorTestSupport = cursor // eslint-disable-line @typescript-eslint/no-explicit-any
//   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// }

export type GuiElement<TLayoutKey extends string = string> = {
  layoutKey: TLayoutKey // must have layout rectangle
  display: ElementDisplayParams
  click?: (event: ElementClickEvent) => void

  down?: (event: ElementDownEvent) => void
  up?: (event: ElementUpEvent) => void
  move?: (event: ElementMoveEvent) => void
  leave?: (event: ElementUpEvent) => void

  id?: ElementId // unique id, assigned when gui is registered
  htmlElem?: HTMLElement // assigned when gui is registered
  rectangle?: Rectangle // px, assigned when rendered on screen
  dprRectangle?: Rectangle // device pixels, assigned when rendered on screen

  hotkeys?: Array<string>
}

// event passed to clickAction and other callbacks
export type ElementClickEvent = {
  // mouse/touch/key
  elementId: ElementId
  pinballWizard: PinballWizard
  pointerEvent?: PointerEvent
  // buttonCode?: KeyCode // only for keyboard
  // inputEvent?: ProcessedSubEvent // only for mouse/touch
}
export type ElementDownEvent = {
  // mouse/touch/key
  elementId: ElementId
  pinballWizard: PinballWizard
  pointerEvent: PointerEvent
  // buttonCode?: KeyCode // only for keyboard
}
export type ElementUpEvent = {
  // mouse/touch/key
  elementId: ElementId
  pinballWizard: PinballWizard
  pointerEvent: PointerEvent
  // buttonCode?: KeyCode // only for keyboard
}

export type ElementMoveEvent = {
  elementId: ElementId
  pinballWizard: PinballWizard
  pointerEvent: PointerEvent
}

// display settings for an element
export type ElementDisplayParams = {

  readonly type: 'button' | 'panel' | 'diagram' | 'transparent'
  readonly draw?: (ctx: CanvasRenderingContext2D, pinballWizard: PinballWizard, rect: Rectangle) => void
  label?: string
  icon?: IconName
  styles?: Record<string, string> // styles to add to html element
  classes?: Array<string> // classes to add to html element
  textAlign?: 'center' | 'left'

  hideUntil?: Array<string> // checklist entry ID to complete before displaying
  hideAfter?: string // hide after this checklist entry is completed
}

const allHtmlElems: Record<ElementId, HTMLElement> = {}

// element uid
export type ElementId = `_${number}` // not parse-able as number
let nextElementId = 0

export abstract class Gui<TLayoutKey extends string = string> {
  public guiLayout?: CssLayout // rules for computing rectangles
  public layoutRectangles: ComputedRects = {}

  public elements: Record<ElementId, GuiElement<TLayoutKey>> = {}

  abstract update(pinballWizard: PinballWizard, dt: number)
  abstract move(pinballWizard: PinballWizard, mousePos: Vec2)
  abstract down(pinballWizard: PinballWizard, mousePos: Vec2)
  abstract showHideElements(pinballWizard: PinballWizard)

  // assigned in create -> init
  private layoutFactory!: (context: PinballWizard) => CssLayout

  // called in create
  init(
    pinballWizard: PinballWizard,
    layoutFactory: (context: PinballWizard) => CssLayout,
    elements: ReadonlyArray<GuiElement<TLayoutKey>>,
  ) {
    this.layoutFactory = layoutFactory
    for (const elem of elements) {
      if (typeof elem.id === 'string') {
        // use existing id and html element
        this.elements[elem.id] = elem
      }
      else {
        // build new id and html element
        const elementId: ElementId = `_${nextElementId++}` // shouldn't be parse-able as number
        this.elements[elementId] = elem
        const htmlElem = buildHtmlElement(elementId, elem)

        htmlElem.onclick = (pointerEvent) => {
          pointerEvent.preventDefault()
          if (elem.click) {
            // playSound('buttonClick')
            elem.click({ elementId, pinballWizard, pointerEvent })
          }
          // htmlElem.blur()
        }

        htmlElem.onpointerdown = (pointerEvent) => {
          // console.log('drag start')
          pointerEvent.preventDefault()
          if (elem.down) {
            elem.down({ elementId, pinballWizard, pointerEvent })
          }
        }

        htmlElem.onpointermove = (pointerEvent) => {
          pointerEvent.preventDefault()
          if (elem.move) {
            elem.move({ elementId, pinballWizard, pointerEvent })
          }
        }

        htmlElem.onpointerup = (pointerEvent) => {
          pointerEvent.preventDefault()
          if (elem.up) {
            elem.up({ elementId, pinballWizard, pointerEvent })
          }
        }

        // htmlElem.onpointerleave = (pointerEvent) => {
        //   pointerEvent.preventDefault()
        //   if (elem.leave) {
        //     elem.leave({ elementId, pinballWizard, pointerEvent })
        //   }
        // }

        htmlElem.style.display = 'none'
        document.body.appendChild(htmlElem)
        allHtmlElems[elementId] = htmlElem
        elem.id = elementId
      }
    }
  }

  // recompute gui element rectangles based on css layout
  public refreshLayout(context: PinballWizard): void {
    const pxScreenRectangle: Rectangle = [0, 0, window.innerWidth, window.innerHeight]

    this.guiLayout = this.layoutFactory(context)

    this.layoutRectangles = parseLayoutRectangles(pxScreenRectangle, this.guiLayout)

    for (const id in this.elements) {
      const elem = this.elements[id] as GuiElement
      const rect = this.layoutRectangles[elem.layoutKey]
      elem.rectangle = rect
      if (elem.rectangle) {
        elem.dprRectangle = elem.rectangle.map(v => v * window.devicePixelRatio) as Rectangle
      }

      // align or hide html element
      // console.log('update element ')

      updateElement(allHtmlElems[id], elem, rect)
    }
    // console.log(`parsed gui layout for game
    //       screen: ${JSON.stringify(screen)}
    //       ${JSON.stringify(this.layoutRectangles)}`)
  }

  // private _click(event: ElementEvent, elementId: ElementId) {
  //   const elem = this.elements[elementId]
  //   this.clickElem(elem, event)
  // }

  public keydown(pinballWizard: PinballWizard, buttonCode: string): boolean {
    for (const id in this.elements) {
      const elem = this.elements[id] as GuiElement
      const { click, hotkeys } = elem
      if (click && hotkeys?.includes(buttonCode)) {
        // playSound('buttonClick')
        click({
          elementId: id as ElementId,
          pinballWizard: pinballWizard,
        })
        return true // consume event
      }
    }
    return false // do not consume event
  }

  // static registry pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _registry: Record <GuiName, RegisteredGui<string>> = {} as any
  static _preloaded: Partial<Record <GuiName, Gui<string>>> = {}

  protected constructor() {}

  static register<TLayoutKey extends string>(name: GuiName, rg: RegisteredGui<TLayoutKey>): void {
    if (name in this._registry) {
      throw new Error(`Game already registered: '${name}'`)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this._registry as any)[name] = rg
  }

  static preload(pinballWizard: PinballWizard, name: GuiName) {
    const registered = this._registry[name]
    if (!registered) {
      throw new Error(`gui ${name} not registered `)
    }
    const { factory, layoutFactory, elements } = registered

    // Guis are singletons
    // one-time construction
    const instance = factory()
    this._preloaded[name] = instance

    // Gui
    // post-construction setup
    instance.init(pinballWizard, layoutFactory, elements)

    // // // preload all element imagesets
    // const layouts = allLayouts || [layoutFactory(context)]
    // const elementDims = getElementDims(elements, layouts)
    // return Promise.all(Object.entries(instance.elements).map(async ([_id, elem]) => {
    //   const { w, h } = elementDims[elem.layoutKey]
    //   elem.display.imageset = getElementImageset({ ...elem.display, w, h })
    //   return
    // }))
  }

  static create(name: GuiName): Gui<string> {
    // console.log('create gui', name)
    if (name in this._preloaded) {
      return this._preloaded[name] as Gui<string>
    }
    throw new Error(`gui '${name}' was not preloaded`)
  }
}

export type RegisteredGui<TLayoutKey extends string> = {
  factory: () => Gui<TLayoutKey>
  layoutFactory: (context: PinballWizard) => CssLayout
  elements: Array<GuiElement<TLayoutKey>>
}
