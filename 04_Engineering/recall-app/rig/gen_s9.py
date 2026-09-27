#!/usr/bin/env python3
"""S9 — the board's redesign after the visual walkthrough (2026-09-27): "where" is answered the way "what"
is, with the camera. Step back and shoot what it's in, then where that is; the Save button names the
place (Q2); one photo = one thing (Q3); the camera never hands off to a list or a keyboard.
Writes mock/s9_<k>.html; render_s9.js screenshots them; compose_s9r.py lays them out."""
import os
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'mock')

def svg(p, sw=2):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'
I = {
 'cam': svg('<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>'),
 'lock': svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
 'check': svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.6),
 'pin': svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
 'box': svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'),
 'right': svg('<path d="M9 6l6 6-6 6"/>', 2.4),
 'x': svg('<path d="M6 6l12 12M18 6L6 18"/>', 2.4),
 'search': svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 2.2),
 'menu': svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2.25),
 'undo': svg('<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12"/>'),
 'more': svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
 'q': svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.4"/><path d="M12 16.6v.1"/>'),
 'back': svg('<path d="M15 6l-6 6 6 6"/>', 2.4),
 'pencil': svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
}
CSS = '''
:root { --bg:#F6F1E8; --card:#FFFDF9; --ink:#3A3630; --ink-soft:#7A7369; --accent:#2F6B5E; --accent-soft:#E4EEEA; --amber:#8A6528; --amber-bg:#F7EEDD; --line:#E6DFD2; }
* { box-sizing:border-box; } html,body { margin:0; height:844px; width:390px; overflow:hidden; font-family:-apple-system,"SF Pro Text",Inter,system-ui,sans-serif; }
img { display:block; } svg { width:1.2em; height:1.2em; flex:none; }
/* ---------- the camera ---------- */
.cam { position:absolute; inset:0; background:#000; color:#fff; display:flex; flex-direction:column; }
.top { display:flex; align-items:center; justify-content:space-between; height:52px; padding:0 16px; font-size:17px; font-weight:600; }
.top .t { font-weight:700; } .top .r { min-width:60px; text-align:right; color:#bbb; font-weight:500; font-size:15px; }
.view { position:relative; flex:1; overflow:hidden; }
.view > img.live { width:100%; height:100%; object-fit:cover; }
.prompt { position:absolute; left:12px; right:12px; top:12px; background:rgba(0,0,0,.5); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); border-radius:16px; padding:10px 14px; display:flex; gap:10px; align-items:flex-start; }
.prompt .n { flex:none; width:28px; height:28px; border-radius:50%; background:#fff; color:#000; font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; margin-top:1px; }
.prompt b { display:block; font-size:19px; line-height:1.25; } .prompt small { display:block; font-size:15px; color:#ddd; margin-top:2px; line-height:1.3; }
/* the chain being built: photos, outward */
.chain { position:absolute; left:10px; right:10px; bottom:10px; display:flex; align-items:flex-end; gap:4px; }
.chain .c { width:84px; flex:none; text-align:center; }
.chain .c .ph { position:relative; width:84px; height:84px; border-radius:14px; overflow:hidden; border:3px solid rgba(255,255,255,.85); opacity:.93; box-shadow:0 2px 8px rgba(0,0,0,.5); background:#333; }
.chain .c .ph img { width:100%; height:100%; object-fit:cover; }
.chain .c .ph .lk { position:absolute; right:4px; top:4px; width:24px; height:24px; border-radius:50%; background:rgba(0,0,0,.65); display:flex; align-items:center; justify-content:center; }
.chain .c .ph .lk svg { width:14px; height:14px; }
.chain .c .nm { margin-top:4px; font-size:13px; font-weight:700; line-height:1.2; text-shadow:0 1px 3px #000; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.chain .c .nm i { white-space:nowrap; font-style:normal; font-weight:500; color:#ddd; display:block; font-size:12px; overflow:hidden; text-overflow:ellipsis; }
.chain .c.wait .ph { border-style:dashed; background:rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; color:#fff; }
.chain .c.wait .ph svg, .chain .c .ph > svg { width:30px; height:30px; }
.chain .c.naming .nm { color:#ddd; }
.chain .in { flex:none; align-self:center; margin-bottom:26px; font-size:13px; font-weight:800; color:#fff; text-shadow:0 1px 3px #000; }
.chain .ask { position:absolute; left:0; bottom:124px; background:rgba(255,255,255,.86); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); color:var(--ink); border-radius:14px; padding:10px 12px; font-size:16px; font-weight:700; box-shadow:0 4px 14px rgba(0,0,0,.4); }
.chain .ask .row { display:flex; gap:8px; margin-top:8px; } .chain .ask button { border:0; border-radius:999px; padding:8px 14px; font:700 15px system-ui; background:var(--accent); color:#fff; }
.chain .ask button.o { background:var(--accent-soft); color:var(--accent); }
.chain .more-chain { font-size:13px; color:#eee; margin:0 0 30px 6px; text-shadow:0 1px 3px #000; line-height:1.3; }
/* bottom */
.bot { background:#000; padding:8px 12px 18px; }
.chips { display:flex; gap:8px; overflow:hidden; margin-bottom:10px; align-items:center; }
.chips .lab { flex:none; color:#aaa; font-size:14px; font-weight:600; margin-right:2px; }
.chip { flex:none; display:flex; align-items:center; gap:7px; height:44px; padding:0 12px 0 4px; border-radius:999px; background:#222; border:1.5px solid #444; color:#fff; font-size:15px; font-weight:600; white-space:nowrap; }
.chip img, .chip .ic { width:36px; height:36px; border-radius:50%; object-fit:cover; }
.chip .ic { display:flex; align-items:center; justify-content:center; background:#333; } .chip .ic svg { width:18px; height:18px; }
.chip.on { background:#fff; color:#000; border-color:#fff; }
.row3 { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin-bottom:10px; }
.shutter { width:74px; height:74px; border-radius:50%; background:#fff; border:4px solid #000; box-shadow:0 0 0 3px #fff; }
.side { font-size:16px; font-weight:600; color:#fff; background:#222; border-radius:999px; padding:10px 16px; justify-self:start; }
.side.r { justify-self:end; }
.saverow { display:flex; gap:8px; }
.next { flex:none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; width:64px; height:56px; padding:0; font-size:13px !important; border-radius:16px; background:#222; border:1.5px solid #555; color:#fff; font-size:16px; font-weight:700; }
.save { flex:1; min-width:0; display:flex; align-items:center; justify-content:center; gap:8px; height:56px; border-radius:16px; background:var(--accent); color:#fff; font-size:18px; font-weight:800; white-space:nowrap; overflow:hidden; }
.save span { overflow:hidden; text-overflow:ellipsis; } .save svg { width:22px; height:22px; }
.save.quiet { background:#111; border:1.5px solid #666; color:#ddd; font-weight:700; }
.answer { color:#fff; font-size:15px; font-weight:600; margin:0 2px 10px; height:44px; display:flex; gap:6px; align-items:center; background:#1a1a1a; border-radius:12px; padding:0 12px; } .answer span { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .answer u { margin-left:auto; color:#8CC4B2; font-weight:700; }
.answer svg { color:#8CC4B2; width:18px; height:18px; }
/* option B: the answer card on the viewfinder */
.acard { position:absolute; left:10px; right:10px; bottom:10px; background:rgba(255,253,249,.86); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); color:var(--ink); border-radius:18px; padding:10px; box-shadow:0 6px 18px rgba(0,0,0,.45); }
.acard .th { display:flex; gap:6px; align-items:center; }
.acard .th img { width:52px; height:52px; border-radius:10px; object-fit:cover; } .acard .th .in { font-size:12px; font-weight:800; color:var(--ink-soft); }
.acard .s { font-size:16px; font-weight:700; margin:8px 2px 10px; line-height:1.3; } .acard .s small { display:block; color:var(--ink-soft); font-weight:500; font-size:14px; }
.acard .bt { display:flex; gap:8px; } .acard .bt div { flex:1; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; gap:6px; font-weight:800; font-size:17px; }
.acard .bt .sv { background:var(--accent); color:#fff; } .acard .bt .nx { flex:none; padding:0 14px; background:var(--accent-soft); color:var(--accent); }
/* ---------- Home ---------- */
.home { position:absolute; inset:0; background:var(--bg); color:var(--ink); padding:10px 16px 0; }
.dayrow { display:flex; align-items:center; gap:12px; height:48px; } .dayrow svg { width:24px; height:24px; color:var(--ink); }
.dayrow .d b { display:block; font-size:19px; } .dayrow .d small { color:var(--ink-soft); font-size:14px; }
.notput { display:inline-flex; align-items:center; gap:6px; margin:6px 0 10px; padding:7px 14px; border-radius:999px; background:var(--amber-bg); color:var(--amber); font-weight:700; font-size:16px; border:1.5px solid #e5d3b3; }
.notput svg { width:18px; height:18px; }
.grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.tile { background:var(--card); border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(58,54,48,.07); position:relative; }
.tile img { width:100%; aspect-ratio:1; object-fit:cover; } .tile .l { padding:7px 10px 9px; font-weight:700; font-size:15px; } .tile .l small { display:block; color:var(--ink-soft); font-weight:600; font-size:13px; }
.tile.new { box-shadow:0 0 0 3px var(--accent); }
.foot { position:absolute; left:0; right:0; bottom:0; padding:10px 16px 18px; background:linear-gradient(transparent, var(--bg) 30%); display:flex; gap:10px; }
.foot div { flex:1; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:19px; font-weight:700; }
.foot .p { background:var(--accent); color:#fff; } .foot .a { background:var(--card); color:var(--accent); border:2px solid var(--accent); }
.done { position:absolute; left:12px; right:12px; bottom:92px; background:#2B2823; color:#fff; border-radius:18px; padding:12px; box-shadow:0 8px 24px rgba(0,0,0,.3); }
.done .trail { display:flex; align-items:center; gap:4px; } .done .trail img { width:58px; height:58px; border-radius:10px; object-fit:cover; border:2px solid #fff; }
.done .trail .in { font-size:12px; font-weight:800; color:#bbb; }
.done .s { margin-top:8px; font-size:16px; font-weight:700; line-height:1.3; } .done .s small { display:block; font-weight:500; color:#ccc; font-size:14px; }
.done .u { position:absolute; right:12px; top:12px; color:#fff; font-weight:700; text-decoration:underline; font-size:16px; }
/* sheet */
.dim { position:absolute; inset:0; background:rgba(0,0,0,.3); }
.sheet { position:absolute; left:0; right:0; bottom:0; background:rgba(255,253,249,.9); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); color:var(--ink); border-radius:22px 22px 0 0; padding:14px 16px 18px; }
.sheet .h { display:flex; gap:10px; align-items:center; } .sheet .h img { width:56px; height:56px; border-radius:12px; object-fit:cover; }
.sheet .h b { font-size:19px; display:block; } .sheet .h small { color:var(--ink-soft); font-size:15px; }
.sheet .g { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin:12px 0; }
.sheet .g .tile img { aspect-ratio:1; } .sheet .g .tile .l { font-size:13px; padding:5px 7px 7px; }
.sheet .g .tile .tk { position:absolute; right:6px; top:6px; width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.9); border:2px solid var(--accent); display:flex; align-items:center; justify-content:center; color:#fff; }
.sheet .g .tile.on .tk { background:var(--accent); } .sheet .g .tile.on { box-shadow:0 0 0 3px var(--accent); }
.sheet .bt { height:56px; border-radius:16px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; gap:8px; font-size:18px; font-weight:800; }
/* card */
.card { position:absolute; inset:0; background:var(--bg); color:var(--ink); padding:10px 16px; }
.hd { display:flex; align-items:center; gap:10px; height:44px; } .hd .bk { width:36px; height:36px; border-radius:10px; border:1.5px solid var(--line); background:var(--card); display:flex; align-items:center; justify-content:center; color:var(--accent); }
.hd .t { font-size:22px; font-weight:800; }
.where { margin:8px 0 10px; background:var(--accent-soft); border-radius:14px; padding:10px 12px; font-weight:700; font-size:17px; display:flex; align-items:center; gap:8px; }
.where svg { color:var(--accent); }
.where.none { background:var(--amber-bg); color:var(--amber); } .where.none svg { color:var(--amber); }
.where .go { margin-left:auto; display:flex; align-items:center; gap:6px; background:var(--accent); color:#fff; border-radius:999px; padding:8px 12px; font-size:15px; }
.where .go svg { color:#fff; width:18px; height:18px; }
.bigph { width:100%; height:300px; object-fit:cover; border-radius:16px; }
.trailbig { display:flex; flex-direction:column; gap:8px; margin-top:6px; }
.trailbig .st { display:flex; gap:12px; align-items:center; background:var(--card); border-radius:16px; padding:8px; box-shadow:0 2px 10px rgba(58,54,48,.07); }
.trailbig .st img { width:96px; height:96px; border-radius:12px; object-fit:cover; flex:none; }
.trailbig .st .n { flex:none; width:30px; height:30px; border-radius:50%; background:var(--accent); color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; }
.trailbig .st b { display:block; font-size:18px; } .trailbig .st small { display:block; color:var(--ink-soft); font-size:15px; margin-top:2px; }
.q { font-size:15px; color:var(--ink-soft); margin:4px 0 8px; } .qa { font-size:24px; font-weight:800; line-height:1.25; margin:4px 0 10px; }
'''

