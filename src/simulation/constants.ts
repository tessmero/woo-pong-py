/**
 * @file constants.ts
 *
 * Constants.
 */
export const STEP_DURATION = 4
export const valueScale = 1e4
export const DISK_RADIUS = 3 * valueScale

export const circleObsRadius = 5 * valueScale

// circle
export const circleObsPath = `M0,${-circleObsRadius} `
  + `A${circleObsRadius},${circleObsRadius} 0 1,0 0,${circleObsRadius} `
  + `A${circleObsRadius},${circleObsRadius} 0 1,0 0,${-circleObsRadius} Z`

// // sqyare
// export const circleObsPath = `M${-circleObsRadius},${-circleObsRadius} `
//   + `L${circleObsRadius},${-circleObsRadius} `
//   + `L${circleObsRadius},${circleObsRadius} `
//   + `L${-circleObsRadius},${circleObsRadius} Z`

// // triangle
// export const circleObsPath = `M0,${-circleObsRadius} `
//   + `L${circleObsRadius},${circleObsRadius} `
//   + `L${-circleObsRadius},${circleObsRadius} Z`
