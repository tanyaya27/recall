# Mockups: the camera card redesign for multi-tier places (Ravi 09-29, "the box is jam packed").
# Writes mock/mv_<frame>.html at 390x844; render with render_mv.js; compose with compose_mv.py.
import base64, os
D = os.path.dirname(os.path.abspath(__file__))
def img(f):
    return 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(D, 'mock/img', f), 'rb').read()).decode()
AMB, BLU, COR, VIO = '#F5B942', '#4DB6F5', '#F2766B', '#A98BF7'
BG = img('ravi_bg.jpg'); THING = img('brochure.jpg')
P = {'drawer': img('drawer.jpg'), 'closet': img('closet.jpg'), 'desk': img('real_desk.jpg'), 'box': img('box.jpg'), 'shelf': img('real_painting.jpg'), 'tool': img('tooldrawer.jpg')}
PIN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
PLUS = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
X = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
SAVE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>'
CAM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>'
SEARCH = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></svg>'

CSS = '''
*{box-sizing:border-box;margin:0;padding:0} body{width:390px;height:844px;overflow:hidden;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;position:relative}
.top{height:64px;display:flex;align-items:center;gap:10px;padding:0 12px;background:#000}
.x{flex:none;display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 14px 0 12px;border-radius:999px;background:#2A2A2A;border:1.5px solid #5A5A5A;font-weight:700;font-size:17px}
.ttl{flex:1;min-width:0;line-height:1.2} .ttl .q{color:#bdb6ab;font-weight:600;font-size:15px} .ttl b{display:block;font-size:17px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ttl2{flex:1;min-width:0;display:flex;align-items:center;gap:10px} .ttl2 img{width:46px;height:46px;border-radius:10px;object-fit:cover;border:2.5px solid #fff;flex:none} .ttl2 div{min-width:0;line-height:1.2} .ttl2 small{display:block;color:#bdb6ab;font-size:14px;font-weight:600} .ttl2 b{display:block;font-size:17px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.view{position:absolute;top:64px;left:0;right:0;bottom:118px;background:url(BGIMG) center/cover;overflow:hidden}
.thing{position:absolute;left:12px;top:12px;width:64px;height:64px;border-radius:12px;overflow:hidden;border:3px solid rgba(255,255,255,.85);box-shadow:0 2px 10px rgba(0,0,0,.5)} .thing img{width:100%;height:100%;object-fit:cover}
.thing.sel{border:4px solid #fff;box-shadow:0 0 0 3px rgba(0,0,0,.5)} .thing .n{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.7);border-radius:999px;font-size:12px;font-weight:800;padding:1px 6px}
.card{position:absolute;left:10px;right:10px;bottom:10px;padding:12px 12px 10px;border-radius:18px;background:rgba(40,36,33,.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12)}
.pr{display:flex;gap:10px;align-items:center;font-size:16.5px;font-weight:700;line-height:1.25;margin-bottom:10px} .pr .dot{flex:none;width:22px;height:22px;border-radius:50%;border:4px solid}
.strip{display:flex;align-items:center;gap:6px}
.sq{flex:none;width:58px;height:58px;border-radius:12px;overflow:hidden;border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;position:relative;background:rgba(0,0,0,.3)} .sq img{width:100%;height:100%;object-fit:cover}
.sq.sel{border-width:4px;box-shadow:0 0 0 2px rgba(0,0,0,.45)} .sq .n{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.72);border-radius:999px;font-size:12px;font-weight:800;padding:1px 6px}
.sq.sugg{border-style:dashed;opacity:.9}
.in{flex:none;font-size:13px;font-weight:800;color:#e9e3d9;background:rgba(255,255,255,.16);border-radius:999px;padding:4px 8px}
.plus{flex:none;width:44px;height:58px;display:flex;align-items:center;justify-content:center}
.st{display:flex;align-items:flex-start;gap:8px;margin-top:12px;font-size:16px;line-height:1.3} .st .pin{flex:none;margin-top:1px} .st b{font-weight:800} .st .lab{font-weight:800}
.st small{display:block;color:#d6d0c6;font-size:14.5px;font-weight:500}
.chain{margin-top:8px;font-size:15px;font-weight:700;line-height:1.35;color:#f2ede5} .chain .g{color:#9e978d;font-weight:600;padding:0 5px}
.mv{margin-top:6px;font-size:14.5px;color:#d6d0c6}
.bot{position:absolute;left:0;right:0;bottom:0;height:118px;background:#000;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 12px 18px}
.sh{width:82px;height:82px;border-radius:50%;border:5px solid;display:flex;align-items:center;justify-content:center;justify-self:center} .sh span{width:58px;height:58px;border-radius:50%;background:#fff}
.sv{justify-self:end;display:flex;align-items:center;gap:6px;height:56px;padding:0 20px;border-radius:16px;background:#2F6B5E;font-weight:800;font-size:17px}
.nx{justify-self:start;display:flex;align-items:center;gap:4px;height:56px;padding:0 12px;border-radius:16px;background:rgba(40,40,40,.9);border:1.5px solid #666;font-weight:800;font-size:17px}
.dim{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:#1d1b19;border-radius:20px 20px 0 0;padding:14px 16px 24px;border-top:1px solid #333}
.sheet h3{font-size:19px;margin:4px 2px 12px;line-height:1.25} .sheet h3 .q{color:#bdb6ab;font-weight:600}
.srch{display:flex;align-items:center;gap:8px;height:46px;border-radius:12px;background:#2b2825;padding:0 12px;color:#9a938a;font-size:16px;margin-bottom:10px}
.newp{display:flex;align-items:center;justify-content:center;gap:8px;height:50px;border-radius:14px;background:#7FD1B9;color:#10302a;font-weight:800;font-size:16.5px;margin-bottom:12px}
.grp{font-size:13px;font-weight:800;letter-spacing:.06em;color:#9e978d;margin:6px 2px 6px}
.row{display:flex;align-items:center;gap:12px;padding:8px 2px;border-bottom:1px solid #2c2926} .row img{width:48px;height:48px;border-radius:10px;object-fit:cover;flex:none} .row b{display:block;font-size:17px} .row small{display:block;color:#a9a298;font-size:14px}
.act{display:flex;align-items:center;gap:12px;padding:13px 4px;border-bottom:1px solid #2c2926;font-size:17px;font-weight:700} .act .ic{width:26px;text-align:center;color:#d6d0c6}
.act.red{color:#ff8a7a}
.tierhead{display:flex;align-items:center;gap:12px;margin:2px 0 8px} .tierhead img{width:64px;height:64px;border-radius:12px;object-fit:cover;border:4px solid}
.tierhead b{display:block;font-size:19px} .tierhead small{display:block;color:#bdb6ab;font-size:14.5px}
.cancel{margin-top:12px;height:48px;border-radius:14px;border:1.5px solid #444;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16.5px}
'''.replace('BGIMG', BG)

