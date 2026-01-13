/**
 * @file puppet.test.ts
 *
 * Generates reports on tessmero.github.io.
 */

import { execSync } from 'child_process'
import { puppetTestSequence } from './puppet-test-sequence'

const params = {
  targets: [
    {
      shortName: 'demo',
      name: 'development build of woo-pong',
      serverCmd: [
        'python3', ['-m', 'http.server', '8642'], { cwd: 'dist' },
      ],
      url: 'http://localhost:8642/index.html',
    },
    // {
    //   shortName: 'site',
    //   name: 'development build of tessmero.github.io',
    //   url: 'http://localhost:3000/pinball-wizard/',
    // },
  ],
  sequence: puppetTestSequence,
}

let TestBatch: any // eslint-disable-line @typescript-eslint/no-explicit-any
let HtmlRenderer: any // eslint-disable-line @typescript-eslint/no-explicit-any
let isEnabled = false

describe('puppeteer/playwright tests', function () {
  before(function () {
    try {
      const module = require('demo-tests') // eslint-disable-line @typescript-eslint/no-require-imports
      TestBatch = module.TestBatch
      HtmlRenderer = module.HtmlRenderer
      isEnabled = true
    }
    catch {
      // demo-tests not installed
      this.skip()
    }
  })

  it('runs test batch', function () {
    TestBatch.describeTests(params)
  })
})

before(function () {
  const cmd = `rm ${process.cwd()}/reports/*.json`
  try {
    execSync(cmd)
  }
  catch {
    // console.error(cmd)
  }
})

after(function () {
  if (!isEnabled) return
  const reportsFolder = `${process.cwd()}/reports`
  new HtmlRenderer(reportsFolder).renderReport('index')
})
