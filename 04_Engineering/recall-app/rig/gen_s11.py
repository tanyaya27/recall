#!/usr/bin/env python3
"""S11 — the board's fix after Ravi's phone test of build 1 (09-27), drawn in his dark theme with his photos.
  C · the camera: every photo goes to the LEVEL she picked (the thing, what it's in, where that is…), each level
      its own colour; the chosen level is outlined in its colour and the shutter's outer ring takes the same colour.
  P · one page per thing: Where it is (and Move it / Put it somewhere) · What's in it · no toolbar of other jobs.
  H · Home tiles that say one thing each.   L · the list of every place and box, with "a new place: photograph it".
Writes mock/s11_<k>.html; render with `node render_s11.js`."""
import os
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'mock')
def svg(p, sw=2): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'
I = {
 'cam': svg('<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>'),
 'save': svg('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3"/><path d="M8 13h8v8H8z"/>'),
 'x': svg('<path d="M6 6l12 12M18 6L6 18"/>', 2.4), 'pin': svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
 'pinq': svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><path d="M10.5 8.5a1.6 1.6 0 1 1 2.2 1.5c-.5.2-.7.6-.7 1v.3"/><path d="M12 13.2v.1"/>'),
 'plus': svg('<path d="M12 5v14M5 12h14"/>', 2.6), 'pencil': svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
 'back': svg('<path d="M15 6l-6 6 6 6"/>', 2.4), 'right': svg('<path d="M9 6l6 6-6 6"/>', 2.4), 'lock': svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
 'box': svg('<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>'), 'search': svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>', 2.2),
 'menu': svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2.25), 'gear': svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
 'more': svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'), 'trash': svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
 'move': svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><path d="M9.5 10h5M12.5 8l2 2-2 2"/>'),
}
# One colour per level (Ravi): the thing is white; where-levels 1–10.
LEVEL = ['#FFFFFF', '#F5B942', '#4DB6F5', '#F2766B', '#A98BF7', '#5BD08D', '#F57EC0', '#3FD0C9', '#C5E35A', '#F79A45', '#E3C9A0']
CSS = '''
:root { --bg:#1F1D1A; --card:#2A2724; --ink:#F1ECE3; --soft:#B3AB9E; --accent:#8CC4B2; --accent-soft:#2F3F3A; --amber:#E0B26A; --amber-bg:#3A3020; --line:#3A362F; }
* { box-sizing:border-box; } html,body { margin:0; width:390px; height:844px; overflow:hidden; background:var(--bg); color:var(--ink); font-family:-apple-system,"SF Pro Text",Inter,system-ui,sans-serif; }
img { display:block; } svg { width:1.2em; height:1.2em; flex:none; }
/* camera */
.cam { position:absolute; inset:0; background:#000; color:#fff; display:flex; flex-direction:column; }
.top { height:60px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; }
.xbtn { display:flex; align-items:center; gap:6px; height:44px; padding:0 16px 0 12px; border-radius:999px; background:#2A2A2A; border:1.5px solid #5A5A5A; font-size:17px; font-weight:700; } .xbtn svg { width:18px; height:18px; }
.view { position:relative; flex:1; overflow:hidden; } .view > img.live { width:100%; height:100%; object-fit:cover; }
.prompt { position:absolute; left:12px; right:12px; top:12px; display:flex; gap:10px; align-items:center; padding:10px 14px; border-radius:16px; background:rgba(0,0,0,.45); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); }
.prompt .dot { flex:none; width:26px; height:26px; border-radius:50%; border:4px solid; }
.prompt b { display:block; font-size:18px; line-height:1.25; } .prompt small { display:block; font-size:14px; color:#ddd; margin-top:2px; line-height:1.3; }
/* the answer card: dark glass, never white-on-white */
.card { position:absolute; left:10px; right:10px; bottom:10px; padding:10px 10px 8px; border-radius:18px; background:rgba(22,22,22,.5); -webkit-backdrop-filter:blur(16px) saturate(1.2); backdrop-filter:blur(16px) saturate(1.2); border:1px solid rgba(255,255,255,.14); color:#fff; }
.lv { display:flex; align-items:center; gap:6px; overflow:hidden; }
.lv .t { position:relative; flex:none; width:58px; height:58px; border-radius:12px; overflow:hidden; border:3px solid rgba(255,255,255,.25); background:rgba(255,255,255,.08); display:flex; align-items:center; justify-content:center; }
.lv .t img { width:100%; height:100%; object-fit:cover; opacity:.95; }
.lv .t.sel { border-width:4px; box-shadow:0 0 0 2px rgba(0,0,0,.4); }
.lv .t.empty { border-style:dashed; } .lv .t.empty svg { width:24px; height:24px; }
.lv .t .n { position:absolute; right:2px; bottom:2px; min-width:20px; height:20px; padding:0 5px; border-radius:10px; background:rgba(0,0,0,.7); font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.lv .t .lk { position:absolute; left:3px; top:3px; width:20px; height:20px; border-radius:50%; background:rgba(0,0,0,.6); display:flex; align-items:center; justify-content:center; } .lv .t .lk svg { width:12px; height:12px; }
.lv .in { flex:none; height:22px; padding:0 8px; border-radius:999px; background:rgba(255,255,255,.22); color:#fff; font-size:12px; font-weight:800; display:flex; align-items:center; }
.lv.fade { -webkit-mask-image:linear-gradient(90deg,#000 84%,transparent); mask-image:linear-gradient(90deg,#000 84%,transparent); }
.nm { font-size:17px; font-weight:800; margin:8px 2px 0; display:flex; align-items:center; gap:6px; } .nm svg { width:15px; height:15px; opacity:.8; }
.say { display:flex; align-items:center; gap:8px; margin:6px 2px 2px; }
.say > svg { width:18px; height:18px; color:#8CC4B2; } .say .tx { flex:1; min-width:0; } .say b { display:block; font-size:16px; } .say small { display:block; font-size:14px; color:#ccc; }
.say .chg { flex:none; width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; } .say .chg svg { width:18px; height:18px; color:#fff; }
.bot { background:#000; padding:8px 12px 18px; }
.chips { display:flex; gap:6px; margin-bottom:10px; align-items:center; overflow:hidden; }
.chips .lab { flex:none; font-size:13px; font-weight:700; margin-right:2px; display:flex; align-items:center; gap:5px; } .chips .lab i { width:12px; height:12px; border-radius:50%; display:block; }
.chip { flex:0 1 auto; min-width:0; display:flex; align-items:center; gap:6px; height:44px; padding:0 11px 0 4px; border-radius:999px; background:#222; border:1.5px solid #444; font-size:15px; font-weight:600; white-space:nowrap; overflow:hidden; }
.chip img, .chip .ic { flex:none; width:32px; height:32px; border-radius:50%; object-fit:cover; } .chip .ic { display:flex; align-items:center; justify-content:center; background:#333; } .chip .ic svg { width:17px; height:17px; }
.chip.more { flex:none; padding:0 6px; margin-left:auto; }
.row { display:grid; grid-template-columns:1fr 128px 1fr; align-items:center; }
.k { height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:18px; font-weight:800; white-space:nowrap; } .k svg { width:22px; height:22px; }
.k.sn { background:rgba(40,40,40,.9); border:1.5px solid #666; } .k.sv { background:#2F6B5E; }
.shut { justify-self:center; width:84px; height:84px; border-radius:50%; border:5px solid; display:flex; align-items:center; justify-content:center; }
.shut span { width:62px; height:62px; border-radius:50%; background:#fff; }
.typeit { display:flex; justify-content:center; margin-bottom:10px; } .typeit span { display:flex; align-items:center; gap:8px; height:44px; padding:0 18px; border-radius:999px; background:#232323; border:1.5px solid #5A5A5A; font-size:16px; font-weight:700; } .typeit svg { width:18px; height:18px; }
.pv { position:absolute; inset:0; background:rgba(0,0,0,.45); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:5; }
.pv .box { width:340px; padding:10px; border-radius:20px; background:rgba(34,32,30,.85); -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px); border:3px solid; }
.pv .box img { width:100%; height:330px; object-fit:cover; border-radius:12px; } .pv .box b { display:block; font-size:18px; margin:10px 4px 2px; } .pv .box small { display:block; color:#ccc; font-size:14px; margin:0 4px 8px; }
.pv .rm { display:flex; align-items:center; justify-content:center; gap:6px; height:48px; border-radius:14px; background:rgba(255,255,255,.1); color:#F2A28F; font-weight:700; font-size:16px; } .pv .rm svg { width:18px; height:18px; }
.pv .hint { color:#eee; font-size:14px; margin-top:12px; }
/* app pages (dark) */
.pg { position:absolute; inset:0; padding:10px 16px 20px; background:var(--bg); overflow:hidden; }
.hd { display:flex; align-items:center; gap:10px; height:48px; } .hd .bk { width:40px; height:40px; border-radius:12px; border:1.5px solid var(--line); background:var(--card); display:flex; align-items:center; justify-content:center; color:var(--accent); }
.hd .t { font-size:24px; font-weight:800; flex:1; } .hd .lk { color:var(--soft); }
.photo { width:100%; height:230px; object-fit:cover; border-radius:16px; margin-top:6px; }
.blk { margin-top:12px; background:var(--card); border-radius:16px; padding:12px; }
.blk h4 { margin:0 0 8px; font-size:13px; letter-spacing:.06em; text-transform:uppercase; color:var(--soft); display:flex; justify-content:space-between; }
.wh { display:flex; align-items:center; gap:10px; }
.wh .ch { display:flex; align-items:center; gap:5px; } .wh .ch img { width:46px; height:46px; border-radius:10px; object-fit:cover; } .wh .ch .in { font-size:11px; font-weight:800; color:var(--soft); }
.wh .tx { flex:1; min-width:0; } .wh .tx b { display:block; font-size:17px; } .wh .tx small { display:block; color:var(--soft); font-size:14px; margin-top:1px; }
.wh.none .tx b { color:var(--amber); }
.btn { display:flex; align-items:center; justify-content:center; gap:8px; height:52px; border-radius:14px; font-size:17px; font-weight:800; margin-top:10px; }
.btn.p { background:#8CC4B2; color:#1F1D1A; } .btn.s { background:var(--accent-soft); color:var(--accent); } .btn.a { background:var(--amber); color:#1F1D1A; }
.btn svg { width:20px; height:20px; }
.grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; } .grid .it img, .grid .it .no { width:100%; aspect-ratio:1; object-fit:cover; border-radius:10px; }
.grid .it .no { background:var(--accent-soft); display:flex; align-items:center; justify-content:center; color:var(--accent); } .grid .it span { display:block; font-size:13px; font-weight:700; margin-top:4px; }
.rows .r { display:flex; align-items:center; gap:10px; height:48px; border-top:1px solid var(--line); font-size:16px; } .rows .r:first-child { border-top:0; } .rows .r svg { color:var(--accent); } .rows .r .sw { margin-left:auto; width:50px; height:30px; border-radius:15px; background:#3a3a3a; position:relative; } .rows .r .sw::after { content:''; position:absolute; left:3px; top:3px; width:24px; height:24px; border-radius:50%; background:#fff; }
.rows .r .sw.on { background:#2F6B5E; } .rows .r .sw.on::after { left:23px; }
.rows .r.red { color:#E7A08F; } .rows .r.red svg { color:#E7A08F; }
.seen { color:var(--soft); font-size:14px; margin:8px 2px 0; }
/* home */
.day { display:flex; align-items:center; gap:12px; height:52px; } .day svg { width:24px; height:24px; } .day b { font-size:21px; color:var(--soft); display:block; } .day small { color:var(--soft); font-size:15px; } .day .st { margin-left:auto; color:var(--soft); font-size:15px; display:flex; gap:5px; align-items:center; }
.notput { display:inline-flex; align-items:center; gap:6px; margin:6px 0 10px; padding:7px 14px; border-radius:999px; background:var(--amber-bg); color:var(--amber); border:1.5px solid #6b5630; font-weight:700; font-size:16px; } .notput svg { width:17px; height:17px; }
.tiles { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.tile { background:var(--card); border-radius:16px; overflow:hidden; position:relative; } .tile img, .tile .no { width:100%; aspect-ratio:1; object-fit:cover; } .tile .no { background:var(--accent-soft); display:flex; align-items:center; justify-content:center; color:var(--accent); } .tile .no svg { width:40px; height:40px; }
.tile .l { padding:8px 10px 10px; } .tile .l b { display:block; font-size:16px; } .tile .l small { display:flex; align-items:center; gap:4px; font-size:13px; color:var(--soft); margin-top:2px; white-space:nowrap; overflow:hidden; } .tile .l small svg { width:13px; height:13px; }
.tile .l small.none { color:var(--amber); }
.tile .holds { position:absolute; left:8px; top:8px; display:flex; align-items:center; gap:4px; background:rgba(0,0,0,.6); color:#fff; border-radius:999px; padding:5px 9px; font-size:13px; font-weight:700; } .tile .holds svg { width:14px; height:14px; }
.foot { position:absolute; left:0; right:0; bottom:0; padding:10px 16px 18px; background:linear-gradient(transparent,var(--bg) 30%); display:flex; gap:10px; }
.foot div { flex:1; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; gap:8px; font-size:19px; font-weight:700; } .foot .p { background:#8CC4B2; color:#1F1D1A; } .foot .a { border:2px solid #8CC4B2; color:#8CC4B2; }
/* list sheet */
.dim { position:absolute; inset:0; background:rgba(0,0,0,.35); }
.sheet { position:absolute; left:0; right:0; bottom:0; top:120px; border-radius:22px 22px 0 0; padding:14px 16px; background:rgba(34,32,30,.9); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px); border-top:1px solid rgba(255,255,255,.12); }
.sheet h3 { margin:0 0 10px; font-size:19px; } .srch { display:flex; align-items:center; gap:8px; height:46px; padding:0 12px; border-radius:12px; background:#2f2c29; color:var(--soft); font-size:16px; } .srch svg { width:18px; height:18px; }
.newp { display:flex; align-items:center; gap:10px; height:56px; margin:10px 0 4px; padding:0 12px; border-radius:14px; border:2px dashed #F5B942; color:#F5B942; font-weight:800; font-size:16px; } .newp svg { width:22px; height:22px; }
.lst .g { font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--soft); margin:12px 2px 4px; }
.lst .r { display:flex; align-items:center; gap:12px; height:56px; } .lst .r img, .lst .r .no { width:44px; height:44px; border-radius:10px; object-fit:cover; flex:none; } .lst .r .no { background:#333; display:flex; align-items:center; justify-content:center; color:#ccc; } .lst .r .no svg { width:20px; height:20px; }
.lst .r b { display:block; font-size:16px; } .lst .r small { display:block; font-size:13px; color:var(--soft); }
'''
def page(body): return f'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>{CSS}</style></head><body>{body}</body></html>'
def im(k, cls=''): return f'<img class="{cls}" src="img/{k}.jpg" alt="">'

