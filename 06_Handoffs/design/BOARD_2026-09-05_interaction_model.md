# Board session — 2026-09-05 — the interaction model

**Status: awaiting Tanya's / Ravi's decision. No code written yet.**

First session under the two-board method (`02_Strategy/PRODUCT_BOARD.md`). Inputs: v0.1 as
shipped, `DAY_IN_THE_LIFE.md`, the 09-05 session log, the prioritizer's nine must-be
features, the persona document. The exchange below is the record; the open splits are in
§7 and need a decision before anything is built.

---

## 1. Maya frames the problem

The question this build has to answer is not "is the app nice". It is: **when a person
photographs where they put something and later asks where it is, does getting the photo
back change what they do?** Robert stops answering the question, or he doesn't. Nothing
else in the backlog matters until that is a yes.

v0.1 could not answer it because it shipped the whole day-in-the-life story before anyone
had checked the loop at its centre. Count what a first-time tester sees on v0.1's home:
a date line, a setup notice, a "This morning" section with a seeded routine they never
created, a tile grid, a second "Other things" grid, an ask row with a mic, a camera
button, and two footer links. Eight concepts, of which exactly two — the tiles and the
camera — are the product. The other six are v0.1 answering questions nobody has asked yet.

**What a first session has to achieve, in order:** the phone gets its key (done by
whoever set it up, not by Margaret); three or four things get photographed; later, one
of them gets found — by tapping it or by asking. Under ten minutes of total attention.
If that loop is obviously worth it, the tester says so and we build outward. If it isn't,
no amount of routines and pinning rescues it.

**What I am cutting to pay for that:**

- Routines — morning pills, stove, doors — are not on the home screen and are not seeded
  for a new household. They are a Performance feature (`medication-photo`) and an
  Attractive one (`nightly-safety-screen`); not one of the nine must-be. They come back
  with Robert's device, because Robert sets them.
- The onboarding checklist wizard. The empty home screen does that job in one sentence.
- The second grid, the Recent screen, the note field on capture, the autosave timer.

**What I am not letting the board reopen:** the nine must-be features. `time-day-orientation`
is a must-be, so the day stays on the home screen whatever Devin thinks of it. `nl-search`
is a must-be, so asking in words is a first-class path, not a fallback for tiles.

**Who decides adoption:** the caregiver. In the test phase the caregiver is Ravi or Tanya
holding the phone. Design for them setting it up in two minutes, then handing it over.

## 2. Devin proposes the interaction model

### The diagnosis first

v0.1's rule was "Margaret never navigates", and then it built a home screen that changes
shape three times a day. That is navigation — she just doesn't control it. The screen she
learned at breakfast is not the screen she sees at bedtime, and on the fiftieth use she
still can't predict it. James's persona says the home screen must answer "what is this?"
every time he opens it; a screen that rearranges itself by the clock cannot.

The deeper problem is that v0.1 had no *shape*. It had screens, each reachable somehow,
each with its own Back. Back moved three times in one session because there was no rule
that said where it lived.

### The model: one board, two verbs, depth one

**Margaret does two things with things: she puts them down, and she looks for them.**
The app has two verbs — *Photograph* and *Where is my…* — and one board.

```
                ┌──────────────────────────────┐
                │  Saturday afternoon            │  ← the day, one quiet line
                │                                │
                │  [glasses]  [keys]             │
                │  [wallet]   [phone]            │  ← THE BOARD: her things, as photos,
                │  [pills]    [remote]           │     fixed order, never rearranged
                │  …                             │
                │                                │
                │ ┌────────────┐ ┌─────────────┐ │
                │ │Take a photo│ │Where is my… │ │  ← fixed footer, thumb zone,
                │ └────────────┘ └─────────────┘ │     same two buttons every open
                └──────────────────────────────┘
                     │                │
        ┌────────────┘                └───────────┐
        ▼                                         ▼
   PHOTO → one card:                       ASK → one field, then
   photo · name · "Where is it?" chips     the same THING CARD, or
   tap a chip = saved → back on the board  "No photo of that yet."

                     tap any tile
                          ▼
                     THING CARD: photo · place · when
                       body:   Not there? Earlier photos
                       footer: [Back]  [Found it — new photo]
```

**Rule 1 — Depth one.** Home, and one card. Every card returns to Home. Nothing is two taps
from Home and nothing is two taps back. This replaces "never navigates" with something a
build can be checked against.

