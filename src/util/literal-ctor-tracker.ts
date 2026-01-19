/**
 * @file literal-ctor-tracker.ts
 *
 * Tracks construction of javascript arrays and objects.
 */

/* eslint-disable @typescript-eslint/naming-convention */

const _TRACKED_CTORS = ['Array', 'Object'] as const
type TrackedCtor = (typeof _TRACKED_CTORS)[number]
const COUNTS: Record<TrackedCtor, number> = {
  Array: 0,
  Object: 0,
}

function trackObjectImpl<T extends object>(value: T, _meta: { file: string, line?: number }): T {
  COUNTS.Object++
  // console.log('new object', { id, meta, value });
  return new Proxy(value, {
    get(target, prop, receiver) {
      // console.log('get', { id, prop, meta });
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, v, receiver) {
      // console.log('set', { id, prop, value: v, meta });
      return Reflect.set(target, prop, v, receiver)
    },
  }) as T
}

function trackArrayImpl<T>(value: Array<T>, _meta: { file: string, line?: number }): Array<T> {
  COUNTS.Array++
  // console.log('new array', { id, meta, value });
  return new Proxy(value, {
    get(target, prop, receiver) {
      // console.log('array get', { id, prop, meta });
      return Reflect.get(target, prop, receiver)
    },
    set(target, prop, v, receiver) {
      // console.log('array set', { id, prop, value: v, meta });
      return Reflect.set(target, prop, v, receiver)
    },
  }) as Array<T>
}

// attach to globalThis so any module can call them
(globalThis as any).__trackObject = trackObjectImpl; // eslint-disable-line @typescript-eslint/no-explicit-any
(globalThis as any).__trackArray = trackArrayImpl // eslint-disable-line @typescript-eslint/no-explicit-any

// optional: export for type usage / direct imports
export const __trackObject = trackObjectImpl
export const __trackArray = trackArrayImpl

// function startLiteralCtorCheck() {
//   const startCounts = { ...COUNTS }
//   startCounts.Object++ // account for one object created on previous line
//   setTimeout(() => {
//     for (const ctorName of _TRACKED_CTORS) {
//       const delta = COUNTS[ctorName] - startCounts[ctorName]
//       if (delta > 0) {
//         console.log(`constructed ${delta} ${ctorName} in one second`)
//       }
//     }
//   }, 1000)
// }

// // Sample every second
// window.setInterval(startLiteralCtorCheck, 1000)
