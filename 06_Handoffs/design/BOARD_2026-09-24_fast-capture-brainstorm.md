# Fast capture: logging one thing, then the next, as quickly as possible (brainstorm, 2026-09-24)

**Status: a brainstorm for Tanya and Ravi. Nothing is drawn or built.** It covers MVP items #6
(capture without questions) and #8 (one photo, many things) from `PLAN_2026-09-24_generic-mvp.md`.

The question, as asked: should the place be guessed and corrected, or picked from a list, right on
the photo page? Should the fields be translucent and pop in (on a button press, after a 1-second
pause, or after *accept photos*)? In a cluttered picture, should the person touch the object, or
should we float text labels over the big objects (no more than 5)? The goal: log an item, and the
*next* one, as fast as possible.

---

## 1. What makes capture slow today

The capture path has five steps, and today each one waits for the previous one:

**trigger → camera → shutter → *what is it?* → *where is it?* → saved → (back to Home) → trigger again**

Three things cost time:

1. **Leaving the camera.** After *Done*, the photo card replaces the viewfinder. The next item means
   going back to Home and opening the camera again.
2. **Waiting for the AI's name** before the card feels finished (a few seconds per item).
3. **The place question** asked every time, even when the answer is obvious (same shelf as the
   last item; where the keys always live).

**The idea that fixes all three:** *the shutter saves, and the camera never leaves.* The AI's
guesses of *what* and *where* stream in over the live camera while it keeps running. The person
fixes a guess only if it's wrong, and **the next shutter press means "the last one is right"**.
There's no timer and no countdown (Margaret rejected the countdown on 09-05: *"it's rushing me"*),
and no separate page to confirm.

## 2. Where the place comes from, best source first

Before the AI even sees the photo, the app often already knows the place:

1. **A session place.** She set it once ("garage, shelf 3", or scanned the QR label on box 14).
   Every shot goes there until she changes it.
2. **The previous item, a moment ago.** Two things logged a minute apart are almost always in the
   same place, so that place is offered first.
3. **Where this thing usually lives.** A re-logged thing ("keys") goes to its usual place (its
   history).
4. **The place in the photo.** Places already have their own photos (built in round 7), so the AI
   compares the background with them. It is only useful in a wide shot; a close-up of a key shows
   no room.
5. **Ask.** Only when none of the above is confident: three chips plus *Somewhere else*.

**So, on "guessed or picked from a list": both, chosen by confidence.** When the app is sure, it
shows one place, already chosen, with a small ▾ to change it. When it's unsure, it shows three
choices with nothing selected. The person never has to *accept* a correct guess; she can ignore
it and move on.

## 3. The camera screen after the shutter (the answer to "pop in")

Three ways to show the guesses, with the board's reactions:

| Option | How it behaves | For | Against |
|---|---|---|---|
| **a. A strip appears at once** | The moment the shutter fires, a frosted strip rises over the bottom of the live viewfinder: the photo thumbnail · *Naming…* → *Car keys* · 📍 *Hall table* ▾. It stays until the next shot. | Nothing to wait for or press; the camera stays live; the next shutter press accepts it (Devin, Maya, Dan) | Translucent text over a busy photo can be hard to read at Largest (Margaret, Linda) → Noor: frosted blur plus a solid dark scrim, text at a fixed size, never plain transparency |
| **b. After a 1-second pause** | The strip appears only once the hand has stopped | A quick burst isn't cluttered by strips | A delay is a timer by another name; the person wonders whether it saved (Devin: "a pause the user can't see is a bug report") |
| **c. On a button** (*Review*, or *Accept photos* after several shots) | Guesses stay hidden until asked for | Cleanest viewfinder | An extra tap per item; nobody corrects what they can't see, so wrong guesses slip through (Priyanka) |

**The board lands on (a), with two conditions from the persona board:**

- The **save is shown in the strip** at once (the thumbnail plus a quiet *Saved*), so she knows the
  shutter worked, before any name arrives.
- **Nothing in it changes size with the text setting except the words**, and the strip never
  covers the centre of the viewfinder. (It is ~25% of the height at Largest; Priyanka measures it
  in the rig.)

**Several photos of the same thing (a close-up plus a wide shot):** today the camera collects up
to four shots and *Done* turns them into one item. In a continuous camera, how does it tell *a
second angle of this thing* from *the next thing*?

- **Sam's rule: the default is a new thing.** A small **＋** on the last thumbnail in the strip
  means "add an angle to this one". The rule is clear and never merges silently (LESSONS 09-05).
