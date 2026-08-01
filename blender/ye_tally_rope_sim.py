"""Ye Tally Rope — physically simulated rope (rigid-body capsule chain).

Upgrade of ye_tally_rope.py: instead of a hooked curve, the wire is a CLOSED
loop of rigid-body sphere/capsule segments joined by POINT constraints — an
inextensible, self-colliding rope (the technique from priyasundaresan/
blender-rope-sim, ported to Blender 5.x with procedural segments).

The loop is seeded already wrapped around the posts (along the star path). The
fixed pegs are PASSIVE colliders; the variable pegs are KINEMATIC colliders
driven by keyframes. Gravity is off, so it is a pure in-plane mechanism: when a
knight "demands" and its peg slides out, the post drags the rope, and because the
loop is a fixed-length closed chain, slack is pulled from the released arms —
conservation, simulated rather than faked. Then the cache is baked.

Run:
    blender --background --factory-startup --python ye_tally_rope_sim.py -- stills
    blender --background --factory-startup --python ye_tally_rope_sim.py -- anim
"""

import sys
import math
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
BLEND_PATH = str(HERE / "ye-tally-rope-sim.blend")
PREVIEW_DIR = HERE / "preview_sim"
RENDER_DIR = HERE / "render"

# ----------------------------------------------------------------------------- config
N = 5
R_TABLE = 3.7
TABLE_H = 0.2
TABLE_TOP = TABLE_H / 2
R_FIX = 0.80
R_VAR_BASE = 2.35
AMP = 0.62
IN = AMP / (N - 1)
RAIL_IN, RAIL_OUT = 1.05, 3.25
PEG_R_FIX, PEG_R_VAR = 0.14, 0.16
PEG_H_FIX, PEG_H_VAR = 0.60, 0.72
WIRE_Z = 0.50
SEG_R = 0.075                 # rope segment radius
FPS = 24
# short validation sequence first (rest -> demand 0 -> demand 2 -> rest)
BEATS = [(1, None), (40, 0), (80, 2), (120, 4), (160, 1), (200, 3), (240, None)]
FRAME_END = BEATS[-1][0]

ANG = [math.radians(90 + 360 / N * i) for i in range(N)]
ANG_FIX = [math.radians(90 + 360 / N * i + 360 / (2 * N)) for i in range(N)]


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


def wrap_points(C, r, beta, half, k, prevC):
    bs = [beta - half + (2 * half) * (j / (k - 1)) for j in range(k)]
    pts = [(C[0] + r * math.cos(b), C[1] + r * math.sin(b)) for b in bs]
    d0 = (pts[0][0] - prevC[0]) ** 2 + (pts[0][1] - prevC[1]) ** 2
    d1 = (pts[-1][0] - prevC[0]) ** 2 + (pts[-1][1] - prevC[1]) ** 2
    if d0 > d1:
        pts.reverse()
    return pts


def star_geometry(radii):
    """Dense xy polyline of the wire wrapping the posts, for given variable-peg
    radii (wraps outer side of variable pegs, inner side of fixed pegs)."""
    seq = []
    for i in range(N):
        seq.append(((radii[i] * math.cos(ANG[i]), radii[i] * math.sin(ANG[i])), "var", ANG[i]))
        seq.append(((R_FIX * math.cos(ANG_FIX[i]), R_FIX * math.sin(ANG_FIX[i])), "fix", ANG_FIX[i]))
    m = len(seq)
    poly = []
    for idx, (C, kind, ang) in enumerate(seq):
        prevC = seq[(idx - 1) % m][0]
        if kind == "var":
            ride, beta, half, k = PEG_R_VAR + SEG_R + 0.015, ang, math.radians(118), 12
        else:
            ride, beta, half, k = PEG_R_FIX + SEG_R + 0.015, ang + math.pi, math.radians(72), 9
        poly.extend(wrap_points(C, ride, beta, half, k, prevC))
    return poly


def star_path(radii=None):
    return star_geometry(radii if radii is not None else [R_VAR_BASE] * N)


def loop_length(radii):
    poly = star_geometry(radii)
    n = len(poly)
    return sum(math.hypot(poly[(i + 1) % n][0] - poly[i][0], poly[(i + 1) % n][1] - poly[i][1]) for i in range(n))


