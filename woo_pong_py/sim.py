
import numpy as np

# Assumptions:
# - DISK_DISK_LUT.lut is a numpy array of shape (21, 21, 41, 41, 4)
# - DISK_RADIUS is defined
# - Each disk has .currentState and .nextState, each with x, y, dx, dy

DISK_RADIUS = 40000
OFFSET_DETAIL = 10
SPEED_DETAIL = 20
MAX_OFFSET = 2 * DISK_RADIUS
MAX_AXIS_SPEED = 1e2 * SPEED_DETAIL

def offset_to_index(offset):
  return int(np.floor(offset * OFFSET_DETAIL / MAX_OFFSET))

def speed_to_index(speed):
  return int(np.floor(speed * SPEED_DETAIL / MAX_AXIS_SPEED))

def collide_disks(a, b, DISK_DISK_LUT):
  # index based on relative position
  dxi = offset_to_index(b.currentState.x - a.currentState.x)
  dyi = offset_to_index(b.currentState.y - a.currentState.y)

  if abs(dxi) > OFFSET_DETAIL:
    return False
  if abs(dyi) > OFFSET_DETAIL:
    return False

  # index based on relative velocity
  vxi = speed_to_index(b.currentState.dx - a.currentState.dx)
  vyi = speed_to_index(b.currentState.dy - a.currentState.dy)

  if abs(vxi) > SPEED_DETAIL:
    vxi = SPEED_DETAIL * np.sign(vxi)
  if abs(vyi) > SPEED_DETAIL:
    vyi = SPEED_DETAIL * np.sign(vyi)

  # Shift indices to [0, size)
  dxi += OFFSET_DETAIL
  dyi += OFFSET_DETAIL
  vxi += SPEED_DETAIL
  vyi += SPEED_DETAIL

  # Check bounds
  if not (0 <= dxi < 2*OFFSET_DETAIL+1 and 0 <= dyi < 2*OFFSET_DETAIL+1 and 0 <= vxi < 2*SPEED_DETAIL+1 and 0 <= vyi < 2*SPEED_DETAIL+1):
    return False

  cell = DISK_DISK_LUT.lut[dxi, dyi, vxi, vyi]
  cx, cy, cdx, cdy = cell

  if np.isnan(cx):
    return False  # no collision (near-miss)

  a.nextState.x -= cx
  a.nextState.y -= cy
  b.nextState.x += cx
  b.nextState.y += cy
  a.nextState.dx -= cdx
  a.nextState.dy -= cdy
  b.nextState.dx += cdx
  b.nextState.dy += cdy
  
  return True



VALUE_SCALE = 10000
DISK_RADIUS = 40000
BOUNDS_X = 0
BOUNDS_Y = 0
BOUNDS_W = 100 * VALUE_SCALE
BOUNDS_H = 100 * VALUE_SCALE

def pushInBounds(state):
  # Clamp disk position to within bounds, and reflect velocity if out of bounds
  bounced = False
  if state.x < BOUNDS_X + DISK_RADIUS:
    state.x = BOUNDS_X + DISK_RADIUS
    state.dx = abs(state.dx)
    bounced = True
  elif state.x > BOUNDS_X + BOUNDS_W - DISK_RADIUS:
    state.x = BOUNDS_X + BOUNDS_W - DISK_RADIUS
    state.dx = -abs(state.dx)
    bounced = True
  if state.y < BOUNDS_Y + DISK_RADIUS:
    state.y = BOUNDS_Y + DISK_RADIUS
    state.dy = abs(state.dy)
    bounced = True
  elif state.y > BOUNDS_Y + BOUNDS_H - DISK_RADIUS:
    state.y = BOUNDS_Y + BOUNDS_H - DISK_RADIUS
    state.dy = -abs(state.dy)
    bounced = True
  return bounced
import numpy as np

# Assumptions:
# - sim.disks: list of Disk objects, each with .currentState and .nextState (with x, y, dx, dy)
# - sim.winningDiskIndex, sim.maxBallY, sim.finish, sim._stepCount exist
# - collide_disks(a, b, DISK_DISK_LUT) is available
# - No obstacles, no rooms
p_dict = {
  "minSpeed": 10,
  "state": 0,
}


class PRNG:
  def __init__(self,seed):
    self.state = int(seed) or 1

  def nextInt(self):
    self.state ^= (self.state << 13) & 0xFFFFFFFF
    self.state ^= (self.state >> 17)
    self.state ^= (self.state << 5) & 0xFFFFFFFF
    self.state &= 0xFFFFFFFF
    return self.state


def perturbDisk(state, prng):
  # dx
  if abs(state.dx) > p_dict["minSpeed"]:
    d6 = (prng.nextInt() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dx += 1
    elif d6 == 1:
      state.dx -= 1
  # dy
  if abs(state.dy) > p_dict["minSpeed"]:
    d6 = (prng.nextInt() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dy += 1
    elif d6 == 1:
      state.dy -= 1

def advance(disk):
    disk.nextState.x = disk.currentState.x + disk.currentState.dx
    disk.nextState.y = disk.currentState.y + disk.currentState.dy

def flushStates(disks):
    for disk in disks:
        disk.currentState.x = disk.nextState.x
        disk.currentState.y = disk.nextState.y
        disk.currentState.dx = disk.nextState.dx
        disk.currentState.dy = disk.nextState.dy

def active_step(sim):
    # Collide disks with barriers (not present)
    for disk in sim.disks:
        advance(disk)
        pushInBounds(disk.nextState) # force in bounds and bounce
        # perturbDisk(disk.nextState, self.prng)
        disk.nextState.dy += 1  # gravity

    # Collide disks with disks
    for a in range(1, len(sim.disks)):
        for b in range(a):
            collide_disks(sim.disks[a], sim.disks[b], sim.DISK_DISK_LUT)

    flushStates(sim.disks)  # commit updates after collisions
    sim.step_count += 1

class obj:
    def __init__(self, d):
        for k, v in d.items():
            if isinstance(v, (list, tuple)):
                setattr(self, k, [obj(x) if isinstance(x, dict) else x for x in v])
            else:
                setattr(self, k, obj(v) if isinstance(v, dict) else v)


class Simulation:
    def __init__(self, 
        DISK_DISK_LUT,
        seed = 0, 
        n_disks = 10,
        width = 100 * VALUE_SCALE, 
        height = 100 * VALUE_SCALE
    ):
        self.DISK_DISK_LUT = DISK_DISK_LUT
        self.n_disks = n_disks
        self.width = width
        self.height = height
        self.prng = PRNG(seed)

        x0 = DISK_RADIUS
        x1 = self.width - DISK_RADIUS

        # pick random x or y axis value to position disk
        random_coord = lambda: x0 + (self.prng.nextInt() & 0xFFFFFFFF) % (x1-x0)
        random_speed = lambda: -1000 + (self.prng.nextInt() & 0xFFFFFFFF) % (2000)
        random_disk = lambda: obj({
            "currentState": {
                "x":random_coord(),"y":random_coord(),
                "dx":0,"dy":0
            },
            "nextState": {"x":1,"y":1,"dx":random_speed(),"dy":random_speed()}
        })
        self.disks = [
            random_disk() for i in range(n_disks)
        ]
        self.winning_disk_index = -1
        self.step_count = 0

