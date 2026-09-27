#!/usr/bin/env python3
"""S9: the board's redesign pages (mockups from gen_s9.py → render_s9.js) + the tap table."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's9'); OUT = os.path.join(HERE, 'shots', 's9_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
INK = '#2B2823'; SOFT = '#5C564D'; BG = '#EDE8DE'; ACC = '#2F6B5E'; RED = '#D23A2A'
def wrap(d, text, font, width):
    out, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) > width and line: out.append(line); line = w
        else: line = t
    if line: out.append(line)
    return out
PAGES = [
 ('S9_redesign_1', 'The fix: "where" is answered like "what" — with the camera',
  'Your example: bank locker key → a blue tin she has never logged → the linen closet shelf. She never leaves the camera and never types. Each step back is one shutter press; the Save button always names the place (Q2).',
  [('r1_1', '1 tap · Log item', 'Step 1 prompt on the viewfinder. No mode row (Q3). "Type it" stays for things you can\'t photograph.'),
   ('r1_2', '2 · shutter: the key', 'The key becomes a photo chip (lock: only me). The camera now asks for WHERE. Known places are chips; Save already offers "no place yet".'),
   ('r1_3', '3 · shutter: the tin', 'The tin is a new box, with its photo, named by the AI. Save now says "in the blue tin".'),
   ('r1_4', '4 · shutter: the shelf', 'Step back once more: the shelf, with its own photo. The line shows the whole chain; "Change" if anything is wrong.'),
   ('r1_5', '5 · Save', 'Home shows what was saved, as the photo chain, with Undo. The tin is a box with a photo and a place. Nothing to tidy.'),
   ('r1_6', 'Find: "locker key"', 'The answer is the chain in walking order: the closet shelf, then the tin, then the key.')]),
 ('S9_redesign_2', 'The same camera answers "where" everywhere',
  'One screen for "where" — after a photo, from a thing\'s card, and when putting things away. Places and boxes both get photos, so the camera can recognise them next time.',
  [('r2_1', 'W1 · 3 taps', 'The photo shows the hall table, so Save already says "Save · Hall table": Log item, shutter, Save. A place logged before photos existed shows a pin until someone photographs it.'),
   ('r2_2', 'W2 · 4 taps', 'Photograph the wooden box: "Your wooden box?" is asked, never assumed. Where the box is comes along by itself.'),
   ('r2_3', 'W4 · later: Not put away', '"Save · no place yet" (3 taps) puts it here. Later, one tap on the chip…'),
   ('r2_4', 'W4 · …where are they going?', '…opens the same camera: photograph the drawer (a new place gets its photo) or tap a chip.'),
   ('r2_5', 'W4 · tap each, Put', 'Then tap what goes there. 4 taps for one thing, 1 more per extra thing, no typing.'),
   ('r2_6', 'W5 · a thing with no place', '"Where is it?" on its card opens the same camera at step 2. No Edit, no list, no sheet on a sheet.')]),
 ('S9_redesign_3', 'Ruling needed: where the Save and the chain sit on the camera',
  'Both have the same steps and taps. A keeps the photo clear and the Save button in the same spot every time. B puts the answer in one card you read top to bottom, but it covers part of the photo.',
  [('r3_a', 'A · Save bar (board)', 'The Save button never moves; your thumb learns it. The chain photos sit where your eyes already are.'),
   ('r3_b', 'B · answer card', 'Everything about this log in one card: easy to read, but it covers a third of the viewfinder, and the shutter sits below it.')]),
 ('S9b_buttons', 'Where the buttons go: Cancel, Save, Next',
  'Your three groupings and the board\'s, all in B at the last step of your example. Cancel is now a real button; the title is gone (the step prompt says what is happening). The Save button says only "Save"; where it goes is the two-line sentence right above it.',
  [('g1', 'Your 1 · Cancel + Next', 'Both leave this item, but does "Next item" keep the key? If yes, it is a second Save far from Save. If no, the key is lost. And both are at the top, away from the thumb that is on the shutter.'),
   ('g2', 'Your 2 · Cancel + Save', '"This item" together, but the button that throws it away touches the one that keeps it. A hurried thumb, or Dr Kim\'s tremor, loses the key. Next item is at the top, out of reach during a sweep.'),
   ('g3', 'Your 3 · all together', 'As you said: it reads as either/or, three choices in one row, and Cancel is still one button from Save.'),
   ('g4', 'Board · keep vs. throw away', 'Cancel throws them away: alone, top-left, where every iPhone sheet puts it, away from the thumb. The two ways to KEEP them sit together: "Save + next" (the label says it saves) and Save. The shutter only takes photos.')]),
 ('S9b_both', 'The fix, in both styles (Settings → Look → The camera)',
  'One verb per button; the sentence beside it is always two lines (where · what that is in), so it never wraps oddly. Capture controls in one row (shutter, Type it, place chips), keeping in another (Save + next, Save), throwing away at the top (Cancel).',
  [('a1', 'Step 1 (the same in A and B)', 'Cancel is a button; there is no title to mistake for one. Type it sits beside the shutter because it is the other way to capture.'),
   ('a2', 'A · step 2', 'The chain on the photo; chips, then the shutter; then the sentence and the two Keep buttons, always in the same place.'),
   ('a4', 'A · done', 'The sentence answers, the pencil changes it, Save saves. Nothing moves between steps.'),
   ('b2', 'B · step 2', 'The card holds the thing, the sentence and the Keep buttons. Its cost: while she aims at the tin, the card covers the lower third of the photo.'),
   ('b4', 'B · done', 'Everything about this log in one card, read top to bottom.'),
   ('bh', 'Helping Mom', 'Whose ReCall is a label (not a button) top-right, in the helper colour.'),
   ('st', 'Settings → Look', 'Both styles, picked by picture. Default B (your lean). It lives in Look, not Experimentation: it stays.'),
   ('pa', 'Put away, same rule', 'Button "Put away"; "1 thing · into the desk drawer" above it. Every sentence-button in the app gets the same treatment.')]),
 ('S9c_round3', 'Round 3: Save beside the shutter, one meaning per icon, a chain that lines up',
  'Your 09-27 notes, drawn. B is the default (A stays in Settings → Look). Every overlay stays slightly see-through.',
  [('c_a1', 'Step 1 (A and B)', 'Before the first photo there is nothing to save, so both sides of the shutter are empty. "Type it instead" moved above the shutter so a slot never changes meaning.'),
   ('c_a2', 'A · step 2', 'Save + next and Save sit either side of the shutter: the space was wasted. The Save icon stands in for the word in "+ Next". The empty "where" square has a pin with a ?, not a camera.'),
   ('c_a4', 'A · deeper chain', 'The photos line up: every name gets the same two-line space. "in" is a pill. A deeper chain scrolls sideways (the arrow and the fade say there is more).'),
   ('c_b2', 'B · step 2 (default)', 'The card now holds only what is being logged: the chain, the name, the sentence. The buttons moved beside the shutter, so the card covers less of the photo.'),
   ('c_b4', 'B · done: tap a photo…', 'Every photo in the chain can be tapped, in A and B (the tin is outlined here to show the tap).'),
   ('c_b5', 'B · a deeper chain', 'Card → wooden box → memorabilia box → storage unit: the thumbnails scroll sideways here too (fade + arrow).'),
   ('c_pv', '…it opens half-screen', 'Centred, with its name and where it is. Tap anywhere to close; the camera is still there behind it.'),
   ('c_ic', 'One meaning per icon', 'The camera means take a photo, nothing else. Save is its own icon. The pin with a ? marks a place not known yet.')]),
]
def page(key, title, sub, frames, extra=None):
    fw, gap, pad = 420, 30, 44
    W = pad * 2 + len(frames) * fw + (len(frames) - 1) * gap
    if extra: W = W + 1560
    probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    caps = [wrap(probe, c, F(20), fw) for *_, c in frames]; ch = max(len(c) for c in caps) * 27
    fh = int(844 * fw / 390); top = 190
    H = top + 40 + fh + 20 + ch + 50
    pg = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(pg)
    d.text((pad, 26), title, fill=INK, font=F(44, True)); y = 90
    for l in wrap(d, sub, F(24), W - 2 * pad): d.text((pad, y), l, fill=SOFT, font=F(24)); y += 32
    for i, (f, lab, _) in enumerate(frames):
        x = pad + i * (fw + gap)
        d.text((x, top), lab, fill=ACC, font=F(22, True))
        im = Image.open(os.path.join(S, f's9_{f}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, top + 40)); d.rectangle([x - 1, top + 39, x + fw, top + 40 + fh], outline='#B9B1A3', width=2)
        for j, l in enumerate(caps[i]): d.text((x, top + 40 + fh + 16 + j * 27), l, fill=INK, font=F(20))
    if extra: extra[0](pg, d, top, W, pad + len(frames) * (fw + gap) + 40)
    pg.save(os.path.join(OUT, key + '.jpg'), quality=85); print(key, pg.size)
ROWS = [('W1 · a thing at a place used before', '4 (+ scroll if the place is low)', '3', 'Log item, shutter, Save · Hall table'),
        ('W2 · into a box already logged', '5 + close the keyboard', '4', '…shutter on the box, "Your wooden box?" Yes, Save'),
        ('W3 · into a box NOT logged, and its place', '14 + 2 typed names, no photo of the shelf', '5, nothing typed', 'shutter key, tin, shelf, Save'),
        ('W4 · log now', '4', '3', 'Save · no place yet'),
        ('W4 · put away later (1 thing)', '4, a new place typed', '4, a new place photographed', 'chip, shutter or chip, tap it, Put'),
        ('W5 · give a box its place', '4 + typing (from the card, via Edit)', '3 (from the card)', '"Where is it?", shutter, Save')]
def table(pg, d, y, W, pad):
    d.text((pad, y), 'Taps, today vs. the redesign', fill=INK, font=F(30, True)); y += 56
    cols = [pad, pad + 470, pad + 900, pad + 1150]
    for c, h in zip(cols, ['Flow', 'Today (walked, build 20260927b)', 'Redesign', 'How']): d.text((c, y), h, fill=SOFT, font=F(20, True))
    y += 36
    for r in ROWS:
        d.line([pad, y - 10, W - 44, y - 10], fill='#CFC7B8', width=2)
        cells = [(wrap(d, r[0], F(22), 440), INK, F(22)), (wrap(d, r[1], F(22, True), 410), RED, F(22, True)), (wrap(d, r[2], F(22, True), 230), ACC, F(22, True)), (wrap(d, r[3], F(20), 330), SOFT, F(20))]
        for c, (lines, col, fnt) in zip(cols, cells):
            for j, l in enumerate(lines): d.text((c, y + j * 29), l, fill=col, font=fnt)
        y += max(len(x[0]) for x in cells) * 29 + 26
for p in PAGES:
    page(*p, extra=(table, 360) if p[0] == 'S9_redesign_3' else None)
