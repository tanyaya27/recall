from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_focus/'
frames = [
 ('F-L1-now.png', 'Level 1 · now', 'every tier coloured; button white', '#1F2937'),
 ('F-L1-proposal.png', 'Level 1 · your idea', 'only the focus tier coloured; button too', '#2F6B5E'),
 ('F-L2-now.png', 'Tier 2 · now', '', '#1F2937'),
 ('F-L2-proposal.png', 'Tier 2 · your idea', 'the ring, the button, the shutter: one colour', '#2F6B5E'),
 ('F-sheet-now.png', 'Choose place · now', '', '#1F2937'),
 ('F-sheet-proposal.png', 'Choose place · your idea', 'only the tier being changed coloured', '#2F6B5E'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Ravi 09-30: colour the Choose place button like its tier; colour only the tier in focus (drawn on the real screens)', font=F, fill='#111')
for i, (f, lab, sub, col) in enumerate(frames):
    im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill=col)
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 120), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 3 // 5, img.height * 3 // 5))
img.save('/home/claude/out/OPTIONS_2026-09-30_focus-colour.jpg', quality=80); print(img.size)