def page(body): return f'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{CSS}</style></head><body>{body}</body></html>'
def im(k, cls=''): return f'<img class="{cls}" src="img/{k}.jpg" alt="">'

def chainhtml(items, extra=''):
    out = []
    for i, c in enumerate(items):
        if i: out.append('<span class="in">in</span>')
        if c.get('wait'):
            out.append(f'<div class="c wait"><div class="ph">{I["cam"]}</div><div class="nm">{c.get("nm","Where?")}</div></div>')
        else:
            if c.get('pin'):
                out.append(f'<div class="c"><div class="ph" style="display:flex;align-items:center;justify-content:center;background:#2F6B5E">{I["pin"]}</div><div class="nm">{c["nm"]}<i>{c.get("sub","")}</i></div></div>'); continue
            lk = f'<span class="lk">{I["lock"]}</span>' if c.get('lock') else ''
            out.append(f'<div class="c{" naming" if c.get("naming") else ""}"><div class="ph">{im(c["img"])}{lk}</div><div class="nm">{c["nm"]}{("<i>" + c["sub"] + "</i>") if c.get("sub") else ""}</div></div>')
    return f'<div class="chain">{"".join(out)}{extra}</div>'

def chips(lst, lab=''):
    h = f'<span class="lab">{lab}</span>' if lab else ''
    for c in lst:
        pic = im(c[1]) if c[1] else f'<span class="ic">{I["more"] if c[0] == "More" else I["pin"]}</span>'
        h += f'<span class="chip{" on" if len(c) > 2 and c[2] else ""}">{pic}{c[0]}</span>'
    return f'<div class="chips">{h}</div>'

