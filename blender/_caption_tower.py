"""Two transparent caption overlays for the foundations-tower clip (this ffmpeg
lacks drawtext/freetype, so we composite PNGs with `overlay`)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 960, 640
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
CAPS = [
    ("caption_tower_a.png", "Strip the ‘essentials’ — the ledger still stands"),
    ("caption_tower_b.png", "Remove a load-bearing stone — and there is no money"),
]

font = ImageFont.truetype(FONT, 30)
for fname, text in CAPS:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bb = d.textbbox((0, 0), text, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    padx, pady = 20, 13
    bx0, bx1 = (W - tw) / 2 - padx, (W + tw) / 2 + padx
    by1 = H - 24
    by0 = by1 - (th + 2 * pady)
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=11, fill=(0, 0, 0, 150))
    d.text(((W - tw) / 2 - bb[0], by0 + pady - bb[1]), text, font=font, fill=(255, 255, 255, 255))
    img.save(fname)
    print(f"{fname}  text {tw}x{th}")