def demand_radii(k):
    """Radii when knight k 'demands': peg k slides out by AMP; the others retract
    by exactly the amount that keeps the total wire length unchanged (conservation)."""
    R0 = R_VAR_BASE
    if k is None:
        return [R0] * N
    L0 = loop_length([R0] * N)
    rk = R0 + AMP
    lo, hi = R0 - 2 * AMP, R0          # how far the others pull in
    for _ in range(48):
        mid = 0.5 * (lo + hi)
        radii = [rk if i == k else mid for i in range(N)]
        if loop_length(radii) > L0:
            hi = mid
        else:
            lo = mid
    return [rk if i == k else 0.5 * (lo + hi) for i in range(N)]


def resample_closed(poly, step):
    n = len(poly)
    cum = [0.0]
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    total = cum[-1]
    count = max(48, int(round(total / step)))
    out = []
    for c in range(count):
        t = total * c / count
        k = 0
        while k < n and cum[k + 1] < t:
            k += 1
        k = min(k, n - 1)
        seg = cum[k + 1] - cum[k]
        f = (t - cum[k]) / (seg if seg > 1e-9 else 1)
        a, b = poly[k], poly[(k + 1) % n]
        out.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
    return out


def rb_world():
    sc = bpy.context.scene
    if sc.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rw = sc.rigidbody_world
    if hasattr(rw, "substeps_per_frame"):
        rw.substeps_per_frame = 12
    if hasattr(rw, "steps_per_second"):
        rw.steps_per_second = 12 * FPS
    rw.solver_iterations = 40
    sc.gravity = (0, 0, 0)
    return rw


def add_rb(obj, kind, shape, mass=1.0, kinematic=False, friction=0.5, damp=0.55):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.rigidbody.object_add()
    rb = obj.rigid_body
    rb.type = kind                       # 'ACTIVE' or 'PASSIVE'
    rb.collision_shape = shape
    rb.friction = friction
    rb.collision_margin = 0.004
    if kind == "ACTIVE":
        rb.mass = mass
        rb.linear_damping = damp
        rb.angular_damping = damp
        rb.kinematic = kinematic
    return rb


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
    rb_world()

    table = cyl("Table", R_TABLE, TABLE_H, (0, 0, 0), M["table"], verts=96)
    add_rb(table, "PASSIVE", "MESH", friction=0.8)

    fixed_pegs, var_pegs = [], []
    for i in range(N):
        loc = polar(R_FIX, ANG_FIX[i], TABLE_TOP + PEG_H_FIX / 2)
        peg = cyl(f"FixedPeg_{i}", PEG_R_FIX, PEG_H_FIX, loc, M["fix"])
        add_rb(peg, "PASSIVE", "CYLINDER", friction=0.4)
        fixed_pegs.append(peg)

    for i in range(N):
        a = ANG[i]
        mid = (RAIL_IN + RAIL_OUT) / 2
        box(f"Rail_{i}", (RAIL_OUT - RAIL_IN, 0.16, 0.08), polar(mid, a, TABLE_TOP + 0.04), rotz=a, material=M["rail"])
        r = RAIL_IN + 0.18
        kk = 0
        while r <= RAIL_OUT - 0.05:
            box(f"Tick_{i}_{kk}", (0.045, 0.20, 0.11), polar(r, a, TABLE_TOP + 0.05), rotz=a, material=M["tick"])
            r += 0.275
            kk += 1
        peg = cyl(f"VarPeg_{i}", PEG_R_VAR, PEG_H_VAR, polar(R_VAR_BASE, a, TABLE_TOP + PEG_H_VAR / 2), M["var"])
        add_rb(peg, "ACTIVE", "CYLINDER", mass=50.0, kinematic=True, friction=0.4)
        var_pegs.append(peg)
        cone(f"Knight_{i}", 0.30, 0.85, polar(R_TABLE + 0.55, a, 0.55), M["knight"])

    build_rope(M["rope"])
    animate(var_pegs)
    stage()
    return fixed_pegs, var_pegs


