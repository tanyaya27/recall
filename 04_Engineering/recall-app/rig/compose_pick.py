from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_pick/'
frames = [
 ('Q0-now-photo-assumes-new-place.png', 'Now (your 1:36 screen)', 'a photo = "a new place?", the old one gone', '#1F2937'),
 ('Q1-shutter-on-a-tier-asks.png', '1 · the shutter asks', 'another photo of it, or a different place', '#2F6B5E'),
 ('Q2-choose-with-photo-new-first.png', '2 · new place first', 'then search; ReCall only suggests', '#2F6B5E'),
 ('Q3-choose-new-place-first.png', '2 · from the button', 'Photograph a new place, then search', '#2F6B5E'),
 ('Q4-before-now-confirm.png', '3 · a pick shows Before → Now', 'tap a photo to zoom; Use or Back', '#2F6B5E'),
 ('Q5-before-now-new-place.png', '3 · … for a new place', 'your photo, its name, marked NEW', '#2F6B5E'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Ravi 09-30 1:36 PM — a photo on a tier that has a place; Choose place order; confirm before it is done (drawn on the real screens, not built)', font=F, fill='#111')
for i, (f, lab, sub, col) in enumerate(frames):
    im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill=col)
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 120), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 3 // 5, img.height * 3 // 5))
img.save('/home/claude/out/OPTIONS_2026-09-30_photo-on-a-tier.jpg', quality=80); print(img.size)
