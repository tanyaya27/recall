#!/usr/bin/env python3
"""C1 — fast capture, three options (2026-09-24; brainstorm §7). Drawn from the app's stylesheet
(../out/styles.css) + mock-only rules. Writes mock/c1_<option>_<frame>.html. Photos: mock/img (Commons)."""
import os
from gen_h1 import I, page, svg, OUT

I = dict(I)
I['check'] = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.5)
I['plus'] = svg('<path d="M12 5v14M5 12h14"/>', 2.5)
I['grid'] = svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>')
I['target'] = svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5"/>')

def V(theme='linen', scale=1):
    return dict(theme=theme, scale=scale)

CAM_CSS = '''
.camera-view img.live { width:100%; height:100%; object-fit:cover; }
.camera-roll .roll-shot img { width:100%; height:100%; object-fit:cover; border-radius:0.75rem; }
/* the aim ring: a fixed-size soft ring in the centre of the viewfinder (nothing on a photo scales) */
.aim { position:absolute; left:50%; top:46%; width:150px; height:150px; margin:-75px 0 0 -75px; border-radius:50%; border:3px solid rgba(255,255,255,0.9); box-shadow:0 0 0 1px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.25); }
.aim-hint { position:absolute; left:0; right:0; top:calc(46% + 88px); text-align:center; color:#fff; font:600 15px/1.2 -apple-system,system-ui,sans-serif; text-shadow:0 1px 4px rgba(0,0,0,0.7); }
/* session place chip under the top bar */
.cam-place { position:absolute; top:0.75rem; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:0.35rem; padding:0.45rem 0.9rem; border-radius:999px; background:rgba(0,0,0,0.55); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); color:#fff; font-weight:700; font-size:min(1rem,4.3vw); white-space:nowrap; }
.cam-place svg { width:1.2em; height:1.2em; }
.cam-place.set { background:var(--accent); color:var(--accent-ink); }
.cam-count { position:absolute; top:0.75rem; right:0.75rem; background:rgba(0,0,0,0.55); color:#fff; border-radius:999px; padding:0.35rem 0.7rem; font:700 14px/1 -apple-system,system-ui,sans-serif; }
/* THE STRIP (option 1): frosted, over the bottom of the live viewfinder; words scale, the photo doesn't */
.strip1 { position:absolute; left:0.625rem; right:0.625rem; bottom:0.625rem; border-radius:1.125rem; padding:0.625rem; display:flex; gap:0.75rem; align-items:flex-start;
  background:rgba(20,20,18,0.72); -webkit-backdrop-filter:blur(14px) saturate(1.2); backdrop-filter:blur(14px) saturate(1.2); color:#fff; box-shadow:0 6px 20px rgba(0,0,0,0.35); }
.strip1 .th { position:relative; flex:none; width:64px; height:64px; }
.strip1 .th img { width:64px; height:64px; object-fit:cover; border-radius:10px; }
.strip1 .th .ang { position:absolute; right:-8px; bottom:-8px; width:28px; height:28px; border-radius:50%; background:#fff; color:#000; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.4); }
.strip1 .th .ang svg { width:16px; height:16px; }
.strip1 .bd { flex:1; min-width:0; }
.strip1 .saved { display:flex; align-items:center; gap:0.3rem; font-size:min(0.875rem,3.8vw); font-weight:700; color:#9FE0C9; }
.strip1 .saved svg { width:1.1em; height:1.1em; }
.strip1 .nm { font-size:min(1.25rem,5.2vw); font-weight:700; line-height:1.2; margin-top:0.125rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.strip1 .nm.wait { color:rgba(255,255,255,0.6); font-weight:600; }
.strip1 .pl { display:inline-flex; align-items:center; gap:0.3rem; margin-top:0.375rem; padding:0.3rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.16); font-weight:700; font-size:min(1rem,4.3vw); white-space:nowrap; max-width:100%; overflow:hidden; }
.strip1 .pl svg { width:1.1em; height:1.1em; flex:none; }
.strip1 .pl small { font-weight:600; opacity:0.7; font-size:0.85em; }
.strip1 .chips { display:flex; flex-wrap:wrap; gap:0.375rem; margin-top:0.375rem; }
.strip1 .chips span { padding:0.35rem 0.65rem; border-radius:999px; background:rgba(255,255,255,0.16); font-weight:700; font-size:min(0.9375rem,4vw); white-space:nowrap; }
.strip1 .q { font-size:min(0.9375rem,4vw); font-weight:600; color:rgba(255,255,255,0.75); margin-top:0.375rem; }
.camera-bar .camera-done { font-size:min(1.125rem,4.8vw); }
.stack { position:absolute; left:0.625rem; bottom:calc(0.625rem + 96px); display:flex; gap:6px; }
.stack img { width:40px; height:40px; object-fit:cover; border-radius:8px; border:2px solid rgba(255,255,255,0.85); }
'''

