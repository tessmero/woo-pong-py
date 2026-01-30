/**
 * @file gui-html-elements.ts
 *
 * Helper to display gui elements as html elemnts.
 */

// import { playSound } from 'audio/sound-effect-player'
import { BUTTON_ICONS } from 'gfx/button-icons'
import { type ElementId, type GuiElement } from 'guis/gui'
import type { PinballWizard } from 'pinball-wizard'
import type { Rectangle } from 'util/math-util'

// export const loadedImagesets: Record<string, ElementImageset> = {} // populated at startup

// build each unique element once
export function buildHtmlElement(id: ElementId, elem: GuiElement): HTMLElement {
  // const tagName = elem.display.type === 'diagram' ? 'canvas' : 'div'
  const tagName = elem.display.draw ? 'canvas' : (elem.display.type === 'button' ? 'button' : 'div')

  const allClasses = elem.display.classes ?? []
  // const iconClasses = []//allClasses.filter(clazz => clazz.startsWith('fa-'))
  const nonIconClasses = allClasses// allClasses.filter(clazz => !clazz.startsWith('fa-'))

  if (elem.display.type !== 'button') {
    nonIconClasses.push('noselect')
  }

  const html = asElement(`
    <${tagName} 
       id="${id}" 
       class="
          hidden
          gui-element 
          ${elem.display.type} 
          ${nonIconClasses.join(' ')}
        "
        >
      ${elem.display.icon ? BUTTON_ICONS[elem.display.icon] : ''}
      <span 
        ${elem.display.textAlign === 'left' ? 'style="width:100%;text-align:left;"' : ''}
      >
        ${elem.display.label ?? ''}
      </span>
    </${tagName}>
  `)

  for (const [key, val] of Object.entries(elem.display.styles ?? {})) {
    html.style.setProperty(key, val)
  }
  elem.id = id
  elem.htmlElem = html

  return html
}

export function toggleElement(id: ElementId | GuiElement, isVisible: boolean) {
  if (isVisible) {
    showElement(id)
  }
  else {
    hideElement(id)
  }
}

export function hideElement(id: ElementId | GuiElement) {
  let el: HTMLElement | null
  if (typeof id === 'string') {
    el = document.getElementById(id)
  }
  else {
    el = id.htmlElem as HTMLElement
  }
  if (!el) return

  if (el && el.classList.contains('gui-element')) {
    el.classList.add('hidden')
  }
}

export function showElement(id: ElementId | GuiElement) {
  let el: HTMLElement | null
  if (typeof id === 'string') {
    el = document.getElementById(id)
  }
  else {
    el = id.htmlElem as HTMLElement
  }
  if (!el) return

  if (el && el.classList.contains('gui-element')) {
    el.classList.remove('hidden')
  }
}

export function setElementLabel(elem: GuiElement, label: string) {
  elem.display.label = label

  // Handle tilde escape character
  if (/~[^n]/.test(label)) {
    throw new Error('Invalid tilde usage: only "~n" is allowed.')
  }

  // Remove '~n' from the label
  const sanitizedLabel = label.replace(/~n/g, '')

  const { htmlElem } = elem
  if (!htmlElem) return

  htmlElem.innerHTML = `
    <span ${elem.display.textAlign === 'left' ? 'style="width:100%;text-align:left;"' : ''}
    >${sanitizedLabel}</span>
  `
}

export function repaintDiagram(pinballWizard: PinballWizard, elem: GuiElement) {
  // if (elem.display.type !== 'diagram') {
  //   throw new Error('diagram display type is not diagram')
  // }
  if (!elem.display.draw) {
    throw new Error('diagram gui element should define draw')
  }

  const { htmlElem, rectangle } = elem
  if (!rectangle) return
  if (!htmlElem) return
  if (htmlElem.tagName !== 'CANVAS') {
    throw new Error('diagram html element is not canvas')
  }

  const cvs = htmlElem as HTMLCanvasElement
  const ctx = cvs.getContext('2d') as CanvasRenderingContext2D
  ctx.imageSmoothingEnabled = false
  elem.display.draw(ctx, pinballWizard, rectangle.map(v => v * window.devicePixelRatio) as Rectangle)
}

// position existing element in current gui layout, or hide it
export function updateElement(element: HTMLElement, elem: GuiElement, rect: Rectangle | undefined) {
  if (!rect) {
    element.classList.add('hidden')
    return
  }

  element.style.opacity = ''

  // const { hideAfter, hideUntil } = elem.display

  // if (hideAfter) {
  //   const entry = allChecklistEntries[hideAfter]
  //   if (!entry) throw new Error(
  //     `element display hideAfter value "${hideAfter}" does not match any checklist entry ID`)
  //   if (entry.isCompleted) {
  //     element.classList.add('hidden')
  //     return
  //   }
  // }

  // if (hideUntil) {
  //   for (const id of hideUntil) {
  //     const entry = allChecklistEntries[id]
  //     if (!entry) throw new Error(
  //       `element display hideUntil value "${id}" does not match any checklist entry ID`)
  //     if (!entry.isCompleted) {
  //       element.classList.add('hidden')
  //       return
  //     }
  //   }
  // }

  // Position visible element using px units
  const [x, y, w, h] = rect
  element.style.display = ''
  element.style.left = `${x}px`
  element.style.top = `${y}px`
  element.style.width = `${w}px`
  element.style.height = `${h}px`

  // make canvas gfx context use device pixels
  const cvs = element as HTMLCanvasElement
  cvs.width = w * window.devicePixelRatio
  cvs.height = h * window.devicePixelRatio
}

function asElement(htmlString): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = htmlString.trim()

  // Change to div.childNodes to support multiple top-level nodes.
  return div.firstChild as HTMLElement
}
