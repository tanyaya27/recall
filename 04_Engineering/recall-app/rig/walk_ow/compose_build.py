from PIL import Image, ImageDraw, ImageFont
import textwrap
D = '/home/claude/rig/walk_ow/build/'
F = '/usr/share/fonts/truetype/dejavu/'
title_f = ImageFont.truetype(F + 'DejaVuSans-Bold.ttf', 34)
num_f = ImageFont.truetype(F + 'DejaVuSans-Bold.ttf', 20)
cap_f = ImageFont.truetype(F + 'DejaVuSans.ttf', 18)
CAPS = [
    'Move it, at rest: "Where is it now?", solid border, place photo, →',
    'Typing "on my lab desk": dashed, "Set NEW place. (previously was …)"',
    'After Done: the field reads "Lab desk"; photos go to Lab desk (new)',
    'Photo of the lab desk: "ReCall is looking at the Lab desk…"',
    'The guess: "ReCall thinks this is Lab bench with a laptop"',
    'After "Append to mine": Lab desk with a laptop',
    '→ sheet: the name once, "+ What is the … in?" under it',
    'Office added as level 2: "which is in Office", + under Office',
    'Item page after Save: one Where it is, "Moved just now · Undo"',
    'Find "brochure": answers the new place',
    'Log item, after the first photo: empty field, "Where is it?"',
    'Typing a name she has ("desk drawer"): "Set place." — links, no NEW',
]
FW, FH, GAP, PAD = 390, 844, 24, 32
CAPH = 78
TITLE_H = 80
W = PAD * 2 + FW * 6 + GAP * 5
H = TITLE_H + 2 * (CAPH + FH) + GAP + PAD
c = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(c)
d.text((PAD, 22), 'Build 20261002a — one where, photo first (as built)', font=title_f, fill='#111')
for i in range(12):
    r, k = divmod(i, 6)
    x = PAD + k * (FW + GAP); y = TITLE_H + r * (CAPH + FH + GAP)
    im = Image.open(D + f'{i+1:02d}.png').convert('RGB').resize((FW, FH), Image.LANCZOS)
    d.text((x, y + 4), f'{i+1}', font=num_f, fill='#b7791f')
    lines = textwrap.wrap(CAPS[i], 33)[:3]
    for j, ln in enumerate(lines):
        d.text((x + 36, y + 4 + j * 22), ln, font=cap_f, fill='#222')
    c.paste(im, (x, y + CAPH))
    d.rectangle((x - 1, y + CAPH - 1, x + FW, y + CAPH + FH), outline='#ccc')
c.save('/home/claude/rig/walk_ow/BUILD_2026-10-02a_one-where.jpg', quality=85)
print(c.size)
