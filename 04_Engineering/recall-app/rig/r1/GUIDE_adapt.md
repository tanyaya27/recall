# Adapting a test suite to release 1 "Words, and one pick" (10-01)

## What changed in the app (the build in /home/claude/rig/out is current; `./build.sh` rebuilds it — do NOT edit src/ or styles.css)
The camera (src/components/LogCamera.jsx, ~350 lines; reading the app source IS allowed for this job) no longer has tiers.
- Every photo in the camera is a photo of the ITEM (cover + up to 5 more). There are NO place photos, no tier squares
  (.lv-sq, .lv-strip, .lc-plus-out), no "☰ Choose place" (.lc-choose), no "This photo is…" (.photo-for), no Before → Now
  (.where-list.bn), no "Place: …" line (.lc-say), no chain line (.lc-chainline), no AI place matching (the stub's WHERE
  queue / "MOVES:" call is never used by the camera).
- Where it is = two optional things on the camera card (`.lc-card .w1`):
  - her words: `.w1-words input` (typed), saved in the item's history as `{ w: 1, said, at, by }` (the latest such entry
    is "what she said"; `saidOf(item)` in src/lib/graph.js);
  - ONE "In": `button.w1-in` ("What is it in?") opens the list `.in-list` (src/components/InList.jsx); when set the chip is
    `.w1-in.set` (open again: `.w1-in-open`; ✕: `.w1-in .x`). The list: `.in-list .wl-search input` (search), rows
    `.in-list .wl-row` (b = name, small = "a place · N items" / "a box · in …", `.wl-cur` = Current place), "New place: X"
    buttons `.in-list .wl-new` (from her words, or from what she typed in search), Cancel `.in-list .btn-quiet`.
  - Picking closes the list and sets the chip. Save `.lc-k.sv`. Move it (item page `.tp-btn:has-text("Move it")`) opens the
    same camera with the chip already set to where it is now; Save is disabled until a photo, words or a different In.
- A BOX or a PLACE changes where IT is from its own page: a box = an item → its page → Move it (one In). A place → ☰ menu →
  Places → the place → "Where this place is" (`.pl-where`) → `.in-list` (places only) → `placeIn`.
- Home tiles show photo + name only — no `.tile-sub` line, no amber "No place yet" flip (`.tile-label.noplace` gone).
  "Not put away · N" counts items with no place, no box AND no words.
- Item page: `.tp-said q` = her words ("You said · time"); words-only items also get `.tp-put` ("Put it in a place or a box").
- Find live tiles: `.tile-sub` = the tier it's in, or her words in quotes.

## A drop-in helper (adapt to the suite's own `page`/`tap` helpers)
```js
// Pick where it is in the camera's In list: an existing place/box by exact name, else a new place by that name.
const pickPlace = async (name) => {
  await page.click(await page.locator('.w1-in.set').count() ? '.w1-in-open' : 'button.w1-in'); await page.waitForSelector('.in-list');
  await page.fill('.in-list .wl-search input', name); await page.waitForTimeout(200);
  const row = page.locator(`.in-list .wl-row:has(b:text-is("${name}"))`);
  if (await row.count()) await row.first().click(); else await page.locator('.in-list .wl-new').first().click();
  await page.waitForTimeout(250);
};
```
An old "photograph a place, then name it" step becomes `pickPlace('<that name>')`. An old "+ then a second tier" becomes:
pick the first tier here, Save, then open THAT box/place's own page and set where it is (Move it / Where this place is).

## Rules for the job
1. Checks of behaviour that STILL exists (a save stores the right place and links, Undo, roles and the rules, privacy,
   names, loops refused, viewer, seen/moved, Not put away, Find, Home, etc.) are rewritten to the new UI and must pass.
2. Checks that only test something REMOVED (tier squares, Choose place on a tier, the place-photo AI ask, "Place:" line,
   Before → Now, shutter marks, the where-photo flow) are deleted. List each deleted check ID + one-line reason in a comment
   block at the top of the file headed `// Retired 2026-10-01 (release 1 — the tier camera is gone):`.
3. If a check of still-existing behaviour fails because the APP is wrong, do NOT weaken the check. Leave it failing and
   report it (check ID, steps, what you saw) — that is the most valuable thing you can return.
4. One browser at a time, your own ports only, keep each run under ~6 minutes (`timeout 400 node <suite>.js`).
5. Suites built from tiers_head.js are `cat tiers_head.js <x>_body.js > <x>.js` — edit the body, re-cat, run. Never edit
   tiers_head.js (shared) — tell me if it needs a change. The harness no longer installs legacy_flow (removed).
6. Return: per suite, PASS/total before and after, the retired IDs, and any app bugs (rule 3).
