/**
 * @file lut.ts
 *
 * Base class for lookup tables.
 */

import type { ShapeName } from 'simulation/shapes'
import type { LutName } from '../../imp-names'
import { LutEncoder } from '../lut-encoder'
import { type ObstacleLut } from './imp/obstacle-lut'
import { LUT_BLOBS } from 'set-by-build'
import { INT16_MAX, INT16_MIN, OBSTACLE_DETAIL_SCALE } from 'simulation/constants'

export type RegisteredLut<TLeaf> = {
  factory: () => Lut<TLeaf>
  depth: number
  leafLength: number
  // detail: Array<number>
  // blobUrl: string
  // blobHash: string
}
export type Tree<TLeaf> = Array<TLeaf | Tree<TLeaf>>

export abstract class Lut<TLeaf> {
  // @ts-expect-error forcefully assigned on register
  private readonly name: LutName = null

  // @ts-expect-error forcefully assigned on register
  public readonly reg: RegisteredLut<TLeaf> = null

  public readonly tree: Tree<TLeaf> = [] as Tree<TLeaf>

  /** Flat dense buffer: leafLength int16 values per cell, row-major order. Null cells are all zeros. */
  public data: Int16Array = new Int16Array(0)

  /** 1 bit per cell: 1 = has leaf, 0 = null. Packed as bytes. */
  public nullMap: Uint8Array = new Uint8Array(0)

  /** Pre-computed strides for flat indexing. strides[i] = product of detail[i+1..] */
  public strides: Array<number> = []

  abstract detail: Array<number>
  abstract blobUrl: string
  abstract blobHash: string

  abstract computeLeaf(index: Array<number>): TLeaf

  /** Override to return true if this LUT has antipodal symmetry: f(-x) = -f(x). */
  get symmetric(): boolean { return false }

  /** Return true if this index is in the canonical half. Only called when symmetric is true. */
  isCanonical(_index: Array<number>): boolean { return true }

  /** Return the mirror of the given index. */
  mirrorIndex(_index: Array<number>): Array<number> { return _index }

  /** Return the negated leaf value. */
  mirrorLeaf(_leaf: TLeaf): TLeaf { return _leaf }

  /** Encode a leaf into int16 values for blob storage. Default: values as-is. */
  encodeLeaf(leaf: TLeaf): Array<number> {
    return (leaf as Array<number>).map(Math.round)
  }

  /** Decode int16 values from blob back into a leaf. Default: values as-is. */
  decodeLeaf(values: Array<number>): TLeaf {
    return values as unknown as TLeaf
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

  /**
   * Look up an int16 leaf value by component index within a cell.
   * cellIndex is from flatIndex(), k is the component (0..leafLength-1).
   */
  getInt16(cellIndex: number, k: number): number {
    return this.data[cellIndex * this.reg.leafLength + k]
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

  protected assertValidLeaf(leaf: TLeaf) {
    for (const value of (leaf as Array<number>)) {
      try {
        assertValidLeafValue(value)
      }
      catch (e) {
        throw new Error(`${this.name} computed leaf ${leaf} is invalid: ${e}`)
      }
    }
  }

  // static registry pattern
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _registry: Partial<Record<LutName, RegisteredLut<any>>> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _singletonLuts: Partial<Record<LutName, Lut<any>>> = {}
  static _obstacleLuts: Record<string, ObstacleLut> = {}

  protected constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static register(name: LutName, reg: RegisteredLut<any>): void {
    if (name in this._registry) {
      throw new Error(`lut already registered: '${name}'`)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static create(name: LutName, shapeName?: ShapeName): Lut<any> {
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
      return this._singletonLuts[name] as Lut<any> // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }
}

function assertValidLeafValue(value: number) {
  if (!Number.isInteger(value)) {
    throw new Error(`value is non-integer: ${value}`)
  }

  if (value >= INT16_MIN && value <= INT16_MAX) {
    // console.log(`${value} is in the int16 range.`)
  }
  else {
    throw new Error(`${value} is outside of int16 range.`)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function* allIndices(lut: Lut<any>): Generator<Array<number>> {
  const nLevels = lut.reg.depth
  const index: Array<number> = Array.from({ length: nLevels }, () => 0)

  while (true) {
    yield [...index]

    const didFinish = advance(index, lut, index.length - 1)
    if (didFinish) return
  }
}

export function getFromTree<TLeaf>(tree: Tree<TLeaf>, index: Array<number>): TLeaf {
  let node: Tree<TLeaf> | TLeaf = tree
  for (const i of index) {
    node = (node as Tree<TLeaf>)[i]
  }
  return node as TLeaf
}

export function assignIndex<TLeaf>(tree: Tree<TLeaf>, index: Array<number>, value: TLeaf) {
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
    assignIndex(tree[index[0]] as Tree<TLeaf>, index.slice(1), value)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function advance(index: Array<number>, lut: Lut<any>, i: number): boolean {
  // let i = index.length - 1

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
