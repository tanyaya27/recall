# Board — 2026-09-14 — Ravi's second round of phone feedback (ten items)

Raised by Ravi after using `20260905l` on the phone. Grouped by what kind of decision each
is. Items 5, 6 and 7 have a verified cause in the source and are fixed without a UX
vote; the rest went through both boards.

## Verified causes first (Priyanka)

**6 — search shows things that don't match.** `matchThings` (`lib/speech.js`) takes every
word she typed and keeps an item if *any token* of name, place, description or
resting-on *starts with* it. Two effects: the AI's one-sentence description ("a black
folder on a wooden table") matches on "table", "black", "wooden" — so a search for
"table" returns the folder; and a two-letter prefix ("fo") matches "fork", "folder",
"folded". No ranking at all: results come in board order. The AI fallback (`answerQuery`)
is separate and only runs on submit.

**4 — duplicate after a rename.** The merge check is `findByName(items, tag.name)` — an
*exact* string match between what the AI called it this time and the item's stored name.
Rename "glasses" to "reading glasses" and the next photo's "glasses" matches nothing, so
it becomes a new item. The AI is shown the catalogue of names and told to reuse one, but
it sees the *renamed* list, and nothing remembers what it called the thing before.

**5 — the two footer buttons look different; the dark one has black text.** *Log item* is
a `<label class="btn-primary file">` (so the camera opens on the tap); *Find item* is a
`<button>`. `styles.css` line 74 sets `label.file { color: var(--ink) }` — specificity
(0,1,1) — which beats `.btn-primary { color: var(--accent-ink) }` at (0,1,0). So the label
is ink-black on accent green; the button is accent on card. Same rule family explains the
apparent weight difference: white-on-green and green-on-white read as different sizes
even at one font-size. Not the palette: Linen's `--accent-ink` is white. Fix: specificity,
plus the bigger label Devin asks for below.

## Build board

### 1 — the history of places is not visible
**Maya:** it *is* there — *Not there? Earlier photos* on the thing card lists every older
photo with its place and time. Ravi didn't find it, and he built the app. So it isn't.
**Devin:** the button's name is the problem — it answers "not there?" and hides
"where has this been". Proposal: under the photo, the place in big words as now, then a
short **place list** — the last few places with their times ("Kitchen counter · yesterday
evening", "Bedside table · Tuesday") — three rows, then *All photos*. A row tap shows that
photo. The list is text, cheap, and readable without opening anything.
**Sam:** the item doc already carries `history[]` (place, at) — no extra read. Photos
still load on demand.
**Priyanka:** agree; keep `Not there?` phrasing somewhere — it is the situation she is in.
Split: Devin wants three rows always; Maya says show the list only when there is more
than one place, so a one-place item stays as calm as today. **Recommend Maya's version.**

### 2 — several photos in one log (close-up + far away)
**Devin:** after the place is saved, the photo card shows *Saved · kitchen counter* and
one more button: **Add another photo** (camera). The second photo joins the same log — same
place, no question asked, same *when*. Depth stays one.
**Maya:** objection — scope. The workaround exists (*Found it — new photo*). But that asks
the place again and stamps a new time. Concedes it is the wrong tool.
**Sam:** snaps get a `logId`; the item's cover photo stays the *first* of the log (the one
she framed), the thing card shows the others as *More photos from this time*. Photo list
groups by log.
**Priyanka:** two-tap cost. Fine. Cap at 4 per log — the AI names only the first.
Split: Robert-only feature (behind the helper setting) vs for everyone. **Recommend
everyone** — Margaret framed the close-up; Robert takes the wide shot.

### 3 — deleting one photo from the log
**Devin:** each photo in the list gets one quiet control, **Remove this photo** → the
in-app confirm sheet (*Remove this photo? · Keep it / Remove*) → toast *Photo removed ·
Undo*. Dead simple: one control, one question, one way back. If it is the cover photo the
next newest becomes the cover. If it is the last photo, the sheet says *This is the only
photo of your glasses — remove the item?* and goes through the existing remove flow.
**Maya:** put it behind *Fix or remove* so Margaret never sees a delete near a photo.
**Devin, reply:** Ravi's case is "too many or duplicate photos" — that is *while looking
at the list*; a control two screens away won't be found (see item 1). The confirm sheet
is the guard.
**Sam:** soft-delete on the snap (`deleted`, `deletedAt`); purge with the item.
Split: inline per photo vs behind Fix. **Recommend inline.**

