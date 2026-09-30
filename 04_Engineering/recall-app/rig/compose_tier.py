from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_tier/'
rows = [[
 ('B1-camera-tier-marked.png', 'B · built in d (today)', 'the tier Choose place changes is ringed', '#1F2937'),
 ('B2-choose-says-which-tier.png', 'B · Choose place (built)', 'whole chain; which tier; what comes off', '#1F2937'),
 ('A1-move-asks-one-thing.png', 'A · one question', 'Move asks only what it is in now', '#2F6B5E'),
 ('A2-new-place-asks-once.png', 'A · a NEW place', '"What\'s the Glove box in?" once; Skip ok', '#2F6B5E'),
 ('A3-the-box-moves-from-its-own-page.png', 'A · move the box itself', 'from its own page; contents follow', '#2F6B5E'),
],[
 ('C1-move-is-a-sentence.png', 'C · freeform (Ravi)', 'Move = write (or say) a sentence', '#7C4A1E'),
 ('C2-item-page-freeform.png', 'C · the item page', 'your words + photos; no places', '#7C4A1E'),
 ('D1-a-plus-a-note.png', 'D (tech) · A + a note', 'optional words beside the chain', '#4B3B7A'),
 ('D2-say-it-recall-builds-it.png', 'D (users) · say it', 'ReCall builds the chain; you tap ✓', '#4B3B7A'),
]]
W, H, LAB = 780, 1688, 110
cols = max(len(r) for r in rows)
img = Image.new('RGB', (W * cols, 70 + len(rows) * (H + LAB + 20)), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Tiers or freeform? — options on the real screens (B is built in d; A, C, D are drawn on top, not built)', font=F, fill='#111')
for r, row in enumerate(rows):
    y0 = 70 + r * (H + LAB + 20)
    for i, (f, lab, sub, col) in enumerate(row):
        im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
        d.rectangle([x, y0, x + W - 20, y0 + LAB - 10], fill=col)
        d.text((x + 16, y0 + 10), lab, font=F, fill='white'); d.text((x + 16, y0 + 50), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, y0 + LAB))
img = img.resize((img.width * 3 // 5, img.height * 3 // 5))
img.save('/home/claude/out/OPTIONS_2026-09-30_tiers-or-freeform.jpg', quality=80); print(img.size)
