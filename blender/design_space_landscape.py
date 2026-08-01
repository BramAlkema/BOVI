"""Design-space landscape — three pulls, a plastic terrain (the conditional law).

Companion to ye_tally_rope_sim.py. The design space of money is a SHEET that
three attractors curve into wells — the *pull* reading of gravity (monies follow
the curvature; nothing is shoved). The three pulls:

    Relational-minimal (green)  — efficiency pull; an open, wide well.
    Hard-money         (gold)   — defended scarcity; a deep, NARROW well.
    Authoritarian      (cyan)   — removed exit; a deep well with a HIGH RIM
                                  (Hirschman: locked-in exit, no voice -> trapped).

Two traps this scene is built to avoid:

  1. A ball rolling downhill is a *push* metaphor. So the terrain is a curved
     sheet (GR rubber-sheet) and the marbles are PULLED along the bend.
  2. A fixed landscape with one winner is the forbidden prophecy ("my pole wins
     globally"). So the terrain is PLASTIC: well depth and rim height are driven
     by relative shape keys keyframed over a CONTESTABILITY schedule. Many
     marbles are scattered and sort into DIFFERENT wells by where they sit when
     the terrain reshapes. The end frame shows a mixed distribution governed by
     local contestability -- the only falsifiable claim -- not a race won.

The argument is the reshaping, not the resting place. Caption on the sheet:
"THE SHAPE IS THE VARIABLE - NOT THE DESTINATION".

Feasibility note baked in: the sheet is a PASSIVE rigid body with
mesh_source='DEFORM' + use_deform + kinematic(animated), so the collision proxy
follows the shape-keyed deformation. Without that, marbles roll on the flat base
mesh and ignore the reshaping -- which would silently kill the whole argument.

Run:
    blender --background --factory-startup --python design_space_landscape.py -- stills
    blender --background --factory-startup --python design_space_landscape.py -- anim
"""

import sys
import math
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
BLEND_PATH = str(HERE / "design-space-landscape.blend")
PREVIEW_DIR = HERE / "preview_landscape"
RENDER_DIR = HERE / "render"

# ----------------------------------------------------------------------------- config
SHEET = 13.0                 # sheet edge length
NSUB = 48                    # grid subdivisions (collision + visual)
RC = 3.1                     # radius of the three well centres
FPS = 24

# Three pulls. cx,cy filled in build(). sigma = well width; rr,rw = rim ring.
WELLS = [
    dict(key="g", name="Relational", ang=90,  sigma=1.55, rr=2.5, rw=0.60,
         body=(0.10, 0.62, 0.32), emit=(0.05, 0.55, 0.22)),   # green (matches rope var-peg)
    dict(key="o", name="HardMoney",  ang=210, sigma=1.00, rr=1.9, rw=0.50,
         body=(0.78, 0.60, 0.18), emit=(0.55, 0.40, 0.08)),   # gold
    dict(key="c", name="Authority",  ang=330, sigma=1.30, rr=2.2, rw=0.55,
         body=(0.16, 0.55, 0.70), emit=(0.10, 0.45, 0.62)),   # cyan
]

# Timeline length (retarget the whole arc by changing this one number).
FRAME_END = 128


def _f(frac):
    return max(1, int(round(FRAME_END * frac)))


# Contestability schedule: (frame, {well_depth, rim_height} per well key), placed
# at FRACTIONS of the timeline so the arc rescales with FRAME_END.
# REST: gentle, uniform. DIFFERENTIATE: green opens+deepens (contestable), gold
# stays deep+narrow (defended), cyan deepens with a HIGH rim (captured/trapping).
# SELF-UNDERMINE: cyan rim eases slightly (weaponisation breeds exit-seeking,
# slowly) -- contestability is itself the contested prize, not destiny.
SCHED = [
    (_f(0.00), dict(gw=0.70, gr=0.10, ow=0.70, orr=0.10, cw=0.70, cr=0.10)),
    (_f(0.17), dict(gw=0.70, gr=0.10, ow=0.70, orr=0.10, cw=0.70, cr=0.10)),
    (_f(0.50), dict(gw=1.70, gr=0.00, ow=1.45, orr=0.25, cw=1.80, cr=0.95)),
    (_f(0.75), dict(gw=1.70, gr=0.00, ow=1.45, orr=0.25, cw=1.80, cr=0.78)),
    (_f(1.00), dict(gw=1.70, gr=0.00, ow=1.45, orr=0.25, cw=1.80, cr=0.78)),
]

# map schedule dict keys to (well-index, kind)
SLOT = {"g": ("gw", "gr"), "o": ("ow", "orr"), "c": ("cw", "cr")}


# ----------------------------------------------------------------------------- helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, rough=0.5, metal=0.0, emit=None, emit_str=1.0, alpha=1.0):
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
    setin("Alpha", alpha)
    if emit is not None:
        setin("Emission Color", (*emit, 1))
        setin("Emission Strength", emit_str)
    if alpha < 1.0:
        m.blend_method = "BLEND"
    return m


def cyl(name, radius, depth, loc, material=None, verts=48):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    if material:
        o.data.materials.append(material)
    return o