def camera(live, n, prompt, sub='', chain=None, chiprow='', left='', save=None, quiet=False, answer='', title='Log item', ask='', count='', overlay=''):
    ch = chainhtml(chain, ask) if chain else ''
    sv = ''
    if save is not None:
        sv = f'<div class="saverow"><div class="next">{I["cam"]}Next</div><div class="save{" quiet" if quiet else ""}">{I["check"]}<span>{save}</span></div></div>'
    ans = f'<div class="answer">{I["pin"]}<span>{answer}</span><u>Change</u></div>' if answer else ''
    if ans: chiprow = ''
    return page(f'''<div class="cam"><div class="top"><span>Cancel</span><span class="t">{title}</span><span class="r">{count}</span></div>
<div class="view">{im(live, "live")}<div class="prompt"><span class="n">{n}</span><div><b>{prompt}</b>{("<small>" + sub + "</small>") if sub else ""}</div></div>{ch}{overlay}</div>
<div class="bot">{chiprow}{ans}<div class="row3">{f'<span class="side">{left}</span>' if left else '<span></span>'}<span class="shutter"></span><span></span></div>{sv}</div></div>''')

KEY = dict(img='keys', nm='Bank locker key', lock=True)
TIN = dict(img='tin', nm='Blue tin', sub='new')
CLO = dict(img='closet', nm='Linen closet shelf', sub='new')
WAIT = dict(wait=True, nm='Where?')
KNOWN = [('Hall table', None), ('Wooden box', 'smallbox'), ('More', None)]

M = {}
# ---- R1: your example, all on the camera: key → the blue tin → the linen closet, top shelf
M['r1_1'] = camera('keys', 1, 'Photograph the thing', 'One thing per photo.', left='Type it')
M['r1_2'] = camera('tin', 2, 'Now where it goes', 'Step back: photograph what it is in, or where it is.',
                   chain=[KEY, WAIT], chiprow=chips(KNOWN), save='Save · no place yet', quiet=True)
M['r1_3'] = camera('closet', 3, 'And where is the tin?', 'Step back again — or Save.',
                   chain=[KEY, TIN, WAIT], chiprow=chips(KNOWN), save='Save · in the blue tin')
M['r1_4'] = camera('closet', '✓', 'Got it', 'Step back again if the closet is inside something.',
                   chain=[KEY, TIN, CLO], chiprow='', save='Save · in the blue tin', answer='Blue tin · linen closet shelf')
