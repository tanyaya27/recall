#!/usr/bin/env python3
"""C2 — the three capture approaches as MODES of one camera (2026-09-24, Ravi: "can we have all three and a
quick way to change the approach … ideally switched by the user based on context"). Mock-only; no app code."""
import os
from gen_h1 import page, OUT
from gen_c1 import I, V, CAM_CSS, P3_CSS, strip

MODES = [('one', 'One thing'), ('several', 'Several'), ('all', 'Everything')]
MODE_CSS = '''
/* the mode row: under the viewfinder, above the shutter — the iPhone camera's own pattern.
   One line that never wraps: it scrolls sideways and centres the chosen mode (as iOS does). */
.modes { display:flex; justify-content:center; gap:1.5rem; padding:0.75rem 1rem 0.25rem; white-space:nowrap; overflow:hidden; }
.modes span { color:rgba(255,255,255,0.72); font-weight:700; font-size:min(1rem,4.3vw); letter-spacing:0.02em; padding:0.25rem 0; }
.modes span.on { color:#F2C94C; }
.modes.large { justify-content:flex-start; transform:translateX(var(--shift,0)); }
.modes .dot { display:block; width:5px; height:5px; border-radius:50%; background:#F2C94C; margin:0.2rem auto 0; }
.mode-note { position:absolute; left:0.75rem; right:0.75rem; bottom:0.75rem; background:rgba(0,0,0,0.55); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); color:#fff; border-radius:0.875rem; padding:0.55rem 0.8rem; font-weight:600; font-size:min(0.9375rem,4vw); line-height:1.3; }
.suggest { position:absolute; left:0.75rem; right:0.75rem; bottom:0.75rem; background:#fff; color:#1d1d1b; border-radius:0.875rem; padding:0.625rem 0.75rem; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; font-weight:700; font-size:min(1rem,4.3vw); box-shadow:0 4px 14px rgba(0,0,0,0.35); }
.suggest button { background:var(--accent); color:#fff; border-radius:999px; padding:0.4rem 0.8rem; font-weight:700; font-size:min(0.9375rem,4vw); min-height:0; white-space:nowrap; }
.suggest .x { background:none; color:#666; padding:0.4rem; }
'''

def cam(view, mode, overlay='', v=V(), count='', large=False):
    row = ''.join(f'<span class="{"on" if k == mode else ""}">{n}{"<i class=dot></i>" if k == mode else ""}</span>' for k, n in MODES)
    shift = {'one': '6.5rem', 'several': '-1rem', 'all': '-8rem'}[mode] if large else '0'
    modes = f'<div class="modes{" large" if large else ""}" style="--shift:{shift}">{row}</div>'
    done = 'Done'
    body = f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Cancel</button><div class="camera-title">Log item</div><div class="camera-count">{count}</div></div>
<div class="camera-view"><img class="live" src="img/{view}.jpg">{overlay}</div>{modes}
<div class="camera-bar"><span></span><button class="shutter"><span></span></button><button class="camera-done">{done}</button></div></div>'''
    return page(body, v, CAM_CSS + P3_CSS + MODE_CSS)

F = {}
F['a_one'] = cam('keys', 'one', '<div class="mode-note">One thing: after the photo you name it and say where it is, one card at a time.</div>')
F['b_several'] = cam('keys', 'several', strip('keys', 'Car keys', 'Hall table', 'usual place'), count='1')
F['c_all'] = cam('drawer', 'all', '<div class="mode-note">Everything: one photo saves every thing it can see, all in one place.</div>')
F['d_large'] = cam('keys', 'several', strip('keys', 'Car keys', 'Hall table', 'usual place'), v=V(scale=1.38), count='1', large=True)
F['e_suggest'] = cam('glasses', 'one', f'<div class="suggest"><span>Taking several? Stay in the camera.</span><span style="display:flex;gap:0.25rem"><button>Several</button><button class="x">✕</button></span></div>', count='3 today')

# Settings → Taking photos
SET_CSS = '''
.seg.three button { font-size:min(1rem,4vw); }
.optrow { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; min-height:3rem; border-bottom:1px solid var(--line); }
.optrow:last-child { border-bottom:none; }
.optrow .lab b { display:block; font-size:min(1.0625rem,4.5vw); }
.optrow .lab small { display:block; color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:500; line-height:1.3; }
'''
def settings(v=V()):
    rows = [('One thing', 'Name it and say where, one card at a time', True, True),
            ('Several', 'The camera stays open; fix only what’s wrong', True, False),
            ('Everything', 'One photo of a drawer, shelf or room saves all of it', True, False)]
    body = ''.join(f'<div class="optrow"><span class="lab"><b>{n}</b><small>{d}</small></span><button class="sw{" on" if on else ""}"></button></div>' for n, d, on, _ in rows)
    return page(f'''<div class="screen settings"><div class="header"><button class="back">‹ Back</button><div class="title">Settings</div></div>