def torus(name, major, minor, loc, material=None):
    bpy.ops.mesh.primitive_torus_add(location=loc, major_radius=major, minor_radius=minor,
                                      major_segments=48, minor_segments=12)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.shade_smooth()
    if material:
        o.data.materials.append(material)
    return o


def polar(r, a_deg, z):
    a = math.radians(a_deg)
    return (r * math.cos(a), r * math.sin(a), z)


def gauss(r, sigma):
    return math.exp(-(r * r) / (2.0 * sigma * sigma))


def well_z(x, y, cx, cy, sigma):
    """Unit-depth dip (negative)."""
    return -gauss(math.hypot(x - cx, y - cy), sigma)


def rim_z(x, y, cx, cy, rr, rw):
    """Unit-height ring bump at radius rr (positive)."""
    r = math.hypot(x - cx, y - cy)
    return math.exp(-((r - rr) ** 2) / (2.0 * rw * rw))


def depth_at(frame, key):
    """Linear-interp well depth for a given well key at a frame (for markers)."""
    dk = SLOT[key][0]
    pts = [(f, d[dk]) for f, d in SCHED]
    if frame <= pts[0][0]:
        return pts[0][1]
    for (f0, v0), (f1, v1) in zip(pts, pts[1:]):
        if frame <= f1:
            t = (frame - f0) / (f1 - f0) if f1 > f0 else 0.0
            return v0 + (v1 - v0) * t
    return pts[-1][1]


def rb_world():
    sc = bpy.context.scene
    if sc.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    rw = sc.rigidbody_world
    if hasattr(rw, "substeps_per_frame"):
        rw.substeps_per_frame = 12
    if hasattr(rw, "steps_per_second"):
        rw.steps_per_second = 12 * FPS
    rw.solver_iterations = 30
    sc.gravity = (0, 0, -3.0)          # gentle: marbles follow the curvature, not slam
    return rw


def add_rb(obj, kind, shape, mass=1.0, friction=0.6, damp=0.45):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.rigidbody.object_add()
    rb = obj.rigid_body
    rb.type = kind
    rb.collision_shape = shape
    rb.friction = friction
    rb.collision_margin = 0.004
    if kind == "ACTIVE":
        rb.mass = mass
        rb.linear_damping = damp
        rb.angular_damping = damp
    return rb


# ----------------------------------------------------------------------------- build
def build():
    reset()
    for i, w in enumerate(WELLS):
        x, y, _ = polar(RC, w["ang"], 0)
        w["cx"], w["cy"] = x, y
    M = {
        "sheet": mat("Sheet", (0.16, 0.17, 0.22), rough=0.85),
        "marble": mat("Marble", (0.82, 0.80, 0.74), rough=0.35, metal=0.1),
        "caption": mat("Caption", (0.86, 0.86, 0.9), rough=0.6, emit=(0.7, 0.7, 0.78), emit_str=0.6),
        "warm": mat("Warm", (0.95, 0.78, 0.30), emit=(0.95, 0.7, 0.25), emit_str=3.0, alpha=0.5),
        "cold": mat("Cold", (0.35, 0.7, 0.95), emit=(0.25, 0.6, 0.95), emit_str=3.0, alpha=0.5),
    }
    for w in WELLS:
        M[w["key"]] = mat(w["name"], w["body"], rough=0.3, metal=0.2, emit=w["emit"], emit_str=1.2)

    rb_world()
    build_sheet(M["sheet"])
    build_markers(M)
    build_contest_rings(M)
    build_marbles(M["marble"])
    # caption is burned in as a legible 2D lower-third at ffmpeg-encode time
    # (an in-scene 3D label foreshortens on the sheet and clips at the corners)
    stage()

    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = FRAME_END
    sc.render.fps = FPS


def build_sheet(sheet_mat):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=NSUB, y_subdivisions=NSUB, size=SHEET,
                                    location=(0, 0, 0))
    o = bpy.context.active_object
    o.name = "Sheet"
    o.data.materials.append(sheet_mat)
    bpy.ops.object.shade_smooth()

    verts = o.data.vertices
    base = [(v.co.x, v.co.y) for v in verts]

    # Basis (flat) + one well key and one rim key per pull. Relative shape keys
    # ADD, so blending value_k * field_k recreates the analytic sum landscape.
    o.shape_key_add(name="Basis", from_mix=False)
    keys = {}
    for w in WELLS:
        wk = o.shape_key_add(name=f"{w['name']}_well", from_mix=False)
        rk = o.shape_key_add(name=f"{w['name']}_rim", from_mix=False)
        for sk in (wk, rk):
            sk.slider_min = 0.0
            sk.slider_max = 4.0
        for i, (x, y) in enumerate(base):
            wk.data[i].co = (x, y, well_z(x, y, w["cx"], w["cy"], w["sigma"]))
            rk.data[i].co = (x, y, rim_z(x, y, w["cx"], w["cy"], w["rr"], w["rw"]))
        keys[w["key"]] = (wk, rk)

    # keyframe the slider values over the contestability schedule
    for frame, d in SCHED:
        for k, (wk, rk) in keys.items():
            dk, rkk = SLOT[k]
            wk.value = d[dk]
            rk.value = d[rkk]
            wk.keyframe_insert("value", frame=frame)
            rk.keyframe_insert("value", frame=frame)

    # passive collider that FOLLOWS the shape-keyed deformation
    rb = add_rb(o, "PASSIVE", "MESH", friction=0.7)
    try:
        rb.mesh_source = "DEFORM"
        rb.use_deform = True
        rb.kinematic = True            # "Animated": terrain is keyframed, not static
    except Exception as e:
        print(f"  (deform-collider flags unsupported: {e})")
    return o


