


import itertools
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.animation import FuncAnimation
from .constants import VALUE_SCALE, DISK_RADIUS
from .step import active_step
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


# special animation for time travel loop
def sim_loop_pyplot_animation(
    sim, extra_sim,
    step_limit=1e10,
    colors=None,
    static_circles=None,
    steps_per_frame=10,
    figsize=(5, 5),
):

    sims = [sim,extra_sim]
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
    
    # Initial view centered on first disk
    view_width = max_w
    view_height = max_h
    ax.set_xlim(-view_width/2, view_width/2)
    ax.set_ylim(-view_height/2, view_height/2)
    ax.set_xticks([])
    ax.set_yticks([])
    ax.set_xticklabels([])
    ax.set_yticklabels([])
    
    # Add static rectangle showing sim bounds
    from matplotlib.patches import Rectangle
    bounds_rect = Rectangle(
        (0, 0), max_w, max_h,
        fill=False, edgecolor='gray', linewidth=2, linestyle='--',
        zorder=-1
    )
    ax.add_patch(bounds_rect)

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
            if 'label' in sc_def:
                ax.text(
                    sc_def['x'], max_h - sc_def['y'],
                    sc_def['label'],
                    ha='center', va='center',
                    zorder=1,
                )

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

    focus_disk_index = 0
    focus_sim_index = 0
    def animate(frame):
        nonlocal focus_disk_index
        nonlocal focus_sim_index
        for idx, sim in enumerate(sims):
            for _ in range(steps_per_frame):
                if idx == 0 and sim.entered_portal_on_step != -1:
                    focus_disk_index = 1 # focus post-loop disk
                    focus_sim_index = 1 # focus extra sim that froze at spawn time
                    break
                if focus_sim_index == 0 and idx == 1 and sim.step_count >= sim.spawn_on_step:
                    break # this is the extra sim, reached spawn time, now waiting for loop
                if sim.step_count >= step_limit:
                    break
                active_step(sim)
        
        # Center view on first disk of first sim
        center_disk = sims[focus_sim_index].disks[focus_disk_index]
        center_x = center_disk.current_state.x
        center_y = max_h - center_disk.current_state.y
        
        # Update axis limits to center on disk
        ax.set_xlim(center_x - view_width/2, center_x + view_width/2)
        ax.set_ylim(center_y - view_height/2, center_y + view_height/2)
        
        # Update bounds rectangle to follow camera (stays in sim coords)
        bounds_rect.set_xy((0, 0))
        
        # Update disk positions (in sim coordinates)
        for idx, sim in enumerate(sims):
            if idx == focus_sim_index:
                scatters[idx].set_offsets(
                    [[d.current_state.x, max_h - d.current_state.y] for d in sim.disks]
                )
            else:
                scatters[idx].set_offsets(
                    [[-1e10,-1e10] for d in sim.disks]
                )
        
        ax.set_title(f"step {sims[focus_sim_index].step_count}")
        return tuple(scatters) + (bounds_rect,)

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
            label        – text label     (optional)
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
            if 'label' in sc_def:
                ax.text(
                    sc_def['x'], max_h - sc_def['y'],
                    sc_def['label'],
                    ha='center', va='center',
                    zorder=1,
                )

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
                [[d.current_state.x, max_h - d.current_state.y] for d in sim.disks]
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

def sim_pyplot(
    sims,
    step_count=1000,
    colors=None,
    static_circles=None,
    figsize=(5, 5),
    show_paths=True,
):
    """Create a static plot of simulation(s) after step_count steps.

    Parameters
    ----------
    sims : Simulation or list[Simulation]
        One simulation or a list of simulations to plot together.
    step_count : int
        Number of steps to simulate before plotting.
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
            label        – text label     (optional)
    figsize : tuple
        Figure size passed to plt.figure.
    show_paths : bool
        Whether to plot the path trajectories of each disk.
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
            if 'label' in sc_def:
                ax.text(
                    sc_def['x'], max_h - sc_def['y'],
                    sc_def['label'],
                    ha='center', va='center',
                    zorder=1,
                )

    # ── simulate and collect positions ──────────────────────────────
    for idx, sim in enumerate(sims):
        # Collect path data for each disk
        paths = [[] for _ in range(sim.n_disks)]
        
        for step in range(step_count):
            if sim.step_count >= step_count:
                break
            active_step(sim)
            # Record positions
            for disk_idx, disk in enumerate(sim.disks):
                paths[disk_idx].append((disk.current_state.x, max_h - disk.current_state.y))

        # Plot paths
        face, edge = _resolve_colors(colors[idx], sim.n_disks)
        if show_paths:
            for disk_idx, path in enumerate(paths):
                if len(path) > 1:
                    path_arr = np.array(path)
                    ax.plot(path_arr[:, 0], path_arr[:, 1], 
                           color=edge[disk_idx], alpha=0.3, linewidth=0.5, zorder=idx)

        # Plot final positions
        final_x = [d.current_state.x for d in sim.disks]
        final_y = [max_h - d.current_state.y for d in sim.disks]
        
        ax.scatter(
            final_x, final_y,
            s=DISK_RADIUS ** 0.6,
            alpha=0.3,
            edgecolors=edge,
            color=face,
            zorder=idx + 10,
            label=f"sim {idx}",
        )

    ax.set_title(f"Final positions after {step_count} steps")
    
    return fig