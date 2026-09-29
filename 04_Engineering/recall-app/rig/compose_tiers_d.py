# The Q1–Q5 rulings as built (20260929d), from audit_tiers.js shots.
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
S = '/home/claude/rig/shots_tiers/'
frames = [
 ('v-S2-b-03.png', 'Q1 · thing page', 'every tier; squares scroll, words wrap'),
 ('v-S2-b-04.png', 'Q2 · Places', '"in Oak cabinet · 1 thing here"'),
 ('v-S4-b-01.png', 'Q3 · before Save', 'Kitchen counter: Craft nook → Pantry shelf'),
 ('v-S4-b-02.png', 'Q3 · the saved card', 'says it again; Undo puts it back'),
 ('v-S5-b-01.png', 'Q4 · outside a place', 'only places in •••'),
 ('v-S14-b-01.png', 'Q5 · ask about tier 2', 'shows tier 2\'s photo'),
 ('v-S14-b-02.png', 'Q5 · tier 2 selected', 'the usual D4 question'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Build 20260929d · your Q1–Q5 rulings, as built (rig, real rules on)', font=F, fill='#111')
for i, (f, lab, sub) in enumerate(frames):
    im = Image.open(S + f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill='#2F6B5E')
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 118), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 2 // 3, img.height * 2 // 3))
img.save('/home/claude/out/BUILD_2026-09-29d_tier-rulings.jpg', quality=80); print(img.size)
