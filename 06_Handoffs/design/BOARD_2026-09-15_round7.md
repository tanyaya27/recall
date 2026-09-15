# Round 7 (2026-09-15) — approach before building

Ravi's rule for this round: walk through the approach, mock up where it helps, build nothing
that needs a ruling until he has ruled. So this file is in two parts: what was fixed outright
(plain bugs), and what is proposed with rendered options. Mockups are in `mockups/r7_*.png`,
rendered from the app's own stylesheet at iPhone width.

A note on the video: the WhatsApp video attached to the message is a 6½-minute desktop screen
recording of a *test-bench* web app (bench.novacamino.com, someone else's account) — not
ReCall. It was ignored. If a phone video was meant, it did not come through.

---

## Part 1 — fixed outright (built in the rig, 76/76 audit, screenshots in `mockups/r7_bugs.png`)

**Only two photos in one go.** The log held at most 4 photos (`LOG_MAX`), so "Add photo" on a
thing that already had one photo allowed 4 − 1 = 3 … but the camera also counted the cover, so
the shutter locked after 2. Now a log holds the cover plus up to five more (`LOG_MAX = 6`), and
"Add photo" opens the camera for up to 4 shots at once, capped by what the log can still take.
Verified: 4 shots in one go, 5 photos on the card afterwards.

**Roll heights.** Two causes: tap-to-expand ("whole") applied to the centred page only, so the
neighbour peeking in stayed small; and in whole mode each photo took its own natural height.
Now the expanded state applies to every page and every page shares one height (60% of the
screen), letterboxed on dark, so nothing jumps while swiping. Measured: 212/212/212/212/212 px
collapsed, 506 ×5 expanded.

**Camera permission every time.** This one cannot be fixed from the app, and it is worth
being honest about why. iOS treats a home-screen web app as a fresh visitor each launch: every
`getUserMedia` call asks again, and there is no setting that persists it for a web app (Safari
the browser remembers per site; the home-screen app does not). The only web-side workaround is
to keep the camera stream open between shots, which shows the green "camera on" dot the whole
time — worse for Margaret than a tap. The real fix is a native wrapper (Capacitor: same code,
App Store or TestFlight install, permission asked once). That is a build-and-distribution
decision, not a UI one; it belongs with the multi-user redefinition, since TestFlight also
solves "how does Priya install it from another city".

---

## Part 2 — proposals, with options rendered

### 2.1 The "when" line and the private indicator (`r7_combo_when.png`)

Three treatments of the block under the photo. Column 0 is today's.

- **A — clock on the when line, private BAND above the photo.** The band is the loudest
  private indicator that is still calm: icon + words on the soft green, a thick left edge. It
  does not depend on colour (a colour-blind reader gets the lock and the sentence) and it sits
  where the eye lands first.
- **B — icon column.** Pin = place, clock = when, lock = private, all on one left edge. Reads
  as a list of facts. The private line is the last row, in accent, bold.
- **C — when as a soft pill; lock badge ON the photo** (the same badge the grid tile already
  uses) + a words line under. Consistent with the tile, so "lock on the picture = private"
  becomes one rule everywhere.

Board: Maya and Devin both take **B** for the when-line problem (the icon column is what
makes place / resting-on / when stop reading as one blob) and **C's badge** for private (one
rule, tile and card). Priyanka: A's band is the most visible, but it pushes the photo down on
every private item. Margaret (persona): "the little clock tells me that line is the time; the
lock on the picture is what I already saw on the front." Recommendation: **B + the C badge**
(icon column, lock badge on the photo, no separate band). Private line kept as the last row
in the column so it is also in words.

### 2.2 Age pill on each photo (`r7_combo_age_toast_tile.png`, left)

Today the pill top-left says "today" / "Saturday" per photo *and* the when line under the
card changes as you swipe. Two things saying one thing. Board is unanimous: **drop the pill**;
the dots + the when line (now with the clock) carry it. Sam's one condition: the when line must
visibly change on swipe — it does (it is bound to the centred page).

### 2.3 Private / shared toast (`r7_combo_age_toast_tile.png`, middle)

Today: "Private — only this phone shows it" and "Shared with the household" — two shapes.
Proposed one shape: **icon · "Now private" · who sees it**, and **"Now shared" · everyone at
home sees it**. Same length, same grammar, lock/unlock glyph matching the button that was just
pressed. No ruling needed unless the wording is wrong.

### 2.4 "No place yet" on the grid (`r7_combo_age_toast_tile.png`, right)

