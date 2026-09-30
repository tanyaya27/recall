from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_p30d/'
frames = [
 ('p-02-camera-a-tier-photo-in-the-viewer.png', '1 · one photo viewer', 'the camera uses the item page\'s viewer'),
 ('p-03-move-it-opens.png', '3 · the tier is ringed', 'chain line marks what Choose place changes'),
 ('p-04-choose-place-for-level-1.png', '3 · Choose place, level 1', 'whole chain; which tier; what comes off'),
 ('p-05-choose-place-for-tier-2.png', '3 · Choose place, tier 2', '"it moves, with everything in it"'),
 ('p-07-tier-4-changed-to-in-air.png', '4 · the square follows', 'In air\'s photo, not the Foyer\'s'),
 ('p-08-item-page-after-a-move.png', '2 · moved, not "seen"', 'moved today · last seen Mon'),
 ('p-09-batteries-after-their-counter-moved.png', '2 · moved with its place', '"moved with the Kitchen counter"'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Build 20260930d — Ravi\'s phone bugs of c, fixed (rig, iPhone size)', font=F, fill='#111')
for i, (f, lab, sub) in enumerate(frames):
    im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill='#2F6B5E')
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 120), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 3 // 5, img.height * 3 // 5))
img.save('/home/claude/out/BUILD_2026-09-30d_phone-fixes.jpg', quality=80); print(img.size)
