# Fast capture: three rendered options (2026-09-24)

Follows `BOARD_2026-09-24_fast-capture-brainstorm.md` §7. Drawn from the app's stylesheet in the
rig (`rig/gen_c1.py`, `render_c1.js`, `compose_c1.py`). Photos are from Wikimedia Commons
(`rig/mock/img/CREDITS.md`, including the junk drawer). No app code changed.

Pictures: `mockups/C1_1_strip.jpg` · `C1_2_card.jpg` · `C1_3_everything.jpg`.

**Tap counts** start from the ReCall icon on the home screen (the web app), which is how every app
today is reached. Every web version also gets iOS's camera prompt on each launch until the native app.

| | One thing | Five things, one place | A drawer of 6 things |
|---|---|---|---|
| Today (`20260924b`) | 5 | ~25 | ~30 |
| **1 · The camera never leaves** | **4** (native: 3) | **9** | — |
| **2 · Photo card, place already chosen** | 5 (no place question when sure) | 17 | — |
| **3 · Everything in view** | — | — | **6** |

## The options

1. **The camera never leaves.** The shutter saves. A frosted strip over the live camera shows
   *Saved*, then the name and the place as the AI finds them. The next shutter press means "that
   one is right".
   - A sure place is already chosen, with ▾ to change it. An unsure one shows three choices and
     nothing picked.
   - A session place ("Hall table · every photo") applies to every shot until it's changed.
   - *Done* opens one review of the session, where you fix only the wrong names.
   - The ＋ on a thumbnail adds another angle to that thing.
2. **Today's photo card, with the place already chosen and saved.** *Next item* goes straight back
   to the camera. It's the small change.
3. **Everything in view.** A switch in the camera: one photo logs everything the AI can see, all at
   one place.
   - **Works today:** a list of what it found, each with a switch, and "tap it in the photo" to add
     one it missed.
   - **After the position test:** labels pinned on the objects.
   - Later, *Find "duct tape"* answers with the drawer photo, the place, and where in the drawer.

## The boards

- **Devin:** option 1 as the one way to capture, with 3 as its switch. "The camera is the app now;
  the photo card was a page we made her visit." His condition: *Done* is always visible, the review
  appears only for two or more things, and one thing ends with a toast, as today.
- **Margaret and Linda:** they prefer 2. "One question on one page; I know when I've finished." The
  strip's words over a photo are harder to read for them at Largest (drawn: it holds, but is dense).
- **Robert, Dan and Leila:** 1 and 3. Leila: "13 things into a box in 17 taps, or I don't do it at
  all."
- **Noor:** 1. "The frosted strip is the first thing in this app that feels made for a phone." She
  wants the strip's first appearance to take 120 ms, and nothing else to move.
- **Priyanka (cost):**
  - Option 2: 1 day.
  - Option 1: 3 days (a continuous camera, the AI streaming per shot, the review, the session place).
  - Option 3, list version: 2 days. Labels on objects wait for the position test (Gemini boxes /
    Apple's subject lift / Claude on 20 real drawer photos).
- **Sam, two catches that the pictures made visible:**
  - **Where a guessed place came from must be stored** (`placeSource: session | usual | guess |
    chosen`). A wrong guess the person never corrected can then be found and fixed later, instead
    of silently looking like a fact.
  - **Option 3 makes six things from one photo, so without positions all six covers are the same
    drawer photo.** On Home that is six identical tiles. Until the position test gives crops, the
    things from a sweep appear on Home as **one tile, the place**: *Kitchen drawer · 6 things*.
    Find still answers each one by name. Devin agrees: a sweep must never flood her board.
- **Maya:** build option 1 in step 2 (#6) and option 3's list in step 3 (#8), as already sequenced.
  Option 2 isn't needed if 1 ships, and building both costs time we don't have.

## The split for Tanya

**Option 1 for everyone, or option 2 as the everyday-things setting** (Margaret and Linda), with 1
for the tools, boxes and garden set-ups? Devin and Maya: one capture for everyone; the "configure,
never accumulate" rule argues against two cameras. Margaret and Dr Kim: the setup questions exist
precisely to give her the gentler one.

## Rulings

1. **Option 1** (the camera never leaves) for step 2?
2. **Option 3's list** in step 3, with labels only after the test, and sweep things shown on Home as
   one place tile?
3. **Option 2 as an everyday-things setting**, or not at all?
4. Accept Sam's `placeSource`, so an uncorrected guess stays visible as a guess?