**Rule 2 — The board never rearranges itself.** Things sit in the order they were first
photographed, forever, unless a person moves one to the top. Hand memory works or it
doesn't; a grid sorted by recency defeats it. New things go at the end.

**Rule 3 — The bottom of the screen is the action zone, and it is fixed.** On Home: the two
verbs. On the thing card: Back on the left, the one primary action on the right. Never a
Back at the top-left. It is fixed (not sticky) so it cannot scroll away, which is the bug
that pushed Back to the top last time.

**Rule 4 — One question per card.** The photo card asks one thing: where is it. The thing
card answers one thing: where it is. Anything else (fixing the name, removing it) is
behind a quiet "Fix" and is Robert's, not hers.

**Rule 5 — The photo is the mark; the chip is the save.** No timer, no countdown, no Done.
Tapping the place saves it. That is one tap, which is what `one-tap-confirm` asked for;
the three-second autosave in the prioritizer was written for the case where the AI knows
the place, and the engine has now established it almost never does.

**Rule 6 — Photographing a thing you already have is a new photo of it, not a new thing.**
If the AI names the photo "reading glasses" and reading glasses are on the board, the
board's tile updates. Two glasses tiles is the fastest way to make her stop trusting the
board. (Sam and Priyanka have views on this — §3, §4.)

**Rule 7 — The app shows what it saw and when. It does not editorialise.** No "your photo
is safe", no amber "this may be out of date" banner, no sentence written by the model.
"Kitchen counter · yesterday evening" is the whole answer; she decides whether that's
stale. The one place the model's words appeared on screen — the "warm sentence" from
`answerQuery` — is dropped; the card is the answer.

### Screen inventory — patient

| # | Screen | What's on it | Decisions asked of her |
|---|---|---|---|
| 1 | **Home** | Day line. The board. Footer: *Take a photo* · *Where is my…* | Which thing? (tap) — or one of the two verbs |
| 2 | **Photo card** (after the camera) | Photo. Name (arrives from AI; editable). *Where is it?* — chips of the household's known places + *Somewhere else*. Quiet: *Not sure* | One: where is it |
| 3 | **Thing card** | Name. Photo, large. Place in big words; what it was resting on, smaller; when, in human time. Body: *Not there? Earlier photos*. Footer: *Back* · *Found it — new photo*. Quiet: *Fix* | None; two offers |
| 3b | Earlier photos | Same card, older photos stacked below, each with place and time. Ends with *That's every photo of your glasses.* | None |
| 4 | **Where is my…** | One field, focused, keyboard up; mic button where the browser has one. Result → thing card. Nothing matched → *No photo of that yet.* with *Take a photo of it* | Say it or type it |
| 5 | **Setup** (only while there is no key) | Home shows one card instead of the board: *One-time setup — this phone needs its AI key.* → *Set up* | None for her; this is the helper's screen |
| 6 | **Settings** | AI key + *Check the key works*. Recently removed. Build stamp. Reached by a small control at the top of Home — deliberately out of the thumb zone; it is seen once a month | — |

Empty board (key present, nothing photographed): *Photograph something you often look
for — glasses, keys, wallet, anything.* and the two footer buttons. That is the whole
onboarding.

Failure states, all one line, no diagnosis: naming failed → the name is simply absent and
the tile has no label; ask failed → *Couldn't check just now.*; nothing else.

### Copy — every string she sees

Day line: *Saturday afternoon*. Footer: *Take a photo* / *Where is my…*. Photo card:
*Where is it?* · chips · *Somewhere else* · *Not sure*. Known thing: *Your reading glasses —
new photo* with a small *not your glasses?* → new thing. Thing card: place · resting-on ·
*yesterday evening* / *this morning, 8:12* / *Tuesday* · *Not there? Earlier photos* ·
*Back* · *Found it — new photo* · *Fix*. Earlier: *That's every photo of your …*. Ask:
*Where is my…* · *No photo of that yet.* · *Take a photo of it*. Errors: *Couldn't check
just now.* Setup: *One-time setup — this phone needs its AI key.* · *Set up*.

No exclamation marks, no "great", no "don't worry", no numbers.

### The whole app — Robert and Priya

