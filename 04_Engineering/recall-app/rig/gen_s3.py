#!/usr/bin/env python3
"""S3 — step 3 drawings (2026-09-24): private by default (Ravi), places inside places + containers that
move (#7), Everything in view (#8). From the app's stylesheet (../out/styles.css) + mock-only rules."""
import os
from gen_h1 import page, OUT
from gen_c1 import I, V, CAM_CSS, P3_CSS, strip, svg, PENCIL

I = dict(I)
I['lock'] = svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>')
I['box'] = svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>')
I['in'] = svg('<path d="M9 6l6 6-6 6"/>')
I['note'] = svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h5"/>')

S3_CSS = '''
svg { width:1.35em; height:1.35em; } /* the app's Icons.jsx default; mock icons carry no size */
.privnote { display:flex; align-items:flex-start; gap:0.625rem; background:var(--accent-soft); color:var(--ink); border-radius:0.875rem; padding:0.75rem 0.875rem; margin:0.625rem 0 0; font-size:min(1.0625rem,4.5vw); line-height:1.35; }
.privnote svg { width:1.35em; height:1.35em; flex:none; color:var(--accent); margin-top:0.1em; }
.privnote b { display:block; }
.privnote a { color:var(--accent); font-weight:700; text-decoration:underline; white-space:nowrap; }
.privnote.helper { background:var(--amber-bg); } .privnote.helper svg { color:var(--amber); }
.strip1 .lockchip { display:inline-flex; align-items:center; gap:0.3rem; margin-top:0.375rem; margin-left:0.375rem; padding:0.3rem 0.65rem; border-radius:999px; background:#F2C94C; color:#1d1d1b; font-weight:700; font-size:min(0.9375rem,4vw); white-space:nowrap; }
.strip1 .lockchip svg { width:1.1em; height:1.1em; }
.strip1 .share { color:#fff; text-decoration:underline; font-weight:700; font-size:min(0.9375rem,4vw); margin-left:0.5rem; }
/* nested places: the breadcrumb and chips */
.crumbs { display:flex; flex-wrap:wrap; align-items:center; gap:0.25rem; margin:0.25rem 0 0.5rem; font-weight:700; font-size:min(1.0625rem,4.5vw); color:var(--accent); }
.crumbs span.c { background:var(--accent); color:var(--accent-ink); border-radius:999px; padding:0.3rem 0.7rem; white-space:nowrap; }
.crumbs svg { width:1em; height:1em; color:var(--ink-soft); }
.lvl-q { color:var(--ink-soft); font-weight:600; font-size:min(1rem,4.3vw); margin:0.25rem 0 0.375rem; }
.guess.inside { display:flex; align-items:center; justify-content:space-between; }
.guess.inside small { color:var(--ink-soft); font-weight:600; font-size:0.8em; }
.guess.inside svg { width:1.1em; height:1.1em; }
.guess.here { background:var(--accent); color:var(--accent-ink); }
.pathline { display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap; font-size:min(1rem,4.3vw); color:var(--ink-soft); margin-top:0.5rem; }
.pathline b { color:var(--ink); }
.pathline svg { width:0.9em; height:0.9em; }
/* the answer: a chain, each level with its photo */
.chain { margin-top:0.625rem; }
.link { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; position:relative; }
.link img, .link .noimg { width:56px; height:56px; border-radius:10px; object-fit:cover; flex:none; }
.link .noimg { background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; }
.link .noimg svg { width:24px; height:24px; }
.link b { display:block; font-size:min(1.125rem,4.8vw); line-height:1.2; }
.link small { display:block; color:var(--ink-soft); font-size:min(0.9375rem,4vw); }
.link + .link::before { content:""; position:absolute; left:27px; top:-10px; height:12px; border-left:2px dashed var(--line); }
.link.first b { font-size:min(1.25rem,5.2vw); }
/* the places tree */
.tree .row { display:flex; align-items:center; gap:0.625rem; padding:0.5rem 0.25rem; border-bottom:1px solid var(--line); font-size:min(1.0625rem,4.5vw); font-weight:600; flex-wrap:nowrap; }
.tree .row img, .tree .row .noimg { width:40px; height:40px; border-radius:8px; object-fit:cover; flex:none; }
.tree .row .noimg { background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; }
.tree .row .noimg svg { width:20px; height:20px; }
.tree .row small { margin-left:auto; color:var(--ink-soft); font-weight:600; font-size:min(0.9375rem,4vw); white-space:nowrap; }
.tree .d1 { padding-left:1.25rem; } .tree .d2 { padding-left:2.5rem; } .tree .d3 { padding-left:3.75rem; }
.tree .row .boxbadge { color:var(--amber); display:inline-flex; } .tree .row .boxbadge svg { width:1em; height:1em; }
/* a container's own card */
.cont-head { display:flex; gap:0.75rem; align-items:center; }
.cont-head img { width:84px; height:84px; border-radius:12px; object-fit:cover; flex:none; }
.cont-head b { display:block; font-size:min(1.375rem,5.8vw); }
.cont-head small { display:flex; align-items:center; gap:0.3rem; color:var(--ink-soft); font-size:min(1rem,4.3vw); font-weight:600; }
.cont-head small svg { width:1em; height:1em; color:var(--accent); }
.minis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.5rem; margin-top:0.625rem; }
.minis div { font-size:min(0.8125rem,3.6vw); font-weight:600; text-align:center; }
.minis img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:0.625rem; display:block; margin-bottom:0.2rem; }
/* the sweep tile on Home */
.tile .sweep { position:absolute; left:0.5rem; top:0.5rem; display:flex; align-items:center; gap:0.3rem; background:rgba(0,0,0,0.6); color:#fff; border-radius:999px; padding:4px 9px; font:700 13px/1 -apple-system,system-ui,sans-serif; }
.tile .sweep svg { width:13px; height:13px; }
'''

