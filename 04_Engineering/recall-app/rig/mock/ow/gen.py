import os
I='../img/'
CSS='''*{box-sizing:border-box;margin:0;padding:0}body{width:390px;height:844px;overflow:hidden;font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#111;color:#F1ECE3;position:relative}
.top{height:64px;background:#000;display:flex;align-items:center;gap:10px;padding:0 12px}.top img{width:44px;height:44px;border-radius:9px;object-fit:cover;border:2px solid #fff}
.top small{display:block;font-size:13px;color:#cfc8bc}.top b{font-size:17px}
.live{position:absolute;top:64px;left:0;right:0;bottom:104px;background-size:cover;background-position:center;filter:saturate(.9)}
.bar{position:absolute;bottom:0;left:0;right:0;height:104px;background:#000;display:flex;align-items:center;justify-content:space-between;padding:0 14px}
.pill{border:1.5px solid #555;border-radius:14px;padding:12px 14px;font-weight:600;font-size:16px;background:#1d1b19}
.save{background:#2F6B5E;border-color:#2F6B5E;color:#fff}.save.off{opacity:.45}
.sh{width:76px;height:76px;border-radius:50%;border:5px solid #fff;display:flex;align-items:center;justify-content:center}.sh i{width:58px;height:58px;border-radius:50%;background:#fff;display:block}
.sh.pl{border-color:#E0B26A}
.panel{position:absolute;left:10px;right:10px;bottom:112px;background:rgba(38,35,31,.95);border-radius:18px;padding:14px;border:1px solid #3a362f}
.q{font-weight:700;font-size:16px;margin-bottom:10px}
.fld{background:#2d2a26;border:1.5px solid #555;border-radius:12px;padding:12px;font-size:16px;color:#bbb;display:flex;justify-content:space-between;align-items:center}.fld.on{border-color:#8CC4B2;color:#fff}
.chip{display:flex;align-items:center;gap:10px;border:2px solid #E0B26A;background:rgba(224,178,106,.14);border-radius:14px;padding:8px 10px;margin-top:10px}
.chip img,.ph{width:46px;height:46px;border-radius:9px;object-fit:cover;background:#3a362f;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
.chip .t{flex:1;font-size:16px;font-weight:700}.chip .t small{display:block;font-weight:400;color:#cfc8bc;font-size:13px}.chip .x{width:34px;height:34px;border-radius:50%;background:#4a443c;text-align:center;line-height:34px}
.new{background:#E0B26A;color:#1F1D1A;font-size:11px;font-weight:800;border-radius:6px;padding:2px 5px;margin-left:6px;vertical-align:2px}
.was{font-size:13px;color:#b3ab9e;margin:6px 2px 0}.was s{color:#b3ab9e}
.row{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #3a362f;font-size:16px}.row b{flex:1}.row small{color:#b3ab9e;font-size:13px;display:block;font-weight:400}
.add{border:1.5px dashed #6b645a;border-radius:12px;padding:11px;margin-top:10px;font-size:15px;color:#e8e2d8;font-weight:600}
.cta{border:2px solid #8CC4B2;color:#8CC4B2;border-radius:12px;padding:11px;font-weight:700;font-size:16px;text-align:center;margin-top:10px}
.cta.fill{background:#8CC4B2;color:#1F1D1A}
.two{display:flex;gap:8px}.two>*{flex:1}
.sheet{position:absolute;left:0;right:0;bottom:0;background:#26231f;border-radius:20px 20px 0 0;padding:18px 16px 20px;border-top:1px solid #3a362f}
.st{font-size:21px;font-weight:700;margin-bottom:10px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}.grid div{font-size:13px;font-weight:600}.grid img{width:100%;height:92px;object-fit:cover;border-radius:10px;display:block;margin-bottom:4px}
.lvl{display:flex;align-items:center;gap:10px;border:1.5px solid #4a443c;border-radius:14px;padding:8px 10px;margin-top:8px}.lvl .t{flex:1;font-weight:700;font-size:16px}.lvl .t small{display:block;color:#b3ab9e;font-weight:400;font-size:13px}.lvl .c{color:#8CC4B2;font-weight:700;font-size:15px}
.in{font-size:12px;color:#b3ab9e;margin:6px 0 0 22px}
.kb{position:absolute;left:0;right:0;bottom:0;height:290px;background:#cfd2d8;border-top:1px solid #aaa;color:#555;font-size:14px;text-align:center;padding-top:120px}
.page{background:#F6F1E8;color:#3A3630}.page .hd{height:64px;display:flex;align-items:center;gap:12px;padding:0 16px;font-size:22px;font-weight:700}.page .hd span{width:36px;height:36px;border:1px solid #E6DFD2;border-radius:10px;text-align:center;line-height:34px;font-size:18px}
.card{background:#FFFDF9;border-radius:18px;margin:0 14px 12px;padding:12px;box-shadow:0 2px 10px rgba(58,54,48,.07)}
.big{width:100%;height:220px;object-fit:cover;border-radius:12px;display:block}
.lab{font-size:12px;font-weight:700;letter-spacing:.08em;color:#7A7369;margin-bottom:8px}
.where{display:flex;gap:12px;align-items:center}.where img{width:96px;height:96px;border-radius:12px;object-fit:cover}.where b{font-size:20px;display:block}.where small{color:#7A7369;font-size:14px;display:block;margin-top:2px}
.note{font-size:14px;color:#7A7369;margin-top:8px;font-style:italic}
.mv{background:#E4EEEA;color:#2F6B5E;font-weight:700;text-align:center;border-radius:14px;padding:13px;margin-top:12px;font-size:17px}
.toast{background:#E4EEEA;border:1px solid #b9d3ca;border-radius:12px;padding:10px 12px;margin-top:10px;color:#2F6B5E;font-weight:700;display:flex;justify-content:space-between;font-size:15px}.toast span{font-weight:400;color:#3A3630}
.pair{display:flex;gap:8px}.pair div{flex:1;font-size:13px;color:#7A7369;text-align:center}.pair img{width:100%;height:150px;object-fit:cover;border-radius:12px;display:block;margin-bottom:4px}
.ask{background:#FFFDF9;border-radius:18px;margin:0 14px;padding:14px}.ask .f{border:2.5px solid #2F6B5E;border-radius:14px;padding:12px;font-size:19px}
.res{display:flex;gap:10px;margin-top:12px}.res img{width:110px;height:110px;border-radius:12px;object-fit:cover}
'''
def page(name,body,cls=''):
    open(name+'.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body class="{cls}">{body}</body></html>')