**Robert's phone is the same app with the same board.** Everything he photographs lands on
her board with no visual difference (`caregiver-driven-origination`). The one setting —
*This phone is used by: Margaret / someone helping* — gives a helper's phone three extras:
after a save the camera reopens (*Another?*), a note field inside Fix, and the routine
editor and *Move to the top* in Settings. That is the entire "caregiver mode": no second
interface, no mode switch, no dashboard. He does not want one and would not open it.

**Routines, when they return,** are one band across the top of Home — rows, not tiles —
shown only while something is due and not yet photographed, and gone when it is. Tapping a
row opens the camera with the instruction. That is the smallest shape change that keeps
the day-in-the-life promise; it is not three home screens.

**Priya's phone is one card:** today's photos (how many, last at what time), each routine's
claim in the app's own words, when the phone was last opened. Three states, never more.
Household join by a short code. Everything else she can see is the same board.

### What this rejects from v0.1, explicitly

The clock-shaped home; routines seeded on first load; "Other things" as a second grid;
the Recent screen; the starter checklist wizard; the autosave countdown; the note field
on capture; Back at the top; the model's sentence on the answer card; the amber stale
banner; the 8-slot pin limit (order is a property of every thing, and "move to the top"
is the only pin).

## 3. Priyanka objects

**3.1 "The chip is the save" has a race in it, and I want to name it.** `tagPhoto` takes
three to eight seconds on Haiku with an image. The household chips can render the instant
the photo is compressed; the name cannot. So she taps a chip before there is a name. Devin's
rule implies we save anyway. I want to do that — never block a person on the AI — but it
means an item is written with no name and a second write patches the name in. If the AI
fails, the item stays unnamed. The board needs to accept an unnamed tile as a legitimate
state, and Sam needs to accept two writes. (Sam does not — §4.3.)

**3.2 "Mic auto-starts" is not a thing on iOS.** `speech.js` already documents it: Web
Speech is fine on Android Chrome and unreliable in Safari, worse in a home-screen app. The
honest design is a text field that takes focus immediately, so the iOS keyboard — with its
own mic key — appears in one tap. Our mic button renders only where the API exists. Devin's
"say it" is really "the keyboard's mic key" on the phones we are testing on. Say that in the
design rather than promising voice-first.

**3.3 Fixed footers and keyboards do not mix.** A `position: fixed` bar jumps around when
Safari's keyboard opens. So the footer exists on Home and the thing card only. The photo
card, the ask screen and Settings — anywhere a keyboard can open — put their actions in the
flow. Devin's Rule 3 needs that exception written in.

**3.4 Rule 6 (merge into the existing thing) creates the worst failure in the app.** The
model matches a photo of a hat to "reading glasses" and we overwrite the glasses tile
with a hat. I will build it — Robert's case for it is right — but the photo card must say
which thing it thinks this is (*Your reading glasses — new photo*) with an escape to *new
thing*, and the old photo must stay reachable under Earlier photos. Both are in Devin's
copy already; I am recording that they are load-bearing, not polish.

**3.5 Estimate.** The cut — Home, photo card, thing card + earlier, ask, setup/settings —
is one session if the views are rewritten and the engine and `db.js` are left alone
except for Sam's two changes. What I refuse to do is call it done without it running on
a phone with a real key. That needs Ravi's iPhone, which means the session ends with a
build deployed and a checklist, not with "it works".

**3.6 What I want cut further and lost.** I would ship without *Fix* on the thing card for
the first session and let corrections wait. Devin: no — `always-correctable` is a must-be
and a wrong name with no way to fix it is what makes a tester stop trusting the tile.
Maya sided with Devin. Recorded; Fix stays.

## 4. Sam objects

**4.1 Rule 6 turns re-snaps into the dominant write, and re-snaps are the thing that is
already unbounded.** Every new photo of a known thing writes a ~150KB `snap` doc forever
(flagged unbuilt on 09-05: "this compounds silently"). Twenty a day is 3MB a day; the free
tier's 1GB lasts a household about a year, and *Earlier photos* loads every snap's full
photo to show the last few. Two changes to `db.js`, both recorded decisions: **show at
most 10 earlier photos, keep at most 30 per thing, prune the rest when loading.**
Priyanka's note: a proper `limit(10)` query needs a composite index (kind, itemId, at),
which needs the Firebase console, which needs Tanya. Until then it fetches all and shows
ten — at 30 × 150KB that is a slow tap on a phone. It goes on Tanya's console list next to
the rules.

