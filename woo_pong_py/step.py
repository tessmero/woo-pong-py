
import numpy as np

from woo_pong_py.prng import PRNG, perturb_disk

from .constants import BOUNDS_H, BOUNDS_W, BOUNDS_X, BOUNDS_Y, DISK_RADIUS, MAX_AXIS_SPEED, MAX_OFFSET, OFFSET_DETAIL, SPEED_DETAIL, VALUE_SCALE


class obj:
    def __init__(self, d):
        for k, v in d.items():
            if isinstance(v, (list, tuple)):
                setattr(self, k, [obj(x) if isinstance(x, dict) else x for x in v])
            else:
                setattr(self, k, obj(v) if isinstance(v, dict) else v)



def offset_to_index(offset):
  return int(np.floor(offset * OFFSET_DETAIL / MAX_OFFSET))

def speed_to_index(speed):
  return int(np.floor(speed * SPEED_DETAIL / MAX_AXIS_SPEED))

def collide_disks(a, b, DISK_DISK_LUT):
  # index based on relative position
  dxi = offset_to_index(b.current_state.x - a.current_state.x)
  dyi = offset_to_index(b.current_state.y - a.current_state.y)

  if abs(dxi) > OFFSET_DETAIL:
    return False
  if abs(dyi) > OFFSET_DETAIL:
    return False

  # index based on relative velocity
  vxi = speed_to_index(b.current_state.dx - a.current_state.dx)
  vyi = speed_to_index(b.current_state.dy - a.current_state.dy)

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

  a.next_state.x -= cx
  a.next_state.y -= cy
  b.next_state.x += cx
  b.next_state.y += cy
  a.next_state.dx -= cdx
  a.next_state.dy -= cdy
  b.next_state.dx += cdx
  b.next_state.dy += cdy
  
  return True


def push_in_x_bounds(state):
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
  return bounced

def push_in_y_bounds(state):
  # Clamp disk position to within bounds, and reflect velocity if out of bounds
  bounced = False
  if state.y < BOUNDS_Y + DISK_RADIUS:
    state.y = BOUNDS_Y + DISK_RADIUS
    state.dy = abs(state.dy)
    bounced = True
  elif state.y > BOUNDS_Y + BOUNDS_H - DISK_RADIUS:
    state.y = BOUNDS_Y + BOUNDS_H - DISK_RADIUS
    state.dy = -abs(state.dy)
    bounced = True
  return bounced


def advance(disk):
    disk.next_state.x = disk.current_state.x + disk.current_state.dx
    disk.next_state.y = disk.current_state.y + disk.current_state.dy

def flush_states(disks):
    for disk in disks:
        disk.current_state.x = disk.next_state.x
        disk.current_state.y = disk.next_state.y
        disk.current_state.dx = disk.next_state.dx
        disk.current_state.dy = disk.next_state.dy

def active_step(sim):
    
    if sim.step_count == sim.branch_on_step:
        sim.prng = PRNG(sim.branch_seed)

    if sim.step_count == sim.spawn_on_step:
       sim.disks.append(obj({
            "current_state": {
                "x":sim.spawn_x,"y":sim.spawn_y,
                "dx":0,"dy":0
            },
            "next_state": {
               "x":0,"y":0,
               "dx":sim.spawn_dx,"dy":sim.spawn_dy
            },
        }))


    # Collide disks with barriers (not present)
    for disk in sim.disks:

        advance(disk)
        push_in_x_bounds(disk.next_state) # force in bounds and bounce

        # either bounce off over floor/ceiling or loop vertically
        if sim.is_loop:
          if sim.entered_portal_on_step == -1 and disk.next_state.y >= 100 * VALUE_SCALE:
            sim.entered_portal_on_step = sim.step_count
            #  disk.next_state.y -= 100 * VALUE_SCALE
        else:
           push_in_y_bounds(disk.next_state)

        perturb_disk(disk.next_state, sim.prng)
        
        # gravity
        disk.next_state.dx += sim.gravity_x
        disk.next_state.dy += sim.gravity_y  

    # Collide disks with disks
    for a in range(1, len(sim.disks)):
        for b in range(a):
            if collide_disks(sim.disks[a], sim.disks[b], sim.DISK_DISK_LUT):
               sim.has_collided = True

    flush_states(sim.disks)  # commit updates after collisions
    sim.step_count += 1
