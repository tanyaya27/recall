# Requirements: hardening the where-camera (2026-09-27, adversarial review)

**Status: reviewed by a NEW adversarial board (Ravi's instruction, 09-27), then executed the same session on
Ravi's standing instruction to proceed without per-step review. That instruction, and who objected, is in
DECISIONS 09-27.** Nothing here is deployed; the deploy commands stay with Ravi.

Ravi's complaint, verbatim in kind: *"when you add a pencil to a new location, you can still only create one
photo per tier"*; *"when you add a photo to a tier and it is a location we recognize, we should tell user and
let them confirm"*; *"if it is an entirely new place, user should just name it right there"*; *"the user has to
come back and then clean up items in the 'Not put away' list which is nonsensical for places that are not
things."*

## 0. How this review was done

- The rig was rebuilt from `RIG.md` in the cloud container. **Baseline: all six audit suites pass, 258/258**
  (audit 100 · roles 44 · graph 66 · label 14 · private 34; audit_modes retired). So everything below is a
  *design* defect the audits never asserted against — each requirement therefore ships with a new assertion.
- A fresh walk script (`rig/walk_f1.js`) drove **every screen and every camera branch in both looks (A and B)**:
  90 states, 90 screenshots (`rig/shots_walk/`, not committed — 57 MB; the inventory is), zero console errors.
  The screen-by-screen record — every control, its label, where it leads — is
  **`rig/WALK_INVENTORY.md`** (committed). Claims below cite shots by name.
- The board then walked the inventory and the shots twice: once for logic (can every state be reached and
  left; does any path lie), once visually (what the screen *says* happened vs what happened).

## 1. The room (new cast, adversarial on purpose)

Standing boards reviewed this design three times in two days and passed what Ravi's phone test caught in
minutes. So this round is new people whose job is to break it, not to like it.

- **Grace Okafor — PM, 12 years, consumer banking apps.** Ran release gates where a defect costs real money.
  Doctrine: *every state reachable, every state leavable, every mutation announced.* Owns the click-path
  matrix and the scope knife.
- **Tomás Rivera — interaction auditor, 15 years.** Heuristic-evaluation practice (status visibility, user
  control, error prevention). Has audited two camera-first POS apps. Owns the walkthrough method.
- **Frank, 67 — retired contractor.** Adversary: fat thumbs, double-taps everything, never reads a prompt,
  abandons mid-flow, and his garage has four things called "bin".
- **Mei, 34 — professional organizer, 400+ items.** Adversary: deep chains, duplicate names, renames
  mid-flow, tries to make the taxonomy contradict itself (a tote bag: box or place?).
- **Sunil, 72 — ESL, low vision, largest text, VoiceOver sometimes.** Adversary: reads every label
  literally; anything icon-only, ellipsized into ambiguity, or covered by the keyboard fails him.

Margaret, Robert, Dr Kim et al. were deliberately left out of the walk and only consulted on the finished
requirements (§5), so the new eyes stayed new.

## 2. What the walk found (F1–F10, each tied to evidence)

**F1 — A picked identity is destroyed by the next photo, silently renamed by an unconfirmed AI pass.**
Chip-pick "Linen closet shelf" (0 photos), then shoot that shelf to give it a photo: the pick is wiped
(`LogCamera.shot()`: `photos: [...(cur.known ? [] : cur.photos)…], known: null`) and the level re-enters
`naming`, coming back as "Shelf". Shots `b-d-01→03`: the sentence visibly flips from *Linen closet shelf* to
*Shelf* and nothing tells her why. Tomás: "this is the cardinal sin — the screen renames her world and doesn't
say so." **This is the mechanism behind Ravi's 'one photo per tier': a tier cannot hold both an identity and
added photos.**

**F2 — A typed place never becomes a place.** "A new place called 'Attic crawlspace shelf'" (WhereList) saves
as a bare `location` string on the item. `saveChain` calls `addPlace` **only** on the photographed branch; a
`known:{t:'place'}` link just becomes text. Consequences, all confirmed live: the place has no record, can
never hold photos through this path (shot `b-f-06`: the destination square is a bare pin), won't dedupe (a
later *photographed* "Attic crawlspace shelf" creates a second, parallel place doc), and Places shows it
photo-less forever unless she rebuilds it by hand. This, plus F1, is the whole of Ravi's gap 1.