tiles = [('box14', 'Memorabilia box', ''), ('tooldrawer', 'Tool drawer', ''), ('folder', 'Passport', ''), ('soda', 'Coffee can', 'No place yet')]
def home(extra='', notput='', grid=tiles):
    g = ''.join(f'<div class="tile">{im(k)}<div class="l">{n}{("<small>" + s + "</small>") if s else ""}</div></div>' for k, n, s in grid)
    np = f'<div class="notput">{I["pin"]} Not put away · {notput}</div>' if notput else ''
    return f'''<div class="home"><div class="dayrow">{I["menu"]}<div class="d"><b>Sunday evening</b><small>September 27</small></div></div>{np}<div class="grid">{g}</div></div>
<div class="foot"><div class="p">{I["cam"]}Log item</div><div class="a">{I["search"]}Find item</div></div>{extra}'''
M['r1_5'] = page(home(f'''<div class="done"><span class="u">Undo</span><div class="trail">{im("keys")}<span class="in">in</span>{im("tin")}<span class="in">in</span>{im("closet")}</div>
<div class="s">Bank locker key · only you<small>In the blue tin · linen closet, top shelf</small></div></div>''', notput='1'))
M['r1_6'] = page(f'''<div class="card"><div class="hd"><span class="bk">{I["back"]}</span><span class="t">Find item</span></div>
<div class="q">Where is my locker key?</div><div class="qa">Linen closet, top shelf — in the blue tin.</div>
<div class="trailbig">
<div class="st"><span class="n">1</span>{im("closet")}<div><b>Linen closet</b><small>top shelf</small></div></div>
<div class="st"><span class="n">2</span>{im("tin")}<div><b>The blue tin</b><small>on that shelf</small></div></div>
<div class="st"><span class="n">3</span>{im("keys")}<div><b>Bank locker key</b><small>in the tin · seen today</small></div></div></div></div>''')

# ---- R2: every other way in is the same camera
M['r2_1'] = camera('keys', 2, 'Now where it goes', 'The photo shows the hall table.',
                   chain=[dict(img='keys', nm='Car keys'), dict(pin=True, nm='Hall table', sub='in the photo')],
                   chiprow=chips([('Hall table', None, True), ('Desk drawer', 'drawer'), ('More', None)]),
                   save='Save · Hall table')
M['r2_2'] = camera('smallbox', 3, 'Your wooden box?', 'It is in the memorabilia box, in the crawl space.',
                   chain=[dict(img='diary', nm='1978 diary'), dict(img='smallbox', nm='Wooden box', sub='yours')],
                   ask='<div class="ask">Your wooden box?<div class="row"><button>Yes</button><button class="o">No, a new one</button></div></div>',
                   chiprow='', save='Save · in the wooden box', answer='Memorabilia box · crawl space')
M['r2_3'] = page(home('', notput='2', grid=[('box14', 'Memorabilia box', ''), ('tooldrawer', 'Tool drawer', ''), ('charger', 'Phone charger', 'No place yet'), ('soda', 'Coffee can', 'No place yet')]))
M['r2_4'] = camera('drawer', 1, 'Where are they going?', 'Photograph the place — or tap one.', title='Put away',
                   chiprow=chips([('Desk drawer', 'drawer'), ('Hall table', None), ('More', None)]))
M['r2_5'] = page(f'''<div class="cam"><div class="top"><span>Cancel</span><span class="t">Put away</span><span class="r"></span></div><div class="view">{im("drawer", "live")}</div></div>
<div class="dim"></div><div class="sheet"><div class="h">{im("drawer")}<div><b>What goes in the desk drawer?</b><small>Tap each one</small></div></div>
<div class="g"><div class="tile on">{im("charger")}<span class="tk">{I["check"]}</span><div class="l">Phone charger</div></div>
<div class="tile">{im("soda")}<span class="tk"></span><div class="l">Coffee can</div></div></div>
<div class="bt">{I["check"]}Put 1 · in the desk drawer</div></div>''')
M['r2_6'] = page(f'''<div class="card"><div class="hd"><span class="bk">{I["back"]}</span><span class="t">Coffee can</span></div>
<div class="where none">{I["pin"]}No place yet<span class="go">{I["cam"]}Where is it?</span></div>{im("soda", "bigph")}
</div>''')
# ---- R3: two layouts for the same camera (ruling)
M['r3_a'] = M['r1_4']
M['r3_b'] = page(f'''<div class="cam"><div class="top"><span>Cancel</span><span class="t">Log item</span><span class="r"></span></div>
<div class="view">{im("closet", "live")}<div class="prompt"><span class="n">✓</span><div><b>Got it</b><small>Step back again if the closet is inside something.</small></div></div>
<div class="acard"><div class="th">{im("keys")}<span class="in">in</span>{im("tin")}<span class="in">in</span>{im("closet")}</div>
<div class="s">Bank locker key<small>In the blue tin · linen closet, top shelf</small></div><div class="bt"><div class="nx">{I["cam"]}Next</div><div class="sv">{I["check"]}Save · in the blue tin</div></div></div></div>
<div class="bot"><div class="row3"><span></span><span class="shutter"></span><span></span></div></div></div>''')


