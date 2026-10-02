from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 23)
S = '/home/claude/rig/shots_r1/'
rows = [[
 ('A1-home-now.png', 'Home now', 'where line under each name', '#1F2937'),
 ('A2-home-new.png', '1 · Home: photo + name', 'Tanya: where is on the item page', '#2F6B5E'),
 ('B1-log-after-shot.png', '2 · Log: after the photo', 'say where — and/or "What is it in?"', '#2F6B5E'),
 ('B2-log-words.png', '3 · her words', 'typed or said; that alone is enough', '#2F6B5E'),
 ('B3-in-list.png', '4 · What is it in?', 'her words find "Desk drawer"; one-tap new', '#2F6B5E'),
],[
 ('B4-log-in-set.png', '5 · In: Desk drawer', 'what you see is what is saved; ✕ takes it out', '#2F6B5E'),
 ('C1-move-boxed.png', '6 · Move it, in a box', 'In: already set; Save waits for a change', '#2F6B5E'),
 ('D1-page-words-only.png', '7 · item page, words only', 'her words, dated, who said it', '#2F6B5E'),
 ('D2-page-linked-and-words.png', '8 · item page, in a box', 'the chain, then her words', '#2F6B5E'),
]]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * 5, (H + LAB) * 2 + 90), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Release 1 "Words, and one pick" — drawn on the real screens (not built yet). Gone from the camera: the tier squares, +, Choose place, "This photo is…", photo matching, Before → Now.', font=F, fill='#111')
for r, row in enumerate(rows):
    y0 = 70 + r * (H + LAB + 10)
    for i, (f, lab, sub, col) in enumerate(row):
        im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
        d.rectangle([x, y0, x + W - 20, y0 + LAB - 10], fill=col)
        d.text((x + 16, y0 + 10), lab, font=F, fill='white'); d.text((x + 16, y0 + 50), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, y0 + LAB))
img = img.resize((img.width * 1 // 2, img.height * 1 // 2))
img.save('/home/claude/out/MOCK_2026-10-01_release1-words-and-one-pick.jpg', quality=82); print(img.size)
