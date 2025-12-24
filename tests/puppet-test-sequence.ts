/**
 * @file puppet-test-sequence.ts
 *
 * Sequence for puppet test.
 */

export const puppetTestSequence = [
  {
    test: 'reaches-state',
    targetState: 'flat-view',
  },
  {
    test: 'change-default-setting',
    key: 'speedMultiplier',
    defaultValue: 1,
    value: 10,
  },
  {
    test: 'buttons-are-hoverable',
    state: 'flat-view',
    buttons: ['N-13-0', 'N-2-0'],
    backgroundPoint: [100, 100],
  },
  {
    test: 'camera-is-draggable',
    state: 'flat-view',
    startDrag: [500, 100],
    endDrag: [350, 100],
    // eps: 100,
  },
  {
    test: 'reaches-state',
    targetState: 'flat-view',
  },

  // east view (no solutions)

  {
    test: 'buttons-are-hoverable',
    state: 'flat-view',
    buttons: ['E-13-0', 'E-12-0'],
    backgroundPoint: [100, 100],
  },
  {
    test: 'button-changes-state',
    state: 'flat-view',
    button: 'E-4-0',
    targetState: 'simulation',
  },
  {
    test: 'button-changes-state',
    state: 'simulation',
    button: 'resetBtn',
    targetState: 'flat-view',
  },
  {
    test: 'camera-is-draggable',
    state: 'flat-view',
    startDrag: [350, 100],
    endDrag: [500, 100],
    // eps: 100,
  },
  {
    test: 'reaches-state',
    targetState: 'flat-view',
  },

  // back at north view

  {
    test: 'button-changes-state',
    state: 'flat-view',
    button: 'N-8-0',
    targetState: 'simulation',
  },
  {
    test: 'reaches-state',
    targetState: 'level-passed',
  },
]