def levels(tiers, sel, fade=False):
    """tiers: list of (img or None, count, lock). The last may be ('+',) — an empty level to pick."""
    h = []
    for i, t in enumerate(tiers):
        if i: h.append('<span class="in">in</span>')
        c = LEVEL[i]
        style = f'border-color:{c}' if i == sel else ''
        if t[0] == '+':
            h.append(f'<div class="t empty{" sel" if i == sel else ""}" style="border-color:{c}; color:{c}">{I["plus"] if i != sel else I["pinq"]}</div>')
        else:
            n = f'<span class="n">{t[1]}</span>' if t[1] > 1 else ''
            lk = f'<span class="lk">{I["lock"]}</span>' if len(t) > 2 and t[2] else ''
            h.append(f'<div class="t{" sel" if i == sel else ""}" style="{style}">{im(t[0])}{n}{lk}</div>')
    return f'<div class="lv{" fade" if fade else ""}">{"".join(h)}</div>'

def camera(live, sel, prompt, sub, tiers=None, name='', lock=False, l1='', l2='', chips=None, step1=False, over='', fade=False):
    c = LEVEL[sel]
    card = ''
    if tiers:
        say = f'<div class="say">{I["pin"]}<div class="tx"><b>{l1}</b>{f"<small>{l2}</small>" if l2 else ""}</div>{"<span class=chg>" + I["pencil"] + "</span>" if l1 != "No place yet" else ""}</div>'
        card = f'<div class="card">{levels(tiers, sel, fade)}<div class="nm">{name}{I["lock"] if lock else ""}</div>{say}</div>'
    ch = ''
    if chips:
        ch = f'<div class="chips"><span class="lab" style="color:{c}"><i style="background:{c}"></i></span>' + ''.join(
            f'<span class="chip">{im(p) if p else "<span class=ic>" + I["pin"] + "</span>"}{n}</span>' for n, p in chips) + f'<span class="chip more"><span class="ic">{I["more"]}</span></span></div>'
    bot = (f'<div class="typeit"><span>{I["pencil"]}Type it instead</span></div>' if step1 else ch) + (
        f'<div class="row"><span></span><div class="shut" style="border-color:{c}"><span></span></div><span></span></div>' if step1 else
        f'<div class="row"><div class="k sn">{I["save"]}<span>+</span>Next</div><div class="shut" style="border-color:{c}"><span></span></div><div class="k sv">{I["save"]}Save</div></div>')
    return page(f'''<div class="cam"><div class="top"><span class="xbtn">{I["x"]}Cancel</span></div>
<div class="view">{im(live, "live")}<div class="prompt"><span class="dot" style="border-color:{c}"></span><div><b>{prompt}</b><small>{sub}</small></div></div>{card}</div>
<div class="bot">{bot}</div></div>{over}''')

