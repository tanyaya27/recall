from PIL import Image, ImageDraw, ImageFont
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F = lambda s, b=True: ImageFont.truetype(B if b else R, s)
S = '/home/claude/rig/shots_sz/'; O = '/home/claude/out/'
NAMES = {
 'R1': ('Ravi option 1', "place's photo in the disc + '+' tab  |  pin in the disc + 'New' tab"),
 'R2': ('Ravi option 2', "'+' in the disc + place-photo tab  |  'New' in the disc + pin tab"),
 'A':  ('A · Glyph in the disc (recommended)', 'photo-stack glyph = more photos  |  pin = new place  |  nothing above the ring'),
 'B':  ('B · Caption above the shutter', 'shutter untouched; a frosted caption in words docks above it'),
}
HEAD = {'R1': '#3A3F4B', 'R2': '#3A3F4B', 'A': '#2F6B5E', 'B': '#4B3A5A'}
FRAMES = [('modal.png', 'The modal', 'marks on both choices'), ('a.png', '(a) default', 'plain shutter: the shot asks'),
          ('b.png', '(b) more photos', 'after "Another photo of…"'), ('d.png', '(d) after each shot', 'frame ~240 of 320 ms'),
          ('choose.png', 'Choose place', '"Photograph a new place"'), ('c.png', '(c) new place', 'the next shot IS the place'),
          ('b_bright.png', '(b) on a bright scene', 'closet.jpg')]
CLOSE = [('a_close.png', '(a) 3×'), ('b_close.png', '(b) 3×'), ('c_close.png', '(c) 3×'), ('b_bright_close.png', '(b) bright 3×')]

def sheet(opt):
    fw, fh, g = 390, 844, 12; lab = 64
    W = len(FRAMES) * (fw + g) + g; top = 70
    closeH = 480; mh = 0
    modal = Image.open(S + opt + '/modal.png').convert('RGB'); mw, mhh = modal.size
    mc = modal.crop((0, {'R1': 520, 'R2': 496, 'A': 504, 'B': 462}[opt] * 3 - 12, mw, mhh)); mc = mc.resize((int(mc.width * closeH / mc.height), closeH), Image.LANCZOS)
    H = top + lab + fh + g + 40 + closeH + g
    cw_sum = g + sum(int(Image.open(S + opt + '/' + f).width * closeH / Image.open(S + opt + '/' + f).height) + g for f, _ in CLOSE) + mc.width + g
    W = max(W, cw_sum)
    img = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(img)
    t, sub = NAMES[opt]; d.rectangle([0, 0, W, top - 8], fill=HEAD[opt])
    d.text((g + 4, 12), t, font=F(30), fill='white'); d.text((g + 4 + d.textlength(t, font=F(30)) + 24, 18), sub, font=F(22, False), fill='#E8E6E1')
    for i, (f, l1, l2) in enumerate(FRAMES):
        x = g + i * (fw + g); im = Image.open(S + opt + '/' + f).convert('RGB').resize((fw, fh), Image.LANCZOS)
        d.text((x + 2, top + 2), l1, font=F(22), fill='#111'); d.text((x + 2, top + 32), l2, font=F(17, False), fill='#555')
        img.paste(im, (x, top + lab))
    y = top + lab + fh + g
    d.text((g + 2, y + 4), 'Close-ups (real pixels, 3×) and the modal rows', font=F(22), fill='#111'); y += 40
    x = g
    for f, l in CLOSE:
        im = Image.open(S + opt + '/' + f).convert('RGB'); im = im.resize((int(im.width * closeH / im.height), closeH), Image.LANCZOS)
        img.paste(im, (x, y)); d.rectangle([x, y, x + 150, y + 30], fill='white'); d.text((x + 6, y + 4), l, font=F(18), fill='#111'); x += im.width + g
    img.paste(mc, (x, y)); d.rectangle([x, y, x + 170, y + 30], fill='white'); d.text((x + 6, y + 4), 'modal rows 1.5×', font=F(18), fill='#111')
    img.save(O + f'DESIGN_2026-09-30_shutter-{opt}.jpg', quality=88); print(opt, img.size)

def overview():
    opts = ['R1', 'R2', 'A', 'B']; cw = 800; g = 16; top = 64; lab = 78
    fw = (cw - g) // 2; fh = int(fw * 2532 / 1170)
    rows_h = 790; SHEET_TOP = {'R1': 520, 'R2': 496, 'A': 504, 'B': 462}; close_h = int(fw * 480 / 600)
    H = top + lab + rows_h + g + fh + g + 34 + close_h + g
    img = Image.new('RGB', (g + len(opts) * (cw + g), H), 'white'); d = ImageDraw.Draw(img)
    d.text((g, 16), 'Shutter marks — four options on the real screens: the modal choice, (b) more photos, (c) new place, 3× close-ups', font=F(28), fill='#111')
    for i, o in enumerate(opts):
        x = g + i * (cw + g); t, sub = NAMES[o]
        d.rectangle([x, top, x + cw, top + lab - 8], fill=HEAD[o]); d.text((x + 12, top + 8), t, font=F(26), fill='white'); d.text((x + 12, top + 42), sub[:78], font=F(17, False), fill='#E8E6E1')
        y = top + lab
        m = Image.open(S + o + '/modal.png').convert('RGB'); mw, mh = m.size; mc = m.crop((0, SHEET_TOP[o] * 3 - 12, mw, mh))
        mc = mc.resize((cw, int(mc.height * cw / mc.width)), Image.LANCZOS); d.rectangle([x, y, x + cw, y + rows_h], fill='#161513')
        img.paste(mc, (x, y + rows_h - mc.height)); y += rows_h + g
        for j, f in enumerate(['b.png', 'c.png']):
            im = Image.open(S + o + '/' + f).convert('RGB').resize((fw, fh), Image.LANCZOS); img.paste(im, (x + j * (fw + g), y))
            d.rectangle([x + j * (fw + g), y, x + j * (fw + g) + 60, y + 30], fill='white'); d.text((x + j * (fw + g) + 8, y + 3), '(b)' if j == 0 else '(c)', font=F(20), fill='#111')
        y += fh + g; d.text((x, y + 2), 'close-ups 3×: (b), (c)', font=F(19), fill='#111'); y += 34
        for j, f in enumerate(['b_close.png', 'c_close.png']):
            im = Image.open(S + o + '/' + f).convert('RGB').resize((fw, close_h), Image.LANCZOS); img.paste(im, (x + j * (fw + g), y))
    img = img.resize((img.width * 4 // 5, img.height * 4 // 5), Image.LANCZOS)
    img.save(O + 'DESIGN_2026-09-30_shutter-overview.jpg', quality=88); print('overview', img.size)

import sys
for o in (sys.argv[1:] or ['R1', 'R2', 'A', 'B']): sheet(o)
overview()