**4.2 Rule 2 changes what `pinnedOrder` means, and I want it to be a real field.** Today
the board is "8 pinned slots, then everything else by recency". Devin's board is "one grid
in first-photographed order, plus *move to the top*". That is a general `order` on every
thing, not a slot number. It is a trivial migration — `pinnedOrder ?? createdAt` — and it
is the right time to do it, because the alternative is a home screen whose order is
computed from two different fields with different meanings. Uncapped is fine to a hundred
things (thumbnails are ~10KB; `watchAll` already carries them); write down that at a
hundred a "More things" fold returns, so we do not discover it at five hundred.

**4.3 Two writes per photo, and an unnamed item as a durable state — I would rather not.**
Priyanka's optimistic save (§3.1) means a doc is created with `name: ''` and patched
seconds later, and on AI failure it stays that way. I would hold the write until the AI
returns or a ten-second timeout fires, and apply the chip tap then. Priyanka's answer is
that six seconds of nothing after a tap reads as broken, and she is right about that too.
**Compromise:** write immediately with a `naming: true` flag; clear it when the name
arrives or the call fails. The data says honestly what it is. I still think the unnamed
state will be commoner than anyone expects on VPN'd phones; log it and look at the number.

**4.4 The household field goes in now, or the rules can never be tightened without a
migration.** Every device on earth that opens the URL writes to the same vault. That is
already in `LESSONS.md` as acceptable for test data. What is not acceptable is writing
another few hundred documents with nothing to scope them by. Every new doc gets
`household: 'default'` from the cut onward. Three lines. Not a feature, not visible, and
the single cheapest thing in this document to do today and the most expensive to do later.

**4.5 The model's sentence — Devin is right, and it is an engine question, not a UI one.**
`answerQuery` asks Haiku for "one short warm sentence", which is user-facing copy the
design lead has never seen and cannot stand behind. The UI stops rendering `message`; the
engine keeps returning it for the log. No prompt change needed today. **This is the one
proposal that passed all four of us without an objection; noting it as the method asks.**

**4.6 What I am not flagging.** The single collection with a `kind` field: fine for this
cut, split when the rules are rewritten. Inline photos: fine to the hundreds. LLM-over-
captions: fine to ~500 things. None of them constrains Devin's model. They constrain the
one after it.

## 5. Maya, back on scope

- **Devin's Rule 6 is scope creep wearing a clean shirt.** Merge-by-name is a new
  behaviour with a new failure mode (§3.4), and it isn't required to test the loop. I
  would ship "every photo is a new thing" and let duplicates happen for a week. **Devin,
  Robert and Margaret all disagreed with me** — see §6 — and duplicates were the first thing
  Ravi hit on 09-05. I withdraw the objection but want it in the log that this is the
  first feature added to the cut that a persona asked for rather than Maya.
- **The day line.** Devin wanted it small enough to be furniture; I want it to stay a
  real line because it is a must-be with a Kano argument behind it. Settled: one line,
  20px, weekday + part of day. Time of day comes from the phone's own status bar. Devin's
  point that a 24px line on a screen seen twenty times a day stops being seen stands.
- **Ask vs tiles as the primary path.** I think asking in words is the product (James
  can't tap a tile he can't recognise; Margaret's persona says she'll ask by voice
  naturally). Devin thinks the board is the product and asking is for when the board
  fails. Settled by making them equal: two footer buttons, same size, every open. Not
  settled: I would label the ask button so it prompts the sentence, Devin agrees and owns
  it — *Where is my…*.
- **Priya gets nothing in this cut.** She is the adoption driver and the first session
  contains not one screen for her. Correct for the test phase, where Ravi and Tanya are
  Priya, and wrong for the product. Her card is the first build after this one, with
  Robert's helper setting. Written down so it does not slip.

## 6. End-user board

**Margaret.** Defends the board (*"I know where the glasses tile is, it doesn't move"*),
*Where is my…* (*"that's the sentence I already say"*), and *Not there? Earlier photos*
(*"it doesn't tell me I'm wrong, it just shows me more"*). **Rejects** the autosave
countdown (*"it's rushing me"*), routines she didn't ask for (*"who told it I take pills?"*),
and — this is new — any tile that says *tap to name*: *"that's homework, and it's me being
tested."* Devin's answer: a tile with no name is just a photo; nothing on the board ever
asks her for anything. Fix is Robert's. **Accepted; the cut has no unnamed-tile prompt.**
On Rule 6 she is emphatic: two glasses tiles and she stops believing either.

