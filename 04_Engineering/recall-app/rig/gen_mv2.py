# Mockups round 2 (Ravi 09-29): + only ADDS a level; the level in focus is set by photographing it (recognise → "Is this
# the …?") or by "Choose a place"; the popup only when the photo isn't recognised or the answer is No; Save held = Save + Next.
# Uses gen_mv.py's stylesheet and helpers. Writes mock/mw_*.html → node render_mv.js (m[vcw]_) → compose in compose_mv2.py.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_mv as g
D = g.D; AMB, BLU = g.AMB, g.BLU
SPIN = '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="3"/><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>'
LIST = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>'
EXTRA = '''
.choose{flex:none;white-space:nowrap;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.55);font-weight:800;font-size:16px;margin-left:auto}
.row2{display:flex;align-items:center;gap:10px}
.looking{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.block{opacity:.35}
.ask2{margin-top:12px} .ask2 .pair{display:flex;align-items:center;gap:10px;margin-bottom:10px} .ask2 .pair img{width:58px;height:58px;border-radius:12px;object-fit:cover;border:3px solid}
.ask2 b{font-size:17px;line-height:1.25} .btns{display:flex;gap:8px} .btns span{display:inline-flex;align-items:center;height:46px;padding:0 18px;border-radius:999px;font-weight:800;font-size:16px}
.btns .y{background:#2F6B5E} .btns .n{border:1.5px solid rgba(255,255,255,.55)}
.fld{height:50px;border-radius:12px;background:#2b2825;border:2px solid #7FD1B9;display:flex;align-items:center;padding:0 14px;font-size:18px;font-weight:700;margin:4px 0 10px}
.hint{color:#a9a298;font-size:14.5px;margin:0 2px 8px}
.btnp{height:50px;border-radius:14px;background:#2F6B5E;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;margin-top:10px}
.toast{position:absolute;left:16px;right:16px;top:74px;padding:12px 14px;border-radius:14px;background:rgba(20,20,20,.9);border:1px solid #444;font-size:15.5px;font-weight:700;display:flex;gap:10px;align-items:center}
.toast img{width:40px;height:40px;border-radius:8px;object-fit:cover}
.hold{position:absolute;right:12px;bottom:112px;background:#2F6B5E;border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700}
'''
def page(name, top, view, card, bot, sheet=''):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{g.CSS}{EXTRA}
.bot2{{position:absolute;left:0;right:0;bottom:0;height:118px;background:#000;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 12px 18px;gap:8px}}
.bot2 .l{{justify-self:start}} .bot2 .r{{justify-self:end}} .cx{{display:flex;align-items:center;gap:6px;height:56px;padding:0 14px;border-radius:16px;background:rgba(40,40,40,.9);border:1.5px solid #666;font-weight:800;font-size:17px}}
</style></head><body><div class="top" style="padding-left:14px">{top}</div><div class="view">{view}{card}</div><div class="bot2">{bot}</div>{sheet}</body></html>'''
    open(os.path.join(D, 'mock', f'mw_{name}.html'), 'w').write(html)
TOP = g.TOPB
def bot(ring, save=True, dim=False):
    return f'<div class="l"><div class="cx">{g.X} Cancel</div></div><div class="sh{" block" if dim else ""}" style="border-color:{ring}"><span></span></div><div class="r">' + (f'<div class="sv{" block" if dim else ""}">{g.SAVE} Save</div>' if save else '') + '</div>'
CHOOSE = f'<span class="choose">{LIST} Choose place</span>'
# Ravi 09-29: no colour dot before the prompt, no pin before the status; one label, "Place:", in the level's colour.
def place(c, name): return f'<div class="st"><div><span class="lab" style="color:{c}">Place:</span> <b>{name}</b></div></div>'
# Ravi 09-29: the chain text uses the same "in" pill as the squares, not "›".
def chain2(parts): return '<div class="chain" style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 6px;border-top:1px solid rgba(255,255,255,.2);margin-top:10px;padding-top:9px">' + '<span class="in">in</span>'.join(f'<span style="color:{c}">{n}</span>' for n, c in parts) + '</div>'
def pr(text): return f'<div class="pr"><span>{text}</span></div>'
# Ravi 09-29: the "+" in the words is drawn as the same white plus as the button (no quotes, no pill — a pill looks pressable)
PLUSIN = '<svg viewBox="0 0 24 24" width="19" height="19" style="vertical-align:-3px;margin:0 -1px" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
PL = g.P; NEW = g.img('real_desk.jpg')

# 1 · Move it opens. Level 1 is set (the current place), so + is there: it only ADDS a level (what the Workbench is in).
page('1_open', TOP, '', f'''<div class="card">{pr('Moved it? Photograph the new place, or choose one.')}
<div class="row2"><div class="strip">{g.sq(AMB, None, sel=True, pin=True)}<div class="plus">{g.PLUS}</div></div>{CHOOSE}</div>
{place(AMB, 'Workbench or desk')}</div>''', bot(AMB))
# 2 · Shutter → the photo goes on level 1 and ReCall looks at it; everything waits (up to ~4 s).
page('2_looking', TOP, '', f'''<div class="card"><div class="pr block">Moved it? Photograph the new place, or choose one.</div>
<div class="row2"><div class="strip"><div class="sq sel" style="border-color:{AMB}"><img src="{NEW}"><div class="looking">{SPIN}</div></div><div class="plus block">{g.PLUS}</div></div><span class="choose block">{LIST} Choose a place</span></div>
<div class="st"><div><b>Looking at the photo…</b></div></div></div>''', bot(AMB, dim=True))
# 3 · Recognised → one question, the saved place's photo beside the new one.
page('3_is_this', TOP, '', f'''<div class="card">
<div class="ask2" style="margin-top:0"><div class="pair"><img src="{NEW}" style="border-color:{AMB}"><span style="font-size:22px">=</span><img src="{PL['drawer']}" style="border-color:#777"><b>Is this the<br>Desk drawer?</b></div>
<div class="btns"><span class="y">Yes</span><span class="n" style="gap:8px">No, {LIST} Choose place</span></div></div></div>''', bot(AMB, save=False, dim=True))
# 4 · Yes → level 1 = Desk drawer (the new photo added to its photos). Now + can add what the drawer is in.
page('4_yes', TOP, '', f'''<div class="card">{pr(f'Tap {PLUSIN} to add what the Desk drawer is in.')}
<div class="row2"><div class="strip">{g.sq(AMB, NEW, sel=True, n=2)}<div class="plus">{g.PLUS}</div></div>{CHOOSE}</div>
{place(AMB, 'Desk drawer')}</div>''', bot(AMB))
# 5 · No (or not recognised) → the one popup: name it, or it's one of these.
sheet5 = f'''<div class="dim"></div><div class="sheet"><h3>{LIST} Choose place</h3><div class="tierhead"><img src="{NEW}" style="border-color:{AMB}"><div><b>A new place?</b><small>Name the place in your photo</small></div></div>
<div class="fld">Workbench shelf</div><div class="hint">ReCall's guess — type to change it.</div>
<div class="btnp">Use this name</div>
<div class="grp" style="margin-top:14px">OR IT'S ONE OF YOUR PLACES</div><div class="srch">{g.SEARCH} Search your places</div>
<div class="row"><img src="{PL['drawer']}"><div><b>Desk drawer</b><small>3 things</small></div></div>
<div class="row"><img src="{PL['shelf']}"><div><b>Pantry shelf</b><small>nothing here yet</small></div></div></div>'''
page('5_name_it', TOP, '', '', bot(AMB, dim=True), sheet5)
# 6 · Tap + → a new, empty level 2 in focus. No + until it's set. The same two ways: photograph it, or choose one.
page('6_plus', TOP, '', f'''<div class="card">{pr('What is the Desk drawer in? Photograph it, or choose one.')}
<div class="row2"><div class="strip">{g.sq(AMB, NEW, n=2)}{g.IN}{g.sq(BLU, None, sel=True, pin=True)}</div>{CHOOSE}</div>
{place(BLU, 'not defined')}
{chain2([('Desk drawer', AMB), ('?', BLU)])}</div>''', bot(BLU))
# 6b · three levels: the chain with "in" pills
page('6b_three', TOP, '', f'''<div class="card">{pr(f'Tap {PLUSIN} to add what the Office is in.')}
<div class="row2"><div class="strip">{g.sq(AMB, NEW, n=2)}{g.IN}{g.sq(BLU, PL['closet'], n=2)}{g.IN}{g.sq(g.COR, PL['desk'], sel=True)}<div class="plus">{g.PLUS}</div></div></div>
{place(g.COR, 'Office')}
{chain2([('Desk drawer', AMB), ('In air', BLU), ('Office', g.COR)])}</div>''', bot(g.COR))
# 7 · Log item: HOLD Save — once held long enough the button itself becomes "Save + Next" (let go now = save and log the next;
# let go before = plain Save; slide off = nothing). Then a short flash, then the camera for the next thing.
top7 = f'<div class="ttl2"><img src="{g.img("charger.jpg")}"><div><small>New item</small><b>Spare batteries</b></div></div>'
card7 = f'''<div class="card">{pr(f'Tap {PLUSIN} to add what the Tool drawer is in.')}<div class="row2"><div class="strip">{g.sq(AMB, PL['tool'], sel=True)}<div class="plus">{g.PLUS}</div></div>{CHOOSE}</div>{place(AMB, 'Tool drawer')}</div>'''
page('7a_holding', top7, '', card7, f'<div class="l"><div class="cx">{g.X} Cancel</div></div><div class="sh" style="border-color:{AMB}"><span></span></div><div class="r"><div class="sv" style="background:#3E8C7A;box-shadow:0 0 0 3px #7FD1B9;transform:scale(1.04);white-space:nowrap;padding:0 14px">Save + Next</div></div>')
page('7b_flash', top7, '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(24,22,20,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:18px 26px;font-size:22px;font-weight:800">Spare batteries <span style="color:#7FD1B9">✓ saved</span></div></div>', '', f'<div class="l"><div class="cx">{g.X} Cancel</div></div><div class="sh block" style="border-color:#fff"><span></span></div><div class="r"></div>')
top7c = f'<div class="ttl2"><div><small>Next item</small><b>Photograph it</b></div></div>'
page('7c_next', top7c, '', '', f'<div class="l"><div class="cx">{g.X} Cancel</div></div><div class="sh" style="border-color:#fff"><span></span></div><div class="r"></div>')
sheet5b = f'''<div class="dim"></div><div class="sheet"><h3>{LIST} Choose place</h3>
<div class="srch">{g.SEARCH} Search your places</div>
<div class="grp">YOUR PLACES</div>
<div class="row"><img src="{PL['drawer']}"><div><b>Desk drawer</b><small>3 things</small></div></div>
<div class="row"><img src="{PL['closet']}"><div><b>In air</b><small>Desk drawer, Hall shelf</small></div></div>
<div class="row"><img src="{PL['shelf']}"><div><b>Pantry shelf</b><small>nothing here yet</small></div></div>
<div class="row"><img src="{PL['box']}"><div><b>White cardboard box</b><small>Garage · 3 things</small></div></div>
<div class="cancel">Cancel</div></div>'''
page('5b_choose', TOP, '', '', bot(AMB, dim=True), sheet5b)
print('mw ok')

# ---- 09-29 (Ravi): the Choose button on two centred lines vs "Choose place" on one; the flash with "saved" highlighted ----
C2 = f'<span class="choose" style="height:auto;min-height:48px;padding:6px 14px;text-align:center;line-height:1.15">{LIST}<span>Choose<br>a place</span></span>'
C1 = f'<span class="choose">{LIST} Choose place</span>'
for tag, btn in (('two', C2), ('one', C1)):
    page(f'8_{tag}_l1', TOP, '', f'''<div class="card">{pr('Moved it? Photograph the new place, or choose one.')}
<div class="row2"><div class="strip">{g.sq(AMB, None, sel=True, pin=True)}<div class="plus">{g.PLUS}</div></div>{btn}</div>
{place(AMB, 'Workbench or desk')}</div>''', bot(AMB))
    page(f'8_{tag}_l2', TOP, '', f'''<div class="card">{pr('What is the Desk drawer in? Photograph it, or choose one.')}
<div class="row2"><div class="strip">{g.sq(AMB, NEW, n=2)}{g.IN}{g.sq(BLU, None, sel=True, pin=True)}</div>{btn}</div>
{place(BLU, 'not defined')}
{chain2([('Desk drawer', AMB), ('?', BLU)])}</div>''', bot(BLU))
def flash(name, inner):
    page(name, top7, f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="background:rgba(24,22,20,.62);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:18px 26px;font-size:22px;font-weight:800">{inner}</div></div>', '', f'<div class="l"><div class="cx">{g.X} Cancel</div></div><div class="sh block" style="border-color:#fff"><span></span></div><div class="r"></div>')
flash('9_flash_plain', '✓ Spare batteries saved')
flash('9_flash_hl', 'Spare batteries <span style="color:#7FD1B9">✓ saved</span>')
print('mw8 ok')