**F3 — Name collisions merge silently.** The "Your wooden box?" ask fires only on the AI's *visual*
sure-match (≤4 boxes + **2** places as candidates). If the AI merely *names* a photographed where the same as
an existing place, `addPlace` dedupes case-insensitively and **silently appends the new photos to the existing
place** — no ask, no announcement (Q2 evidence in `WALK_INVENTORY.md`). Mei: "I have five 'Shelf's. You just
merged my crawlspace into my closet and told no one." The confirm Ravi asked for exists for one match path and
not the other.

**F4 — A new place's name can't be given or fixed at capture.** The AI names it in the background; the level
shows "Naming…" then the AI's word. There is no rename on a level — the "What is it?" sheet exists only for
the thing. Her only outs (the pencil) both destroy work (F5). Ravi's gap 3, exactly.

**F5 — The pencil throws away the chain.** "Change where it goes → Photograph it again" resets **all** levels
to one empty level, even a 3-deep chain. There is no per-level replace, rename, or remove. (Q3 evidence;
`Choice` options in `LogCamera` ~line 440.)

**F6 — A where-box at the end of a chain becomes a chore.** Outermost new box gets `location:''`
(`saveChain`, outer=null) → it satisfies `!location && !holderOf` → **Not put away** lists it and Home's
amber pill counts it (shot `b-e-04`: "Shoe box · 1 inside" sitting under *Not put away*). She used the shoe
box to *answer* "where"; the app answered back with homework. Ravi's gap 4. Home's tile also flips to the
amber "No place yet" reverse block for it (`Board.jsx` 103–109) — the same nag twice.

**F7 — Asks can stack.** Identity ask + where ask + privacy note can render together on the answer card
(shot `b-c-01` shows two at once with the chain squeezed). No defined priority.

**F8 — The where-candidate pool starves places.** `nameWhere` sends 4 boxes + **2** places. A household with
eight photographed places will routinely fail to sure-match the very place being photographed → new-place
path → F3's silent name merge does the "recognition". Recognition by name is doing a job assigned to
recognition by sight.

**F9 — Look A drift risk.** A carries the chain on the photo *plus* the sentence card (`a-c-01`); every new
control below must exist in both looks or A rots. (Both-looks parity is asserted nowhere today.)

