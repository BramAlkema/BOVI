"""The Foundations drop-test tower — necessity vs essentialist bolt-ons.

Third BOVI Blender illustration (after the tally rope and the design-space
landscape). The FOUNDATIONS stones are stacked as a TOWER (the dependency is
sequential, bottom->top): Pull -> Ledger -> Value -> Axioms -> Medium. Bolted to
the sides are the essentialist BOLT-ONS the goldbug/crypto/nationalist point to
as "what makes money real": Scarcity, Durability, Backing, Intrinsic, Token.

The asymmetry IS the argument (Stone 5 clincher):
  1. The bolt-ons un-bolt and tumble off one by one -> the tower STILL STANDS.
     (Strip the "essentials"; the ledger was always the money.)
  2. Remove a load-bearing stone (the Ledger) -> everything above collapses.
     (The structural stones, unlike the trinkets, cannot be removed.)

Pure rigid-body physics, same pipeline as ye_tally_rope_sim.py: held pieces are
KINEMATIC and released by keyframing rigid_body.kinematic True->False (constant
interpolation), then the cache is baked. EEVEE + PNG sequence; captions are
burned in afterwards with ffmpeg overlay (this Blender/ffmpeg lack a usable
text muxer/freetype).

Run:
    blender --background --factory-startup --python foundations_tower.py -- compose   # fast still, no bake
    blender --background --factory-startup --python foundations_tower.py -- stills
    blender --background --factory-startup --python foundations_tower.py -- anim
"""

import sys
import math
from pathlib import Path

import bpy

HERE = Path(__file__).resolve().parent
BLEND_PATH = str(HERE / "foundations-tower.blend")
PREVIEW_DIR = HERE / "preview_tower"

FPS = 24
FRAME_END = 200

PED_TOP = 0.0
SW, SD, SH = 1.2, 0.95, 1.12         # ~square front face: legible labels, still topples
GAP = 0.015

# bottom -> top. (label, tint)
STONES = [
    ("PULL",    (0.32, 0.36, 0.52)),
    ("LEDGER",  (0.20, 0.50, 0.32)),   # green, echoing the ledger motif
    ("VALUE",   (0.58, 0.44, 0.22)),
    ("AXIOMS",  (0.46, 0.46, 0.50)),
    ("MEDIUM",  (0.24, 0.46, 0.50)),
]
PULL_STONE = 0                        # which stone gets yanked (the foundation)

# bolt-ons: (label, attach-stone-index, side(+1 right/-1 left), body color, metal)
BOLTONS = [
    ("SCARCITY",   4,  1, (0.80, 0.62, 0.16), 0.9),
    ("DURABILITY", 3, -1, (0.55, 0.35, 0.18), 0.5),
    ("BACKING",    2,  1, (0.70, 0.20, 0.18), 0.2),
    ("INTRINSIC",  1, -1, (0.45, 0.22, 0.62), 0.3),
    ("TOKEN",      0,  1, (0.55, 0.55, 0.58), 0.7),
]
BOLT_RELEASE = [30, 46, 62, 78, 94]    # staggered frames each bolt-on unbolts
COLLAPSE_F = 140                        # release upper stones + start the yank


# ----------------------------------------------------------------------------- helpers
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, rough=0.6, metal=0.0, emit=None, emit_str=1.0):
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
    sc.gravity = (0, 0, -9.81)
    return rw


def add_rb(obj, kind, shape, mass=1.0, kinematic=False, friction=0.85, damp=0.2):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.rigidbody.object_add()
    rb = obj.rigid_body
    rb.type = kind
    rb.collision_shape = shape
    rb.friction = friction
    rb.collision_margin = 0.002
    if kind == "ACTIVE":
        rb.mass = mass
        rb.linear_damping = damp
        rb.angular_damping = damp
        rb.kinematic = kinematic
    return rb


def _all_fcurves(act):
    """F-curves across legacy (.fcurves) and 5.x slotted (layers/strips) actions."""
    fcs = list(getattr(act, "fcurves", []) or [])
    for layer in getattr(act, "layers", []):
        for strip in getattr(layer, "strips", []):
            for cbag in getattr(strip, "channelbags", []):
                fcs.extend(getattr(cbag, "fcurves", []))
    return fcs


def set_interp(obj, path_end, mode):
    """Best-effort interpolation mode on fcurves ending with path_end (works on
    legacy and 5.x slotted actions)."""
    ad = obj.animation_data
    if not ad or not ad.action:
        return
    try:
        for fc in _all_fcurves(ad.action):
            if fc.data_path.endswith(path_end):
                for kp in fc.keyframe_points:
                    kp.interpolation = mode
    except Exception as e:
        print(f"  (set_interp skipped: {e})")


