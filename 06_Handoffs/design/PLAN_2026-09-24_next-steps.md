# Next steps (2026-09-24), plus sizing with a ruler in the photo

Follows `PLAN_2026-09-24_generic-mvp.md`, whose build order was approved 09-24.

---

## 1. The plan: four weeks, with three tests running alongside

| When | Build (in the app) | In parallel (no app change) | Needs Ravi / Tanya |
|---|---|---|---|
| **Now: this week** | **Step 1 (#1 #2 #5):** AI through the server-side `ai` function, using ReCall's own key and a daily cap per person; neutral prompts; no setup card. The new first-run line is shown as a rendered option first. Then rig audits (`audit.js`, `audit_roles.js`), screenshots and deploy | **The garage photo session** (§3): one ~45-minute session feeds all three tests | Go-ahead; the invite test (15 min, below); enrol in the Apple Developer Program now, since approval and review take time |
| **Week 2** | Render the three fast-capture options (brainstorm §7) → your pick → **step 2 (#6 #9 #10):** capture without questions, label text, logging without a photo | **Test A: label text** (screw boxes, seed packets, a bill). **Test B: object positions** (Gemini boxes vs Claude on 20 drawer photos) | Pick a capture option |
| **Week 3** | **Step 3 (#7 #8):** places inside places, containers that move; "Everything in view", shaped by Test B | **Test C: ruler sizing** (§2) | Review the results |
| **Week 4 on** | **Step 4 (#3 #4):** native app (TestFlight), then the App Store's privacy and account requirements | Maya re-runs the Kano analysis for the general user (a document, no build) | TestFlight on your phone |

**Two items from the parked list move earlier because of strangers:**

- **The invite test** (Dad's phone → People → Invite → *Can help* → your phone opens the link). It
  unblocks stripping the leftover security rule (#4, part 1). About 15 minutes of your time.
  Doing it this week means the rule can go before anyone outside the family is on the app.
- **Billing.** Once the AI runs on ReCall's key through the server, every stranger's photo costs
  the project money. The Google Cloud trial ends **2026-12-21**. Attach real billing with a
  budget alert before step 1 ships, not in December. The per-person daily cap in step 1 limits
  the damage either way.

**What I can do without you:** step 1's code and rig checks, the capture renders, all three tests
once the photos exist, and the Kano re-run. **What only you can do:** the photo session, the
invite test, billing, and the Apple enrolment.

---

## 2. Sizing a screw, bolt, washer or drill bit from a ruler in the photo

**The idea (Ravi):** tradespeople always have a ruler or tape measure. If one is in the photo,
use it to size the item: drill-bit size, screw length and thickness. Rulers are usually in
inches, sometimes with cm/mm as well.

**Short answer: partly achievable.** Length, yes, probably, to about ⅛ in or 2 mm. Telling a
#8 from a #10 screw by thickness, not reliably from a photo alone. That difference is about
0.6 mm. Nothing here is tested yet (LESSONS: never assert an AI capability from training data),
so Test C decides.

### What's likely to work, and what isn't

| Measurement | How fine it must be | Likely? | Why |
|---|---|---|---|
| **Length** (screw, bolt, bit) | ⅛ in / ~2–3 mm between common sizes | **Probably**, when the photo is taken straight down with the item lying against the ruler | The ruler gives a scale in the same plane. **But the pixels matter:** the app stores photos at most 900 px wide (`img.js`) and the in-app camera captures ~1920 px, so a 6-in ruler across the frame gives ~6 px/mm stored and ~12 at capture, against ~25 from a full 12-MP iPhone photo. Measuring has to happen on the full capture, before compression, and is best in the native app |
| **Diameter / gauge** (#6 · #8 · #10; M4 · M5) | ~0.6 mm between sizes | **Not reliably** | A round screw lying next to a ruler sits *above* the ruler's surface, so it looks bigger than it is (parallax). Threads blur the edge. A few degrees of tilt swamps half a millimetre |
| **Drill bits** | fractional sizes 1/64 in apart | **Mostly by reading, not measuring** | Most bits have the size stamped on the shank, and index cases are labelled. Reading the text (MVP #9) beats measuring |
| **Material and finish** (stainless vs galvanized vs zinc) | — | **A guess, labelled as one** | They can look alike under indoor light. The AI can suggest; the label decides |
| **Thread pitch, head type** | — | Head type **yes** (pan, flat, hex are visible); pitch **no** | |

### How to do it well

1. **Prefer text over measurement.** The box, the bin label, the stamp on the bit. Measurement is
   the fallback when there's no label, and its answer always says *about*: *"about 1¼ in long,
   #8 or #10"*.
2. **Measure with code, not only the AI's eye.** An AI model reading ruler ticks and eyeballing an
   edge is the quick version. A more reliable version finds the ruler's tick marks with ordinary
   image processing (OpenCV runs in the browser), computes pixels per millimetre, corrects for the
   camera angle, and measures the item's outline. Test C tries both.
3. **A printed ReCall sizing card** (Priyanka's idea, and the board's favourite): a card with
   printed corner markers the camera can lock onto (for exact scale and angle), an inch and mm
   scale, and **a row of labelled holes** (#6, #8, #10, ¼ in; M3 to M6). The photo measures
   length; *putting the screw through a hole* settles the gauge, which is how tradespeople already
   check. It's free to print, and it would go on the same sheet as the QR box labels.
4. **Guide the shot.** In the camera, a "measure" mode with an outline showing where the ruler and
   the item go, and a level indicator (the phone's tilt sensor) that turns green when the phone is
   flat. Straight-down photos are most of the accuracy.

### What the boards said

- **Dan (the 55-year-old with the garage):** "If it tells me the length and that it's stainless,
  and I can check the gauge with the card, that's the rebuying problem solved. Don't pretend about
  the gauge."
- **Priyanka:** length is realistic in the web app. Diameter needs the card. The level indicator
  needs the phone's motion sensor, which the web app can reach after a permission prompt; the
  native app has it without one.
- **Sam:** store the size as a measurement with a confidence, separate from the label's text:
  `details.size = { length: 31.8 mm, gauge: '#8?', source: 'ruler', confidence }`. Then *"do I
  have #8 × 1¼?"* can say *"probably, in bin B, measured"* vs *"yes, bin C, from the label"*.
- **Devin:** this is the tradesperson configuration's feature. It must never appear in Margaret's
  camera; measure mode is off unless *Tools and supplies* is turned on.
- **Maya:** after the MVP. It goes into the prioritizer as a *performance* feature for the trades
  scenario, and it gets built once Test C shows the numbers.

### Test C: what it would measure

30 real fasteners and bits with known sizes (from their packaging or a caliper), photographed
three ways: against a ruler, against a tape measure, and on a printed sizing card. Compare the AI
alone vs the code-based measurement. Report the error in mm for length and the % of gauges read
correctly. The pass line (Dan's): length within ⅛ in on 9 of 10, and no wrong gauge stated
without an "about".

---

## 3. The garage photo session (for Ravi, one sitting)

One session feeds all three tests. Take all shots on the phone, in ordinary light, with no
special setup except where noted. **Please write down the real answer for every shot** (what's in
the drawer, the true size); the test is only as good as that record.

| # | Shots | What to photograph | How | Record the true answer | Test |
|---|---|---|---|---|---|
| 1 | 5 | Boxes or bins of screws/bolts **with a printed label** | Label facing the camera | The label text | A |
| 2 | 2 | Seed packets | Front of the packet | Plant name | A |
| 3 | 2 | A bill or letter (cover any account numbers) | Flat, whole page | Payee, amount, due date | A |
| 4 | 1 | A drill-bit index case | Open, straight down | The sizes printed in the case | A |
| 5 | 20 | **Open drawers, bins and shelves** with 5–20 items each, some tidy, some cluttered | Straight on, the whole drawer in frame | A list of what's actually in each (a voice memo is fine) | B |
| 6 | 30 | **Single fasteners and bits** (10 screws in mixed gauges and lengths, 10 bolts/washers, 10 drill bits) **next to a ruler** with inch and mm markings | Straight down, the item lying flat against the ruler's edge | The true size from the packaging or a caliper | C |
| 7 | 10 | 10 of the items from row 6 **next to a tape measure** | Same | same | C |
| 8 | 5 | 5 of the items from row 6, **tilted** (phone ~20° off straight down) | On purpose, to see how badly angle hurts | same | C |

About 75 photos. Put them in a folder on the Mac and I'll name and file them for the tests.

---

## 4. Decisions needed now

1. **Go on step 1?** (The build starts as soon as you say so; only the first-run line waits for
   your look at a rendered option.)
2. **Book the garage session** (§3), and **the invite test** (15 min).
3. **Billing and Apple enrolment** this week?
4. **The ruler/sizing feature:** add it to the prioritizer for the trades scenario and run Test C
   in week 3, with the printed sizing card as the recommended approach?