**F10 — Small print.** Chip labels ellipsize into ambiguity at large text ("Linen closet…"/"Wooden…" —
Sunil can't tell two "Linen…" chips apart); level squares have good aria labels but the ✎/✕ pattern proposed
anywhere must keep ≥44 px targets and words beside icons (Frank + Sunil, jointly).

**Where the board disagreed** (recorded, per house rule):
- Tomás wanted a **confirm on every photo attached to a picked identity** ("Add this photo to Linen closet
  shelf?"). Grace and Frank overruled: the user *selected the level and pressed the shutter* — intent is
  explicit; a confirm per photo makes Robert's bin-packing unbearable. Resolution: attach silently **with a
  visible count badge and per-photo remove** (R1), confirm only when *identity* is in question (R4).
- Grace wanted where-created boxes to still appear in Not put away "or orphans multiply". Overruled by the
  walk itself: the box is reachable from its page, Find, the chain answer, and Home; a *chore list* is for
  things the user said exist but never placed. Compromise recorded in R6: soft nudge on the save card, no
  chore.
- Mei wanted PLACE_PHOTOS raised to 10. Priyanka's constraint stands (photos live inline in Firestore docs):
  **6**, with a byte guard (R2).

## 3. Requirements

Numbered, testable; every one lands in an audit (§4). "Level" = tier in the camera chain. All apply to BOTH
looks (F9).

### R1 — A level holds an identity AND photos; the shutter attaches, never replaces (kills F1, half of gap 1)
1. A level's state is `{identity, photos[]}` where identity ∈ known-place / known-box / new-place /
   new-box / none. Taking a photo on a level **with** an identity appends to `photos[]` and **keeps the
   identity**. No re-naming pass runs for a level that already has an identity.
2. The level square shows the photo count badge (exists) and the sentence keeps the identity's name.
3. Per-photo remove in the level preview (exists) still works for attached photos; removing the last
   attached photo does not clear the identity (identity was picked, not derived).
4. A shot on a level with **no** identity behaves as today (naming pass → R4/R5).
5. Acceptance: chip-pick a place → shoot twice → sentence and square still name the pick, count = 2; on
   Save the two photos are on the place doc (R2), not a new place.

### R2 — Every "where" the user names or picks becomes/updates a real place record (kills F2)
1. `saveChain` creates a place doc for a typed-new place link (`known:{t:'place'}` whose name has no place
   doc), with any photos the level gathered (may be zero).
2. Photos attached (R1) to an existing known place flow to `addPlacePhotos` at save; to a known box, onto
   that item as extra photos (existing add-photo path).
3. `PLACE_PHOTOS` rises 3 → **6**; `addPlacePhotos` refuses (silently keeps first N) beyond the cap or when
   the doc would exceed the size guard (~700 KB); place photos keep using `compressPlacePhoto`.
4. After a typed-new pick from WhereList, the camera keeps that level **selected**, prompt: *"{Name} — add a
   photo of it, or tap ＋ for where that is."* So the typed path can photograph immediately (the b-f dead
   end dies).
5. Acceptance: typed place saves → place doc exists, appears in Places with its photos; second use of the
   same name (typed or photographed) resolves to the SAME doc via R4, never a duplicate.

### R3 — Name a new place right there (kills F4, gap 3)
1. Every level's name is editable at capture: tapping the name in the level preview, or the level's row in
   the chain sheet (R5), opens the "What is it called?" sheet pre-filled with the AI's name; applies to that
   level only. Secret-text guard as on the thing's rename.
2. While `naming`, the sheet is reachable immediately ("Name it yourself"); a user name wins over a late AI
   name (AI result then only fills description/aliases, never overwrites the given name).
3. A new place/box never saves with a placeholder name silently: if the name is still "A place"/"A box"/
   empty at Save, the save proceeds (never block the save) but the confirmation card marks that link
   *"Unnamed — tap to name"*, and tapping renames the created doc.
4. Acceptance: rename a level pre-save → doc created with the user's name; AI result arriving later does not
   overwrite it.

### R4 — Recognition is confirmed both ways; collisions never merge silently (kills F3, F8; gap 2)
1. Visual sure-match ask (exists) stays.
2. **Name-collision ask (new):** when a level's AI name (or a typed name) equals — `normName` — an existing
   place or container, the level shows the same ask: *"Your {name}?"* **Yes** → level becomes that known
   identity and its photos attach per R1/R2 (this is Ravi's "the photo may be slightly different/new" case:
   the place learns the new photo). **No, a new one** → identity stays new AND the rename sheet opens
   pre-filled, with the line *"There's already a '{name}'. Give this one its own name."* The Save button
   stays disabled for that level's link only until the name differs (Mei's five Shelves stay five).
3. Candidate pool for the visual check: up to 4 boxes + **4** places (was 2), still one `whereIs` call.
4. Only one ask renders at a time; priority: thing-identity ask → level asks in chain order → (privacy note
   always visible below, never counted as an ask). (F7.)
5. Acceptance: photographed where AI-named "Kitchen counter" with an existing Kitchen counter → ask appears;
   Yes → photos land on the existing place, no new doc; No → distinct name required, two docs after save.

