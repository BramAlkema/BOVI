"""Render the figure caption to a transparent 960x640 PNG overlay (lower-third),
so ffmpeg can composite it with `overlay` (this ffmpeg lacks drawtext/freetype)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 960, 640
TEXT = "The shape is the variable, not the destination"
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
font = ImageFont.truetype(FONT, 30)

bb = d.textbbox((0, 0), TEXT, font=font)
tw, th = bb[2] - bb[0], bb[3] - bb[1]
padx, pady = 20, 13
bx0, bx1 = (W - tw) / 2 - padx, (W + tw) / 2 + padx
by1 = H - 24
by0 = by1 - (th + 2 * pady)

d.rounded_rectangle([bx0, by0, bx1, by1], radius=11, fill=(0, 0, 0, 150))
d.text(((W - tw) / 2 - bb[0], by0 + pady - bb[1]), TEXT, font=font, fill=(255, 255, 255, 255))
img.save("caption_overlay.png")
print(f"caption_overlay.png  text {tw}x{th}")
