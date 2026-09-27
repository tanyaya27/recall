#!/usr/bin/env python3
"""S5 — containers as a graph, drawn (2026-09-25, Ravi: edges are first-class; contents off Home but
promotable; Home follows the container tapped; log first, put away later, very fast).
Two sets of options: H (Home inside a box) and P (putting things away). The example chain is Ravi's:
baseball card → wooden box → memorabilia box → crawl space. From the app's stylesheet (../out/styles.css)
plus mock-only rules. Writes mock/s5_<k>.html; render_s5.js screenshots them; compose_s5.py lays them out."""
import os
from gen_h1 import page, OUT, svg
from gen_c1 import I, V

I = dict(I)
I['box'] = svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>')
I['note'] = svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/>')
I['chev'] = svg('<path d="M15 6l-6 6 6 6"/>', 2.25)
I['right'] = svg('<path d="M9 6l6 6-6 6"/>', 2.25)
I['home'] = svg('<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>')
I['pinq'] = svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><path d="M10.5 8.5a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.7.6-.7 1v.3"/><path d="M12 13.2v.1"/>')
I['menu'] = svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2.25)
I['gear'] = svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>')
I['plus'] = svg('<path d="M12 5v14M5 12h14"/>', 2.5)
I['star'] = svg('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>')
I['out'] = svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>')

