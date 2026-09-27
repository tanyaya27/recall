#!/usr/bin/env python3
"""S9: the board's visual walkthrough of today's app, composed into annotated JPEG pages.
Reads shots/s9/*.png + walk.json (walk_s9.js). Red numbers = the issues in BOARD_2026-09-27_walkthrough.md."""
import os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's9'); OUT = os.path.join(HERE, 'shots', 's9_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
WALK = {w['file'][:-4]: w for w in json.load(open(os.path.join(S, 'walk.json')))}
RED = '#D23A2A'; INK = '#2B2823'; SOFT = '#5C564D'; BG = '#EDE8DE'

ISSUES = {
 1: 'The camera opens with "One thing / Several" under the viewfinder: a choice before the first photo. You ruled every photo is one thing (Q3).',
 2: 'The camera says nothing. No "what is it", no "now where it is". It is a bare shutter; the place is asked after she leaves the camera (the opposite of Q1).',
 3: 'After the shutter the photo drops into a roll and she must find "Done (1)" bottom right. One extra tap, every single log.',
 4: '"In something" and "No place yet" are small outlined buttons. "No place yet" saves at once but looks like a filter.',
 5: 'The AI\'s guess (Kitchen counter) looks like every other place: nothing says the photo shows it. Tapping a name IS the save, with no "Save · Kitchen counter" (Q2).',
 6: 'The list runs 1.5 screens: 5 bare place names, 2 boxes with photos, Somewhere else, 2 view links. Two kinds of "where" that look different.',
 7: '"Saved · Kitchen counter", but the scissors are nowhere on Home: new things go to the END of Home, below the fold.',
 8: 'A "1978 diary" was taken for "Yearbook 1978" (a shared number). The card says "New photo of Yearbook 1978".',
 9: 'Four stacked decisions: the usual place (a plain name, not "In the memorabilia box" with its photo), Next item / Done, In something / No place yet, Somewhere else.',
 10: 'Choosing the wooden box MOVED THE YEARBOOK into it; the diary was never logged. The memorabilia box now says "1 inside". Wrong thing moved, silently. (Bug: fixed whatever the redesign.)',
 11: '"What is it in?" opens with the keyboard up, over the boxes. She must close it to see them.',
 12: 'Everything is offered as a box: scissors, reading glasses, wallet, the coffee can. The real boxes are lost among things nobody puts anything in.',
 13: 'The sheet covers the photo card: she loses sight of the thing she is placing.',
 14: '"Saved · Wooden box" and Home does not change. Nothing shows the chain back: in the wooden box, in the memorabilia box, crawl space.',
 15: 'A box she has not logged can only be TYPED. The tin is in her hand and there is no camera on this sheet ("type its name above").',
 16: 'Typing empties the grid; the sheet drops to the bottom of the screen, so "New: Blue tin" lands where the keyboard is.',
 17: 'The new tin has no photo and no place, and nothing asks. "Not put away" goes 1 → 2: the tin became a chore.',
 18: 'Tapping the tin opens a near-empty "inside the tin" page, not the tin. A box tile and a thing tile do different things.',
 19: 'The way to the tin itself is a small underlined "About this box".',
 20: '"Written down, no photo yet · Add photo below if you like": she never wrote anything; she is holding the tin.',
 21: 'The tin\'s place is under Edit, below the photo: scroll to "Add the place".',
 22: 'The long list again. A place\'s picture is borrowed from a thing that happens to be there (Kitchen counter = the scissors). No way to photograph the shelf.',
 23: 'The shelf is typed into a box at the very bottom of the sheet, where the keyboard opens.',
 24: 'Find answers "In the blue tin". Where the tin is sits in small grey text in a row under the photo. The answer is not one line.',
 25: 'Saved with no place: the toast says only "Saved" (no name yet) and the charger is not on screen.',
 26: 'Put away asks "where" first, from a list of 10 (boxes, places, Somewhere else). No camera; a new place is typed.',
 27: 'A second sheet: tap each thing, then a button whose label is an instruction until something is picked. Two sheets, 4 taps for one thing.',
 28: 'A thing with no place opens with Edit already open, so the footer and card look unlike every other card.',
 29: '"Where is it now?" runs off the right edge of the screen here (layout bug).',
 30: '"In something" opens a second sheet on top of the first, offering the phone charger as a box.',
 31: 'Several is still a mode with its own strip and its own questions. Under Q3 it goes (one thing per photo, then "Detect other items").',
}
# Frames: (shot, caption, [(issue, anchor)]) — anchor = walk.json rect key or (x, y, w, h) in CSS px.
PAGES = [
 ('S9_walk_1', 'W1 · A thing at a place she has used before', 'Scissors on the kitchen counter. Today: 4 taps. Every screen as it is in build 20260927b, with a real photo in the viewfinder.', [
   ('w1-01', '1 · Home', []),
   ('w1-02', '2 · Log item: the camera', [(1, 'modes'), (2, (95, 6, 200, 32))]),
   ('w1-03', '3 · Shutter', [(3, 'done')]),
   ('w1-05', '4 · Done → photo card', [(4, 'paths'), (5, (30, 635, 330, 58))]),
   ('w1-06', '4 · …the whole card', [(6, (30, 630, 330, 620))]),
   ('w1-07', '5 · Tap the place: saved', [(7, (16, 120, 358, 580))]),
 ]),
 ('S9_walk_2', 'W2 · Into a box she has already logged', 'A 1978 diary into the wooden box (inside the memorabilia box, in the crawl space). Today: 5 taps + closing the keyboard, and the wrong thing moved.', [
   ('w2-01', '4 · The photo card', [(8, (30, 455, 330, 90)), (9, (30, 596, 330, 250))]),
   ('w2-02', '5 · In something', [(11, (0, 508, 390, 336)), (13, (0, 0, 390, 135))]),
   ('w2-03', '5 · …keyboard closed', [(12, 'grid')]),
   ('w2-04', '6 · Tap the wooden box: saved', [(10, (16, 120, 173, 228)), (14, (16, 700, 358, 64))]),
 ]),
 ('S9_walk_3', 'W3 · Into a box she has NOT logged (your example), part 1', 'Bank locker key → the blue tin → the top shelf of the bedroom wardrobe. The key and the tin are both in her hands.', [
   ('w3-01', '4 · The photo card', []),
   ('w3-02', '5 · In something', [(11, (0, 508, 390, 336)), (15, 'newrow')]),
   ('w3-03', '5 · Types "blue tin"', [(16, 'newrow')]),
   ('w3-04', '6 · New: Blue tin → saved', [(17, (16, 71, 178, 40))]),
   ('w3-05', '7 · Taps the tin', [(18, (16, 150, 200, 165)), (19, 'banner')]),
   ('w3-06', '8 · About this box', [(20, 'written')]),
   ('w3-07', '11 · Add photo, shutter, Done', []),
 ]),
 ('S9_walk_4', 'W3 · part 2: giving the tin its place, then finding the key', 'Today: 14 taps, 2 typed names, 9 screens and sheets. The shelf can never be photographed.', [
   ('w3-08', '12 · Edit (scroll)', [(21, 'field')]),
   ('w3-09', '13 · Where it is', [(22, 'list')]),
   ('w3-10', '14 · Somewhere else, type', [(23, 'input')]),
   ('w3-11', '15 · Use this', []),
   ('w3-12', 'Home after all that', []),
   ('w3-13', 'Find: "locker key"', []),
   ('w3-14', 'The answer', [(24, (16, 58, 358, 425))]),
 ]),
 ('S9_walk_5', 'W4 · Log now, place later  ·  W5 · A box into a place  ·  W6 · Several', 'Phone charger now, the desk drawer later: 4 taps + 4 taps. The coffee can into something from its card. The Several mode.', [
   ('w4-02', 'W4 · No place yet: saved', [(25, (16, 700, 358, 64))]),
   ('w4-03', 'W4 · later: Not put away', [(26, 'sheet')]),
   ('w4-04', 'W4 · tap each thing', [(27, 'foot')]),
   ('w4-06', 'W4 · Put 1 at Desk drawer', []),
   ('w5-01', 'W5 · the coffee can', [(28, (16, 788, 358, 56))]),
   ('w5-02', 'W5 · Where it is', [(29, (300, 283, 98, 52))]),
   ('w5-03', 'W5 · In something', [(30, 'grid')]),
   ('w6-01', 'W6 · Several', [(31, (0, 590, 390, 50))]),
 ]),
]

def wrap(d, text, font, width):
    out, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) > width and line: out.append(line); line = w
        else: line = t
    if line: out.append(line)
    return out

