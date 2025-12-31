/**
 * @file lut.ts
 *
 * Base class for lookup tables.
 */

import type { LutName } from 'imp-names'
import { CollisionEncoder } from 'simulation/collision-encoder'
import { DiskDiskCollisions } from 'simulation/disk-disk-collisions'

export type RegisteredLut<TLeaf> = {
  factory: () => Lut<TLeaf>
  depth: number
  detail: Array<number>
}
export type Tree<TLeaf> = Array<TLeaf | Tree<TLeaf>>

export abstract class Lut<TLeaf> {
  // @ts-expect-error forcefully assigned on register
  private readonly name: LutName = null

  // @ts-expect-error forcefully assigned on register
  private readonly reg: RegisteredLut<TLeaf> = null

  public readonly tree: Tree<TLeaf> = []

  abstract computeLeaf(index: Array<number>)

  public loadFromBlob(intArr: Int16Array) {
    // @ts-expect-error forcefully re-assign tree
    this.tree = CollisionEncoder.decode(intArr)
  }

  public async loadAll() {
    try {
      // // Fetch the binary blob from the URL
      //   const intArr = await DiskDiskCollisions.fetchBlobWithIntegrityCheck(
      //     DDCOLLISION_BLOB_URL,
      //     DDCOLLISION_BLOB_HASH,
      //   )

      const intArr = await DiskDiskCollisions.fetchBlob('/collisions/encoded-collision-cache.bin')

      // Decode the binary data into the collision cache structure

      // @ts-expect-error forcefully re-assign tree
      this.tree = CollisionEncoder.decode(intArr)
    }
    catch (error) {
      console.error('Error loading collision blob:', error)
      throw error
    }
  }

  public computeAll() {
    for (const index of allIndices(this.reg)) {
      const leaf = this.computeLeaf(index)
      assignIndex(this.tree, index, leaf)
    }
  }

  // static registry pattern
  static _registry: Partial<Record<LutName, Lut<any>>> = {}

  protected constructor() {}

  static register(name: LutName, reg: RegisteredLut<any>): void {
    if (name in this._registry) {
      throw new Error(`configurable already registered: '${name}'`)
    }
    const lut = reg.factory()

    // @ts-expect-error assign readonly member
    lut.reg = reg

    // @ts-expect-error assign readonly member
    lut.name = name

    this._registry[name] = lut
  }

  static create(name: LutName): Lut<any> {
    if (!Object.hasOwn(this._registry, name)) {
      throw new Error(`lut not registered: ${name}`)
    }
    return this._registry[name] as Lut<any>
  }
}

export function* allIndices(reg: RegisteredLut<any>): Generator<Array<number>> {
  const nLevels = reg.depth
  const index: Array<number> = Array.from({ length: nLevels }, () => 0)

  while (true) {
    yield [...index]

    const didFinish = advance(index, reg, index.length - 1)
    if (didFinish) return
  }
}

function assignIndex<TLeaf>(tree: Tree<TLeaf>, index: Array<number>, value: TLeaf) {
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

function advance(index: Array<number>, reg: RegisteredLut<any>, i: number): boolean {
  // let i = index.length - 1

  const newVal = index[i] + 1
  if (newVal >= reg.detail[i]) {
    console.log('reached end at level ', i)
    if (i === 0) {
      // reached end
      return true
    }
    index[i] = 0
    return advance(index, reg, i - 1)
  }
  else {
    index[i] = newVal
  }

  return false
}