CSS = '''
svg { width:1.35em; height:1.35em; }
.tile { position:relative; }
.tile .tile-written svg { width:34%; height:34%; }
/* a thing with things in it: one tile, a count */
.tile .inbadge { position:absolute; left:0.5rem; top:0.5rem; display:flex; align-items:center; gap:0.3rem; background:rgba(0,0,0,0.62); color:#fff; border-radius:999px; padding:5px 10px; font:700 14px/1 -apple-system,system-ui,sans-serif; }
.tile .inbadge svg { width:14px; height:14px; }
.tile .promo { display:flex; align-items:center; gap:0.25rem; font-size:min(0.875rem,3.8vw); font-weight:600; color:var(--ink-soft); margin-top:0.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tile .promo svg { width:0.95em; height:0.95em; flex:none; color:var(--accent); }
/* "Not put away" chip on Home */
.notput { display:inline-flex; align-items:center; gap:0.4rem; margin:0 0 0.625rem; padding:0.45rem 0.9rem; border-radius:999px; background:var(--amber-bg); color:var(--amber); font-weight:700; font-size:min(1rem,4.3vw); border:1.5px solid color-mix(in srgb, var(--amber) 35%, transparent); }
.notput svg { width:1.15em; height:1.15em; }
/* Home inside a box — option A: a header with Back, and the box as a banner */
.ctx-head { display:flex; align-items:center; gap:0.5rem; min-height:2.5rem; margin-bottom:0.5rem; }
.ctx-head .chev { flex:none; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:var(--card); border:1.5px solid var(--line); border-radius:0.625rem; color:var(--accent); }
.ctx-head .chev svg { width:20px; height:20px; }
.ctx-head .t { flex:1; min-width:0; font-size:min(1.375rem,6vw); font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ctx-banner { display:flex; align-items:center; gap:0.75rem; width:100%; padding:0.5rem; margin-bottom:0.75rem; background:var(--accent-soft); border:0; border-radius:0.875rem; text-align:left; color:var(--ink); }
.ctx-banner img, .ctx-banner .ph { width:64px; height:64px; border-radius:0.625rem; object-fit:cover; flex:none; }
.ctx-banner .ph { display:flex; align-items:center; justify-content:center; background:var(--card); color:var(--accent); }
.ctx-banner .tx { flex:1; min-width:0; }
.ctx-banner b { display:flex; align-items:center; gap:0.3rem; font-size:min(1.0625rem,4.5vw); }
.ctx-banner b svg { width:1.05em; height:1.05em; color:var(--accent); flex:none; }
.ctx-banner small { display:block; color:var(--ink-soft); font-size:min(0.9375rem,4vw); margin-top:0.15rem; }
.ctx-banner small u { color:var(--accent); font-weight:700; text-decoration:underline; }
.ctx-banner > svg { flex:none; width:1.2rem; height:1.2rem; color:var(--accent); }
/* option B: a trail of where you are; any step can be tapped */
.trail { display:flex; flex-wrap:wrap; align-items:center; gap:0.3rem; margin:0.25rem 0 0.625rem; }
.trail .c { display:inline-flex; align-items:center; gap:0.35rem; padding:0.3rem 0.65rem 0.3rem 0.3rem; background:var(--card); border:1.5px solid var(--line); border-radius:999px; font-weight:700; font-size:min(0.9375rem,4vw); color:var(--accent); white-space:nowrap; }
.trail .c img, .trail .c .i { width:26px; height:26px; border-radius:50%; object-fit:cover; flex:none; }
.trail .c .i { display:flex; align-items:center; justify-content:center; background:var(--accent-soft); }
.trail .c .i svg { width:15px; height:15px; }
.trail .c.here { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
.trail > svg { width:0.9em; height:0.9em; color:var(--ink-soft); }
.ctx-line { display:flex; align-items:center; gap:0.5rem; margin:-0.125rem 0 0.75rem; color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:600; }
.ctx-line u { color:var(--accent); font-weight:700; }
/* sheets */
.dim { position:absolute; inset:0; background:rgba(0,0,0,0.38); z-index:20; }
.msheet { position:absolute; left:0; right:0; bottom:0; z-index:21; background:var(--card); border-radius:1.25rem 1.25rem 0 0; padding:1rem 1rem calc(1rem + env(safe-area-inset-bottom)); box-shadow:0 -6px 24px rgba(0,0,0,0.18); }
.msheet h3 { margin:0 0 0.625rem; font-size:min(1.25rem,5.4vw); }
.msheet .opt { display:flex; align-items:center; gap:0.6rem; width:100%; padding:0.875rem 0.75rem; margin-bottom:0.5rem; background:var(--accent-soft); border:0; border-radius:0.875rem; font:inherit; font-weight:700; font-size:min(1.0625rem,4.5vw); color:var(--accent); text-align:left; }
.msheet .opt svg { width:1.2em; height:1.2em; flex:none; }
.msheet .opt.quiet { background:transparent; color:var(--ink-soft); justify-content:center; }
.msheet .sub { color:var(--ink-soft); font-size:min(0.9375rem,4vw); margin:-0.375rem 0 0.625rem; }
/* put away: where, as rows with pictures */
.pa-q { font-weight:700; font-size:min(1.25rem,5.4vw); margin:0.25rem 0 0.625rem; }
.pa-row { display:flex; align-items:center; gap:0.75rem; width:100%; padding:0.5rem; margin-bottom:0.5rem; background:var(--card); border:1.5px solid var(--line); border-radius:0.875rem; text-align:left; color:var(--ink); }
.pa-row img, .pa-row .ph { width:52px; height:52px; border-radius:0.625rem; object-fit:cover; flex:none; }
.pa-row .ph { display:flex; align-items:center; justify-content:center; background:var(--accent-soft); color:var(--accent); }
.pa-row b { display:block; font-size:min(1.0625rem,4.5vw); }
.pa-row small { display:block; color:var(--ink-soft); font-size:min(0.875rem,3.8vw); }
.pa-row.new { justify-content:center; color:var(--accent); font-weight:700; border-style:dashed; }
.pa-strip { display:flex; gap:0.375rem; margin:0 0 0.75rem; }
.pa-strip img, .pa-strip .ph { width:44px; height:44px; border-radius:0.5rem; object-fit:cover; }
.pa-strip .ph { display:flex; align-items:center; justify-content:center; background:var(--accent-soft); color:var(--accent); }
.pa-strip .ph svg { width:20px; height:20px; }
.pa-hint { color:var(--ink-soft); font-weight:600; font-size:min(0.9375rem,4vw); margin:-0.25rem 0 0.625rem; }
/* picking tiles */
.tile.pick::after { content:""; position:absolute; inset:0; border-radius:inherit; box-shadow:inset 0 0 0 4px var(--accent); pointer-events:none; }
.tile .tick { position:absolute; right:0.5rem; top:0.5rem; width:34px; height:34px; border-radius:50%; background:var(--accent); color:var(--accent-ink); display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,0.3); }
.tile .tick svg { width:20px; height:20px; }
.tile .tick.off { background:rgba(255,255,255,0.85); border:2px solid rgba(0,0,0,0.25); }
.msheet .board { max-height:none; }
.msheet .board .tile img, .msheet .board .tile .tile-written { aspect-ratio: 1/1; }
/* drag (an extra) */
.tile.lift { position:absolute; width:32%; left:60%; top:47%; transform:rotate(-4deg) scale(1.04); box-shadow:0 14px 30px rgba(0,0,0,0.35); opacity:0.96; z-index:5; }
.tile.target::after { content:"Put in"; position:absolute; inset:0; border-radius:inherit; box-shadow:inset 0 0 0 5px var(--accent); background:color-mix(in srgb, var(--accent) 28%, transparent); color:#fff; font:800 22px/1 -apple-system,system-ui,sans-serif; display:flex; align-items:flex-start; padding-top:22%; justify-content:center; text-shadow:0 1px 6px rgba(0,0,0,0.6); }
.toastm { position:absolute; left:1rem; right:1rem; bottom:7rem; background:#3a3630; color:#fff; border-radius:0.875rem; padding:0.875rem 1rem; display:flex; justify-content:space-between; align-items:center; font-weight:700; z-index:12; }
.toastm u { color:#fff; }
#root { position:relative; min-height:100vh; }
'''