def keyboard(im, sc):
    """The iPhone keyboard (approx. 336 pt with the suggestion bar) over the bottom of the frame."""
    W, H = im.size; top = int(H - 336 * sc)
    d = ImageDraw.Draw(im, 'RGBA'); d.rectangle([0, top, W, H], fill=(209, 212, 219, 245))
    d.rectangle([0, top, W, top + int(44 * sc)], fill=(197, 200, 207, 255))
    rows = [10, 9, 7]; ky = top + int(56 * sc); kh = int(42 * sc); gap = int(6 * sc)
    for r, n in enumerate(rows):
        kw = (W - gap * 11) / 10; x0 = (W - (n * kw + (n - 1) * gap)) / 2
        for i in range(n): d.rounded_rectangle([x0 + i * (kw + gap), ky, x0 + i * (kw + gap) + kw, ky + kh], radius=int(5 * sc), fill=(255, 255, 255, 255))
        ky += kh + int(12 * sc)
    d.rounded_rectangle([W * 0.25, ky, W * 0.75, ky + kh], radius=int(5 * sc), fill=(255, 255, 255, 255))
    d.text((int(10 * sc), top + int(12 * sc)), 'iPhone keyboard (approx.)', fill=(70, 70, 80, 255), font=F(max(12, int(15 * sc)), True))

