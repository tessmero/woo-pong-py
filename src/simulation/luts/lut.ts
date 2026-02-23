/**
 * @file lut.ts
 *
 * Base class for lookup tables.
 *
 * Each LUT declares a `schema` — an array of named fields with types ('i16' or 'i32').
 * The schema drives:
 *   - Encoded (blob) leaf length: i16 → 1 int16, i32 → 2 int16s (high + low word)
 *   - Named field access via `get(cellIndex, fieldName)`
 *   - Centralized encode/decode/validation — subclasses never override these.
 */

import type { ShapeName } from 'simulation/shapes'
import type { LutName } from '../../imp-names'
import { LutEncoder } from '../lut-encoder'
export { LutEncoder }
import { type ObstacleLut } from './imp/obstacle-lut'
import { LUT_BLOBS } from 'set-by-build'
import { INT16_MAX, INT16_MIN, INT32_MAX, INT32_MIN, OBSTACLE_DETAIL_SCALE } from 'simulation/constants'

// ── Leaf schema types ──────────────────────────────────────────────────

export type FieldType = 'i16' | 'i32' | 'i16_array' | 'i32_array'
export type FieldDef = { readonly name: string, readonly type: FieldType, readonly length?: number }
export type LeafSchema = ReadonlyArray<FieldDef>

/** Shorthand to declare an int16 field. */
export function i16(name: string): FieldDef {
  return { name, type: 'i16' }
}

/** Shorthand to declare an int32 field (encoded as two int16s). */
export function i32(name: string): FieldDef {
  return { name, type: 'i32' }
}

/** Shorthand to declare an array of int16 values. */
export function i16Array(name: string, length: number): FieldDef {
  return { name, type: 'i16_array', length }
}

/** Shorthand to declare an array of int32 values (each encoded as two int16s). */
export function i32Array(name: string, length: number): FieldDef {
  return { name, type: 'i32_array', length }
}

function encodedFieldLength(f: FieldDef): number {
  switch (f.type) {
    case 'i16': return 1
    case 'i32': return 2
    case 'i16_array': return f.length!
    case 'i32_array': return f.length! * 2
  }
}

type FieldInfo = { readonly encodedOffset: number, readonly type: FieldType, readonly length?: number }

function computeEncodedLeafLength(schema: LeafSchema): number {
  let len = 0
  for (const f of schema) len += encodedFieldLength(f)
  return len
}

function buildFieldInfo(schema: LeafSchema): Record<string, FieldInfo> {
  const info: Record<string, FieldInfo> = Object.create(null)
  let offset = 0
  for (const f of schema) {
    info[f.name] = { encodedOffset: offset, type: f.type, length: f.length }
    offset += encodedFieldLength(f)
  }
  return info
}

// ── Leaf value type ────────────────────────────────────────────────────

/** Scalar fields map to numbers; array fields map to number arrays. */
export type LeafValues = Record<string, number | ReadonlyArray<number>>

// ── Registration type ──────────────────────────────────────────────────

