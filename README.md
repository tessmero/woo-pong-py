
# pinball-wizard


disk,disk -> (adjust pos), (adjust vel)
disk,normal -> (adjust vel)

for each obstacle
disk -> normal, (adjust pos)


## how does it work

Woo pong uses a super-determistic simulation. Each bouncing-balls race has 10 different pre-determined outcomes.

### determinism

The simulation is deterministic and uses a seed.

Suppose we pick a seed number like 1234. We start a simulation and input the seed number. We run the simulation and let the balls bounce around for a minute. Then we take a snapshot of what it looks like.

seed -> +1 minute -> snapshot

Because the simulation is deterministic, we can be sure the snapshot will end up exactly the same if we start again with the same seed (1234). 

The great thing about this is we can extend the time as long as we want. No matter how long we need it to run, we can pre-determine everything that happens just by knowing the seed.


### perturbations

On top of being deterministic, the simulations have pseudo-random perturbations added regularly. A PRNG reliably generates the same sequence of seemingly-random numbers based on the seed.

The perturbations are infinitesimal changes to the balls' velocities. They don't noticeably effect the simulation. What they allow us to do is reset the PRNG with a new seed at any point. 

seed -> +1 min -> new seed -> +1 min -> snapshot

Keep in mind that resetting the PRNG would seem to change nothing. Looking at the random numbers it produces, you would have no way of knowing when it was reset. However, the changes to the perturbations will compound and lead to distinct outcomes. 

seed A -> +1 min -> seed B -> +1 min -> snapshot

seed A -> +1 min -> seed C -> +1 min -> snapshot

At (1 min), just before branching, the two simulations are identical. At (2 min) the final snapshots are very different. The balls are completely scrambled.


### super-determinism

By guess-and-checking different branching seeds we can mine for desirable outcomes. 

We keep re-running the simulation from the branching point, each time inserting a different seed and effectively scrambling the outcome. Before long we stumble upon all of the distinct outcomes we are looking for. At that point we consider this specific starting seed to be "solved". We record the common starting seed and the ten mined branch seeds.

These 11 numbers (1 starting seed + 10 branch seeds) are all the information we need to describe the solved, super-determined simulation. We can also capture some extra info such as the finishing time for each outcome.


### Usage

Start local server and listen for changes in source.

```
npm run dev
```

Check for syntax errors and enforce strong typing.

```
npx tsc
```

Enforce coding style preferences defined in `estlint.config.ts`

```
npx eslint 
```

Run unit tests defined in `tests`

```
npx mocha
```


Validate .vert and .frag shaders

```
npx mocha --grep glsl
```

Test level solutions

```
npx mocha --grep simulation
```

Launch face editor with refrence images in background

```
npx ts-node tools/faces/dev-face-editor.ts
```