def sq(colour=None, src=None, sel=False, n=0, sugg=False, pin=False):
    style = f'border-color:{colour};' if (sel or pin or sugg) and colour else ''
    inner = f'<img src="{src}">' if src else f'<span style="color:{colour}">{PIN}</span>'
    return f'<div class="sq{" sel" if sel else ""}{" sugg" if sugg else ""}" style="{style}">{inner}{f"<span class=n>{n}</span>" if n > 1 else ""}</div>'
IN = '<span class="in">in</span>'
def page(name, top, view_extra, card, ring, sheet='', nextbtn=False):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="top">{top}</div><div class="view">{view_extra}{card}</div>
<div class="bot">{'<div class="nx">'+SAVE+' + Next</div>' if nextbtn else '<span></span>'}<div class="sh" style="border-color:{ring}"><span></span></div><div class="sv">{SAVE} Save</div></div>{sheet}</body></html>'''
    open(os.path.join(D, 'mock', f'mv_{name}.html'), 'w').write(html)

TOP_T1 = f'<div class="x">{X} Cancel</div><div class="ttl"><span class="q">Where is the</span><b>Walgreens Photo brochure?</b></div>'
TOP_T2 = f'<div class="x">{X} Cancel</div><div class="ttl2"><img src="{THING}"><div><small>Where is the</small><b>Walgreens Photo brochure?</b></div></div>'
THING_T1 = f'<div class="thing"><img src="{THING}"></div>'
def dot(c): return f'<span class="dot" style="border-color:{c}"></span>'
def status(colour, lab, name, small=''):
    return f'<div class="st"><span class="pin" style="color:{colour}">{PIN}</span><div><span class="lab" style="color:{colour}">{lab}</span> <b>{name}</b>{f"<small>{small}</small>" if small else ""}</div></div>'
def chain(parts):
    return '<div class="chain">' + '<span class="g">›</span>'.join(f'<span style="color:{c}">{n}</span>' for n, c in parts) + '</div>'

# F1: Move it opens — T1 (Ravi: the thing top-left on the picture, the question beside Cancel)
card1 = f'''<div class="card"><div class="pr">{dot(AMB)}Photograph where it is now, or tap + to choose a place.</div>
<div class="strip">{sq(AMB, None, sel=True, pin=True)}<div class="plus">{PLUS}</div></div>
{status(AMB, 'Current place:', 'Workbench or desk')}</div>'''
page('1_move_T1', TOP_T1, THING_T1, card1, AMB)
# F2: same — T2 (the thing's photo in the black band, the picture fully clear)
page('2_move_T2', TOP_T2, '', card1, AMB)
# F3: three tiers, tier 2 selected (Desk drawer · In air · Office), the move said before Save
card3 = f'''<div class="card"><div class="pr">{dot(BLU)}Another photo of In air, or tap + for what it is in.</div>
<div class="strip">{sq(AMB, P['drawer'])}{IN}{sq(BLU, P['closet'], sel=True, n=2)}{IN}{sq(COR, P['desk'])}<div class="plus">{PLUS}</div></div>
{status(BLU, 'New place:', 'In air', '2 photos')}
{chain([('Desk drawer', AMB), ('In air', BLU), ('Office', COR)])}</div>'''
page('3_three_tiers', TOP_T2, '', card3, BLU)
# F4: tap + → the chooser sheet (for the next tier)
sheet4 = f'''<div class="dim"></div><div class="sheet"><h3><span class="q">Where is the</span> Desk drawer?</h3>
<div class="srch">{SEARCH} Search your places</div><div class="newp">{CAM} Photograph a new place</div>
<div class="grp">RECENT PLACES</div>
<div class="row"><img src="{P['closet']}"><div><b>In air</b><small>Desk drawer, Hall shelf</small></div></div>
<div class="row"><img src="{P['desk']}"><div><b>Office</b><small>2 places, 5 things</small></div></div>
<div class="row"><img src="{P['shelf']}"><div><b>Pantry shelf</b><small>nothing here yet</small></div></div>
<div class="row"><img src="{P['box']}"><div><b>White cardboard box</b><small>Garage · 3 things</small></div></div>
<div class="cancel">Cancel</div></div>'''
card4 = f'''<div class="card"><div class="pr">{dot(BLU)}Photograph what the Desk drawer is in, or tap + to choose.</div>
<div class="strip">{sq(AMB, P['drawer'])}{IN}{sq(BLU, None, sel=True, pin=True)}<div class="plus">{PLUS}</div></div></div>'''
page('4_plus_sheet', TOP_T2, '', card4, BLU, sheet4)
# F5: tap the selected square again → what you can do with THIS tier
sheet5 = f'''<div class="dim"></div><div class="sheet">
<div class="tierhead"><img src="{P['closet']}" style="border-color:{BLU}"><div><b>In air</b><small>2 photos · where the Desk drawer is</small></div></div>
<div class="act"><span class="ic">🖼</span>See its photos</div>
<div class="act"><span class="ic">↺</span>Change to another place</div>
<div class="act"><span class="ic">✎</span>Rename</div>
<div class="act"><span class="ic">＋</span>Add a place between Desk drawer and In air</div>
<div class="act red"><span class="ic">✕</span>Remove this level</div>
<div class="cancel">Close</div></div>'''
page('5_tier_sheet', TOP_T2, '', card3.replace('<div class="card">', '<div class="card" style="opacity:.0">'), BLU, sheet5)
# F6: Log item, first photo taken: the thing sits top-left; the usual place is offered as tier 1 (dashed = suggested)
top6 = f'<div class="x">{X} Cancel</div><div class="ttl"><span class="q">New item</span><b>Spare batteries</b></div>'
card6 = f'''<div class="card"><div class="pr">{dot(AMB)}Save it here, photograph another place, or tap + to choose.</div>
<div class="strip">{sq(AMB, P['tool'], sugg=True)}<div class="plus">{PLUS}</div></div>
{status(AMB, 'Usual place:', 'Tool drawer', 'tap Save to keep it there')}</div>'''
page('6_log_suggestion', top6, f'<div class="thing"><img src="{img("charger.jpg")}"></div>', card6, AMB, nextbtn=True)
# F7: Log item, the thing's thumbnail tapped: the shutter now photographs the THING (white ring)
card7 = f'''<div class="card"><div class="pr">{dot('#fff')}Another photo of the spare batteries. Tap a place square when done.</div>
<div class="strip">{sq(AMB, P['tool'])}<div class="plus">{PLUS}</div></div>
{status(AMB, 'Where it is:', 'Tool drawer')}</div>'''
page('7_log_thing_selected', top6, f'<div class="thing sel"><img src="{img("charger.jpg")}"><span class="n">2</span></div>', card7, '#fff', nextbtn=True)
print('ok')

# ---- 09-29 (Ravi): Cancel at the bottom left, beside the shutter (the iOS camera-picker layout), so the band holds B ----
def page2(name, top, view_extra, card, bot, scale=1.0):
    css = CSS + f'''
