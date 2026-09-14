# Multi-user ReCall — the staged plan (2026-09-14)

Three boards met in parallel on one question — how Margaret, Robert and Priya each sign in
and interact, with roles — and wrote their reviews independently:

- `CUSTOMER_BOARD_multi-user.md` — eight personas, in their own voices.
- `UX_BOARD_multi-user.md` — Devin and Maya: screens per role, joining, copy, three
  recorded disagreements.
- `TECH_BOARD_multi-user.md` — Sam and Priyanka: data model, auth, the Firestore rules
  sketch, the AI-key proxy, storage, effort in days, the rig's test plan.

This file reconciles them into one sequence. Where the boards disagree it says so; the
open calls are at the end for Ravi and Tanya.

## Where the three boards already agree

Margaret never logs in and her phone never changes: the board, two verbs, no menu she
did not have before, no name of any other person on her screen. "Patient" is a slot on a
phone, not an account. Robert and Priya get real roles; their phones show the editors
and lists. Who logged what is recorded in the event log and never displayed on Margaret's
phone. Joining is a short code read aloud (Robert) with a texted link that only prefills
it (Priya); nobody wants a QR. Rules scoped by household come before real family photos.
The AI key leaves the phone — it is the one thing that blocks Priya setting up her father
from another city. Appointments ride on the helper phone and come right after it, as
Tanya decided.

## The sequence

**Stage 0 — this week, on top of build `20260914l` (1 day).** *This phone is used by* under
the gear; the role lives in per-phone prefs, one household still. Under *Margaret* the
hamburger and *Remove* disappear; under *Someone helping* the note field and a *by …*
line appear. This is the UX board's stage 1 and the 09-05 helper-phone design. Nothing
in the data changes, so nothing can break for Ravi's phone. **Then appointments** as Tanya
sequenced: today-only line on her board, the list on the helper phone, no reminders.

**Stage 1 — the ground (4 days, two agents in parallel).** Agent A: `households/{hid}` with
an inline members map, `users/{uid}`, `where('household', …)` on every query plus the
two composite indexes, the Firestore rules by household and role, and the one-shot
migration that rewrites `HOUSEHOLD='default'` to a real household for Ravi's data.
Agent B: the AI-key proxy — a callable Cloud Function with the key in Secret Manager,
called with the Firebase ID token, ~$1/month plus ~$6 for a warm instance; a
`proxy.js` provider so the app never talks to Anthropic directly (which also sidesteps the
VPN "Load failed" trap in LESSONS). Strictly before stage 2. The rules deploy last, after
Ravi's phone runs the migrated build and names a photo through the proxy. Test: the Rules
emulator proves a `person` cannot delete and a non-member cannot read; the rig's stub
grows two-field `where`, `getDoc`, a permission table and a fake `httpsCallable`.

**Stage 2 — the household (4 days, two agents).** Agent A: `joinHousehold` callable (the
client never writes `members`), single-use 24-hour code, the *Household* screen with the
code on the helper phone, *Join a household* on a new phone, the `?join=` link that
prefills; Priya's one-card status (*3 photos today, last at 3:10 pm · Phone opened at
4:02 pm* / *Nothing logged today* / *Phone not opened since Tuesday*) pinned as her Home,
read-only at first. Agent B: `coverSnapId` on items and the role guard on the snap prune.
Test: two "phones" over one store in the rig, a save on A landing on B; the 71-check
audit per role. Priya's card, the code and the rules ship as one build — each is useless
without the others (Devin).

**Stage 3 — roles in the UI and recovery (5 days, two agents).** Agent A: the role comes
from `members`, not prefs; helper screens hidden for `person`; the *by Robert · this
morning* line and the note field on helper phones; the appointments editor on helper
phones. Agent B: Google sign-in for helpers only, via `linkWithCredential` on the
anonymous identity, framed on screen as household recovery (*Set up another phone* with
the read-aloud script). Margaret's phone stays anonymous forever.

**Stage 4 — only if triggered.** Photos to Firebase Storage at ~150 items (Sam dissents:
now). The professional role and member removal: not before a second family is testing.

