#!/usr/bin/env python3
"""Compose the H1 shots into one page per concept, the six-up montage and the own-title strip."""
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, 'shots', 'h1')
OUT = os.path.join(HERE, 'shots', 'h1_out'); os.makedirs(OUT, exist_ok=True)

def font(sz, bold=False):
    for f in (['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'] if bold else ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()

NAMES = {
  'A': ('The Album', 'Her name as a masthead; her photos edge to edge, three across, like her own Photos app.'),
  'B': ('The Index', 'One row per thing: photo, name and where it is, so Home answers the question without a tap.'),
  'C': ('The Note', 'A greeting and one band (the last thing she put down), then her things as today.'),
  'D': ('The Prints', 'Her things as printed photographs on paper that is hers, the place written under each.'),
  'E': ('The Two Doors', 'The top half is a live camera window (tap it to log); the bottom half is Find and her things.'),
  'F': ('Ask First', 'A big "Where is my…" field leads; her things sit small below; the camera is one round button.'),
}
ROW1 = [('own', 'Her own · Normal · Linen'), ('help', 'Robert in Margaret’s · Can help'), ('see', 'Peter · Can see (+ Phase 4 status line)'),
        ('large', 'Her own · Largest'), ('dusk', 'Her own · Dusk')]
ROW2 = [('ccard', 'Thing card · as Robert'), ('cphoto', 'Photo card · as Robert'), ('ccamera', 'Camera · as Robert'),
        ('cswitch', 'Switching · as Robert'), ('later', 'Later: appointment + routine')]

W, H = 390, 844  # each frame at 1x (shots are 2x; downsample for a readable page)
def frame(L, v, scale=1.0):
    im = Image.open(os.path.join(S, f'h1_{L}_{v}.png')).convert('RGB')
    return im.resize((int(W * 2 * scale / 2 * 1), int(H * 2 * scale / 2)), Image.LANCZOS) if scale != 2 else im

def concept_page(L, fs=1.4):
    fw, fh = int(W * fs), int(H * fs)
    gap, lab, pad, head = 36, 46, 48, 150
    width = pad * 2 + 5 * fw + 4 * gap
    height = head + 2 * (lab + fh) + gap + pad
    pg = Image.new('RGB', (width, height), '#EDE8DE'); d = ImageDraw.Draw(pg)
    name, idea = NAMES[L]
    d.text((pad, 34), f'{L}  ·  {name}', fill='#2B2823', font=font(52, True))
    d.text((pad, 100), idea, fill='#5C564D', font=font(30))
    for r, row in enumerate([ROW1, ROW2]):
        y = head + r * (lab + fh + gap)
        for i, (v, label) in enumerate(row):
            x = pad + i * (fw + gap)
            d.text((x, y + 6), label, fill='#3A3630', font=font(24, True))
            im = Image.open(os.path.join(S, f'h1_{L}_{v}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
            pg.paste(im, (x, y + lab)); d.rectangle([x - 1, y + lab - 1, x + fw, y + lab + fh], outline='#B9B1A3', width=2)
    return pg

def montage(fs=1.2):
    fw, fh = int(W * fs), int(H * fs)
    gap, lab, pad, head = 40, 70, 48, 130
    width = pad * 2 + 6 * fw + 5 * gap
    height = head + 2 * (lab + fh) + 40 + pad
    pg = Image.new('RGB', (width, height), '#EDE8DE'); d = ImageDraw.Draw(pg)
    d.text((pad, 30), 'Home, rethought: six concepts', fill='#2B2823', font=font(54, True))
    d.text((pad, 96), 'Top row: Margaret’s own ReCall (Normal, Linen). Bottom row: Robert looking at Margaret’s ReCall (Can help). Same nine things everywhere.', fill='#5C564D', font=font(28))
    for i, L in enumerate('ABCDEF'):
        x = pad + i * (fw + gap)
        for r, v in enumerate(['own', 'help']):
            y = head + r * (lab + fh + 40)
            d.text((x, y + 8), f'{L} · {NAMES[L][0]}' + ('' if r == 0 else ' · Can help'), fill='#3A3630', font=font(26, True))
            im = Image.open(os.path.join(S, f'h1_{L}_{v}.png')).convert('RGB').resize((fw, fh), Image.LANCZOS)
            pg.paste(im, (x, y + lab)); d.rectangle([x - 1, y + lab - 1, x + fw, y + lab + fh], outline='#B9B1A3', width=2)
    return pg

def title_strip(fs=1.2, crop=300):
    """Her own screen titled with her name (Noor) vs 'My ReCall' (Devin): the top of each concept."""
    fw = int(W * fs); ch = int(crop * fs)
    gap, lab, pad, head = 40, 60, 48, 130
    width = pad * 2 + 6 * fw + 5 * gap
    height = head + 2 * (lab + ch) + 30 + pad
    pg = Image.new('RGB', (width, height), '#EDE8DE'); d = ImageDraw.Draw(pg)
    d.text((pad, 30), 'Her own screen: her name, or “My ReCall”? (the board splits)', fill='#2B2823', font=font(50, True))
    d.text((pad, 94), 'Top: her name (Noor, Maya, Dr Kim). Bottom: “My ReCall” (Devin, Margaret). The top of each concept, nothing else changed.', fill='#5C564D', font=font(28))
    for i, L in enumerate('ABCDEF'):
        x = pad + i * (fw + gap)
        for r, v in enumerate(['own', 'mine_alt']):
            y = head + r * (lab + ch + 30)
            d.text((x, y + 6), f'{L} · ' + ('her name' if r == 0 else 'My ReCall'), fill='#3A3630', font=font(28, True))
            im = Image.open(os.path.join(S, f'h1_{L}_{v}.png')).convert('RGB')
            im = im.crop((0, 0, im.width, crop * 2)).resize((fw, ch), Image.LANCZOS)
            pg.paste(im, (x, y + lab)); d.rectangle([x - 1, y + lab - 1, x + fw, y + lab + ch], outline='#B9B1A3', width=2)
    return pg

if __name__ == '__main__':
    only = sys.argv[1:] or list('ABCDEF') + ['montage', 'titles']
    files = {'A': 'H1_A_album', 'B': 'H1_B_index', 'C': 'H1_C_note', 'D': 'H1_D_prints', 'E': 'H1_E_two-doors', 'F': 'H1_F_ask-first'}
    for L in only:
        if L in files: concept_page(L).save(os.path.join(OUT, files[L] + '.png'), optimize=True)
        elif L == 'montage': montage().save(os.path.join(OUT, 'H1_montage.png'), optimize=True)
        elif L == 'titles': title_strip().save(os.path.join(OUT, 'H1_own_title.png'), optimize=True)
    print(sorted(os.listdir(OUT)))
