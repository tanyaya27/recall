# Open items

Running list of outstanding to-dos. Newest at the top of each section; strike or move to
*Done* when closed. Updated 2026-09-14 (second phone round).

## Needs a phone / the Mac (Ravi)

- [ ] **Deploy `20260914e`** from the Mac (adds: Version card says installed / no newer /
  newer available; tighter footer bottom) — everything from today (labels, thumbnails, and
  the second-round build). Commands at the end of this file.
- [ ] Phone-check `20260914e`: Settings → Version shows *A newer version is available* before
  you tap, then *New version installed — built 9/13 10:5x PM* after; tap again → *No newer
  version was found*. Space under the footer buttons is only the home-indicator strip.
  Then round 3: footer buttons identical (rig-verified); day line
  two lines, never cut; Log item → take one, tap *Another*, take a second → two thumbnails
  with ✕ → tap a place → one tile; open it → swipe, next photo peeks. Photograph the soda
  can from a new angle with any name → *New photo of sparkling soda* (name tier) — or, if
  the AI names it something new, "Checking it isn't already saved…" then the same header
  (visual tier; ~3 s more). Thing card: *Add photo · Remove photo · Fix*. Hold a tile 0.5 s
  → sheet → Cancel. Then the earlier checks: footer — both buttons the same size and
  weight, white on green / green on white, bigger than before; still one row at Largest
  on a 390-px phone. Home: *Sunday evening · September 14*. Log an item, then tap *Add
  another photo* in the toast → second photo saved silently, tile unchanged; open the
  thing → swipe between the two photos, dots under. Rename a thing, photograph it again
  → header says *Your <new name> — new photo*, no duplicate. Move a thing to a second
  place → *Where it has been* row appears; tap it → Earlier mode; *Back to now*. *Remove
  this photo* → sheet → toast → Undo brings it back. Search "folio" → folder first;
  "table" shows things whose *name* has table before things merely *on* a table. Settings
  → Places: add one, log a photo → it is the first chip; rename it → items follow.
- [ ] Phone-check `20260914a`: footer says *Log item* · *Find item* on one line at Largest
  on a 390-px phone; Home tiles sharpen within a few seconds of opening (each old item is
  rebuilt once — watch the Firestore console if unsure); a new photo's tile is sharp at
  once; thing card photo unchanged; Ask screen title *Find item*, prompt *Where is my…*.
- [ ] Phone-check the last deploy (stamp `20260905l`, pushed 2026-09-05 20:45):
  Home footer is one row on a 430-px phone at Normal, two round icons bottom-right at
  Largest; Settings → Recently removed shows name, place line, two buttons on one line;
  *Where is my…* matches locally as she types or speaks, AI only when nothing matches.
- [ ] Before the next git command on the Mac: `find .git -name "*.lock" -delete` — the
  sandbox left `.git/index.lock` behind again on 2026-09-14.

## Later

- [ ] In-app camera spike (`getUserMedia`) — only if the phone's camera flow keeps hurting.

## Needs Tanya

- [ ] Labels — *Log item* / *Find item* / *My items* (Ravi, 2026-09-14). Devin and Margaret
  objected that these aren't her words; Tanya can reverse (three strings).
- [ ] S1 — header + footer (built) vs footer only. Confirm or reverse.
- [ ] Palette — pick Linen / Slate / High contrast / Dusk from the *ReCall Board Preview*
  artifact; then decide whether the Look picker stays in Settings.
- [ ] Firebase console: tighten rules by `household`; composite index (kind, itemId, at)
  so earlier photos can use `limit()`.

## Next build (board first, then code)

- [ ] Robert's helper phone — *This phone is used by* setting, *Another?* after save, note
  field, routines editor. Designed in BOARD_2026-09-05 §2; Places (built 09-14) is its first piece.
- [ ] **Appointments** (Tanya, 2026-09-14: agreed) — right after the helper phone. Today-only
  line on her board + list in Settings on the helper phone; visible list, no reminders.
  Add to `01_Needs_and_Prioritization/ReCall_Feature_Prioritizer.html` (MVP, Performance).
- [ ] Priya's one-card status — *did anything happen today?* Designed in §2, not built.
- [ ] Household join code (after the two above).

## Docs

- [ ] `RESEARCH_PLAN.md`: new events today — `photo_removed`, `photo_restored`, `capture`
  with `initiatedBy: 'add_another'`, `merge.soft`. Still describes event schema v2; v3 adds `merge`, `naming_failed`,
  `move_to_top`, `capture_leave`, `lookup_failed`, `capture.beforeName`. Update before
  the first export is analysed.
- [ ] `CLAUDE.md` "Current status" still says v0.2 is not deployed — it is (`20260905l`).
  Rewrite after the phone check.

## Done

- [x] 2026-09-05 — v0.2 board model built, deployed, three rounds of phone fixes.
- [x] 2026-09-05 — Footer side-by-side / floating icons; removed-row layout. Deployed.
- [x] 2026-09-05 — *Where is my…* live local matching. Deployed.

## Deploy commands (Mac)

```
cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall"
find .git -name "*.lock" -delete
git add -A && git commit -m "Version card states the update outcome; footer bottom; round 3: the roll, visual duplicate check, Fix/remove split, press-and-hold sheet, peek; footer cascade fix; AI sameAs; second phone round: photo strip + history mode, multi-photo logs, remove a photo, ranked search, aliases, Places; labels and sharp thumbnails" && git push origin main
```