**Robert.** *"Does this save me time today?"* The camera fixed at the bottom on every open:
yes. Rule 6: *"if I move her glasses and take a picture, there'd better be one glasses
tile."* **Objects** that he can't photograph five things in a row without a card between
each — the helper phone's *Another?* is not in the cut. He'll tolerate it for a week; note
that it is the first thing he'll complain about. He will not type on her phone; *Where is
my…* is hers, not his — fine, it isn't for him. He will never find a small Settings control
and doesn't need to after setup.

**Priya.** Nothing here is for her, and she says so. Two things she will not let pass
silently: the key is entered per device, so she cannot set her father's phone up from two
thousand miles away — a blocker for real adoption, tolerable while Ravi and Tanya are the
remote family; and the vault is world-readable, which is fine for a test and not for a
photo of her father's bedside. Sam's household field is the first step to fixing both;
she defends it. Her question — *"did anything happen today?"* — is the first build after
this one.

**James** (the lower bound). Two big fixed buttons and a grid of photos of his own things:
passes. The ask screen on iOS fails him — a keyboard is not something he can drive, and
its mic key is small. Priyanka's constraint (§3.2), not a design choice. **Recorded as a
known gap:** James asks through Robert until the app has its own mic on iOS.

**Linda.** No timers, no amber, the same answer every time she asks, *Not there?* rather
than *Wrong?*: calm. She would ask the same thing ten times; the ask screen keeps no
history and shows no "you already asked". Wants the earlier-photos list to *end* with a
sentence rather than just stop — Devin's *That's every photo of your glasses.* is for her.

**Harold.** Won't touch it. Works anyway: Robert photographs, Harold's phone, if it ever
gets one, shows the same board with no "memory aid" anywhere in the copy. Passes the
persona's test because there is no patient mode to reject.

**Every screen in the cut has a defender:** Home (Margaret, Robert), photo card (Margaret,
Robert), thing card and earlier photos (Margaret, Linda), ask (Margaret, James-through-
Robert), setup/settings (Priya, Robert). **Routines have a defender (Priya) but not for the
first session** — out of the cut, back with Robert's build.

## 7. What needs a decision — the open splits

Recommendation first; the disagreement after.

| # | Decision | Recommended | Who disagrees, and why |
|---|---|---|---|
| D1 | One constant home board instead of the clock-shaped home | **Constant board.** Routines return later as a single band, not as a different screen | Nobody on the build board defends the clock shape now. Priya wants routines soon; the day-in-the-life story loses its "clock is the navigation" idea. That is a reversal of the 09-02 decision and should be recorded as one |
| D2 | The chip is the save; no countdown | **Chip saves** | Priyanka: needs feedback that something happened — the new tile appearing on the board is the feedback; must be seen on a phone. The prioritizer's "3-second autosave" note is superseded |
| D3 | Save immediately, name arrives later (`naming` flag) | **Yes, with the flag** | Sam would hold the write until the AI answers or times out. Compromise accepted by both; Sam predicts unnamed tiles will be common and wants the number watched |
| D4 | A new photo of a known thing updates that thing (Rule 6) | **Merge**, with *not your glasses?* escape and old photo kept under Earlier | Maya: not needed to test the loop, adds a bad failure mode. Priyanka: builds it, names the mis-match risk as load-bearing. Robert and Margaret asked for it |
| D5 | Earlier photos: show 10, keep 30, prune on load | **Yes** — engine change | Priyanka: proper query needs a console index → Tanya's console list. Until then a slow tap at 30 snaps |
| D6 | `order` replaces `pinnedOrder`; board in first-photographed order; *Move to the top* is the only pin | **Yes** — engine change | None on the build board. Reverses the 09-02 "8 fixed slots" decision; record it |
| D7 | `household: 'default'` on every new doc from now | **Yes** | None. Unanimous — noted as the method asks |
| D8 | Do not show the model's sentence; the card is the answer | **Yes** | None. Unanimous |
| D9 | Ask on iOS is the keyboard's mic, not the app's | **Accept the gap** | James loses; Maya wanted voice-first. Constraint, not a choice; revisit if a native wrapper ever happens |
| D10 | Fix stays on the thing card in the cut | **Stays** | Priyanka would ship without it. Maya + Devin: must-be |