def build_rope(rope_mat):
    pts = resample_closed(star_path(), step=2.0 * SEG_R)
    n = len(pts)
    print(f"  rope: {n} segments")

    segs = []
    for i, (x, y) in enumerate(pts):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=SEG_R, location=(x, y, WIRE_Z), segments=12, ring_count=8)
        s = bpy.context.active_object
        s.name = f"Rope_{i:03d}"
        s.data.materials.append(rope_mat)
        bpy.ops.object.shade_smooth()
        add_rb(s, "ACTIVE", "SPHERE", mass=0.04, friction=0.5, damp=0.7)
        segs.append(s)

    # POINT constraints linking each segment to the next, closing the loop
    for i in range(n):
        a, b = segs[i], segs[(i + 1) % n]
        mx = ((a.location[0] + b.location[0]) / 2, (a.location[1] + b.location[1]) / 2, WIRE_Z)
        bpy.ops.object.empty_add(type="PLAIN_AXES", location=mx)
        e = bpy.context.active_object
        e.name = f"Link_{i:03d}"
        bpy.ops.rigidbody.constraint_add()
        rc = e.rigid_body_constraint
        rc.type = "POINT"
        rc.object1 = a
        rc.object2 = b
        rc.disable_collisions = True

    # smooth visible rope: a beveled curve whose points follow the (baked) beads;
    # the physics beads are hidden from render so only the rope tube shows
    cu = bpy.data.curves.new("RopeCurve", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = SEG_R * 0.95
    cu.bevel_resolution = 4
    cu.fill_mode = "FULL"
    sp = cu.splines.new("POLY")
    sp.points.add(n - 1)
    for i, s in enumerate(segs):
        sp.points[i].co = (s.location[0], s.location[1], WIRE_Z, 1.0)
    sp.use_cyclic_u = True
    rope = bpy.data.objects.new("RopeSkin", cu)
    bpy.context.scene.collection.objects.link(rope)
    rope.data.materials.append(rope_mat)
    bpy.context.view_layer.update()
    for i, s in enumerate(segs):
        h = rope.modifiers.new(name=f"H{i:03d}", type="HOOK")
        h.object = s
        h.falloff_type = "NONE"
        h.strength = 1.0
        h.vertex_indices_set([i])
        h.matrix_inverse = s.matrix_world.inverted()
        s.hide_render = True
        s.display_type = "WIRE"
    return segs


def animate(var_pegs):
    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = FRAME_END
    sc.render.fps = FPS
    L0 = loop_length([R_VAR_BASE] * N)
    for frame, demand in BEATS:
        radii = demand_radii(demand)
        print(f"  beat f{frame:>3} demand={demand}  rope length={loop_length(radii):.3f}  (rest {L0:.3f})")
        for i, peg in enumerate(var_pegs):
            x, y, _ = polar(radii[i], ANG[i], 0)
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

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 55
    cam = bpy.data.objects.new("Camera", cam_d)
    cam.location = (5.4, -6.2, 5.7)
    bpy.context.scene.collection.objects.link(cam)
    track(cam)
    bpy.context.scene.camera = cam

    def area(name, loc, energy, size):
        d = bpy.data.lights.new(name, "AREA")
        d.energy = energy
        d.size = size
        o = bpy.data.objects.new(name, d)
        o.location = loc
        bpy.context.scene.collection.objects.link(o)
        track(o)

    area("Key", (-6.5, -5.5, 7.5), 2200, 6)
    area("Fill", (8.0, -3.5, 3.6), 650, 9)
    area("Back", (-1.5, 7.5, 6.5), 1700, 4)

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.80, 0.80, 0.82, 1)
        bg.inputs[1].default_value = 0.45
    bpy.context.scene.world = world


def bake():
    sc = bpy.context.scene
    rw = sc.rigidbody_world
    rw.point_cache.frame_start = 1
    rw.point_cache.frame_end = FRAME_END
    sc.frame_set(1)
    try:
        bpy.ops.ptcache.bake_all(bake=True)
        print("  baked rigid body cache")
    except Exception as e:
        print(f"  bake_all failed ({e}); stepping frames")
        for f in range(1, FRAME_END + 1):
            sc.frame_set(f)


def pick_engine():
    items = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    for cand in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        if cand in items:
            return cand
    return items[0]


def setup_render(res):
    sc = bpy.context.scene
    sc.render.engine = pick_engine()
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    return sc


def render_stills():
    sc = setup_render((1000, 640))
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for f in (1, 40, 85):
        sc.frame_set(f)
        sc.render.filepath = str(PREVIEW_DIR / f"frame_{f:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"  rendered still {f}")


def render_anim():
    # this Blender build has no FFMPEG muxer, so write a PNG sequence and let
    # the shell encode it to mp4 afterwards
    sc = setup_render((960, 600))
    d = HERE / "anim"
    d.mkdir(parents=True, exist_ok=True)
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = str(d / "frame_")
    bpy.ops.render.render(animation=True)
    print(f"  rendered {FRAME_END} frames to {d}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    build()
    bake()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"saved {BLEND_PATH}  (frames 1-{FRAME_END})")
    if "stills" in argv:
        render_stills()
    if "anim" in argv:
        render_anim()


if __name__ == "__main__":
    main()