### 4 — duplicate after rename (fix design)
**Sam:** keep every name the AI has given a thing: `aliases[]` on the item — the AI's
name at first capture, and the old name when someone renames. Match on name *or* alias,
after normalising (lowercase, singular/plural, drop "your"/"the"). Then a second,
softer tier: if the AI's name shares its head noun with exactly one item ("glasses" ↔
"reading glasses"), treat it as a match — the card already asks *not your glasses?* so a
wrong soft match costs one tap.
**Priyanka:** and tell the AI what it called things before: the catalogue line becomes
"reading glasses (also: glasses)". Cheap.
**Maya:** no user-visible change; the D4 guardrails stand. No objection.

### 5 — footer labels (fixed above) + Devin's size pass
**Devin:** label to `min(1.375rem, 6vw)`, weight 700, the icon a little larger; the
Footer measures and drops to icons if it no longer fits, as designed.

### 6 — search ranking
**Ravi's order:** name match › similar word in the name (folio ~ folder) › description ›
place. **Priyanka:** four tiers, strict inside each: (1) a name word *equals or starts
with* the query word; (2) a name word within edit distance 2 of a query word of 4+
letters — "folio"→"folder" is 2 edits, "glases"→"glasses" is 1; (3) description word
prefix; (4) place / resting-on prefix. Multi-word queries: every word must land somewhere;
the tier is the *worst* word's tier. Minimum 3 letters before description or place
count at all (two letters only search names). Tier 4 shown but under a quiet *Also
mentions…* line so a place hit isn't mistaken for the thing.
**Devin:** no objection to tiers; objects to a visible label on tier 4 — Margaret reads
every word. Compromise: order only, no label; Priyanka accepts.
**Maya:** the AI fallback stays for the question tiles can't answer.

### 7 — editable fields do not look editable
**Devin:** every `EditableText` gets a **pencil icon** at the right and a hairline
underline in the accent colour — the phone convention for "this is a field". On the photo
card the AI's name is the important one: show it *as a field* — bordered box, pencil,
the name inside — not as a heading. Nothing says "tap to". (Margaret's rule was about
tiles that nag; a pencil on a field is furniture, not a nag.)
**Maya:** a bordered box under the photo turns the answer into a form. **Devin:** the
alternative is Ravi's — nobody knows it's editable. The name is wrong one time in five;
that's the moment it must look editable. Maya concedes for the photo card, wants the
thing card's Fix fields unchanged in weight. Agreed.

