from gen import CSS, I, page, top, live
CSS2 = CSS + '''
.prow{display:flex;align-items:center;gap:10px;border:2px solid #E0B26A;background:rgba(224,178,106,.14);border-radius:14px;padding:8px 10px}
.prow .t{flex:1;font-size:17px;font-weight:700}.prow .t small{display:block;font-weight:400;color:#cfc8bc;font-size:13px}
.prow .go{font-size:28px;color:#E0B26A;font-weight:300;padding:0 4px}
.strip{display:flex;gap:6px;margin-top:8px;align-items:center;font-size:13px;color:#cfc8bc}.strip img{width:40px;height:40px;border-radius:7px;object-fit:cover;border:1.5px solid #E0B26A}
.dest{position:absolute;bottom:104px;left:0;right:0;text-align:center;font-size:13px;color:#fff;padding:5px;background:rgba(0,0,0,.55)}
.dest b{color:#E0B26A}
.lbl{font-size:12px;font-weight:700;letter-spacing:.08em;color:#b3ab9e;margin:14px 0 6px}
.nameed{display:flex;gap:8px;align-items:center;border:2px solid #8CC4B2;border-radius:12px;padding:10px;font-size:17px;color:#fff}
.ai{position:absolute;left:24px;right:24px;top:150px;background:rgba(20,20,20,.62);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.35);border-radius:16px;padding:12px 14px;color:#fff}
.ai small{color:#ddd;font-size:13px}.ai b{font-size:19px;display:block;margin:2px 0 10px}
.ai .two .cta{margin:0;padding:9px;font-size:15px;background:rgba(0,0,0,.35)}
.ai .two .cta.fill{background:#8CC4B2}
'''
import gen; gen.CSS = CSS2
P = lambda n, b, c='': gen.page(n, b, c)
T = ('Where is the', 'Photo brochure?')
bar = lambda save='save': f'<div class="bar"><div class="pill">✕ Cancel</div><div class="sh"><i></i></div><div class="pill {save}">💾 Save</div></div>'
note = '<div class="add" style="margin-top:8px">＋ Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>'
dest = lambda nm: f'<div class="dest">📷 Photos go to <b>{nm}</b></div>'
# C1 Move it opens
P('C1', top(*T)+live('tooldrawer.jpg')+f'''<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>
<div class="prow"><img class="ph" src="{I}tooldrawer.jpg"><div class="t">Workbench or desk<small>where it is now · tap for what it’s in</small></div><div class="go">›</div></div>
<div class="fld" style="margin-top:10px">Somewhere else? Type or say the place <span>🎙</span></div>{note}</div>'''+dest('Workbench or desk')+bar('save off'))
# C2 photographed with existing place
P('C2', top(*T)+live('tooldrawer.jpg')+f'''<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>
<div class="prow"><img class="ph" src="{I}tooldrawer.jpg"><div class="t">Workbench or desk<small>where it is now · tap for what it’s in</small></div><div class="go">›</div></div>
<div class="strip"><img src="{I}tooldrawer.jpg">＋1 photo for the Workbench or desk</div>
<div class="fld" style="margin-top:10px">Somewhere else? Type or say the place <span>🎙</span></div>{note}</div>'''+dest('Workbench or desk')+bar())
# C3 typing: two clear sections
P('C3', top(*T)+f'''<div class="sheet" style="top:64px;bottom:290px;border-radius:0;padding-top:14px"><div class="fld on">lab desk|<span>✕</span></div>
<div class="lbl">ADD A NEW PLACE</div>
<div class="nameed"><span style="flex:1">Lab desk</span><span style="color:#8CC4B2;font-size:14px">✎ edit name</span></div>
<div class="cta fill" style="margin-top:8px">＋ Add “Lab desk” to my places</div>
<div class="lbl">OR PICK ONE OF YOUR PLACES · 15</div>
<div class="row"><img class="ph" src="{I}drawer.jpg"><b>Desk drawer<small>a place · 1 item</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="row"><img class="ph" src="{I}tooldrawer.jpg"><b>Workbench or desk<small>where it is now · 6 items</small></b><span style="color:#8CC4B2">Pick</span></div>
<div style="text-align:center;color:#b3ab9e;font-size:13px;margin-top:6px">scroll for all 15 ↓</div></div><div class="kb">keyboard</div>''')
# C4 new place set, replaces
P('C4', top(*T)+live('real_desk.jpg')+f'''<div class="panel" style="bottom:136px"><div class="q">Where is it now?</div>
<div class="prow"><div class="ph">📍</div><div class="t">Lab desk<span class="new">NEW</span><small>tap to rename or say what it’s in</small></div><div class="go">›</div></div>
<div class="was">Was: <s>Workbench or desk</s> · Undo</div>
<div style="font-size:14px;color:#E0B26A;margin-top:8px">Take a photo of the Lab desk (optional)</div>{note}</div>'''+dest('Lab desk (new)')+bar())
# C5 AI box on the photo
P('C5', top(*T)+live('real_desk.jpg')+f'''<div class="ai"><small>ReCall thinks this is</small><b>Lab bench with a laptop</b>
<div class="two"><div class="cta fill">Use this</div><div class="cta" style="color:#fff;border-color:#fff">Add to “Lab desk”</div></div>
<div style="text-align:center;font-size:13px;margin-top:8px;color:#ddd">✕ Keep “Lab desk”</div></div>
<div class="panel" style="bottom:136px"><div class="prow"><img class="ph" src="{I}real_desk.jpg"><div class="t">Lab desk<span class="new">NEW</span><small>tap to rename or say what it’s in</small></div><div class="go">›</div></div>
<div class="strip"><img src="{I}real_desk.jpg">1 photo for the Lab desk</div>{note}</div>'''+dest('Lab desk (new)')+bar())
# C6 levels sheet from the row
lv=f'''<div class="sheet"><div class="st">Where is it?</div>
<div class="lvl" style="border-color:#E0B26A"><img class="ph" src="{I}real_desk.jpg"><div class="t">Lab desk<span class="new">NEW</span><small>it’s on / in this</small></div><div class="c">Change</div></div>
<div class="in">which is in</div>
<div class="lvl"><img class="ph" src="{I}closet.jpg"><div class="t">Office<small>a place · 9 items</small></div><div class="c">Change</div></div>
<div class="in">which is in</div>
<div class="add" style="margin-left:0">＋ What is the Office in? <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>
<div class="two" style="margin-top:16px"><div class="cta">Cancel</div><div class="cta fill">Done</div></div></div>'''
P('C6', top(*T)+live('real_desk.jpg','opacity:.35')+lv)
P('C7', f'''<div class="hd"><span>‹</span>Photo brochure</div><div class="card"><img class="big" src="{I}folder.jpg"><div class="note">Note: “under the blue folder” · You · 12:39 PM</div></div>
<div class="card"><div class="lab">WHERE IT IS</div><div class="where"><img src="{I}real_desk.jpg"><div><b>Lab desk</b><small>in the Office</small><small>moved today 12:39 PM</small></div></div>
<div class="toast">✓ Moved just now <span>Was: Workbench or desk · <u style="color:#2F6B5E;font-weight:700">Undo</u></span></div><div class="mv">📍 Move it</div></div>''','page')
