#!/usr/bin/env python3
"""Compose a horizontal film-strip PNG from frames of a rendered mp4.

The film-strip is the *static* figure that carries a sim's argument into the
PDF and print editions (where motion is impossible). The mp4 itself is embedded
only in the EPUB. Keeping the strip frames sourced from the same mp4 guarantees
the still and the motion match.

Usage:
    python make_filmstrip.py SOURCE.mp4 OUT-strip.png [--frames n1,n2,...]
                             [--count N] [--height PX] [--gap PX]

Requires: ffmpeg on PATH, Pillow (present in the bookcrafter venv).
Run with that venv's python so PIL is importable, e.g.
    ../../bookcrafter/venv/bin/python make_filmstrip.py ...
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


def probe_frame_count(src):
    out = subprocess.run(
        ["ffprobe", "-loglevel", "error", "-select_streams", "v:0",
         "-count_frames", "-show_entries", "stream=nb_read_frames",
         "-of", "csv=p=0", str(src)],
        capture_output=True, text=True, check=True).stdout.strip()
    return int(out)


def extract(src, frame_nums, tmp):
    """Pull specific frame indices out of the mp4 as PNGs."""
    sel = "+".join(f"eq(n\\,{n})" for n in frame_nums)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
         "-vf", f"select='{sel}'", "-vsync", "0",
         str(tmp / "f_%03d.png")], check=True)
    return sorted(tmp.glob("f_*.png"))


def compose(frame_paths, out, height, gap, bg="white"):
    ims = [Image.open(p).convert("RGB") for p in frame_paths]
    scaled = [im.resize((round(im.width * height / im.height), height)) for im in ims]
    total_w = sum(im.width for im in scaled) + gap * (len(scaled) + 1)
    strip = Image.new("RGB", (total_w, height + 2 * gap), bg)
    x = gap
    for im in scaled:
        strip.paste(im, (x, gap))
        x += im.width + gap
    strip.save(out)
    return strip.size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("out")
    ap.add_argument("--frames", help="comma-separated frame indices")
    ap.add_argument("--count", type=int, default=4, help="evenly spaced frames if --frames omitted")
    ap.add_argument("--height", type=int, default=420)
    ap.add_argument("--gap", type=int, default=10)
    args = ap.parse_args()

    src = Path(args.source)
    if args.frames:
        nums = [int(x) for x in args.frames.split(",")]
    else:
        total = probe_frame_count(src)
        step = total / (args.count + 1)
        nums = [round(step * (i + 1)) for i in range(args.count)]

    with tempfile.TemporaryDirectory() as td:
        frames = extract(src, nums, Path(td))
        size = compose(frames, Path(args.out), args.height, args.gap)
    print(f"film-strip: {args.out}  frames={nums}  size={size}")


if __name__ == "__main__":
    main()