### 8 — the day line (*Sunday night*)
**What we were thinking:** DAY_IN_THE_LIFE rule 2 (survived into the board model): one
quiet line that says what day it is and roughly when, for a person who often does not
know. Orientation, not a title. It always shows *now*; that is the point — the day-clocks
sold for dementia do exactly this and families buy them.
**Maya:** keep it; add the date — *Sunday night · September 14* — because "what's the
date" is the other question she asks. **Devin:** keep; Home has no other title and *My
items* on Home would just be a label. **Priyanka:** *night* at 9 pm reads wrong to Ravi;
shift: evening until 10 pm, night after. **Calendar:** no — Maya: that is a different
product (Ravi's prioritizer has it under Phase 2, "routines & day structure"); it belongs
with routines on the helper phone, not on the board. Sam agrees. Unanimous on no calendar.
Split: date on the line (Maya, Devin) vs weekday only (Sam: "the date is a number she
can't check; the day she can"). **Recommend the date** — Robert reads it too.

### 9 — a places list Robert can manage
**Maya:** in scope — it is the first piece of the helper phone (§2). Settings → **Places**:
the household's places as rows, *Add a place*, rename (a rename updates every item that
uses it), remove (items keep their text; the chip goes away). Chips on the photo card:
AI guesses first (as now), then *saved* places, then places seen on items.
**Devin:** rows and one add field; no drag ordering — most-used first, computed.
**Sam:** a `kind: 'place'` doc per place (`name`, `household`, `order`, `createdAt`);
rename is a batch update of items with that `location`. Cheap at this scale.
**Priyanka:** cap at ~12 chips shown; more is a list she scrolls.

## End-user board

**Margaret:** the place list under the photo — *"that's the useful bit; I want to know
where it usually is."* Pencil: fine, "it looks like where you write". Remove-a-photo:
wants the sheet to say which photo — it will, the photo is right there. Date on the line:
yes. *Add another photo* — she won't use it; doesn't mind it.
**Robert:** *Add another photo* is his ("the wide one shows the room"). Places list is the
thing he asked for on day one. Wants rename to fix his own typos across items — yes.
**Priya:** search tiers — "as long as 'glasses' never shows the sofa because the sofa's
note says glasses were on it once" — that is tier 4, and it will be last. Calendar: no,
"that's my job to put on his phone".
**Harold:** pencil icons everywhere — "too many pencils". Answer: only on fields that are
already on screen as editable; the tiles get none.

## Splits for Ravi / Tanya

1. Place history: three rows always (Devin) vs only when more than one place (Maya, rec.).
2. *Add another photo*: everyone (rec.) vs helper phone only.
3. Remove a photo: inline per photo (rec.) vs behind *Fix or remove*.
4. Day line: add the date (rec.) vs weekday only. Calendar: unanimous no.

Fixed without a vote: search tiers (order only, no label), aliases for the merge, footer
colour + size, pencil on editable fields, Places in Settings.

## Addendum — left/right swipe (Ravi)

Ravi: *"left/right swipe is too useful to spend on history (not that common). Use it for the
many photos of the current log; go into a history mode and then swipe left/right through
prior logged photos and locations."* Devin: better than either of ours — one gesture, two
modes, and the common case (this log's photos) gets the gesture. Priyanka: the strip is
`scroll-snap`, never starting at the screen edge, so iOS edge-swipe Back is untouched; a
dot row shows there is more; the next photo does not peek (a full-width page is what the
Photos app does). Margaret: "dots I know from the weather app." Adopted.

## Addendum — appointments (Ravi, mid-session)

Ravi: appointments are a very common pain point for this persona — doctors, physical
therapy, medicine pick-ups — no calendar view needed, but a list they can create and see.

**Maya (PM):** Real need; it is in the Kano analysis under "day structure" and in the
prioritizer as Phase 2 with routines. Not v0: v0 is a walking skeleton for *one* idea —
photo → place → find — and the first user test should judge that idea, not a second one.
Objection to building it now is scope, not merit.
**Devin (design):** If it comes, it is *Robert's* feature on the helper phone: he enters
them, she sees them. On Margaret's board it is one line above the tiles, only on the day:
*Today · Dr Patel, 2:30 · Robert is driving* — and nothing on days with nothing. A list
screen is his; her screen shows only today, and maybe tomorrow after 6 pm. Never a
badge, never a count.
**Sam:** trivial data (`kind: 'appointment'`: title, at, who, note); the hard part is
reminders — a web app on iOS cannot notify reliably without a service worker + push, which
we have decided against for v0. So it is a *visible* list, not an alarm. Say that up front
so nobody expects a reminder.
**Priyanka:** two screens, one band; a day's build after the helper-phone switch exists.
It should not go in before *This phone is used by*, or Margaret gets an editor.
**Margaret:** *"Yes. That is the thing I ask Robert three times a day."* Wants it to say
who is taking her. **Robert:** wants it — but on his phone, typed once, and wants it to
say *when to leave*, not just the time. **Priya:** wants to enter them remotely — which
needs the household join code first. Also: "the doctor's office already texts him;
what's missing is that she can't see his phone."
**Split:** Maya — Phase 2, after the first user test; Devin/Margaret/Robert — build it
right after the helper-phone switch, as today-only on her board + a list on his.
**Recommendation:** put it *next* — after the helper phone (which it needs) and before
the household join code — as "today's appointments" on the board and a list in Settings →
Appointments on the helper phone; no reminders, and say so. Add to the prioritizer now.

## Outcome (Ravi, 2026-09-14)

1. Place history: **rows only when >1 place** (Maya) — plus Ravi's swipe model above.
2. *Add another photo*: **everyone**. Built as an action in the *Saved · place* toast, so
   tapping the place is still the whole save (D2); nothing new is asked of her.
3. Remove a photo: **on each photo**, under the centred one, with the confirm sheet and
   Undo. Last photo → the item's own remove sheet.
4. Day line: **day + date**, night from 10 pm; **no calendar**.
5. Fixed without a vote: search tiers; aliases + head-noun merge; footer colour and size;
   pencil + accent hairline on every editable field, and the AI's name on the photo card
   drawn as a bordered field; Settings → Places.
6. Appointments: **for Ravi/Tanya** — see the addendum; the board recommends next-but-one.

