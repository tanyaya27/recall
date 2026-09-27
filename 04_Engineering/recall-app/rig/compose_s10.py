#!/usr/bin/env python3
"""S10: build 1 walked (the real app in the rig, real photos in the viewfinder) → review pages for Ravi."""
import os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(HERE, 'shots', 's10'); OUT = os.path.join(HERE, 'shots', 's10_out'); os.makedirs(OUT, exist_ok=True)
F = lambda n, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), n)
W = {w['file'][:-4]: w for w in json.load(open(os.path.join(S, 'walk.json')))}
INK = '#2B2823'; SOFT = '#5C564D'; BG = '#EDE8DE'; ACC = '#2F6B5E'
def wrap(d, text, font, width):
    out, line = [], ''
    for w in text.split():
        t = (line + ' ' + w).strip()
        if d.textlength(t, font=font) > width and line: out.append(line); line = w
        else: line = t
    if line: out.append(line)
    return out
PAGES = [
 ('S10_1_your_example', 'Build 1 · your example: key → a tin never logged → the closet shelf', 'The real app (build 20260927c in the rig), a real photo in the viewfinder at every shot. 5 taps, nothing typed (was 14 taps + 2 typed names).', [
   ('w3-01', 'The key: kept private, told here'), ('w3-02', 'Step back: the blue tin'), ('w3-03', 'Step back again: the shelf'),
   ('w3-04', 'Tap a photo: half-screen'), ('w3-05', 'Save: Home shows the chain'), ('w3-07', 'Find → the key: in the blue tin')]),
 ('S10_2_everyday', 'Build 1 · everyday logging', 'A place used before (3 taps) · into a box already logged, by its photo (4 taps; Yes is optional) · no place yet (3 taps).', [
   ('w1-01', 'Log item: step 1'), ('w1-02', 'The photo shows the counter'), ('w1-03', 'Save → Home card + Undo'),
   ('w2-01', 'A "1978 diary": no yearbook (bug #10)'), ('w2-02', 'The wooden box: asked, not assumed'), ('w2-04', 'Saved in the box; the yearbook stays'),
   ('w4-01', 'No place yet'), ('w4-02', 'Saved: "put it away later"')]),
 ('S10_3_asked_next_here', 'Build 1 · never assumed, + Next, Log here', 'A thing already logged is asked about, and Save asks before merging. + Next keeps the camera open; Log here starts in the box.', [
   ('w5-01', 'Your reading glasses? (usual place)'), ('w5-02', 'Save without answering: asked'), ('w6-01', 'Inside the wooden box'),
   ('w6-02', 'Log here: in the wooden box'), ('w6-03', '+ Next: saved, camera stays'), ('w6-04', 'The next thing: same box')]),
 ('S10_4_A_settings_rest', 'Build 1 · look A, Settings, Largest, and the button rule elsewhere', 'Photo clear (A) is one tap away in Settings; Answer card (B) is the default. Cancel asks before throwing photos away. Put away and Write it down now say one verb.', [
   ('w7-02', 'A · step 2'), ('w7-03', 'A · the tin, recognised'), ('w7-04', 'Cancel: asked first'), ('w8-01', 'Settings → Taking photos'),
   ('w11-02', 'Largest text'), ('w10-01', 'Put away: one verb'), ('w10-02', 'Write it down: Save'), ('w9-01', 'Bug #29: the sheet fits')]),
]
for key, title, sub, frames in PAGES:
    fw, gap, pad, lab = 400, 26, 44, 60
    fh = int(844 * fw / 390); Wd = pad * 2 + len(frames) * fw + (len(frames) - 1) * gap
    pg = Image.new('RGB', (Wd, 170 + lab + fh + 50), BG); d = ImageDraw.Draw(pg)
    d.text((pad, 26), title, fill=INK, font=F(42, True)); y = 86
    for l in wrap(d, sub, F(23), Wd - 2 * pad): d.text((pad, y), l, fill=SOFT, font=F(23)); y += 30
    top = 160
    for i, (f, cap) in enumerate(frames):
        x = pad + i * (fw + gap); w = W[f]
        for j, l in enumerate(wrap(d, cap, F(20, True), fw)[:1]): d.text((x, top), l, fill=ACC, font=F(20, True))
        d.text((x, top + 28), f"taps so far: {w['taps']}", fill=SOFT, font=F(16))
        im = Image.open(os.path.join(S, f + '.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
        pg.paste(im, (x, top + lab)); d.rectangle([x - 1, top + lab - 1, x + fw, top + lab + fh], outline='#B9B1A3', width=2)
    pg.save(os.path.join(OUT, key + '.jpg'), quality=84); print(key, pg.size)