export type RegisteredLut = {
  factory: () => Lut
  depth: number
  schema: LeafSchema
  /** Encoded leaf length in int16 words (auto-computed from schema). */
  leafLength: number
  /** Pre-computed field info for fast named access (auto-computed from schema). */
  fieldInfo: Record<string, FieldInfo>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tree = Array<any>

export abstract class Lut {
  // @ts-expect-error forcefully assigned on register
  private readonly name: LutName = null

  // @ts-expect-error forcefully assigned on register
  public readonly reg: RegisteredLut = null

  public readonly tree: Tree = []

  /** Flat dense buffer: leafLength int16 values per cell, row-major order. Null cells are all zeros. */
  public data: Int16Array = new Int16Array(0)

  /** 1 bit per cell: 1 = has leaf, 0 = null. Packed as bytes. */
  public nullMap: Uint8Array = new Uint8Array(0)

  /** Pre-computed strides for flat indexing. strides[i] = product of detail[i+1..] */
  public strides: Array<number> = []

  abstract detail: Array<number>
  abstract blobUrl: string
  abstract blobHash: string

  /** The schema defining named fields and their types. */
  abstract schema: LeafSchema

  /** Compute the leaf values for a given multi-dimensional index. Return null for empty cells. */
  abstract computeLeaf(index: Array<number>): LeafValues | null

  /** Override to return true if this LUT has antipodal symmetry: f(-x) = -f(x). */
  get symmetric(): boolean { return false }

  /** Return true if this index is in the canonical half. Only called when symmetric is true. */
  isCanonical(_index: Array<number>): boolean { return true }

  /** Return the mirror of the given index. */
  mirrorIndex(_index: Array<number>): Array<number> { return _index }

  /** Return the negated leaf value. Default: negate all fields. */
  mirrorLeaf(leaf: LeafValues | null): LeafValues | null {
    if (leaf === null) return null
    const result: LeafValues = {}
    for (const field of this.schema) {
      const val = leaf[field.name]
      if (field.type === 'i16_array' || field.type === 'i32_array') {
        result[field.name] = (val as ReadonlyArray<number>).map(v => -v)
      }
      else {
        result[field.name] = -(val as number)
      }
    }
    return result
  }

  /**
   * Look up a scalar leaf field value by name. Handles i16 and i32 transparently.
   */
  get(cellIndex: number, fieldName: string): number {
    const info = this.reg.fieldInfo[fieldName]
    const base = cellIndex * this.reg.leafLength + info.encodedOffset
    if (info.type === 'i32') {
      return (this.data[base] << 16) | (this.data[base + 1] & 0xFFFF)
    }
    return this.data[base]
  }

  /**
   * Copy an i16_array field into `out`. Zero-allocation hot path.
   */
  getI16Array(cellIndex: number, fieldName: string, out: Int32Array): void {
    const info = this.reg.fieldInfo[fieldName]
    const base = cellIndex * this.reg.leafLength + info.encodedOffset
    const n = info.length!
    for (let i = 0; i < n; i++) out[i] = this.data[base + i]
  }

  /**
   * Copy an i16_array field into `out`. Zero-allocation hot path.
   */
  getI16ArrayValue(cellIndex: number, fieldName: string, i: number): number {
    const info = this.reg.fieldInfo[fieldName]
    const base = cellIndex * this.reg.leafLength + info.encodedOffset
    return this.data[base + i]
  }

  /**
   * Copy an i32_array field into `out`. Zero-allocation hot path.
   */
  getI32Array(cellIndex: number, fieldName: string, out: Int32Array): void {
    const info = this.reg.fieldInfo[fieldName]
    const base = cellIndex * this.reg.leafLength + info.encodedOffset
    const n = info.length!
    for (let i = 0; i < n; i++) {
      out[i] = (this.data[base + i * 2] << 16) | (this.data[base + i * 2 + 1] & 0xFFFF)
    }
  }

  /** Encode a leaf into int16 values for blob storage. Driven by schema. */
  encodeLeaf(leaf: LeafValues): Array<number> {
    const result: Array<number> = []
    for (const field of this.schema) {
      if (field.type === 'i32_array') {
        const arr = leaf[field.name] as ReadonlyArray<number>
        for (let i = 0; i < field.length!; i++) {
          const val = Math.round(arr[i])
          result.push((val >> 16) & 0xFFFF, val & 0xFFFF)
        }
      }
      else if (field.type === 'i16_array') {
        const arr = leaf[field.name] as ReadonlyArray<number>
        for (let i = 0; i < field.length!; i++) {
          let v = Math.round(arr[i])
          if (v < 0) v += 0x10000
          result.push(v & 0xFFFF)
        }
      }
      else if (field.type === 'i32') {
        const val = Math.round(leaf[field.name] as number)
        result.push((val >> 16) & 0xFFFF, val & 0xFFFF)
      }
      else { // i16
        let v = Math.round(leaf[field.name] as number)
        if (v < 0) v += 0x10000
        result.push(v & 0xFFFF)
      }
    }
    return result
  }

  /** Decode int16 values from blob back into a named leaf. Driven by schema. */
  decodeLeaf(values: Array<number>): LeafValues {
    const result: LeafValues = {}
    let i = 0
    for (const field of this.schema) {
      if (field.type === 'i32_array') {
        const arr: Array<number> = []
        for (let j = 0; j < field.length!; j++) {
          // Properly reconstruct signed 32-bit value from two int16s
          let hi = values[i]
          const lo = values[i + 1] & 0xFFFF
          // sign-extend hi
          if (hi < 0) hi = hi + 0x10000
          let val = (hi << 16) | lo
          // sign-extend 32-bit
          if (val & 0x80000000) val = val | 0xFFFFFFFF00000000
          arr.push(val)
          i += 2
        }
        result[field.name] = arr
      }
      else if (field.type === 'i16_array') {
        const arr: Array<number> = []
        for (let j = 0; j < field.length!; j++) {
          let v = values[i] & 0xFFFF
          if (v & 0x8000) v = v - 0x10000
          arr.push(v)
          i += 1
        }
        result[field.name] = arr
      }
      else if (field.type === 'i32') {
        let hi = values[i]
        const lo = values[i + 1] & 0xFFFF
        if (hi < 0) hi = hi + 0x10000
        let val = (hi << 16) | lo
        if (val & 0x80000000) val = val | 0xFFFFFFFF00000000
        result[field.name] = val
        i += 2
      }
      else { // i16
        let v = values[i] & 0xFFFF
        if (v & 0x8000) v = v - 0x10000
        result[field.name] = v
        i += 1
      }
    }
    return result
  }

  /** Allocate flat data buffer and compute strides from detail array. */
  initFlat() {
    const depth = this.detail.length
    const strides = new Array<number>(depth)
    let total = 1
    for (let i = depth - 1; i >= 0; i--) {
      strides[i] = total
      total *= this.detail[i]
    }
    this.strides = strides
    const leafLen = this.reg.leafLength
    this.data = new Int16Array(total * leafLen)
    this.nullMap = new Uint8Array(Math.ceil(total / 8))
  }

  /** Compute flat cell index from multi-dimensional indices. */
  flatIndex(...indices: Array<number>): number {
    let idx = 0
    for (let i = 0; i < indices.length; i++) {
      idx += indices[i] * this.strides[i]
    }
    return idx
  }

  /** Check if a cell has a non-null leaf. */
  hasLeafAt(cellIndex: number): boolean {
    return (this.nullMap[cellIndex >> 3] & (1 << (cellIndex & 7))) !== 0
  }

  /** Set a cell as having a non-null leaf. */
  setHasLeaf(cellIndex: number) {
    this.nullMap[cellIndex >> 3] |= (1 << (cellIndex & 7))
  }

  public loadFromBlob(intArr: Int16Array) {
    this.initFlat()
    LutEncoder.decodeFlatInt16(intArr, this)
  }

  public async loadAll() {
    const intArr = await fetchBlobWithIntegrityCheck(
      this.blobUrl,
      this.blobHash,
    )

    this.initFlat()
    LutEncoder.decodeFlatInt16(intArr, this)
  }

  public computeAll() {
    this.tree.length = 0 // clear tree (used by encoder)
    this.initFlat()
    let cell = 0
    for (const index of allIndices(this)) {
      const leaf = this.computeLeaf(index)
      if (leaf !== null) {
        this.assertValidLeaf(leaf)
        const encoded = this.encodeLeaf(leaf)
        const dataOff = cell * this.reg.leafLength
        for (let k = 0; k < encoded.length; k++) this.data[dataOff + k] = encoded[k]
        this.setHasLeaf(cell)
      }
      assignIndex(this.tree, index, leaf)
      cell++
    }
  }

  private assertValidLeaf(leaf: LeafValues) {
    for (const field of this.schema) {
      const value = leaf[field.name]
      if (value === undefined) {
        throw new Error(`${this.name}: missing field '${field.name}' in leaf`)
      }
      if (field.type === 'i16_array' || field.type === 'i32_array') {
        const arr = value as ReadonlyArray<number>
        if (!Array.isArray(arr)) {
          throw new Error(`${this.name}: field '${field.name}' should be an array`)
        }
        if (arr.length !== field.length!) {
          throw new Error(`${this.name}: field '${field.name}' has ${arr.length} elements, expected ${field.length}`)
        }
        const [min, max] = field.type === 'i32_array'
          ? [INT32_MIN, INT32_MAX]
          : [INT16_MIN, INT16_MAX]
        for (let i = 0; i < arr.length; i++) {
          if (!Number.isInteger(arr[i])) {
            throw new Error(`${this.name}: field '${field.name}[${i}]' is non-integer: ${arr[i]}`)
          }
          if (arr[i] < min || arr[i] > max) {
            throw new Error(`${this.name}: field '${field.name}[${i}]' value ${arr[i]} is out of range`)
          }
        }
      }
      else {
        if (!Number.isInteger(value as number)) {
          throw new Error(`${this.name}: field '${field.name}' is non-integer: ${value}`)
        }
        if (field.type === 'i32') {
          if ((value as number) < INT32_MIN || (value as number) > INT32_MAX) {
            throw new Error(`${this.name}: field '${field.name}' value ${value} is outside of int32 range`)
          }
        }
        else {
          if ((value as number) < INT16_MIN || (value as number) > INT16_MAX) {
            throw new Error(`${this.name}: field '${field.name}' value ${value} is outside of int16 range`)
          }
        }
      }
    }
  }

  // static registry pattern
  static _registry: Partial<Record<LutName, RegisteredLut>> = {}
  static _singletonLuts: Partial<Record<LutName, Lut>> = {}
  static _obstacleLuts: Record<string, ObstacleLut> = {}

  protected constructor() {}

  static register(name: LutName, input: { factory: () => Lut, depth: number, schema: LeafSchema }): void {
    if (name in this._registry) {
      throw new Error(`lut already registered: '${name}'`)
    }
    const reg: RegisteredLut = {
      ...input,
      leafLength: computeEncodedLeafLength(input.schema),
      fieldInfo: buildFieldInfo(input.schema),
    }
    this._registry[name] = reg
    if (name === 'obstacle-lut') {
      return // obstacle-lut is not singleton - it has an instance for each distinct shape
    }
    const lut = reg.factory()

    // @ts-expect-error assign readonly member
    lut.reg = reg

    // @ts-expect-error assign readonly member
    lut.name = name

    this._singletonLuts[name] = lut
  }

  static create(name: LutName, shapeName?: ShapeName): Lut {
    if (name === 'obstacle-lut') {
      // lut is specific to obstacle shape
      if (!shapeName) {
        throw new Error('shapeName argument is required to create obstacle-lut')
      }
      const reg = this._registry['obstacle-lut']
      if (!reg) {
        throw new Error('obstacle-lut not registered')
      }
      if (!Object.hasOwn(Lut._obstacleLuts, shapeName)) {
        // first time creating lut for this shape
        const { factory } = reg
        const lut = factory() as ObstacleLut
        // set url,hash,detail for lut

        // @ts-expect-error assign readonly member
        lut.reg = reg

        // @ts-expect-error assign readonly member
        lut.name = name

        // assign shape-specific values (obstacle-lut.ts)
        lut.shape = shapeName
        const blobKey = shapeName.toUpperCase().replaceAll('-', '_')
        const { url, hash, xRad = 100, yRad = 100 } = LUT_BLOBS[blobKey]
        lut.blobUrl = url
        lut.blobHash = hash
        lut.obsOffsetDetailX = xRad // half size of cache along dx and dy
        lut.obsOffsetDetailY = yRad // half size of cache along dx and dy
        lut.detail = [
          lut.obsOffsetDetailX * 2 + 1,
          lut.obsOffsetDetailY * 2 + 1,
        ]
        lut.maxOffsetX = xRad * OBSTACLE_DETAIL_SCALE // in-simulation distance at edge of bounds
        lut.maxOffsetY = yRad * OBSTACLE_DETAIL_SCALE // in-simulation distance at edge of bounds

        Lut._obstacleLuts[shapeName] = lut // finish once-per-shape setup
      }

      return Lut._obstacleLuts[shapeName]
    }
    else {
      // lut is singleton
      if (shapeName) {
        throw new Error('shapeName argument should only be used to create obstacle-lut')
      }
      if (!Object.hasOwn(this._singletonLuts, name)) {
        throw new Error(`singleton lut not registered: ${name}`)
      }
      return this._singletonLuts[name] as Lut
    }
  }
}

async function fetchBlobWithIntegrityCheck(url: string, expectedHash?: string): Promise<Int16Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()

  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    // skip integrity check in dev — filename already contains content hash
  }
  else if (!crypto.subtle) {
    // eslint-disable-next-line no-console
    console.log('skipping integrity check because crypto.subtle is not available')
  }
  else if (expectedHash) {
    // Compute hash for integrity check
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (hashHex !== expectedHash) {
      throw new Error(`Integrity check failed: expected ${expectedHash}, got ${hashHex}`)
    }
  }

  return new Int16Array(arrayBuffer)
}

