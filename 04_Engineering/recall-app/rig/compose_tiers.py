# Compose the tier-audit option renders (shots_opts/*.png) into one labelled sheet per question.
from PIL import Image, ImageDraw, ImageFont
import os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots_opts')
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
def sheet(title, frames, out):
    W, H, LAB = 780, 1688, 110
    img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white')
    d = ImageDraw.Draw(img); d.text((20, 18), title, font=F, fill='#111')
    for i, (f, lab, sub) in enumerate(frames):
        im = Image.open(os.path.join(D, f)).convert('RGB').resize((W - 20, H - 20 * H // W))
        x = i * W + 10
        d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill='#1F2937' if lab.startswith('Now') else '#2F6B5E')
        d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 118), sub, font=f2, fill='#E5E7EB')
        img.paste(im, (x, 70 + LAB))
    img.save(out, quality=82); print(out, img.size)
O = '/home/claude/out'
sheet('Q1 · The thing\'s page, "Where it is": Drawer 3, in the Oak cabinet, in the Office', [
    ('Q1-0-now.png', 'Now (after the fix)', 'stored, but only tier 1 shows'),
    ('Q1-A-row.png', 'A · the row, continued', 'every tier a square, words below'),
    ('Q1-B-words.png', 'B · words only', 'one square, the rest in words'),
    ('Q1-C-ladder.png', 'C · a ladder', 'one row per tier, each opens')], f'{O}/TIERS_Q1_where-it-is.jpg')
sheet('Q2 · The Places list', [
    ('Q2-0-now.png', 'Now', 'flat; no place says where it is'),
    ('Q2-A-in-line.png', 'A · "in the …" line', 'flat list, where it is under the name'),
    ('Q2-B-nested.png', 'B · nested', 'inner places indented under outer')], f'{O}/TIERS_Q2_places-list.jpg')
sheet('Q3 · A place that already has a "where" is said to be somewhere else (Kitchen counter is in Craft nook)', [
    ('Q3-0-now-tier1.png', 'Now (after the fix)', 'its where shows once picked'),
    ('Q3-0-now-silent.png', 'Now: the last word wins', 'Pantry shelf replaces Craft nook, silently'),
    ('Q3-A-shown-as-tier2.png', 'A · it comes in as tier 2', 'you see it; tap another to change'),
    ('Q3-B-announced.png', 'B · last word wins, said', 'the card says what moved'),
    ('Q3-C-ask.png', 'C · ask before it moves', 'Move it / No, keep Craft nook')], f'{O}/TIERS_Q3_re-parent.jpg')
sheet('Q4 · A place inside a box (Linen closet in the tin box)', [
    ('Q4-A-allowed-pills.png', 'A · allowed (now)', 'boxes offered after a place'),
    ('Q4-A-allowed.png', 'A · allowed (now)', 'Linen closet · Tin box · Garage'),
    ('Q4-B-places-only.png', 'B · places only', 'after a place, only places')], f'{O}/TIERS_Q4_place-in-box.jpg')
sheet('Q5 · A question about tier 2 arrives while tier 3 is selected', [
    ('Q5-0-now.png', 'Now', 'only the colour says which tier'),
    ('Q5-A-ask-shows-its-square.png', 'A · the ask shows its square', 'the photo it is asking about'),
    ('Q5-B-jump-to-tier2.png', 'B · jump to tier 2', 'the camera selects that tier')], f'{O}/TIERS_Q5_ask-other-tier.jpg')
