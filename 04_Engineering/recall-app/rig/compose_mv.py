from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
S = '/home/claude/rig/shots_mv/'
frames = [
 ('mv_0_now.png', 'Now (your screenshot)', 'thing + places mixed, pills, 4 lines'),
 ('mv_1_move_T1.html', 'A · thing top-left on the picture', 'your proposal; question beside Cancel'),
 ('mv_2_move_T2.html', 'B · thing beside Cancel', 'picture fully clear; one band'),
 ('mv_3_three_tiers.html', 'Three tiers', 'status of the selected tier + the chain'),
 ('mv_4_plus_sheet.html', '+ opens the chooser', 'search, photograph, recent places'),
 ('mv_5_tier_sheet.html', 'Tap a selected square', 'change, rename, insert between, remove'),
 ('mv_6_log_suggestion.html', 'Log item: first photo taken', 'usual place pre-filled (dashed)'),
 ('mv_7_log_thing_selected.html', 'Log item: more photos of it', 'tap the thing; ring turns white'),
]
W, H, LAB = 780, 1688, 110
img = Image.new('RGB', (W * len(frames), H + LAB + 70), 'white'); d = ImageDraw.Draw(img)
d.text((20, 18), 'Camera card, redesigned for multi-tier places — mockups (not built)', font=F, fill='#111')
for i, (f, lab, sub) in enumerate(frames):
    im = Image.open(S + f.replace('.html', '.png')).convert('RGB').resize((W - 20, H - 20 * H // W)); x = i * W + 10
    d.rectangle([x, 70, x + W - 20, 70 + LAB - 10], fill='#1F2937' if lab.startswith('Now') else '#2F6B5E')
    d.text((x + 16, 80), lab, font=F, fill='white'); d.text((x + 16, 118), sub, font=f2, fill='#E5E7EB'); img.paste(im, (x, 70 + LAB))
img = img.resize((img.width * 2 // 3, img.height * 2 // 3))
img.save('/home/claude/out/MV_2026-09-29_camera-card-redesign.jpg', quality=80); print(img.size)
