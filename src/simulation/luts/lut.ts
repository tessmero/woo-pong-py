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
import { OBSTACLE_DETAIL_SCALE } from 'simulation/constants'

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

  abstract detail: Array<number>
  abstract blobUrl: string
  abstract blobHash: string

  abstract computeLeaf(index: Array<number>)

  public loadFromBlob(intArr: Int16Array) {
    this.tree.length = 0
    LutEncoder.decode(intArr, this)
  }

  public async loadAll() {
    // try {

    // Fetch the binary blob from the URL
    const intArr = await fetchBlobWithIntegrityCheck(
      this.blobUrl,
      this.blobHash,
    )

    // const intArr = await DiskDiskCollisions.fetchBlob('/luts/working.bin')

    // Decode the binary data into the collision cache structure

    this.tree.length = 0
    LutEncoder.decode(intArr, this)

    // }
    // catch (error) {
    //   console.error('Error loading collision blob:', error)
    //   throw error
    // }
  }

  public computeAll() {
    this.tree.length = 0 // clear tree
    for (const index of allIndices(this)) {
      const leaf = this.computeLeaf(index)
      assignIndex(this.tree, index, leaf)
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
      throw new Error(`configurable already registered: '${name}'`)
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
        const { url, hash, xRad = 100, yRad = 100 } = LUT_BLOBS[shapeName.toUpperCase()]
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

async function fetchBlobWithIntegrityCheck(url: string, expectedHash?: string): Promise<Int16Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch blob: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()

  if (expectedHash) {
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
