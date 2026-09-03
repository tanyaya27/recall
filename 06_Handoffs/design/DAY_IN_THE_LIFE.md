# A day with ReCall — the story v0.1 is built from

**Written 2026-09-02** by Ravi and Claude, after two rounds of Design-tool mockups produced screens
nobody could navigate. This is the reset: the app described as what people *do*, not as a list of
features. Tanya: read this first, then open the live app, then argue with either.

## The three people

**Margaret** has early-stage memory loss. She loses her glasses, keys and phone several times a day.
She is not going to learn a menu. **Robert** is her husband, in the house, tired, not technical; he
answers "where are my glasses?" twenty times a day. **Priya** is their daughter, two thousand miles
away, checking in once or twice a day, wanting to know only "do I need to worry?"

## The one idea

**Margaret never navigates.** She does three things all day: she snaps a thing, she taps a tile, and
she answers what the app asks her at a fixed time. The clock is the navigation. Her home screen
changes shape with the time of day; she never goes anywhere in the app. If a design requires her to
*go somewhere*, it is wrong.

## Morning, about 8:00 — once

She opens the phone. She sees the day and time in words ("Wednesday morning, about 8:20"). Under it,
one thing is being asked: **Morning pills — not yet**, with an instruction: *"Open the lid and show me
today's row."* She takes the photo. The app checks what it can see. If today's slot is clearly empty
it says so: "Wednesday morning slot is empty · 8:12." If it can't see, it asks once, calmly, for
another photo — a request, not an error — and if it still can't tell, it keeps the photo and says only
"Photographed · 8:12", making no claim. Done. She doesn't tap "done"; the photo is the mark.

Robert does nothing, unless she asks him — then he says "check your phone." Priya glances once:
"Morning pills — slot empty at 8:12. Last night's check done." She closes it.

The pill organiser is also a *thing*. "Where are my pills?" is ordinary Find and shows the same photo.

## Through the day — ten to twenty times

**She puts something down and snaps it.** No instructions; the AI names what it sees and guesses the
place; she taps a place chip or does nothing and it saves itself. Realistically she does this maybe
a third of the time — remembering to snap is itself a memory task — so the vault can't depend on it.
It is seeded by the starter checklist, kept fresh by Robert, and refreshed by the re-snap below. Her
own snaps are a bonus, not the engine.

**She loses something and taps its tile** (or asks by voice). She sees the photo, the place in big
words, "photographed yesterday evening." She goes and looks.

**Found.** One button: *Found it? Snap where it is now.* This is the one moment she is holding the
thing and the phone, and it is how the vault stays fresh without anyone doing data entry.

**Not there.** The answer was wrong — she already looked, or Robert moved them. The screen never acts
surprised. One button: *Not there? See earlier photos.* The same card, older and older: bedside drawer
yesterday, reading chair Tuesday, kitchen counter Sunday. She scrolls until one looks right.

**Robert moves her glasses** and snaps them on his phone (MVP; v0.1 is one device). Her tile updates.
She never knows he did it.

## Evening, about 9:30 — once

The phone shows a silent notice. She opens it and the home screen has changed shape: the date line,
then **Before bed**: stove, front door, back door, each with an instruction ("Show me the dials") and
an empty square. She photographs each. Where the AI can judge it says so ("Dials off · 9:40"); where it
can't, it says only "Photographed · 9:41." When all three have a photo: *All photographed tonight.*
The photos are the reassurance; the app doesn't editorialise.

The screen **stays in its evening shape until 5 a.m.** At 2 a.m. she wakes worried about the stove,
opens the phone, and the stove photo from 9:40 is right there. Back to sleep. "Check again" is always
allowed; doing the stove at 8 and again at 10 is just two photos with times.

If she does the stove and forgets the doors, they stay amber "not yet". Robert can snap them. Priya
sees "2 of 3" and decides for herself whether to text.

## The rules that fall out of the story

1. **Two capture modes, one gesture.** Self-initiated snaps are generic: no instructions. App-initiated
   snaps are specific: the app asked, so it says what it needs and verifies what it got.
2. **The app never claims more than the photo shows.** "Slot empty at 8:12", not "pills taken." The
   app doesn't know she swallowed anything.
3. **The photo is the mark.** No "done" tap after a photo. No checkbox anywhere.
4. **Tiles are the top of her head, not the catalogue.** Six to eight, in fixed positions, changed only
   when a person decides. "Keep at the top" / "Take off the top" on every thing. Everything else is
   under "Other things" or reachable by asking.
5. **Wrong answers get older photos, not apologies.**
6. **Find and Do never share a visual grammar.** Things are photo tiles. Routines are rows with a
   thumbnail-or-empty-square and a state in words.
7. **Every step is logged silently, with exact times, for research.** Nothing is ever shown to her
   as a number.

## A third class, for later: How

Alongside Find ("where is it?") and Do ("did it happen today?") there is **How** ("how do I work
this?"). Robert records twenty seconds of "here's how you turn on the massager"; Margaret asks and
watches. Same grammar — a tile or a voice ask returns a playback card. It is in the prioritizer as
`how-to-videos` (attractive, phase-2). Not built; leave room for it.

## Open questions for Tanya

- Silent notification at the evening hour, or only change shape when she opens the phone herself?
- Robert's evening view: the same shape as hers, or a list on his side?
- Should Margaret be able to pin things herself (v0.1: yes) or caregiver-only?
- Is "All photographed tonight" the right amount of reassurance, or too little?

## What v0.1 builds (one device, patient only)

Live at https://tanyaya27.github.io/recall/ · source `04_Engineering/recall-app/`.
Home shaped by the clock · generic and prompted capture with honest AI claims and one retake ·
location chips · auto-save · answer with earlier-photos scroll · pinning with fixed slots ·
routines editable in Settings · research-grade event log (see `05_Research/RESEARCH_PLAN.md`).
Robert's and Priya's devices are the next build.
