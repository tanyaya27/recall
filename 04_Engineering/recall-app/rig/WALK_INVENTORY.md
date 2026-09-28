# WALK_INVENTORY — ReCall build 20260927b (rig/walk_f1.js)

One row per screen/state visited. Screenshot files are in `rig/shots_walk/`. "Controls" lists every tappable
element visible in that state and its label; "Leads to" says what tapping it does (from reading the source,
not guessed). "Notes" flags anything broken, overlapping, cut off, mislabeled, or a dead end.

| # | Flow · state | Screenshot | Controls (label — leads to) | Notes |
|---|---|---|---|---|
| 1 | home · empty (no household set up yet) | home-01.png | **Set up** — opens Settings (route settings) to configure the AI key |  |
| 2 | home · seeded: tiles, Not put away banner, footer | home-02.png | **☰ (menu-btn)** — opens the left drawer (MenuDrawer)<br>**"Margaret’s ReCall" / day line** — switch-account affordance (onSwitch) — no-op for a single-person house<br>**Settings (tiny, gear)** — route settings — Settings.jsx (AI key, camera look, Show times)<br>**Not put away · 1 (coffee can)** — route notput — NotPutAway.jsx<br>**a tile (e.g. Wallet)** — route thing — that item's ThingCard<br>**Log item (footer primary)** — openLog() — opens LogCamera with no preset<br>**Find item (footer alt)** — route ask — Ask.jsx |  |
| 3 | menu · drawer open | menu-01.png | **Text size & colours** — route look — LookScreen (size/theme/density)<br>**People** — route people — PeopleScreen<br>**Places** — route locations — LocationsScreen<br>**Deleted items** — route deleted — DeletedScreen<br>**Research log** — route research — ResearchScreen<br>**Close** — closes the drawer, back to Home |  |
| 4 | places · Places list (LocationsScreen) | places-01.png | **a place row (loc-row, e.g. Kitchen counter)** — route place — PlaceScreen for that name<br>**Add a place (btn-secondary, if canEdit)** — opens the camera to photograph a brand-new place (place_new)<br>**Back (Header chevron)** — back() to the menu-opening screen (Home) |  |
| 5 | place · Kitchen counter’s page: no photo yet | place-01.png | **Take a photo (place-photo add)** — opens the legacy Camera for this place (place_add)<br>**field-value (name)** — inline rename (editing state) → Save/Cancel<br>**Remove this place (btn-secondary amber)** — Confirm sheet → removePlace (things here keep the name as a bare string)<br>**Back** — back() to Places list |  |
| 6 | place · a photo added: trash icon now on the photo | place-02.png | **photo-trash (small, on the photo)** — Confirm "Remove this photo?" → removePlacePhoto<br>**Add photo (place-photo add, 2 of 3 slots left)** — opens the camera again, up to PLACE_PHOTOS=3 |  |
| 7 | place · photo removed: back to "Take a photo" | place-03.png |  |  |
| 8 | settings · gear-icon Settings: Taking photos | settings-01.png | **Photo clear (lookopt)** — sets prefs.cameraLook = "a" — the level chain is drawn ON the photo<br>**Answer card (lookopt, on by default)** — sets prefs.cameraLook = "b" — a dark glass card over the photo<br>**Show times on photos (switch)** — toggles prefs.showTimes<br>**(above, not shown) AI provider/key fields** — configures engine.cfg |  |
| 9 | find · Find/Ask: "wallet" | find-01.png | **ask input** — free-text search (Ask.jsx matchThings)<br>**a result tile** — onResult → route thing for that item<br>**Photograph it (if no result — not shown here)** — onPhoto → openLog() |  |
| 10 | write · Write it down (NoteCard): before typing | write-01.png | **What is it? (#note-what)** — name field<br>**Pick a place or box (path.in)** — opens WhereList (onPick sets place text + dest)<br>**No place yet (path.later)** — clears place/dest<br>**a place chip / box chip (guesses)** — sets place to that chip<br>**Somewhere else (guess.other)** — reveals a free-text place-input<br>**Keep this private (switch)** — toggles priv; auto-on for a name/place that "looks private"<br>**Save (btn-primary, disabled until a name)** — addItem with no photo (written:true) |  |
| 11 | write · typed name + a place chip picked | write-02.png |  |  |
| 12 | write · Saved: back on Home, a written tile (no photo) | write-03.png |  |  |
| 13 | thing-place · a thing WITH a place (Wallet, on Hall table) | thing-place-01.png | **Where it is (tp-wh)** — shows the chain of photos/words to its place<br>**Move it (tp-btn)** — onMove → openMove(item) → LogCamera with moveItem set, level 0 fixed<br>**Add photo (tp-row, under More)** — setCamera({for:"add"}) → legacy Camera, appended to the same log<br>**Rename (tp-row)** — inline rename sheet<br>**Keep this private / Share (switch or link)** — privacy toggle<br>**Remove old photos… (if photoCount>1)** — TidySheet<br>**Remove (tp-row red, owner only)** — Confirm → softDeleteItem<br>**Back (chev)** — back() to Home |  |
| 14 | thing-noplace · a thing with NO place (Coffee can, needsPlace) | thing-noplace-01.png | **No place yet (tp-wh, amber)** — static label, not tappable<br>**Put it somewhere (tp-btn amber)** — openMove(item) → LogCamera, level 0 fixed, level 1 already selected |  |
| 15 | box · a container’s page: In it | box-01.png | **In it grid (tp-grid buttons: Wooden box, ...)** — each opens that thing's own page<br>**Put things in (tp-btn)** — opens PutInSheet for this box (dest = this box)<br>**Log something in (tp-btn)** — openLog({t:"thing", item:box}) → LogCamera, level 1 preset to this box<br>**Move it (tp-btn, since it also has a place)** — openMove(item) |  |
| 16 | putin · Put-in sheet for the memorabilia box | putin-01.png | **search? (none — plain grid)** — <br>**a tile (thing not yet inside)** — toggles pick (tick mark)<br>**Put in (putin-foot btn-primary, disabled until ≥1 picked)** — onDone → one save for all picked things<br>**Cancel (btn-quiet)** — closes with nothing changed |  |
| 17 | putin · one thing picked (tick shown) | putin-02.png |  |  |
| 18 | notput · Not put away: things with no location and no holder | notput-01.png | **a row (Coffee can)** — opens that thing's page (route thing)<br>**Back (chev)** — back() to Home |  |
| 19 | b-a · B step 1: before the first photo | b-a-01.png | **Cancel (lc-x)** — no photo taken yet → onCancel() at once, no confirm<br>**Type it instead (on the photo)** — onWrite → closes camera, opens NoteCard<br>**shutter (white ring: the thing)** — photographs the thing, level 0 |  |
| 20 | b-a · after the shot: the sentence already suggests a place (guess, in the photo) | b-a-02.png | **the thing square (lv-sq, stays selected, white)** — reselect level 0 — tap again previews its photos<br>**＋ (amber, next level)** — addLevel() — photograph level 1 explicitly<br>**a place/box chip** — pickKnown — fills level 1 with that known place/box (skips the suggestion)<br>**pencil (lc-chg, next to the sentence)** — Choice: Photograph it again / Pick from every place and box / No place yet<br>**+ Next** — save(true) then reopen the camera at step 1 for another thing<br>**Save** — save(false) — uses the suggestion since no level was filled |  |
| 21 | b-a · Saved via the suggestion, no level ever created | b-a-03.png |  |  |
| 22 | b-b · the thing photographed; level 1 not chosen yet | b-b-01.png | **＋** — addLevel → level 1, amber |  |
| 23 | b-b · level 1 chosen: "Where it goes" | b-b-02.png | **shutter (amber ring)** — photographs level 1 |  |
| 24 | b-b · level 1 named from the photo: a NEW fixed place (moves:false, no sure-match) | b-b-03.png | **＋ (blue, level 2)** — would add a further level for where the shelf itself is<br>**Save** — saveChain writes a NEW place doc for "Linen closet shelf" (addPlace, since it is not `known`) |  |
| 25 | b-b · Saved: a new place doc now exists, with the shelf photo as its picture | b-b-04.png |  |  |
| 26 | b-c · level 1: the fake AI is SURE this is the already-logged wooden box | b-c-01.png | **Yes (lc-ask)** — setLevels …yes:true — the level becomes the known wooden box, its own photo dropped<br>**No, a new one (lc-ask)** — keeps the just-taken photo as a brand new box instead |  |
| 27 | b-c · confirmed: level 1 is the wooden box (known), the photo just taken is NOT kept on it | b-c-02.png | **Save** — saveChain: {known:{t:"thing", item: wooden box}} — no addItem, no new photo added to the box |  |
| 28 | b-c · Saved: the key is IN the wooden box (existing item, no duplicate box made) | b-c-03.png |  |  |
| 29 | b-d · level 1 filled by a CHIP (known: "Linen closet shelf") — 0 photos on this level | b-d-01.png | **the level-1 square (now shows the chip’s thumb, no photo count)** — tap once more: half-screen preview (but a known level has no photo to show) |  |
| 30 | b-d · Q1: took ANOTHER photo while level 1 was still selected (still "known") | b-d-02.png |  |  |
| 31 | b-d · Q1 answer: the known pick was kept by the new photo (sentence now: "Linen closet shelf") | b-d-03.png |  | level shows no badge (count=1, badge only shows above 1) — the pick was attached to, not discarded (R1) |
| 32 | b-e · level 1: a brand-new box (moves:true), nothing follows it (no level 2) | b-e-01.png | **＋ (would add level 2 — where the shoe box itself is)** — left untouched here on purpose<br>**Save** — saveChain: addItem for the shoe box with location:"" (it is the outermost/last link, so no outer place) |  |
| 33 | b-e · Saved: the new box now exists with no place of its own | b-e-02.png |  |  |
| 34 | b-e · Home: does the new placeless box show under Not put away? | b-e-03.png | **Not put away** — opens the list |  |
| 35 | b-e · Q4 (part): Not put away, after (e) | b-e-04.png |  | correct (R6.3): the new asWhere box does not appear on Not put away |
| 36 | b-f · a suggestion is showing (links.length>0 from the guess), so the pencil is available | b-f-01.png | **pencil (lc-chg)** — Choice: Photograph it again / Pick from every place and box / No place yet / Cancel |  |
| 37 | b-f · Choice sheet | b-f-02.png |  |  |
| 38 | b-f · WhereList (every place and box, search, "New place or box: photograph it") | b-f-03.png | **search input** — filters places/boxes below by name<br>**New place or box: photograph it (if onPhotograph given)** — addLevel() and closes the sheet, back to the camera<br>**typing a name that matches nothing existing** — reveals "A new place called “…”" |  |
| 39 | b-f · typed a brand-new name | b-f-04.png | **A new place called “Attic crawlspace shelf” (wl-new.typed)** — pickKnown({t:"place", name}) — becomes a KNOWN level with 0 photos, never addPlace’d until Save |  |
| 40 | b-f · level 1 is now the typed place (no photo slot for it at all) | b-f-05.png | **Save** — saveChain writes location text only — see Q2/Q3 |  |
| 41 | b-f · Saved: the typed place is on the item as text | b-f-06.png |  | a place DOC was also created (has photos: 0) |
| 42 | b-g · first thing photographed | b-g-01.png | **+ Next (lc-k.sn)** — save(true): saves this thing, then RESETS the camera to step 1 for another |  |
| 43 | b-g · camera reset to "Photograph the thing" — the toast for #1 shows on Home underneath (not visible: camera is modal) | b-g-02.png |  |  |
| 44 | b-g · second thing photographed in the same sweep | b-g-03.png | **Save** — save(false): saves #2 and closes the camera |  |
| 45 | b-g · Saved: both things now exist | b-g-04.png |  |  |
| 46 | b-h · before any photo | b-h-01.png | **Cancel** — tryCancel(): nothing taken yet → onCancel() at once, no confirm sheet |  |
| 47 | b-h · Cancel with no photo: straight back to Home, no confirm asked | b-h-02.png |  |  |
| 48 | b-h · a photo now exists | b-h-03.png | **Cancel** — tryCancel(): a photo exists → Confirm "Throw these photos away?" |  |
| 49 | b-h · Confirm sheet | b-h-04.png | **Keep going** — closes the sheet, camera stays open with the photo intact<br>**Throw away** — onCancel(): discards everything, back to Home |  |
| 50 | b-h · kept going: the photo is still there | b-h-05.png |  |  |
| 51 | b-h · Threw away: back on Home, nothing saved | b-h-06.png |  |  |
| 52 | b-i · Move it: the wallet is level 0 (already photographed, fixed), level 1 chosen for a new place | b-i-01.png | **level-0 square (the wallet’s own thumb)** — tap opens its photo preview only (no re-shoot: moveItem level 0 is fixed)<br>**shutter (amber ring: level 1)** — photographs the NEW place directly, no "where it goes" typing needed first<br>**a chip** — picks a known place/box for level 1 instead<br>**Save (disabled until level 1 is filled)** — changeLocation(wallet, …) — moves it, does not duplicate it |  |
| 53 | b-i · level 1 photographed: the wallet’s new place | b-i-02.png |  |  |
| 54 | b-i · Saved: the wallet moved (same item, new location, Undo on the toast) | b-i-03.png |  |  |
| 55 | a-a · A step 1: before the first photo | a-a-01.png | **Cancel (lc-x)** — no photo taken yet → onCancel() at once, no confirm<br>**Type it instead (on the photo)** — onWrite → closes camera, opens NoteCard<br>**shutter (white ring: the thing)** — photographs the thing, level 0 |  |
| 56 | a-a · after the shot: the sentence already suggests a place (guess, in the photo) | a-a-02.png | **the thing square (lv-sq, stays selected, white)** — reselect level 0 — tap again previews its photos<br>**＋ (amber, next level)** — addLevel() — photograph level 1 explicitly<br>**a place/box chip** — pickKnown — fills level 1 with that known place/box (skips the suggestion)<br>**pencil (lc-chg, next to the sentence)** — Choice: Photograph it again / Pick from every place and box / No place yet<br>**+ Next** — save(true) then reopen the camera at step 1 for another thing<br>**Save** — save(false) — uses the suggestion since no level was filled |  |
| 57 | a-a · Saved via the suggestion, no level ever created | a-a-03.png |  |  |
| 58 | a-b · the thing photographed; level 1 not chosen yet | a-b-01.png | **＋** — addLevel → level 1, amber |  |
| 59 | a-b · level 1 chosen: "Where it goes" | a-b-02.png | **shutter (amber ring)** — photographs level 1 |  |
| 60 | a-b · level 1 named from the photo: a NEW fixed place (moves:false, no sure-match) | a-b-03.png | **＋ (blue, level 2)** — would add a further level for where the shelf itself is<br>**Save** — saveChain writes a NEW place doc for "Linen closet shelf" (addPlace, since it is not `known`) |  |
| 61 | a-b · Saved: a new place doc now exists, with the shelf photo as its picture | a-b-04.png |  |  |
| 62 | a-c · level 1: the fake AI is SURE this is the already-logged wooden box | a-c-01.png | **Yes (lc-ask)** — setLevels …yes:true — the level becomes the known wooden box, its own photo dropped<br>**No, a new one (lc-ask)** — keeps the just-taken photo as a brand new box instead |  |
| 63 | a-c · confirmed: level 1 is the wooden box (known), the photo just taken is NOT kept on it | a-c-02.png | **Save** — saveChain: {known:{t:"thing", item: wooden box}} — no addItem, no new photo added to the box |  |
| 64 | a-c · Saved: the key is IN the wooden box (existing item, no duplicate box made) | a-c-03.png |  |  |
| 65 | a-d · level 1 filled by a CHIP (known: "Linen closet shelf") — 0 photos on this level | a-d-01.png | **the level-1 square (now shows the chip’s thumb, no photo count)** — tap once more: half-screen preview (but a known level has no photo to show) |  |
| 66 | a-d · Q1: took ANOTHER photo while level 1 was still selected (still "known") | a-d-02.png |  |  |
| 67 | a-d · Q1 answer: the known pick was kept by the new photo (sentence now: "Linen closet shelf") | a-d-03.png |  | level shows no badge (count=1, badge only shows above 1) — the pick was attached to, not discarded (R1) |
| 68 | a-e · level 1: a brand-new box (moves:true), nothing follows it (no level 2) | a-e-01.png | **＋ (would add level 2 — where the shoe box itself is)** — left untouched here on purpose<br>**Save** — saveChain: addItem for the shoe box with location:"" (it is the outermost/last link, so no outer place) |  |
| 69 | a-e · Saved: the new box now exists with no place of its own | a-e-02.png |  |  |
| 70 | a-e · Home: does the new placeless box show under Not put away? | a-e-03.png | **Not put away** — opens the list |  |
| 71 | a-e · Q4 (part): Not put away, after (e) | a-e-04.png |  | correct (R6.3): the new asWhere box does not appear on Not put away |
| 72 | a-f · a suggestion is showing (links.length>0 from the guess), so the pencil is available | a-f-01.png | **pencil (lc-chg)** — Choice: Photograph it again / Pick from every place and box / No place yet / Cancel |  |
| 73 | a-f · Choice sheet | a-f-02.png |  |  |
| 74 | a-f · WhereList (every place and box, search, "New place or box: photograph it") | a-f-03.png | **search input** — filters places/boxes below by name<br>**New place or box: photograph it (if onPhotograph given)** — addLevel() and closes the sheet, back to the camera<br>**typing a name that matches nothing existing** — reveals "A new place called “…”" |  |
| 75 | a-f · typed a brand-new name | a-f-04.png | **A new place called “Attic crawlspace shelf” (wl-new.typed)** — pickKnown({t:"place", name}) — becomes a KNOWN level with 0 photos, never addPlace’d until Save |  |
| 76 | a-f · level 1 is now the typed place (no photo slot for it at all) | a-f-05.png | **Save** — saveChain writes location text only — see Q2/Q3 |  |
| 77 | a-f · Saved: the typed place is on the item as text | a-f-06.png |  | a place DOC was also created (has photos: 0) |
| 78 | a-g · first thing photographed | a-g-01.png | **+ Next (lc-k.sn)** — save(true): saves this thing, then RESETS the camera to step 1 for another |  |
| 79 | a-g · camera reset to "Photograph the thing" — the toast for #1 shows on Home underneath (not visible: camera is modal) | a-g-02.png |  |  |
| 80 | a-g · second thing photographed in the same sweep | a-g-03.png | **Save** — save(false): saves #2 and closes the camera |  |
| 81 | a-g · Saved: both things now exist | a-g-04.png |  |  |
| 82 | a-h · before any photo | a-h-01.png | **Cancel** — tryCancel(): nothing taken yet → onCancel() at once, no confirm sheet |  |
| 83 | a-h · Cancel with no photo: straight back to Home, no confirm asked | a-h-02.png |  |  |
| 84 | a-h · a photo now exists | a-h-03.png | **Cancel** — tryCancel(): a photo exists → Confirm "Throw these photos away?" |  |
| 85 | a-h · Confirm sheet | a-h-04.png | **Keep going** — closes the sheet, camera stays open with the photo intact<br>**Throw away** — onCancel(): discards everything, back to Home |  |
| 86 | a-h · kept going: the photo is still there | a-h-05.png |  |  |
| 87 | a-h · Threw away: back on Home, nothing saved | a-h-06.png |  |  |
| 88 | a-i · Move it: the wallet is level 0 (already photographed, fixed), level 1 chosen for a new place | a-i-01.png | **level-0 square (the wallet’s own thumb)** — tap opens its photo preview only (no re-shoot: moveItem level 0 is fixed)<br>**shutter (amber ring: level 1)** — photographs the NEW place directly, no "where it goes" typing needed first<br>**a chip** — picks a known place/box for level 1 instead<br>**Save (disabled until level 1 is filled)** — changeLocation(wallet, …) — moves it, does not duplicate it |  |
| 89 | a-i · level 1 photographed: the wallet’s new place | a-i-02.png |  |  |
| 90 | a-i · Saved: the wallet moved (same item, new location, Undo on the toast) | a-i-03.png |  |  |

---
**Page errors during the whole walk:** none

**Console errors:** none
