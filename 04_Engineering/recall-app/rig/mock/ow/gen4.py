import re, gen2, gen
from gen import I, live
L='/home/claude/rig/node_modules/lucide-static/icons/'
def ic(n, s=20, c='currentColor', sw=2):
    t=open(L+n+'.svg').read(); t=re.sub(r'<!--.*?-->','',t,flags=re.S)
    t=re.sub(r'class="[^"]*"','',t).replace('width="24"',f'width="{s}"').replace('height="24"',f'height="{s}"').replace('stroke="currentColor"',f'stroke="{c}"').replace('stroke-width="2"',f'stroke-width="{sw}"')
    return f'<span style="display:inline-flex;vertical-align:-0.18em">{t.strip()}</span>'
gen.CSS += '''
.wf{display:flex;align-items:center;gap:8px;border:2px solid #E0B26A;background:rgba(224,178,106,.12);border-radius:14px;padding:6px 6px 6px 8px}
.wf.dash{border-style:dashed;border-width:2.5px}
.wf .v{flex:1;font-size:18px;font-weight:700;color:#fff}
.wf .arr{width:48px;height:48px;border-radius:12px;background:#E0B26A;color:#1F1D1A;display:flex;align-items:center;justify-content:center;flex:none}
.q .par{font-weight:600;font-style:italic;color:#E0B26A;font-size:15px}
.q .par.was{color:#cfc8bc}
.hint{font-size:13px;color:#cfc8bc;margin:6px 2px 0}.hint b{color:#8CC4B2}
.sf{display:flex;align-items:center;gap:8px;border:2px solid #8CC4B2;border-radius:12px;padding:8px 10px;font-size:18px;font-weight:700}
.pill{display:flex;align-items:center;gap:6px}
'''
P=gen.page
top=lambda: f'<div class="top"><img src="{I}folder.jpg"><div><small>Where is the</small><b>Photo brochure?</b></div></div>'
bar=lambda save='save': f'<div class="bar"><div class="pill">{ic("x",18)} Cancel</div><div class="sh"><i></i></div><div class="pill {save}">{ic("save",18)} Save</div></div>'
dest=lambda nm,b=104: f'<div class="dest" style="bottom:{b}px">{ic("camera",15)} Photos go to <b>{nm}</b></div>'
note=f'<div class="add" style="margin-top:10px">{ic("plus",16)} Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>'
pin=f'<div class="ph">{ic("map-pin",22,"#E0B26A")}</div>'
def wf(v, thumb=None, dash=False): return f'<div class="wf {"dash" if dash else ""}">{f"<img class=ph src={I}{thumb}>" if thumb else pin}<div class="v">{v}</div><div class="arr">{ic("arrow-right",24,"#1F1D1A",2.5)}</div></div>'
H1='<div class="q">Where is it now? <span class="par">(type to set new place)</span></div>'
HN=lambda was='Workbench or desk', new=True: f'<div class="q">Set {"NEW " if new else ""}place. <span class="par was">(previously was: {was})</span></div>'
ai=lambda: f'''<div class="ai" style="top:130px"><small>ReCall thinks this is</small><b>Lab bench with a laptop</b>
<div class="two"><div class="cta fill">Use this</div><div class="cta" style="color:#fff;border-color:#fff">Append to mine</div></div>
<div style="text-align:center;font-size:13px;margin-top:8px;color:#ddd">{ic("x",13,"#ddd")} Not this</div></div>'''
P('E1', top()+live('tooldrawer.jpg')+f'<div class="panel" style="bottom:136px">{H1}{wf("Workbench or desk","tooldrawer.jpg")}{note}</div>'+dest('Workbench or desk')+bar('save off'))
P('E2', top()+live('real_desk.jpg')+f'''<div class="panel" style="bottom:296px">{HN()}{wf("lab desk|",None,True)}
<div class="hint">2 of your places have “desk” — <b>{ic("arrow-right",13,"#8CC4B2")} to see them</b></div></div>'''+dest('Lab desk (new)',268)+'<div class="kb" style="height:268px;padding-top:110px">keyboard</div>')
P('E3', top()+live('real_desk.jpg')+ai()+f'<div class="panel" style="bottom:136px">{HN()}{wf("Lab desk","real_desk.jpg",True)}{note}</div>'+dest('Lab desk (new)')+bar())
P('E4', top()+live('real_desk.jpg')+f'<div class="panel" style="bottom:136px">{HN()}{wf("Lab desk · Lab bench with a laptop","real_desk.jpg",True)}{note}</div>'+dest('Lab desk · Lab bench with a laptop (new)')+bar())
P('E5', top()+live('real_desk.jpg','opacity:.3')+f'''<div class="sheet" style="top:96px"><div class="st">Where is it?</div>
<div class="sf"><img class="ph" src="{I}real_desk.jpg"><span style="flex:1">Lab desk</span><span class="new">NEW</span><span style="color:#8CC4B2;margin-left:6px">{ic("pencil",18,"#8CC4B2")}</span></div>
<div class="in" style="margin-left:22px">which is in</div>
<div class="add" style="margin-top:6px">{ic("plus",16)} What is the Lab desk in? <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>
<div class="lbl">OR PICK ONE OF YOUR PLACES INSTEAD · 15</div>
<div class="row"><img class="ph" src="{I}drawer.jpg"><b>Desk drawer<small>a place · 1 item</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="row"><img class="ph" src="{I}tooldrawer.jpg"><b>Workbench or desk<small>where it was · 6 items</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="row"><img class="ph" src="{I}closet.jpg"><b>Office<small>a place · 9 items</small></b><span style="color:#8CC4B2">Pick</span></div>
<div class="two" style="margin-top:12px"><div class="cta">Cancel</div><div class="cta fill">Done</div></div></div>''')
P('E6', top()+live('drawer.jpg')+f'<div class="panel" style="bottom:136px">{HN(new=False)}{wf("Desk drawer","drawer.jpg",True)}{note}</div>'+dest('Desk drawer')+bar())
P('E7', f'''<div class="hd"><span style="display:flex;align-items:center;justify-content:center">{ic("chevron-left",20,"#3A3630")}</span>Photo brochure</div><div class="card"><img class="big" src="{I}folder.jpg"><div class="note">Note: “under the blue folder” · You · 12:39 PM</div></div>
<div class="card"><div class="lab">WHERE IT IS</div><div class="where"><img src="{I}real_desk.jpg"><div><b>Lab desk</b><small>in the Office</small><small>moved today 12:39 PM</small></div></div>
<div class="toast">{ic("check",16,"#2F6B5E")} Moved just now <span>Was: Workbench or desk · <u style="color:#2F6B5E;font-weight:700">Undo</u></span></div><div class="mv">{ic("map-pin",18,"#2F6B5E")} Move it</div></div>''','page')
