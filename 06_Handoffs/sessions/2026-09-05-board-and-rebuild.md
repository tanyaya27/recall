# 2026-09-05 (evening) — First board session; the UX rebuilt above the engine

**Machine:** Cowork sandbox on Ravi's Mac. **Outcome:** the board met, disagreed in
writing, the personas reacted, Ravi/Tanya approved, and the first-session cut is built and
smoke-tested. **Not deployed, not run on a phone.**

## What happened

1. Convened the build board per `PRODUCT_BOARD.md`. Maya framed (first session = key, three
   photos, one find; routines are not must-be and leave Home). Devin proposed *one board,
   two verbs, depth one* and rejected v0.1's clock-shaped home as navigation she doesn't
   control. Priyanka and Sam objected on the chip-before-name race, the merge failure mode,
   unbounded snaps, `pinnedOrder` semantics, the missing household field, and iOS voice.
   Margaret/Robert/Priya/James/Linda/Harold reacted; Margaret added "no tile ever says
   *tap to name*". Full record: `design/BOARD_2026-09-05_interaction_model.md`.
2. Ravi approved the model and chose on the four splits: merge (D4), all three engine
   changes, save-before-name (D3).
3. Tanya added mid-build: pick the palette, end-user text/control sizes, "structure of the
   most common apps". Board addendum in §9; built as header + fixed footer, Settings → Look.
   **S1 is still hers to reverse.**
4. Built. `npm run build` clean (33.8kb). SSR smoke test of every screen passes.
5. Published a static preview artifact (*ReCall Board Preview*) so Tanya can compare the
   three palettes and three sizes on real screens before deciding.

## What is built

`Board` · `PhotoCard` · `ThingCard` · `Ask` · `Settings` · `Header` · `Footer`; `lib/prefs.js`;
`docs/styles.css` rewritten in rem with three themes. `db.js`: `HOUSEHOLD`, `boardKey/
boardOrder/moveToTop`, `findByName`, `nameItem`, `absorbInto`, snap cap in `loadSnaps`,
`household` on every write, schema 3. Old components deleted. `format.js`: `dayLine`,
`whenSeen`. `index.html`: `?v=` cache-busters on css and js.

## What is NOT verified — the phone checklist

Deploy from the Mac: `cd 04_Engineering/recall-app && ./deploy.sh`. Then on the iPhone
(Settings → get the latest version if the build stamp is old):

1. Fresh phone, no key → Home shows *One-time setup*; *Set up* → Settings; paste key →
   *Check the key works* → both steps ok.
2. *Take a photo* opens the camera **directly** (label-as-input). If it doesn't on iOS, that
   is the first bug; fallback is a button that opens a visible file input.
3. Photo card appears < 1s with chips (household places — none on a fresh vault, so
   *Somewhere else* → type). Name arrives in 3–8s. Tap a chip → straight back to the board,
   tile present.
4. Tap the chip **before** the name arrives → card stays with the place shown; name arrives
   → back to board automatically. Check the tile ends up named (the `naming` flag path).
5. Photograph the same thing again from Home → header says *Your X — new photo* with
   *not your X?*; tap a place → **one** tile, updated.
6. Tap a tile → thing card; *Not there? Earlier photos* shows the older photo; *That's every
   photo of your …* at the end. *Found it — new photo* opens the camera.
7. *Where is my…* → keyboard up immediately; type "glasses" → thing card. Ask something
   absent → *No photo of that yet.* + *Take a photo of it*.
8. Settings → Look → Largest: buttons and tiles grow, footer still fits. High contrast:
   readable.
9. Fixed footer: scroll the board with 10+ things — last row not hidden under the footer;
   footer never floats over a card.

Known risk: `label.file input` covering the whole button — if the tap lands but the camera
does not open, check that the input is not `disabled` and that `pointer-events` on the
label is not blocked by the `.disabled` rule.

## The SSR smoke-test recipe (worked; keep)

```
mkdir -p /tmp/rt && cd /tmp/rt && npm_config_cache=/tmp/npmc npm i react@18.3.1 react-dom@18.3.1
# stubs/firestore.js, stubs/fbapp.js, stubs/fbauth.js export no-op versions of every import
esbuild test.jsx --bundle --platform=node --format=cjs --jsx=automatic --define:__BUILD__="'t'" \
  --alias:firebase/firestore=./stubs/firestore.js --alias:firebase/app=./stubs/fbapp.js \
  --alias:firebase/auth=./stubs/fbauth.js --alias:react=/tmp/rt/node_modules/react \
  --alias:react/jsx-runtime=/tmp/rt/node_modules/react/jsx-runtime.js \
  --alias:react-dom/server=/tmp/rt/node_modules/react-dom/server.node.js --outfile=out.cjs
node out.cjs   # renderToString each screen with fake items; stub localStorage/navigator/document
```

## Half-finished / open

- **S1** (header + footer vs footer only) — built as recommended; Tanya to confirm.
- **Palette** — Tanya to pick from the preview; then decide whether the picker stays.
- `RESEARCH_PLAN.md` still describes schema v2 event types; v3 adds `merge`,
  `naming_failed`, `move_to_top`, `capture_leave`, `lookup_failed`, `capture.beforeName`.
  Update it before the first export is analysed.
- Robert's helper phone and Priya's card: designed (§2), not built.
- Tanya's console list: rules by `household`; composite index (kind, itemId, at).

## Commit

Not committed — the sandbox has no GitHub credentials and leaves lock files (LESSONS).
From the Mac: `git add -A && git commit -m "v0.2: the board model — first board session, UX rebuilt above the engine" && git push`
(or just `./deploy.sh`, which does build + commit + push).