def page(key, title, sub, frames):
    fw = 420; sc = fw / 390; pad, gap, lab = 44, 28, 64
    ims = []
    for f, cap, marks in frames:
        w = WALK[f]; im = Image.open(os.path.join(S, f + '.png')).convert('RGB')
        im = im.resize((fw, int(im.height * fw / im.width)), Image.LANCZOS)
        if w['keyboard'] and any(m[1] == (0, 508, 390, 336) for m in marks): keyboard(im, sc)
        d = ImageDraw.Draw(im, 'RGBA')
        for n, a in marks:
            r = w['rects'].get(a) if isinstance(a, str) else dict(zip('xywh', a))
            if not r: continue
            x, y, ww, hh = r['x'] * sc, r['y'] * sc, r['w'] * sc, r['h'] * sc
            d.rounded_rectangle([x, y, x + ww, y + hh], radius=8, outline=RED, width=4)
            cx, cy = min(fw - 22, x + ww - 6), max(22, y + 4)
            d.ellipse([cx - 20, cy - 20, cx + 20, cy + 20], fill=RED, outline='white', width=3)
            t = str(n); fnt = F(20, True); tw = d.textlength(t, font=fnt); d.text((cx - tw / 2, cy - 12), t, fill='white', font=fnt)
        ims.append((im, cap, w, marks))
    fh = max(i.height for i, *_ in ims)
    nums = [n for *_, marks in ims for n, _ in marks]; nums = sorted(set(nums))
    W = pad * 2 + len(ims) * fw + (len(ims) - 1) * gap
    probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    colw = (W - 2 * pad - 40) // 2; leg = []
    for n in nums: leg.append((n, wrap(probe, ISSUES[n], F(22), colw - 56)))
    half = (len(leg) + 1) // 2; colh = lambda L: sum(len(l) * 30 + 16 for _, l in L)
    legh = max(colh(leg[:half]), colh(leg[half:])) if leg else 0
    H = 170 + lab + fh + 50 + legh + 40
    pg = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(pg)
    d.text((pad, 26), title, fill=INK, font=F(44, True)); y = 88
    for l in wrap(d, sub, F(24), W - 2 * pad): d.text((pad, y), l, fill=SOFT, font=F(24)); y += 32
    top = 170
    for i, (im, cap, w, marks) in enumerate(ims):
        x = pad + i * (fw + gap)
        d.text((x, top + 2), cap, fill=INK, font=F(20, True))
        tl = f"taps so far: {w['taps']}" + (f"  ·  typed {w['typed']}" if w['typed'] else '')
        for j, l in enumerate(wrap(d, tl, F(16), fw)[:2]): d.text((x, top + 28 + j * 18), l, fill=RED if w['typed'] else SOFT, font=F(16, bool(w['typed'])))
        pg.paste(im, (x, top + lab)); d.rectangle([x - 1, top + lab - 1, x + fw, top + lab + im.height], outline='#B9B1A3', width=2)
    y0 = top + lab + fh + 40
    for c, L in enumerate([leg[:half], leg[half:]]):
        yy = y0; xx = pad + c * (colw + 40)
        for n, lines in L:
            d.ellipse([xx, yy, xx + 36, yy + 36], fill=RED); t = str(n); tw = d.textlength(t, font=F(18, True)); d.text((xx + 18 - tw / 2, yy + 7), t, fill='white', font=F(18, True))
            for j, l in enumerate(lines): d.text((xx + 50, yy + 4 + j * 30), l, fill=INK, font=F(22))
            yy += len(lines) * 30 + 16
    pg.save(os.path.join(OUT, key + '.jpg'), quality=84)
    print(key, pg.size)

for p in PAGES: page(*p)