Nineteen days of work in total, thirteen before Priya's phone is real.

## How the agents run

Each stage is two agents in the background with a fixed interface between them, written
before they start (stage 1: the rules file and the household doc shape; stage 2: the
`joinHousehold` signature). Each agent's brief includes the board file it descends from,
the audit script, and the rule that nothing is handed over without the rig's checks
passing for every role. The boards reconvene at the end of each stage on the screenshots,
not on the plan.

## Splits for Ravi / Tanya

1. **Tell Margaret once, or never.** Margaret and Linda want one sentence in Settings —
   *Priya can see your things*; Harold and Elena say her phone must never name another
   person. Devin sides with never; Maya with once. **Recommendation: never, until a second
   family asks.**
2. **Priya's logging rights on day one.** Priya wants to log remotely from the start; Dr
   Kim wants remote logging held until Margaret's own logging rate is measured. Robert
   does not care. **Recommendation: read-only card first; decide from the export.**
3. **Sign-in timing.** Maya and Sam wanted real accounts for helpers by stage 2; Devin and
   Priyanka won stage 3 on iOS redirect-flow risk and on the rules being what actually
   protects the photos. **Recommendation: stage 3.**
4. **The hamburger on Margaret's phone.** The UX board removes it under the Margaret role
   — which partly reverses this morning's ruling. Nothing in it was hers. **Recommendation:
   remove under her role, keep for helpers — but it is your ruling to reverse.**
5. **The AI proxy now (Priyanka) or later (Sam).** Priyanka's argument carried the tech
   board: remote setup is impossible while the key is per device, and the proxy also
   removes the VPN failure. **Recommendation: stage 1.**
6. **Photos to Storage now (Sam) or at 150 items (Priyanka).** **Recommendation: 150.**

## Addendum — private items (Ravi, 2026-09-14, must-have for stage 1)

**The question:** Margaret must be able to keep a thing from everyone, or from Priya only.
Inclusion list (say who may see each thing) or exclusion list (everything is shared unless
she says otherwise)?

**Customer board.** Margaret: "Some things are mine — my pills, my diary. I don't want to
be asked about every single thing." Harold: if she can hide a thing, one day she will hide
her keys and then not find them — so *private* must still show on her own phone; it only
hides from others. Robert: he needs the keys and the glasses shared without ceremony;
one switch on the rare thing is fine. Priya: she would rather see less — "I don't want her
bedside" — and she should not have to be excluded item by item; a role-level default (what
family sees) beats a per-item list. Elena (professional): dignity is the default; a
withheld item should leave no trace on anyone else's phone, not a greyed tile.

**UX board.** Devin: exclusion, without argument — an inclusion list is a permissions
form, and Margaret's card asks one question, not four. One switch on the thing, the
strongest kind: *Private — only this phone shows it*, in Edit and in the press-and-hold
sheet, with a lock on the tile on her phone only. Per-person exclusion ("not Priya") is
not hers: it is a role default (Priya's *family* role sees the board or does not) plus a
helper-side exception on Robert's phone in stage 3. Maya: agrees on exclusion; wants a
quiet *Just for me* link at log time too, one tap, no question — Devin: after the first
user test, if the export shows private being set at all.

**Tech board.** A field now, a rule later: `visibility: 'household' | 'private'` and
`owner` (this phone's id until real users; the uid from stage 3). Stage 1 rules: an item is
readable by a member if `visibility == 'household'` or `owner == request.auth.uid` —
private things never leave the server for another phone. Snaps inherit the item's
visibility through the rule (`get()` on the parent). Priya's card counts exclude them.
Migration: every existing item is `household`.

**Built now (build m, audit 74/74):** the field on new items; *Private — only this phone
shows it* toggle in Edit and *Make private / Share with the household* in both sheets; a
lock badge on the tile and a *Private* line on the card; another phone's private things
are filtered out on this phone. Enforcement by rules is stage 1, item 1.

**Ruling asked of Ravi/Tanya:** exclusion model (all three boards) — confirm. Per-person
("not Priya"): role default in stage 2, helper-side exception in stage 3 — or per-item
person picker now (no board member wants it).