def tile(k, name, sub='', badge=None, promo=None, pick=None, cls=''):
    im = f'<img src="img/{k}.jpg">' if k else f'<span class="tile-written">{I["note"]}</span>'
    b = f'<span class="inbadge">{I["box"]} {badge}</span>' if badge else ''
    t = '' if pick is None else f'<span class="tick{"" if pick else " off"}">{I["check"] if pick else ""}</span>'
    p = f'<span class="promo">{I["box"]} {promo}</span>' if promo else ''
    s = f'<span class="tile-sub">{sub}</span>' if sub else ''
    return f'<button class="tile{" pick" if pick else ""}{(" " + cls) if cls else ""}">{im}{b}{t}<div class="tile-label{" noplace" if sub == "No place yet" else ""}">{name}{s}{p}</div></button>'

DAYROW = f'<div class="dayrow"><button class="menu-btn">{I["menu"]}</button><button class="dayline"><span class="day">Friday evening</span><span class="date">September 25</span></button><button class="tiny">{I["gear"]} Settings</button></div>'
def footer(a=('camera', 'Log item'), b=('search', 'Find item')):
    return f'<div class="footer"><div class="footer-inner"><button class="btn-primary">{I[a[0]]}<span class="lbl">{a[1]}</span></button><button class="btn-primary alt">{I[b[0]]}<span class="lbl">{b[1]}</span></button></div></div>'
NOTPUT = lambda n: f'<button class="notput">{I["pinq"]} Not put away · {n}</button>'

TOP = [tile('glasses', 'Reading glasses'), tile('keys', 'Car keys'), tile('wallet', 'Wallet'), tile('box14', 'Memorabilia box', badge='3 inside'),
       tile('scissors', 'Garden shears'), tile('charger', 'Phone charger')]
def home(tiles, chip='', extra='', v=V()):
    return page(f'<div class="screen with-footer">{DAYROW}{chip}<div class="board">{"".join(tiles)}</div>{footer()}{extra}</div>', v, CSS)

MEMO = [tile('smallbox', 'Wooden box', badge='2 inside'), tile('book', 'Yearbook 1978'), tile('diary', 'Old letters')]
WOOD = [tile('card', 'Baseball card'), tile(None, 'Ticket stubs')]
CRAWL = [tile('box14', 'Memorabilia box', badge='3 inside'), tile(None, 'Christmas lights'), tile(None, 'Camping stove')]
IN_FOOT = footer(('camera', 'Log here'), ('plus', 'Put in'))

def a_inside(title, img, bold, small, tiles, v=V(), extra=''):
    banner = f'<button class="ctx-banner"><img src="img/{img}.jpg"><span class="tx"><b>{I["pin"]} {bold}</b><small>{small} · <u>About this box</u></small></span>{I["right"]}</button>'
    return page(f'<div class="screen with-footer"><div class="ctx-head"><button class="chev">{I["chev"]}</button><div class="t">{title}</div></div>{banner}<div class="board">{"".join(tiles)}</div>{IN_FOOT}{extra}</div>', v, CSS)

def crumb(label, img=None, icon=None, here=False):
    pic = f'<img src="img/{img}.jpg">' if img else f'<span class="i">{I[icon or "pin"]}</span>'
    return f'<span class="c{" here" if here else ""}">{pic}{label}</span>'
def b_inside(crumbs, line, tiles, v=V(), extra=''):
    tr = f' {I["right"]} '.join(crumbs)
    return page(f'<div class="screen with-footer"><div class="trail">{tr}</div><div class="ctx-line">{line}</div><div class="board">{"".join(tiles)}</div>{IN_FOOT}{extra}</div>', v, CSS)

F = {}
# ---------------- H: Home inside a box ----------------
F['h0_top'] = home(TOP, NOTPUT(4))
F['ha1_memo'] = a_inside('Memorabilia box', 'box14', 'Crawl space', 'seen Mon 2:55 PM', MEMO)
F['ha2_wood'] = a_inside('Wooden box', 'smallbox', 'In the memorabilia box', 'Crawl space', WOOD)
F['hb1_wood'] = b_inside([crumb('Home', icon='home'), crumb('Crawl space'), crumb('Memorabilia box', 'box14'), crumb('Wooden box', 'smallbox', here=True)],
                         f'2 things · <u>About this box</u>', WOOD)
