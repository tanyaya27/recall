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

# ================= r8 sketch — one roll of sightings, captions, two links =================
X8 = '''<style>
.cap8 { display:flex; align-items:center; gap:0.35rem; font-size:0.9375rem; color:var(--ink-soft); font-weight:600; margin-top:0.375rem; }
.cap8 svg { width:1rem; height:1rem; }
.links8 { display:flex; flex-direction:column; gap:0.375rem; margin-top:0.75rem; }
.links8 .btn-secondary { margin-top:0; display:flex; justify-content:space-between; align-items:center; padding-left:1rem; padding-right:1rem; text-align:left; }
.links8 .btn-secondary small { font-weight:600; color:var(--ink-soft); font-size:0.9375rem; }
.filter8 { display:flex; justify-content:space-between; align-items:center; font-size:0.9375rem; color:var(--ink-soft); margin:0 0 0.5rem; }
.filter8 b { color:var(--ink); }
.prior8 { margin-top:0.5rem; }
.prior8 .place-row-when { font-size:0.9375rem; }
.footer8 { position:fixed; left:0; right:0; bottom:0; padding:0.75rem 1rem env(safe-area-inset-bottom); background:linear-gradient(to bottom, transparent 0, var(--bg) 0.75rem); }
</style>'''
def page8(color, label, cap=None):
    c = f'<div class="cap8">{I["pin"]} {cap}</div>' if cap else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color}">{label}</div><button class="photo-trash">{I["trash"]}</button></div>{c}</div>'
def bar8(): return f'<div class="footer8"><div class="actbar"><button class="act primary">{I["camera"]}<span>Add photo</span></button><button class="act">{I["pencil"]}<span>Edit</span></button><button class="act">{I["unlock"]}<span>Shared</span></button><button class="act amber">{I["trash"]}<span>Remove</span></button></div></div>'
def screen8(label, body):
    return HEAD + X8 + f'<div class="label">{label}</div><div class="screen with-footer">{header("Reading glasses")}{body}</div>{bar8()}' + TAIL
write('r8_sketch_a.html', screen8('SKETCH A · default = the current stay. Header is the current answer and does not move while swiping. No captions (all photos are here, now). Two links, with counts, only because there IS something behind them.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#4a6d86","glasses wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Older photos in this place</span><small>3</small></button><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>'))
write('r8_sketch_b.html', screen8('SKETCH B · after "Older photos in this place": the roll widens; a photo from another day carries its own caption; the filter line says what you see and how to get back.',
  f'<div class="card thing"><div class="filter8"><span>Showing <b>Kitchen counter · 5 photos</b></span><button class="link-btn" style="min-height:0;padding:0">Back to now</button></div><div class="photo-wrap"><div class="strip">{page8("#7a8ea0","glasses, Sept 5", "Kitchen counter · September 5")}{page8("#5b7f9a","glasses")}</div></div><div class="dots"><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>'))
write('r8_sketch_c.html', screen8('SKETCH C · after "Prior places": a list with counts and last dates; tap one → the roll filters to that place (its photos get captions with their day).',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#4a6d86","glasses wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span></div>'
  f'<div class="field-label">Prior places</div><div class="places prior8"><button class="place-row"><span class="place-row-loc">Sofa</span><span class="place-row-when">2 photos · Saturday</span></button><button class="place-row"><span class="place-row-loc">Bedside table</span><span class="place-row-when">1 photo · Sept 2</span></button></div></div>'))

# ================= r8 UX — the recommended card, every state =================
X9 = X8 + '''<style>
.sheet8 { position:fixed; left:0; right:0; bottom:0; background:var(--card); border-radius:1.25rem 1.25rem 0 0; padding:1rem 1rem calc(1rem + env(safe-area-inset-bottom)); box-shadow:0 -6px 24px rgba(0,0,0,0.25); z-index:20; }
.sheet8 .sheet-title { font-size:1.25rem; font-weight:700; margin-bottom:0.75rem; }
.sheet8 .sheet-row { display:block; width:100%; text-align:left; background:var(--accent-soft); color:var(--accent); font-weight:700; font-size:1.0625rem; padding:0.875rem 1rem; border-radius:0.875rem; margin-bottom:0.5rem; min-height:3.5rem; }
.sheet8 .sheet-row small { display:block; font-weight:600; color:var(--ink-soft); font-size:0.9375rem; margin-top:0.125rem; }
.sheet8 .sheet-row.ai { background:var(--card); border:1.5px dashed var(--accent); }
.dim { position:fixed; inset:0; background:rgba(0,0,0,0.35); z-index:19; }
.edit8 .field-label { margin-top:0.75rem; }
.edit8 .field-value { padding:0.5rem 0; }
.tidy-row { display:flex; align-items:center; justify-content:space-between; width:100%; text-align:left; padding:0.75rem 0; border-top:1px solid var(--line); margin-top:0.75rem; color:var(--accent); font-weight:700; font-size:1.0625rem; }
.tidy-row svg { width:1.25rem; height:1.25rem; }
</style>'''
def cardA(size_note=''):
    return (f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#4a6d86","glasses wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
      f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span><span class="priv">{I["lock"]} Private</span></div>'
      f'<div class="links8"><button class="btn-secondary"><span>Older photos in this place</span><small>3</small></button><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>')
