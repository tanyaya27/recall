# Board addendum — 2026-09-14 — the *Where is my…* label reads as cut off

**Raised by Ravi** on the phone: the footer button *Where is my…* looks truncated — as if
the text were cut off — when it isn't.

## Build board

**Devin (design):** Ravi's misread is the predictable one, not a quirk. The ellipsis does
two jobs in this app: on the header title and the day line it is the *truncation* glyph
(`text-overflow: ellipsis` in `styles.css`), and on this one button it is meant as an
*invitation* to finish the sentence. A person cannot tell which job it is doing from the
glyph alone, and on a button — where truncation is exactly what one fears — the truncation
reading wins. Fix by taking the dots off the button, not by explaining them. Proposal:
**Where is it?** — a whole question, ends in a mark that says "complete", and four
characters shorter, so it stays a bar at larger text sizes (Footer measures label width).

**Maya (PM):** Objection. Margaret chose *Where is my…* because *"that's the sentence I
already say."* *Where is it?* loses the object — she doesn't say "where is it", she says
"where is my glasses". Would rather keep the words and change the shape of the dots so
they cannot be read as truncation: a visible blank, *Where is my ___*, or a spaced,
lighter ellipsis. Second choice if the blank looks unfinished: *Where is my…?* — dots plus
a question mark is a sentence, not a cut.

**Devin, reply:** a blank on a button is a form idiom, not a button idiom; it will read as
a broken label to the next person the way the dots did to Ravi. *Where is my…?* is better
than the blank, but it still carries the glyph that means "cut off" two inches above it.

**Priyanka (eng):** Note there are three copies of the string — the Home footer button
(`Board.jsx`), the Ask screen's header title, and the field label above the input
(`Ask.jsx`). The field label is the one place the ellipsis actually works: *Where is my…*
followed by the box she types into *is* the sentence being completed. Change the button
and the title; leave the field prompt.

**Sam (arch):** Trivial change, no data impact. Agrees with Priyanka: a button and the
screen it opens should share a name, so title follows button. The field prompt can differ —
it is a prompt, not a name.

## End-user board

**Margaret:** *Where is it?* — "yes, I say that too, usually to Robert." Didn't notice the
dots herself. Wouldn't want a blank; "a blank means I'm supposed to write on it."
**Robert:** whichever keeps it on one line; he's the one who will see the icons if it wraps.
**Priya:** no opinion beyond: the title of the screen must match the button, or she gets a
phone call.

## The split, for Ravi / Tanya

- **A — *Where is it?*** on the button and the screen title; field prompt stays *Where is
  my…* + box. (Devin, Priyanka, Sam, Margaret, Robert.) **Recommended.**
- **B — *Where is my…?*** everywhere. (Maya's fallback.)
- **C — keep *Where is my…*, restyle the dots** as a blank or a spaced light ellipsis.
  (Maya's first choice; Devin and Margaret object.)

## Outcome (Ravi, 2026-09-14)

None of A/B/C. Ravi: **Find item**. Then the left button had to pair with it; *Add item*
was rejected by Ravi himself — a new photo of a known item updates it (D4), so "add" is
wrong half the time. *Save item* / *Snap item* / *Place item* / *Photo item* offered;
Ravi chose **Log item**. With "item" on both buttons the Home title *My things* became
**My items** (one noun everywhere — Devin's consistency point, Ravi agreed).

**Objection recorded (Devin, Margaret):** *log* is a technical word — logbook, log in —
and *item* is stock-room English; Margaret's word was *things*, and her sentence was
*Where is my…*. Devin: the parallel verb-noun pair is clean and fits the bar at Largest on
a 375-px phone, which the old labels never did; the words are the cost. **Tanya can
reverse** — it is three strings.

Built: `Board.jsx` (both labels + aria), `Ask.jsx` title (field prompt keeps *Where is
my…*), `PhotoCard.jsx` title *Log item* and *Back to my items*, `ThingCard.jsx` remove
sheet. Stamp `20260914a`.

