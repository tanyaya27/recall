#!/usr/bin/env python3
"""Compose C1 fast-capture shots into one page per option + a summary. JPEG (LESSONS 09-24: PNG composites are heavy)."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 'c1'); OUT = os.path.join(HERE, 'shots', 'c1_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)

PAGES = {
 'C1_1_strip': ('Option 1 · The camera never leaves',
   'The shutter saves. Guesses stream into a frosted strip over the live camera; the next shutter press means "that one is right". No confirm page, no timer.',
   [('o1_a', 'Open · aim ring'), ('o1_b', 'Shutter → Saved at once'), ('o1_c', 'Name + usual place arrive'),
    ('o1_d', 'Place unsure → 3 choices'), ('o1_e', 'Session place · 3rd thing'), ('o1_f', 'Done → fix only wrong ones'),
    ('o1_g', 'Largest'), ('o1_dusk', 'Dusk')],
   ['One thing: icon · Log item · shutter · Done = 4 taps (today 5); native, from the lock screen: 3',
    'Five things, one place: icon · Log item · 5 shutters · Done · Finished = 9 taps (today ~25)',
    'A wrong guess costs 1 tap (the ▾ on the place, or a name in the review)']),
 'C1_2_card': ('Option 2 · Today\'s photo card, place already chosen',
   'The small change: after Done the photo card appears as today, but the likeliest place is already chosen and saved. "Next item" goes straight back to the camera.',
   [('o2_a', 'Camera (as today)'), ('o2_b', 'Usual place chosen + saved'), ('o2_c', 'Place unsure (as today)'),
    ('o2_d', 'Largest'), ('o2_dusk', 'Dusk')],
   ['One thing: icon · Log item · shutter · Done · Done = 5 taps (today 5, but no place question when sure)',
    'Five things, one place: 2 + 5 × (shutter + Done) + 4 × Next item + Done = 17 taps (today ~25)',
    'Least new to learn; the camera closes between every item']),
 'C1_3_everything': ('Option 3 · Everything in view (a drawer, a shelf, a box)',
   'A switch in the camera: one photo logs every thing the AI can see, all at one place. Off by default (Devin: her glasses on a busy table must not become twenty guesses).',
   [('o3_a', 'Camera: "Everything in view" on'), ('o3_b', 'List of what it found (works today)'), ('o3_c', 'Labels on objects (after the test)'),
    ('o3_d', 'Largest'), ('o3_e', 'Later: Find "duct tape"'), ('o3_dusk', 'Dusk')],
   ['A drawer of 6 things: icon · Log item · switch · shutter · Done · Save = 6 taps (today ~30)',
    'Each wrong or missing thing: 1 tap (a switch, or tap it in the photo)',
    'The same flow catalogues a room for insurance (Ravi, 09-24)']),
}

def page(key, fs=1.0):
    title, sub, frames, taps = PAGES[key]
    fw, fh = int(390 * fs), int(844 * fs); gap, lab, pad, head = 30, 44, 44, 162
    cols = min(len(frames), 8)
    tapH = 44 * len(taps) + 40
    W = pad * 2 + cols * fw + (cols - 1) * gap; H = head + lab + fh + tapH + pad
    pg = Image.new('RGB', (W, H), '#EDE8DE'); d = ImageDraw.Draw(pg)
    d.text((pad, 28), title, fill='#2B2823', font=F(46, True))
    d.text((pad, 92), sub, fill='#5C564D', font=F(24))
    d.text((pad, 122), 'Taps counted from the ReCall icon on the home screen (web app). All web versions also get iOS\'s camera prompt on each launch until the native app.', fill='#8A6528', font=F(20, True))
    for i, (f, l) in enumerate(frames):
        x = pad + i * (fw + gap)
        d.text((x, head + 4), l, fill='#3A3630', font=F(20, True))
        im = Image.open(os.path.join(S, f'c1_{f}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, head + lab)); d.rectangle([x - 1, head + lab - 1, x + fw, head + lab + fh], outline='#B9B1A3', width=2)
    y = head + lab + fh + 24
    for t in taps:
        d.text((pad, y), '•  ' + t, fill='#2B2823', font=F(26, True)); y += 44
    pg.save(os.path.join(OUT, key + '.jpg'), quality=86, optimize=True)
    return pg

if __name__ == '__main__':
    for k in PAGES: page(k)
    print(sorted(os.listdir(OUT)))
