# Board: every screen, every button (2026-09-27, after Ravi's phone test of build 1)

Ravi, 09-27, after testing 20260927c on his phone:
- **The camera:** "The current method only allows for one photo of the item. Any subsequent photos assumes it is a photo of the next 'in' location. The 'in' photo capture should be with intent …"
- **Placing the pencil:** "When I pick the pencil, I get one location I can put it in … there is no way to create a new place … the 'Put in' button … takes the user to a totally new operation … circular pathways that makes me just get lost … You need to go deep into every possible click path and look at every button and pixel."

**What was done.**
- `rig/crawl_s11.js` opened **28 screens** in Ravi's dark theme with the trail look, using data shaped like his phone:
  - the pencil that ended up holding the filing cabinet, which holds the passport;
  - photos cut from his screenshots.
- On every screen it found every tappable thing and tapped **each one from a fresh copy of that screen: 206 taps**. Every landing screen was screenshotted.

Files:
- `mockups/S11_crawl_every_screen.pdf`: one page per screen, every button numbered, where each tap lands.
- `mockups/S11_evidence.jpg`: the worst problems on the real screens.
- `mockups/S11_map_now.jpg`: every path that sets "where" today.

No app code changed.

## What is wrong (numbered as on the evidence page)

**The camera**
1. After the first photo, every photo is a new "where" level. There's no second photo of the thing, and no way to say which level a photo is for. *(Ravi)*
2. In the dark theme the thing's name and the sentence are white on a white card: invisible. The card is nearly opaque. *(Ravi)*
3. The pin icon doesn't line up with the first line of the sentence. *(Ravi)*
4. Following from #1, a second close-up of the spoon became a place called "Desk surface".
5. The place chips offer only things that already hold something (Filling cabinet, Blue tin). The ••• list offers "In the pencil".
6. ••• opens the old "Where is it now?" sheet: typing, no photo, no search.
7. Tapping the name opens a near-opaque white sheet.

