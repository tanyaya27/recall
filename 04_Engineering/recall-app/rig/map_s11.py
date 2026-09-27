#!/usr/bin/env python3
"""S11 maps: the paths to "where" today (from the crawl) vs. the board's fix. Writes mock/s11_map_now.html, s11_map_new.html."""
import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mock')
CSS = '''*{box-sizing:border-box} body{margin:0;width:1200px;height:860px;background:#EDE8DE;font-family:-apple-system,Inter,system-ui,sans-serif;color:#2B2823;position:relative;overflow:hidden}
h1{margin:26px 36px 4px;font-size:32px} p.s{margin:0 36px;color:#5C564D;font-size:17px}
.n{position:absolute;padding:10px 14px;border-radius:14px;background:#fff;border:2px solid #B9B1A3;font-size:16px;font-weight:700;text-align:center;line-height:1.25}
.n small{display:block;font-weight:500;color:#5C564D;font-size:13px;margin-top:2px}
.n.w{background:#FCE9E4;border-color:#D23A2A} .n.g{background:#E4EEEA;border-color:#2F6B5E} .n.h{background:#2B2823;color:#fff;border-color:#2B2823} .n.h small{color:#ccc}
svg.a{position:absolute;inset:0;width:1200px;height:860px} .lg{position:absolute;left:36px;bottom:24px;font-size:15px;color:#5C564D}
.lg b{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:-3px;margin:0 6px 0 16px}'''
def page(title, sub, nodes, edges, legend):
    ns = ''.join(f'<div class="n {c}" style="left:{x}px;top:{y}px;width:{w}px">{t}</div>' for (x, y, w, t, c) in nodes)
    DASH = 'stroke-dasharray="7 6"'
    ar = ''.join(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{sw}" marker-end="url(#m{mk})" {DASH if dash else ""}/>' for d, col, sw, mk, dash in edges)
    return f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><h1>{title}</h1><p class="s">{sub}</p>
<svg class="a"><defs><marker id="mr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#D23A2A"/></marker>
<marker id="mg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2F6B5E"/></marker>
<marker id="mk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8A8176"/></marker></defs>{ar}</svg>{ns}<div class="lg">{legend}</div></body></html>'''
R, G, K = '#D23A2A', '#2F6B5E', '#8A8176'
# ---- today (build 20260927c, as crawled)
now_nodes = [
 (40, 140, 150, 'Home', 'h'), (270, 120, 190, 'Inside a box<small>tap a tile that holds something</small>', ''),
 (270, 300, 190, 'Box page<small>“About this box”</small>', ''), (40, 330, 150, 'Hold sheet<small>8 choices</small>', ''),
 (520, 120, 190, 'Thing page<small>tap any other tile</small>', ''), (520, 300, 190, 'Thing page + Edit<small>Move to the top · Put things in · Done</small>', ''),
 (790, 110, 200, 'Where is it now?<small>places + boxes + a pencil</small>', 'w'), (790, 250, 200, 'What is it in?<small>every thing is a “box”</small>', 'w'),
 (790, 390, 200, 'Put things in …<small>from 4 places; any thing into any thing</small>', 'w'), (270, 480, 190, 'Put away<small>Not put away → where → tap</small>', 'w'),
 (520, 520, 190, 'Camera<small>every extra photo = a “where”</small>', 'w'), (790, 560, 200, 'Write it down<small>its own where list</small>', 'w'),
 (1010, 330, 160, 'A loop<small>pencil in cabinet in pencil</small>', 'w')]
now_edges = [
 ('M190 160 L270 150', K, 2, 'k', 0), ('M190 170 L520 150', K, 2, 'k', 0), ('M365 172 L365 300', K, 2, 'k', 0), ('M460 330 C500 330 500 180 520 170', K, 2, 'k', 0),
 ('M615 180 L615 300', K, 2, 'k', 0), ('M710 330 C750 320 760 150 790 140', R, 3, 'r', 0), ('M890 170 L890 250', R, 3, 'r', 0), ('M710 345 L790 415', R, 3, 'r', 0),
 ('M460 345 C600 400 700 420 790 425', R, 3, 'r', 0), ('M460 155 C650 60 900 60 950 390', R, 3, 'r', 1), ('M190 360 C400 380 600 420 790 440', R, 3, 'r', 0),
 ('M115 185 L115 330', K, 2, 'k', 0), ('M115 185 C115 460 200 500 270 505', R, 3, 'r', 0), ('M615 180 C700 250 700 520 700 545', K, 2, 'k', 1),
 ('M710 560 L790 590', R, 3, 'r', 0), ('M990 140 C1060 150 1080 250 1090 330', R, 3, 'r', 0), ('M520 340 C470 360 470 240 460 200', K, 2, 'k', 1), ('M365 360 C420 420 520 400 560 360', K, 2, 'k', 1)]
# ---- the fix
new_nodes = [
 (40, 360, 150, 'Home<small>every tile opens its page</small>', 'h'), (300, 150, 230, 'Log item<small>the camera: the thing, then where</small>', 'g'),
 (300, 360, 230, 'The thing’s page<small>Where it is · In it · Add photo · Rename · Private · Remove</small>', 'g'),
 (620, 360, 250, 'Put it somewhere / Move it<small>the same camera, at the “where” level</small>', 'g'), (940, 360, 220, '••• every place and box<small>search · new one by photo</small>', 'g'),
 (300, 600, 230, 'A thing in it<small>its own page · Back returns</small>', 'g'), (40, 600, 150, 'Not put away<small>a list → each page</small>', 'g'), (40, 150, 150, 'Find<small>→ the page</small>', 'g')]
new_edges = [
 ('M190 390 L300 390', G, 3, 'g', 0), ('M190 370 C240 300 250 200 300 185', G, 3, 'g', 0), ('M530 395 L620 395', G, 3, 'g', 0), ('M870 395 L940 395', G, 3, 'g', 0),
 ('M415 430 L415 600', G, 3, 'g', 0), ('M115 420 L115 600', G, 3, 'g', 0), ('M190 630 C250 560 260 470 300 440', G, 3, 'g', 0), ('M115 360 L115 205', G, 3, 'g', 0)]
open(os.path.join(OUT, 's11_map_now.html'), 'w').write(page('Today: six different screens change where a thing is',
  'Crawled: 28 screens, 206 taps. Red = a screen that sets “where”. The arrows are real taps; dashed ones lead back round in a circle.', now_nodes, now_edges,
  '<b style="background:#FCE9E4;border:2px solid #D23A2A"></b>sets “where” (6 kinds) <b style="background:#fff;border:2px solid #B9B1A3"></b>other screens'))
open(os.path.join(OUT, 's11_map_new.html'), 'w').write(page('The fix: one page per thing, one way to say where',
  'You only ever say where THIS thing is, and always with the same camera. Every path goes forward; Back goes back. No loops, no “put things in”.', new_nodes, new_edges,
  '<b style="background:#E4EEEA;border:2px solid #2F6B5E"></b>every screen that remains'))
print('ok')