.bot2{{position:absolute;left:0;right:0;bottom:0;height:118px;background:#000;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 12px 18px;gap:8px}}
.bot2 .l{{justify-self:start;display:flex;gap:8px}} .bot2 .r{{justify-self:end;display:flex;gap:8px}}
.cx{{display:flex;align-items:center;gap:6px;height:56px;padding:0 14px;border-radius:16px;background:rgba(40,40,40,.9);border:1.5px solid #666;font-weight:800;font-size:{17*scale:.1f}px}}
.cxi{{display:flex;align-items:center;justify-content:center;width:52px;height:56px;border-radius:16px;background:rgba(40,40,40,.9);border:1.5px solid #666}}
.bot2 .sv{{font-size:{17*scale:.1f}px;padding:0 {14 if scale > 1 else 18}px}} .bot2 .nx{{font-size:{17*scale:.1f}px;padding:0 10px}}
.top.b{{padding-left:14px}} .ttl2 b{{font-size:{17*scale:.1f}px}} .ttl2 small{{font-size:{14*scale:.1f}px}} .pr{{font-size:{16.5*scale:.1f}px}} .st{{font-size:{16*scale:.1f}px}}'''
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div class="top b">{top}</div><div class="view">{view_extra}{card}</div><div class="bot2">{bot}</div></body></html>'''
    open(os.path.join(D, 'mock', f'mc_{name}.html'), 'w').write(html)
TOPB = f'<div class="ttl2"><img src="{THING}"><div><small>Where is the</small><b>Walgreens Photo brochure?</b></div></div>'
SH = lambda c: f'<div class="sh" style="border-color:{c}"><span></span></div>'
CXL = f'<div class="cx">{X} Cancel</div>'; CXI = f'<div class="cxi">{X}</div>'
page2('1_move_B_cancel_bottom', TOPB, '', card1, f'<div class="l">{CXL}</div>{SH(AMB)}<div class="r"><div class="sv">{SAVE} Save</div></div>')
topL = f'<div class="ttl2"><img src="{img("charger.jpg")}"><div><small>New item</small><b>Spare batteries</b></div></div>'
cardL = card6
page2('2_log_L1_no_next', topL, '', cardL, f'<div class="l">{CXL}</div>{SH(AMB)}<div class="r"><div class="sv">{SAVE} Save</div></div>')
page2('3_log_L2_compact', topL, '', cardL, f'<div class="l">{CXI}</div>{SH(AMB)}<div class="r"><div class="nx">+ Next</div><div class="sv">{SAVE} Save</div></div>')
page2('4_log_L2_largest', topL, '', cardL, f'<div class="l">{CXI}</div>{SH(AMB)}<div class="r"><div class="nx">+ Next</div><div class="sv">{SAVE} Save</div></div>', scale=1.38)
page2('5_addphoto_cancel_bottom', f'<div class="ttl2"><img src="{THING}"><div><small>Add a photo of the</small><b>Walgreens Photo brochure</b></div></div>', '', '', f'<div class="l">{CXL}</div>{SH("#fff")}<div class="r"><div class="sv">Done</div></div>')
print('mc ok')
