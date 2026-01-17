/**
 * @file puppet-test-sequence.ts
 *
 * Sequence for puppet test.
 */

const seed = 12345
const winner = 4 // winning ball index for seed (guess and check)

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
    defaultValue: 10,
    value: 1000,
  },
  {
    test: 'change-default-setting',
    key: 'speedLerp',
    defaultValue: 1e-3,
    value: 1,
  },
  {
    test: 'button-changes-state',
    state: 'title-screen',
    button: 'start-button',
    targetState: 'playing-no-ball-selected',
  },
  {
    test: 'button-changes-state',
    state: 'playing-no-ball-selected',
    button: 'playPauseBtn',
    targetState: 'paused-no-ball-selected',
  },
  {
    test: 'button-changes-state',
    state: 'paused-no-ball-selected',
    button: `ball-${winner}`,
    targetState: `paused-ball-${winner}-selected`,
  },
  {
    test: 'button-changes-state',
    state: `paused-ball-${winner}-selected`,
    button: 'playPauseBtn',
    targetState: `playing-ball-${winner}-selected`,
  },
  {
    test: 'button-changes-state',
    state: `playing-ball-${winner}-selected`,
    button: 'speedUpBtn',
    targetState: `ball-${winner}-finished`,
  },
]