# =====================================================================================================
# S9b (Ravi 09-27, second round): Cancel looked like the title; buttons of one kind belong together;
# a sentence inside a button wraps badly — the button says one verb, the sentence sits beside it.
# Both A and B become a pick in Settings. The board's grouping: Cancel alone, top-left (it throws the
# photos away); the two ways to KEEP it together at the bottom (Save + next, Save); capture controls
# (shutter, Type it, the place chips) in their own row.
# =====================================================================================================
CSS2 = """
.top2 { display:flex; align-items:center; justify-content:space-between; height:60px; padding:0 12px; }
.xbtn { display:flex; align-items:center; gap:6px; height:44px; padding:0 16px 0 12px; border-radius:999px; background:#2A2A2A; border:1.5px solid #5A5A5A; color:#fff; font-size:17px; font-weight:700; }
.xbtn svg { width:18px; height:18px; }
.nbtn { display:flex; align-items:center; gap:6px; height:44px; padding:0 12px 0 16px; border-radius:999px; background:#2A2A2A; border:1.5px solid #5A5A5A; color:#fff; font-size:17px; font-weight:700; }
.nbtn svg { width:18px; height:18px; }
.whose { font-size:14px; color:#F2C9B3; background:#3D2B22; border-radius:999px; padding:6px 12px; font-weight:700; }
.say { display:flex; align-items:flex-start; gap:8px; color:#fff; font-size:16px; line-height:1.3; margin:0 4px 10px; min-height:42px; }
.say svg { color:#8CC4B2; width:18px; height:18px; margin-top:2px; } .say b { font-weight:800; } .say .soft { color:#bbb; }
.say .tx { flex:1; min-width:0; } .say .tx b, .say .tx .soft { display:inline-block; max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; vertical-align:top; }
.say .chg { flex:none; width:40px; height:40px; border-radius:50%; background:#2A2A2A; border:1.5px solid #5A5A5A; display:flex; align-items:center; justify-content:center; color:#fff; margin-top:0; } .say .chg svg { color:#fff; margin:0; width:18px; height:18px; }
.acard .say .chg { background:var(--accent-soft); border:0; } .acard .say .chg svg { color:var(--accent); }
.say .ch { margin-left:auto; flex:none; color:#8CC4B2; font-weight:700; text-decoration:underline; font-size:15px; padding-left:8px; }
.keep { display:grid; grid-template-columns:1fr 1.15fr; gap:10px; }
.keep > div { height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:19px; font-weight:800; white-space:nowrap; }
.keep .sn { background:#232323; border:1.5px solid #666; color:#fff; font-size:17px; } .keep .sv { background:var(--accent); color:#fff; }
.keep svg { width:21px; height:21px; }
.keep.three { grid-template-columns:1fr 1fr 1.2fr; } .keep .cx { background:#232323; border:1.5px solid #666; color:#fff; font-size:17px; }
.acard .say { color:var(--ink); margin:8px 2px 10px; min-height:0; } .acard .say .soft { color:var(--ink-soft); } .acard .say svg { color:var(--accent); } .acard .say .ch { color:var(--accent); }
.acard .keep .sn, .acard .keep .cx { background:var(--accent-soft); color:var(--accent); border:0; }
.acard .nm2 { font-size:17px; font-weight:800; margin:8px 2px 0; display:flex; align-items:center; gap:6px; } .acard .nm2 svg { width:16px; height:16px; color:var(--ink-soft); }
.row3b { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; margin:2px 0 12px; }
/* settings */
.set { position:absolute; inset:0; background:var(--bg); color:var(--ink); padding:10px 16px; }
.set h3 { font-size:15px; color:var(--ink-soft); text-transform:uppercase; letter-spacing:.04em; margin:18px 4px 8px; }
.set .grp { background:var(--card); border-radius:16px; padding:12px; box-shadow:0 2px 10px rgba(58,54,48,.07); }
.set .lbl2 { font-size:18px; font-weight:700; margin:0 2px 10px; } .set .opts { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.set .opt { border:2px solid var(--line); border-radius:14px; padding:8px; text-align:center; font-weight:700; font-size:16px; }
.set .opt.on { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent) inset; }
.set .opt img { width:100%; height:300px; object-fit:contain; border-radius:8px; margin-bottom:6px; background:#000; }
.set .opt small { display:block; font-weight:500; color:var(--ink-soft); font-size:13px; margin-top:2px; }
.set .row { display:flex; justify-content:space-between; align-items:center; padding:12px 4px; font-size:17px; border-top:1px solid var(--line); } .set .row span { color:var(--ink-soft); }
"""
CSS_ALL = CSS + CSS2
def page2(body): return f'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{CSS_ALL}</style></head><body>{body}</body></html>'
def top2(right=''):
    return f'<div class="top2"><span class="xbtn">{I["x"]}Cancel</span>{right}</div>'
def say(line1, line2='', change=True):
    return f'<div class="say">{I["pin"]}<span class="tx"><b>{line1}</b>{("<br><span class=soft>" + line2 + "</span>") if line2 else ""}</span>{("<span class=chg>" + I["pencil"] + "</span>") if change else ""}</div>'
def keep(kind='board'):
    if kind == 'board': return f'<div class="keep"><div class="sn">{I["cam"]}Save + next</div><div class="sv">{I["check"]}Save</div></div>'
    if kind == 'save': return f'<div class="keep" style="grid-template-columns:1fr"><div class="sv">{I["check"]}Save</div></div>'
    if kind == 'cancelsave': return f'<div class="keep"><div class="cx">{I["x"]}Cancel</div><div class="sv">{I["check"]}Save</div></div>'
    if kind == 'three': return f'<div class="keep three"><div class="cx">{I["x"]}Cancel</div><div class="sn">{I["cam"]}Next</div><div class="sv">{I["check"]}Save</div></div>'
def camA(live, n, prompt, sub='', chain=None, chiprow='', left='', sentence='', decide='board', right='', ask=''):
    ch = chainhtml(chain, ask) if chain else ''
    bottom = chiprow + f'<div class="row3b">{f"<span class=side>{left}</span>" if left else "<span></span>"}<span class="shutter"></span><span></span></div>'
    if sentence: bottom += sentence + keep(decide)
    return page2(f"""<div class="cam">{top2(right)}<div class="view">{im(live, "live")}<div class="prompt"><span class="n">{n}</span><div><b>{prompt}</b>{("<small>" + sub + "</small>") if sub else ""}</div></div>{ch}</div>
<div class="bot">{bottom}</div></div>""")
def camB(live, n, prompt, sub='', thumbs=(), name='', sentence='', chiprow='', decide='board', topbar=None, lock=False):
    th = ''.join((('<span class="in">in</span>' if i else '') + im(k)) for i, k in enumerate(thumbs))
    card = f"""<div class="acard"><div class="th">{th}</div><div class="nm2">{name}{I["lock"] if lock else ""}</div>{sentence}{keep(decide)}</div>""" if name else ''
    return page2(f"""<div class="cam">{topbar if topbar is not None else top2()}<div class="view">{im(live, "live")}<div class="prompt"><span class="n">{n}</span><div><b>{prompt}</b>{("<small>" + sub + "</small>") if sub else ""}</div></div>{card}</div>
<div class="bot">{chiprow}<div class="row3b"><span></span><span class="shutter"></span><span></span></div></div></div>""")
SENT_FULL = say('In the blue tin', 'on the linen closet shelf')
SENT_NONE = say('No place yet', 'Photograph where it goes, or Save', change=False)
CH2 = chips([('Hall table', None), ('Wooden box', 'smallbox'), ('More', None)])