def release_kinematic(obj, frame, tip=0.0):
    """Hold kinematic (frozen) until `frame`, then go dynamic. A solid stack just
    drops straight down and re-stacks when its base is pulled (each stone is
    locally stable), so to make it TOPPLE we inject a tip: a fast kinematic
    rotation about +Y over the last 3 frames, LINEAR so the angular velocity is
    inherited at the dynamic handoff. The stone is released already tilted AND
    spinning -> it falls over toward +X instead of settling."""
    rb = obj.rigid_body
    rb.kinematic = True
    rb.keyframe_insert("kinematic", frame=1)
    rb.keyframe_insert("kinematic", frame=frame - 1)
    if tip:
        # spread the tip over 6 frames (LINEAR) so the inherited angular velocity
        # at handoff is modest -- enough to carry the stone past its balance point
        # and topple under gravity, not so much that it launches off the table.
        obj.keyframe_insert("rotation_euler", frame=frame - 6)
        rx, ry, rz = obj.rotation_euler
        obj.rotation_euler = (rx, ry + tip, rz)
        obj.keyframe_insert("rotation_euler", frame=frame)
        set_interp(obj, "rotation_euler", "LINEAR")
    rb.kinematic = False
    rb.keyframe_insert("kinematic", frame=frame)
    set_interp(obj, "kinematic", "CONSTANT")


def label(text, loc, size, parent, color):
    bpy.ops.object.text_add(location=loc)
    t = bpy.context.active_object
    t.name = f"Lbl_{text}"
    t.data.body = text
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.size = size
    t.data.extrude = 0.012
    t.rotation_euler = (math.pi / 2, 0, 0)      # upright, facing -Y (the camera)
    t.data.materials.append(color)
    if parent:
        t.parent = parent
        t.matrix_parent_inverse = parent.matrix_world.inverted()
    return t


# ----------------------------------------------------------------------------- build
def build():
    reset()
    rb_world()
    M = {
        "ped": mat("Pedestal", (0.12, 0.12, 0.14), rough=0.8),
        "lbl": mat("Label", (0.93, 0.93, 0.96), rough=0.5, emit=(0.85, 0.85, 0.9), emit_str=0.7),
        "lbl_b": mat("LabelBolt", (0.97, 0.92, 0.86), rough=0.5, emit=(0.9, 0.82, 0.7), emit_str=0.8),
        "bolt": mat("Bolt", (0.10, 0.10, 0.12), rough=0.4, metal=0.6),
    }

    # pedestal (passive)
    bpy.ops.mesh.primitive_cylinder_add(radius=4.2, depth=0.5, location=(0, 0, PED_TOP - 0.25), vertices=96)
    ped = bpy.context.active_object
    ped.name = "Pedestal"
    ped.data.materials.append(M["ped"])
    add_rb(ped, "PASSIVE", "CONVEX_HULL", friction=0.95)

    stones = build_stones(M)
    build_boltons(stones, M)
    stage()

    sc = bpy.context.scene
    sc.frame_start = 1
    sc.frame_end = FRAME_END
    sc.render.fps = FPS
    return stones


def stone_z(i):
    return PED_TOP + SH / 2 + i * (SH + GAP)


def build_stones(M):
    stones = []
    for i, (name, tint) in enumerate(STONES):
        # slight +X lean (a Pisa bias) + small jitter, biasing the topple direction.
        jx = 0.07 * i + 0.03 * math.sin(i * 1.7)
        jy = 0.03 * math.cos(i * 2.1)
        rz = 0.05 * math.sin(i * 2.3 + 0.6)
        z = stone_z(i)
        bpy.ops.mesh.primitive_cube_add(size=2, location=(jx, jy, z))
        s = bpy.context.active_object
        s.name = f"Stone_{name}"
        s.scale = (SW / 2, SD / 2, SH / 2)
        s.rotation_euler = (0, 0, rz)
        bev = s.modifiers.new("Bevel", "BEVEL")
        bev.width, bev.segments = 0.05, 2
        s.data.materials.append(mat(f"St_{name}", tint, rough=0.7,
                                    emit=tuple(c * 0.5 for c in tint), emit_str=0.25))
        add_rb(s, "ACTIVE", "BOX", mass=3.0, kinematic=True, friction=0.8)
        label(name, (jx, -SD / 2 - 0.03, z), 0.22, s, M["lbl"])
        stones.append(s)

    # release schedule: the load-bearing stone is yanked out (kinematic, keyframed
    # to slide away); every other stone goes dynamic at collapse and falls.
    for i, s in enumerate(stones):
        if i == PULL_STONE:
            s.rigid_body.kinematic = True            # the load-bearing stone, yanked out
            s.keyframe_insert("location", frame=COLLAPSE_F - 1)
            # grippy horizontal yank: the foundation slides out sideways and, via
            # friction, shears the (tippy) stack over with it -> a clean topple,
            # no pre-tilt interpenetration to explode the stones off the table
            s.location = (s.location.x + 4.6, -2.3, s.location.z)
            s.keyframe_insert("location", frame=COLLAPSE_F + 20)
        else:
            release_kinematic(s, COLLAPSE_F)             # lose support; the yank shears it over
    return stones


