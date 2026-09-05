# Board session — 2026-09-05 (late) — platform conventions audit

**Status: awaiting Tanya's / Ravi's decision on the splits in §4.**

**Why this exists.** Tanya's requirement: *the app should have the look, feel and structure
of the most common apps so seniors find it familiar.* The board's first pass (§9 of the
interaction-model file) answered it with one header bar. Ravi, rightly: "what else have you
not covered that every app should have?" This is Devin's deep dive — every convention the
apps a senior already uses (Phone, Messages, Photos, Mail, Camera, Settings, WhatsApp,
Safari) share, checked against ReCall as built tonight, with a verdict and who objected.

Devin's rule for the whole audit: **adopt a convention when it carries meaning the person
already knows; reject it when it is a habit of apps that have many sections, because
ReCall has one.** Familiarity is not "looks like Photos"; it is "my hands already know
what this does."

---

## 1. The audit

Verdicts: **Adopt** (build now) · **Adopt later** (agreed, not this cut) · **Keep**
(already there) · **Reject** (with the reason) · **Split** (for Tanya, §4).

### Navigation and structure

| # | Convention | In common apps | ReCall tonight | Verdict |
|---|---|---|---|---|
| N1 | Pinned nav bar: Back top-left with a chevron **and a word**, title beside it | Every iOS app | Built tonight | **Keep** |
| N2 | **Swipe from the left edge goes back**; Android back button goes back | Every app | **Missing.** Routes live in memory; the swipe does nothing, the Android button leaves the app | **Adopt.** Priyanka: push each card onto `history` so the phone's own back gesture works. Unanimous — this is the most-used navigation gesture on the phone and we don't answer it |
| N3 | Tab bar at the bottom for sections | Photos, Mail, WhatsApp | Two action buttons at the bottom | **Reject.** Depth one — there are no sections. Devin's risk: the footer must not *look* like a tab bar or she'll expect it to switch views. Buttons stay button-shaped |
| N4 | Settings as a **gear** top-right (or a profile circle) | Most apps | The word "Settings", small | **Adopt:** gear glyph **with** the word. An icon alone is a menu she has to learn; a word alone is not what her eye is trained to find |
| N5 | Search field at the top of a grid or list | Photos, Contacts, Mail, Files | "Where is my…" button at the bottom | **Split S2.** Maya: every list app puts search on top; that's where a senior's eye goes. Devin: two entry points for one action is one more decision, and the bottom is where her thumb is. Robert: doesn't care, he doesn't ask. James: a field with the keyboard's mic key on top would be the closest thing to voice he can drive |
| N6 | Pull to refresh | Mail, social | None | **Reject.** Data is live; a gesture that does nothing visible confuses |
| N7 | Empty state: one sentence, one action | Photos, Notes | Built | **Keep** |
| N8 | Opens where you left off | Most | Always opens on My things | **Keep.** Rule 1; James "may open the app and not remember why" |
| N9 | Long-press for a context menu | Photos, Messages | None | **Reject** for the patient screens (a hidden gesture). Robert may get it on helper phones later |

### Feedback and state

| # | Convention | In common apps | ReCall tonight | Verdict |
|---|---|---|---|---|
| F1 | **Pressed state** on every tappable thing | Every app | **Missing.** Nothing changes under the finger | **Adopt.** 100ms dim/scale on `:active`. Unanimous; cheapest fix in the file, and its absence is why a screen feels dead |
| F2 | Brief confirmation after an action (toast / "Saved") | Mail "Sent", Photos "Saved to Photos" | None; the new tile appearing is the signal | **Split S3.** Maya + Linda: a quiet "Saved · kitchen counter" for two seconds is what every app does and it is reassuring in fact, not in sentiment. Devin: Rule 7 — say what happened, never more — is satisfied by that string; his worry is that a toast over the board is one more moving thing. Margaret: "if it says what I did, fine; if it says 'great job', no" |
| F3 | Destructive actions: confirm in an **in-app sheet** with the action named ("Remove" / "Keep") | Every app | The browser's `confirm()` dialog — grey, system-styled, "OK/Cancel" | **Adopt.** The browser dialog is the least app-like thing on screen. In-app sheet, our type and colours, verbs not OK/Cancel. iOS uses red for destructive; ours stays amber (calm-ui must-be) |
| F4 | **Undo** after a removal | Mail, Photos, Notes | Recently removed in Settings | **Adopt with F2:** the removal toast carries *Undo*. Same soft-delete underneath |
| F5 | Loading: a calm indicator, not a blank | Every app | Skeleton line for the name; "Opening ReCall…" text at boot | **Keep**, add the indicator to *Find it* while it thinks (2–4s of nothing tonight) |
| F6 | "No connection" banner **when the phone is offline** | Mail, WhatsApp | None | **Adopt, strictly.** Show only when `navigator.onLine === false` (LESSONS: never diagnose). Copy: *No connection right now — photos will save when it's back.* Firestore queues writes, so that sentence is true |
| F7 | Disabled controls look disabled | Every app | Built | **Keep** |