### R5 — The chain sheet: the pencil edits one level, not the world (kills F5)
1. The sentence pencil opens a **chain sheet** replacing today's 3-option Choice: one row per level — thumb,
   name (tap = R3 rename), **Replace** (clears that level's photos+identity, selects it, back to camera),
   **✕ Remove level** (deeper levels shift up; refused with a plain line if it would orphan an ask in
   flight). Bottom: *Photograph more* (adds a level, = ＋) · *Pick from every place and box* (WhereList,
   targets the selected level) · *No place yet* (clears all, with confirm when >1 level filled) · Cancel.
2. Net sheet count is zero: the old 'change' Choice dies into this.
3. Targets ≥44 px; ✎ and ✕ carry words ("Rename", "Remove") not icons alone; rows never ellipsize the name
   below 12 characters (F10, Frank+Sunil).
4. Acceptance: 3-level chain → replace level 2 → levels 1 and 3 untouched; remove level 2 → chain is 1→3.

### R6 — Not put away lists only true chores (kills F6, gap 4)
1. A container created as a where (`saveChain` moves-branch) is stamped `asWhere: true` at creation.
2. The Not-put-away list and Home's amber count filter to: no location, no holder, **and not `asWhere`**.
   (A level-0 thing and a typed "Write it down" thing still qualify — those are real chores.)
3. Home tile for an `asWhere` container with no place: line 2 shows contents ("N inside") or "—", **not**
   the amber No-place block; its own page keeps the quiet "Put it somewhere" affordance so it can be placed
   any time. If the user later *moves* it (Move it), it behaves like any container.
4. Soft nudge instead of homework (Grace's compromise): when Save ends with an outermost NEW box and no
   outer level, the confirmation card's second line reads *"You haven't said where the {box} is — its page
   can, any time."* No blocking, no chore.
5. Acceptance: flow (e) re-run → Not put away stays empty, count pill absent, Home tile shows "1 inside",
   card shows the nudge line.

### R7 — Both looks, both audited (kills F9)
Every control above exists in A and B; the audit walks both looks for R1–R6 acceptance paths (the walk
script already parameterizes `look`).

### R8 — Out of scope, named so no agent wanders (Grace's knife)
Voice, native wrapper, multi-select put-away, People/roles, AI model/prompt changes beyond the candidate
count, Home ordering, deploy. The Firestore **rules need no change**: `asWhere` is set at create by the
owner/editor path already proven; place docs unchanged in shape.

## 4. Audit map (all new assertions land in `rig/audit_where.js`, new suite)

| Req | Assertions (≈) |
|---|---|
| R1 | attach-not-replace; badge count; identity survives remove-photo; no rename pass on identified level |
| R2 | typed→doc; photos attach at save; cap 6 + byte guard; selected-after-typed prompt |
| R3 | pre-save rename wins; late AI no-overwrite; unnamed marker on card |
| R4 | collision ask both branches; distinct-name gate; pool 4+4; single-ask priority |
| R5 | replace/remove one level; old Choice gone; 44 px probes |
| R6 | asWhere excluded from list+count; tile line 2; nudge line |
| R7 | every above in look A and look B |
Existing 258 stay green. Target ≈ 55–65 new checks.

## 5. The standing personas, consulted on the finished text (one line each)
Margaret: "It stops renaming my shelf. Good. Don't ask me twice about the same box." (R4.4 covers it.)
Robert: bin-packing = shutter, shutter, Save+next — unchanged, attach makes it better. Dr Kim: the
distinct-name gate must never block *saving the thing* — it doesn't; only that link's identity (R4.2 wording
checked). Harold: no new nags on Home — the amber pill now appears less, not more. Dan/Leila/June: typed
storage-unit names finally get photos (R2.4) — this was Leila's whole scenario.

## 6. Execution order (agents, this session)
1. **Stage 1 — db + graph:** R2, R6.1–2 (`saveChain`, `addPlace/addPlacePhotos`, `NotPutAway`, Board count),
   `asWhere`, PLACE_PHOTOS 6 + guard. Audit first cut.
2. **Stage 2 — camera core:** R1, R3, R4 (LogCamera state model, asks, rename per level, pool 4+4).
3. **Stage 3 — chain sheet + tiles:** R5, R6.3–4, R7 parity.
4. **Stage 4 — verification:** fresh agent re-runs `walk_f1.js` + new walk of R-paths, both looks; screenshots
   composed for Ravi; all suites green; sync files back.