- **Maya's alternative: the AI decides**, and the strip shows the grouping (*2 photos · Car keys*)
  with one tap to split. Faster, but it depends on a guess.
- **Recommendation:** Sam's rule for the MVP. Revisit when the same-thing check (which already
  runs, built 09-14) has a track record on real sessions.

## 4. A cluttered picture: which thing did she mean?

Four ways, which can be combined:

| Option | How | For | Against / what must be tested |
|---|---|---|---|
| **a. Aim** | A soft reticle (a ring) in the centre of the viewfinder. Whatever is under it is the item; the rest of the photo is context for the place | **No extra tap.** Works like pointing. Excellent for one thing on a busy shelf (Maya, Noor) | She has to know to aim; the first-run line has to teach it in five words |
| **b. Touch** | After the shot, tap the object in the photo. We send the AI a crop around the tap plus the full photo | Precise, natural ("that one"), one tap. The same gesture adds more things from the same photo (#8) (Devin, Dan) | One AI call per tap (cost); a small target at arm's length in a drawer |
| **c. Labels on the big objects (≤ 5)** | The AI names up to five objects, and each label floats over its object. Tap a label to include it; tap elsewhere to add one it missed | Shows what the app *saw*. The natural screen for a drawer or a box's contents (#8). Nothing to type (Dan, Leila) | **Needs the AI to say *where* each object is in the picture.** Claude names objects well, but its positions are not reliable enough to pin a label on a small thing. Gemini returns object boxes (the engine already supports Gemini). On a native iPhone, Apple's own "lift the subject" can outline the object under a finger. **All three need a spike before we promise labels over objects** (Priyanka) |
| **d. A list under the photo** | The AI's ≤ 5 names as switches under the photo, with no positions | No position accuracy needed; readable at any text size (Margaret) | She has to match words to objects herself; weaker in a drawer of look-alike things |

**Board recommendation, in stages:**

1. **MVP (web): aim by default (a), touch to add (b), and the list as the fallback (d).** Every
   piece works with the AI we have today.
2. **After a spike: labels over objects (c)** if Gemini's boxes or Apple's on-device subject
   outlines are accurate on twenty real drawer and shelf photos from Ravi's house. This is the
   same spike already on the list for #8.
3. **"Everything in view" is a switch in the camera, not the default.** With it on, a shot logs
   every item it finds, all at the same place: the drawer sweep (#8). With it off, a shot logs
   the aimed thing. Devin's condition: the default must never produce twenty guesses from one
   photo of her glasses on a busy table.

## 5. Other ways to make the *next* item faster (not yet discussed)

- **The place first, in bursts.** Photograph the shelf or box (or scan its QR label) first; every
  shot after it goes there until another place is photographed. The app recognises "this is a
  place" from the QR code, or from a *This is the place* chip in the strip.
- **Name at the end, not per item.** At the end of a burst, one screen shows the session's things
  as a grid, with names already filled in by the AI. Fix only the wrong ones. Leila can pack a
  whole box without looking at a single name.
- **Speak while shooting (native only).** Hold the shutter and say *"passport, box 14"*. iOS web
  can't do reliable speech (D9, 09-05), so this waits for the native app.
- **Never wait for the AI.** Names and places arrive when they arrive. A shot the AI couldn't name
  is still saved, with its photo and its place.

## 6. What a fast session would look like (combining the above)

Leila, packing box 14:

1. Lock screen → the ReCall control → camera (native), or the ReCall icon → *Log item* (web).
2. Scan box 14's label. The strip says **📍 Box 14** and it stays set.
3. Aim at the passport folder → shutter. The strip says *Saved · Passport folder · Box 14*.
4. Aim at the camera charger → shutter. Same place, a new thing.
5. … eleven more, **one tap each**.
6. Close the box, photograph it on the shelf → *This is the place* → Box 14 is *in the locker,
   back left*.
7. *Done* → the session grid → fix one name → finished.

**Count, from reaching for the phone:** unlock, 1 tap to open, 1 to scan, then 1 per item, 1 for
the box's place and 1 for *Done*. For 13 items: **17 taps**, against about 80 today (13 items × 6).
These are counts from the design, not measurements.

## 7. The next step, if Tanya agrees

Render three options for the camera screen after the shutter (standing rule: no layout change
without rendered options):

- **Option 1:** strip over the live camera (§3a), with aim and touch (§4a–b)
- **Option 2:** today's photo card, with the place already chosen and a *Next item* button (the
  small change)
- **Option 3:** "Everything in view" on a drawer photo, with the list (§4d)

Each shown at Normal and Largest, Linen and Dusk, with taps counted. Run the label-position spike
in parallel.
