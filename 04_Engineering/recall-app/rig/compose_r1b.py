from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_r1/'
rows = [[
 ('r-H1.png', '1 · Home: photo + name', 'where it is lives on the item page', '#2F6B5E'),
 ('r-C1.png', '2 · after the photo', 'say where — and/or "What is it in?"', '#2F6B5E'),
 ('r-C4.png', '3 · What is it in?', 'her words lead: Desk drawer · New place', '#2F6B5E'),
 ('r-N2.png', '4 · tiers 2 and 3', '"+ What is the … in?" — outward, up to 3', '#2F6B5E'),
],[
 ('r-M1.png', '5 · Move it, in a box', 'In: already set; Save waits for a change', '#2F6B5E'),
 ('r-P1.png', '6 · item page, words only', 'You said · when · Put it in…', '#2F6B5E'),
 ('r-P2.png', '7 · item page, in a box', 'the chain, then her words; Undo', '#2F6B5E'),
 ('r-L1.png', '8 · Largest, small phone', 'everything on screen', '#2F6B5E'),
]]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * 4, (H + LAB) * 2 + 90), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Build 20261001a — release 1 "Words, and one pick" (rig, as built; dark theme)', font=F, fill='#111')
for r, row in enumerate(rows):
    y0 = 70 + r * (H + LAB + 10)
    for i, (f, lab, sub, col) in enumerate(row):
        im = Image.open(S + f).convert('RGB'); im = im.resize((W - 20, int(im.height * (W - 20) / im.width)))
        im = im.crop((0, 0, W - 20, min(im.height, H - 20 * H // W))); x = i * W + 10
        d.rectangle([x, y0, x + W - 20, y0 + LAB - 10], fill=col)
        d.text((x + 16, y0 + 10), lab, font=F, fill='white'); d.text((x + 16, y0 + 50), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, y0 + LAB))
img = img.resize((img.width // 2, img.height // 2))
img.save('/home/claude/out/BUILD_2026-10-01a_words-and-one-pick.jpg', quality=82); print(img.size)
