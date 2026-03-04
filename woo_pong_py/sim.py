
from .constants import DISK_RADIUS, VALUE_SCALE

from .prng import PRNG


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
        self.gravity_x = 0
        self.gravity_y = 1

        x0 = DISK_RADIUS
        x1 = self.width - DISK_RADIUS

        # pick random x or y axis value to position disk
        random_coord = lambda: x0 + (self.prng.next_int() & 0xFFFFFFFF) % (x1-x0)
        random_speed = lambda: -1000 + (self.prng.next_int() & 0xFFFFFFFF) % (2000)
        random_disk = lambda: obj({
            "current_state": {
                "x":random_coord(),"y":random_coord(),
                "dx":0,"dy":0
            },
            "next_state": {
               "x":0,"y":0,
               "dx":random_speed(),"dy":random_speed()
            }
        })
        self.disks = [
            random_disk() for i in range(n_disks)
        ]
        self.winning_disk_index = -1
        self.step_count = 0

        # optional branching event
        self.branch_on_step = -1
        self.branch_seed = 0

        # optional time-loop with spawning event
        self.is_loop = False
        self.spawn_on_step = -1
        self.spawn_x = 0
        self.spawn_y = 0
        self.spawn_dx = 0
        self.spawn_dy = 0

        self.has_collided = False
        self.entered_portal_on_step = -1