# ---- the grouping debate, all in B at the finished step
GB = dict(live='closet', n='✓', prompt='Got it', sub='Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), name='Bank locker key', lock=True, sentence=SENT_FULL)
NEXT_TOP = f'<span class="nbtn">Next item{I["right"]}</span>'
M['g1'] = camB(**GB, decide='save', topbar=f'<div class="top2"><span class="xbtn">{I["x"]}Cancel</span>{NEXT_TOP}</div>')
M['g2'] = camB(**GB, decide='cancelsave', topbar=f'<div class="top2"><span></span>{NEXT_TOP}</div>')
M['g3'] = camB(**GB, decide='three', topbar='<div class="top2"></div>')
M['g4'] = camB(**GB, decide='board')
# ---- the board's pick, in both styles (Settings → Look)
M['a1'] = camA('keys', 1, 'Photograph the thing', 'One thing per photo.', left='Type it')
M['a2'] = camA('tin', 2, 'Now where it goes', 'Step back: photograph what it is in, or where it is.', chain=[KEY, WAIT], chiprow=CH2, sentence=SENT_NONE)
M['a4'] = camA('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', chain=[KEY, TIN, CLO], chiprow=CH2, sentence=SENT_FULL)
M['b2'] = camB('tin', 2, 'Now where it goes', 'Step back: photograph what it is in, or where it is.', thumbs=('keys',), name='Bank locker key', lock=True, sentence=SENT_NONE, chiprow=CH2)
M['b4'] = camB(**GB, chiprow=CH2, decide='board')
M['bh'] = camB(**dict(GB, name='Reading glasses', thumbs=('glasses', 'tin'), lock=False, sentence=say('In the blue tin', 'in Mom’s sewing room')), chiprow=CH2,
              topbar=f'<div class="top2"><span class="xbtn">{I["x"]}Cancel</span><span class="whose">Mom’s ReCall</span></div>')
M['st'] = page2(f"""<div class="set"><div class="hd"><span class="bk">{I["back"]}</span><span class="t">Settings</span></div>
<h3>Look</h3><div class="grp"><div class="lbl2">The camera</div><div class="opts">
<div class="opt"><img src="../shots/s9/s9_a4.png">Photo clear<small>Save at the bottom</small></div>
<div class="opt on"><img src="../shots/s9/s9_b4.png">Answer card<small>Everything in one card</small></div></div>
<div class="row">Text size<span>Large</span></div><div class="row">Colours<span>Linen</span></div></div></div>""")
M['pa'] = page2(f"""<div class="cam">{top2()}<div class="view">{im("drawer", "live")}</div></div>
<div class="dim"></div><div class="sheet"><div class="h">{im("drawer")}<div><b>What goes in the desk drawer?</b><small>Tap each one</small></div></div>
<div class="g"><div class="tile on">{im("charger")}<span class="tk">{I["check"]}</span><div class="l">Phone charger</div></div>
<div class="tile">{im("soda")}<span class="tk"></span><div class="l">Coffee can</div></div></div>
<div class="say" style="color:var(--ink)">{I["pin"]}<span class="tx"><b>1 thing</b><br><span style="color:var(--ink-soft)">into the desk drawer</span></span></div>
<div class="bt">{I["check"]}Put away</div></div>""")


# =====================================================================================================
# S9c (Ravi 09-27, round 3): the chain lines up (fixed label area) with "in" as a pill, and scrolls sideways
# when deeper; Save and Save + next sit either side of the shutter; Save has its own icon, reused in
# "+ Next"; the camera icon means only "take a photo" (the empty "where" square gets a pin with a ?);
# tapping a chain photo opens it half-screen, tap anywhere to close. B is the default.
# =====================================================================================================
I['save'] = svg('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3"/><path d="M8 13h8v8H8z"/>')
I['pinq'] = svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><path d="M10.5 8.5a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.7.6-.7 1v.3"/><path d="M12 13.2v.1"/>')
CSS3 = """
.ch3 { position:absolute; left:0; right:0; bottom:10px; display:flex; align-items:flex-start; gap:6px; padding:0 10px; overflow:hidden; }
.ch3 .t { flex:none; width:84px; }
.ch3 .t .ph { position:relative; width:84px; height:84px; border-radius:14px; overflow:hidden; border:2.5px solid rgba(255,255,255,.85); opacity:.93; box-shadow:0 2px 8px rgba(0,0,0,.5); background:rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; }
.ch3 .t .ph img { width:100%; height:100%; object-fit:cover; }
.ch3 .t .ph .lk { position:absolute; right:4px; top:4px; width:24px; height:24px; border-radius:50%; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; color:#fff; } .ch3 .t .ph .lk svg { width:14px; height:14px; }
.ch3 .t.wait .ph { border-style:dashed; color:#fff; } .ch3 .t.wait .ph svg { width:34px; height:34px; }
.ch3 .t .nm { height:34px; margin-top:4px; padding:0 2px; font-size:13px; font-weight:700; line-height:1.3; color:#fff; text-shadow:0 1px 3px #000; text-align:center;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ch3 .pill { flex:none; margin-top:30px; height:24px; padding:0 9px; border-radius:999px; background:rgba(255,255,255,.82); color:#222; font-size:13px; font-weight:800; display:flex; align-items:center; }
.ch3.fade { -webkit-mask-image:linear-gradient(90deg,#000 82%,transparent); mask-image:linear-gradient(90deg,#000 82%,transparent); }
.scrollhint { position:absolute; right:8px; bottom:62px; width:30px; height:30px; border-radius:50%; background:rgba(0,0,0,.5); color:#fff; display:flex; align-items:center; justify-content:center; } .scrollhint svg { width:18px; height:18px; }
.typeit { display:flex; justify-content:center; margin-bottom:10px; } .typeit span { display:flex; align-items:center; gap:8px; height:44px; padding:0 18px; border-radius:999px; background:#232323; border:1.5px solid #5A5A5A; color:#fff; font-size:16px; font-weight:700; } .typeit svg { width:18px; height:18px; }
.row4 { display:grid; grid-template-columns:1fr 74px 1fr; gap:12px; align-items:center; margin-top:2px; }
.row4 .k { height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:18px; font-weight:800; white-space:nowrap; }
.row4 .k svg { width:22px; height:22px; } .row4 .sn { background:rgba(40,40,40,.9); border:1.5px solid #666; color:#fff; } .row4 .sv { background:var(--accent); color:#fff; }
.row4 .sn .plus { font-weight:800; margin:0 -1px; }
.row4.wide { gap:0; grid-template-columns:1fr 128px 1fr; } .row4.wide .k { font-size:17px; } .row4.wide .shutter { justify-self:center; }
.row4 .hit { position:relative; justify-self:center; } .row4 .hit::after { content:''; position:absolute; left:50%; top:50%; width:100px; height:100px; margin:-50px 0 0 -50px; border-radius:50%; border:2px dashed #F2C94C; }
.bcard { position:absolute; left:10px; right:10px; bottom:10px; background:rgba(255,253,249,.86); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); color:var(--ink); border-radius:18px; padding:10px 10px 6px; box-shadow:0 6px 18px rgba(0,0,0,.4); }
.bcard .th { display:flex; align-items:center; gap:5px; overflow:hidden; }
.bcard .th img, .bcard .th .q { flex:none; width:52px; height:52px; border-radius:10px; object-fit:cover; }
.bcard .th .q { border:2px dashed #9A9186; display:flex; align-items:center; justify-content:center; color:var(--ink-soft); } .bcard .th .q svg { width:24px; height:24px; }
.bcard .th .pill { flex:none; height:22px; padding:0 8px; border-radius:999px; background:var(--accent-soft); color:var(--accent); font-size:12px; font-weight:800; display:flex; align-items:center; }
.bcard .nm2 { font-size:17px; font-weight:800; margin:8px 2px 0; display:flex; align-items:center; gap:6px; } .bcard .nm2 svg { width:16px; height:16px; color:var(--ink-soft); }
.bcard .say { color:var(--ink); margin:6px 2px 4px; min-height:0; } .bcard .say .soft { color:var(--ink-soft); } .bcard .say svg { color:var(--accent); } .bcard .say .chg { background:var(--accent-soft); border:0; } .bcard .say .chg svg { color:var(--accent); }
.tapme { outline:3px solid #F2C94C; outline-offset:2px; }
.bcard .thw { position:relative; } .bcard .th.fade { -webkit-mask-image:linear-gradient(90deg,#000 80%,transparent); mask-image:linear-gradient(90deg,#000 80%,transparent); }
.bcard .thw .sh { position:absolute; right:-2px; top:11px; width:30px; height:30px; border-radius:50%; background:rgba(0,0,0,.5); color:#fff; display:flex; align-items:center; justify-content:center; } .bcard .thw .sh svg { width:18px; height:18px; }
.pv { position:absolute; inset:0; background:rgba(0,0,0,.45); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); display:flex; flex-direction:column; align-items:center; justify-content:center; }
.pv .box { width:340px; background:rgba(255,253,249,.9); border-radius:20px; padding:10px; color:var(--ink); box-shadow:0 10px 30px rgba(0,0,0,.5); }
.pv .box img { width:100%; height:360px; object-fit:cover; border-radius:14px; }
.pv .box b { display:block; font-size:19px; margin:10px 4px 0; } .pv .box small { display:block; color:var(--ink-soft); font-size:15px; margin:2px 4px 4px; }
.pv .hint { color:#eee; font-size:14px; margin-top:12px; }
.legend { position:absolute; inset:0; background:var(--bg); color:var(--ink); padding:18px 16px; }
.legend h2 { font-size:22px; margin:4px 0 14px; } .legend .r { display:flex; gap:14px; align-items:center; background:var(--card); border-radius:14px; padding:12px; margin-bottom:10px; box-shadow:0 2px 10px rgba(58,54,48,.07); }
.legend .r .ic { flex:none; width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:#1c1c1c; color:#fff; } .legend .r .ic svg { width:28px; height:28px; }
.legend .r .ic.g { background:var(--accent); } .legend .r .ic.d { background:rgba(0,0,0,.08); color:var(--ink); border:2px dashed #9A9186; }
.legend .r b { display:block; font-size:17px; } .legend .r small { display:block; color:var(--ink-soft); font-size:14px; margin-top:2px; line-height:1.3; }
"""
CSS_ALL3 = CSS + CSS2 + CSS3
def page3(body): return f'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{CSS_ALL3}</style></head><body>{body}</body></html>'
def chain3(items, fade=False):
    out = []
    for i, c in enumerate(items):
        if i: out.append('<span class="pill">in</span>')
        if c.get('wait'):
            out.append(f'<div class="t wait"><div class="ph">{I["pinq"]}</div><div class="nm">Where?</div></div>')
        else:
            lk = f'<span class="lk">{I["lock"]}</span>' if c.get('lock') else ''
            out.append(f'<div class="t"><div class="ph{" tapme" if c.get("tap") else ""}">{im(c["img"])}{lk}</div><div class="nm">{c["nm"]}</div></div>')
    hint = f'<span class="scrollhint">{I["right"]}</span>' if fade else ''
    return f'<div class="ch3{" fade" if fade else ""}">{"".join(out)}</div>{hint}'
def row4(active=True, wide=False, words=False):
    if words: return f'<div class="row4 wide"><div class="k sn" style="font-size:16px">Save + next</div><span class="hit"><span class="shutter" style="display:block"></span></span><div class="k sv">{I["check"]}Save</div></div>'
    if not active: return '<div class="row4"><span></span><span class="shutter"></span><span></span></div>'
    if wide: return f'<div class="row4 wide"><div class="k sn">{I["save"]}<span class="plus">+</span>Next</div><span class="hit"><span class="shutter" style="display:block"></span></span><div class="k sv">{I["save"]}Save</div></div>'
    return f'<div class="row4"><div class="k sn">{I["save"]}<span class="plus">+</span>Next</div><span class="shutter"></span><div class="k sv">{I["save"]}Save</div></div>'
def camA3(live, n, prompt, sub, chain=None, chiprow='', sentence='', step1=False, fade=False, over=''):
    bot = (f'<div class="typeit"><span>{I["pencil"]}Type it instead</span></div>' if step1 else chiprow + sentence) + row4(not step1)
    return page3(f"""<div class="cam">{top2()}<div class="view">{im(live, "live")}<div class="prompt"><span class="n">{n}</span><div><b>{prompt}</b><small>{sub}</small></div></div>{chain3(chain, fade) if chain else ""}</div>
<div class="bot">{bot}</div></div>{over}""")
def camB3(live, n, prompt, sub, thumbs=(), wait=False, name='', lock=False, sentence='', chiprow='', over='', tap=None, fade=False, wide=False, words=False):
    th = ''
    for i, k in enumerate(thumbs):
        th += ('<span class="pill">in</span>' if i else '') + (f'<img class="tapme" src="img/{k}.jpg">' if k == tap else im(k))
    if wait: th += '<span class="pill">in</span>' + f'<span class="q">{I["pinq"]}</span>'
    thh = f'<div class="thw"><div class="th fade">{th}</div><span class="sh">{I["right"]}</span></div>' if fade else f'<div class="th">{th}</div>'
    card = f"""<div class="bcard">{thh}<div class="nm2">{name}{I["lock"] if lock else ""}</div>{sentence}</div>"""
    return page3(f"""<div class="cam">{top2()}<div class="view">{im(live, "live")}<div class="prompt"><span class="n">{n}</span><div><b>{prompt}</b><small>{sub}</small></div></div>{card}</div>
<div class="bot">{chiprow}{row4(wide=wide, words=words)}</div></div>{over}""")
KEY3 = dict(img='keys', nm='Bank locker key', lock=True); TIN3 = dict(img='tin', nm='Blue tin'); CLO3 = dict(img='closet', nm='Linen closet shelf')
SUB2 = 'Step back: photograph what it is in, or where it is.'
M['c_a1'] = camA3('keys', 1, 'Photograph the thing', 'One thing per photo.', step1=True)
M['c_a2'] = camA3('tin', 2, 'Now where it goes', SUB2, chain=[KEY3, WAIT], chiprow=CH2, sentence=SENT_NONE)
M['c_a4'] = camA3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', chain=[KEY3, TIN3, CLO3, WAIT], chiprow=CH2, sentence=SENT_FULL, fade=True)
M['c_b2'] = camB3('tin', 2, 'Now where it goes', SUB2, thumbs=('keys',), wait=True, name='Bank locker key', lock=True, sentence=SENT_NONE, chiprow=CH2)
M['c_b4'] = camB3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), wait=True, name='Bank locker key', lock=True, sentence=SENT_FULL, chiprow=CH2, tap='tin')
M['c_pv'] = camB3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), wait=True, name='Bank locker key', lock=True, sentence=SENT_FULL, chiprow=CH2,
    over=f'<div class="pv"><div class="box">{im("tin")}<b>Blue tin</b><small>New · on the linen closet shelf</small></div><div class="hint">Tap anywhere to close</div></div>')
