/**
 * @file typed-entries.ts
 *
 * Boilerplate helper that wraps Object.entries and maintains key and value types.
 */

// For this file, allow single-character generic types and '{}' empty type.
/* eslint @typescript-eslint/no-empty-object-type: 0 */
/* eslint @typescript-eslint/naming-convention: 0 */

//
export function typedKeys<T extends {}>(object: T): ReadonlyArray<keyof T> {
  return Object.keys(object) as unknown as ReadonlyArray<keyof T>
}

export function typedEntries<T extends {}>(object: T): ReadonlyArray<Entry<T>> {
  return Object.entries(object) as unknown as ReadonlyArray<Entry<T>>
}

type TupleEntry<T extends ReadonlyArray<unknown>, I extends Array<unknown> = [], R = never>
  = T extends readonly [infer Head, ...infer Tail]
    ? TupleEntry<Tail, [...I, unknown], R | [`${I['length']}`, Head]>
    : R

type ObjectEntry<T extends {}>
  = T extends object
    ? { [K in keyof T]: [K, Required<T>[K]] }[keyof T] extends infer E
        ? E extends [infer K, infer V]
          ? K extends string | number
            ? [`${K}`, V]
            : never
          : never
        : never
    : never

export type Entry<T extends {}>
  = T extends readonly [unknown, ...Array<unknown>]
    ? TupleEntry<T>
    : T extends ReadonlyArray<infer U>
      ? [`${number}`, U]
      : ObjectEntry<T>
