#!/usr/bin/env python3
"""S11: the evidence (worst problems, on the real screens), the fix pages, the maps, and a PDF of every crawled screen."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's11'); O = os.path.join(HERE, 'shots', 's11_out'); os.makedirs(O, exist_ok=True)
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
def sheet(key, title, sub, frames, fw=400, capcol=INK, labcol=ACC):
    gap, pad = 26, 44; fh = int(844 * fw / 390)
    probe = ImageDraw.Draw(Image.new('RGB', (9, 9)))
    caps = [wrap(probe, c, F(19), fw) for _, _, c in frames]; ch = max(len(c) for c in caps) * 25
    W = pad * 2 + len(frames) * fw + (len(frames) - 1) * gap
    pg = Image.new('RGB', (W, 190 + 40 + fh + 24 + ch + 40), BG); d = ImageDraw.Draw(pg)
    d.text((pad, 26), title, fill=INK, font=F(42, True)); y = 88
    for l in wrap(d, sub, F(23), W - 2 * pad): d.text((pad, y), l, fill=SOFT, font=F(23)); y += 30
    top = 190
    for i, (f, lab, cap) in enumerate(frames):
        x = pad + i * (fw + gap)
        for j, l in enumerate(wrap(d, lab, F(20, True), fw)[:1]): d.text((x, top), l, fill=labcol, font=F(20, True))
        im = Image.open(os.path.join(S, f + '.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, top + 36)); d.rectangle([x - 1, top + 35, x + fw, top + 36 + fh], outline='#B9B1A3', width=2)
        for j, l in enumerate(caps[i]): d.text((x, top + 36 + fh + 16 + j * 25), l, fill=capcol, font=F(19))
    pg.save(os.path.join(O, key + '.jpg'), quality=84); print(key, pg.size)

sheet('S11_evidence', 'What the crawl found: the worst of it, on the real screens',
  'Build 20260927c, your dark theme, data shaped like your phone. 28 screens, 206 taps. Numbers match the list in the board note.', [
  ('cam2', '#1 #2 · the camera', 'After the first photo, the next photo can only be a "where". Your name and the sentence are white on a white card: invisible in the dark theme.'),
  ('cam3', '#1 #4 · a second photo', 'A second photo of the spoon became a place called "Desk surface".'),
  ('home', '#15 #16 · Home', 'The pencil says "1 inside" and "No place assigned". Tapping it opens "inside the pencil", while other tiles open their own page.'),
  ('inside_pencil', '#18–#20 · inside the pencil', 'Browsing, not placing. "About this box" is the only way to the pencil itself. Log here and Put in start other jobs.'),
  ('ceta_putin', '#12 · Put things in', 'Offered on every thing: here, a blue tin, a key and a pencil can be put INTO the Cetaphil jar. This is how the cabinet ended up in the pencil.'),
  ('pencil_where', '#8 #9 · Where is it now?', 'Offers "In the filing cabinet", which is inside the pencil. Places show a photo borrowed from a thing that is there.'),
  ('pencil_where__7', '#8 · …and it saves a loop', '"Now at Filling cabinet": the pencil is in the cabinet, which is in the pencil.'),
  ('pencil_edit', '#25 #26 · Edit', '"Move to the t…" (cut off, no visible effect), "Put things in", and two Done buttons.'),
  ('cabinet_card', '#23 #24 · the cabinet\'s page', '"Written down, no photo yet". The Pencil row leads to the pencil, whose row leads back to the cabinet: round in circles.'),
], capcol=INK, labcol=RED)
sheet('S11_fix_camera', 'The fix, 1: the camera photographs the level you choose',
  'Your design: each level has its own colour. The outlined square and the shutter\'s outer ring are always the same colour, so you can see where the next photo goes. A dark see-through card: no more white on white.', [
  ('s11_c1', '1 · the thing', 'The shutter ring is white: photos go to the thing. Type it instead sits above the shutter.'),
  ('s11_c2', '2 · after the first photo', 'The spoon stays chosen (white). The ＋ square in the next colour is where it goes.'),
  ('s11_c3', '3 · another photo of it', 'A second photo goes to the spoon too: "2". Nothing is guessed.'),
  ('s11_c4', '4 · tap ＋', 'Level 1 is chosen: amber square, amber shutter ring, "Where it goes". Or tap a place.'),
  ('s11_c5', '5 · shoot the tin', 'The tin fills level 1. A new ＋ appears in the next colour.'),
  ('s11_c6', '6 · tap ＋, shoot the shelf', 'Level 2 (blue). The sentence: In the blue tin · on the linen closet shelf.'),
  ('s11_c7', '7 · tap a level\'s photo', 'Half-screen, outlined in its level\'s colour. Swipe left/right through THAT level\'s photos only (2 of 2). Remove this photo. Tap anywhere to close.'),
  ('s11_c8', 'the colours', 'The thing is white; levels 1–10 each have a colour of their own.'),
])
sheet('S11_fix_pages', 'The fix, 2: one page per thing, one way to say where',
  'Every tile opens that thing\'s page. You only ever say where THIS thing is, with the same camera. No "put things in", no toolbars of other jobs, no loops.', [
  ('s11_h1', 'Home', 'Line 2 of every tile is where it is. Amber = no place yet. "N inside" only on something that holds things.'),
  ('s11_p1', 'The pencil\'s page', 'Where it is: No place yet → Put it somewhere. What the AI saw sits under the photo. No bottom bar, no Edit mode.'),
  ('s11_p4', 'Put it somewhere', 'The same camera, with the pencil already there and level 1 chosen. Photograph the place or tap one.'),
  ('s11_l1', '••• every place and box', 'Search, a new place or box by photo, then every place and every box. Never the pencil itself, never a loop.'),
  ('s11_p2', 'A thing in a box', 'Where it is, as photos: the tin, then the shelf. Move it uses the same camera.'),
  ('s11_p3', 'A box\'s page', 'Where it is, and In it (each opens its own page; Back returns). "Log something into the tin" starts the camera there.'),
  ('s11_n1', 'Not put away', 'A list of the things with no place; each opens its page. Putting several away at once comes later, on the camera.'),
])
for m in ['s11_map_now', 's11_map_new']:
    im = Image.open(os.path.join(S, m + '.png')).convert('RGB'); im.save(os.path.join(O, m.replace('s11_', 'S11_') + '.jpg'), quality=86)
# every crawled screen, one per page
import json
T = json.load(open(os.path.join(HERE, 'crawl_titles.json')))
pages = [Image.open(os.path.join(O, f'S11_{k}.jpg')).convert('RGB') for k in T if os.path.exists(os.path.join(O, f'S11_{k}.jpg'))]
pages[0].save(os.path.join(O, 'S11_crawl_every_screen.pdf'), save_all=True, append_images=pages[1:], resolution=110)
print('pdf pages', len(pages))