M['c_b5'] = camB3('box', '✓', 'Got it', 'Step back again if the unit is inside something.', thumbs=('card', 'smallbox', 'box14', 'box'), wait=True, name='Baseball card',
    sentence=say('In the wooden box', 'memorabilia box · Storage unit 214'), chiprow=CH2, fade=True)
M['c_w'] = camB3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), wait=True, name='Bank locker key', lock=True, sentence=SENT_FULL, chiprow=CH2, wide=True)
M['c_wd'] = camB3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), wait=True, name='Bank locker key', lock=True, sentence=SENT_FULL, chiprow=CH2, words=True)
M['c_wi'] = camB3('closet', '✓', 'Got it', 'Step back again if the closet is inside something.', thumbs=('keys', 'tin', 'closet'), wait=True, name='Bank locker key', lock=True, sentence=SENT_FULL, chiprow=CH2, wide=True).replace(I['save'], I['check'])
M['c_ic'] = page3(f"""<div class="legend"><h2>One meaning per icon</h2>
<div class="r"><span class="ic">{I["cam"]}</span><div><b>Camera</b><small>Take a photo. Only that: Log item, Add photo, the shutter.</small></div></div>
<div class="r"><span class="ic g">{I["save"]}</span><div><b>Save</b><small>Keep this thing. "Save" alone goes Home; "+ Next" keeps it and starts the next one.</small></div></div>
<div class="r"><span class="ic d">{I["pinq"]}</span><div><b>Where? (not known yet)</b><small>An empty place in the chain. Not a button: the shutter fills it.</small></div></div>
<div class="r"><span class="ic">{I["pin"]}</span><div><b>A place</b><small>Where something is. On chips and in the sentence above Save.</small></div></div>
<div class="r"><span class="ic">{I["pencil"]}</span><div><b>Change / type</b><small>Change the place, or type instead of a photo.</small></div></div>
<div class="r"><span class="ic">{I["x"]}</span><div><b>Cancel</b><small>Throw these photos away. Top-left, alone.</small></div></div></div>""")

os.makedirs(OUT, exist_ok=True)
for k, v in M.items():
    open(os.path.join(OUT, f's9_{k}.html'), 'w').write(v)
print(len(M), 'mocks')
