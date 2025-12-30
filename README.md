
# pinball-wizard


disk,disk -> (adjust pos), (adjust vel)
disk,normal -> (adjust vel)

for each obstacle
disk -> normal, (adjust pos)


### how does it work


The physics calculations have some special caveats

 - all values are integers 
 - math uses pre-computed lookup table/tree

At run-time, we only add and subtract integers. All complex math is replaced by a lookup table.

The state of each disk is represented by four integers.

State of one sliding disk
 - position: 39000, 68000
 - velocity: 30, -100

A collision between two disks is also four integers

Collision between two disks
 - relative position: -3000,1000
 - relative velocity: 90,20

In reponse to a collision we should come up with four other integers to simulate a bounce

Bounce following collision
 - position adjustment: -1000,10
 - velocity adjustment: -90,10

 These adjustments will be added to one disk and subtracted from the other. This should cause them to no longer overlap and to exchange momentum realistically.

So our lookup function looks like this:
collision => bounce
(four integers) => (four integers)


# Collision lookup tree

collision => bounce
(four integers) => (four integers)

 The tree branches four times. We pick branches using the collision values - x,y,vx,vy. Then we arrive at a leaf with pre-computed bounce values. 
 
 We also includes some leaves with all-zero/null to represent non-collisions. This way we can treat disks as squares to detect possible collisions, then rely on the lookup table to decide if the actual circles collided. 
 
 We also set a convenient square limit around the relative velocity values for the purposes of collisions. Separately from the collision logic, we enforce smaller circular limit for any disk's velocity.
 
 Now we can just consider a 4D rectangle of possible collisions. Since we are using only integers there are a finite number of points in the space.
 
 Still we have to bin the space down to a rougher grid with a detail level somewhere between 20^4 and 100^4 collisions. Around here it looks accurate and fits in memory.  We precompute all the possible bounce values, round them to integers, and lay them out in a tree.

# Obstacles' lookup trees

For each obstacle, we identify the bounding rectangle with an extra disk-radius of padding. This rectangle contains all the possible disk-locations that could collide with the obstacle. Since we are using only integers, there are a finite number of points.

Still we have to bin the 2D area down to a rougher grid with detail level similar to the pixels on the screen. At each point we
 - check if it is enclosed by the obstacle
 - locate the nearest point on the edge of the obstacle
 - decide if it is a collision
 - compute normal

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