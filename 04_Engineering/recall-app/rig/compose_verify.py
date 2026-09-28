#!/usr/bin/env python3
"""Compose VERIFY_F2 screenshots into one labeled strip per requirement (+ one for regressions).
Half-size frames, JPEG quality ~85, max 6 frames per strip, 3 from look B + 3 from look A so each
strip also shows R7 parity. Output: rig/shots_verify/VERIFY_R1.jpg ... VERIFY_R6.jpg, VERIFY_REGRESSIONS.jpg
"""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, 'shots_verify')
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)

STRIPS = {
    'VERIFY_R1': ('R1 — a level holds identity AND photos; the shutter attaches, never replaces', [
        ('v-R1-b-01.png', 'B: chip-pick Kitchen counter'),
        ('v-R1-b-02.png', 'B: +2 photos, still named, badge=2'),
        ('v-R1-b-05.png', 'B: removed photo, identity survives'),
        ('v-R1-a-01.png', 'A: chip-pick (parity)'),
        ('v-R1-a-02.png', 'A: +2 photos, badge=2'),
        ('v-R1-a-05.png', 'A: removed photo, identity survives'),
    ]),
    'VERIFY_R2': ('R2 — every "where" named or picked becomes/updates a real place record', [
        ('v-R2-b-02.png', 'B: typed brand-new name'),
        ('v-R2-b-03.png', 'B: level stays selected, add-a-photo prompt'),
        ('v-R2-b-04.png', 'B: place doc created with the photo'),
        ('v-R2-b-05.png', 'B: same name later = existing row, no dup'),
        ('v-R2-a-03.png', 'A: add-a-photo prompt (parity)'),
        ('v-R2-a-05.png', 'A: no duplicate on reuse (parity)'),
    ]),
    'VERIFY_R3': ('R3 — name a new place right there; a user name outlasts a late AI answer', [
        ('v-R3-b-01.png', 'B: still "naming", about to rename'),
        ('v-R3-b-03.png', 'B: after late AI answer — user name kept'),
        ('v-R3-b-05.png', 'B: "Unnamed — tap to name" on the card'),
        ('v-R3-b-06.png', 'B: renamed via the unnamed marker'),
        ('v-R3-a-03.png', 'A: user name outlasts late AI (parity)'),
        ('v-R3-a-05.png', 'A: unnamed marker (parity)'),
    ]),
    'VERIFY_R4': ('R4 — recognition confirmed both ways; collisions never merge silently', [
        ('v-R4-b-01.png', 'B: "Your Kitchen counter?" name-collision ask'),
        ('v-R4-b-04.png', 'B: No → rename sheet, distinct-name line'),
        ('v-R4-b-05.png', 'B: renamed distinctly, Save re-enabled'),
        ('v-R4-b-07.png', 'B: thing ask + level ask — only one renders'),
        ('v-R4-a-01.png', 'A: name-collision ask (parity)'),
        ('v-R4-a-07.png', 'A: single-ask priority (parity)'),
    ]),
    'VERIFY_R5': ('R5 — the chain sheet: the pencil edits one level, not the world', [
        ('v-R5-b-02.png', 'B: chain sheet, one row per level'),
        ('v-R5-b-04.png', 'B: Replace level 2 only — 1 & 3 untouched'),
        ('v-R5-b-05.png', 'B: Remove level 2 — chain is 1 → 3'),
        ('v-R5-b-07.png', 'B: "No place yet" (2+ levels) asks confirm'),
        ('v-R5-a-02.png', 'A: chain sheet (parity)'),
        ('v-R5-a-05.png', 'A: Remove level 2 (parity)'),
    ]),
    'VERIFY_R6': ('R6 — Not put away lists only true chores', [
        ('v-R6-b-01.png', 'B: saved — soft-nudge line, no chore'),
        ('v-R6-b-02.png', 'B: "Not put away" pill unchanged'),
        ('v-R6-b-04.png', 'B: a real chore DOES bring the count up'),
        ('v-R6-b-05.png', 'B: list has real chores, not the asWhere box'),
        ('v-R6-a-01.png', 'A: soft-nudge line (parity)'),
        ('v-R6-a-05.png', 'A: list excludes asWhere box (parity)'),
    ]),
    'VERIFY_REGRESSIONS': ('Regressions — the original walk\'s basic flows still work', [
        ('v-REGRESSIONS-b-01.png', 'suggestion save'),
        ('v-REGRESSIONS-b-02.png', '+Next sweep'),
        ('v-REGRESSIONS-b-04.png', 'Move it'),
        ('v-REGRESSIONS-b-06.png', 'helper-owned camera (ownerName)'),
        ('v-REGRESSIONS-b-07.png', 'privacy note flow'),
        ('v-REGRESSIONS-a-06.png', 'helper camera (look A parity)'),
    ]),
}


def wrap(text, font, d, maxw):
    words = text.split(' ')
    lines, line = [], ''
    for w in words:
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) > maxw and line:
            lines.append(line); line = w
        else:
            line = t
    if line: lines.append(line)
    return lines


def make_strip(key, title, frames):
    fw, fh = 195, 422  # half of 390x844
    gap, pad, head, lab = 16, 24, 64, 48
    cols = len(frames)
    W = pad * 2 + cols * fw + (cols - 1) * gap
    H = head + lab + fh + 24
    pg = Image.new('RGB', (W, H), '#EDE8DE')
    d = ImageDraw.Draw(pg)
    d.text((pad, 18), title, fill='#2B2823', font=F(22, True))
    lfont = F(12, True)
    for i, (fname, label) in enumerate(frames):
        x = pad + i * (fw + gap)
        y = head
        for line in wrap(label, lfont, d, fw - 4):
            d.text((x, y), line, fill='#3A3630', font=lfont)
            y += 15
        path = os.path.join(S, fname)
        im = Image.open(path).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, head + lab))
        d.rectangle([x - 1, head + lab - 1, x + fw, head + lab + fh], outline='#B9B1A3', width=1)
    out = os.path.join(S, key + '.jpg')
    pg.save(out, quality=85, optimize=True)
    print(out, pg.size)


for key, (title, frames) in STRIPS.items():
    make_strip(key, title, frames)
