

p_dict = {
  "minSpeed": 10,
  "state": 0,
}


class PRNG:
  def __init__(self,seed):
    self.state = int(seed) or 1

  def next_int(self):
    self.state ^= (self.state << 13) & 0xFFFFFFFF
    self.state ^= (self.state >> 17)
    self.state ^= (self.state << 5) & 0xFFFFFFFF
    self.state &= 0xFFFFFFFF
    return self.state


def perturb_disk(state, prng):
  # dx
  if abs(state.dx) > p_dict["minSpeed"]:
    d6 = (prng.next_int() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dx += 1
    elif d6 == 1:
      state.dx -= 1
  # dy
  if abs(state.dy) > p_dict["minSpeed"]:
    d6 = (prng.next_int() & 0xFFFFFFFF) % 6
    if d6 == 0:
      state.dy += 1
    elif d6 == 1:
      state.dy -= 1