# 2026-09-05 — First real use, four hours of ghosts, and the decision to rebuild the UX

**Machine:** Ravi's Mac + iPhone. **Outcome:** the app worked for the first time, and the
way it worked convinced Ravi to rebuild the interface from scratch through a board.

## What shipped

- **Installable home-screen app** — manifest, icons, standalone, safe-area insets.
- **The place is asked, never asserted.** `tagPhoto` now answers three separate questions —
  what it is, what it is *resting on* (visible), and where it is (usually not visible, so
  ranked guesses anchored to the household's known places). Known items go into the prompt
  too, turning open-vocabulary naming into matching, which improves as the vault grows.
- **Place chooser** — guesses, household chips, type, or dictate. Save is gated on a place,
  with an explicit "I don't know where it goes yet" escape that marks `needsPlace`.
- **Subject question** for ambiguous wide shots: "What did you want to remember?" in words,
  not by making anyone draw a box.
- **Soft delete** — remove → Settings → Recently removed → Put back / Delete for good.
  `purgeItem` takes the item's snaps with it so photos don't orphan.
- **Two-stage AI diagnostic** in Settings, build stamp in local time, cache escape hatch.
- **Back moved to the top** of every screen.

## Bugs found and fixed

- **Auto-save was saving the AI's guessed place** four seconds after the confirm screen
  appeared — which is how "on the black fabric on the floor" got saved without consent.
- **Re-snap inherited the old location**, attaching yesterday's room to today's photo.
- **A sticky element as the last child** has nowhere to stick; the Back button floated over
  the card. Visible in Ravi's screenshot.
- **Tile labels covered the photo** when a name wrapped. Label now sits below the image.

## Four hours lost to two non-code causes

Both now in `LESSONS.md`.

1. **A VPN exiting in another country.** Anthropic geo-restricts at the edge; requests got a
   canned 403 before reaching the API, and the browser reported a bare `Load failed` — which
   looks exactly like being offline. Confirmed by comparing the raw JSON from the phone
   against the Mac: different shape meant an interceptor, not Anthropic.
2. **The key's *name* pasted into the Model field**, producing `404 not_found_error` *after*
   authentication succeeded. The field is now hidden behind "change".

**The cost of guessing:** the app told Ravi "No internet just now — the photo is safe" while
he was online. Both halves were wrong, and he was rightly angry. A confident wrong diagnosis
discounts everything the app says afterwards. That is now a convention in `CLAUDE.md`.

## The decision that matters

Ravi: *"we need to stop and build a professional UX from scratch. What we have today is so
bad it is getting in the way of evaluating the benefit of the underlying features."*

Adopted the Plantwise/Ardina method — **two boards**, documented in
`02_Strategy/PRODUCT_BOARD.md`:

- **Build board:** Maya (PM), Devin (design lead), Priyanka (engineer), Sam (architect).
  Claude plays all four; they disagree in writing.
- **End-user board:** the 20 advisory personas. Every UX and feature decision goes past them.
- **Tanya decides**, and is shown the disagreement rather than a laundered consensus.

Scope agreed: **rebuild everything above the engine.** Firebase, `db.js` and `ai/engine.js`
stay — they contain no UX and were just proven working. The engine is kept but *reviewable*.
Rationale in `DECISIONS.md`; the evidence for needing this is right here in today's log,
where Back moved three times in an hour because nobody owned the interaction model.

## Also done

- `milestone-moments` added to the prioritizer (attractive, phase-2) with the clinical
  concern, the Caring Village positioning risk, and a cheaper test to run first.
- Found the prioritizer JSON and HTML had drifted — `how-to-videos` existed in one and not
  the other. Both resynced at 76 features.
- Audited for missing hygiene features. **Still unbuilt:** snap pruning (every re-snap
  writes another ~150KB photo doc forever — this compounds silently), undo, vault export,
  duplicate detection, delete-everything, accessibility pass.

## Next session

`06_Handoffs/NEXT_SESSION_BRIEF.md` — convene the board, design the interaction model,
argue about it, run it past the personas, then build only the first-session cut. The opening
prompt is at the end of that file.

**Constraint:** real users within a day or two. Design the whole thing, build only what a
first session touches.