### Input

| # | Convention | In common apps | ReCall tonight | Verdict |
|---|---|---|---|---|
| I1 | System camera, single tap | Camera, Messages | Built tonight; works (Ravi) | **Keep** |
| I2 | Text fields: right keyboard, clear (×) button, sentence case | Every form | Fields exist; no clear button; `autoCapitalize="none"` on places | **Adopt:** clear button on the ask field; capitalise places as sentences (she reads "Kitchen counter", not "kitchen counter") |
| I3 | Voice via the keyboard mic | iOS | Accepted gap (D9) | **Keep** |
| I4 | Big tap targets ≥ 44pt | HIG | Everything ≥ 44 | **Keep** |

### Visual

| # | Convention | In common apps | ReCall tonight | Verdict |
|---|---|---|---|---|
| V1 | The **system font** | Every Apple app | Stylesheet asks for Atkinson Hyperlegible, which is never loaded, so the phone shows its own font anyway | **Keep, and make it honest:** drop the phantom font name; `-apple-system` first on purpose. Same letters as Messages |
| V2 | **Icons with labels** on primary buttons | Camera glyph, magnifier, gear | Words only | **Adopt.** Glyph + word on *Take a photo*, *Where is my…*, Settings. James recognises the camera glyph before he reads. Real SVG, not emoji (emoji render differently per phone and look like toys) |
| V3 | Respect the phone's own **text size** (Dynamic Type) | System apps | Our own Normal/Large/Largest | **Adopt later.** Priyanka: web apps get Dynamic Type only via `font: -apple-system-body`, and it fights our scale. Keep ours; add "Match my phone" as a fourth option when it can be tested |
| V4 | **Dark mode** follows the phone | Every app | Three light palettes | **Split S4.** Maya: the phone flips at sunset and a white page in a dark room is the first thing a senior notices. Devin: adds a fourth palette (Dusk) and a "Match my phone" default; costs an hour; the risk is contrast on photos. Linda: prefers warm light; must not be forced. Sam: no data impact |
| V5 | Settings as **grouped rows with chevrons** | iOS Settings | Cards with headings | **Adopt, modestly:** grouped look, rows, chevron where a row opens something. It is the one screen where "looks like iOS Settings" is exactly right — a helper knows that screen |
| V6 | Grid thumbnails: square, tight, 3–4 across | Photos | 2 across with labels | **Keep 2 across.** Photos is for browsing thousands; My things is for recognising twelve. James needs big |
| V7 | Safe areas, notch, home indicator | Every app | Built | **Keep** |
| V8 | Splash on launch (iOS startup image) | Installed apps | Blank then "Opening ReCall…" | **Adopt later** (image asset per device size; low value) |
| V9 | Focus states, VoiceOver labels | Accessibility | Partial | **Adopt.** `aria-label` on every icon button; visible `:focus-visible`. Devin's job, no decision needed |

### Things common apps have that ReCall should **not**

| # | Convention | Why not |
|---|---|---|
| X1 | Sign-in, username, password | No accounts by design (Sam; DECISIONS 09-05). A login screen for Margaret is the worst screen we could add |
| X2 | Onboarding carousel | Margaret reads once and won't remember it tomorrow; the empty state is the onboarding |
| X3 | Hamburger / drawer | Rejected 09-05; a menu she must learn |
| X4 | Badges, counts, streaks | Research rule: nothing is ever shown to her as a number |
| X5 | Push notifications | Later, with routines, on the helper's terms |
| X6 | Share sheet (send a photo to Priya) | Good idea, not this cut — **added to the prioritizer as a candidate**, attractive, helper-side |

## 2. Priyanka and Sam

