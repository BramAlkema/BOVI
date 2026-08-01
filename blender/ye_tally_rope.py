"""Ye Tally Rope — the conservation mechanism as a moving 3D thing.

Builds the device from the original sketch: a round table, five knights, ten
pegs (five fixed in a central ring, five variable on marked rails), and a single
wire loop threaded around them. Because the wire is one closed loop of fixed
length, a variable peg can only move *out* toward its knight if the others are
released *in* — conservation, made physical. As the pegs settle, their positions
on the marked rails are the exchange rates.

The wire is a poly curve whose control points are bound to the pegs with HOOK
modifiers, so it follows them on playback and in renders with no scripting at
run time. The variable pegs are keyframed so the sum of their radii is conserved
at every beat: one knight "demands", its peg slides out, the other four retract.

Run:
    blender --background --factory-startup --python ye_tally_rope.py
    blender --background --factory-startup --python ye_tally_rope.py -- stills
    blender --background --factory-startup --python ye_tally_rope.py -- anim
Opening the saved .blend and pressing Space/▶ plays the mechanism.
"""

import sys
import math
from pathlib import Path

import bpy
from mathutils import Matrix

# ----------------------------------------------------------------------------- config
HERE = Path(__file__).resolve().parent
BLEND_PATH = str(HERE / "ye-tally-rope.blend")
PREVIEW_DIR = HERE / "preview"
RENDER_DIR = HERE / "render"

N = 5                       # knights / arms
R_TABLE = 3.7
TABLE_H = 0.2
TABLE_TOP = TABLE_H / 2

R_FIX = 0.80                # radius of the fixed central-ring pegs
R_VAR_BASE = 2.35           # rest radius of the variable pegs
AMP = 0.62                  # how far a "demanded" peg slides out
IN = AMP / (N - 1)          # each other peg retracts this much (sum conserved)

RAIL_IN, RAIL_OUT = 1.05, 3.25
PEG_H_FIX, PEG_H_VAR = 0.60, 0.72
WIRE_Z = 0.50
FPS = 24
# beat frames and which knight "demands" at each (rest → ... → rest, loopable)
BEATS = [(1, None), (40, 0), (80, 2), (120, 4), (160, 1), (200, 3), (240, None)]
FRAME_END = BEATS[-1][0]

ANG = [math.radians(90 + 360 / N * i) for i in range(N)]          # variable-peg arms
ANG_FIX = [math.radians(90 + 360 / N * i + 360 / (2 * N)) for i in range(N)]  # ring pegs


# ----------------------------------------------------------------------------- helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, rough=0.5, metal=0.0, emit=None, emit_str=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")

    def setin(k, v):
        if b and k in b.inputs:
            try:
                b.inputs[k].default_value = v
            except Exception:
                pass

    setin("Base Color", (*color, 1))
    setin("Roughness", rough)
    setin("Metallic", metal)
    if emit is not None:
        setin("Emission Color", (*emit, 1))
        setin("Emission Strength", emit_str)
    return m


def cyl(name, radius, depth, loc, material=None, verts=48):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return o