def screen9(label, body, extra='', theme=None, scale=None):
    h = HEAD + X9 + X
    if theme or scale: h = h.replace('<html>', f'<html{(" data-theme=%s" % theme) if theme else ""} style="{("--scale:%s" % scale) if scale else ""}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{header("Reading glasses")}{body}</div>{bar8()}{extra}' + TAIL
# 1 default
write('r8_ux_1_default.html', screen9('1 · DEFAULT — the current stay (2 photos, both here). Header = current answer. Links only because there are 3 older photos here and 2 prior places.', cardA()))
# 2 a thing with nothing behind it — Margaret's common case: no links at all
write('r8_ux_2_simple.html', screen9('2 · NOTHING BEHIND IT — one stay, one place: no links, no captions. Identical to today.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#8a6d4a","keys")}</div></div>'
  f'<div class="loc-big">{I["pin"]}<span>Hall table</span></div><div class="wl"><span class="when-pill">{I["clock"]} yesterday, 1:21 AM</span></div></div>'))
# 3 older photos in this place
write('r8_ux_3_older.html', screen9('3 · "OLDER PHOTOS IN THIS PLACE" — roll widens to 5; a photo from another day carries its own caption; filter line says what you see. Header unchanged.',
  f'<div class="card thing"><div class="filter8"><span>Showing <b>Kitchen counter · 5 photos</b></span><button class="link-btn" style="min-height:0;padding:0">Back to now</button></div><div class="photo-wrap"><div class="strip">{page8("#7a8ea0","glasses, Sept 5","Kitchen counter · September 5")}{page8("#5b7f9a","glasses")}</div></div><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span><span class="priv">{I["lock"]} Private</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>'))
# 4 prior places list
write('r8_ux_4_prior.html', screen9('4 · "PRIOR PLACES" — a list under the header: place, photos, last seen there. Tap Sofa → 5.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#4a6d86","glasses wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span><span class="priv">{I["lock"]} Private</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Older photos in this place</span><small>3</small></button></div>'
  f'<div class="field-label">Prior places</div><div class="places prior8"><button class="place-row"><span class="place-row-loc">Sofa</span><span class="place-row-when">2 photos · Saturday</span></button><button class="place-row"><span class="place-row-loc">Bedside table</span><span class="place-row-when">1 photo · Sept 2</span></button></div></div>'))
# 5 filtered to a prior place
write('r8_ux_5_place.html', screen9('5 · AFTER TAPPING "SOFA" — the roll shows only the Sofa sightings, each captioned with its day; header still says where it is NOW.',
  f'<div class="card thing"><div class="filter8"><span>Showing <b>Sofa · 2 photos</b></span><button class="link-btn" style="min-height:0;padding:0">Back to now</button></div><div class="photo-wrap"><div class="strip">{page8("#6b8f6b","glasses on sofa","Sofa · Saturday")}{page8("#5f7f5f","sofa, wide","Sofa · Saturday")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span><span class="priv">{I["lock"]} Private</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Older photos in this place</span><small>3</small></button><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>'))
# 6 tidy up — Edit card row + sheet
write('r8_ux_6_tidy.html', screen9('6 · TIDY UP — a row in Edit (never on the default screen) → a sheet with two plain choices and counts; the AI suggestion is dashed and off until the visual check has a record.',
  cardA() + f'<div class="card thing edit8"><div class="field-label">What it is</div><button class="field-value"><span class="field-text">Reading glasses</span>{I["pencil"]}</button><div class="field-label">Where it is</div><button class="field-value"><span class="field-text">Kitchen counter</span>{I["pencil"]}</button><button class="tidy-row"><span>Tidy up this thing…</span>{I["chev"]}</button></div>',
  extra=f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Tidy up reading glasses</div><button class="sheet-row">Keep only the newest photo at each place<small>removes 4 photos</small></button><button class="sheet-row">Forget places not visited since August<small>removes 1 place · 1 photo</small></button><button class="sheet-row ai">These 3 photos look alike — keep the sharpest<small>the app’s suggestion · removes 2</small></button><button class="btn-primary alt" style="margin-top:0.25rem">Cancel</button></div>'))
# 7 Largest, 8 Dusk
write('r8_ux_7_largest.html', screen9('7 · LARGEST text size — links still one line, captions wrap, bar goes icons-only.', cardA(), scale='1.38'))
write('r8_ux_8_dusk.html', screen9('8 · DUSK — state 3 (older photos, captioned).',
  f'<div class="card thing"><div class="filter8"><span>Showing <b>Kitchen counter · 5 photos</b></span><button class="link-btn" style="min-height:0;padding:0">Back to now</button></div><div class="photo-wrap"><div class="strip">{page8("#7a8ea0","glasses, Sept 5","Kitchen counter · September 5")}{page8("#5b7f9a","glasses")}</div></div><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span></div>'
  f'<div class="loc-big">{I["pin"]}<span>Kitchen counter</span></div><div class="resting">on a wooden table</div><div class="wl"><span class="when-pill">{I["clock"]} today, 5:52 PM</span><span class="priv">{I["lock"]} Private</span></div>'
  f'<div class="links8"><button class="btn-secondary"><span>Prior places</span><small>2</small></button></div></div>', theme='dusk'))

# ================= r8 options X / Y after Ravi's pushback =================
def cardhdr(place, when, priv=True, soft=False):
    return (f'<div class="loc-big{" soft" if soft else ""}">{I["pin"]}<span>{place}</span></div>' + ('' if soft else '<div class="resting">on a wooden table</div>') +
      f'<div class="wl"><span class="when-pill">{I["clock"]} {when}</span>' + (f'<span class="priv">{I["lock"]} Private</span>' if priv else '') + '</div>')
# X — one roll, every photo of the thing, captions on the ones not here-and-now, no links, no list
write('r8_ux_X.html', screen9('X · ONE ROLL, NO LINKS — every photo of the glasses, newest first. A photo not from the current stay says where and when it was. Nothing else.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#6b8f6b","on sofa","Sofa · Saturday")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
  + cardhdr('Kitchen counter', 'today, 5:52 PM') + '</div>'))
write('r8_ux_X2.html', screen9('X · swiped to the 4th photo — the caption under it carries the place and day; the header still says where the glasses are NOW.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#7a8ea0","Sept 5","Kitchen counter · September 5")}{page8("#8a7a9a","bedside","Bedside table · Sept 2")}</div></div><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>'
  + cardhdr('Kitchen counter', 'today, 5:52 PM') + '</div>'))
# Y — roll = current stay; ONE list in the thing's own name; tap → that stay's photos, header turns soft "then"
write('r8_ux_Y.html', screen9('Y · ROLL = NOW, ONE LIST — "Where the glasses have been", one row per earlier stay (place · when · photos). No other links.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#5b7f9a","glasses")}{page8("#4a6d86","glasses wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  + cardhdr('Kitchen counter', 'today, 5:52 PM') +
  f'<div class="field-label">Where the glasses have been</div><div class="places prior8"><button class="place-row"><span class="place-row-loc">Sofa</span><span class="place-row-when">Saturday · 2 photos</span></button><button class="place-row"><span class="place-row-loc">Kitchen counter</span><span class="place-row-when">Sept 5 · 3 photos</span></button><button class="place-row"><span class="place-row-loc">Bedside table</span><span class="place-row-when">Sept 2 · 1 photo</span></button></div></div>'))
write('r8_ux_Y2.html', screen9('Y · after tapping "Sofa" — the roll is that stay\'s photos; the header goes soft and says THEN; one link back. Nothing above the roll moves.',
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{page8("#6b8f6b","glasses on sofa")}{page8("#5f7f5f","sofa, wide")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<div class="loc-big soft">{I["pin"]}<span>Sofa — then</span></div><div class="wl"><span class="when-pill">{I["clock"]} Saturday, 3:10 PM</span><button class="link-btn" style="min-height:0;padding:0">Back to now</button></div>'
  f'<div class="field-label">Where the glasses have been</div><div class="places prior8"><button class="place-row"><span class="place-row-loc">Sofa</span><span class="place-row-when">Saturday · 2 photos</span></button><button class="place-row"><span class="place-row-loc">Kitchen counter</span><span class="place-row-when">Sept 5 · 3 photos</span></button><button class="place-row"><span class="place-row-loc">Bedside table</span><span class="place-row-when">Sept 2 · 1 photo</span></button></div></div>'))

# ================= r8 Z — Ravi's own layout (09-16, third pass) =================
XZ = X9 + '''<style>
.hdr2 { display:flex; align-items:flex-start; gap:0.75rem; margin:0 0 0.75rem; }
.hdr2 .ttl { min-width:0; flex:1; }
.hdr2 .ttl .t1 { font-size:min(1.375rem,6vw); font-weight:600; line-height:1.2; }
.hdr2 .ttl .t2 { display:flex; align-items:flex-start; gap:0.5rem; margin-top:0.2rem; }
.hdr2 .ttl .t2 .pl { min-width:0; flex:1; font-size:1.0625rem; line-height:1.3; color:var(--ink); }
.hdr2 .ttl .t2 .pl b { font-weight:700; }
.hdr2 .ttl .t2 .pl span { color:var(--ink-soft); }
.hdr2 .ttl .t2 .pl svg { width:1.1rem; height:1.1rem; vertical-align:-0.15em; color:var(--accent); }
.hdr2 .ttl .t2 .pv { flex:none; display:inline-flex; align-items:center; gap:0.3rem; color:var(--accent); font-weight:700; font-size:1rem; padding-top:0.1rem; }
.hdr2 .ttl .t2 .pv svg { width:1.2rem; height:1.2rem; }
.under { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; min-width:0; white-space:nowrap; overflow:hidden; }
.under .when-pill { margin:0; flex:none; }
.under .prev { display:inline-flex; align-items:center; gap:0.3rem; color:var(--amber); font-weight:700; font-size:0.9375rem; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.under .prev svg { width:1rem; height:1rem; flex:none; }
.under .prev.pill { background:var(--amber-bg); padding:0.3rem 0.65rem; border-radius:999px; }
.toggle8 { margin-top:0.75rem; }
</style>'''
def pageZ(color, label, when, prev=None, prev_long=False):
    p = f'<span class="prev pill">{I["pin"]} {"previously at " if not prev_long else ""}{prev}</span>' if prev else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color}">{label}</div><button class="photo-trash">{I["trash"]}</button></div><div class="under"><span class="when-pill">{I["clock"]} {when}</span>{p}</div></div>'
def hdrZ(name, place, ctx, priv=True, label=True):
    pv = (f'<span class="pv">{I["lock"]}{" Private" if label else ""}</span>') if priv else ''
    return f'<div class="header hdr2"><button class="back">‹ Back</button><div class="ttl"><div class="t1">{name}</div><div class="t2"><div class="pl">{I["pin"]} <b>{place}</b>{(" <span>· " + ctx + "</span>") if ctx else ""}</div>{pv}</div></div></div>'
def screenZ(label, hdr, body, theme=None, scale=None):
    h = HEAD + XZ + X
    if theme or scale: h = h.replace('<html>', f'<html{(" data-theme=%s" % theme) if theme else ""} style="{("--scale:%s" % scale) if scale else ""}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{hdr}{body}</div>{bar8()}' + TAIL
write('r8_Z1.html', screenZ('Z1 · DEFAULT — title: name / place · context, Private right. Every photo has its time under it, left. Prior places hidden; one button to show them.',
  hdrZ('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ("#5b7f9a","glasses","today, 5:52 PM")}{pageZ("#4a6d86","wide","today, 5:51 PM")}</div></div><div class="dots"><span class="dot on"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Show where the glasses were before</button></div>'))
write('r8_Z2.html', screenZ('Z2 · PRIOR PLACES SHOWN, swiped to an older photo — "previously at Sofa" sits on the same line as the time, amber, in a pill. Title still says where it is NOW.',
  hdrZ('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ("#6b8f6b","on the sofa","Saturday, 3:10 PM","Sofa")}{pageZ("#8a7a9a","bedside","Sept 2, 9:41 AM","Bedside table")}</div></div><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Hide where the glasses were before</button></div>'))
write('r8_Z3.html', screenZ('Z3 · LONG PLACE NAME — the word "Private" drops, the lock stays (responsive). Under a photo, when the line cannot fit, "previously at" drops and the pin + place remain.',
  hdrZ('Reading glasses', 'Third drawer of the filing cabinet in the office', 'at the very back', label=False),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ("#6b8f6b","on the sofa","Saturday, 3:10 PM","Living room sofa, left cushion", prev_long=True)}{pageZ("#8a7a9a","bedside","Sept 2, 9:41 AM","Bedside table")}</div></div><div class="dots"><span class="dot"></span><span class="dot on"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Hide where the glasses were before</button></div>'))
write('r8_Z4.html', screenZ('Z4 · LARGEST text — title wraps to a third line if it must; under the photo the time keeps the clock time, the place pill truncates with …',
  hdrZ('Reading glasses', 'Kitchen counter', 'on a wooden table', label=False),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ("#6b8f6b","on the sofa","Saturday, 3:10 PM","Sofa")}{pageZ("#5b7f9a","glasses","today, 5:52 PM")}</div></div><div class="dots"><span class="dot"></span><span class="dot on"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Hide where the glasses were before</button></div>', scale='1.38'))
def pageZ2(color, label, when, prev=None):
    p = f'<span class="prev pill">{I["pin"]} {prev}</span>' if prev else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color}">{label}</div><button class="photo-trash">{I["trash"]}</button></div><div class="under"><span class="when-pill">{I["clock"]} {when}</span>{p}</div></div>'
write('r8_Z5.html', screenZ('Z5 · FITTING ON ONE LINE — shorter time on old photos ("Sat 3:10 PM"), the amber pill says just "was at Sofa" (amber = the past). Toggle label shortened.',
  hdrZ('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ2("#6b8f6b","on the sofa","Sat 3:10 PM","was at Sofa")}{pageZ2("#8a7a9a","bedside","Sep 2, 9:41 AM","was at Bedside table")}</div></div><div class="dots"><span class="dot"></span><span class="dot"></span><span class="dot on"></span><span class="dot"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Hide earlier places</button></div>'))
write('r8_Z6.html', screenZ('Z6 · SAME, long place — the amber pill truncates with … rather than wrapping; tap it to read the whole name (a toast).',
  hdrZ('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageZ2("#6b8f6b","on the sofa","Sat 3:10 PM","was at Living room sofa, left cushion")}{pageZ2("#8a7a9a","bedside","Sep 2, 9:41 AM","was at Bedside table")}</div></div><div class="dots"><span class="dot"></span><span class="dot on"></span><span class="dot"></span></div>'
  f'<button class="btn-secondary toggle8">Hide earlier places</button></div>'))

# ================= r8 W — header on one line, state chips, overlays, 3-button bar =================
XW = XZ + '''<style>
.hdr3 { margin:0 0 0.75rem; }
.hdr3 .row1 { display:flex; align-items:center; gap:0.75rem; min-height:3.25rem; }
.hdr3 .row1 .t1 { flex:1; min-width:0; font-size:min(1.375rem,6vw); font-weight:600; line-height:1.2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hdr3 .row1 .lk { flex:none; color:var(--accent); display:flex; }
.hdr3 .row1 .lk svg { width:1.35rem; height:1.35rem; }
.hdr3 .row2 { margin-top:0.25rem; font-size:1.0625rem; line-height:1.3; }
.hdr3 .row2 b { font-weight:700; }
.hdr3 .row2 span { color:var(--ink-soft); }
.hdr3 .row2 svg { width:1.1rem; height:1.1rem; vertical-align:-0.15em; color:var(--accent); }
.ov { position:absolute; top:0.5rem; display:inline-flex; align-items:center; gap:0.3rem; background:rgba(0,0,0,0.55); color:#fff; font-size:0.875rem; font-weight:600; padding:0.25rem 0.6rem; border-radius:999px; -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); max-width:60%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ov svg { width:0.95rem; height:0.95rem; flex:none; }
.ov.tl { left:0.5rem; }
.ov.tr { right:0.5rem; top:auto; bottom:0.625rem; background:rgba(138,101,40,0.9); }
.chips { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.625rem; }
.chip { display:inline-flex; align-items:center; gap:0.35rem; padding:0.45rem 0.8rem; border-radius:999px; font-size:0.9375rem; font-weight:700; background:var(--card); border:1.5px solid var(--line); color:var(--ink-soft); min-height:2.25rem; }
.chip.on { background:var(--accent-soft); border-color:var(--accent-soft); color:var(--accent); }
.chip svg { width:1.05rem; height:1.05rem; }
.cnt { color:var(--ink-soft); font-size:0.875rem; font-weight:600; margin-left:0.5rem; }
.dotsrow { display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-top:0.5rem; }
.dotsrow .dots { margin:0; }
.bar3 .actbar { grid-template-columns:repeat(3,1fr); }
.act .lbl3 { font-size:0.8125rem; }
</style>'''
def hdrW(name, place, ctx, priv=True):
    lk = f'<span class="lk">{I["lock"]}</span>' if priv else ''
    return f'<div class="hdr3"><div class="row1"><button class="back">‹ Back</button><div class="t1">{name}</div>{lk}</div><div class="row2">{I["pin"]} <b>{place}</b> <span>· {ctx}</span></div></div>'
def pageW(color, label, when=None, prev=None):
    t = f'<span class="ov tl">{I["clock"]} {when}</span>' if when else ''
    p = f'<span class="ov tr">{I["pin"]} {prev}</span>' if prev else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color}">{label}</div>{t}{p}<button class="photo-trash">{I["trash"]}</button></div></div>'
def bar3(): return f'<div class="footer8 bar3"><div class="actbar"><button class="act primary">{I["camera"]}<span>Add photo</span></button><button class="act">{I["pencil"]}<span>Edit</span></button><button class="act amber">{I["trash"]}<span>Remove</span></button></div></div>'
def screenW(label, hdr, body, scale=None, theme=None):
    h = HEAD + XW + X
    if theme or scale: h = h.replace('<html>', f'<html{(" data-theme=%s" % theme) if theme else ""} style="{("--scale:%s" % scale) if scale else ""}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{hdr}{body}</div>{bar3()}' + TAIL
def dotsW(n, on, count=True):
    d = ''.join(f'<span class="dot{" on" if i==on else ""}"></span>' for i in range(n))
    return f'<div class="dotsrow"><div class="dots">{d}</div>' + (f'<span class="cnt">{on+1} of {n}</span>' if count and n>1 else '') + '</div>'
chips_all = lambda priv, times, earlier, n: (f'<div class="chips"><button class="chip{" on" if priv else ""}">{I["lock"] if priv else I["unlock"]} {"Private" if priv else "Shared"}</button>'
  f'<button class="chip{" on" if times else ""}">{I["clock"]} Times</button><button class="chip{" on" if earlier else ""}">{I["pin"]} Earlier places · {n}</button></div>')
write('r8_W1.html', screenW('W1 · Back + name on one line, lock ICON only, right. Place · context on line 2, full width. Times as overlays top-left; "was at Sofa" bottom-right in amber (opposite corner from the trash; can never collide with the time). Chips = the three states, each a switch. Bar = three operations.',
  hdrW('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageW("#6b8f6b","on the sofa","Sat 3:10 PM","was at Sofa")}{pageW("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(5,2)}{chips_all(True,True,True,2)}</div>'))
write('r8_W2.html', screenW('W2 · Margaret\'s default: earlier places hidden, times shown, shared. Two photos → "1 of 2". Nothing else on the card.',
  hdrW('Reading glasses', 'Kitchen counter', 'on a wooden table', priv=False),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageW("#5b7f9a","glasses","today, 5:52 PM")}{pageW("#4a6d86","wide","today, 5:51 PM")}</div></div>{dotsW(2,0)}{chips_all(False,True,False,2)}</div>'))
write('r8_W3.html', screenW('W3 · Times hidden, one photo, never moved: no dots, no count; the Earlier chip is absent (nothing behind it). The quietest card.',
  hdrW('Keys', 'Hall table', 'by the door', priv=False),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageW("#8a6d4a","keys")}</div></div><div class="chips"><button class="chip">{I["unlock"]} Shared</button><button class="chip">{I["clock"]} Times</button></div></div>'))
write('r8_W4.html', screenW('W4 · ALTERNATIVE for Private: no chip — the lock in the title is the indicator, the switch lives in Edit (a setting, rarely changed). Chips are then only the two views.',
  hdrW('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageW("#6b8f6b","on the sofa","Sat 3:10 PM","was at Sofa")}{pageW("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(5,2)}<div class="chips"><button class="chip on">{I["clock"]} Times</button><button class="chip on">{I["pin"]} Earlier places · 2</button></div></div>'
  f'<div class="card thing edit8"><div class="field-label">What it is</div><button class="field-value"><span class="field-text">Reading glasses</span>{I["pencil"]}</button><div class="field-label">Where it is</div><button class="field-value"><span class="field-text">Kitchen counter</span>{I["pencil"]}</button><button class="tidy-row"><span>{I["lock"]} Private — only you see it</span><span style="color:var(--ink-soft);font-weight:600">Share…</span></button></div>'))
write('r8_W5.html', screenW('W5 · LARGEST — header still two lines (name truncates with …), overlays scale, chips wrap to two rows, bar has three buttons so words still fit.',
  hdrW('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageW("#6b8f6b","on the sofa","Sat 3:10 PM","was at Sofa")}{pageW("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(5,2)}{chips_all(True,True,True,2)}</div>', scale='1.38'))

# ================= r8 V — tight header, chevron back, plain line under photo, segmented toggles =================
XV = XW + '''<style>
.hdr4 { margin:0 0 0.625rem; }
.hdr4 .row1 { display:flex; align-items:center; gap:0.5rem; min-height:2.75rem; }
.hdr4 .bk { flex:none; width:2.75rem; height:2.75rem; min-height:0; padding:0; display:flex; align-items:center; justify-content:center; background:var(--card); border:1.5px solid var(--line); border-radius:0.75rem; color:var(--accent); margin-left:-0.25rem; }
.hdr4 .bk svg { width:1.5rem; height:1.5rem; }
.hdr4 .t1 { flex:1; min-width:0; font-size:min(1.375rem,6vw); font-weight:600; line-height:1.15; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hdr4 .lk { flex:none; color:var(--accent); display:flex; }
.hdr4 .lk svg { width:1.35rem; height:1.35rem; }
.hdr4 .row2 { margin:0 0 0 3rem; font-size:1.0625rem; line-height:1.25; }
.hdr4 .row2 b { font-weight:700; }
.hdr4 .row2 span { color:var(--ink-soft); }
.hdr4 .row2 svg { width:1.05rem; height:1.05rem; vertical-align:-0.15em; color:var(--accent); }
.hdr4.tight .row2 { margin-left:0; margin-top:0.125rem; }
.sub2 { display:flex; align-items:center; gap:0.35rem; margin-top:0.375rem; font-size:0.9375rem; color:var(--ink-soft); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sub2 svg { width:1rem; height:1rem; flex:none; }
.sub2 .was { color:var(--amber); }
.tog { display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin-top:0.625rem; border:1.5px solid var(--accent); border-radius:0.875rem; overflow:hidden; }
.tog button { min-height:2.75rem; padding:0.375rem 0.25rem; background:var(--card); color:var(--accent); font-weight:700; font-size:min(0.9375rem,3.9vw); display:flex; align-items:center; justify-content:center; gap:0.35rem; border-radius:0; border-right:1.5px solid var(--accent); white-space:nowrap; min-width:0; }
.tog button:last-child { border-right:none; }
.tog button.on { background:var(--accent); color:var(--accent-ink); }
.tog button svg { width:1.1rem; height:1.1rem; flex:none; }
.tog.icons button span { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
.tog.icons button svg { width:1.5rem; height:1.5rem; }
.dots { margin-top:0.375rem; }
</style>'''
CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
def hdrV(name, place, ctx, priv=True, tight=False):
    lk = f'<span class="lk">{I["lock"]}</span>' if priv else ''
    return f'<div class="hdr4{" tight" if tight else ""}"><div class="row1"><button class="bk" aria-label="Back">{CHEV_L}</button><div class="t1">{name}</div>{lk}</div><div class="row2">{I["pin"]} <b>{place}</b> <span>· {ctx}</span></div></div>'
def pageV(color, label, when=None, prev=None):
    line = ''
    if when: line = f'<div class="sub2">{I["clock"]} {when}' + (f'<span class="was">· was at {prev}</span>' if prev else '') + '</div>'
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color}">{label}</div><button class="photo-trash">{I["trash"]}</button></div>{line}</div>'
def togV(priv, times, earlier, n, icons=False):
    e = f'<button class="{"on" if earlier else ""}">{I["pin"]}<span>Earlier · {n}</span></button>' if n else ''
    return f'<div class="tog{" icons" if icons else ""}" style="grid-template-columns:repeat({3 if n else 2},1fr)"><button class="{"on" if priv else ""}">{I["lock"] if priv else I["unlock"]}<span>{"Private" if priv else "Shared"}</span></button><button class="{"on" if times else ""}">{I["clock"]}<span>Times</span></button>{e}</div>'
def screenV(label, hdr, body, scale=None):
    h = HEAD + XV + X
    if scale: h = h.replace('<html>', f'<html style="--scale:{scale}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{hdr}{body}</div>{bar3()}' + TAIL
write('r8_V1.html', screenV('V1 · Chevron-only Back (44 px). Name never wraps (…). Line 2 tight under line 1, starting under the name. Under each photo: ONE plain line, time · "was at Sofa" in amber. Toggles = one segmented control, never wraps.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table'),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageV("#6b8f6b","on the sofa","Sat 3:10 PM","Sofa")}{pageV("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(5,2)}{togV(True,True,True,2)}</div>'))
write('r8_V2.html', screenV('V2 · Line 2 flush left instead (under the chevron) — your call which of V1/V2. Margaret\'s default: shared, earlier hidden, times on.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageV("#5b7f9a","glasses","today, 5:52 PM")}{pageV("#4a6d86","wide","today, 5:51 PM")}</div></div>{dotsW(2,0)}{togV(False,True,False,2)}</div>'))
write('r8_V3.html', screenV('V3 · Times off, one photo, never moved: no line under the photo, no dots, two segments only.',
  hdrV('Keys', 'Hall table', 'by the door', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageV("#8a6d4a","keys")}</div></div>{togV(False,False,False,0)}</div>'))
write('r8_V4.html', screenV('V4 · Long name and long place: name truncates, line 2 wraps; a long prior place truncates on its one line.',
  hdrV('Grandmother\'s reading glasses with the tortoiseshell frames', 'Third drawer of the filing cabinet in the office', 'at the very back', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageV("#6b8f6b","on the sofa","Sat 3:10 PM","Living room sofa, left cushion")}{pageV("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(3,1)}{togV(True,True,True,2)}</div>'))
write('r8_V5.html', screenV('V5 · LARGEST — segments go icons-only when the words cannot fit (measured, like the bar); nothing wraps.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageV("#6b8f6b","on the sofa","Sat 3:10 PM","Sofa")}{pageV("#5b7f9a","glasses","today, 5:52 PM")}</div></div>{dotsW(5,2)}{togV(True,True,True,2,icons=True)}</div>', scale='1.38'))

# ================= r8 U — toggle list, smaller back, fixed-size time overlay, amber "was at" line =================
I['hist'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>'
I['pinback'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2.5 2"><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.5" stroke-dasharray="0"/></svg>'
XU = XV + '''<style>
.hdr4 .bk { width:2.25rem; height:2.25rem; border-radius:0.625rem; }
.hdr4 .bk svg { width:1.25rem; height:1.25rem; }
.hdr4 .row1 { min-height:2.5rem; }
.strip-page { min-width:0; overflow:hidden; }  /* a nowrap line under the photo must never widen the page (flex min-width:auto trap) */
.ts { position:absolute; right:0.5rem; bottom:0.5rem; max-width:calc(100% - 1rem); overflow:hidden; text-overflow:ellipsis; background:rgba(0,0,0,0.6); color:#fff; font:600 13px/1 -apple-system, system-ui, sans-serif; padding:5px 8px; border-radius:6px; white-space:nowrap; letter-spacing:0.01em; }
.was { display:flex; align-items:center; gap:0.4rem; margin-top:0.375rem; color:var(--amber); font-weight:700; font-size:0.9375rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.was svg { width:1.1rem; height:1.1rem; flex:none; }
.tl { margin-top:0.625rem; border-top:1px solid var(--line); }
.tl .r { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; min-height:3rem; padding:0.375rem 0; border-bottom:1px solid var(--line); font-size:1.0625rem; font-weight:600; color:var(--ink); }
.tl .r .lab { display:flex; align-items:center; gap:0.5rem; min-width:0; }
.tl .r .lab svg { width:1.2rem; height:1.2rem; flex:none; color:var(--accent); }
.tl .r .lab.amber svg { color:var(--amber); }
.tl .r .lab small { color:var(--ink-soft); font-weight:500; font-size:0.9375rem; }
.sw { flex:none; width:3.25rem; height:2rem; border-radius:999px; background:var(--line); position:relative; border:none; padding:0; min-height:0; }
.sw::after { content:""; position:absolute; top:0.2rem; left:0.2rem; width:1.6rem; height:1.6rem; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.3); transition:left 120ms; }
.sw.on { background:var(--accent); }
.sw.on::after { left:1.45rem; }
</style>'''
def pageU(color, label, when=None, prev=None):
    t = f'<span class="ts">{when}</span>' if when else ''
    w = f'<div class="was">{I["pinback"]} was at {prev}</div>' if prev else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color};position:relative">{label}{t}</div><button class="photo-trash">{I["trash"]}</button></div>{w}</div>'
def tlU(priv, times, earlier, n):
    rows = [(f'{I["lock"] if priv else I["unlock"]}', 'Keep this private' if priv else 'Keep this private', '' , priv, ''),
            (I['clock'], 'Show times on photos', '', times, ''),]
    html = '<div class="tl">'
    html += f'<div class="r"><span class="lab">{I["lock"]} Keep this private</span><button class="sw{" on" if priv else ""}"></button></div>'
    html += f'<div class="r"><span class="lab">{I["clock"]} Show times on photos</span><button class="sw{" on" if times else ""}"></button></div>'
    if n: html += f'<div class="r"><span class="lab amber">{I["pinback"]} Show earlier places <small>{n}</small></span><button class="sw{" on" if earlier else ""}"></button></div>'
    return html + '</div>'
def screenU(label, hdr, body, scale=None):
    h = HEAD + XU + X
    if scale: h = h.replace('<html>', f'<html style="--scale:{scale}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{hdr}{body}</div>{bar3()}' + TAIL
write('r8_U1.html', screenU('U1 · Toggle LIST (label left, switch right, action wording). Back a bit smaller. Time on the photo, bottom-right, fixed 13 px. Earlier place under the photo, amber, dashed pin — same icon on its toggle row.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageU("#6b8f6b","on the sofa","Sat 3:10 PM","Sofa")}{pageU("#5b7f9a","glasses","Today 5:52 PM")}</div></div>{dotsW(5,2)}{tlU(True,True,True,2)}</div>'))
write('r8_U2.html', screenU('U2 · Margaret\'s default: shared, earlier hidden. A photo of the current stay has no line under it.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageU("#5b7f9a","glasses","Today 5:52 PM")}{pageU("#4a6d86","wide","Today 5:51 PM")}</div></div>{dotsW(2,0)}{tlU(False,True,False,2)}</div>'))
write('r8_U3.html', screenU('U3 · One photo, never moved, times off: no overlay, no dots, two rows.',
  hdrV('Keys', 'Hall table', 'by the door', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageU("#8a6d4a","keys")}</div></div>{tlU(False,False,False,0)}</div>'))
write('r8_U4.html', screenU('U4 · LARGEST, very old date "Sep 5, 2024, 9:41 AM": the overlay stays 13 px (it does not scale with the text setting) — one line, no wrap. Everything else scales.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageU("#7a8ea0","old photo","Sep 5, 2024, 9:41 AM","Living room sofa, left cushion")}{pageU("#5b7f9a","glasses","Today 5:52 PM")}</div></div>{dotsW(5,2)}{tlU(True,True,True,2)}</div>', scale='1.38'))
write('r8_U5.html', screenU('U5 · NORMAL, same very old date, Dusk-free check of the overlay on a light photo.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageU("#d8d2c4","light photo","Sep 5, 2024, 9:41 AM","Sofa")}{pageU("#5b7f9a","glasses","Today 5:52 PM")}</div></div>{dotsW(3,1)}{tlU(True,True,True,2)}</div>'))

# ================= r8 T — aligned pins, fixed-size trash, timestamp bottom-left, place only =================
XT = XU + '''<style>
.hdr4 .row2 { margin-left:0; padding-left:0.875rem; }   /* the card's inner padding: the title pin and the photo/prior-place line share one left edge */
.hdr4 .row2 svg { margin-left:0; }
.ts { left:0.5rem; right:auto; bottom:0.5rem; max-width:calc(100% - 1rem); }
.ts.short { }
.photo-trash { left:auto; right:0.5rem; top:0.5rem; bottom:auto; width:36px; height:36px; }   /* fixed px: overlays never scale with the text setting */
.photo-trash svg { width:18px; height:18px; }
.was { margin-top:0.375rem; }
.was svg { width:1.1rem; height:1.1rem; }
</style>'''
def pageT(color, label, when=None, prev=None):
    t = f'<span class="ts">{when}</span>' if when else ''
    w = f'<div class="was">{I["pinback"]} {prev}</div>' if prev else ''
    return f'<div class="strip-page" style="flex:0 0 86%"><div style="position:relative"><div class="ph" style="background:{color};position:relative">{label}{t}</div><button class="photo-trash">{I["trash"]}</button></div>{w}</div>'
def screenT(label, hdr, body, scale=None):
    h = HEAD + XT + X
    if scale: h = h.replace('<html>', f'<html style="--scale:{scale}">')
    return h + f'<div class="label">{label}</div><div class="screen with-footer">{hdr}{body}</div>{bar3()}' + TAIL
write('r8_T1.html', screenT('T1 · Trash top-right, 36 px fixed. Time bottom-LEFT, 13 px fixed. Prior place under it, place name only, dashed amber pin on the SAME left edge as the title pin.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageT("#6b8f6b","on the sofa","Sat 3:10 PM","Sofa")}{pageT("#5b7f9a","glasses","Today 5:52 PM")}</div></div>{dotsW(5,2)}{tlU(True,True,True,2)}</div>'))
write('r8_T2.html', screenT('T2 · LARGEST — trash and time stay the same size as at Normal; a long place name truncates on its line.',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageT("#7a8ea0","old photo","Sep 5, 2024, 9:41 AM","Living room sofa, left cushion")}{pageT("#5b7f9a","glasses","Today 5:52 PM")}</div></div>{dotsW(5,2)}{tlU(True,True,True,2)}</div>', scale='1.38'))
write('r8_T3.html', screenT('T3 · Time formats, longest to shortest, all one line at 13 px: same year → "Sep 5, 9:41 AM"; older → "Sep 5, 2024"; today → "Today 5:52 PM"; this week → "Sat 3:10 PM".',
  hdrV('Reading glasses', 'Kitchen counter', 'on a wooden table', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageT("#7a8ea0","2024","Sep 5, 2024","Bedside table")}{pageT("#8a7a9a","this year","Sep 5, 9:41 AM","Sofa")}</div></div>{dotsW(4,0)}{tlU(False,True,True,2)}</div>'))
write('r8_T4.html', screenT('T4 · Margaret\'s default — current stay only, times on: nothing under the photo.',
  hdrV('Keys', 'Hall table', 'by the door', priv=False, tight=True),
  f'<div class="card thing"><div class="photo-wrap"><div class="strip">{pageT("#8a6d4a","keys","Today 1:21 PM")}</div></div>{tlU(False,True,False,0)}</div>'))

# ================= MU1 — multi-user phase 1 mockups (2026-09-19) =================
I['people'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M17.5 13.5a6 6 0 0 1 4 6"/></svg>'
I['apple'] = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.5-.2-2.9.9-3.6.9-.8 0-1.9-.9-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.2 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.6-1-2.6-4zM14.1 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z"/></svg>'
I['google'] = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M12 12h9"/></svg>'
XM = X9 + X + '''<style>
.hdr4 { margin:0 0 0.625rem; } .hdr4 .row1 { display:flex; align-items:center; gap:0.5rem; min-height:2.5rem; }
.hdr4 .bk { flex:none; width:36px; height:36px; min-height:0; padding:0; display:flex; align-items:center; justify-content:center; background:var(--card); border:1.5px solid var(--line); border-radius:0.625rem; color:var(--accent); }
.hdr4 .bk svg { width:20px; height:20px; } .hdr4 .t1 { flex:1; min-width:0; font-size:min(1.375rem,6vw); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.drawer-mock { position:fixed; inset:0; background:rgba(0,0,0,0.35); }
.drawer-mock .drawer { position:absolute; left:0; top:0; bottom:0; }
.prow { display:flex; align-items:center; gap:0.75rem; width:100%; text-align:left; background:var(--card); border-radius:var(--radius); box-shadow:var(--shadow); padding:0.75rem 0.875rem; margin-bottom:0.625rem; color:var(--ink); min-height:3.75rem; }
.prow .nm { flex:1; min-width:0; } .prow .nm b { display:block; font-size:1.125rem; font-weight:700; } .prow .nm small { display:block; color:var(--ink-soft); font-size:0.9375rem; margin-top:0.125rem; }
.prow .chev { color:var(--ink-soft); display:flex; } .prow .chev svg { width:1.5rem; height:1.5rem; }
.prow.pending .nm b { color:var(--ink-soft); font-weight:600; }
.consent { color:var(--ink-soft); font-size:0.9375rem; line-height:1.35; margin:0.5rem 0.25rem 0; }
.rolepick { display:flex; flex-direction:column; gap:0.5rem; margin:0.75rem 0; }
.rolepick button { display:block; width:100%; text-align:left; padding:0.75rem 0.875rem; background:var(--card); border:2px solid var(--line); border-radius:var(--radius); color:var(--ink); min-height:0; }
.rolepick button.on { border-color:var(--accent); background:var(--accent-soft); }
.rolepick b { display:block; font-size:1.125rem; font-weight:700; } .rolepick span { display:block; color:var(--ink-soft); font-size:0.9375rem; margin-top:0.125rem; line-height:1.3; }
.msg { background:#e7f5e6; color:#173; border-radius:1rem 1rem 1rem 0.25rem; padding:0.75rem 0.875rem; font-size:1rem; line-height:1.35; max-width:88%; margin:0.75rem 0; }
.msg a { color:#1a5c3a; font-weight:700; text-decoration:underline; }
.join { text-align:center; padding:2rem 0.5rem 0; } .join h1 { font-size:1.75rem; margin:0 0 0.5rem; } .join p { color:var(--ink-soft); font-size:1.0625rem; line-height:1.4; margin:0 0 1.5rem; }
.join .btn-primary { display:flex; align-items:center; justify-content:center; gap:0.625rem; } .join .btn-primary svg { width:1.35em; height:1.35em; }
.title-owner { display:flex; align-items:center; gap:0.35rem; color:var(--ink); font-size:min(1.25rem,5vw); font-weight:600; } .title-owner svg { width:1.1em; height:1.1em; color:var(--ink-soft); }
.status8 { color:var(--ink-soft); font-size:0.9375rem; font-weight:500; }
.tile-owner { display:block; font-size:0.875rem; color:var(--ink-soft); font-weight:600; margin-top:0.125rem; }
.sw-row { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; min-height:3rem; padding:0.375rem 0; border-top:1px solid var(--line); font-size:1.0625rem; font-weight:600; }
.sw { flex:none; width:3.25rem; height:2rem; border-radius:999px; background:var(--line); position:relative; padding:0; min-height:0; border:none; }
.sw::after { content:""; position:absolute; top:0.2rem; left:0.2rem; width:1.6rem; height:1.6rem; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.3); }
.sw.on { background:var(--accent); } .sw.on::after { left:1.45rem; }
.seg2 { display:flex; gap:0.5rem; margin:0.75rem 0; } .seg2 button { flex:1; min-height:3rem; background:var(--card); border:1.5px solid var(--line); color:var(--ink); font-size:1.0625rem; font-weight:600; }
.seg2 button.on { background:var(--accent); color:var(--accent-ink); border-color:var(--accent); }
.footer1 { position:fixed; left:0; right:0; bottom:0; padding:0.875rem 1rem env(safe-area-inset-bottom); background:linear-gradient(to bottom, transparent 0, var(--bg) 0.75rem); }
.btn-primary svg, .btn-secondary svg { width:1.35em; height:1.35em; vertical-align:-0.3em; margin-right:0.35rem; }
.footer1 .btn-primary { margin:0; display:flex; align-items:center; justify-content:center; gap:0.5rem; } .footer1 .btn-primary svg { width:1.45em; height:1.45em; }
</style>'''
def hdrM(title): return f'<div class="hdr4"><div class="row1"><button class="bk">{CHEV_L}</button><div class="t1">{title}</div></div></div>'
def scrM(label, body, footer='', theme=None):
    h = HEAD + XM
    if theme: h = h.replace('<html>', f'<html data-theme={theme}>')
    return h + f'<div class="label">{label}</div><div class="screen with-footer settings">{body}</div>{footer}' + TAIL
def homeM(titleblock, tiles, foot):
    return f'<div class="header"><button class="menu-btn">{I["menu"]}</button><div class="dayline">{titleblock}</div><button class="tiny" style="display:flex;align-items:center;gap:0.25rem"><span style="display:inline-flex;width:1.15em;height:1.15em">{I["clock"]}</span> Settings</button></div><div class="board">{tiles}</div>' + foot
def tileM(name, color, owner=None):
    tag = ('<span class="tile-owner">' + owner + '</span>') if owner else ''
    return f'<div class="tile"><div class="ph" style="background:{color};aspect-ratio:1/1">{name}</div><div class="tile-label">{name.capitalize()}{tag}</div></div>'
prow = lambda n, sub, pending=False: f'<button class="prow{" pending" if pending else ""}"><span class="nm"><b>{n}</b><small>{sub}</small></span><span class="chev">{I["chev"]}</span></button>'

# 1 drawer with People
write('mu1_1_drawer.html', scrM('MU1·1 · Hamburger gains PEOPLE, second row (Maya; Devin wanted it last — split).',
  homeM('<span class="day">Saturday morning</span><span class="date">September 19</span>', tileM('glasses','#5b7f9a')+tileM('keys','#8a6d4a'), '')
  + f'<div class="drawer-mock"><nav class="drawer"><div class="drawer-title">ReCall</div><button class="drawer-row">Text size &amp; colours</button><button class="drawer-row">People</button><button class="drawer-row">Places</button><button class="drawer-row">Deleted items</button><button class="drawer-row">Research log</button><button class="drawer-row quiet">Close</button></nav></div>'))
# 2 People empty
write('mu1_2_people_empty.html', scrM('MU1·2 · PEOPLE, empty — the one consent sentence, and the app is complete with nobody invited (Linda).',
  hdrM('People') + f'<div class="card"><p class="sub" style="margin:0 0 0.5rem;font-size:1.125rem;color:var(--ink)">Nobody else can see your things yet.</p><p class="consent" style="margin:0">Anyone you invite will see the photos of your things and where they are — except things you mark <b>Only me</b>.</p></div><button class="btn-primary">{I["people"]} Invite someone…</button>'))
# 3 People with rows
write('mu1_3_people.html', scrM('MU1·3 · PEOPLE with two people and a pending invitation. Roles carry dates (Dr Kim: roles are decisions, not fixtures).',
  hdrM('People') + prow('Robert', 'Can help · since Sep 12') + prow('Peter', 'Can see · joined by link Sep 14') + prow('Invitation sent · Sep 18', 'not opened yet', pending=True)
  + f'<button class="btn-secondary">{I["people"]} Invite someone…</button><div class="card" style="margin-top:0.75rem"><div class="sw-row" style="border-top:none"><span>Show who added each photo</span><button class="sw on"></button></div><div class="sw-row"><span>Let my people see when I last used the app</span><button class="sw"></button></div></div>'))
# 4 invite sheet
write('mu1_4_invite.html', scrM('MU1·4 · INVITE SHEET — pick a role (no preselection; Send is off until you do), the consent line again, then the system share sheet. No name typed.',
  hdrM('People') + prow('Robert', 'Can help · since Sep 12')
  + f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Invite someone</div><div class="rolepick"><button><b>Can see</b><span>Sees your things and where they are. Cannot change anything.</span></button><button class="on"><b>Can help</b><span>Can also add photos, move things and fix names.</span></button></div><p class="consent">They will see the photos of your things and where they are — except things you mark <b>Only me</b>.</p><button class="btn-primary">Send a link…</button><button class="btn-primary alt">Cancel</button></div>'))
# 5 the text message + join page
write('mu1_5_join.html', scrM('MU1·5 · PETER\'S FIRST MINUTE — (top) the text he receives; (below) the page the link opens. Tap 1: link. Tap 2: a provider. Tap 3: none — he lands on her grid.',
  f'<div class="msg">Margaret has invited you to help with her ReCall — the photos of where her things are. Open this on your phone: <a>recall.app/j/7fK2q</a><br>It works for 7 days.</div>'
  + f'<div class="card join"><h1>Margaret’s ReCall</h1><p>Margaret has shared the photos of where her things are.<br>Sign in so she knows it’s you.</p><button class="btn-primary">{I["apple"]} Continue with Apple</button><button class="btn-primary alt">{I["google"]} Continue with Google</button></div>'))
# 6 Peter's grid
write('mu1_6_peter_grid.html', scrM('MU1·6 · WHAT PETER SEES — her grid, titled Margaret\'s ReCall (tap ▾ to switch once he has his own); as Can see: footer is Find item alone; status line only if she turned it on.',
  homeM(f'<span class="title-owner">Margaret’s ReCall {I["chev"].replace("M9 6l6 6-6 6","M6 9l6 6 6-6")}</span><span class="status8">Opened today 4:02 pm · 3 things logged</span>', tileM('glasses','#5b7f9a')+tileM('keys','#8a6d4a')+tileM('pills','#7a8ea0')+tileM('soda','#4a8a6d'),
    f'<div class="footer1"><button class="btn-primary alt">{I["search"]} Find item</button></div>') + f'<div class="toastx" style="position:fixed;left:1rem;right:1rem;bottom:5.5rem;margin:0">You can now see Margaret’s things</div>'))
# 7 Margaret's grid with a one-off shared thing from Robert
write('mu1_7_owner_tag.html', scrM('MU1·7 · MARGARET\'S GRID with one thing Robert shared into it — the owner tag is words, under the name; her own things are untagged.',
  homeM('<span class="day">Saturday morning</span><span class="date">September 19</span>', tileM('glasses','#5b7f9a')+tileM('keys','#8a6d4a')+tileM('scissors','#6b8f6b','Robert’s')+tileM('soda','#4a8a6d'),
    f'<div class="footer1"><div class="footer-inner"><button class="btn-primary">{I["camera"]} Log item</button><button class="btn-primary alt">{I["search"]} Find item</button></div></div>')))
# 8 the sign-in moment (owner)
write('mu1_8_signin.html', scrM('MU1·8 · THE UPGRADE MOMENT — asked once, at her first Send a link…; one sentence, no password; Not now costs nothing.',
  hdrM('People') + prow('Invitation', '…', pending=True)
  + f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Sign in to share</div><p class="consent" style="margin:0 0 0.75rem;font-size:1.0625rem;color:var(--ink)">So your things stay yours on any phone, sign in once. Everything you have logged stays.</p><button class="btn-primary">{I["apple"]} Continue with Apple</button><button class="btn-primary alt">{I["google"]} Continue with Google</button><button class="btn-quiet" style="width:100%;margin-top:0.5rem">Not now</button></div>'))

# ================= MU2 — phase 2: the card per role, Shared with, Transfer =================
XM2 = XM + XT + '''<style>
.sw-row .lab { display:flex; align-items:baseline; gap:0.5rem; min-width:0; } .sw-row .lab svg { width:1.2rem; height:1.2rem; align-self:center; color:var(--accent); }
.sw-row.link { cursor:pointer; } .sw-row .val { color:var(--ink-soft); font-weight:600; display:flex; align-items:center; gap:0.25rem; } .sw-row .val svg { width:1.25rem; height:1.25rem; }
.grp { font-size:0.8125rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft); margin:0.75rem 0 0.25rem; }
.prow.grey { opacity:0.6; } .prow .role { font-weight:700; color:var(--accent); font-size:0.9375rem; }
.sheet8 .prow { box-shadow:none; background:var(--accent-soft); margin-bottom:0.375rem; min-height:3.25rem; padding:0.5rem 0.875rem; }
.sheet8 .prow.grey { background:var(--bg); }
.thing-head-mock .row2 { background:var(--accent-soft); border-radius:0.625rem; padding:0.375rem 0.625rem; margin-top:0.375rem; font-size:1.0625rem; }
.thing-head-mock .row2 svg { width:1.3rem; height:1.3rem; vertical-align:-0.3em; margin-right:0.3rem; color:var(--accent); }
.shared-by { color:var(--ink-soft); font-size:0.9375rem; font-weight:600; margin-top:0.5rem; }
</style>'''
def hdrC(name, place, ctx, lock=False):
    lk = f'<span class="lk" style="color:var(--accent);display:flex"><span style="width:1.35rem;height:1.35rem;display:inline-flex">{I["lock"]}</span></span>' if lock else ''
    return f'<div class="hdr4 thing-head-mock"><div class="row1"><button class="bk">{CHEV_L}</button><div class="t1">{name}</div>{lk}</div><div class="row2">{I["pin"]} <b>{place}</b> <span style="color:var(--ink-soft)">· {ctx}</span></div></div>'
def rollM(color, label, when, trash=True, by=None):
    t = f'<button class="photo-trash">{I["trash"]}</button>' if trash else ''
    return f'<div class="photo-wrap"><div class="strip"><div class="strip-page" style="flex:0 0 100%"><div style="position:relative"><div class="ph" style="background:{color};position:relative;aspect-ratio:4/3;border-radius:0.75rem">{label}<span class="ts">{when}{(" · " + by) if by else ""}</span></div>{t}</div></div></div></div>'
def swrow(icon, text, on=None, val=None, amber=False):
    right = f'<button class="sw{" on" if on else ""}"></button>' if val is None else f'<span class="val">{val} {I["chev"]}</span>'
    return f'<div class="sw-row{" link" if val is not None else ""}"><span class="lab{" amber" if amber else ""}"><span style="display:inline-flex;width:1.2rem;height:1.2rem;color:{"var(--amber)" if amber else "var(--accent)"}">{icon}</span>{text}</span>{right}</div>'
def barM(*btns):
    m = {'add': ('act primary', I['camera'], 'Add photo'), 'edit': ('act', I['pencil'], 'Edit'), 'remove': ('act amber', I['trash'], 'Remove')}
    inner = ''.join(f'<button class="{m[b][0]}">{m[b][1]}<span>{m[b][2]}</span></button>' for b in btns)
    return f'<div class="footer8"><div class="actbar" style="grid-template-columns:repeat({len(btns)},1fr)">{inner}</div></div>'
def scr2(label, body, footer=''):
    return HEAD + XM2 + f'<div class="label">{label}</div><div class="screen with-footer">{body}</div>{footer}' + TAIL
# 1 owner card: Shared with row
write('mu2_1_owner.html', scr2('MU2·1 · OWNER\'S CARD — Keep this private becomes "Shared with · Robert, Peter" (tap → sheet). Everything else as built.',
  hdrC('Reading glasses', 'Kitchen counter', 'on a wooden table') + f'<div class="card thing">{rollM("#5b7f9a","glasses","Today 5:52 PM")}<div class="switches" style="margin-top:0.5rem">{swrow(I["people"], "Shared with", val="Robert, Peter")}{swrow(I["clock"], "Show times on photos", on=True)}{swrow(I["hist"], "Show earlier places 2", on=False, amber=True)}</div></div>', barM('add','edit','remove')))
# 2 the Shared with sheet
write('mu2_2_sheet.html', scr2('MU2·2 · SHARED WITH sheet — people via her ReCall (greyed, change in People), one-off people with their own role, Add a person…, Only me, Transfer (greyed until built).',
  hdrC('Reading glasses', 'Kitchen counter', 'on a wooden table') + f'<div class="card thing">{rollM("#5b7f9a","glasses","Today 5:52 PM")}</div>'
  + f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Who can see the glasses</div><div class="grp">Via your ReCall</div><div class="prow grey"><span class="nm"><b>Robert</b><small>Can help · change in People</small></span></div><div class="prow grey"><span class="nm"><b>Peter</b><small>Can see · change in People</small></span></div><div class="grp">Just this thing</div><div class="prow"><span class="nm"><b>Linda</b><small>since Sep 18</small></span><span class="role">Can see</span></div><button class="btn-secondary" style="margin:0.25rem 0 0.5rem">{I["people"]} Add a person…</button><div class="sw-row" style="border-top:1px solid var(--line)"><span class="lab"><span style="display:inline-flex;width:1.2rem;height:1.2rem;color:var(--accent)">{I["lock"]}</span>Only me</span><button class="sw"></button></div><button class="btn-quiet" style="width:100%;opacity:0.5">Give the glasses to someone…</button><button class="btn-primary alt" style="margin-top:0.5rem">Done</button></div>'))
# 3 Only me confirm
write('mu2_3_onlyme.html', scr2('MU2·3 · ONLY ME confirm — says what changes and what does not (photos already seen stay seen).',
  hdrC('Reading glasses', 'Kitchen counter', 'on a wooden table') + f'<div class="card thing">{rollM("#5b7f9a","glasses","Today 5:52 PM")}</div>'
  + f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Stop sharing the glasses?</div><p class="consent" style="margin:0 0 0.75rem;font-size:1.0625rem;color:var(--ink)">Robert, Peter and Linda will no longer see them. Photos they have already seen stay seen. Nothing is deleted.</p><button class="btn-primary alt">Keep sharing</button><button class="btn-primary" style="background:var(--amber);color:#fff">Only me</button></div>'))
# 4 editor's card (Robert, Can help)
write('mu2_4_editor.html', scr2('MU2·4 · ROBERT (Can help) on the same card — "Shared by Margaret" instead of Shared with; no Remove; bar is Add photo · Edit. Trash and Remove old photos stay.',
  hdrC('Reading glasses', 'Kitchen counter', 'on a wooden table') + f'<div class="card thing">{rollM("#5b7f9a","glasses","Today 5:52 PM", by="Margaret")}<div class="shared-by">Shared by Margaret</div><div class="switches" style="margin-top:0.5rem">{swrow(I["clock"], "Show times on photos", on=True)}{swrow(I["hist"], "Show earlier places 2", on=False, amber=True)}</div></div>', barM('add','edit')))
# 5 viewer's card (Peter, Can see)
write('mu2_5_viewer.html', scr2('MU2·5 · PETER (Can see) — photo, place, two switches, no trash, no bar. A card with nothing to do.',
  hdrC('Reading glasses', 'Kitchen counter', 'on a wooden table') + f'<div class="card thing">{rollM("#5b7f9a","glasses","Today 5:52 PM", trash=False)}<div class="shared-by">Shared by Margaret</div><div class="switches" style="margin-top:0.5rem">{swrow(I["clock"], "Show times on photos", on=True)}{swrow(I["hist"], "Show earlier places 2", on=False, amber=True)}</div></div>'))
# 6 transfer confirm (Robert giving the scissors to Margaret)
write('mu2_6_transfer.html', scr2('MU2·6 · TRANSFER — Robert gives the scissors to Margaret. It moves with all its photos; he keeps Can help. (Words: Give vs Move — split.)',
  hdrC('Good scissors', 'Kitchen drawer', 'left side') + f'<div class="card thing">{rollM("#6b8f6b","scissors","Sat 3:10 PM")}</div>'
  + f'<div class="dim"></div><div class="sheet8"><div class="sheet-title">Give the scissors to Margaret?</div><p class="consent" style="margin:0 0 0.75rem;font-size:1.0625rem;color:var(--ink)">They move to Margaret’s ReCall with all their photos. You will still be able to help with them.</p><button class="btn-primary alt">Keep them</button><button class="btn-primary">Give them</button></div>'))
# 7 Robert logging: whose ReCall — on the button
write('mu2_7_log_whose.html', scr2('MU2·7 · ROBERT LOGGING — whose ReCall is on the Log button (Robert: "the switcher is a hazard"). The photo card says it again.',
  homeM(f'<span class="title-owner">Margaret’s ReCall {I["chev"].replace("M9 6l6 6-6 6","M6 9l6 6 6-6")}</span><span class="status8">Can help</span>', tileM('glasses','#5b7f9a')+tileM('keys','#8a6d4a'), f'<div class="footer1"><div class="footer-inner"><button class="btn-primary" style="flex-direction:column;gap:0;line-height:1.1"><span>{I["camera"]} Log item</span><small style="font-size:0.75rem;font-weight:600;opacity:0.85">in Margaret’s ReCall</small></button><button class="btn-primary alt">{I["search"]} Find item</button></div></div>')))
# 8 removed Peter
write('mu2_8_removed.html', scr2('MU2·8 · PETER, REMOVED — one card, no reason, no "ask her" button; she chose. Start my own ReCall is the only way on.',
  f'<div class="header"><button class="menu-btn">{I["menu"]}</button><div class="dayline"><span class="day">Saturday morning</span><span class="date">September 19</span></div></div><div class="card"><p style="font-size:1.125rem;margin:0 0 0.75rem">Margaret’s ReCall is no longer shared with you.</p><button class="btn-primary">{I["camera"]} Start my own ReCall</button></div>'))
