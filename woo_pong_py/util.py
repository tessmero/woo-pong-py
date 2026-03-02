

DISK_RADIUS = 40000

import itertools
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.animation import FuncAnimation
from .sim import active_step, VALUE_SCALE

# Default palette used when no colors are supplied
_DEFAULT_COLORS = ['blue', 'red', 'green', 'orange', 'purple', 'brown', 'pink', 'cyan']

def _resolve_colors(base_color, n_disks):
    """Return (face_colors, edge_colors) lists for *n_disks*.

    Disk 0 gets the full base_color with a black edge; the rest get a
    lighter tint with the base_color as edge.
    """
    try:
        rgba = np.array(mcolors.to_rgba(base_color))
    except ValueError:
        rgba = np.array(mcolors.to_rgba('blue'))
    light = rgba * 0.45 + np.array([1, 1, 1, 1]) * 0.55  # tint toward white
    face = [rgba.tolist()] + [light.tolist()] * (n_disks - 1)
    edge = ['black'] + [rgba.tolist()] * (n_disks - 1)
    return face, edge


def sim_pyplot_animation(
    sims,
    step_limit=1e10,
    colors=None,
    static_circles=None,
    steps_per_frame=10,
    figsize=(5, 5),
):
    """Animate one or more simulations superimposed on the same axes.

    Parameters
    ----------
    sims : Simulation or list[Simulation]
        One simulation or a list of simulations to animate together.
    step_limit : float
        Stop each sim after this many steps.
    colors : str or list[str], optional
        Base color per simulation (e.g. 'red', '#00ff00').  Cycles through
        a default palette when omitted.
    static_circles : list[dict], optional
        Extra fixed circles drawn once.  Each dict should contain:
            x, y        – position (in sim coords)
            radius       – circle radius  (default DISK_RADIUS)
            color        – fill color     (default 'gray')
            edgecolor    – edge color     (default 'black')
            alpha        – opacity        (default 0.4)
    steps_per_frame : int
        Simulation steps advanced per animation frame.
    figsize : tuple
        Figure size passed to plt.figure.
    """

    # ── normalise inputs ────────────────────────────────────────────
    if not isinstance(sims, (list, tuple)):
        sims = [sims]

    n_sims = len(sims)

    if colors is None:
        colors = [_DEFAULT_COLORS[i % len(_DEFAULT_COLORS)] for i in range(n_sims)]
    elif isinstance(colors, str):
        colors = [colors]
    while len(colors) < n_sims:
        colors.append(_DEFAULT_COLORS[len(colors) % len(_DEFAULT_COLORS)])

    # ── figure / axes ───────────────────────────────────────────────
    fig = plt.figure(figsize=figsize)
    ax = fig.add_subplot()

    max_w = max(s.width for s in sims)
    max_h = max(s.height for s in sims)
    ax.set_xlim(0, max_w)
    ax.set_ylim(0, max_h)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_xticklabels([])
    ax.set_yticklabels([])

    # ── static circles ──────────────────────────────────────────────
    if static_circles:
        for sc_def in static_circles:
            c = plt.Circle(
                (sc_def['x'], max_h - sc_def['y']),
                sc_def.get('radius', DISK_RADIUS),
                color=sc_def.get('color', 'gray'),
                ec=sc_def.get('edgecolor', 'black'),
                alpha=sc_def.get('alpha', 0.4),
                zorder=0,
            )
            ax.add_patch(c)

    # ── one scatter artist per simulation ───────────────────────────
    scatters = []
    for idx, sim in enumerate(sims):
        face, edge = _resolve_colors(colors[idx], sim.n_disks)
        sc = ax.scatter(
            range(sim.n_disks), range(sim.n_disks),
            s=DISK_RADIUS ** 0.6,
            edgecolors=edge,
            color=face,
            zorder=idx + 1,
            label=f"sim {idx}",
        )
        scatters.append(sc)

    # ax.legend(loc='upper right', fontsize='x-small', framealpha=0.6)

    # ── animation helpers ───────────────────────────────────────────
    def frames():
        for i in itertools.count():
            if all(s.step_count >= step_limit for s in sims):
                break
            yield i

    def animate(frame):
        for idx, sim in enumerate(sims):
            for _ in range(steps_per_frame):
                if sim.step_count >= step_limit:
                    break
                active_step(sim)
            scatters[idx].set_offsets(
                [[d.currentState.x, max_h - d.currentState.y] for d in sim.disks]
            )
        ax.set_title(f"step {max(s.step_count for s in sims)}")
        return tuple(scatters)

    ani = FuncAnimation(
        fig,
        animate,
        frames=frames(),
        interval=20,
        repeat=False,
        cache_frame_data=False,
        save_count=None,
    )

    return ani
