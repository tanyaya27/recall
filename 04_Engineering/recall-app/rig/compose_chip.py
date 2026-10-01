from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_chip/'
frames = [
 ('R0-default-no-chip.png', 'The next shot will ask', 'no chip: "This photo is…" explains itself', '#1F2937'),
 ('R1-chip-more-photos.png', 'Chip: + and the place', 'shots go to the White cardboard box', '#2F6B5E'),
 ('R2-fly-in.png', 'After each shot', 'the photo flies into its square; +1', '#2F6B5E'),
 ('R3-chip-new-place.png', 'Chip: NEW', 'the next shot is the new place', '#2F6B5E'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Shutter annotation (drawn on the real screens, not built): a chip on the ring only when a choice is remembered; a fly-in after each shot', font=F, fill='#111')
for i, (f, lab, sub, col) in enumerate(frames):
    im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill=col)
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 120), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 3 // 5, img.height * 3 // 5))
img.save('/home/claude/out/OPTIONS_2026-09-30_shutter-chip.jpg', quality=82); print(img.size)
