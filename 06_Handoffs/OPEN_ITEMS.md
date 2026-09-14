# Open items

Running list of outstanding to-dos. Newest at the top of each section; strike or move to
*Done* when closed. Updated 2026-09-14 (second phone round).

## Needs a phone / the Mac (Ravi)

- [ ] **Deploy `20260914l`** from the Mac (l: Add photo · Edit replace Found it/Fix; wrong-photo
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
- [ ] Phone-check `20260914l`: thing card footer is *Add photo · Edit*; Edit the place → it
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

## Multi-user — decided by three boards, staged (PLAN_2026-09-14_multi-user.md)

- [ ] **Ravi/Tanya: rule on the six splits** at the end of the plan (tell Margaret once or
  never · Priya's day-one logging · sign-in in stage 2 or 3 · hamburger under Margaret's role ·
  AI proxy in stage 1 · Storage now or at 150 items).
- [ ] Stage 0 (1 day): *This phone is used by* switch; then appointments (Tanya's sequence).
- [ ] Stage 1 (4 days, two agents): households + rules + migration ‖ AI-key proxy function.
- [ ] Stage 2 (4 days, two agents): join code + Household screens + Priya's card ‖ coverSnapId.
- [ ] Stage 3 (5 days, two agents): roles from members + helper screens ‖ Google sign-in for helpers.
- [ ] Firebase: Blaze billing with a $10 alert (proxy needs it); Tanya's console.

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

- [x] 2026-09-05 — v0.2 board model built, deployed, three rounds of phone fixes.
- [x] 2026-09-05 — Footer side-by-side / floating icons; removed-row layout. Deployed.
- [x] 2026-09-05 — *Where is my…* live local matching. Deployed.

## Deploy commands (Mac)

```
cd "/Users/rangadi/Documents/Claude/Projects/Tanya - College Application/ReCall"
find .git -name "*.lock" -delete
git add -A && git commit -m "Thing card: Add photo · Edit, wrong-photo guard, photo hold sheet, shorter footer; multi-user plan (3 boards); full-path audit fixes (add photo on older items, live reload, rename alias, Find→camera) + rig audit script; name and identity-check with every shot, subject-aware; in-app camera (cancel, multi-shot roll); drawer is a history entry; day line hugs the hamburger; Version card: facts only, installed-at time; hamburger menu (Look and feel, Locations, Deleted items, Research log), Settings = Version + AI key; Version card states the update outcome; footer bottom; round 3: the roll, visual duplicate check, Fix/remove split, press-and-hold sheet, peek; footer cascade fix; AI sameAs; second phone round: photo strip + history mode, multi-photo logs, remove a photo, ranked search, aliases, Places; labels and sharp thumbnails" && git push origin main
```