def cone(name, radius, depth, loc, material=None, verts=24):
    bpy.ops.mesh.primitive_cone_add(radius1=radius, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return o


def box(name, dims, loc, rotz=0.0, material=None):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (dims[0] / 2, dims[1] / 2, dims[2] / 2)
    o.rotation_euler = (0, 0, rotz)
    if material:
        o.data.materials.append(material)
    return o


def polar(r, a, z):
    return (r * math.cos(a), r * math.sin(a), z)


# ----------------------------------------------------------------------------- build
def build():
    reset()

    M = {
        "table": mat("Table", (0.30, 0.20, 0.11), rough=0.75),
        "rail": mat("Rail", (0.55, 0.55, 0.58), rough=0.4, metal=0.8),
        "tick": mat("Tick", (0.12, 0.12, 0.14), rough=0.6),
        "fix": mat("FixedPeg", (0.42, 0.18, 0.62), rough=0.35, metal=0.2, emit=(0.30, 0.10, 0.55), emit_str=0.5),
        "var": mat("VarPeg", (0.10, 0.62, 0.32), rough=0.30, metal=0.2, emit=(0.05, 0.55, 0.22), emit_str=0.8),
        "rope": mat("Rope", (0.80, 0.63, 0.37), rough=0.92),
        "knight": mat("Knight", (0.38, 0.27, 0.17), rough=0.7),
    }

    # table
    cyl("Table", R_TABLE, TABLE_H, (0, 0, 0), M["table"], verts=96)

    # fixed central-ring pegs (static anchors)
    fixed_pegs = []
    for i in range(N):
        loc = polar(R_FIX, ANG_FIX[i], TABLE_TOP + PEG_H_FIX / 2)
        fixed_pegs.append(cyl(f"FixedPeg_{i}", 0.14, PEG_H_FIX, loc, M["fix"]))

    # rails + tick marks + variable pegs + knights
    var_pegs = []
    for i in range(N):
        a = ANG[i]
        mid = (RAIL_IN + RAIL_OUT) / 2
        box(f"Rail_{i}", (RAIL_OUT - RAIL_IN, 0.16, 0.08),
            polar(mid, a, TABLE_TOP + 0.04), rotz=a, material=M["rail"])

        r = RAIL_IN + 0.18
        k = 0
        while r <= RAIL_OUT - 0.05:
            box(f"Tick_{i}_{k}", (0.045, 0.20, 0.11),
                polar(r, a, TABLE_TOP + 0.05), rotz=a, material=M["tick"])
            r += 0.275
            k += 1

        peg = cyl(f"VarPeg_{i}", 0.16, PEG_H_VAR,
                  polar(R_VAR_BASE, a, TABLE_TOP + PEG_H_VAR / 2), M["var"])
        var_pegs.append(peg)

        # a knight (cone) seated just beyond the rim, facing in
        cone(f"Knight_{i}", 0.30, 0.85, polar(R_TABLE + 0.55, a, 0.55), M["knight"])

    build_wire(fixed_pegs, var_pegs, M["rope"])
    animate(var_pegs)
    stage()
    return fixed_pegs, var_pegs


def wrap_points(C, r, beta, half, k, prevC):
    """k points on a peg's circle (centre C, radius r) spanning the arc
    beta±half, ordered so the first point is the one nearer the previous peg —
    so the loop flows in, wraps the post, and out without crossing it."""
    bs = [beta - half + (2 * half) * (j / (k - 1)) for j in range(k)]
    pts = [(C[0] + r * math.cos(b), C[1] + r * math.sin(b)) for b in bs]
    d_first = (pts[0][0] - prevC[0]) ** 2 + (pts[0][1] - prevC[1]) ** 2
    d_last = (pts[-1][0] - prevC[0]) ** 2 + (pts[-1][1] - prevC[1]) ** 2
    if d_first > d_last:
        pts.reverse()
    return pts


def build_wire(fixed_pegs, var_pegs, rope_mat):
    """A single closed loop that wraps AROUND the outside of the variable pegs
    and the inside of the fixed pegs (the five-point star). Each control point is
    a point on a peg's circumference, hooked rigidly to that peg — so the rope
    rides on the posts, never through them, and follows them as they move."""
    seq = []  # loop order: (peg, centre_xy, kind, outward_bearing)
    for i in range(N):
        seq.append((var_pegs[i], (R_VAR_BASE * math.cos(ANG[i]), R_VAR_BASE * math.sin(ANG[i])), "var", ANG[i]))
        seq.append((fixed_pegs[i], (R_FIX * math.cos(ANG_FIX[i]), R_FIX * math.sin(ANG_FIX[i])), "fix", ANG_FIX[i]))
    m = len(seq)

    pts, point_peg = [], []
    for idx, (peg, C, kind, ang) in enumerate(seq):
        prevC = seq[(idx - 1) % m][1]
        if kind == "var":                                   # wrap the OUTER side
            ride, beta, half, k = 0.16 + 0.07, ang, math.radians(118), 6
        else:                                               # wrap the INNER side
            ride, beta, half, k = 0.14 + 0.07, ang + math.pi, math.radians(72), 5
        for p in wrap_points(C, ride, beta, half, k, prevC):
            pts.append(p)
            point_peg.append(peg)

    cu = bpy.data.curves.new("WireCurve", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.05
    cu.bevel_resolution = 4
    cu.fill_mode = "FULL"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for j, (x, y) in enumerate(pts):
        sp.points[j].co = (x, y, WIRE_Z, 1.0)
    sp.use_cyclic_u = True

    wire = bpy.data.objects.new("Wire", cu)
    bpy.context.scene.collection.objects.link(wire)
    wire.data.materials.append(rope_mat)

    bpy.context.view_layer.update()
    for j, peg in enumerate(point_peg):
        h = wire.modifiers.new(name=f"Hook_{j}", type="HOOK")
        h.object = peg
        h.falloff_type = "NONE"
        h.strength = 1.0
        h.vertex_indices_set([j])
        h.matrix_inverse = peg.matrix_world.inverted()
    return wire


def animate(var_pegs):
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = FRAME_END
    sc.render.fps = FPS
    for frame, demand in BEATS:
        for i, peg in enumerate(var_pegs):
            r = R_VAR_BASE + (AMP if i == demand else (-IN if demand is not None else 0.0))
            x, y, _ = polar(r, ANG[i], 0)
            peg.location = (x, y, peg.location.z)
            peg.keyframe_insert("location", frame=frame)


def stage():
    tgt = bpy.data.objects.new("CenterTarget", None)
    tgt.location = (0, 0, 0.45)
    bpy.context.scene.collection.objects.link(tgt)

    def track(obj):
        c = obj.constraints.new("TRACK_TO")
        c.target = tgt
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"

    # camera
    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 55
    cam = bpy.data.objects.new("Camera", cam_d)
    cam.location = (5.4, -6.2, 5.7)
    bpy.context.scene.collection.objects.link(cam)
    track(cam)
    bpy.context.scene.camera = cam

    # three-point lighting rig — soft area lights, all aimed at the centre
    def area(name, loc, energy, size):
        d = bpy.data.lights.new(name, "AREA")
        d.energy = energy
        d.size = size
        o = bpy.data.objects.new(name, d)
        o.location = loc
        bpy.context.scene.collection.objects.link(o)
        track(o)
        return o

    area("Key",  (-6.5, -5.5, 7.5), 2200, 6)   # main — front-left, high
    area("Fill", ( 8.0, -3.5, 3.6),  650, 9)   # fill — camera side, low, soft
    area("Back", (-1.5,  7.5, 6.5), 1700, 4)   # rim — behind subject, separation

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.80, 0.80, 0.82, 1)
        bg.inputs[1].default_value = 0.45   # modest ambient so the rig does the shaping
    bpy.context.scene.world = world


def pick_engine():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    for cand in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        if cand in items:
            return cand
    return items[0]


def setup_render(res=(1000, 640)):
    sc = bpy.context.scene
    sc.render.engine = pick_engine()
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    return sc


def render_stills():
    sc = setup_render()
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for f in (1, 80, 160):
        sc.frame_set(f)
        sc.render.filepath = str(PREVIEW_DIR / f"frame_{f:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"  rendered still {f}")


def render_anim():
    sc = setup_render(res=(960, 600))
    RENDER_DIR.mkdir(parents=True, exist_ok=True)
    sc.render.image_settings.file_format = "FFMPEG"
    sc.render.ffmpeg.format = "MPEG4"
    sc.render.ffmpeg.codec = "H264"
    sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
    sc.render.filepath = str(RENDER_DIR / "ye-tally-rope.mp4")
    bpy.ops.render.render(animation=True)
    print(f"  rendered animation -> {sc.render.filepath}")


# ----------------------------------------------------------------------------- main
def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    build()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"saved {BLEND_PATH}  (frames 1-{FRAME_END} @ {FPS}fps)")
    if "stills" in argv:
        render_stills()
    if "anim" in argv:
        render_anim()


if __name__ == "__main__":
    main()