export function* allIndices(lut: Lut): Generator<Array<number>> {
  const nLevels = lut.reg.depth
  const index: Array<number> = Array.from({ length: nLevels }, () => 0)

  while (true) {
    yield [...index]

    const didFinish = advance(index, lut, index.length - 1)
    if (didFinish) return
  }
}

export function getFromTree(tree: Tree, index: Array<number>): LeafValues | null {
  let node: unknown = tree
  for (const i of index) {
    node = (node as Array<unknown>)[i]
  }
  return node as LeafValues | null
}

export function assignIndex(tree: Tree, index: Array<number>, value: LeafValues | null) {
  if (index.length === 0) throw new Error('poop')

  if (index.length === 1) {
    if (tree.length !== index[0]) {
      throw new Error('poop')
    }
    tree.push(value)
  }
  else {
    while (tree.length <= index[0]) {
      tree.push([])
    }
    assignIndex(tree[index[0]] as Tree, index.slice(1), value)
  }
}

function advance(index: Array<number>, lut: Lut, i: number): boolean {
  const newVal = index[i] + 1
  if (newVal >= lut.detail[i]) {
    if (i === 0) {
      // reached end
      return true
    }
    index[i] = 0
    return advance(index, lut, i - 1)
  }
  else {
    index[i] = newVal
  }

  return false
}
