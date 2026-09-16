import sys, re; root=sys.argv[1]
def rw(p,f):
    s=open(p).read(); n=f(s); assert n!=s,p; open(p,'w').write(n)
rw(f'{root}/06_Handoffs/DECISIONS.md', lambda s: s.replace("## 2026-09-16 (round 7c) —", """## 2026-09-16 (round 8) — Things, places, sightings: the thing card rebuilt; "earlier photos" retired; *place* everywhere

Design of record: `design/DESIGN_2026-09-16_things-places-sightings.md` (§2 model, §13 the
card as finally agreed, after seven rendered passes with Ravi) and `design/mockups/r8_T_*.png`.

**Model.** Thing, Place, Sighting (a photo of a thing at a place at a time). A place photo
is a property of the Place, never a sighting. A *stay* is the run of newest sightings at
the current place — derived from the sightings at read time, never stored; `logId` is still
written but nothing in the UI reads it. **A move (Edit → place) writes a sighting** — the
cover photo at the new place, now — so a new stay always has a photo and history never has
a row without one. Adding a place to a thing that had none is not a move.

**The card.** Title: chevron Back (36 px) · name, never wraps · lock icon if private; line 2,
tight: pin · current place · context — the current place lives up here so an older photo can
never sit under it in big type. Roll: sightings newest first, the current stay by default.
On each photo: the time bottom-left at a fixed 13 px on a 38 % black, blurred label (Ravi:
"a bit less dark"); the trash top-right at a fixed 36 px — nothing on a photo scales with the
text setting. Under a photo from another place: the place name only, amber, dashed pin, on
the same left edge as the title's pin. Dots + *n of m* when more than one. Three switches,
label left, switch right: *Keep this private* · *Show times on photos* (per phone) · *Show
earlier places (n)* (absent when nothing is earlier). Bar: *Add photo · Edit · Remove*.
Gone: the *Earlier* mode, *Where it has been*, *Not there? Earlier photos*, the when line,
the big place line under the photo, tap-to-expand.

**Time label formats** (`photoStamp`): *Today 5:52 PM* · *Sat 3:10 PM* · *Sep 5, 9:41 AM* ·
*Sep 5, 2024* — shorter as the photo ages, always one line.

**Words.** *Place* everywhere; the menu row and screen are *Places*; *Add a place*, *New
place*, *Remove this place*. (Ravi's 09-15 question, answered 09-16.)

**Parked, in the design note:** tidy-up (in Edit, in the thing's name, after this ships);
the *Usually on* row; the place hierarchy.

---

## 2026-09-16 (round 7c) —""",1))
def oi(s):
    s=s.replace("- [ ] **Deploy `20260916b`** from the Mac — 7c:", "- [ ] **Deploy `20260916c`** from the Mac — round 8: the thing card on the sightings model (title carries the place; fixed-size time label and trash on the photo; earlier places as a switch; three-button bar; *place*/*Places* everywhere); 7c:")
    s=s.replace("- [ ] Phone-check `20260916b`:", "- [ ] Phone-check `20260916c`: open a thing → chevron Back, name on one line, place · context tight under it; time label bottom-left of the photo (same size at Largest), trash top-right; *Keep this private* switch → lock appears beside the name; *Show earlier places (n)* only on things that moved → older photos show their place in amber under the photo, title unchanged; Edit → change the place → the roll shows one photo at the new place, earlier count grows by the old ones; hamburger says *Places*. Then the 7c/7b checks:")
    s=re.sub(r'git commit -m "Round 7 \+ 7b \+ 7c:', 'git commit -m "Round 8: thing card on things/places/sightings — title carries the place, fixed-size time + trash on the photo, earlier places switch, three-button bar, place everywhere; a move writes a sighting; round 7 + 7b + 7c:', s)
    return s
rw(f'{root}/06_Handoffs/OPEN_ITEMS.md', oi)
rw(f'{root}/CLAUDE.md', lambda s: s.replace("> **2026-09-16 — build `20260916b` is BUILT, NOT YET DEPLOYED** (7c:", "> **2026-09-16 — build `20260916c` is BUILT, NOT YET DEPLOYED** (round 8: the thing card rebuilt on the things/places/sightings model — `06_Handoffs/design/DESIGN_2026-09-16_things-places-sightings.md`; 7c:",1))
rw(f'{root}/06_Handoffs/LESSONS.md', lambda s: s.rstrip('\n')+"""
- **2026-09-16 — design in rendered passes, with the real stylesheet, until Ravi says "ready
  to go".** The thing card took seven passes (`design/mockups/r8_*.png`) and every one
  moved something he could only judge by looking: the toggles read as labels, the overlays
  cluttered, the Back button ate space, the pins did not align. Each pass was ~10 minutes in
  `rig/gen_r7.py`; the build was one pass. Never skip to code on a screen he has opinions
  about.
- **2026-09-16 — a `nowrap` line inside a flex page widens the page.** Flex items default to
  `min-width:auto`, so a no-wrap caption under a roll photo silently made the page wider
  than the strip and clipped the overlay. `.strip-page { min-width: 0; overflow: hidden }`.
  The mock caught it before the build did — one more reason to draw first.
- **2026-09-16 — measure the roll's page step; never assume it is the strip's width.** The
  pages are 86 % of the strip plus a gap; `scrollLeft / clientWidth` pointed the dots at
  the wrong page as soon as there were more than two. Read `children[1].offsetLeft -
  children[0].offsetLeft`.
""")
print('ok')