F['hb2_crawl'] = b_inside([crumb('Home', icon='home'), crumb('Crawl space', here=True)], '3 things here · a place', CRAWL)
SHEET_PROMO = f'''<div class="dim"></div><div class="msheet"><h3>Baseball card</h3><div class="sub">In the wooden box, in the memorabilia box · Crawl space</div>
<button class="opt">{I["star"]} Show on Home too</button><button class="opt">{I["out"]} Take it out…</button><button class="opt">{I["right"]} Open its card</button><button class="opt quiet">Cancel</button></div>'''
F['h3_promote'] = a_inside('Wooden box', 'smallbox', 'In the memorabilia box', 'Crawl space', WOOD, extra=SHEET_PROMO)
F['h4_promoted'] = home([tile('card', 'Baseball card', promo='in the wooden box')] + TOP[:5], NOTPUT(4))
F['hl_largest'] = a_inside('Memorabilia box', 'box14', 'Crawl space', 'seen Mon 2:55 PM', MEMO, v=V(scale=1.38))

# ---------------- P: putting things away ----------------
UNPLACED = [('card', 'Baseball card'), (None, 'Ticket stubs'), ('soda', 'Coffee can'), ('folder', 'Blue binders')]
strip = ''.join(f'<img src="img/{k}.jpg">' if k else f'<span class="ph">{I["note"]}</span>' for k, _ in UNPLACED)
rows = ''.join(f'<button class="pa-row">{f"<img src=img/{k}.jpg>" if k else f"<span class=ph>{I[ic]}</span>"}<span><b>{n}</b><small>{s}</small></span></button>'
               for k, ic, n, s in [('smallbox', 'box', 'Wooden box', 'In the memorabilia box · Crawl space'), ('box14', 'box', 'Memorabilia box', 'Crawl space · 3 inside'),
                                   (None, 'pin', 'Crawl space', 'A place · 3 things'), (None, 'pin', 'Hall table', 'A place · 5 things'), (None, 'pin', 'Desk', 'A place · 4 things')])
F['pa1_where'] = page(f'''<div class="screen"><div class="ctx-head"><button class="chev">{I["chev"]}</button><div class="t">Put away 4 things</div></div>
<div class="pa-strip">{strip}</div><div class="pa-q">Where are they going?</div>{rows}<button class="pa-row new">+ Somewhere new…</button></div>''', V(), CSS)
picks = [tile(k, n, pick=(i < 2)) for i, (k, n) in enumerate(UNPLACED)]
F['pa2_tap'] = page(f'''<div class="screen with-footer"><div class="ctx-head"><button class="chev">{I["chev"]}</button><div class="t">Into the wooden box</div></div>
<div class="pa-hint">Tap each thing that goes in.</div><div class="board">{"".join(picks)}</div>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["check"]}<span class="lbl">Put 2 in the wooden box</span></button></div></div></div>''', V(), CSS)
F['pa3_done'] = home(TOP, NOTPUT(2), extra='<div class="toastm"><span>Put 2 in the wooden box</span><u>Undo</u></div>')
sheet_tiles = [tile(k, n, pick=(i < 2)) for i, (k, n) in enumerate(UNPLACED)]
SHEET_IN = f'''<div class="dim"></div><div class="msheet"><h3>Put things in the wooden box</h3><div class="sub">Not put away yet · tap to put in</div>
<div class="board">{"".join(sheet_tiles)}</div><button class="btn-primary" style="margin-top:0.75rem">{I["check"]}<span class="lbl">Done · 2 put in</span></button></div>'''
F['pb1_from_box'] = a_inside('Wooden box', 'smallbox', 'In the memorabilia box', 'Crawl space', WOOD, extra=SHEET_IN)
drag_tiles = [tile('glasses', 'Reading glasses'), tile('keys', 'Car keys'), tile('wallet', 'Wallet'), tile('box14', 'Memorabilia box', badge='3 inside', cls='target'),
              tile('scissors', 'Garden shears'), tile('charger', 'Phone charger')]
F['pc1_drag'] = page(f'''<div class="screen with-footer">{DAYROW}{NOTPUT(4)}<div class="board">{"".join(drag_tiles)}</div>
{tile("card", "Baseball card", cls="lift")}{footer()}</div>''', V(), CSS)
F['pl_largest'] = F['pa2_tap'].replace('style="--scale:1"', 'style="--scale:1.38"')

if __name__ == '__main__':
    for k, html in F.items():
        open(os.path.join(OUT, f's5_{k}.html'), 'w').write(html)
    print('wrote', len(F))