def card_page(body, v=V(), css=''):
    return page(body, v, S3_CSS + css)

F = {}
# ============================ A. private by default ============================
F['a1_one'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Log item</div></div>
<div class="card photo-card"><img class="photo-full" src="img/diary.jpg">
<div class="field-value big"><span class="field-text">Password notebook</span>{PENCIL}</div>
<div class="privnote">{I["lock"]}<span><b>Kept private: this looks like passwords.</b>Only you will see it. <a>Share it instead</a></span></div>
<div class="ask-place"><div class="ask-q">Where is it?</div><div class="guesses">
<button class="guess pre" style="display:flex;justify-content:space-between"><span>Desk <small style="opacity:.85;font-size:.8em">· just used</small></span>{I["check"]}</button>
<div class="next-row"><button class="btn-primary">{I["camera"]}<span>Next item</span></button><button class="btn-primary alt">{I["check"]}<span>Done</span></button></div></div></div></div></div>''', css=P3_CSS)

def cam(view, overlay, v=V(), count='', css=''):
    body = f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Close</button><div class="camera-title">Log item</div><div class="camera-count">{count}</div></div>
<div class="camera-view"><img class="live" src="img/{view}.jpg">{overlay}</div>
<div class="camera-bar"><span></span><button class="shutter"><span></span></button><button class="camera-done">Done</button></div></div>'''
    return page(body, v, CAM_CSS + S3_CSS + css)

F['a2_several'] = cam('diary', f'''<div class="strip1"><div class="th"><img src="img/diary.jpg"></div><div class="bd"><div class="saved">{I["check"]} Saved</div>
<div class="nm">Password notebook</div><div><span class="pl" style="display:inline-flex">{I["pin"]} Desk</span><span class="lockchip">{I["lock"]} Only me</span></div>
<div class="q">Looks like passwords, so only you see it. <span class="share">Share it</span></div></div></div>''', count='2 saved')
F['a3_write'] = card_page(f'''<div class="screen note-card"><div class="header"><button class="back">‹ Back</button><div class="title">Write it down</div></div>
<div class="card"><label class="ask-q">What is it?</label><input class="place-input" value="bank PIN for the joint account">
<div class="ask-q">Where is it?</div><div class="guesses"><button class="guess pre" style="display:flex;justify-content:space-between"><span>Desk drawer</span>{I["check"]}</button><button class="guess">Kitchen counter</button></div>
<div class="sw-row note-private" style="margin-top:0.75rem;border-top:1px solid var(--line)"><span class="lab">{I["lock"]} Keep this private</span><button class="sw on"></button></div>
<div class="privnote" style="margin-top:0.25rem">{I["lock"]}<span>Looks private, so it starts private. Switch it off to share it.</span></div>
<button class="btn-primary">{I["check"]}<span>Save</span></button></div></div>''')
F['a4_helper'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Log item · in Margaret’s ReCall</div></div>
<div class="card photo-card"><img class="photo-full" src="img/folder.jpg">
<div class="field-value big"><span class="field-text">Medical papers</span>{PENCIL}</div>
<div class="privnote helper">{I["lock"]}<span><b>This looks private.</b>Only Margaret can keep things to herself. If you save it, everyone in her ReCall sees it. <a>Don’t save it</a></span></div>
<div class="ask-place"><div class="ask-q">Where is it?</div><div class="guesses"><button class="guess">Desk</button><button class="guess">Hall table</button></div></div></div></div>''')

# ============================ B. places inside places ============================
# Option B1: drill down — pick a place, then (optionally) what it's in
F['b1_drill_1'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Log item</div></div>
<div class="card photo-card"><img class="photo-full" src="img/keys.jpg" style="max-height:22vh">
<div class="field-value big"><span class="field-text">Bank locker key</span>{PENCIL}</div>
<div class="ask-q">Where is it?</div>
<div class="crumbs"><span class="c">Bedroom wardrobe</span>{I["in"]}<span class="c">Top shelf</span></div>
<div class="lvl-q">In something on the top shelf?</div>
<div class="guesses"><button class="guess inside"><span>Blue tin</span><small>2 things</small></button><button class="guess inside"><span>Shoe box</span><small>5 things</small></button>
<button class="guess other">+ Something new…</button>
<button class="guess here">Just on the top shelf</button></div></div></div>''')
F['b1_drill_2'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Log item</div></div>
<div class="card photo-card"><img class="photo-full" src="img/keys.jpg" style="max-height:22vh">
<div class="field-value big"><span class="field-text">Bank locker key</span>{PENCIL}</div>
<div class="ask-q">Where is it?</div>
<div class="guesses"><button class="guess pre" style="display:flex;justify-content:space-between"><span>Blue tin <small style="opacity:.85;font-size:.8em">· usual place</small></span>{I["check"]}</button></div>
<div class="pathline">in <b>Top shelf</b>{I["in"]}<b>Bedroom wardrobe</b></div>
<div class="next-row" style="margin-top:0.75rem"><button class="btn-primary">{I["camera"]}<span>Next item</span></button><button class="btn-primary alt">{I["check"]}<span>Done</span></button></div>
<div class="or-else">Somewhere else?</div><div class="guesses"><button class="guess">Desk</button><button class="guess">Hall table</button></div></div></div>''', css='.or-else{color:var(--ink-soft);font-weight:600;margin:.5rem 0 .25rem}')
# Option B2: say the whole place, ReCall splits it
F['b2_say'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Log item</div></div>
<div class="card photo-card"><img class="photo-full" src="img/keys.jpg" style="max-height:22vh">
<div class="field-value big"><span class="field-text">Bank locker key</span>{PENCIL}</div>
<div class="ask-q">Where is it?</div>
<input class="place-input" value="blue tin, top shelf of the bedroom wardrobe">
<div class="lvl-q" style="margin-top:0.5rem">ReCall reads that as:</div>
<div class="crumbs"><span class="c">Bedroom wardrobe</span>{I["in"]}<span class="c">Top shelf</span>{I["in"]}<span class="c">Blue tin</span></div>
<button class="btn-primary">{I["check"]}<span>Save here</span></button></div></div>''')

# the answer: Find "bank locker key" → the chain
F['b3_answer'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Find item</div></div>
<div class="ask-row"><div class="field"><input value="bank locker key"></div></div>
<div class="card" style="margin-top:0.75rem"><div class="chain">
<div class="link first"><img src="img/keys.jpg"><span><b>Bank locker key</b><small>Seen Thu 3:10 PM</small></span></div>
<div class="link"><span class="noimg">{I["box"]}</span><span><b>in the Blue tin</b><small>2 things in it</small></span></div>
<div class="link"><img src="img/book.jpg"><span><b>on the Top shelf</b><small>its own photo</small></span></div>
<div class="link"><img src="img/folder.jpg"><span><b>of the Bedroom wardrobe</b><small>Bedroom</small></span></div>
</div></div></div>''')
# Places, as a tree; a box that moves
F['b4_tree'] = card_page(f'''<div class="screen settings"><div class="header"><button class="back">‹ Back</button><div class="title">Places</div></div>
<div class="card tree">
<div class="row d0"><img src="img/folder.jpg">Bedroom wardrobe<small>9 things</small></div>
<div class="row d1"><span class="noimg">{I["pin"]}</span>Top shelf<small>6</small></div>
<div class="row d2"><span class="noimg">{I["box"]}</span>Blue tin <span class="boxbadge">{I["box"]}</span><small>2</small></div>
<div class="row d2"><span class="noimg">{I["box"]}</span>Shoe box <span class="boxbadge">{I["box"]}</span><small>5</small></div>
<div class="row d0"><img src="img/tooldrawer.jpg">Garage<small>41 things</small></div>
<div class="row d1"><img src="img/drawer.jpg">Tool drawer<small>12</small></div>
<div class="row d0"><span class="noimg">{I["pin"]}</span>Storage unit 214<small>60 things</small></div>
<div class="row d1"><span class="noimg">{I["box"]}</span>Box 14 <span class="boxbadge">{I["box"]}</span><small>13</small></div>
<div class="row d1"><span class="noimg">{I["box"]}</span>Box 15 <span class="boxbadge">{I["box"]}</span><small>9</small></div>
</div><button class="btn-secondary">+ Add a place</button></div>''')
F['b5_box'] = card_page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Box 14</div></div>
<div class="card"><div class="cont-head"><img src="img/folder.jpg"><span><b>Box 14</b><small>{I["pin"]} in Storage unit 214 · back left</small></span></div>
<div class="minis">{''.join(f'<div><img src="img/{k}.jpg">{n}</div>' for k, n in [('folder', 'Passport folder'), ('charger', 'Camera charger'), ('book', 'Photo albums'), ('wallet', 'Old wallets')])}</div>
<div style="color:var(--ink-soft);font-size:0.9375rem;margin-top:0.5rem">+ 9 more things</div>
<button class="btn-primary">{I["camera"]}<span>Add things to this box</span></button>
<button class="btn-secondary">{I["box"]} Move this box…</button></div></div>''', css='.btn-secondary svg{width:1.2em;height:1.2em;vertical-align:-.25em;margin-right:.3rem}')

# ============================ C. Everything in view ============================
C_ROW = '<div class="modes" style="display:flex;justify-content:center;gap:1.25rem;padding:.75rem 1rem .25rem"><span style="color:rgba(255,255,255,.72);font-weight:700">One thing</span><span style="color:rgba(255,255,255,.72);font-weight:700">Several</span><span style="color:#F2C94C;font-weight:700">Everything</span></div>'
body = f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Cancel</button><div class="camera-title">Log item</div><div class="camera-count"></div></div>
<div class="camera-view"><img class="live" src="img/drawer.jpg"><button class="cam-place set" style="position:absolute;top:.75rem;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:.35rem;padding:.45rem .9rem;border-radius:999px;background:var(--accent);color:#fff;font-weight:700;white-space:nowrap">{I["pin"]} Kitchen drawer · every photo</button></div>{C_ROW}
<div class="camera-bar"><button class="camera-write" style="justify-self:start;background:rgba(255,255,255,.14);color:#fff;font-weight:700;padding:.6rem 1rem;border-radius:1.5rem">Type it</button><button class="shutter"><span></span></button><button class="camera-done">Done</button></div></div>'''
F['c1_camera'] = page(body, V(), CAM_CSS + S3_CSS)
FOUND = [('Oven mitt', 1), ('Duct tape', 1), ('Can holders', 1), ('Work gloves', 1), ('Rubber bands', 1), ('Pens and markers', 1), ('Zip bags', 0)]
rows = ''.join(f'<div class="frow{"" if on else " off"}"><span>{n}</span><button class="sw{" on" if on else ""}"></button></div>' for n, on in FOUND[:5])
F['c2_found'] = page(f'''<div class="screen with-footer"><div class="header"><button class="back">‹ Back</button><div class="title">Everything in view</div></div>
<div class="card"><div class="found-photo"><img src="img/drawer.jpg"></div>
<div class="found-head"><b>6 things</b><span class="pl">{I["pin"]} Kitchen drawer {I["down"]}</span></div>{rows}
<div class="frow"><span style="color:var(--accent)">+ 2 more</span><span></span></div>
<div class="addhint">{I["target"]} Missed something? Tap it in the photo.</div></div>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["check"]}<span class="lbl">Save 6 things</span></button></div></div></div>''', V(), P3_CSS + S3_CSS)
tiles = ''.join(f'<button class="tile"><img src="img/{k}.jpg"><div class="tile-label">{n}</div></button>' for k, n in [('glasses', 'Reading glasses'), ('keys', 'Car keys'), ('wallet', 'Wallet')])
tiles += f'<button class="tile"><img src="img/drawer.jpg"><span class="sweep">{I["box"]} 6 things</span><div class="tile-label">Kitchen drawer</div></button>'
F['c3_home'] = page(f'''<div class="screen with-footer"><div class="dayrow"><button class="menu-btn">{I["menu"]}</button><div class="dayline"><span class="day">Thursday evening</span><span class="date">September 24</span></div></div>
<div class="board">{tiles}</div>
<div class="footer"><div class="footer-inner"><button class="btn-primary">{I["camera"]}<span class="lbl">Log item</span></button><button class="btn-primary alt">{I["search"]}<span class="lbl">Find item</span></button></div></div></div>''', V(), S3_CSS)
F['c4_answer'] = page(f'''<div class="screen"><div class="header"><button class="back">‹ Back</button><div class="title">Find item</div></div>
<div class="ask-row"><div class="field"><input value="duct tape"></div></div>
<div class="card ans" style="margin-top:0.75rem"><div class="found-photo"><img src="img/drawer.jpg"><span class="ring" style="left:54%;top:21%"></span></div>
<div class="loc-big">{I["pin"]}<span>Kitchen drawer</span></div><div class="resting">Duct tape · in the drawer photo with 5 other things</div><div class="when">Seen Thu 3:10 PM</div></div></div>''', V(), P3_CSS + S3_CSS)
# Largest checks
F['l1_drill'] = F['b1_drill_1'].replace('style="--scale:1"', 'style="--scale:1.38"')
F['l2_answer'] = F['b3_answer'].replace('style="--scale:1"', 'style="--scale:1.38"')

if __name__ == '__main__':
    for k, html in F.items():
        open(os.path.join(OUT, f's3_{k}.html'), 'w').write(html)
    print('wrote', len(F))
