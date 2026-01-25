/**
 * @file puppet-test-sequence.ts
 *
 * Sequence for puppet test.
 */

const seed = 12345
const winner = 1 // winning ball index for seed (guess and check)

export const puppetTestSequence = [
  {
    test: 'reaches-state',
    targetState: 'title-screen',
  },
  {
    test: 'change-default-setting',
    key: 'rngSeed',
    defaultValue: -1,
    value: seed,
  },
  {
    test: 'change-default-setting',
    key: 'topSpeed',
    defaultValue: 30,
    value: 1000,
  },
  {
    test: 'change-default-setting',
    key: 'speedLerp',
    defaultValue: 4e-3,
    value: 1,
  },
  {
    // start game
    test: 'button-changes-state',
    state: 'title-screen',
    button: 'start-button',
    targetState: 'normal',
  },
  {
    // pause
    test: 'button-changes-state',
    state: 'normal',
    button: 'pauseBtn',
    targetState: 'paused',
  },
  {
    // select ball
    test: 'button-changes-state',
    state: 'paused',
    button: `ball-${winner}`,
    targetState: `paused-ball-${winner}`,
  },
  {
    // unpause
    test: 'button-changes-state',
    state: `paused-ball-${winner}`,
    button: 'playBtn',
    targetState: `normal-ball-${winner}`,
  },
  {
    // fast forward to finish
    test: 'button-changes-state',
    state: `normal-ball-${winner}`,
    button: 'fasterBtn',
    targetState: `ball-${winner}-finished`,
    // targetState: `finished`,
  },
]
