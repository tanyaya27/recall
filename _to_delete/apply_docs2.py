import sys, re; root=sys.argv[1]
def rw(p,f):
    s=open(p).read(); n=f(s); assert n!=s,p; open(p,'w').write(n)
rw(f'{root}/06_Handoffs/LESSONS.md', lambda s: s.rstrip('\n')+"""
- **2026-09-16 — bump BOTH cache stamps: `app.js?v=` AND `styles.css?v=` in `docs/index.html`.**
  Round 7 shipped new JS with the old stylesheet — giant Locations pictures, an unstyled
  pin, a misaligned clock — three of Ravi's four "5/10" items were one missed sed. The
  deploy block in OPEN_ITEMS now bumps both; the rig can't catch this (it has no cache).
- **2026-09-16 — a faked timestamp always surfaces.** `addSnapToLog` set a photo's time to
  the log's time ("same place, same time") so photos added days later showed the wrong day
  and the when line never changed while swiping. Store the real time; derive grouping from
  `logId`, never from a made-up `at`.
""")
rw(f'{root}/06_Handoffs/DECISIONS.md', lambda s: s.replace("## 2026-09-15 (round 7) —", """## 2026-09-16 (round 7b) — Ravi's 5/10: flipped label instead of the pin badge; real photo times; AM/PM; pin on the place line

Three of the four complaints were one deploy mistake — `styles.css?v=` was not bumped, so
the phone ran round-7 JS with the 09-14 stylesheet (huge Locations pictures, an unstyled pin,
the clock not centred). Fixed by bumping both stamps (LESSONS). The rulings that stand:

- **No place: no badge.** The tile's label block flips to reverse colours (amber block,
  card-coloured text) and says **No place assigned**. The pin badge is gone.
- **The place line carries a pin** (aligned to the text) on the thing card, including
  *No place assigned*.
- **Times keep AM/PM** — *today, 1:09 PM*, *yesterday, 6:40 PM*, then the weekday, then the
  date. "this afternoon, 1:09" (no AM/PM) was "terrible".
- **A photo added to a log keeps its real capture time**, so the when line changes as the
  roll is swiped. The 09-14 "same time as the log" shortcut is reversed; photos added
  before 09-16 still carry the log's time and cannot be recovered.

---

## 2026-09-15 (round 7) —""",1))
def oi(s):
    s=s.replace("- [ ] **Deploy `20260915a`** from the Mac — round 7:", "- [ ] **Deploy `20260916a`** from the Mac — round 7b fixes (flipped *No place assigned* label, pin on the place line, AM/PM, real photo times, BOTH stamps bumped) on top of round 7:")
    s=s.replace("- [ ] Phone-check `20260915a`: open a private thing → clock pill left, lock + *Private* right on ONE\n  line;", "- [ ] Phone-check `20260916a`: Locations rows have SMALL square pictures (if still huge, hard-refresh — the stylesheet stamp). A thing without a place: amber label block reading *No place assigned*; card shows a pin before the place line. Open a private thing → clock pill (icon centred) left, lock + *Private* right on ONE line; time reads *today, 1:09 PM*; add a photo, swipe to it → the time changes;")
    s=re.sub(r'git commit -m "Round 7:', 'git commit -m "Round 7 + 7b: No place assigned label, pin on the place line, AM\\/PM, real photo times, both cache stamps;', s)
    return s
rw(f'{root}/06_Handoffs/OPEN_ITEMS.md', oi)
rw(f'{root}/CLAUDE.md', lambda s: s.replace("> **2026-09-15 — build `20260915a` is BUILT, NOT YET DEPLOYED**", "> **2026-09-16 — build `20260916a` is BUILT, NOT YET DEPLOYED** (round 7b: Ravi's four fixes — see DECISIONS; both cache stamps now bumped)",1))
print('ok')