top=lambda s,t,img='folder.jpg': f'<div class="top"><img src="{I}{img}"><div><small>{s}</small><b>{t}</b></div></div>'
bar=lambda save='save',sh='': f'<div class="bar"><div class="pill">✕ Cancel</div><div class="sh {sh}"><i></i></div><div class="pill {save}">💾 Save</div></div>'
live=lambda f,o='': f'<div class="live" style="background-image:url({I}{f});{o}"></div>'
T='Where is the','Photo brochure?'
# ---------- A
page('A1', top(*T)+live('folder.jpg')+f'''<div class="panel"><div class="q">Photograph it where it is now. Then: which place?</div>
<div class="fld">Which place? Type or say a place <span>🎙</span></div>
<div class="chip"><img src="{I}tooldrawer.jpg"><div class="t">Now: Workbench or desk<small>a place · tap to change, or to see what it’s in</small></div></div>
<div class="add">＋ Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div></div>'''+bar('save off'))
page('A2', top(*T)+live('folder.jpg')+f'''<div class="panel" style="bottom:300px"><div class="fld on">lab desk|<span>✕</span></div>
<div class="cta" style="text-align:left">＋ New place: <b>Lab desk</b></div>
<div class="row"><div class="ph">📍</div><b>Desk drawer<small>a place · 1 item</small></b></div>
<div class="row" style="border:0"><img class="ph" src="{I}tooldrawer.jpg"><b>Workbench or desk<small>where it is now</small></b></div></div><div class="kb">keyboard</div>''')
page('A3', top(*T)+live('folder.jpg')+f'''<div class="panel"><div class="q">Where is it now?</div>
<div class="chip"><div class="ph">📍</div><div class="t">Lab desk<span class="new">NEW</span><small>a place · tap to change, or what it’s in</small></div><div class="x">✕</div></div>
<div class="was">Was: <s>Workbench or desk</s></div>
<div class="cta">📷 Photograph the Lab desk?</div><div style="text-align:center;font-size:14px;color:#b3ab9e;margin-top:6px">Not now</div>
<div class="add">＋ Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div></div>'''+bar())
# ---------- shared levels sheet
lv=f'''<div class="sheet"><div class="st">Where is it?</div>
<div class="lvl"><img class="ph" src="{I}real_desk.jpg"><div class="t">Lab desk<span class="new">NEW</span><small>it’s on / in this</small></div><div class="c">Change</div></div>
<div class="in">which is in</div>
<div class="lvl"><img class="ph" src="{I}closet.jpg"><div class="t">Office<small>a place · 9 items</small></div><div class="c">Change</div></div>
<div class="in">which is in</div>
<div class="add" style="margin-left:0">＋ What is the Office in? <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>
<div class="two" style="margin-top:16px"><div class="cta">Cancel</div><div class="cta fill">Done</div></div></div>'''
page('A4', top(*T)+live('folder.jpg','opacity:.35')+lv)
page('S5', top(*T)+live('real_desk.jpg','opacity:.35')+lv)
# ---------- item pages
pg=lambda pair: f'''<div class="hd"><span>‹</span>Photo brochure</div><div class="card">{pair}<div class="note">Note: “under the blue folder” · You · 12:39 PM</div></div>
<div class="card"><div class="lab">WHERE IT IS</div><div class="where"><img src="{I}real_desk.jpg"><div><b>Lab desk</b><small>in the Office</small><small>moved today 12:39 PM</small></div></div>
<div class="toast">✓ Moved just now <span>Was: Workbench or desk · <u style="color:#2F6B5E;font-weight:700">Undo</u></span></div><div class="mv">📍 Move it</div></div>'''
page('A5', pg(f'<img class="big" src="{I}folder.jpg">'),'page')
page('B5', pg(f'<div class="pair"><div><img src="{I}folder.jpg">the brochure</div><div><img src="{I}real_desk.jpg">where it was · 12:39</div></div>'),'page')
# ---------- B
page('B1', top(*T)+live('real_desk.jpg')+f'''<div class="panel"><div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><img class="ph" src="{I}folder.jpg"><div style="font-size:14px;color:#cfc8bc">✓ 1 photo of the brochure</div></div>
<div class="q" style="font-size:19px;color:#E0B26A">Now photograph where it is</div><div style="font-size:14px;color:#cfc8bc">Step back so the place shows.</div>
<div class="two" style="margin-top:10px"><div class="add" style="margin:0;text-align:center">Skip — pick a place</div><div class="add" style="margin:0;text-align:center">＋ Note</div></div></div>'''+bar('save off','pl'))
page('B2', top(*T)+live('real_desk.jpg','opacity:.3')+f'''<div class="sheet" style="top:120px"><div style="display:flex;gap:10px;align-items:center"><img src="{I}real_desk.jpg" style="width:96px;height:96px;border-radius:12px;object-fit:cover"><div class="st" style="margin:0">Which place is this?</div></div>
<div class="fld" style="margin-top:12px">New place — type or say its name <span>🎙</span></div>
<div style="font-size:12px;font-weight:700;letter-spacing:.08em;color:#b3ab9e;margin-top:14px">YOUR PLACES · RECENT FIRST</div>
<div class="grid"><div><img src="{I}tooldrawer.jpg">Workbench or desk<br><span style="color:#E0B26A;font-weight:400">now</span></div><div><img src="{I}drawer.jpg">Desk drawer</div><div><img src="{I}closet.jpg">Office</div>
<div><img src="{I}box.jpg">White cardboard box</div><div><img src="{I}real_painting.jpg">White book shelf</div><div><img src="{I}real_slippers.jpg">Hall closet</div></div></div>''')
page('B3', top(*T)+live('real_desk.jpg','opacity:.35')+f'''<div class="panel"><div class="q">Where is it now?</div>
<div class="chip"><img src="{I}real_desk.jpg"><div class="t">Lab desk<span class="new">NEW</span><small>your photo of it · tap to change, or what it’s in</small></div><div class="x">✕</div></div>
<div class="was">Was: <s>Workbench or desk</s></div>
<div class="add">＋ What is the Lab desk in? <span style="color:#b3ab9e;font-weight:400">(optional)</span></div>
<div class="add">＋ Add a note <span style="color:#b3ab9e;font-weight:400">(optional)</span></div></div>'''+bar())
# ---------- Find (shared)
page('S6', f'''<div class="hd"><span>‹</span>Find item</div><div class="ask"><div style="font-size:19px;font-weight:700;margin-bottom:10px">Where is my…</div><div class="f">brochure</div>
<div class="res"><img src="{I}folder.jpg"><img src="{I}real_desk.jpg"></div><div style="font-size:18px;font-weight:700;margin-top:8px">Photo brochure</div>
<div style="color:#7A7369">Lab desk · in the Office · moved today</div></div>''','page')