def build_boltons(stones, M):
    for k, (name, idx, side, color, metal) in enumerate(BOLTONS):
        sx = stones[idx].location.x                 # follow the stone's lean offset
        z = stone_z(idx)
        x = sx + side * (SW / 2 + 0.42)
        y = -0.18
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.34, subdivisions=1, location=(x, y, z))
        g = bpy.context.active_object
        g.name = f"Bolton_{name}"
        g.data.materials.append(mat(f"Bo_{name}", color, rough=0.35, metal=metal,
                                    emit=tuple(c * 0.5 for c in color), emit_str=0.4))
        bpy.ops.object.shade_flat()

        # a little bolt peg into the stone (visual; rides with the bolt-on)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.5,
                                             location=(x - side * 0.3, y, z), vertices=12)
        peg = bpy.context.active_object
        peg.name = f"Peg_{name}"
        peg.rotation_euler = (0, math.pi / 2, 0)
        peg.data.materials.append(M["bolt"])
        peg.parent = g
        peg.matrix_parent_inverse = g.matrix_world.inverted()

        label(name, (x, y - 0.4, z - 0.42), 0.17, g, M["lbl_b"])

        # Bolt-ons leave by DETERMINISTIC keyframes, not physics (light spheres
        # sliding on the stone faces fell sluggishly/unevenly). Hold attached,
        # then decisively unbolt and tumble outward past the pedestal edge and
        # out of frame. The peg + label are parented, so they ride along.
        rel = BOLT_RELEASE[k]
        for f in (1, rel):
            g.keyframe_insert("location", frame=f)
            g.keyframe_insert("rotation_euler", frame=f)
        g.location = (x * 2.5 + side * 1.1, y - 0.7, -2.6)
        g.rotation_euler = (3.1 + 0.6 * k, 0.4 * k, 2.2 + 0.5 * k)
        g.keyframe_insert("location", frame=rel + 30)
        g.keyframe_insert("rotation_euler", frame=rel + 30)


def stage():
    tgt = bpy.data.objects.new("Target", None)
    tgt.location = (0.25, 0, 2.15)
    bpy.context.scene.collection.objects.link(tgt)

    def track(obj):
        c = obj.constraints.new("TRACK_TO")
        c.target = tgt
        c.track_axis = "TRACK_NEGATIVE_Z"
        c.up_axis = "UP_Y"

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 44
    cam = bpy.data.objects.new("Camera", cam_d)
    cam.location = (7.8, -11.0, 5.2)
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

    area("Key", (-7.0, -7.5, 9.0), 3000, 7)
    area("Fill", (9.0, -4.5, 4.0), 800, 10)
    area("Back", (-2.0, 8.5, 7.0), 2100, 5)

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.04, 0.05, 1)
        bg.inputs[1].default_value = 0.3
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


def render_still(frame, name):
    sc = setup_render((1000, 660))
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    sc.frame_set(frame)
    sc.render.filepath = str(PREVIEW_DIR / name)
    bpy.ops.render.render(write_still=True)
    print(f"  rendered still {frame} -> {name}")


def render_anim():
    sc = setup_render((960, 640))
    d = HERE / "anim_tower"
    d.mkdir(parents=True, exist_ok=True)
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = str(d / "frame_")
    bpy.ops.render.render(animation=True)
    print(f"  rendered {FRAME_END} frames to {d}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    build()
    if "compose" in argv:                 # fast composition/label check, no sim
        render_still(1, "compose.png")
        return
    bake()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"saved {BLEND_PATH}  (frames 1-{FRAME_END})")
    if "stills" in argv:
        render_still(1, "stand.png")
        render_still(130, "stripped.png")
        render_still(FRAME_END, "collapsed.png")
    if "anim" in argv:
        render_anim()


if __name__ == "__main__":
    main()