M = {}
CH = [('Desk', None), ('Blue tin', 'tin')]
# ---- C · the camera: levels by intent, one colour each
M['c1'] = camera('real_spoon', 0, 'Photograph the thing', 'Take as many photos of it as you like.', step1=True)
M['c2'] = camera('real_spoon', 0, 'The spoon · 1 photo', 'Another photo of it, or tap ＋ to photograph where it goes.',
                 tiers=[('real_spoon', 1), ('+',)], name='Spoon', l1='No place yet', l2='Tap ＋ to add where it is')
M['c3'] = camera('real_desk', 0, 'The spoon · 2 photos', 'Every photo goes to the outlined square.',
                 tiers=[('real_spoon', 2), ('+',)], name='Spoon', l1='No place yet', l2='Tap ＋ to add where it is')
M['c4'] = camera('tin', 1, 'Where it goes', 'Photograph what the spoon is in, or where it is. Or tap a place.',
                 tiers=[('real_spoon', 2), ('+',)], name='Spoon', l1='No place yet', l2='', chips=CH)
M['c4'] = M['c4'].replace('<div class="t empty" style="border-color:#F5B942; color:#F5B942">', '<div class="t empty sel" style="border-color:#F5B942; color:#F5B942">')
M['c5'] = camera('tin', 1, 'In the blue tin · 1 photo', 'Another photo of the tin, or tap ＋ for where the tin is.',
                 tiers=[('real_spoon', 2), ('tin', 1), ('+',)], name='Spoon', l1='In the blue tin', l2='Tap ＋ to add where the tin is', chips=None)
