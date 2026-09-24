#!/usr/bin/env python3
"""H1 — the home screen rethink (2026-09-23). Six concepts, each drawn from the app's own
stylesheet (../out/styles.css) plus mock-only rules, with the same seeded things.
Writes mock/h1_<concept>_<frame>.html; render_h1.js screenshots them; compose_h1.py lays
them out. Photos: openly licensed Commons images (mock/img/CREDITS.md), mockups only."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'mock')
os.makedirs(OUT, exist_ok=True)

def svg(p, sw=2):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{p}</svg>'
I = dict(
  lock=svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  clock=svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pin=svg('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  camera=svg('<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>'),
  pencil=svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  trash=svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>'),
  chev=svg('<path d="M9 6l6 6-6 6"/>'),
  back=svg('<path d="M15 6l-6 6 6 6"/>'),
  down=svg('<path d="M6 9l6 6 6-6"/>'),
  search=svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'),
  menu=svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 2.25),
  mic=svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  # Can see: a framed picture (looking at photos), never an eye (Margaret/Linda: "being watched").
  see=svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="15.5" cy="9.5" r="1.5"/>'),
  # Can help: a hand with a plus — adds and moves things.
  help=svg('<path d="M12 5v6M9 8h6"/><path d="M5 14c2-1 3.5-1 5 0l2 1.2c.8.5 1.8.3 2.3-.5l.2-.3 3.2-1.6a1.6 1.6 0 0 1 1.9 2.5L15 19.5c-1.2 1-2.8 1.5-4.3 1.2L5 19.5"/>'),
  home=svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  cal=svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  door=svg('<path d="M6 21V4h12v17"/><path d="M4 21h16"/><circle cx="14.5" cy="12.5" r="1"/>'),
  swap=svg('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
)

# ---------------------------------------------------------------- the seeded things -----------
# Margaret's ReCall, in the order she first photographed them. Same everywhere.
T = [
  dict(k='glasses', name='Reading glasses', place='Kitchen counter', ctx='on a wooden table', when='Today 5:52 PM'),
  dict(k='keys', name='Car keys', place='Hall table', ctx='in the dish', when='Tue 8:10 AM'),
  dict(k='wallet', name='Wallet', place='Coat pocket', ctx='the grey coat', when='Today 6:10 PM'),
  dict(k='folder', name='Tax folders', place='Desk', ctx='by the phone', when='Sep 18, 9:41 AM'),
  dict(k='charger', name='Phone charger', place='Bedside table', ctx='', when='Mon 9:40 PM'),
  dict(k='book', name='Library book', place='Sofa', ctx='left arm', when='Today 2:15 PM'),
  dict(k='soda', name='Coffee can', place='', ctx='', when='Today 11:05 AM'),
  dict(k='scissors', name='Garden shears', place='Back porch', ctx='', when='Sun 4:30 PM', owner="Robert's"),
  dict(k='diary', name='Address book', place='Desk drawer', ctx='', when='Sep 12, 8:20 PM', private=True),
]
def things(view):
    # A guest sees Margaret's shared things: never her Only me thing, and Robert's own shears live in HIS ReCall.
    if view in ('help', 'see'):
        return [t for t in T if not t.get('private') and not t.get('owner')]
    return T
LAST = T[2]  # the last thing she put down (wallet, today 6:10 PM)

VIEWS = {
  'own':   dict(theme='linen', scale=1,    who='Margaret', role='mine', label='Her own · Normal · Linen'),
  'help':  dict(theme='linen', scale=1,    who='Robert',   role='help', label='Robert in Margaret’s · Can help'),
  'see':   dict(theme='linen', scale=1,    who='Peter',    role='see',  label='Peter in Margaret’s · Can see (+ status line, Phase 4)'),
  'large': dict(theme='linen', scale=1.38, who='Margaret', role='mine', label='Her own · Largest'),
  'dusk':  dict(theme='dusk',  scale=1,    who='Margaret', role='mine', label='Her own · Dusk'),
  'later': dict(theme='linen', scale=1,    who='Margaret', role='mine', label='Later: appointment + routine due'),
  'mine_alt': dict(theme='linen', scale=1, who='Margaret', role='mine', label='Her own, titled My ReCall'),
}
ROLE = {'help': ('Can help', I['help']), 'see': ('Can see', I['see'])}

BASE_CSS = '''
body { margin:0; }
img { display:block; }
.ic svg, .i svg { width:1.2em; height:1.2em; vertical-align:-0.22em; }
:root { --help:#A4532F; --help-ink:#fff; --help-soft:#F5E4DA; --see:#3B5E8C; --see-ink:#fff; --see-soft:#E1E9F4;
        --her:#2F6B5E; --her-soft:#E4EEEA; --rob:#A4532F; --rob-soft:#F5E4DA;
        --serif: Charter, "Bitstream Charter", "New York", ui-serif, Georgia, serif; }
:root[data-theme="dusk"] { --help:#E6A07F; --help-ink:#1F1D1A; --help-soft:#3D2B22; --see:#A3BFE6; --see-ink:#1F1D1A; --see-soft:#24303F;
        --her:#8CC4B2; --her-soft:#2F3F3A; --rob:#E6A07F; --rob-soft:#3D2B22; }
.nowrap { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
/* footer, as in the app, but static in a mock so the screenshot shows it where the phone does */
.footer .btn-primary svg { width:1.45em; height:1.45em; }
.tag-owner { display:block; font-size:min(0.8125rem,3.6vw); color:var(--ink-soft); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lockb { position:absolute; top:6px; right:6px; width:26px; height:26px; border-radius:50%; background:rgba(0,0,0,0.5); color:#fff; display:flex; align-items:center; justify-content:center; }
.lockb svg { width:15px; height:15px; }
.sheet-back.static { position:fixed; }
'''

def page(body, v, css='', cls=''):
    vv = VIEWS[v] if isinstance(v, str) else v
    return f'''<!DOCTYPE html><html data-theme="{vv['theme']}" style="--scale:{vv['scale']}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="../out/styles.css">
<style>{BASE_CSS}{css}</style></head><body class="{cls}"><div id="root">{body}</div></body></html>'''

def img(k, cls=''):
    return f'<img class="{cls}" src="img/{k}.jpg" alt="">'

def footer(role, whose='Margaret'):
    log = f'<button class="btn-primary{" whose" if role=="help" else ""}">{I["camera"]}<span class="lbl">Log item</span>' + \
          (f'<small class="whose-sub">in {whose}’s ReCall</small>' if role == 'help' else '') + '</button>'
    find = f'<button class="btn-primary alt">{I["search"]}<span class="lbl">Find item</span></button>'
    return f'<div class="footer"><div class="footer-inner">{"" if role=="see" else log}{find}</div></div>'

DAY = 'Wednesday evening'
DATE = 'September 23'

# ======================================================================================
# The carry-through screens (thing card, photo card, camera, switcher) take a per-concept
# "chrome": what the concept puts on every screen to say whose ReCall and what I can do.
# ======================================================================================
def thing_card(chrome_top='', chrome_css='', v='help', bodycls=''):
    t = T[0]
    body = f'''<div class="screen with-footer">{chrome_top}
<div class="thing-head"><div class="row1"><button class="chev">{I["back"]}</button><div class="name">{t["name"]}</div></div>
<div class="row2">{I["pin"]}<b>{t["place"]}</b> <span>· {t["ctx"]}</span></div></div>
<div class="card thing"><div class="strip one"><div class="strip-page"><div class="photo-box">{img("glasses","photo-full")}
<span class="stamp">{t["when"]} · Robert</span></div></div></div>
<div class="dotsrow"><div class="dots"><span class="dot on"></span><span class="dot"></span></div><span class="cnt">1 of 2</span></div>
<div class="switches"><div class="sw-row"><span class="lab">{I["clock"]} Show times on photos</span><button class="sw on"></button></div>
<div class="sw-row"><span class="lab amber">{I["pin"]} Show earlier places <small>2</small></span><button class="sw"></button></div></div></div>
<div class="footer actfoot"><div class="actbar two"><button class="act">{I["camera"]}<span>Add photo</span></button><button class="act">{I["pencil"]}<span>Edit</span></button></div></div></div>'''
    return page(body, v, chrome_css, bodycls)

PENCIL = I['pencil'].replace('<svg', '<svg class="pencil"')
def photo_card(chrome_top='', chrome_css='', v='help', title='Log item', bodycls=''):
    places = ['Kitchen counter', 'Hall table', 'Desk', 'Bedside table']
    chips = ''.join(f'<button class="guess">{p}</button>' for p in places)
    body = f'''<div class="screen">{chrome_top}
<div class="header"><button class="back">‹ Back</button><div class="title">{title}</div></div>
<div class="card photo-card">{img("keys","photo-full")}
<div class="field-value big"><span class="field-text">Car keys</span>{PENCIL}</div>
<div class="ask-place"><div class="ask-q">Where is it?</div><div class="guesses">{chips}<button class="guess other">Somewhere else…</button></div></div></div></div>'''
    return page(body, v, chrome_css, bodycls)

def camera(top_title, overlay='', chrome_css='', v='help', bodycls=''):
    body = f'''<div class="camera"><div class="camera-top"><button class="camera-cancel">Cancel</button><div class="camera-title">{top_title}</div><div class="camera-count">1 of 4</div></div>
<div class="camera-view">{img("keys")}{overlay}</div>
<div class="camera-roll"><div class="roll-shot">{img("keys")}<button class="roll-x">×</button></div></div>
<div class="camera-bar"><span></span><button class="shutter"><span></span></button><button class="camera-done">Done</button></div></div>'''
    css = '.camera-view img { width:100%; height:100%; object-fit:cover; } .camera-roll .roll-shot img{ width:100%; height:100%; object-fit:cover; border-radius:0.75rem; }' + chrome_css
    return page(body, v, css, bodycls)

def switcher(home_html_body, sheet_html, css, v='help', bodycls=''):
    body = home_html_body + f'<div class="sheet-back static"><div class="sheet">{sheet_html}</div></div>'
    return page(body, v, css, bodycls)

def switch_rows(style='rows', mark=lambda who: ''):
    rows = [
      ('My ReCall', 'scissors', 'Robert · every thing is yours', 'mine', False),
      ('Margaret’s ReCall', 'glasses', 'Can help', 'help', True),
    ]
    out = '<div class="sheet-title">Which ReCall?</div><div class="sw-list">'
    for name, k, sub, role, on in rows:
        ic = ROLE[role][1] if role in ROLE else I['home']
        out += f'''<button class="sw-item{' on' if on else ''} r-{role}">{mark(role)}<img src="img/{k}.jpg"><span class="sw-t"><b>{name}</b><small><span class="i">{ic}</span> {sub}</small></span>{'<span class="tick">✓</span>' if on else ''}</button>'''
    return out + '</div><button class="btn-primary alt" style="margin-top:0.75rem">Cancel</button>'
SWITCH_CSS = '''
.sw-list { display:flex; flex-direction:column; gap:0.5rem; margin-top:0.75rem; }
.sw-item { display:flex; align-items:center; gap:0.75rem; width:100%; text-align:left; padding:0.5rem 0.75rem 0.5rem 0.5rem; background:var(--card); border:2px solid var(--line); border-radius:var(--radius); color:var(--ink); min-height:0; position:relative; }
.sw-item.on { border-color:var(--accent); }
.sw-item img { width:3.5rem; height:3.5rem; border-radius:0.625rem; object-fit:cover; flex:none; }
.sw-t { flex:1; min-width:0; } .sw-t b { display:block; font-size:1.1875rem; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sw-t small { display:flex; align-items:center; gap:0.35rem; color:var(--ink-soft); font-size:0.9375rem; font-weight:600; white-space:nowrap; }
.sw-t small .i svg { width:1.1em; height:1.1em; }
.tick { color:var(--accent); font-weight:800; font-size:1.25rem; }
'''

# ======================================================================================
# A — THE ALBUM. Her name as a masthead; photos edge to edge, three across; one quiet caption.
#     Identity: masthead words + a ROLE BAND in the role's colour (colour = what I can do).
# ======================================================================================
A_CSS = '''
.a-mast { display:flex; align-items:flex-start; justify-content:space-between; gap:0.5rem; padding:0.25rem 0 0.75rem; }
.a-name { font-size:min(2.125rem,8.6vw); font-weight:800; letter-spacing:-0.02em; line-height:1.05; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:0.25rem; }
.a-name svg { width:0.7em; height:0.7em; color:var(--ink-soft); flex:none; }
.a-day { color:var(--ink-soft); font-size:min(1.0625rem,4.4vw); font-weight:600; margin-top:0.3rem; white-space:nowrap; }
.a-mast .menu-btn { justify-content:flex-end; margin:0; }
.a-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; margin:0 -1rem; }
.a-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
.a-cell { position:relative; background:var(--card); }
.a-cell img { width:100%; aspect-ratio:1/1; object-fit:cover; }
.a-cap { padding:0.3rem 0.5rem 0.55rem; font-size:min(0.9375rem,4vw); font-weight:600; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.a-cap.noplace { background:var(--amber); color:var(--card); }
.a-cap small { display:block; font-size:min(0.8125rem,3.6vw); color:var(--ink-soft); font-weight:600; }
.a-cap.noplace small { color:inherit; }
.roleband { display:flex; align-items:center; gap:0.5rem; margin:0 -1rem 0.75rem; padding:0.625rem 1rem; font-size:min(1.125rem,4.8vw); font-weight:700; white-space:nowrap; }
.roleband svg { width:1.35em; height:1.35em; flex:none; }
.roleband .rb-sub { font-weight:600; opacity:0.9; overflow:hidden; text-overflow:ellipsis; }
.roleband.help { background:var(--help); color:var(--help-ink); } .roleband.see { background:var(--see); color:var(--see-ink); }
.roleband .rb-sw { margin-left:auto; text-decoration:underline; font-weight:700; }
.a-later { display:flex; flex-direction:column; gap:0.375rem; margin:0 0 0.75rem; }
.a-later div { display:flex; align-items:center; gap:0.5rem; font-size:min(1.0625rem,4.4vw); font-weight:600; white-space:nowrap; }
.a-later svg { width:1.3em; height:1.3em; flex:none; color:var(--accent); }
.a-later .due { background:var(--amber-bg); color:var(--amber); padding:0.5rem 0.75rem; border-radius:0.75rem; }
.a-later .due svg { color:var(--amber); }
.a-status { color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:600; margin:-0.375rem 0 0.625rem; }
/* carry-through: a thin role band at the top of every screen */
.a-strip { display:flex; align-items:center; gap:0.4rem; margin:calc(-0.75rem - env(safe-area-inset-top)) -1rem 0.5rem; padding:0.4rem 1rem; font-size:0.9375rem; font-weight:700; white-space:nowrap; }
.a-strip svg { width:1.2em; height:1.2em; }
.a-strip.help { background:var(--help); color:var(--help-ink); }
.a-covers { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.625rem; margin-top:0.75rem; }
.a-cover { text-align:left; padding:0; background:none; min-height:0; color:var(--ink); }
.a-cover img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:0.875rem; border:3px solid transparent; }
.a-cover.on img { border-color:var(--help); }
.a-cover b { display:block; font-size:1.0625rem; margin-top:0.375rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.a-cover small { display:inline-flex; align-items:center; gap:0.3rem; font-size:0.875rem; font-weight:700; padding:0.15rem 0.5rem; border-radius:999px; margin-top:0.2rem; }
.a-cover small svg { width:1.1em; height:1.1em; }
.a-cover small.help { background:var(--help); color:var(--help-ink); } .a-cover small.mine { background:var(--accent-soft); color:var(--accent); }
'''
def A_home(v):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    title = 'My ReCall' if v == 'mine_alt' else ('Margaret’s ReCall' if guest else 'Margaret')
    sw = I['down'] if guest else ''
    mast = f'<div class="a-mast"><div style="min-width:0"><div class="a-name">{title}{sw}</div>' + \
           ('' if guest else f'<div class="a-day">{DAY} · {DATE}</div>') + f'</div><button class="menu-btn">{I["menu"]}</button></div>'
    band = ''
    if guest:
        w, ic = ROLE[role]
        sub = 'what you add goes to her' if role == 'help' else 'you can look, not change'
        band = f'<div class="roleband {role}">{ic}<span>{w}</span><span class="rb-sub">· {sub}</span></div>'
    status = f'<div class="a-status">3 things logged today · last at 6:10 PM</div>' if role == 'see' else ''
    later = ''
    if v == 'later':
        later = f'<div class="a-later"><div>{I["cal"]} Dr Patel · 2:30 PM</div><div class="due">{I["door"]} Front door · photo before bed</div></div>'
    cells = ''
    for t in things(role):
        lock = f'<span class="lockb">{I["lock"]}</span>' if t.get('private') else ''
        sub = f'<small>{t["owner"]}</small>' if t.get('owner') else ('<small>No place</small>' if not t['place'] else '')
        cells += f'<div class="a-cell">{img(t["k"])}{lock}<div class="a-cap{" noplace" if not t["place"] else ""}">{t["name"]}{sub}</div></div>'
    grid = f'<div class="a-grid{" two" if vv["scale"] > 1.2 else ""}">{cells}</div>'
    return page(f'<div class="screen with-footer">{mast}{band}{status}{later}{grid}{footer(role)}</div>', v, A_CSS)

def A_carry():
    strip = f'<div class="a-strip help">{I["help"]} Margaret’s ReCall · Can help</div>'
    home = A_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    covers = f'''<div class="sheet-title">Which ReCall?</div><div class="a-covers">
<button class="a-cover"><img src="img/scissors.jpg"><b>My ReCall</b><small class="mine">{I["home"]} Yours</small></button>
<button class="a-cover on"><img src="img/glasses.jpg"><b>Margaret’s ReCall</b><small class="help">{I["help"]} Can help</small></button></div>
<button class="btn-primary alt" style="margin-top:0.875rem">Cancel</button>'''
    return dict(
      card=thing_card(strip, A_CSS),
      photo=photo_card(strip, A_CSS, title='Log item'),
      camera=camera('Log item', f'<div class="cam-chip help">{I["help"]} Into Margaret’s ReCall</div>',
                    A_CSS + CAMCHIP_CSS),
      switch=switcher(home, covers, A_CSS),
    )
CAMCHIP_CSS = '''
.cam-chip { position:absolute; top:0.75rem; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:0.4rem; padding:0.45rem 0.9rem; border-radius:999px; font-size:1rem; font-weight:700; white-space:nowrap; box-shadow:0 2px 10px rgba(0,0,0,0.3); }
.cam-chip svg { width:1.25em; height:1.25em; }
.cam-chip.help { background:var(--help); color:var(--help-ink); }
.cam-chip.her { background:var(--her); color:#fff; }
.cam-chip.plain { background:rgba(0,0,0,0.55); color:#fff; -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); }
'''

# ======================================================================================
# B — THE INDEX. One row per thing: photo, name, and where it is — the answer without a tap.
#     Identity: a SPINE down the left edge in the OWNER's colour (colour = whose), and the
#     role as words in a chip beside the title.
# ======================================================================================
B_CSS = '''
body.spine-her::before, body.spine-rob::before { content:""; position:fixed; left:0; top:0; bottom:0; width:7px; z-index:40; }
body.spine-her::before { background:var(--her); } body.spine-rob::before { background:var(--rob); }
.b-head { display:flex; align-items:center; gap:0.5rem; padding:0.125rem 0 0.625rem; border-bottom:1px solid var(--line); margin-bottom:0.25rem; }
.b-head .menu-btn { margin:0; }
.b-title { flex:1; min-width:0; }
.b-name { display:flex; align-items:center; gap:0.3rem; font-size:min(1.5rem,6.2vw); font-weight:800; line-height:1.15; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--her); }
.b-name svg { width:0.8em; height:0.8em; flex:none; }
.b-sub { display:flex; align-items:center; gap:0.5rem; color:var(--ink-soft); font-size:min(1rem,4.2vw); font-weight:600; margin-top:0.125rem; white-space:nowrap; }
.b-chip { display:inline-flex; align-items:center; gap:0.3rem; border:1.5px solid currentColor; color:var(--ink); border-radius:999px; padding:0.1rem 0.55rem; font-weight:700; }
.b-chip svg { width:1.05em; height:1.05em; }
.b-row { display:flex; align-items:center; gap:0.875rem; padding:0.5rem 0; border-bottom:1px solid var(--line); }
.b-row img { width:72px; height:72px; border-radius:12px; object-fit:cover; flex:none; }
.b-ph { position:relative; flex:none; }
.b-ph .lockb { top:4px; right:4px; width:22px; height:22px; } .b-ph .lockb svg { width:13px; height:13px; }
.b-t { flex:1; min-width:0; }
.b-t b { display:block; font-size:min(1.1875rem,5vw); font-weight:700; line-height:1.2; }
.b-where { display:flex; align-items:flex-start; gap:0.3rem; margin-top:0.15rem; font-size:min(1rem,4.3vw); font-weight:600; color:var(--ink); line-height:1.25; }
.b-where svg { width:1.1em; height:1.1em; flex:none; color:var(--accent); margin-top:0.1em; }
.b-where.none { color:var(--amber); } .b-where.none svg { color:var(--amber); }
.b-when { color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:500; margin-top:0.1rem; white-space:nowrap; }
.b-row .chevr { color:var(--ink-soft); flex:none; } .b-row .chevr svg { width:1.25rem; height:1.25rem; }
.b-do { display:flex; align-items:center; gap:0.625rem; padding:0.75rem 0.75rem; margin:0.375rem 0; border-radius:0.875rem; font-size:min(1.0625rem,4.5vw); font-weight:700; white-space:nowrap; }
.b-do svg { width:1.3em; height:1.3em; flex:none; }
.b-do.appt { background:var(--accent-soft); color:var(--accent); } .b-do.due { background:var(--amber-bg); color:var(--amber); }
.b-status { color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:600; padding:0.375rem 0; }
.b-strip { display:flex; align-items:center; gap:0.4rem; font-size:0.9375rem; font-weight:700; color:var(--her); margin:0 0 0.375rem; white-space:nowrap; }
.b-strip svg { width:1.15em; height:1.15em; }
.b-strip .b-chip { font-size:0.875rem; color:var(--ink); }
.sw-item.r-help::before, .sw-item.r-mine::before { content:""; position:absolute; left:-2px; top:-2px; bottom:-2px; width:7px; border-radius:var(--radius) 0 0 var(--radius); }
.sw-item.r-help::before { background:var(--her); } .sw-item.r-mine::before { background:var(--rob); }
.sw-item { padding-left:1rem; }
'''
def B_home(v, spine='her'):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    title = 'My ReCall' if v == 'mine_alt' else ('Margaret’s ReCall' if guest else 'Margaret')
    if guest:
        w, ic = ROLE[role]
        sub = f'<span class="b-chip">{ic} {w}</span><span>{len(things(role))} things</span>'
    else:
        sub = f'<span>{DAY} · {DATE}</span>'
    head = f'<div class="b-head"><button class="menu-btn">{I["menu"]}</button><div class="b-title"><div class="b-name">{title}{I["down"] if guest else ""}</div><div class="b-sub">{sub}</div></div></div>'
    rows = ''
    if v == 'later':
        rows += f'<div class="b-do appt">{I["cal"]} Dr Patel · today 2:30 PM</div><div class="b-do due">{I["door"]} Front door · photo before bed</div>'
    if role == 'see':
        rows += '<div class="b-status">3 things logged today · last at 6:10 PM</div>'
    for t in things(role):
        lock = f'<span class="lockb">{I["lock"]}</span>' if t.get('private') else ''
        where = f'<div class="b-where">{I["pin"]}<span>{t["place"]}</span></div>' if t['place'] else f'<div class="b-where none">{I["pin"]}<span>No place assigned</span></div>'
        own = f' <span class="tag-owner" style="display:inline">· {t["owner"]}</span>' if t.get('owner') else ''
        rows += f'<div class="b-row"><div class="b-ph">{img(t["k"])}{lock}</div><div class="b-t"><b>{t["name"]}{own}</b>{where}<div class="b-when">{t["when"]}</div></div><span class="chevr">{I["chev"]}</span></div>'
    return page(f'<div class="screen with-footer">{head}{rows}{footer(role)}</div>', v, B_CSS, 'spine-her')

def B_carry():
    strip = f'<div class="b-strip">Margaret’s ReCall <span class="b-chip">{I["help"]} Can help</span></div>'
    home = B_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    return dict(
      card=thing_card(strip, B_CSS, bodycls='spine-her'),
      photo=photo_card(strip, B_CSS, bodycls='spine-her'),
      camera=camera('Log item', f'<div class="cam-chip her">Margaret’s ReCall · {I["help"]} Can help</div>', B_CSS + CAMCHIP_CSS + 'body.spine-her::before{z-index:60}', bodycls='spine-her'),
      switch=switcher(home, switch_rows(), B_CSS + SWITCH_CSS, bodycls='spine-her'),
    )

# ======================================================================================
# C — THE NOTE. A greeting and one band — the last thing she put down — then her things.
#     Identity: WORDS FIRST. The note names the ReCall and, for a guest, the role as a
#     sentence; colour is only a left rule on the note in the role's colour.
# ======================================================================================
C_CSS = '''
.c-top { display:flex; align-items:center; justify-content:space-between; min-height:2.75rem; }
.c-top .menu-btn { margin:0; }
.c-top .c-sw { font-size:min(1rem,4.2vw); font-weight:700; color:var(--accent); text-decoration:underline; background:none; padding:0.5rem 0; min-height:0; white-space:nowrap; display:inline-flex; align-items:center; gap:0.3rem; }
.c-top .c-sw svg { width:1.1em; height:1.1em; }
.c-note { background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow); padding:0.875rem 1rem 1rem; margin:0.25rem 0 0.875rem; border-left:6px solid var(--accent); }
.c-note.help { border-left-color:var(--help); } .c-note.see { border-left-color:var(--see); }
.c-hi { font-family:var(--serif); font-size:min(1.75rem,7.2vw); font-weight:700; line-height:1.15; }
.c-date { color:var(--ink-soft); font-size:min(1.0625rem,4.5vw); font-weight:600; margin-top:0.25rem; }
.c-last { display:flex; align-items:center; gap:0.75rem; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--line); }
.c-last img { width:64px; height:64px; border-radius:10px; object-fit:cover; flex:none; }
.c-last .eyebrow { margin:0; }
.c-last b { display:block; font-size:min(1.1875rem,5vw); line-height:1.2; }
.c-last span.w { display:block; color:var(--ink-soft); font-size:min(1rem,4.2vw); font-weight:600; }
.c-role { display:flex; align-items:center; gap:0.5rem; margin-top:0.625rem; font-size:min(1.0625rem,4.5vw); font-weight:700; }
.c-role svg { width:1.35em; height:1.35em; flex:none; }
.c-role.help { color:var(--help); } .c-role.see { color:var(--see); }
.c-role small { display:block; color:var(--ink-soft); font-weight:600; font-size:min(0.9375rem,4vw); }
.c-whose { font-size:min(1.375rem,5.8vw); font-weight:800; margin-top:0.375rem; }
.c-line { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; font-size:min(1.0625rem,4.5vw); font-weight:700; }
.c-line svg { width:1.3em; height:1.3em; flex:none; color:var(--accent); }
.c-line.due { color:var(--amber); } .c-line.due svg { color:var(--amber); }
.board .tile .tile-label { font-size:min(1rem,4.4vw); }
.c-strip { display:flex; align-items:center; gap:0.4rem; font-size:0.9375rem; font-weight:700; padding:0.375rem 0.625rem; border-left:5px solid var(--help); background:var(--card); border-radius:0.5rem; margin:0 0 0.5rem; white-space:nowrap; }
.c-strip svg { width:1.15em; height:1.15em; color:var(--help); }
'''
def C_tiles(role):
    out = ''
    for t in things(role):
        lock = f'<span class="tile-lock">{I["lock"]}</span>' if t.get('private') else ''
        sub = '<span class="tile-sub">No place assigned</span>' if not t['place'] else (f'<span class="tile-owner">{t["owner"]}</span>' if t.get('owner') else '')
        out += f'<button class="tile">{img(t["k"])}{lock}<div class="tile-label{" noplace" if not t["place"] else ""}">{t["name"]}{sub}</div></button>'
    return f'<div class="board">{out}</div>'
def C_home(v):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    top = f'<div class="c-top"><button class="menu-btn">{I["menu"]}</button>' + (f'<button class="c-sw">{I["swap"]} Switch</button>' if guest else '') + '</div>'
    if guest:
        w, ic = ROLE[role]
        sub = 'You can add photos and move things' if role == 'help' else 'You can look, not change anything'
        inner = f'<div class="c-hi">Good evening, {vv["who"]}.</div><div class="c-whose">You’re in Margaret’s ReCall</div>' + \
                f'<div class="c-role {role}">{ic}<span>{w}<small>{sub}</small></span></div>'
        if role == 'see':
            inner += f'<div class="c-line" style="color:var(--ink-soft)">{I["clock"]} 3 things logged today · last at 6:10 PM</div>'
        note = f'<div class="c-note {role}">{inner}</div>'
    else:
        hi = 'My ReCall' if v == 'mine_alt' else 'Good evening, Margaret.'
        inner = f'<div class="c-hi">{hi}</div><div class="c-date">Wednesday, September 23</div>'
        if v == 'later':
            inner += f'<div class="c-line">{I["cal"]} Dr Patel at 2:30 PM</div><div class="c-line due">{I["door"]} Front door · photo before bed</div>'
        inner += f'<div class="c-last">{img(LAST["k"])}<div><div class="eyebrow">Last put down</div><b>{LAST["name"]}</b><span class="w">{LAST["place"]} · {LAST["when"]}</span></div></div>'
        note = f'<div class="c-note">{inner}</div>'
    return page(f'<div class="screen with-footer">{top}{note}{C_tiles(role)}{footer(role)}</div>', v, C_CSS)

def C_carry():
    strip = f'<div class="c-strip">{I["help"]} In Margaret’s ReCall · Can help</div>'
    home = C_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    return dict(
      card=thing_card(strip, C_CSS),
      photo=photo_card(strip, C_CSS, title='Log item'),
      camera=camera('Log item', f'<div class="cam-chip plain">{I["help"]} In Margaret’s ReCall · Can help</div>', C_CSS + CAMCHIP_CSS),
      switch=switcher(home, switch_rows(), C_CSS + SWITCH_CSS),
    )

# ======================================================================================
# D — THE PRINTS. Her things as printed photographs on the linen, the place written under
#     each like the back of a print. Identity: the PAPER is the owner's — each ReCall has
#     its own paper tint (colour = whose), and the title is set like the title of an album.
# ======================================================================================
D_CSS = '''
body.paper-her { background: color-mix(in srgb, var(--her) 9%, var(--bg)); }
body.paper-rob { background: color-mix(in srgb, var(--rob) 10%, var(--bg)); }
body.paper-her .header, body.paper-her .dayrow { background:transparent; }
.d-mast { text-align:center; padding:0.25rem 0 0.875rem; position:relative; }
.d-mast .menu-btn { position:absolute; left:0; top:0; margin:0; }
.d-name { font-family:var(--serif); font-size:min(2rem,8.2vw); font-weight:700; line-height:1.1; padding:0 2.5rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.d-day { font-size:min(0.8125rem,3.6vw); letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-soft); font-weight:700; margin-top:0.375rem; white-space:nowrap; }
.d-role { display:inline-flex; align-items:center; gap:0.35rem; margin-top:0.5rem; padding:0.3rem 0.8rem; border-radius:999px; font-size:min(1rem,4.3vw); font-weight:700; white-space:nowrap; background:var(--card); border:1.5px solid var(--line); }
.d-role svg { width:1.2em; height:1.2em; }
.d-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.875rem; }
.d-print { background:#fffdf9; padding:7px 7px 0; border-radius:3px; box-shadow:0 1px 1px rgba(0,0,0,0.06), 0 6px 16px rgba(58,54,48,0.14); position:relative; color:#3A3630; }
:root[data-theme="dusk"] .d-print { background:#EFE9DE; box-shadow:0 6px 18px rgba(0,0,0,0.5); }
.d-print img { width:100%; aspect-ratio:1/1; object-fit:cover; }
.d-print .lockb { top:13px; right:13px; }
.d-cap { padding:0.5rem 0.25rem 0.625rem; }
.d-cap b { display:block; font-size:min(1rem,4.3vw); font-weight:700; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.d-cap span { display:flex; align-items:center; gap:0.25rem; font-size:min(0.875rem,3.8vw); color:#7A7369; font-weight:600; margin-top:0.125rem; white-space:nowrap; overflow:hidden; }
.d-cap span svg { width:1.05em; height:1.05em; flex:none; color:#2F6B5E; }
.d-cap span.none { color:#8A6528; } .d-cap span.none svg { color:#8A6528; }
.d-cap .tag-owner { color:#7A7369; }
.d-slip { background:#fffdf9; color:#3A3630; padding:0.625rem 0.875rem; margin:0 0.5rem 0.875rem; box-shadow:0 4px 12px rgba(58,54,48,0.12); border-top:5px solid var(--amber); }
.d-slip div { display:flex; align-items:center; gap:0.5rem; font-size:min(1.0625rem,4.5vw); font-weight:700; white-space:nowrap; }
.d-slip div + div { margin-top:0.25rem; } .d-slip svg { width:1.3em; height:1.3em; color:#8A6528; flex:none; }
.d-status { text-align:center; color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:600; margin:-0.375rem 0 0.75rem; }
.d-strip { text-align:center; font-family:var(--serif); font-size:1.0625rem; font-weight:700; margin:0 0 0.375rem; display:flex; align-items:center; justify-content:center; gap:0.5rem; white-space:nowrap; }
.d-strip .d-role { margin:0; font-family:-apple-system,system-ui,sans-serif; font-size:0.875rem; padding:0.15rem 0.6rem; }
.d-covers { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0.875rem; margin-top:0.875rem; }
.d-covers .d-print { padding-bottom:0; }
.d-covers .pp-her { outline:3px solid var(--her); outline-offset:3px; }
.footer { background:linear-gradient(to bottom, transparent 0, color-mix(in srgb, var(--her) 9%, var(--bg)) 0.75rem); }
'''
def D_home(v):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    title = 'My ReCall' if v == 'mine_alt' else ('Margaret’s ReCall' if guest else 'Margaret')
    mast = f'<div class="d-mast"><button class="menu-btn">{I["menu"]}</button><div class="d-name">{title}</div>'
    if guest:
        w, ic = ROLE[role]
        mast += f'<div class="d-role">{ic} {w} {I["down"]}</div>'
    else:
        mast += f'<div class="d-day">{DAY} · {DATE}</div>'
    mast += '</div>'
    status = '<div class="d-status">3 things logged today · last at 6:10 PM</div>' if role == 'see' else ''
    slip = f'<div class="d-slip"><div>{I["cal"]} Dr Patel at 2:30 PM</div><div>{I["door"]} Front door · photo before bed</div></div>' if v == 'later' else ''
    cells = ''
    for t in things(role):
        lock = f'<span class="lockb">{I["lock"]}</span>' if t.get('private') else ''
        where = f'<span>{I["pin"]}{t["place"]}</span>' if t['place'] else f'<span class="none">{I["pin"]}No place assigned</span>'
        own = f'<span class="tag-owner">{t["owner"]}</span>' if t.get('owner') else ''
        cells += f'<div class="d-print">{img(t["k"])}{lock}<div class="d-cap"><b>{t["name"]}</b>{where}{own}</div></div>'
    return page(f'<div class="screen with-footer">{mast}{status}{slip}<div class="d-grid">{cells}</div>{footer(role)}</div>', v, D_CSS, 'paper-her')

def D_carry():
    strip = f'<div class="d-strip">Margaret’s ReCall <span class="d-role">{I["help"]} Can help</span></div>'
    home = D_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    covers = f'''<div class="sheet-title">Which ReCall?</div><div class="d-covers">
<div class="d-print" style="background:color-mix(in srgb,#A4532F 14%,#fffdf9)"><img src="img/scissors.jpg"><div class="d-cap"><b>My ReCall</b><span>{I["home"]} Robert</span></div></div>
<div class="d-print pp-her" style="background:color-mix(in srgb,#2F6B5E 12%,#fffdf9)"><img src="img/glasses.jpg"><div class="d-cap"><b>Margaret’s ReCall</b><span>{I["help"]} Can help</span></div></div></div>
<button class="btn-primary alt" style="margin-top:0.875rem">Cancel</button>'''
    return dict(
      card=thing_card(strip, D_CSS, bodycls='paper-her'),
      photo=photo_card(strip, D_CSS, bodycls='paper-her'),
      camera=camera('Log item', f'<div class="cam-chip her">{I["help"]} Margaret’s ReCall</div>',
                    D_CSS + CAMCHIP_CSS + '.camera{background:#1d2a26} .camera-view{margin:0 10px; border-radius:6px; border:3px solid var(--her);}', bodycls='paper-her'),
      switch=switcher(home, covers, D_CSS, bodycls='paper-her'),
    )

# ======================================================================================
# E — THE TWO DOORS. The top half of the screen is a live camera window (the Log door: tap
#     it and the photo is taken); the bottom half is her things with Find (the Find door).
#     Identity: it lives in the doors — the camera window names whose ReCall the photo goes
#     into and in what role; a Can see guest has no camera door at all.
# ======================================================================================
E_CSS = '''
.e-top { display:flex; align-items:center; gap:0.5rem; min-height:2.75rem; margin-bottom:0.5rem; }
.e-top .menu-btn { margin:0; }
.e-name { flex:1; min-width:0; font-size:min(1.375rem,5.8vw); font-weight:800; line-height:1.15; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:0.3rem; }
.e-name svg { width:0.85em; height:0.85em; color:var(--ink-soft); flex:none; }
.e-name small { color:var(--ink-soft); font-weight:600; font-size:min(0.9375rem,4vw); margin-left:0.25rem; }
.e-door { position:relative; height:38vh; border-radius:1.375rem; overflow:hidden; background:#111; }
.e-door img { width:100%; height:100%; object-fit:cover; opacity:0.92; filter:saturate(0.9); }
.e-door .e-cta { position:absolute; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.875rem 1rem; background:linear-gradient(to top, rgba(0,0,0,0.7), transparent); color:#fff; }
.e-cta b { display:flex; align-items:center; gap:0.5rem; font-size:min(1.375rem,5.8vw); white-space:nowrap; }
.e-cta b svg { width:1.4em; height:1.4em; }
.e-shut { width:3.75rem; height:3.75rem; border-radius:50%; border:4px solid #fff; background:rgba(255,255,255,0.35); flex:none; }
.e-door .e-into { position:absolute; top:0.75rem; left:0.75rem; right:0.75rem; display:flex; }
.e-into span { display:inline-flex; align-items:center; gap:0.35rem; padding:0.35rem 0.75rem; border-radius:999px; font-size:0.9375rem; font-weight:700; white-space:nowrap; }
.e-into span svg { width:1.2em; height:1.2em; }
.e-into .mine { background:rgba(0,0,0,0.45); color:#fff; } .e-into .help { background:var(--help); color:var(--help-ink); }
.e-due { position:absolute; top:3.25rem; left:0.75rem; right:0.75rem; background:var(--amber-bg); color:var(--amber); border-radius:0.75rem; padding:0.5rem 0.75rem; font-weight:700; font-size:1rem; display:flex; gap:0.4rem; align-items:center; white-space:nowrap; }
.e-due svg { width:1.25em; height:1.25em; }
.e-find { display:flex; align-items:center; gap:0.5rem; margin:0.75rem 0 0.625rem; padding:0 0.875rem; min-height:3.5rem; border:2px solid var(--accent); border-radius:var(--radius); background:var(--card); color:var(--ink-soft); font-size:min(1.25rem,5.2vw); font-weight:600; white-space:nowrap; }
.e-find svg { width:1.35em; height:1.35em; color:var(--accent); flex:none; }
.e-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0.5rem; }
.e-grid.three { grid-template-columns:repeat(3,minmax(0,1fr)); }
.e-t { position:relative; }
.e-t img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:0.75rem; }
.e-t .lockb { top:4px; right:4px; width:22px; height:22px; } .e-t .lockb svg { width:13px; height:13px; }
.e-t div { font-size:min(0.8125rem,3.6vw); font-weight:600; line-height:1.15; margin-top:0.2rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.e-t div.none { color:var(--amber); font-weight:800; } .e-t div.none svg { width:1em; height:1em; vertical-align:-0.12em; margin-right:0.1em; }
.e-see { display:flex; align-items:center; gap:0.5rem; background:var(--see); color:var(--see-ink); border-radius:var(--radius); padding:0.875rem 1rem; font-size:min(1.125rem,4.8vw); font-weight:700; }
.e-see svg { width:1.4em; height:1.4em; flex:none; }
.e-see small { display:block; font-weight:600; opacity:0.9; font-size:min(0.9375rem,4vw); }
.e-appt { display:flex; align-items:center; gap:0.5rem; font-weight:700; font-size:min(1.0625rem,4.5vw); margin:0 0 0.5rem; white-space:nowrap; }
.e-appt svg { width:1.3em; height:1.3em; color:var(--accent); }
.e-strip { display:inline-flex; align-items:center; gap:0.35rem; background:var(--help); color:var(--help-ink); padding:0.3rem 0.75rem; border-radius:999px; font-size:0.9375rem; font-weight:700; margin:0 0 0.5rem; white-space:nowrap; }
.e-strip svg { width:1.15em; height:1.15em; }
'''
def E_home(v):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    title = 'My ReCall' if v == 'mine_alt' else ('Margaret’s ReCall' if guest else 'Margaret')
    small = '' if guest else f'<small>{DAY}</small>'
    top = f'<div class="e-top"><button class="menu-btn">{I["menu"]}</button><div class="e-name">{title}{I["down"] if guest else small}</div></div>'
    appt = f'<div class="e-appt">{I["cal"]} Dr Patel at 2:30 PM</div>' if v == 'later' else ''
    if role == 'see':
        door = f'<div class="e-see">{I["see"]}<span>Can see<small>You can look at Margaret’s things, not change them</small></span></div>' + \
               '<div style="color:var(--ink-soft);font-weight:600;font-size:0.9375rem;margin-top:0.5rem">3 things logged today · last at 6:10 PM</div>'
    else:
        into = f'<span class="help">{I["help"]} Into Margaret’s ReCall · Can help</span>' if role == 'help' else f'<span class="mine">{I["camera"]} Tap to take a photo</span>'
        due = f'<div class="e-due">{I["door"]} Front door · photo before bed</div>' if v == 'later' else ''
        door = f'<div class="e-door">{img("book")}<div class="e-into">{into}</div>{due}<div class="e-cta"><b>{I["camera"]} Log item</b><span class="e-shut"></span></div></div>'
    find = f'<div class="e-find">{I["search"]} Where is my…</div>'
    cells = ''
    for t in things(role):
        lock = f'<span class="lockb">{I["lock"]}</span>' if t.get('private') else ''
        cells += f'<div class="e-t">{img(t["k"])}{lock}<div class="{"none" if not t["place"] else ""}">{t["name"] if t["place"] else I["pin"] + t["name"]}</div></div>'
    grid = f'<div class="e-grid{" three" if vv["scale"] > 1.2 else ""}">{cells}</div>'
    return page(f'<div class="screen">{top}{appt}{door}{find}{grid}</div>', v, E_CSS)

def E_carry():
    strip = f'<div class="e-strip">{I["help"]} Margaret’s ReCall · Can help</div>'
    home = E_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    return dict(
      card=thing_card(strip, E_CSS),
      photo=photo_card(strip, E_CSS),
      camera=camera('Log item', f'<div class="cam-chip help">{I["help"]} Into Margaret’s ReCall</div>', E_CSS + CAMCHIP_CSS),
      switch=switcher(home, switch_rows(), E_CSS + SWITCH_CSS),
    )

# ======================================================================================
# F — ASK FIRST. Her name, then a big "Where is my…" field; her things smaller below; the
#     camera a round button. Identity: a STATUS BAND across the very top of every screen,
#     like the phone's own in-call bar, in the role's colour — present on every screen,
#     the camera included, whenever you are not in your own ReCall.
# ======================================================================================
F_CSS = '''
.f-band { display:flex; align-items:center; justify-content:center; gap:0.4rem; margin:calc(-0.75rem - env(safe-area-inset-top)) -1rem 0.625rem; padding:0.5rem 1rem; font-size:min(1rem,4.3vw); font-weight:700; white-space:nowrap; }
.f-band svg { width:1.2em; height:1.2em; flex:none; }
.f-band.help { background:var(--help); color:var(--help-ink); } .f-band.see { background:var(--see); color:var(--see-ink); }
.f-top { display:flex; align-items:center; gap:0.5rem; min-height:2.75rem; }
.f-top .menu-btn { margin:0; }
.f-name { flex:1; min-width:0; font-size:min(1.625rem,6.8vw); font-weight:800; line-height:1.15; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.f-day { color:var(--ink-soft); font-size:min(1rem,4.2vw); font-weight:600; margin:0.125rem 0 0 0; white-space:nowrap; }
.f-ask { display:flex; align-items:center; gap:0.625rem; margin:0.875rem 0 0.375rem; padding:0 0.5rem 0 1rem; min-height:4.25rem; border-radius:1.375rem; background:var(--card); box-shadow:0 3px 14px rgba(58,54,48,0.12); border:2px solid var(--accent); }
.f-ask > svg { width:1.6rem; height:1.6rem; color:var(--accent); flex:none; }
.f-ask span { flex:1; color:var(--ink-soft); font-size:min(1.375rem,5.8vw); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.f-ask .f-mic { width:3.25rem; height:3.25rem; border-radius:50%; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; flex:none; }
.f-ask .f-mic svg { width:1.5rem; height:1.5rem; }
.f-hint { color:var(--ink-soft); font-size:min(0.9375rem,4vw); font-weight:600; margin:0 0 0.875rem 0.25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.f-hint.due { color:var(--amber); display:flex; align-items:center; gap:0.35rem; } .f-hint svg { width:1.2em; height:1.2em; }
.f-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.625rem; }
.f-grid.two { grid-template-columns:repeat(2,minmax(0,1fr)); }
.f-t { position:relative; background:var(--card); border-radius:0.875rem; overflow:hidden; box-shadow:var(--shadow); }
.f-t img { width:100%; aspect-ratio:1/1; object-fit:cover; }
.f-t div { padding:0.3rem 0.45rem 0.4rem; font-size:min(0.875rem,3.8vw); font-weight:600; line-height:1.15; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.f-t div.none { background:var(--amber); color:var(--card); } .f-t div.none svg { width:1em; height:1em; vertical-align:-0.12em; margin-right:0.15em; }
.f-fab { position:fixed; right:1rem; bottom:calc(1.25rem + env(safe-area-inset-bottom)); display:flex; align-items:center; gap:0.5rem; height:4rem; padding:0 1.375rem 0 1.125rem; border-radius:2rem; background:var(--accent); color:var(--accent-ink); font-size:min(1.25rem,5.2vw); font-weight:700; box-shadow:0 6px 18px rgba(0,0,0,0.25); white-space:nowrap; z-index:6; }
.f-fab svg { width:1.5em; height:1.5em; }
.f-fab.help { background:var(--help); color:var(--help-ink); }
.f-cam-band { position:absolute; top:0; left:0; right:0; z-index:3; }
'''
def F_home(v):
    vv = VIEWS[v]; role = vv['role']; guest = role in ROLE
    band = ''
    if guest:
        w, ic = ROLE[role]
        band = f'<div class="f-band {role}">{ic} Margaret’s ReCall · {w} {I["down"]}</div>'
    title = 'My ReCall' if v == 'mine_alt' else ('Margaret’s things' if guest else 'Margaret')
    top = f'<div class="f-top"><button class="menu-btn">{I["menu"]}</button><div style="flex:1;min-width:0"><div class="f-name">{title}</div>' + \
          ('' if guest else f'<div class="f-day">{DAY} · {DATE}</div>') + '</div></div>'
    ask = f'<div class="f-ask">{I["search"]}<span>Where is my…</span><span class="f-mic">{I["mic"]}</span></div>'
    if role == 'see':
        hint = '<div class="f-hint">3 things logged today · last at 6:10 PM</div>'
    elif v == 'later':
        hint = f'<div class="f-hint" style="color:var(--ink);display:flex;align-items:center;gap:0.35rem">{I["cal"]} Dr Patel at 2:30 PM</div><div class="f-hint due">{I["door"]} Front door · photo before bed</div>'
    else:
        hint = f'<div class="f-hint">Or tap one of your {len(things(role))} things</div>' if not guest else f'<div class="f-hint">{len(things(role))} things</div>'
    cells = ''
    for t in things(role):
        lock = f'<span class="lockb">{I["lock"]}</span>' if t.get('private') else ''
        nm = t['name'] if t['place'] else I['pin'] + t['name']
        cells += f'<div class="f-t">{img(t["k"])}{lock}<div class="{"none" if not t["place"] else ""}">{nm}</div></div>'
    grid = f'<div class="f-grid{" two" if vv["scale"] > 1.2 else ""}">{cells}</div>'
    fab = '' if role == 'see' else f'<button class="f-fab{" help" if role=="help" else ""}">{I["camera"]} Log item</button>'
    return page(f'<div class="screen">{band}{top}{ask}{hint}{grid}{fab}</div>', v, F_CSS)

def F_carry():
    band = f'<div class="f-band help">{I["help"]} Margaret’s ReCall · Can help</div>'
    home = F_home('help').split('<div id="root">')[1].rsplit('</div></body>', 1)[0]
    camband = f'<div class="f-band help f-cam-band" style="margin:0">{I["help"]} Margaret’s ReCall · Can help</div>'
    cam = camera('Log item', '', F_CSS + '.camera-top{margin-top:2.25rem}')
    cam = cam.replace('<div class="camera">', '<div class="camera">' + camband)
    return dict(
      card=thing_card(band, F_CSS),
      photo=photo_card(band, F_CSS),
      camera=cam,
      switch=switcher(home, switch_rows(), F_CSS + SWITCH_CSS),
    )

CONCEPTS = [('A', 'album', A_home, A_carry), ('B', 'index', B_home, B_carry), ('C', 'note', C_home, C_carry),
            ('D', 'prints', D_home, D_carry), ('E', 'doors', E_home, E_carry), ('F', 'ask', F_home, F_carry)]

if __name__ == '__main__':
    n = 0
    for L, slug, home, carry in CONCEPTS:
        for v in ['own', 'help', 'see', 'large', 'dusk', 'later', 'mine_alt']:
            open(os.path.join(OUT, f'h1_{L}_{v}.html'), 'w').write(home(v)); n += 1
        for k, html in carry().items():
            open(os.path.join(OUT, f'h1_{L}_c{k}.html'), 'w').write(html); n += 1
    print('wrote', n)
