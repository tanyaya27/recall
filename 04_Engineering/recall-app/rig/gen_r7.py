#!/usr/bin/env python3
"""Round-7 mockups (2026-09-15), rendered from the real stylesheet (../out/styles.css).
Photos are flat colour blocks like the rig's; the layout, type and colours are the app's."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

I = dict(
  lock='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  unlock='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
  clock='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  pinq='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><path d="M10.2 8.6a1.9 1.9 0 0 1 3.6.6c0 1.2-1.8 1.4-1.8 2.6"/><path d="M12 14.2h.01"/></svg>',
  camera='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/></svg>',
  pencil='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  chev='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  search='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  home='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  menu='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
)

HEAD = '''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="../out/styles.css">
<style>
body { margin:0; }
.label { position:sticky; top:0; background:#333; color:#fff; font:600 12px/1.3 sans-serif; padding:4px 8px; z-index:99; }
.ph { display:flex; align-items:center; justify-content:center; color:#fff; font:700 1.5rem sans-serif; }
.ph.sm { font-size:0.8rem; }
.photo-wrap { position:relative; }
.strip-page .ph { width:100%; aspect-ratio:4/3; border-radius:0.75rem; }
.svg svg, .i svg, .btn-secondary svg, .field-value svg, .link-btn svg { width:1.25em; height:1.25em; vertical-align:-0.25em; }
/* --- when-line options --- */
.meta { display:flex; flex-direction:column; gap:0.25rem; margin-top:0.625rem; }
.meta-row { display:flex; align-items:center; gap:0.625rem; font-size:1.0625rem; color:var(--ink-soft); }
.meta-row svg { width:1.35rem; height:1.35rem; flex:none; color:var(--accent); }
.meta-row.loc { font-size:1.625rem; font-weight:700; color:var(--ink); line-height:1.2; }
.meta-row.loc svg { width:1.5rem; height:1.5rem; }
.when-ic { display:inline-flex; align-items:center; gap:0.4rem; }
.when-ic svg { width:1.2rem; height:1.2rem; }
.when-pill { display:inline-flex; align-items:center; gap:0.4rem; background:var(--accent-soft); color:var(--accent); font-weight:600; font-size:1rem; padding:0.3rem 0.75rem; border-radius:999px; margin-top:0.5rem; }
.when-pill svg { width:1.1rem; height:1.1rem; }
.age { position:absolute; top:0.5rem; left:0.5rem; background:rgba(0,0,0,0.55); color:#fff; font-size:0.8125rem; font-weight:600; padding:0.2rem 0.55rem; border-radius:999px; z-index:2; }
/* --- private options --- */
.priv-band { display:flex; align-items:center; gap:0.5rem; background:var(--accent-soft); color:var(--accent); font-weight:700; font-size:1rem; padding:0.625rem 0.875rem; border-radius:0.75rem; margin:0 0 0.625rem; border-left:5px solid var(--accent); }
.priv-band svg { width:1.35rem; height:1.35rem; }
.priv-badge { position:absolute; top:0.5rem; right:0.5rem; width:2.75rem; height:2.75rem; border-radius:50%; background:rgba(0,0,0,0.55); color:#fff; display:flex; align-items:center; justify-content:center; z-index:2; }
.priv-badge svg { width:1.5rem; height:1.5rem; }
.priv-row { display:flex; align-items:center; gap:0.5rem; color:var(--accent); font-weight:700; font-size:1.0625rem; margin-top:0.375rem; }
.priv-row svg { width:1.35rem; height:1.35rem; }
.priv-title { display:inline-flex; align-items:center; gap:0.35rem; margin-left:0.5rem; font-size:0.9em; color:var(--accent); }
.priv-title svg { width:1em; height:1em; }
.toastx { position:static; margin:0.5rem 0; display:flex; align-items:center; gap:0.625rem; background:#2a2a28; color:#fff; padding:0.875rem 1rem; border-radius:0.875rem; font-size:1.0625rem; font-weight:600; }
.toastx svg { width:1.35rem; height:1.35rem; flex:none; }
.toastx.old { background:#3a3a38; color:#ddd; }
/* --- tile overlays --- */
.tile-badge { position:absolute; top:0.5rem; right:0.5rem; width:2.5rem; height:2.5rem; border-radius:50%; background:rgba(0,0,0,0.55); color:#fff; display:flex; align-items:center; justify-content:center; }
.tile-badge svg { width:1.4rem; height:1.4rem; }
.tile-badge.amber { background:var(--amber); }
.tile .ph { width:100%; aspect-ratio:1/1; }
.tile-strip { position:absolute; left:0; right:0; bottom:0; background:rgba(138,101,40,0.92); color:#fff; font-size:0.875rem; font-weight:700; padding:0.3rem 0.5rem; display:flex; gap:0.35rem; align-items:center; }
.tile-strip svg { width:1.1rem; height:1.1rem; }
/* --- locations --- */
.loc-row { display:flex; align-items:center; gap:0.75rem; width:100%; text-align:left; background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow); padding:0.625rem; margin-bottom:0.625rem; color:var(--ink); }
.loc-row .ph { width:4.25rem; height:4.25rem; border-radius:0.625rem; flex:none; font-size:0.75rem; }
.loc-row .ph.none { background:var(--accent-soft); color:var(--accent); }
.loc-row .ph.none svg { width:1.75rem; height:1.75rem; }
.loc-row .nm { flex:1; min-width:0; }
.loc-row .nm b { display:block; font-size:1.1875rem; font-weight:700; line-height:1.2; }
.loc-row .nm small { display:block; color:var(--ink-soft); font-size:0.9375rem; margin-top:0.125rem; }
.loc-row .chev { color:var(--ink-soft); }
.loc-row .chev svg { width:1.5rem; height:1.5rem; }
.thumbs { display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-top:0.625rem; }
.thumbs .ph { aspect-ratio:1/1; border-radius:0.625rem; font-size:0.8rem; }
.thumbs .ph.add { background:var(--card); border:2px dashed var(--accent); color:var(--accent); flex-direction:column; gap:0.25rem; font-size:0.8125rem; }
.thumbs .ph.add svg { width:1.6rem; height:1.6rem; }
.items-here { display:flex; gap:0.5rem; overflow:hidden; margin-top:0.5rem; }
.items-here .ph { width:3.25rem; height:3.25rem; border-radius:0.5rem; font-size:0.6rem; flex:none; }
/* --- where is it? modes --- */
.guess.withpic { display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0.75rem 0.5rem 0.5rem; }
.guess.withpic .ph { width:3.5rem; height:3.5rem; border-radius:0.5rem; flex:none; font-size:0.65rem; }
.guess.withpic .ph.none { background:rgba(0,0,0,0.08); color:var(--accent); }
.guess.withpic .ph.none svg { width:1.5rem; height:1.5rem; }
.pgrid { display:grid; grid-template-columns:1fr 1fr; gap:0.625rem; }
.pgrid button { padding:0; overflow:hidden; border-radius:var(--radius); background:var(--card); box-shadow:var(--shadow); text-align:left; color:var(--ink); min-height:0; }
.pgrid .ph { width:100%; aspect-ratio:4/3; font-size:0.85rem; }
.pgrid .cap { padding:0.5rem 0.625rem; font-size:1.0625rem; font-weight:700; line-height:1.2; }
.pgrid .cap small { display:block; color:var(--ink-soft); font-weight:500; font-size:0.875rem; }
.mode-link { display:block; text-align:center; margin:0.5rem auto 0; }
/* --- reverse find --- */
.home-card { display:flex; gap:0.75rem; align-items:center; background:var(--accent-soft); border-radius:var(--radius); padding:0.625rem; margin-top:0.75rem; }
.home-card .ph { width:5rem; height:5rem; border-radius:0.625rem; flex:none; font-size:0.7rem; }
.home-card .t { flex:1; min-width:0; }
.home-card .t small { display:flex; align-items:center; gap:0.35rem; color:var(--accent); font-weight:700; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.05em; }
.home-card .t small svg { width:1rem; height:1rem; }
.home-card .t b { display:block; font-size:1.375rem; line-height:1.2; margin-top:0.125rem; }
.home-card .t span { display:block; color:var(--ink-soft); font-size:0.9375rem; margin-top:0.125rem; }
.footer3 .footer-inner { grid-template-columns:1fr 1fr 1fr; }
.footer3 .btn-primary { font-size:1.0625rem; padding-left:0.25rem; padding-right:0.25rem; }
</style></head><body><div id="root">'''
TAIL = '</div></body></html>'

def header(title, priv_in_title=False):
    t = title + (f'<span class="priv-title">{I["lock"]} Private</span>' if priv_in_title else '')
    return f'<div class="header"><button class="back">‹ Back</button><div class="title">{t}</div></div>'

def photo(color, label, age=None, badge=None, whole=False):
    a = f'<span class="age">{age}</span>' if age else ''
    b = f'<span class="priv-badge">{I["lock"]}</span>' if badge else ''
    return f'<div class="strip-page" style="flex:0 0 86%;position:relative">{a}{b}<div class="ph" style="background:{color}">{label}</div><button class="photo-trash">{I["trash"]}</button></div>'

def strip(age=None, badge=None):
    return f'<div class="photo-wrap"><div class="strip">{photo("#5b7f9a","glasses",age and "today" ,badge)}{photo("#4a6d86","glasses wide",age and "Saturday",badge)}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'

def actbar(private=False):
    vis = (I['lock'] + '<span>Private</span>') if private else (I['unlock'] + '<span>Shared</span>')
    return f'<div class="actbar"><button class="act primary">{I["camera"]}<span>Add photo</span></button><button class="act">{I["pencil"]}<span>Edit</span></button><button class="act{" on" if private else ""}">{vis}</button><button class="act amber">{I["trash"]}<span>Remove</span></button></div>'

def screen(label, title, body, footer='', priv_title=False, cls=''):
    return HEAD + f'<div class="label">{label}</div><div class="screen with-footer {cls}">{header(title, priv_title)}{body}</div>{footer}' + TAIL

def write(name, html):
    open(os.path.join(HERE, name), 'w').write(html)

# ---------------------------------------------------------------- 1. when line + private (three options)
# 1A — today's card, for reference (what he sees)
write('r7_when_0_today.html', screen('0 · TODAY (as built): place / resting-on / when stacked, lock+Private on the when line', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div class="when">this evening, 5:52<span class="private-line">{I["lock"]} Private</span></div>{actbar(True)}</div>'))

# 1B — Option A: clock on the when line + private band above the photo
write('r7_when_A.html', screen('A · CLOCK on the when line · PRIVATE BAND above the photo (icon + words, not colour)', 'Reading glasses',
  f'<div class="card thing"><div class="priv-band">{I["lock"]} Private — only this phone shows it</div>{strip()}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div class="when when-ic">{I["clock"]} this evening, 5:52</div>{actbar(True)}</div>'))

# 1C — Option B: icon column (pin / clock / lock) so each line reads at a glance
write('r7_when_B.html', screen('B · ICON COLUMN: pin = place, clock = when, lock = private — same left edge', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="meta"><div class="meta-row loc">{I["pin"]}<span>Kitchen counter</span></div><div class="meta-row" style="padding-left:2.1rem">on a wooden table</div><div class="meta-row">{I["clock"]}<span>this evening, 5:52</span></div><div class="meta-row" style="color:var(--accent);font-weight:700">{I["lock"]}<span>Private — only this phone</span></div></div>{actbar(True)}</div>'))

# 1D — Option C: when as a pill; lock badge ON the photo (same language as the grid tile) + words under
write('r7_when_C.html', screen('C · WHEN as a soft pill · LOCK BADGE on the photo (same as the grid) + words under it', 'Reading glasses',
  f'<div class="card thing">{strip(badge=True)}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div><span class="when-pill">{I["clock"]} this evening, 5:52</span></div><div class="priv-row">{I["lock"]} Private — only this phone</div>{actbar(True)}</div>'))

# 1E — age pill: with vs without, side by side (two cards on one page)
write('r7_age.html', screen('AGE PILL on each photo — top: as built (pill + when line say the same thing) · bottom: pill removed, dots + when line carry it', 'Reading glasses',
  f'<div class="card thing">{strip(age=True)}<div class="loc-big">Kitchen counter</div><div class="when when-ic">{I["clock"]} today, 5:52</div></div>'
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="when when-ic">{I["clock"]} today, 5:52</div></div>'))

# 1F — toasts: today's two vs one consistent shape
write('r7_toast.html', screen('PRIVATE / SHARED TOAST — top pair: as built (two shapes) · bottom pair: one shape, icon + state + who sees it', 'Toasts',
  f'<div class="card"><div class="eyebrow">As built</div><div class="toastx old"><span>Private — only this phone shows it</span></div><div class="toastx old"><span>Shared with the household</span></div>'
  f'<div class="eyebrow" style="margin-top:1rem">Proposed</div><div class="toastx">{I["lock"]}<span>Now private · only this phone sees it</span></div><div class="toastx">{I["unlock"]}<span>Now shared · everyone at home sees it</span></div></div>'))

# ---------------------------------------------------------------- 2. tile: no place yet
def tile(name, color, sub='', badge='', strip_=''):
    return f'<div class="tile" style="position:relative"><div class="ph" style="background:{color}">{name}</div>{badge}{strip_}<div class="tile-label">{name.capitalize()}{sub}</div></div>'
write('r7_tile.html', HEAD + '<div class="label">NO PLACE YET on the grid — row 1: as built (amber words) · row 2: badge only, like the lock · row 3: badge + amber strip on the photo</div><div class="screen with-footer">'
  + '<div class="header"><button class="menu-btn">' + I['menu'] + '</button><div class="dayline"><div class="title">Tuesday morning</div><div class="sub">September 15</div></div></div>'
  + '<div class="board">' + tile('pills', '#5b7f9a', '<span class="tile-sub">No place yet</span>', f'<span class="tile-badge">{I["lock"]}</span>') + tile('keys', '#8a6d4a', '<span class="tile-sub">No place yet</span>')
  + tile('pills', '#5b7f9a', '', f'<span class="tile-badge">{I["lock"]}</span>') + tile('keys', '#8a6d4a', '', f'<span class="tile-badge amber">{I["pinq"]}</span>')
  + tile('pills', '#5b7f9a', '', f'<span class="tile-badge">{I["lock"]}</span>') + tile('keys', '#8a6d4a', '', f'<span class="tile-badge amber">{I["pinq"]}</span>', f'<span class="tile-strip">{I["pinq"]} Where is it?</span>')
  + '</div></div>' + TAIL)

# ---------------------------------------------------------------- 3. Locations
def locrow(name, n, colors, none=False):
    ph = f'<div class="ph none">{I["camera"]}</div>' if none else f'<div class="ph" style="background:{colors[0]}">{name.lower()}</div>'
    return f'<button class="loc-row">{ph}<div class="nm"><b>{name}</b><small>{n}</small></div><span class="chev">{I["chev"]}</span></button>'
write('r7_loc_list.html', screen('LOCATIONS — one list: every place used or saved, its photo, how many things are there. Tap a row to edit.', 'Locations',
  locrow('Kitchen counter', '4 things here', ['#5b7f9a']) + locrow('Bedside table', '2 things here', ['#8a6d4a']) + locrow('Hall table', '1 thing here', ['#4a8a6d'])
  + locrow('Sofa', 'not used yet · no photo', [], none=True) + locrow('Coat pocket', 'used once · no photo', [], none=True)
  + f'<button class="btn-secondary">{I["camera"]}&nbsp; Add a location</button>', cls='settings'))
write('r7_loc_one.html', screen('ONE LOCATION — its photos (these teach the AI the place), rename, the things there, remove', 'Kitchen counter',
  f'<div class="card"><div class="field-label">Photos of this place</div><div class="thumbs"><div class="ph" style="background:#5b7f9a">counter</div><div class="ph" style="background:#6b8faa">counter, wide</div><div class="ph add">{I["camera"]}Add photo</div></div>'
  f'<div class="field-label">Name</div><button class="field-value"><span class="field-text">Kitchen counter</span>{I["pencil"]}</button>'
  f'<div class="field-label">Things here now</div><div class="items-here"><div class="ph" style="background:#5b7f9a">glasses</div><div class="ph" style="background:#4a8a6d">soda</div><div class="ph" style="background:#7a8ea0">pills</div><div class="ph" style="background:#8a6d4a">keys</div></div>'
  f'<button class="btn-secondary amber" style="margin-top:1.25rem">{I["trash"]}&nbsp; Remove this location</button></div>'))

# ---------------------------------------------------------------- 4. Where is it? — three modes
def whereis(label, body, link):
    return screen(label, 'Log item', f'<div class="card photo-card"><div class="ph" style="background:#4a8a6d;aspect-ratio:4/3;border-radius:0.75rem">new soda</div><div class="eyebrow">New photo of</div><div class="field-value big"><span class="field-text">Sparkling soda</span></div><div class="ask-q">Where is it?</div>{body}<button class="link-btn mode-link">{link}</button></div>')
g = lambda t: f'<button class="guess">{t}</button>'
write('r7_where_A.html', whereis('WHERE IS IT? · mode 1 NAMES (as built) — link below switches mode', ''.join(map(g, ['Kitchen counter','Dining table','Hall table','Coat pocket'])) + '<button class="guess other">Somewhere else</button>', 'Show photos of the places'))
gp = lambda t, c, none=False: f'<button class="guess withpic">' + (f'<div class="ph none">{I["camera"]}</div>' if none else f'<div class="ph" style="background:{c}">{t.lower()}</div>') + f'<span>{t}</span></button>'
write('r7_where_B.html', whereis('WHERE IS IT? · mode 2 NAME + PHOTO — the place photo (or the last thing seen there) beside each name', gp('Kitchen counter','#5b7f9a') + gp('Dining table','#8a6d4a') + gp('Hall table','#4a8a6d') + gp('Coat pocket','',True) + '<button class="guess other">Somewhere else</button>', 'Bigger photos'))
pg = lambda t, c, s: f'<button><div class="ph" style="background:{c}">{t.lower()}</div><div class="cap">{t}<small>{s}</small></div></button>'
write('r7_where_C.html', whereis('WHERE IS IT? · mode 3 PHOTO LIST — big place photos, two across', '<div class="pgrid">' + pg('Kitchen counter','#5b7f9a','4 things') + pg('Dining table','#8a6d4a','2 things') + pg('Hall table','#4a8a6d','1 thing') + pg('Coat pocket','#9aa','no photo yet') + '</div><button class="guess other" style="margin-top:0.625rem">Somewhere else</button>', 'Names only'))

# ---------------------------------------------------------------- 5. Put it back — one picture of idea 2
write('r7_putback.html', screen('PUT IT BACK · idea 2 — Find by photo, and the card answers both questions: where it IS and where it LIVES', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="meta"><div class="meta-row loc">{I["pin"]}<span>Kitchen counter</span></div><div class="meta-row">{I["clock"]}<span>this evening, 5:52</span></div></div>'
  f'<div class="home-card"><div class="ph" style="background:#8a6d4a">bedside</div><div class="t"><small>{I["home"]} Lives on</small><b>Bedside table</b><span>seen there 9 of 12 times</span></div></div>{actbar()}</div>'))
write('r7_putback_3verb.html', screen('PUT IT BACK · idea 3 — a third verb on Home (board will fight this: two verbs was a ruling)', 'Home',
  '<div class="board">' + tile('pills', '#5b7f9a') + tile('keys', '#8a6d4a') + '</div>',
  footer=f'<div class="footer footer3"><div class="footer-inner"><button class="btn-primary">{I["camera"]} Log item</button><button class="btn-primary alt">{I["search"]} Find item</button><button class="btn-primary alt">{I["home"]} Put back</button></div></div>'))
print('ok')

# ================= round 7b — after Ravi's answers =================
X = '''<style>
.wl { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; margin-top:0.5rem; }
.wl .when-pill { margin:0; }
.wl .priv { display:inline-flex; align-items:center; gap:0.35rem; color:var(--accent); font-weight:700; font-size:1.0625rem; }
.wl .priv svg { width:1.25rem; height:1.25rem; }
.pills { display:flex; gap:0.5rem; margin-top:0.5rem; align-items:center; }
.pills .when-pill { margin:0; }
.lock-pill { display:inline-flex; align-items:center; gap:0.3rem; background:var(--accent); color:#fff; font-weight:700; font-size:1rem; padding:0.3rem 0.7rem; border-radius:999px; }
.lock-pill svg { width:1.1rem; height:1.1rem; }
.note { background:#fff8dc; border:1.5px solid #c9a43a; color:#3a2f00; font-size:0.9375rem; line-height:1.35; padding:0.5rem 0.75rem; border-radius:0.5rem; margin:0.5rem 0; }
.arrow { position:absolute; color:#c0392b; font:700 0.8rem sans-serif; background:#fff; padding:2px 5px; border:1.5px solid #c0392b; border-radius:4px; z-index:5; }
</style>'''
def screen2(label, title, body, cls=''):
    return HEAD + X + f'<div class="label">{label}</div><div class="screen with-footer {cls}">{header(title)}{body}</div>' + TAIL

write('r7b_when_1.html', screen2('OPTION 1 · today\'s layout, WHEN as a pill on the left, lock + Private on the same line, right', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} this evening, 5:52</span><span class="priv">{I["lock"]} Private</span></div>{actbar(True)}</div>'))
write('r7b_when_2.html', screen2('OPTION 2 · WHEN pill, then a lock pill right after it (redundant with the button below)', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div class="pills"><span class="when-pill">{I["clock"]} this evening, 5:52</span><span class="lock-pill">{I["lock"]} Private</span></div>{actbar(True)}</div>'))
write('r7b_when_shared.html', screen2('SHARED thing, option 1 · the line has only the when pill — no empty space reserved', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} this evening, 5:52</span></div>{actbar(False)}</div>'))

# age pill — explained
write('r7b_age.html', screen2('AGE PILL · the small dark label top-left of EACH photo ("today", "Saturday"). It says the same as the when line, which already changes as you swipe. Proposal: remove it.', 'Reading glasses',
  f'<div class="note">TOP: as built — the "today" label on the photo AND "this evening, 5:52" under it. BOTTOM: proposed — label gone; the dots show which photo, the when pill shows its time.</div>'
  f'<div class="card thing" style="position:relative"><span class="arrow" style="top:0.4rem;left:5.2rem">← this is the age pill</span>{strip(age=True)}<div class="loc-big">Kitchen counter</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52</span></div></div>'
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52</span></div></div>'))

# no place yet — explained
write('r7b_noplace.html', HEAD + X + '<div class="label">NO PLACE YET · a thing logged with "Not sure" has no place. LEFT tile: as built — amber words under the name. RIGHT tile: proposed — an amber pin badge on the photo, same corner and size as the lock badge on private things; the words go away. Tap the badge → the place field.</div><div class="screen with-footer">'
  + '<div class="header"><button class="menu-btn">' + I['menu'] + '</button><div class="dayline"><div class="title">Tuesday morning</div><div class="sub">September 15</div></div></div>'
  + '<div class="note">Why: the tile stays one line tall (no extra row of words), and the two badges become one rule — lock = private, pin = needs a place. Both are icons, not colours, so colour-blind safe.</div>'
  + '<div class="board">' + tile('keys', '#8a6d4a', '<span class="tile-sub">No place yet</span>') + tile('keys', '#8a6d4a', '', f'<span class="tile-badge amber">{I["pinq"]}</span>')
  + tile('pills', '#5b7f9a', '', f'<span class="tile-badge">{I["lock"]}</span>') + '<div class="note" style="margin:0">← for comparison: the lock badge a private thing already has</div>'
  + '</div></div>' + TAIL)

# where is it — three modes with two links
write('r7b_where_links.html', screen2('WHERE IS IT? · the link under the list cycles: Names only → Smaller photos → Bigger photos → Names only. Shown: smaller-photos mode with both links.', 'Log item',
  f'<div class="card photo-card"><div class="ph" style="background:#4a8a6d;aspect-ratio:4/3;border-radius:0.75rem">new soda</div><div class="ask-q">Where is it?</div>' + gp('Kitchen counter','#5b7f9a') + gp('Dining table','#8a6d4a') + gp('Hall table','#4a8a6d') + '<button class="guess other">Somewhere else</button>'
  + f'<div style="display:flex;justify-content:center;gap:1.5rem"><button class="link-btn">Names only</button><button class="link-btn">Bigger photos</button></div></div>'))

# lives-on — explained
write('r7b_liveson.html', screen2('LIVES ON · explained. Margaret finds the glasses by photo. The card says where they are NOW (Kitchen counter) and, in the green box, where they USUALLY are — worked out from the history, no typing. That green box is the "put it back" answer.', 'Reading glasses',
  f'<div class="card thing">{strip()}<div class="loc-big">Kitchen counter</div><div class="wl"><span class="when-pill">{I["clock"]} this evening, 5:52</span></div>'
  f'<div class="home-card" style="position:relative"><span class="arrow" style="top:-0.9rem;right:0.5rem">where it usually is → put it back here</span><div class="ph" style="background:#8a6d4a">bedside</div><div class="t"><small>{I["home"]} Usually on</small><b>Bedside table</b><span>9 of the last 12 times</span></div></div>'
  f'<div class="note">Only appears once a thing has been logged in more than one place; otherwise "now" and "usually" are the same and the box is not shown — no wasted space. Edit lets you pin it by hand if the history is wrong.</div>{actbar()}</div>'))