**Choosing where (from a thing's page)**
8. **Loop bug.** "Where is it now?" offered to put the pencil "In the filing cabinet", which is inside the pencil. Choosing it saved a loop: the pencil is in the cabinet, which is in the pencil.
9. Places show a photo borrowed from a thing that is there: Bathroom shelf shows the Cetaphil, Desk shows the painting.
10. "What is it in?" offers every thing as a box (slippers, the Cetaphil jar). A new box can only be typed.
11. There's no way to photograph a new place from a thing's page. *(Ravi)*

**Direction: "Put things in"**
12. "Put things in it" is on every thing's Edit row and on the hold sheet, and it lists every other thing. A tin can be put INTO a pencil. **This is how the filing cabinet got inside the pencil:** you meant "put the pencil in the cabinet". *(Ravi)*
13. Putting away starts from 5 places (Edit row, hold sheet, box page, the inside view's Put in, Not put away), each on its own screen. Altogether, **6 different kinds of screen set "where"**:
    - the camera;
    - Where is it now?;
    - What is it in?;
    - Put things in …;
    - Put away;
    - Write it down.
14. "Not put away" offers "In the pencil" as a place.

**Home**
15. A tile that holds something opens "inside" it; every other tile opens its own page. Two behaviours for one kind of tap. *(Ravi)*
16. The pencil tile says "1 inside" and "No place assigned" at once. *(Ravi)*
17. The day line looks like a title but is a button ("switch ReCall"), and it does nothing when you're the only person.

**Inside a box**
18. Tapping a box inside shows its contents. It isn't placing, so you can't "put it here". *(Ravi)*
19. The only way to the box itself is the small "About this box" link.
20. The footer's Log here / Put in start new jobs from a child page. Put in is a whole other operation. *(Ravi)*
21. A place opens the same view, with a different footer (Log here · Find item).

**A thing's page**
22. The place line reads "No place assigned · Cream-colored knitted blanket or sweater". What the AI saw in the photo looks like the place.
23. "Written down, no photo yet · Add photo below if you like" appears on a box made by typing. *(Ravi)*
24. The holder row (Pencil ›) leads to the pencil, whose "In it" leads back to the cabinet: round in circles. *(Ravi)*
25. The bottom bar is on every page. In Edit it becomes "Done", with a second "Done" in the row above.
26. The Edit row has "Move to the t…" (cut off, with no visible effect) and "Put things in". *(Ravi)*
27. "Show times on photos" is on every thing, though it's a setting for the whole app.

**The hold sheet**
28. It has eight choices:
    - "Change the place" and "Rename" both just open the page in Edit; neither does what it says.
    - "Move to the top" only shows a toast.

**Find**
29. The answer is only as good as the data ("In the filing cabinet, in the pencil"), and the tile's where-line is cut off.

Numbers 8, 12 and 14 can each **write nonsense** into your ReCall. They are bugs whatever else is decided.

## The fix (drawn in `mockups/S11_fix_camera.jpg`, `S11_fix_pages.jpg`, `S11_map_new.jpg`)

**1. The camera photographs the level you choose** (Ravi's design).
- **Levels:** the thing is level 0, what it's in is level 1, where that is is level 2, and so on. Each level has its own colour: the thing is white, then amber, blue, coral, violet, green, pink, teal, lime, orange, sand, up to 10 levels.
- **Choosing a level:** the chosen level's square is outlined in its colour, and the **shutter's outer ring takes the same colour**. Every photo goes to the outlined square, and a level can hold several photos ("2").
- **After the first photo** the thing stays chosen. **＋** (in the next colour) picks the next level. A place chip fills the chosen level.
- **Tapping a level's photo** opens it half-screen, outlined in its colour, with "Remove this photo". **Swipe left or right to see the other photos of that level only** (Ravi, 09-27): the spoon's photos when the spoon is tapped, the tin's when the tin is. Dots and "2 of 2" show where you are.
- **The card** is dark glass: see-through, white text, never white on white. The pin lines up with the first line.

**2. One page per thing.**
- Every tile (on Home, "In it", Find, Not put away) opens **that thing's page**.
- The page shows:
  - **Where it is**, with the chain as photos and **Move it**, or amber "No place yet" with **Put it somewhere**;
  - **In it**, only if something is in it; each opens its own page, and Back returns;
  - one short list: Add a photo · Rename · Keep private · Remove.
- No bottom bar, no Edit mode, no "Move to the top", no second Done.
- What the AI saw goes under the photo ("In the photo: a cream knitted blanket").

**3. One way to say where: the same camera.**
- **Put it somewhere / Move it** opens the camera with the thing already there and level 1 chosen: photograph the place, or tap one.
- **•••** lists every place and every box with a search, and "New place or box: photograph it". It never lists the thing itself or anything that would make a loop.
- **"Put things in" goes everywhere.** You only ever say where THIS thing is.
- **Write it down** uses the same camera for where.

**4. Home.**
- Line 2 of every tile is where it is (amber = no place yet).
- "N inside" appears only on something that holds things.
- **Not put away** becomes a list of those things; each opens its page. Putting several away at once comes later, on the camera.

**5. No loops, anywhere.** Every save refuses a loop at the moment it's written, not just in the lists.

**Your data.** Once this is built, open the Filling cabinet → **Move it** → pick where it really is. The pencil then holds nothing, and you can give the pencil its place the same way. Or I can fix those two records for you in the next build; say which.

**Taps under the fix:**

| Task | Before (09-27c) | After |
|---|---|---|
| A thing at a place you use (chip) | 3–4 | 4 (3 when the photo shows the place) |
| Your example: key → new tin → shelf | 5, but every extra photo was a guess | **7**, every photo where you meant it (＋ before each level) |
| Several photos of the thing | impossible | +1 shutter each |
| Put the pencil somewhere (tile → Put it somewhere → chip → Save) | 6+, through Edit and sheets, and wrong | **4** |
| A new place, by photo | impossible from a page | **4** |

## Board positions

- **Maya (PM):** Two extra taps in the long example are the price of intent, and worth it. A wrong guess costs far more than a tap.
- **Devin (design):** Retire the inside view and its footer completely. A box's page with "In it" is the same information without a second navigation system.
- **Noor (design):**
  - The colours must never be the only signal. The prompt also says it in words ("The spoon · 2 photos", "Where it goes").
  - The colour dot sits in the prompt.
- **Priyanka (engineer):**
  - The loop guard goes into the one place every move is written, so no screen can make a loop again.
  - Removing "Put things in" and the inside view deletes more code than it adds.
- **Sam (architect):**
  - The edges model is unchanged.
  - "Home follows the box you tap" (ruled 09-25) and the A/B inside-view experiment are retired by this. **Ravi's call.**
- **Dr Kim (tremor):** ＋ and the level squares need to be at least 56 px. They are drawn at 58 px.

## Rulings needed

1. **The camera levels as drawn:** the thing stays chosen, ＋ picks the next level, one colour per level, shutter ring in the same colour. OK?
2. **One page per thing:** every tile opens its page, and the inside-a-box view (and its A/B setting) goes. This **reverses the 09-25 ruling**. OK?
3. **Only a container holds things** (Ravi's refinement, 09-27; `mockups/S11_fix_containers.jpg`).
   - **What counts as a container:**
     - something you photographed as where something is, if it moves (a tin, a box, a bag);
     - or anything you switch "It holds things" on for;
     - places always hold things.
   - **Only on containers:** "Put things into the tin" appears only on a container's page. It lists things only, never itself, never a loop.
   - **Where lists:** every "where" list offers only places and containers, so a pencil or a jar of cream never appears.
   - **Switching it off:** "It holds things" can't be switched off while something is inside.
   - **Security rules:** these change, because helpers can set the mark too. They are proven on the real rules engine before deploy.

   OK?
4. **The thing's page** as drawn: inline actions, no bottom bar, no Edit mode. OK?
5. **Fix now, before the rest:** the loop guard, the white-on-white card, the pin alignment, and removing "Put things in", as a small safe build today? The board says yes: #8 and #12 are writing bad data.
6. **Your pencil and cabinet:** should I repair them in the build, or will you do it with Move it?

After your rulings, the same crawl runs again on the new build, and you see every screen and every tap before anything goes to your phone.
