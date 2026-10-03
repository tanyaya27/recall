import gen2, gen
from gen import I, top, live
P = gen.page
T = ('Where is the', 'Photo brochure?')
bar = lambda save='save': f'<div class="bar"><div class="pill">✕ Cancel</div><div class="sh"><i></i></div><div class="pill {save}">💾 Save</div></div>'
dest = lambda nm, b=104: f'<div class="dest" style="bottom:{b}px">📷 Photos go to <b>{nm}</b></div>'
note = '<div class="add" style="margin-top:8px">＋ Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>'
gen.CSS += '''
.wf{display:flex;align-items:center;gap:8px;border:2px solid #E0B26A;background:rgba(224,178,106,.12);border-radius:14px;padding:6px 6px 6px 8px}
.wf .v{flex:1;font-size:18px;font-weight:700;color:#fff}.wf .v.ty{font-weight:600}
.wf .arr{width:48px;height:48px;border-radius:12px;background:#E0B26A;color:#1F1D1A;font-size:24px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none}
.stat{font-size:13px;color:#cfc8bc;margin:6px 2px 0;line-height:1.35}.stat b{color:#E0B26A}.stat u{color:#8CC4B2;font-weight:700;text-decoration:none}
.sf{display:flex;align-items:center;gap:8px;border:2px solid #8CC4B2;border-radius:12px;padding:8px 10px;font-size:18px;font-weight:700}
'''
wf = lambda v, thumb=None, ty=False: f'''<div class="wf">{f'<img class="ph" src="{I}{thumb}">' if thumb else '<div class="ph">📍</div>'}<div class="v {"ty" if ty else ""}">{v}</div><div class="arr">→</div></div>'''
# D1 opens
P('D1', top(*T)+live('tooldrawer.jpg')+f'''<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>
{wf('Workbench or desk','tooldrawer.jpg')}
<div class="stat">Where it is now. <u>Type over it</u> for somewhere else, or → to pick, or for what it’s in.</div>{note}</div>'''+dest('Workbench or desk',104)+bar('save off'))
# D2 typing inline, keyboard up
P('D2', top(*T)+live('real_desk.jpg')+f'''<div class="panel" style="bottom:296px"><div class="q">Where is it now?</div>
{wf('lab desk|',None,True)}
<div class="stat"><b>NEW place</b> — added to your places when you Save. Was: Workbench or desk.<br>2 of your places have “desk” — <u>→ to see them</u></div></div>'''+dest('Lab desk (new)',268)+'<div class="kb" style="height:268px;padding-top:110px">keyboard</div>')
# D3 photo taken, AI guess on it
P('D3', top(*T)+live('real_desk.jpg')+f'''<div class="ai" style="top:130px"><small>ReCall thinks this is</small><b>Lab bench with a laptop</b>
<div class="two"><div class="cta fill">Use this</div><div class="cta" style="color:#fff;border-color:#fff">Add to mine</div></div>
<div style="text-align:center;font-size:13px;margin-top:8px;color:#ddd">✕ Not this</div></div>
<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>{wf('Lab desk','real_desk.jpg')}
<div class="stat"><b>NEW place</b> · 1 photo of it · Was: Workbench or desk · <u>Undo</u></div>{note}</div>'''+dest('Lab desk (new)')+bar())
# D4 the → sheet: one name, levels, pick
P('D4', top(*T)+live('real_desk.jpg','opacity:.3')+f'''<div class="sheet" style="top:96px"><div class="st">Where is it?</div>
<div class="sf"><img class="ph" src="{I}real_desk.jpg"><span style="flex:1">Lab desk</span><span class="new">NEW</span><span style="color:#8CC4B2;font-size:14px;margin-left:6px">✎</span></div>
<div class="in" style="margin-left:22px">which is in</div>
<div class="add" style="margin-top:6px">＋ What is the Lab desk in? <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>
<div class="lbl">OR PICK ONE OF YOUR PLACES INSTEAD · 15</div>
<div class="row"><img class="ph" src="{I}drawer.jpg"><b>Desk drawer<small>a place · 1 item</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="row"><img class="ph" src="{I}tooldrawer.jpg"><b>Workbench or desk<small>where it was · 6 items</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="row"><img class="ph" src="{I}closet.jpg"><b>Office<small>a place · 9 items</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="two" style="margin-top:12px"><div class="cta">Cancel</div><div class="cta fill">Done</div></div></div>''')
# D5 typed an existing name: it links, no duplicate
P('D5', top(*T)+live('drawer.jpg')+f'''<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>{wf('Desk drawer','drawer.jpg')}
<div class="stat">One of your places · 1 item · Was: Workbench or desk · <u>Undo</u></div>{note}</div>'''+dest('Desk drawer')+bar())