M['c6'] = camera('closet', 2, 'On the linen closet shelf', 'Tap ＋ again if the closet is inside something.',
                 tiers=[('real_spoon', 2), ('tin', 1), ('closet', 1), ('+',)], name='Spoon', l1='In the blue tin', l2='on the linen closet shelf')
M['c7'] = camera('closet', 0, 'On the linen closet shelf', '', tiers=[('real_spoon', 2), ('tin', 1), ('closet', 1), ('+',)], name='Spoon', l1='In the blue tin', l2='on the linen closet shelf',
    over=f'''<div class="pv"><div class="box" style="border-color:{LEVEL[0]}"><div style="position:relative">{im("real_desk")}
<span style="position:absolute;left:8px;top:50%;margin-top:-20px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;transform:scaleX(-1)">{I["right"]}</span></div>
<div style="display:flex;justify-content:center;gap:8px;margin:10px 0 2px"><i style="width:9px;height:9px;border-radius:50%;background:#777"></i><i style="width:9px;height:9px;border-radius:50%;background:#fff"></i></div>
<b>Spoon · photo 2 of 2</b><small>Swipe for the other photos of the spoon (only the spoon's)</small><div class="rm">{I["trash"]}Remove this photo</div></div><div class="hint">Tap anywhere else to close</div></div>''')
sw = ''.join(f'<div style="display:flex;align-items:center;gap:10px;height:52px"><span style="width:40px;height:40px;border-radius:50%;border:6px solid {c}"></span><b style="font-size:16px">{"The thing" if i == 0 else f"Level {i}"}</b><small style="color:#B3AB9E;font-size:14px">{["the spoon","what it is in","where that is","…and so on"][min(i,3)] if i < 4 else ""}</small></div>' for i, c in enumerate(LEVEL))
M['c8'] = page(f'<div class="pg"><div class="hd"><span class="t">One colour per level</span></div><p style="color:#B3AB9E;font-size:15px;margin:4px 0 8px">The outlined square and the shutter\'s outer ring are always the same colour: that is where the next photo goes.</p>{sw}</div>')