Row 1 today (amber words under the name). Row 2: an amber **pin-with-question badge**, same
size and corner as the lock. Row 3: badge plus an amber strip on the photo reading "Where is
it?". Board: Devin — badge only (row 2) keeps the tile quiet and makes the two badges a family;
Maya — the badge alone is not decodable by a first-time Margaret, so she wants the strip
(row 3) or the words kept. Robert (persona): "a question mark on a pin — I'd get it." Split.
Recommendation: **row 2 (badge only)**, and the badge tap opens the card with the place field
focused — so the badge is also the fix.

### 2.5 "Look and feel" → rename

Options: **"Text size & colours"** (says exactly what is inside; Margaret-proof), "Appearance"
(shorter, iOS-familiar), "Display". Board: Maya — "Text size & colours"; Devin — "Appearance".
Recommendation: **"Text size & colours"** — the one label that needs no explaining.

### 2.6 Locations (`r7_combo_loc_putback.png`, left two)

Replaces the text blob. **One list**, every place that is used *or* saved, newest-used first:
a photo square (the place's own photo, else the last thing seen there, else a camera
placeholder), the name, how many things are there, chevron. Below it one button, **Add a
location**, which opens the camera first and asks the name after — same shape as logging a
thing. Tapping a row opens **one location**: its photos (up to 3, with "Add photo"), the name
with a pencil, the things there now as small tiles, and an amber "Remove this location" at the
bottom (a confirm sheet; things keep their place text, only the saved place goes).

Place photos do two jobs: they show when logging (2.7) and they give the AI reference images
so "where is it?" can be pre-answered from the photo. Tech (Sam): place photos are `kind:'place'`
docs that already exist, plus a `photos[]`; the AI prompt gains a "known places" block with
one reference image each, only when there are ≤ 6 places with photos (token cost).

### 2.7 "Where is it?" view modes (`r7_combo_where.png`)

Three modes, one link under the list to switch, the choice remembered per phone:

1. **Names** — today's list.
2. **Name + photo** — the place photo (or last thing seen there) as a small square on the left
   of each row. Same row height ± a little.
3. **Photo list** — big place photos two across, name and count under each.

The same three modes drive the hamburger's Locations screen if wanted, but the board is
against a toggle there — one list view (2.6) is enough. Board on the default: Maya — mode 2
as default once a place has a photo, names before that; Devin — names by default, link to
switch. Margaret: "the pictures help me more than the words." Recommendation: **mode 2 becomes
the default as soon as any place has a photo**; the link toggles to 3 then back to 1.

### 2.8 "Where do I put it back?" — ideas, not a build

The reverse of Find: Margaret is holding something and wants to know where it *lives*, not
where it was last seen. Three ideas, cheapest first:

1. **Nothing new on screen; the card already answers it.** Find by photo → the thing's card →
   the big place line is where it was last seen. For most things, last seen = where it lives.
   Cost: zero. Gap: things that move (glasses, keys) show where they were dropped, not home.
2. **A "Lives on" row on the card** (`r7_combo_loc_putback.png`, third column). Derived, not
   typed: the place this thing has been logged at most often (with the count as reassurance),
   with that place's photo. Editable through Edit if she wants to pin a home. Find by photo →
   card → *Kitchen counter (now) · Lives on: Bedside table*. Both questions on one screen, no
   third verb, no new flow to learn. Cost: ~half a day.
3. **A third verb on Home: "Put back"** (fourth column). Camera → matches the thing → shows
   only the home place, large, with its photo. The most no-brainer, but it reopens the two-verb
   ruling, shrinks the buttons, and gives Margaret one more thing to choose between before she
   has even raised the phone.

Board: unanimous for **2** now, with 3 held until the use-case redefinition (a "put back" verb
may make more sense on a helper's phone than on Margaret's). Robert: "the count next to it is
what would make me trust it."

---

## Rulings needed before building

1. When line + private: A, B, C, or the recommended B + C-badge?
2. Age pill: drop (recommended) or keep?
3. Toast wording: as proposed?
4. No place yet: row 2 badge (recommended), row 3 badge + strip, or keep the words?
5. Menu label: "Text size & colours" (recommended) / "Appearance" / "Display" / other?
6. Locations: build 2.6 as drawn? Any row you want different?
7. Where is it?: three modes with the link; default mode 2 once photos exist (recommended)?
8. Put it back: idea 2 now (recommended)? Or 1 (nothing) / 3 (third verb)?
9. Camera permission: accept the limitation for now, and add "native wrapper / TestFlight" to
   the multi-user session's agenda?

After the rulings: build, rig audit, screenshots to you, then deploy — and only then the
system-docs update and the prompt for the multi-user session.