def camera(view, overlay='', title='Log item', count='', bar_done='Done', roll=True, v=V(), css='', top_extra=''):
    rollhtml = '<div class="camera-roll"></div>' if not roll else ''
    body = f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Cancel</button><div class="camera-title">{title}</div><div class="camera-count">{count}</div></div>
<div class="camera-view"><img class="live" src="img/{view}.jpg">{overlay}</div>{rollhtml}
<div class="camera-bar"><span></span><button class="shutter"><span></span></button><button class="camera-done">{bar_done}</button></div></div>'''
    return page(body, v, CAM_CSS + css)

def strip(thumb, name=None, place=None, place_note='', chips=None, angle=True):
    nm = f'<div class="nm">{name}</div>' if name else '<div class="nm wait">Naming…</div>'
    if chips:
        pl = f'<div class="q">Where is it?</div><div class="chips">{"".join(f"<span>{c}</span>" for c in chips)}</div>'
    elif place:
        pl = f'<div class="pl">{I["pin"]} {place} {I["down"]}{f" <small>{place_note}</small>" if place_note else ""}</div>'
    else:
        pl = ''
    ang = f'<span class="ang">{I["plus"]}</span>' if angle else ''
    return f'<div class="strip1"><div class="th"><img src="img/{thumb}.jpg">{ang}</div><div class="bd"><div class="saved">{I["check"]} Saved</div>{nm}{pl}</div></div>'

frames = {}
# ---------------------------------------------------------------- option 1: strip over the live camera
aim = '<div class="aim"></div><div class="aim-hint">Aim at the thing</div>'
frames['o1_a'] = camera('keys', aim)
frames['o1_b'] = camera('keys', strip('keys'), count='1')
frames['o1_c'] = camera('keys', strip('keys', 'Car keys', 'Hall table', 'usual place'), count='1')
frames['o1_d'] = camera('book', strip('book', 'Library book', chips=['Sofa', 'Bedside table', 'Desk', 'Other…']), count='2')
frames['o1_e'] = camera('wallet', f'<div class="cam-place set">{I["pin"]} Hall table · every photo {I["down"]}</div>' +
                        '<div class="stack"><img src="img/keys.jpg"><img src="img/glasses.jpg"></div>' +
                        strip('wallet', 'Wallet', 'Hall table', 'this session'), count='3')
frames['o1_g'] = camera('keys', strip('keys', 'Car keys', 'Hall table', 'usual place'), count='1', v=V(scale=1.38))
REVIEW_CSS = '''
.rv-sub { color:var(--ink-soft); font-size:min(1.0625rem,4.5vw); font-weight:600; margin:-0.25rem 0 0.75rem; display:flex; align-items:center; gap:0.35rem; }
.rv-sub svg { width:1.15em; height:1.15em; color:var(--accent); }
.rv { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.5rem; }
.rv div { background:var(--card); border-radius:0.75rem; overflow:hidden; box-shadow:var(--shadow); }
.rv img { width:100%; aspect-ratio:1/1; object-fit:cover; }
.rv b { display:flex; align-items:center; justify-content:space-between; gap:0.25rem; padding:0.35rem 0.5rem; font-size:min(0.9375rem,4vw); white-space:nowrap; overflow:hidden; }
.rv b svg { width:0.95em; height:0.95em; color:var(--accent); flex:none; }
.rv b.fix { background:var(--amber-bg); color:var(--amber); } .rv b.fix svg { color:var(--amber); }
.rv-note { color:var(--ink-soft); font-size:min(0.9375rem,4vw); margin-top:0.75rem; }
'''
rv = ''.join(f'<div><img src="img/{k}.jpg"><b class="{"fix" if n.endswith("?") else ""}">{n}{I["pencil"]}</b></div>' for k, n in
             [('keys', 'Car keys'), ('glasses', 'Reading glasses'), ('wallet', 'Wallet'), ('charger', 'Phone charger'), ('diary', 'Notebook?')])
frames['o1_f'] = page(f'''<div class="screen with-footer"><div class="header"><button class="back">‹ Back</button><div class="title">5 things saved</div></div>
<div class="rv-sub">{I["pin"]} Hall table · just now</div><div class="rv">{rv}</div>
<p class="rv-note">All saved. Tap a name only if it’s wrong.</p>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["check"]}<span class="lbl">Finished</span></button></div></div></div>''', V(), REVIEW_CSS)

# ---------------------------------------------------------------- option 2: today's photo card, place already chosen
P2_CSS = '''
.guess.pre { background:var(--accent); color:var(--accent-ink); display:flex; align-items:center; justify-content:space-between; }
.guess.pre small { font-weight:600; opacity:0.85; font-size:0.8em; }
.guess.pre svg { width:1.2em; height:1.2em; }
.saved-line { display:flex; align-items:center; gap:0.35rem; color:var(--accent); font-weight:700; font-size:min(1rem,4.3vw); margin-top:0.5rem; }
.saved-line svg { width:1.1em; height:1.1em; }
.card.photo-card .photo-full { max-height:30vh; }
.guesses .guess { min-height:3.25rem; padding:0.75rem 1rem; }
'''
PENCIL = I['pencil'].replace('<svg', '<svg class="pencil"')
def p2card(v=V(), pre=True):
    chips = (f'<button class="guess pre"><span>Hall table <small>· usual place</small></span>{I["check"]}</button>' if pre else '<button class="guess">Hall table</button>') + \
            ''.join(f'<button class="guess">{p}</button>' for p in ['Kitchen counter', 'Desk']) + '<button class="guess other">Somewhere else…</button>'
    saved = f'<div class="saved-line">{I["check"]} Saved at Hall table. Tap another place to change it.</div>' if pre else ''
    return page(f'''<div class="screen with-footer"><div class="header"><button class="back">‹ Back</button><div class="title">Log item</div></div>