# ---- P · one page per thing
def hdr(t, lock=False): return f'<div class="hd"><span class="bk">{I["back"]}</span><span class="t">{t}</span>{"<span class=lk>" + I["lock"] + "</span>" if lock else ""}</div>'
def more(holds=False): return f'''<div class="blk rows"><div class="r">{I["box"]}It holds things<span class="sw{" on" if holds else ""}"></span></div><div class="r">{I["cam"]}Add a photo of it</div><div class="r">{I["pencil"]}Rename</div><div class="r">{I["lock"]}Keep this private<span class="sw"></span></div><div class="r red">{I["trash"]}Remove</div></div>'''
MORE = more(False)
M['p1'] = page(f'''<div class="pg">{hdr("Pencil")}{im("real_pencil", "photo")}
<div class="seen">In the photo: a cream knitted blanket · today 12:27</div>
<div class="blk"><h4>Where it is</h4><div class="wh none">{I["pin"]}<div class="tx"><b>No place yet</b><small>Put it away so you can find it</small></div></div>
<div class="btn a">{I["move"]}Put it somewhere</div></div>{MORE}</div>''')
M['p2'] = page(f'''<div class="pg">{hdr("Bank locker key", True)}{im("keys", "photo")}
<div class="blk"><h4>Where it is</h4><div class="wh"><div class="ch">{im("tin")}<span class="in">in</span>{im("closet")}</div><div class="tx"><b>In the blue tin</b><small>on the linen closet shelf</small></div></div>
<div class="btn s">{I["move"]}Move it</div></div>{MORE}</div>''')
M['p3'] = page(f'''<div class="pg" style="overflow:auto">{hdr("Blue tin")}{im("tin", "photo")}
<div class="blk"><h4>Where it is</h4><div class="wh"><div class="ch">{im("closet")}</div><div class="tx"><b>On the linen closet shelf</b><small>seen today 7:20 PM</small></div></div><div class="btn s">{I["move"]}Move it</div></div>
<div class="blk"><h4><span>In it · 1</span></h4><div class="grid"><div class="it">{im("keys")}<span>Bank locker key</span></div></div>
<div class="btn s">{I["plus"]}Put things into the tin</div><div class="btn s">{I["cam"]}Log something into the tin</div></div>{more(True)}</div>''')
# ---- "Put it somewhere": the same camera, at the where level, with the thing already there
M['p4'] = camera('real_desk', 1, 'Where is the pencil?', 'Photograph the place or what it is in. Or tap one.',
                 tiers=[('real_pencil', 1), ('+',)], name='Pencil', l1='No place yet', l2='', chips=[('Desk', None), ('Filling cabinet', None)])
