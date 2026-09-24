#!/usr/bin/env python3
"""Compose S3 step-3 shots into one JPEG page per topic (LESSONS 09-24: no PNG composites)."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's3'); OUT = os.path.join(HERE, 'shots', 's3_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
PAGES = {
 'S3_private': ('Private by default (Ravi, 09-24)',
   'A thing that looks private (passwords, PINs, medical or insurance papers, ID) starts as "Only me". She is told on the same screen, with one tap to share it instead.',
   [('a1_one', 'One thing: told on the photo card'), ('a2_several', 'Several: told in the strip'), ('a3_write', 'Written: switch already on'), ('a4_helper', 'A helper logging: warned, not hidden')],
   ['Decided by the AI when it names the photo, and by a word list for typed names (works with no AI at all)',
    'Only the owner can keep a thing to herself (today\'s rule), so a helper gets a warning and a "Don\'t save it", never a hidden item',
    '"Share it instead" is one tap and is never asked again for that thing']),
 'S3_places': ('Places inside places, and boxes that move (#7)',
   'A place can sit inside another place: a tin on a shelf in a wardrobe; Box 14 in storage unit 214. The answer walks outward, each level with its own photo. Two ways to pick one: ruling needed.',
   [('b1_drill_1', 'B1 Drill down, one level at a time'), ('b1_drill_2', 'B1 Next time: usual place + path'), ('b2_say', 'B2 Say it all; ReCall splits it'),
    ('b3_answer', 'Find: the chain, outward'), ('b4_tree', 'Places as a tree'), ('b5_box', 'A box: its things, "Move this box"'), ('l1_drill', 'Largest: drill down'), ('l2_answer', 'Largest: the chain')],
   ['B1: taps only, one level at a time; "Just on the top shelf" stops at any level. Most taps the first time, none after (usual place)',
    'B2: one typed or spoken line; the AI splits it (a word-list fallback splits on "in", "on", commas). Fastest, but a wrong split must be fixed',
    'Moving Box 14 moves its 13 things with it: one change, not thirteen']),
 'S3_everything': ('Everything in view (#8)',
   'The third camera mode: one photo of a drawer, shelf or box saves every thing the AI can see, all at one place. Also the insurance catalogue flow (S6).',
   [('c1_camera', 'Camera: "Everything" mode'), ('c2_found', 'What it found: switches'), ('c3_home', 'Home: one tile for the sweep'), ('c4_answer', 'Find "duct tape": ringed')],
   ['A drawer of 6 things: icon · Log item · Everything · shutter · Save = 5 taps (today ~30)',
    'Each wrong thing: one switch. "Missed something?" tap it in the photo',
    'Home shows the sweep as one tile ("6 things"), not six copies of the same photo']),
}
def page(key, fs=1.0):
    title, sub, frames, notes = PAGES[key]
    fw, fh = int(390 * fs), int(844 * fs); gap, lab, pad, head = 30, 44, 44, 176
    cols = len(frames); tapH = 44 * len(notes) + 40
    W = max(pad * 2 + cols * fw + (cols - 1) * gap, 1900); H = head + lab + fh + tapH + pad
    pg = Image.new('RGB', (W, H), '#EDE8DE'); d = ImageDraw.Draw(pg)
    d.text((pad, 28), title, fill='#2B2823', font=F(46, True))
    # wrap the subtitle
    words, line, y = sub.split(), '', 92
    for w in words:
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=F(24)) > W - 2 * pad: d.text((pad, y), line, fill='#5C564D', font=F(24)); y += 30; line = w
        else: line = t
    d.text((pad, y), line, fill='#5C564D', font=F(24))
    for i, (f, l) in enumerate(frames):
        x = pad + i * (fw + gap)
        d.text((x, head + 4), l, fill='#3A3630', font=F(18, True))
        im = Image.open(os.path.join(S, f's3_{f}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, head + lab)); d.rectangle([x - 1, head + lab - 1, x + fw, head + lab + fh], outline='#B9B1A3', width=2)
    y = head + lab + fh + 24
    for t in notes: d.text((pad, y), '•  ' + t, fill='#2B2823', font=F(24, True)); y += 44
    pg.save(os.path.join(OUT, key + '.jpg'), quality=86, optimize=True)
if __name__ == '__main__':
    for k in PAGES: page(k)
    print(sorted(os.listdir(OUT)))
