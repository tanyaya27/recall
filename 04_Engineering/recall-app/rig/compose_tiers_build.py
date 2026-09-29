from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
OLD = '/home/claude/rig_old/shots_tiers/'; NEW = '/home/claude/rig/shots_tiers/'
frames = [
 (OLD + 'v-S1-b-06.png', '20260929b · Move it again', 'In air was lost: "Current place: Desk drawer"'),
 (NEW + 'v-S1-b-06.png', '20260929c · Move it again', 'stored: "Desk drawer / In air"'),
 (OLD + 'v-S2-b-01.png', 'b · three tiers', 'tier 3 cut off, + out of sight'),
 (NEW + 'v-S2-b-01.png', 'c · three tiers', 'selected square and + in view, fade'),
 (OLD + 'v-S8-b-02.png', 'b · second unnamed place', 'would merge into "A place"'),
 (NEW + 'v-S8-b-02.png', 'c · second unnamed place', 'waits for its own name'),
 (OLD + 'v-S12-b-01.png', 'b · Craft nook, tier 2 too', 'offered again in •••'),
 (NEW + 'v-S12-b-01.png', 'c · Craft nook, tier 2 too', 'not offered'),
 (NEW + 'v-S16-b-01.png', 'c · Settings → Version', 'last line: the build name'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Build 20260929c · the tier fixes, before (b) and after (c) — rig, real rules on', font=F, fill='#111')
for i, (f, lab, sub) in enumerate(frames):
    im = Image.open(f).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill='#1F2937' if lab.startswith('2026092' + '9b') or lab.startswith('b ') else '#2F6B5E')
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 118), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 2 // 3, img.height * 2 // 3))
img.save('/home/claude/out/BUILD_2026-09-29c_tiers-before-after.jpg', quality=80); print(img.size)