## 8. The first-session cut, if approved

**Build:** Home (board + footer + day line + empty state + setup card) · camera → photo card
→ saved · thing card with earlier photos, Fix, remove · *Where is my…* · Settings reduced
to key, check, recently removed, build stamp.

**Engine changes, all recorded:** `order` field and sort; `household` field; snap cap and
prune; `naming` flag; merge-on-name in the save path (a `db.js` helper, not a component
decision).

**Hidden, not deleted:** routines (not seeded; existing ones ignored by the new Home),
pin slots, Recent reel, research export (stays at the bottom of Settings for Tanya).

**Done means:** `npm run build` clean; deployed; loads on a phone; the tester can enter
the key, photograph three things, tap one, ask for one, and see *Not there? Earlier
photos* do something. Then Ravi's phone decides whether it is done.

---

## 9. Addendum — Tanya's three asks, after approval

Tanya, mid-build: *(1) let me pick the colour palette; (2) button, control and text sizes
should be end-user defined; (3) the app should have the look, feel and structure of the
most common apps so seniors find it familiar.*

**Maya.** (1) is the owner's call, not a board question — Devin supplies options, Tanya
picks. (2) is a feature and a good one: `calm-ui` is a must-be and Dynamic Type is the one
accessibility setting seniors actually use. Goes in the cut as a per-phone setting. (3) is
a design principle, and it collides with Devin's model at exactly one point — see below.

**Devin.** Familiarity is right and I want to be precise about where it comes from. It
comes from *conventions that carry meaning*: a title at the top of a screen; a Back that
says "Back"; big rows and photos of real things; form controls that look like the phone's
own. It does not come from cloning the *structure* of Messages or Photos — a tab bar and a
list — because Margaret's persona will not learn a menu and James abandons after one wrong
tap. The one place the ask changes the model: **the most common iOS structure is a top bar
(Back · title) plus a bottom toolbar of actions.** That is Photos, Mail, Safari. My footer
already is the bottom toolbar. I resisted a top-left Back because last time it was a small
text link and the *only* way out; as a full-height button in a header that every app has,
with the primary action still in the thumb zone below, it is the familiar structure and
loses nothing. **Proposal: header bar on every card (Back · title), fixed footer for the
primary action.** Home keeps the day line as its header. Palette: I supply three — the
current linen, a cooler slate, and a high-contrast one (Linda and low-vision users want
opposite things; offer both). Text: three steps, Normal / Large / Largest, scaling
everything including buttons, because a control that does not grow with the text is how
tap targets shrink under big type.

**Priyanka.** Text scaling means the stylesheet moves from px to rem with one variable on
`html`; half an hour, done today. Palette is a `data-theme` attribute swapping the
variables. Both are per-phone (localStorage) — Robert's phone and Margaret's can differ,
which is correct. Header bar: trivial. Cost of all three is under an hour; no engine
change.

**Sam.** Keep the two asks apart in the data: the palette is a *product* decision Tanya
makes once (the picker stays in Settings so she can compare on a real phone; once she has
chosen, we either lock it or keep it as a user preference — her call). Text size is a
*user* preference forever. Neither touches Firestore. Nothing to record beyond that.

**End-user board.** Margaret: larger text, yes; a palette picker she never sees, fine —
it lives in Settings. Robert (71): text size is the first setting he would look for.
Linda: warm palettes; nothing stark. Dr. Rosenfeld's note for low-vision patients: a real
high-contrast option, not just "bigger". James: familiar means big buttons and photos of
his own things — he has no view on tab bars because he does not perceive them as
navigation. **Harold's** note is the sharpest: an app that looks like every other app on
his phone is one he is less likely to refuse.

**Split for Tanya (S1):** header bar with Back + title on cards, plus the bottom action
zone (Devin's revised proposal; matches the common iOS structure) — *or* footer-only as in
§2. Recommended: header + footer. Devin's reservation stands in the record: a top-left Back
is the one control a thumb cannot reach one-handed, so the primary action must stay in the
footer whatever happens to Back.

**Built today, pending her look:** header bars; Settings → *Look*: palette (Linen · Slate ·
High contrast) and text size (Normal · Large · Largest). Both per phone.