**Priyanka.** N2 (history) is the one with teeth: every route becomes a `pushState`, Back
becomes `history.back()`, and the app must survive a reload on a deep URL (it should land
on My things — Rule 1 — not on a half-loaded card). F3 replaces three `confirm()` calls
with one sheet component. F1, V1, V2, I2, V9 are stylesheet and markup. F2/F4 toast is one
component. S4 dark palette is an hour if we do it, plus photos need checking on a dark
ground. All of it fits in one session; **none of it touches the engine.**

**Sam.** Nothing here changes data. One flag: S3's toast with Undo must use the existing
soft delete, not a delayed write — a delayed write that the app closes on is a lost photo.

## 3. End-user board

**Margaret.** Pressed states, the back swipe, the gear she recognises, icons on the two
buttons: "that's how my phone works." A toast that states what happened: fine. Dark mode:
"I don't use that." Search field on top: "I'd tap the picture first anyway."
**Robert.** Wants the back swipe most ("I keep swiping and nothing happens"), then undo.
Doesn't care where search is. Dark mode: yes, he reads in bed.
**Priya.** V5 — a Settings that looks like Settings is what she'll walk her father's helper
through on the phone.
**James.** Icons on buttons help him more than any other item here. A search field on top
with the keyboard mic is the nearest he gets to voice.
**Linda.** Toasts must be quiet and must say the fact. No dark by default; the choice must
be hers. Undo calms her more than any confirmation dialog.
**Harold.** The more it looks like the phone's own apps, the less it looks like a memory aid.

## 4. Splits for Tanya

| # | Split | Recommended | The other side |
|---|---|---|---|
| S2 | Search field at the top of My things as well as the *Where is my…* button | **Not yet.** Ship the button; watch whether testers look at the top | Maya + James: the field belongs where every list app puts it |
| S3 | Two-second toast after save/remove, with Undo on remove | **Yes**, fact-only strings, no verbs of praise | Devin: one more moving thing over the board |
| S4 | Dark palette + "Match my phone" | **Yes**, as an option, never forced; Linen stays default | Devin: contrast on photos untested; Linda: not by default |

**Adopt now, no split (unanimous):** N2 history/back-swipe · N4 gear+word · F1 pressed
states · F3 in-app confirmation sheet · F5 thinking indicator on Find · F6 strict offline
line · I2 clear button + sentence-case places · V1 honest system font · V2 SVG glyphs on
the two buttons · V5 grouped Settings · V9 labels/focus.

**Adopt later:** V3 Dynamic Type option · V8 splash · X6 share sheet (prioritizer).

## 5. Density pass (Ravi, mid-build: "horizontal space is premium, so is vertical")

Devin, measuring tonight's build on a 390pt phone:

| # | Problem | Fix |
|---|---|---|
| L1 | **A portrait photo at full width is ~520pt tall.** On the thing card that pushes the place and the time — the answer — below the fold. On the photo card it pushes *Where is it?* and the chips off screen, so the one tap the card exists for needs a scroll first | Photos are shown **4:3 landscape, cropped (`object-fit: cover`), capped at 42% of the viewport height.** The answer and the chips are visible without scrolling on every phone. Tap the photo to see it whole (uncropped, in place) |
| L2 | Tile labels wrap to two or three lines at 19px — the grid's rows go ragged and the board gets a scroll it didn't need | Two lines max at 16px, then ellipsis (one line truncated "Reading gla…" in the preview — recognition beats a row of even height). Names are ≤ 3 words by the engine's prompt; the full name is on the card. *no place yet* is the only extra line, and only when true |
| L3 | Header title could wrap or run | Already single-line with ellipsis; keep. Nothing on screen ever scrolls or marquees |
| L4 | Card padding 16 + margins 12 + section gaps stack up | Card padding 14, card gap 10, `.head` and `.loc-big` margins tightened. Reclaims ~40pt per card |
| L5 | Footer reserves 96pt on Home and the thing card | Correct — that is the thumb zone; but the gradient fade is 18pt shorter so one more tile row shows |
| L6 | Photo card: name row, then *Where is it?*, then chips, then *Somewhere else*, then *Not sure* | *Not sure* moves into the chip column as the last, quiet row — one column, no orphan link |

Horizontal: two columns stays (V6). Page gutter 16pt stays — at 12 the tiles touch the
edge and she can't tell where the screen ends.

**Lesson for the method** (also in LESSONS.md): a requirement phrased as a *principle* —
"like the common apps" — gets an audit against a named reference set, not a feature. The
first pass answered it with one bar because it treated it as a feature.
