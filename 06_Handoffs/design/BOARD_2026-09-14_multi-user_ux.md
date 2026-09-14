# UX board — 2026-09-14 — Three phones, one board: Margaret, Robert, Priya

**Devin (design lead) leads; Maya (PM) participates.** Inputs: the design of record §2,
today's rounds 2–5, DECISIONS 09-14, and the source as built: `Board.jsx`'s day row
(hamburger · day line · gear), `MenuScreens.jsx`, `Settings.jsx`, `db.js` (`HOUSEHOLD =
'default'`, `by` on every snap, `recall-role` already read by `logEvent`).

## 1. Devin — the principle

Three people, **one board, one app, one URL.** Nobody gets a dashboard. What differs per
phone is *which doors are open*, and both doors were built today: the drawer and the
gear. So the build is mostly who sees which door, plus two new screens (Household,
Priya's card) and one line on the thing card. Margaret's phone stays what it is now —
board, *Log item* · *Find item* — minus one door.

**Rule 8 — A phone knows who holds it; a person never signs in.** *This phone is used by*
is a per-phone setting like text size (`prefs.js`), not an account. Margaret never types
a password or gets logged out. Real sign-in exists once, for one person, in stage 3 (§5).
The role is stamped on every write (`by`, `capturedBy`, the event log's `role`); the
Firestore rules do the rest, by `household`.

## 2. The three phones

```
 MARGARET'S PHONE                ROBERT'S PHONE                  PRIYA'S PHONE
 ┌────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
 │ Sun eve · Sep 14 ⚙ │          │ ≡  Sun eve · Sep 14 │          │ ≡  Sun eve · Sep 14 │
 │                    │          │ Today · Dr Patel   │          │ ┌────────────────┐ │
 │ [glasses] [keys]   │          │   2:30 · Robert    │          │ │ Mum's phone    │ │
 │ [wallet]  [pills]  │          │ [glasses] [keys]   │          │ │ 3 photos today,│ │
 │ [remote]  [hat]    │          │ [wallet]  [pills]  │          │ │ last at 3:10   │ │
 │                    │          │ [remote]  [hat]    │          │ │ Opened 4:02 pm │ │
 │                    │          │                    │          │ └────────────────┘ │
 │ [Log item][Find…]  │          │ [Log item][Find…]  │          │ [glasses] [keys]   │
 └────────────────────┘          └────────────────────┘          │ [Log item][Find…]  │
  no hamburger; gear →            hamburger: Locations ·          └────────────────────┘
  "This phone" only               Appointments · Deleted ·        as Robert, plus
                                  Household · Look · Log          Household → Set up a phone
```

**Margaret's phone.** Board, two verbs, thing card as today. Changes: the hamburger is
*gone*; the gear stays (small, top right, out of the thumb zone) and opens one card,
*This phone*, nothing else. No Locations, Deleted items, Research log, Appointments
editor or Household. The press-and-hold sheet stays (every row still has a visible
route) minus *Remove* — removal is a helper's act. **Appointments** are the one line
designed on 09-14: today only, above the tiles, gone on empty days, never a count. A
helper's photo lands on her board as a tile like any other. **Nothing on her phone ever
says who did what.**

**Robert's phone.** Same board, the roll, *Another* — his since round 3. The hamburger
as Ravi built it, plus two rows: **Appointments** (*Add an appointment* · title · day and
time · *who is taking her* · *leave by*) and **Household** (§3). Fix gains the note field
from the design of record. The thing card gains one quiet line under the time: *by
Margaret* / *by Robert*. The tile sheet keeps *Remove*.

**Priya's phone.** Robert's phone with one card above the board — **the card is Home,
not a separate screen** (depth one; she opens the app for one answer). Three states:

- *3 photos today, last at 3:10 pm · Phone opened at 4:02 pm.*
- *Nothing logged today · Phone opened at 9:15 am.*
- *Phone not opened since Tuesday.*

Plus today's appointment line. No red, no "alert", no trend. Tapping the card opens
*Today* — the day's photos as a strip with places and times, ending *That's everything
from today.* Her Household screen has one extra: *Set up another phone*.

## 3. Joining a household: a code, read aloud

**Devin: a six-character code, two groups of three, no 0/O/1/I** — *KMT-4R8*. Not a QR:
it needs both phones in one room, and Priya's whole case is that she is not. Not only a
link: an installed home-screen web app on iOS opens links in Safari, not in the app, and
the person ends up with two ReCalls. A code survives a phone call, a text, or the
fridge door. The link exists too (`?join=KMT-4R8`) and prefills the same field — a
convenience, never the only path.

```
 ‹ Back   Household                      ‹ Back   This phone
 ─────────────────────────────           ────────────────────────────────
 Code for this household                 This phone is used by
        KMT-4R8                           (•) Margaret
 Read it out or send it:                      The board and the two buttons.
   [Send the code]                        ( ) Someone helping
 Phones in this household                     Also locations, appointments,
   Margaret's phone · opened today             deleted items and the household.
   Robert · opened today                 Name shown to the family  [ Robert ]
   Priya · 4 days ago                    ────────────────────────────────
 ─────────────────────────────           Household KMT-4R8 · 3 phones
 Join a different household              Version · AI key (developer)
```

**Remote setup of Dad's phone (Priya's 09-05 blocker):** *Set up another phone* shows
the code with three lines she reads to him — *Open ReCall. Tap the gear. Tap "Join a
household" and type KMT-4R8.* The AI key travels with the household, not the phone, so
the joined phone works at once. Where the key lives is Sam's question; this board records
it as the one engine change the design depends on.

**Maya objects (#1):** link primary, code secondary. Priya's first act is to text her
father *something*, and one tap beats seven characters typed by a 71-year-old. Devin: one
tap that opens the wrong ReCall is worse than seven characters. **Recorded; recommend
code-first, link prefills.**

## 4. What a helper's action shows

**Devin:** on Margaret's phone, nothing. Rule 7 — no editorialising — and Harold's rule:
no "memory aid" in the copy. A tile Robert logged is a tile. **On helper phones**, the
thing card says *by Robert · this morning*, and Priya's *Today* strip says who took each
photo, because "did anything happen" includes "did Dad do it or did Mum".

**Maya objects (#2):** *Robert moved it — kitchen counter* on Margaret's card would help
her trust a tile she does not remember making. Devin: "who told it I take pills?" —
Margaret rejected exactly this on 09-05; a name on her card is the app telling her she
forgot. **Recorded; recommend no attribution on her phone.**

## 5. The switch versus sign-in

The switch is `prefs` — a radio on *This phone*, defaulting to *Margaret* until someone
joins a household from it (setup is a helper's act). *Someone helping* asks one thing:
*Name shown to the family* — free text, chips *Robert · Priya · Someone else*. No
password: the house is the security boundary for the two phones in it.

**Real sign-in is Priya's, and only in stage 3.** She is on another network, possibly
another country; the rules can only lock a household to a person once a *uid* is tied to
it. *Sign in with Google* appears on *This phone* under the helper role only, labelled
*Keep this phone in the household if it is reset* — that is what it does for her.
Margaret's phone signs in anonymously forever.

**Maya objects (#3):** stage 3 is too late; the vault is world-readable and "must be fixed
before real family photos go in" (CLAUDE.md) — stage 2, when Priya joins. Devin: rules
can be tightened by *household* with anonymous uids the moment the code exists (D7);
sign-in is for *recovering* a household, not securing it. **Recorded; Sam arbitrates the
rules, Tanya the order.**

## 6. Menu and gear, per role

| | Margaret | Robert | Priya |
|---|---|---|---|
| Hamburger | none | Locations · Appointments · Deleted items · Household · Look and feel · Research log | same, Household first |
| Gear | *This phone* only | + AI key (developer) | + *Sign in* (stage 3) |
| Tile sheet | no *Remove* | as built | as built |
| Thing card | as today | + *by …*, note in Fix | same |
| Board top | today's appointment line | same | Priya's card, then the line |

## 7. Copy — every new string

*This phone* · *This phone is used by* · *Margaret — The board and the two buttons.* ·
*Someone helping — Also locations, appointments, deleted items and the household.* ·
*Name shown to the family* · *Household* · *Code for this household* · *Read it out or
send it:* · *Send the code* · *Phones in this household* · *opened today / 4 days ago* ·
*Join a household* · *Type the code you were given* · *That code didn't match. Check it
and try again.* · *Joined — this phone now shows the household's items.* · *Join a
different household* · *Set up another phone* · *Mum's phone* (the helper's name for
the patient phone; falls back to *Margaret's phone*) · *3 photos today, last at 3:10 pm*
· *Nothing logged today* · *Phone opened at 4:02 pm* · *Phone not opened since Tuesday*
· *Today* · *That's everything from today.* · *by Robert* · *A note for the family — not
shown to Margaret* · *Appointments* · *Add an appointment* · *Who is taking her* · *Leave
by* · *Today · Dr Patel, 2:30 · Robert is driving* · *No reminders — this is a list you
can see, not an alarm.* No exclamation marks, no "alert", no numbers on Margaret's phone.

## 8. Staging

**Stage 1 — the switch (smallest useful).** *This phone* under the gear; role in prefs;
under *Margaret* the hamburger disappears and *Remove* leaves the sheet; under *Someone
helping* the note field and *by …* line appear. One household still. A day.

**Stage 2 — the household.** `kind: 'household'` doc with the code; *Household* and
*Join a household*; rules by household (Tanya's console); the key on the household doc;
Priya's card and *Today*; appointments editor on helper phones, today line on all.

**Stage 3 — recovery.** Google sign-in for helpers, *Set up another phone* with the
read-aloud script, the phone list with last-opened, Research log narrowed to the developer.

## Splits for Ravi/Tanya

1. Join: **code first, link prefills** (Devin, rec.) vs link first (Maya).
2. Margaret's thing card: **no attribution** (Devin, Margaret, rec.) vs *Robert moved it* (Maya).
3. Sign-in: **stage 3, rules by household in stage 2** (Devin, rec.) vs sign-in in stage 2 (Maya). Sam rules on whether anonymous-uid rules suffice.
4. Hamburger on Margaret's phone: **removed under the Margaret role** (Devin, rec.) — partly reverses Ravi's round-4 ruling, as Maya notes; unchanged for helpers.

**Recommendation:** ship stage 1 this week on top of `20260914k`, then appointments as
Tanya sequenced, then stage 2 as one build — code, Priya's card and rules are each
useless without the others.
