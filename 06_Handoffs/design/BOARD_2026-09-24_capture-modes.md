# All three capture approaches, as modes of one camera (2026-09-24)

Ravi, on the three options (`BOARD_2026-09-24_fast-capture-options.md`): *"Three very different paradigms … it
depends on personal preference and on the use case: insurance documentation vs a tradesman's scattered tools vs
specific items for an elderly person with memory issues. Can we have all three, with a quick way to change the
approach, or at least an option in Settings? Ideally switched by the user based on context."*

Picture: `mockups/C2_modes.jpg` (rig: `gen_c2.py`, `render_c2.js`). No app code.

## The design

- **Three modes in one camera**, chosen under the viewfinder by a tap or a sideways swipe, exactly like the
  iPhone camera's Photo · Video · Portrait:
  - **One thing** (option 2): after the photo, one card to name it and say where, with the likely place
    already chosen.
  - **Several** (option 1): the camera stays open, guesses stream into the strip, fix only what's wrong.
  - **Everything** (option 3): one photo of a drawer, shelf or room saves everything it can see, at one place.
- **Switching in context, without leaving what you're doing:**
  - in the camera: one tap or swipe;
  - from Home: **press and hold *Log item*** → *Log item as…* One thing · Several · Everything in view;
  - later, in the native app: a lock-screen control or Siri phrase per mode ("ReCall this drawer").
- **Where it opens:** the last mode used (default), or a fixed one, set in **Settings → Taking photos**.
- **Which modes show:** switches in the same place. **With only one mode on, the camera shows no choice at
  all.** Margaret's set-up (only *One thing*) looks exactly like today's camera, so her screen gets no busier.
  The five setup questions (scenarios note §5) pick the starting set: everyday things → One thing; tools and
  boxes → Several + Everything; insurance → Everything.
- **The app suggests, and never switches.** After three single logs in a few minutes it may offer once:
  *"Taking several? Stay in the camera."* [Several] [✕]. A screen that changes shape by itself is
  navigation she doesn't control (LESSONS 09-05).

## The boards

- **Devin:** accepted, which is a change from "one capture for everyone". The iPhone has already taught
  this exact control, so it isn't a new concept. His conditions: the app never switches mode by itself;
  a mode row only when there is more than one mode; the mode names are his to finalise (*One thing ·
  Several · Everything* for now).
- **Margaret and Dr Kim:** content, since her camera is unchanged unless someone turns a mode on for her.
- **Dan and Leila:** "hold *Log item* → Everything" is the drawer and box workflow in one gesture.
- **Noor:** the gold mode label and dot are the camera's own language; keep them, don't brand them.
- **Priyanka (cost):** the mode row, memory and Settings ~1 d · One thing ~1 d · Several ~3 d · Everything
  (list) ~2 d → **~7 days** for all three, against ~3 for Several alone. **Sequence:** step 2 = the mode row
  + One thing + Several (~5 d); step 3 = Everything with the nested places (as planned).
- **Sam:** modes are UI only. All three write the same things, places and sightings (with `placeSource`),
  so a mode can be dropped later without touching data. That makes this cheap to reverse.
- **Maya:** 7 days is fine *because* it replaces a decision we couldn't make with one the person makes
  each time. She wants the research log to record which mode each log used, so we learn which modes
  people actually use.

## Rulings

1. All three as camera modes, switched in the camera or by holding *Log item*; Settings for the default
   and which modes show?
2. Opens in the **last used** mode by default?
3. The mode names: *One thing · Several · Everything* (Devin to refine)?
4. Step 2 = mode row + One thing + Several; Everything in step 3?