M['p4'] = M['p4'].replace('<div class="t empty" style="border-color:#F5B942; color:#F5B942">', '<div class="t empty sel" style="border-color:#F5B942; color:#F5B942">')
# ---- L · every place and box, and a new one by photo
L = f'''<div class="dim"></div><div class="sheet"><h3>Where does the pencil go?</h3><div class="srch">{I["search"]}Search places and boxes</div>
<div class="newp">{I["cam"]}New place or box: photograph it</div>
<div class="lst"><div class="g">Places</div>
<div class="r">{im("closet")}<div><b>Linen closet shelf</b><small>1 thing</small></div></div>
<div class="r"><span class="no">{I["pin"]}</span><div><b>Desk</b><small>Painting in progress</small></div></div>
<div class="r"><span class="no">{I["pin"]}</span><div><b>Bathroom shelf</b><small>Cetaphil cream</small></div></div>
<div class="r"><span class="no">{I["pin"]}</span><div><b>Under the desk</b><small>Slippers</small></div></div>
<div class="g">Boxes</div>
<div class="r">{im("tin")}<div><b>Blue tin</b><small>on the linen closet shelf · 1 inside</small></div></div>
<div class="r"><span class="no">{I["box"]}</span><div><b>Filling cabinet</b><small>no place yet · 1 inside</small></div></div></div></div>'''
M['l1'] = M['p4'].replace('</body>', L + '</body>')
# ---- H · Home: every tile opens its thing's page; the second line is always where it is
def tile(k, name, sub, none=False, holds=0):
    pic = im(k) if k else f'<span class="no">{I["box"]}</span>'
    hb = f'<span class="holds">{I["box"]}{holds} inside</span>' if holds else ''
    return f'<div class="tile">{pic}{hb}<div class="l"><b>{name}</b><small class="{"none" if none else ""}">{I["pin"]}{sub}</small></div></div>'
