# ReCall name screen (2026-09-24). A knock-out screen, NOT a trademark clearance.
# Usage: python3 name_check.py Wherly Thingspot ...   -> name_checks.json + a one-line summary per name.
# Checks: USPTO live marks (the tmsearch.uspto.gov backend, prod-stage-v1-0-0/tmsearch), the App Store
# (itunes.apple.com/search, US), RDAP for .com/.app/get<name>.com/<name>app.com (404 = unregistered).
# Google Play blocks automated search (robots.txt): check finalists by hand. Reachable from the cloud sandbox.
import json, re, subprocess, sys, time, urllib.parse
NAMES = sys.argv[1:] or ["Wherly","Kiply","Stowly","Magpie","Cubby","Cairn","Hither","Whereabouts","Trove","Kept","Loci",
         "Tuckit","Tuckbox","Wherebox","Refind","Retrace","Remy","ReCall"]
def curl(args):
    return subprocess.run(["curl","-s","-m","25"]+args,capture_output=True,text=True).stdout
def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
out={}
for n in NAMES:
    r={"name":n}
    # USPTO
    q={"query":{"bool":{"must":[{"bool":{"should":[{"match_phrase":{"WM":{"query":n}}},{"match":{"WM":{"query":n,"fuzziness":1}}},{"wildcard":{"WM":{"value":n.lower()+"*"}}}]}},{"term":{"LD":"true"}}]}},"size":200,
       "_source":["wordmark","id","registrationId","statusDescription","ownerName","internationalClass","filedDate","goodsAndServices","registered"]}
    raw=curl(["-X","POST","https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch","-H","Content-Type: application/json","-H","Origin: https://tmsearch.uspto.gov","-H","User-Agent: Mozilla/5.0","-d",json.dumps(q)])
    tm=[]
    try:
        d=json.loads(raw)
        for h in d["hits"]["hits"]:
            s=h["source"]; wm=s.get("wordmark") or ""
            cls=[c.replace("IC ","") for c in (s.get("internationalClass") or [])]
            tm.append({"wm":wm,"serial":s.get("id"),"reg":s.get("registrationId"),"status":s.get("statusDescription"),
                       "owner":(s.get("ownerName") or [""])[0][:80],"classes":cls,"filed":(s.get("filedDate") or "")[:10],
                       "exact":norm(wm)==norm(n),"contains":norm(n) in norm(wm),
                       "gs":" | ".join(s.get("goodsAndServices") or [])[:300]})
        r["tm_total_live"]=d["hits"]["totalValue"]
    except Exception as e:
        r["tm_error"]=str(e)+raw[:200]
    r["tm"]=tm
    # App Store
    raw=curl([f"https://itunes.apple.com/search?term={urllib.parse.quote(n)}&entity=software&country=us&limit=50"])
    apps=[]
    try:
        for a in json.loads(raw)["results"]:
            t=a["trackName"]
            if norm(t).startswith(norm(n)) or norm(n) in norm(t)[:len(norm(n))+3]:
                apps.append({"name":t,"seller":a.get("sellerName"),"url":a["trackViewUrl"].split("?")[0],"genre":a.get("primaryGenreName"),
                             "exact":norm(re.split(r'[:\-–—|]',t)[0])==norm(n)})
    except Exception as e: r["app_error"]=str(e)
    r["apps"]=apps
    # Domains (RDAP)
    dom={}
    for label,url in [(f"{n.lower()}.com",f"https://rdap.verisign.com/com/v1/domain/{n.lower()}.com"),
                      (f"{n.lower()}.app",f"https://pubapi.registry.google/rdap/domain/{n.lower()}.app"),
                      (f"get{n.lower()}.com",f"https://rdap.verisign.com/com/v1/domain/get{n.lower()}.com"),
                      (f"{n.lower()}app.com",f"https://rdap.verisign.com/com/v1/domain/{n.lower()}app.com")]:
        code=subprocess.run(["curl","-s","-o","/dev/null","-w","%{http_code}","-m","20",url],capture_output=True,text=True).stdout
        dom[label]={"200":"registered","404":"unregistered"}.get(code,"?"+code)
    r["domains"]=dom
    out[n]=r
    print(n, "TM live hits:",r.get("tm_total_live"), "apps:",len(apps), dom, file=sys.stderr)
    time.sleep(0.5)
json.dump(out,open("name_checks.json","w"),indent=1)