<div class="group-title">Taking photos</div>
<div class="group"><div class="grow"><label>The camera opens in</label>
<div class="seg wrap"><button class="on">Last used</button><button>One thing</button><button>Several</button><button>Everything</button></div></div>
<div class="grow"><label>Show these in the camera</label>{body}</div>
<div class="grow"><p class="note-quiet left" style="margin:0">With only one switched on, the camera shows no choice at all.</p></div></div></div>''', v, SET_CSS)
F['f_settings'] = settings()

# Margaret's configuration: only One thing → no mode row: the camera she already knows
F['g_margaret'] = page(f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Cancel</button><div class="camera-title">Log item</div><div class="camera-count"></div></div>
<div class="camera-view"><img class="live" src="img/glasses.jpg"></div><div class="camera-roll"></div>
<div class="camera-bar"><span></span><button class="shutter"><span></span></button><button class="camera-done">Done</button></div></div>''', V(scale=1.38), CAM_CSS)

# From Home: press and hold Log item → pick the mode for this time
HOLD_CSS = '''
.sheet .sheet-row { display:flex; align-items:center; gap:0.625rem; width:100%; text-align:left; margin-top:0.5rem; padding:0.75rem 1rem; min-height:3.5rem; background:var(--accent-soft); color:var(--accent); font-size:min(1.1875rem,5vw); font-weight:600; border-radius:var(--radius); }
.sheet .sheet-row small { display:block; color:var(--ink-soft); font-weight:500; font-size:min(0.9375rem,4vw); }
.sheet .sheet-row.on { background:var(--accent); color:var(--accent-ink); } .sheet .sheet-row.on small { color:inherit; opacity:0.85; }
'''
home_bg = '''<div class="screen with-footer"><div class="dayrow"><button class="menu-btn"></button><div class="dayline"><span class="day">Thursday evening</span><span class="date">September 24</span></div></div>
<div class="board">''' + ''.join(f'<button class="tile"><img src="img/{k}.jpg"><div class="tile-label">{n}</div></button>' for k, n in [('glasses', 'Reading glasses'), ('keys', 'Car keys'), ('wallet', 'Wallet'), ('folder', 'Tax folders')]) + '</div></div>'
F['h_hold'] = page(home_bg + '''<div class="sheet-back static"><div class="sheet"><div class="sheet-title">Log item as…</div>
<button class="sheet-row"><span>One thing<small>one card at a time</small></span></button>
<button class="sheet-row on"><span>Several<small>last used · the camera stays open</small></span></button>
<button class="sheet-row"><span>Everything in view<small>a drawer, a shelf, a room</small></span></button>
<button class="btn-primary alt" style="margin-top:0.75rem">Cancel</button></div></div>''', V(), HOLD_CSS)

if __name__ == '__main__':
    for k, html in F.items():
        open(os.path.join(OUT, f'c2_{k}.html'), 'w').write(html)
    print('wrote', len(F))