<div class="card photo-card"><img class="photo-full" src="img/keys.jpg">
<div class="field-value big"><span class="field-text">Car keys</span>{PENCIL}</div>
<div class="ask-place"><div class="ask-q">Where is it?</div><div class="guesses">{chips}</div>{saved}</div></div>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["camera"]}<span class="lbl">Next item</span></button><button class="btn-primary alt">{I["check"]}<span class="lbl">Done</span></button></div></div></div>''', v, P2_CSS)
frames['o2_a'] = camera('keys', count='1 of 4', roll=False)
frames['o2_b'] = p2card()
frames['o2_c'] = p2card(pre=False)
frames['o2_d'] = p2card(V(scale=1.38))

# ---------------------------------------------------------------- option 3: everything in view (a drawer)
P3_CSS = '''
.modeseg { position:absolute; top:0.75rem; left:50%; transform:translateX(-50%); display:flex; background:rgba(0,0,0,0.55); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); border-radius:999px; padding:3px; }
.modeseg span { padding:0.4rem 0.8rem; border-radius:999px; color:#fff; font-weight:700; font-size:min(0.9375rem,4vw); white-space:nowrap; }
.modeseg span.on { background:#fff; color:#000; }
.found-photo { position:relative; }
.found-photo img { width:100%; border-radius:0.75rem; aspect-ratio:4/3; object-fit:cover; display:block; }
.found-head { display:flex; align-items:center; justify-content:space-between; margin:0.625rem 0 0.25rem; }
.found-head b { font-size:min(1.25rem,5.2vw); }
.found-head .pl { display:inline-flex; align-items:center; gap:0.3rem; color:var(--accent); font-weight:700; font-size:min(1rem,4.3vw); white-space:nowrap; }
.found-head .pl svg { width:1.1em; height:1.1em; }
.frow { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; min-height:2.75rem; border-bottom:1px solid var(--line); font-size:min(1.0625rem,4.5vw); font-weight:600; }
.frow:last-child { border-bottom:none; }
.frow .sw { flex:none; }
.frow.off { color:var(--ink-soft); }
.addhint { color:var(--ink-soft); font-size:min(0.9375rem,4vw); margin-top:0.5rem; display:flex; gap:0.35rem; align-items:center; }
.addhint svg { width:1.1em; height:1.1em; color:var(--accent); flex:none; }
/* labels pinned on objects: fixed px, over the photo (only after the position spike) */
.pinlab { position:absolute; transform:translate(-50%,-50%); background:rgba(20,20,18,0.78); color:#fff; font:700 13px/1 -apple-system,system-ui,sans-serif; padding:6px 9px; border-radius:999px; white-space:nowrap; display:flex; align-items:center; gap:4px; box-shadow:0 1px 4px rgba(0,0,0,0.4); }
.pinlab svg { width:13px; height:13px; color:#9FE0C9; }
.pinlab.off { background:rgba(255,255,255,0.85); color:#333; } .pinlab.off svg { color:#999; }
.spike { display:inline-block; background:var(--amber-bg); color:var(--amber); font-weight:700; font-size:0.875rem; padding:0.2rem 0.6rem; border-radius:999px; margin-bottom:0.5rem; }
.ans .loc-big { margin-top:0.5rem; }
.ring { position:absolute; width:90px; height:62px; border:3px solid #fff; border-radius:50%; box-shadow:0 0 0 2px rgba(0,0,0,0.4); transform:translate(-50%,-50%); }
'''
FOUND = [('Oven mitt', 1), ('Duct tape', 1), ('Can holders', 1), ('Work gloves', 1), ('Rubber bands', 1), ('Pens and markers', 1), ('Zip bags', 0)]
def found(v=V(), pins=False):
    if pins:
        pos = [('Oven mitt', 28, 55, 1), ('Duct tape', 54, 21, 1), ('Can holders', 57, 82, 1), ('Rubber bands', 71, 30, 1), ('Pens', 82, 70, 1)]
        over = ''.join(f'<span class="pinlab{"" if on else " off"}" style="left:{x}%;top:{y}%">{I["check"] if on else I["plus"]}{n}</span>' for n, x, y, on in pos)
        rows = f'<div class="addhint">{I["target"]} Tap a label to leave it out; tap the photo to add one it missed.</div>'
        top = '<div class="spike">Only after the position test</div>'
    else:
        over = ''
        rows = ''.join(f'<div class="frow{"" if on else " off"}"><span>{n}</span><button class="sw{" on" if on else ""}"></button></div>' for n, on in FOUND[:5]) + \
               f'<div class="frow"><span style="color:var(--accent)">+ 2 more</span><span></span></div>' + \
               f'<div class="addhint">{I["target"]} Missed something? Tap it in the photo.</div>'
        top = ''
    n = 5 if pins else 6
    return page(f'''<div class="screen with-footer"><div class="header"><button class="back">‹ Back</button><div class="title">Everything in view</div></div>{top}
<div class="card"><div class="found-photo"><img src="img/drawer.jpg">{over}</div>
<div class="found-head"><b>{n} things</b><span class="pl">{I["pin"]} Kitchen drawer {I["down"]}</span></div>{rows}</div>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["check"]}<span class="lbl">Save {n} things</span></button></div></div></div>''', v, P3_CSS)
frames['o3_a'] = camera('drawer', '<div class="modeseg"><span>One thing</span><span class="on">Everything in view</span></div>', count='', css=P3_CSS)
frames['o3_b'] = found()
frames['o3_c'] = found(pins=True)
frames['o3_d'] = found(V(scale=1.38))
frames['o3_e'] = page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Find item</div></div>
<div class="ask-row"><div class="field"><input value="duct tape"></div></div>
<div class="card ans" style="margin-top:0.75rem"><div class="found-photo"><img src="img/drawer.jpg"><span class="ring" style="left:54%;top:21%"></span></div>
<div class="loc-big">{I["pin"]}<span>Kitchen drawer</span></div><div class="resting">Duct tape · top middle, by the rubber bands</div><div class="when">Seen Thu 3:10 PM, with 5 other things</div></div></div>''', V(), P3_CSS)

# Dusk versions of the key frame of each option
frames['o1_dusk'] = camera('keys', strip('keys', 'Car keys', 'Hall table', 'usual place'), count='1', v=V('dusk'))
frames['o2_dusk'] = p2card(V('dusk'))
frames['o3_dusk'] = found(V('dusk'))

if __name__ == '__main__':
    for k, html in frames.items():
        open(os.path.join(OUT, f'c1_{k}.html'), 'w').write(html)
    print('wrote', len(frames))