def build_markers(M):
    """Thin emissive disc at each well centre, riding the well bottom down."""
    for w in WELLS:
        d0 = depth_at(1, w["key"])
        mk = cyl(f"Mark_{w['name']}", 0.42, 0.05, (w["cx"], w["cy"], -d0 + 0.04), M[w["key"]])
        for frame, _ in SCHED:
            z = -depth_at(frame, w["key"]) + 0.04
            mk.location = (w["cx"], w["cy"], z)
            mk.keyframe_insert("location", frame=frame)


def build_contest_rings(M):
    """Contestability arriving: a warm ring descends over the open (green) pole,
    a cold ring over the captured (cyan) pole. Pure signalling; transforms only
    (rock-solid to keyframe)."""
    pairs = [(WELLS[0], M["warm"]), (WELLS[2], M["cold"])]
    for w, ring_mat in pairs:
        ring = torus(f"Contest_{w['name']}", w["sigma"] * 1.5, 0.05,
                     (w["cx"], w["cy"], 4.5), ring_mat)
        # high at rest -> descends to hover just above the rim as it differentiates
        for frame, zoff in ((_f(0.0), 4.5), (_f(0.17), 4.2), (_f(0.5), 1.4), (_f(1.0), 1.4)):
            ring.location = (w["cx"], w["cy"], zoff)
            ring.keyframe_insert("location", frame=frame)


def build_marbles(marble_mat):
    """Scatter marbles on the slope of each well so they sort by where they sit
    when the terrain reshapes. A few 'wanderers' sit on flat ground between the
    pulls and stay put -- not every money is captured by a pole."""
    R = 0.18
    placed = []
    for w in WELLS:
        for j in range(4):
            a = math.radians(45 + 90 * j)
            rr = 1.0 * w["sigma"]          # on the inner slope -> reliably pulled in
            placed.append((w["cx"] + rr * math.cos(a), w["cy"] + rr * math.sin(a)))
    # wanderers on flat midground (roughly the centroid-to-edge gaps)
    placed += [(0.0, -0.2), (1.0, 1.4), (-1.2, 1.3)]

    for i, (x, y) in enumerate(placed):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=R, location=(x, y, 0.30),
                                             segments=16, ring_count=10)
        s = bpy.context.active_object
        s.name = f"Marble_{i:02d}"
        s.data.materials.append(marble_mat)
        bpy.ops.object.shade_smooth()
        add_rb(s, "ACTIVE", "SPHERE", mass=0.2, friction=0.6, damp=0.45)


def build_caption(cap_mat):
    try:
        bpy.ops.object.text_add(location=(0, -SHEET / 2 + 1.7, 0.02))
    except Exception as e:
        print(f"  (caption skipped: {e})")
        return
    t = bpy.context.active_object
    t.name = "Caption"
    t.data.body = "THE SHAPE IS THE VARIABLE - NOT THE DESTINATION"
    t.data.align_x = "CENTER"
    t.data.size = 0.34
    t.data.extrude = 0.01
    t.rotation_euler = (0, 0, 0)        # lying flat on the sheet, read from above
    t.data.materials.append(cap_mat)


def stage():
    tgt = bpy.data.objects.new("CenterTarget", None)
    tgt.location = (0, -0.2, -0.6)
    bpy.context.scene.collection.objects.link(tgt)

    def track(obj):
        c = obj.constraints.new("TRACK_TO")
        c.target = tgt
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 50
    cam = bpy.data.objects.new("Camera", cam_d)
    cam.location = (8.6, -10.2, 8.4)
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

    area("Key", (-7.5, -6.5, 9.0), 2600, 8)
    area("Fill", (9.0, -4.0, 4.2), 700, 10)
    area("Back", (-1.5, 8.5, 7.0), 1900, 5)

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.05, 0.07, 1)
        bg.inputs[1].default_value = 0.25
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
    sc = setup_render((1000, 660))
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for f in (1, 120, 240):
        sc.frame_set(f)
        sc.render.filepath = str(PREVIEW_DIR / f"frame_{f:03d}.png")
        bpy.ops.render.render(write_still=True)
        print(f"  rendered still {f}")


def render_anim():
    # this Blender build has no FFMPEG muxer, so write a PNG sequence and let the
    # shell encode it to mp4 afterwards (same as the tally-rope pipeline)
    sc = setup_render((960, 640))
    d = HERE / "anim_landscape"
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
