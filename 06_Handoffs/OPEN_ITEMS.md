# Open items

Running list of outstanding to-dos. Newest at the top of each section; strike or move to
*Done* when closed. Updated 2026-09-15 (round 7).

## Needs a phone / the Mac (Ravi)

- [ ] **Deploy `20260916c`** from the Mac — round 8: the thing card on the sightings model (title carries the place; fixed-size time label and trash on the photo; earlier places as a switch; three-button bar; *place*/*Places* everywhere); 7c: thing-card actions in a fixed bottom bar (same height as Home's), *Earlier photos* only live when earlier photos exist (count in the label); 7b fixes (flipped *No place assigned* label, pin on the place line, AM/PM, real photo times, BOTH stamps bumped) on top of round 7: when pill + Private on one line (no "this phone"
  anywhere; one toast shape both ways), amber pin badge for *no place yet* (tap → place field),
  *Text size & colours*, Locations as a list with photos → one-location screen (photos ≤3 via
  the camera, rename, things here, remove), *Add a location* = camera then name, "Where is it?"
  in three views with links, up to 4 shots per *Add photo* (log holds 6), the roll expands as
  one. Rig: 84/84. Screenshots Ravi reviewed: `06_Handoffs/design/mockups/r7f_combo_*.png`.
  Commands at the end of this file.
- [ ] Phone-check `20260916c`: open a thing → chevron Back, name on one line, place · context tight under it; time label bottom-left of the photo (same size at Largest), trash top-right; *Keep this private* switch → lock appears beside the name; *Show earlier places (n)* only on things that moved → older photos show their place in amber under the photo, title unchanged; Edit → change the place → the roll shows one photo at the new place, earlier count grows by the old ones; hamburger says *Places*. Then the 7c/7b checks: thing card → the four actions sit in a bar at the bottom at the same height as Home's buttons; tap Edit → fields open in a card under; with the keyboard up the bar should not cover the field being typed in (if it does, tell me). *Blue and red folders* → *No earlier photos*, greyed. *Reading glasses* (moved once) → *Not there? N earlier photos*. Locations rows have SMALL square pictures (if still huge, hard-refresh — the stylesheet stamp). A thing without a place: amber label block reading *No place assigned*; card shows a pin before the place line. Open a private thing → clock pill (icon centred) left, lock + *Private* right on ONE line; time reads *today, 1:09 PM*; add a photo, swipe to it → the time changes; tap *Private* → toast *Now shared · everyone at home sees it*; tap again → *Now private ·
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
- [ ] Deploy `20260914p` from the Mac (p: a little more space above the Home buttons; o: Shared/Private open/closed lock, trash per photo
  bottom-left + photo in the remove sheet, lock watermark, hold → private, hamburger flush; n: thing card layout A — trash on the photo, labelled
  action row, icons-only when words don't fit; m: private items — field, toggle, lock, filtering; l: Add photo · Edit replace Found it/Fix; wrong-photo
  guard; hold on the photo → sheet; shorter footer; k: full-path audit fixes — Add photo on older items,
  added photo shows at once, rename keeps the alias, Find item → Take a photo opens the camera;
  j: naming + identity use every shot and the
  subject, sure-only visual matches; i: the in-app camera — Cancel, several shots with
  ✕ thumbnails, Done; h: day line hugs the hamburger; Back from a menu screen returns to the
  drawer) (g: Version card shows facts only — build time,
  installed-on-this-phone time, when the server was last asked; no "latest" claim) (adds: hamburger menu — Look and feel with Compact,
  Locations, Deleted items with swipe + Empty the list, Research log; Settings = Version first
  + AI key; the Version-card update banners; tighter footer bottom) — everything from today (labels, thumbnails, and
  the second-round build). Commands at the end of this file.
- [ ] Phone-check `20260914p`: thing card shows the trash on the photo and the row *Add photo ·
  Edit · Share · Remove* with words at Normal; switch to Largest → icons only, one row. *Share*
  → *Private* → lock on the tile. Then: thing card footer is *Add photo · Edit*; Edit the place → it
  appears under *Where it has been*; add a photo of something else → the question sheet;
  hold the big photo → the app's sheet, not iOS's. Then: open any of your existing items → *Add photo* → shoot → Done →
  the strip shows the new photo at once with dots. Find item → nonsense → Find it → *Take a
  photo of it* → camera. Keyboard close-up + wide shot with the can behind → card says
  *Keyboard*, stays *Keyboard*. Then: *Log item* opens the app's own camera (allow the permission
  once) → shutter twice → two thumbnails → ✕ one → *Done* → photo card. *Cancel* returns to
  Home with nothing saved. Thing card → *Add photo* → shoot → *Done* → toast *Added*. If the
  camera fails to start, *Use the phone's camera* appears. Then: hamburger left of the day line → drawer → each row opens its
  card and Back returns. Look and feel → Compact → Deleted items: swipe a row left → Delete,
  right → Put back; *Empty the list* asks first. Settings → Version is at the TOP; *Get the
  latest version* returns to it without scrolling. Version shows *A newer version is available* before
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

- [ ] Remove the Settings gear once the AI key has a home (helper phone / join code).

## Audit of the last two feedback rounds (2026-09-14, at Ravi's request)

Round 2 (ten items): history visible ✓ · several photos per log ✓ · remove a photo ✓ ·
duplicate after rename ✓ · button size/contrast ✓ (after two regressions) · search ranking ✓
· editable-field affordance ✓ · day line ✓ (+ date) · locations manager ✓ · appointments —
decided with Tanya, scheduled after the helper phone (not built, by agreement).
Round 3 (six + camera): peek ✓ · footer sizes ✓ · **multi-shot in the camera with ✕
thumbnails — MISSED until build i** (built on the card, not in the camera) · Fix/remove
split ✓ · press-and-hold sheet ✓ · duplicate recognition ✓ (AI looks) · **camera Cancel —
MISSED until build i** (deferred without agreement).

## Needs Tanya

- [ ] Labels — *Log item* / *Find item* / *My items* (Ravi, 2026-09-14). Devin and Margaret
  objected that these aren't her words; Tanya can reverse (three strings).
- [ ] S1 — header + footer (built) vs footer only. Confirm or reverse.
- [ ] Palette — pick Linen / Slate / High contrast / Dusk from the *ReCall Board Preview*
  artifact; then decide whether the Look picker stays in Settings.
- [ ] Firebase console: tighten rules by `household`; composite index (kind, itemId, at)
  so earlier photos can use `limit()`.

## Multi-user — SUSPENDED 2026-09-15 (Ravi disagrees with the boards)

- [ ] **Ravi: run the use-case redefinition in a separate session** — paste
  `06_Handoffs/PROMPT_2026-09-15_multi-user-redefinition.md`. Until then nothing from
  `PLAN_2026-09-14_multi-user.md` (stages 0–4, the six splits, stage 0's hamburger question)
  is decided or built. Kept from that work: private = per person, not per device.
- [ ] On that session's agenda too: native wrapper (camera permission, remote install);
  *put it back* (the derived *Usually on* row was parked); the location hierarchy
  (`parent` reserved on place docs — DECISIONS 2026-09-15); place photos as AI reference
  images (the prompt's "known places" block is not built yet).

## Next build (board first, then code)

- [ ] Robert's helper phone — *This phone is used by* setting, *Another?* after save, note
  field, routines editor. Designed in BOARD_2026-09-05 §2; Places (built 09-14) is its first piece.
- [ ] **Appointments** (Tanya, 2026-09-14: agreed) — right after the helper phone. Today-only
  line on her board + list in Settings on the helper phone; visible list, no reminders.
  Add to `01_Needs_and_Prioritization/ReCall_Feature_Prioritizer.html` (MVP, Performance).
- [ ] Priya's one-card status — *did anything happen today?* Designed in §2, not built.
- [ ] Household join code (after the two above).

## Board notes from the audit (not bugs; Tanya's call)

- [ ] Tile sheet: *Change the place* / *Rename* should focus the tapped field in Fix (Devin).
- [ ] Merge toast should say it merged: *Saved · Kitchen counter · your glasses* (Maya).
- [ ] After *Add photo*, slide the strip to the new photo (Priya).
- [ ] *EARLIER* eyebrow is the hardest text on the thing card (Margaret).

## Docs

- [ ] `RESEARCH_PLAN.md`: new events today — `photo_removed`, `photo_restored`, `capture`
  with `initiatedBy: 'add_another'`, `merge.soft`. Still describes event schema v2; v3 adds `merge`, `naming_failed`,
  `move_to_top`, `capture_leave`, `lookup_failed`, `capture.beforeName`. Update before
  the first export is analysed.
- [ ] `CLAUDE.md` "Current status" still says v0.2 is not deployed — it is (`20260905l`).
  Rewrite after the phone check.

## Done

- [x] 2026-09-15 — round 7 built and rig-audited (84/84); mockups → rulings → code.

- [x] 2026-09-05 — v0.2 board model built, deployed, three rounds of phone fixes.
- [x] 2026-09-05 — Footer side-by-side / floating icons; removed-row layout. Deployed.
- [x] 2026-09-05 — *Where is my…* live local matching. Deployed.

## Deploy commands (Mac)

```
cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall"
find .git -name "*.lock" -delete
git add -A && git commit -m "Round 8: thing card on things/places/sightings — title carries the place, fixed-size time + trash on the photo, earlier places switch, three-button bar, place everywhere; a move writes a sighting; round 7 + 7b + 7c: actions in a fixed bottom bar, Earlier photos live only with earlier photos; No place assigned label, pin on the place line, AM\/PM, real photo times, both cache stamps; when pill + Private on one line, one toast shape (private = per person, never 'this phone'); pin badge for no place yet; Text size & colours; Locations list with place photos + one-location screen; Where is it? in three views; 4 shots per Add photo; roll expands as one; multi-user plan suspended + redefinition prompt; docs" && git push origin main
```