M['h1'] = page(f'''<div class="pg"><div class="day">{I["menu"]}<div><b>Sunday afternoon</b><small>September 27</small></div><span class="st">{I["gear"]}Settings</span></div>
<div class="notput">{I["pin"]}Not put away · 2</div><div class="tiles">
{tile("real_pencil", "Pencil", "No place yet", True)}{tile("real_painting", "Painting in progress", "Desk")}
{tile("real_cetaphil", "Cetaphil cream", "Bathroom shelf")}{tile("tin", "Blue tin", "Linen closet shelf", holds=1)}</div></div>
<div class="foot"><div class="p">{I["cam"]}Log item</div><div class="a">{I["search"]}Find item</div></div>''')

# ---- Not put away: a list of those things; each opens its page (Put it somewhere). Batch put-away comes later, on the camera.
M['n1'] = page(f'''<div class="pg">{hdr("Not put away")}<p style="color:#B3AB9E;font-size:15px;margin:2px 2px 10px">Things with no place yet. Tap one to put it somewhere.</p>
<div class="blk lst" style="padding:4px 12px">
<div class="r">{im("real_pencil")}<div style="flex:1"><b>Pencil</b><small>logged today 12:27</small></div><span style="color:#E0B26A">{I["right"]}</span></div>
<div class="r"><span class="no">{I["box"]}</span><div style="flex:1"><b>Filling cabinet</b><small>1 inside · logged today 12:21</small></div><span style="color:#E0B26A">{I["right"]}</span></div></div></div>''')
os.makedirs(OUT, exist_ok=True)
for k, v in M.items(): open(os.path.join(OUT, f's11_{k}.html'), 'w').write(v)
print(len(M), 'mocks')
