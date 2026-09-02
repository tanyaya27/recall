# Review of mockups v1 — 2026-09-02

Mockups produced by Claude Design from `ReCall_MVP_Design_Prompt_v1.md`.
Published copy: https://claude.ai/code/artifact/9238a41d-5273-41da-8e48-826185f86a3d
Standalone export belongs in `mockups-v1/` (Ravi to add).

## What worked

- Palette, type, tile size and copy tone are right. Warm neutrals, one green accent, amber for
  "not yet", no red anywhere. Keep all of this in v2.
- Showcase screens are tagged "Preview" as required.
- The three role homes (A1 / B1 / C1) are correctly different.
- Answer card (A4) is close to final: photo, place, human time, "Fix", one re-snap button.

## What failed, and why

**1. No navigation.** Every screen except Home is a dead end with a small "Back" text link at
top-left — the corner a thumb cannot reach one-handed. Home's "Recent photos" and "Settings"
are text links, not buttons. Cause: prompt v1 said "no tab bar with five icons; this screen has
one job", and the designer read that as no persistent navigation at all.

**2. Finding things and checking routines are drawn the same way.** The app has two jobs that
v1 never named as different:

| | Find | Check |
|---|---|---|
| Question | Where is it? | Did it happen today? |
| Examples | keys, glasses, wallet | pills, stove, doors |
| Lifecycle | permanent; updated on re-snap | resets daily |
| Answer | photo of a place | photo as proof + a time |

In v1 both are photo cards with a "Photograph…" button on the same Home surface. The amber
"Morning pills — not yet" tile sits directly above the Keys tile; the Nightly screen reuses the
item-tile look. A new user cannot tell whether "Stove" is a thing to locate or a task to do.
Cause: prompt v1 listed A8 (medication) and A9 (nightly) alongside the Find screens with the same
"photo + confirm" language.

**3. Smaller**

- C1 third indicator "Nothing captured yet today" in grey reads as a quiet alarm. Reword.
- Saved-state copy "Your keys is saved" — grammar bug in the mockup, not a design issue.
- A5 Ask does not show the transcript-before-send state.
- A2 suggestion card with location chips was not rendered; capture goes straight to "saved".

## Decisions carried into prompt v2

- Two named domains, **Find** and **Today**, with distinct visual grammar.
- Persistent bottom bar on every patient screen: Find · Today · Camera. Back is a large
  bottom-area button, never a top-left text link.
- Check items (medication, nightly safety) live under Today, not among item tiles.
