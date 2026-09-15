# Runs on the Mac VM: edits OPEN_ITEMS.md, CLAUDE.md, LESSONS.md, RIG.md in place; prepends DECISIONS.
import re, sys, os
root = sys.argv[1]; head = open(sys.argv[2]).read()
def rw(p, f):
    s = open(p).read(); n = f(s); assert n != s, p; open(p, 'w').write(n)

# DECISIONS: prepend the round-7 entry after the format line
rw(f'{root}/06_Handoffs/DECISIONS.md', lambda s: s.replace("Format: date — decision — why — what would change our mind.\n\n", "Format: date — decision — why — what would change our mind.\n\n" + head, 1))

# OPEN_ITEMS
def open_items(s):
    s = s.replace("Updated 2026-09-14 (second phone round).", "Updated 2026-09-15 (round 7).")
    s = s.replace("- [ ] **Deploy `20260914p`** from the Mac (p:", """- [ ] **Deploy `20260915a`** from the Mac — round 7: when pill + Private on one line (no "this phone"
  anywhere; one toast shape both ways), amber pin badge for *no place yet* (tap → place field),
  *Text size & colours*, Locations as a list with photos → one-location screen (photos ≤3 via
  the camera, rename, things here, remove), *Add a location* = camera then name, "Where is it?"
  in three views with links, up to 4 shots per *Add photo* (log holds 6), the roll expands as
  one. Rig: 84/84. Screenshots Ravi reviewed: `06_Handoffs/design/mockups/r7f_combo_*.png`.
  Commands at the end of this file.
- [ ] Phone-check `20260915a`: open a private thing → clock pill left, lock + *Private* right on ONE
  line; tap *Private* → toast *Now shared · everyone at home sees it*; tap again → *Now private ·
  only you see it*. Home: a thing without a place has an amber pin badge top-right (and a private
  one keeps its lock too); tap it → card opens in Edit with the place field. Thing card → *Add
  photo* → the shutter allows 4 → Done → 5 dots. Tap the big photo → every page grows to the same
  height; swipe — no jump. Hamburger → *Text size & colours* (renamed). Hamburger → Locations →
  a list with pictures → *Add a location* → camera → 2 shots → Done → name → *Save this place* →
  row shows your photo. Tap it → photos + *Add photo* slot, rename with the pencil, *Remove this
  location* asks first. *Log item* → Where is it? shows *Smaller photos* automatically (a place has
  a photo) with the place's own photo beside its name; links *Names only* / *Bigger photos* switch
  and the choice sticks after a restart.
- [ ] **Camera permission on every launch** — iOS limit for home-screen web apps, no web fix
  (DECISIONS 2026-09-15). Decide on a native wrapper (Capacitor/TestFlight) in the multi-user
  session.
- [ ] Deploy `20260914p` from the Mac (p:""")
    # multi-user section → suspended
    a = s.index("## Multi-user — decided by three boards, staged (PLAN_2026-09-14_multi-user.md)")
    b = s.index("## Next build (board first, then code)")
    s = s[:a] + """## Multi-user — SUSPENDED 2026-09-15 (Ravi disagrees with the boards)

- [ ] **Ravi: run the use-case redefinition in a separate session** — paste
  `06_Handoffs/PROMPT_2026-09-15_multi-user-redefinition.md`. Until then nothing from
  `PLAN_2026-09-14_multi-user.md` (stages 0–4, the six splits, stage 0's hamburger question)
  is decided or built. Kept from that work: private = per person, not per device.
- [ ] On that session's agenda too: native wrapper (camera permission, remote install);
  *put it back* (the derived *Usually on* row was parked); the location hierarchy
  (`parent` reserved on place docs — DECISIONS 2026-09-15); place photos as AI reference
  images (the prompt's "known places" block is not built yet).

""" + s[b:]
    s = s.replace("## Done\n", "## Done\n\n- [x] 2026-09-15 — round 7 built and rig-audited (84/84); mockups → rulings → code.\n", 1)
    # deploy commands
    s = re.sub(r'git add -A && git commit -m "[^"]*" && git push origin main',
      'git add -A && git commit -m "Round 7: when pill + Private on one line, one toast shape (private = per person, never \'this phone\'); pin badge for no place yet; Text size & colours; Locations list with place photos + one-location screen; Where is it? in three views; 4 shots per Add photo; roll expands as one; multi-user plan suspended + redefinition prompt; docs" && git push origin main', s)
    return s
rw(f'{root}/06_Handoffs/OPEN_ITEMS.md', open_items)

# CLAUDE.md status
def claude_md(s):
    return s.replace("> **2026-09-14 — v0.2 is LIVE (stamp `20260905l`); build `20260914p` is BUILT, NOT YET\n> DEPLOYED**",
      "> **2026-09-15 — build `20260915a` is BUILT, NOT YET DEPLOYED** (round 7, `06_Handoffs/design/BOARD_2026-09-15_round7.md`: mockups → Ravi's rulings → code; when pill + Private on one line; private = per person; pin badge for *no place yet*; *Text size & colours*; Locations with place photos; *Where is it?* in three views; 4 shots per Add photo; **multi-user plan SUSPENDED** — Ravi disagrees with the boards; redefine in a separate session with `06_Handoffs/PROMPT_2026-09-15_multi-user-redefinition.md`). **Earlier: 2026-09-14 — v0.2 is LIVE (stamp `20260905l`); build `20260914p`**", 1)
rw(f'{root}/CLAUDE.md', claude_md)

# LESSONS
def lessons(s):
    return s.rstrip('\n') + """
- **2026-09-15 — when Ravi says "I have no clue what you are suggesting", the fix is a
  picture with the thing circled, not a longer paragraph.** Two of four questions in round 7
  came back that way (the "age pill", the "Lives on" row). A second sheet with the element
  arrowed and one sentence of *why* got clear rulings in one pass. Explain in his words,
  show it on the real stylesheet, ask again.
- **2026-09-15 — check an attachment is what it claims before spending time on it.** The
  "phone video" in round 7 was a 6½-minute desktop recording of an unrelated web app. Pull
  a contact sheet of frames first (ffmpeg, 1 frame / 8 s) and say so if it does not match.
- **2026-09-15 — "only this phone" was the wrong model, not just the wrong words.** Private
  is per person across all their devices. Write user-facing strings from the person's point
  of view, and keep one string per state in one place (`VISIBILITY_TOAST`) so three call
  sites cannot drift — Ravi called the drift "terrible and inconsistent".
- **2026-09-15 — the approach note before the build worked.** Options rendered from the
  real stylesheet, board positions and splits written down, his rulings via one question
  set, then code: no regressions, no "what crap". Keep the order: bugs fixed outright,
  everything that moves a control waits for a ruling.
"""
rw(f'{root}/06_Handoffs/LESSONS.md', lessons)

# RIG.md
p = f'{root}/06_Handoffs/RIG.md'
if os.path.exists(p):
    rw(p, lambda s: s.rstrip('\n') + """

## Mockups from the stylesheet (round 7)

`rig/gen_r7.py` writes option pages into `rig/mock/` using the app's `out/styles.css` plus a
few mock-only rules; `rig/render_r7.js` screenshots each at 390×844 (full page) into
`shots/`; a short PIL script composes them side by side into one PNG for Ravi. Label bar at
the top of each page says which option it is. Copy the pattern for the next round.
`rig/shots_r7.js` is the post-build review script (seeds private / no-place things and a
place with photos, walks every new screen, both themes).
""")
print('docs ok')
