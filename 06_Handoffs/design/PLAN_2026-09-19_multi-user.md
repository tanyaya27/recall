# Multi-user, the plan (2026-09-19) — one owner per thing, people she invites

Supersedes `PLAN_2026-09-14_multi-user.md` entirely. Premise: `BOARD_2026-09-19_multi-user_reset.md`
(§1 who Margaret is, §10 the Drive model). Three boards reviewed that premise without
re-arguing it — `TECH_BOARD_2026-09-19.md`, `UX_BOARD_2026-09-19.md`,
`PERSONA_BOARD_2026-09-19.md` — and the screens are drawn from the real stylesheet:
`mockups/MU1_a_people.png`, `MU1_b_peter.png` (Phase 1), `MU2_a_card.png`, `MU2_b_roles.png`
(Phase 2). This file reconciles them into one sequence and lists the calls for Ravi.

## Where the three boards agree

A ReCall is "every thing whose owner is me" — no household, no ReCall document. Every thing
has one owner; a person can hold *Can see* or *Can help* on a thing directly, or on all of
another person's things through one grant; *Only me* means no roles at all and the rules
refuse a private thing that still has roles, so it cannot leak. Editors log, photograph,
move, rename and tidy; only the owner removes, shares, un-shares or gives. Peter signs in
with Apple or Google to hold a role; Margaret stays anonymous until her first share or
second device, then upgrades in place with everything kept. Her screen does not change until
she invites someone; then it gains one row, *People*, and one card row, *Shared with*. Words
on screen: *People*, *Can see*, *Can help*, *Only me*, *Margaret's ReCall*; never owner,
editor, viewer, patient, caregiver. Invites, grants, transfer and the AI key go through
Cloud Functions; everything else is a direct write under rules that the rig re-implements as
a permission table and audits per role.

## The sequence

**Phase 1 — model, rules, identity (7 days).** Nothing visible. Every doc gets `owner`,
items get `private` (required boolean), `roles`, `sharedWith`, `by`; `recall_grants`,
`recall_invites`, `recall_users`, `recall_secrets` appear; three composite indexes. Rules as
sketched by the tech board (snaps borrow their item's access via `get`; editors limited to a
field allow-list; transfer impossible from a client). Anonymous → Apple/Google in place; the
*Sign in to share* sheet (MU1·8). The AI key moves behind a callable billed to the thing's
owner. Migration of Ravi's data by one admin script after his phone upgrades, then the rules
flip. Rig: stub gains `getDoc`, `runTransaction`, `array-contains`, a permission table, a
fake `httpsCallable`, and two "phones" over one store; the audit's existing 92 checks pass
as the owner, then as an anonymous single-phone user.

**Phase 2 — People, the invite, guest views (6 days).** MU1·1–7 and MU2·4, 5, 7, 8. The
People row and screen; the invite sheet → `createInvite` → system share sheet; the join page
→ `acceptInvite` (transaction, single-use, 7 days); Peter's grid titled *Margaret's ReCall*
with footer by role; *Log item · in Margaret's ReCall* on the button for a helper; the owner
tag on tiles; remove / leave / expired-link copy; *Show who added each photo*. Audit: an
8-action × 6-role matrix (owner, direct viewer, direct editor, grant viewer, grant editor,
stranger) plus invite, revoke, leave, expired.

**Phase 3 — Shared with, Only me, Give (3.5 days).** MU2·1–3, 6. The card row and sheet;
per-thing roles; *Only me* with its confirm; `transfer` callable (item + snaps move, old
owner → *Can help*). `claimAnonymous` for the second-device trap.

**Phase 4 — status line (1.5 days).** *Let my people see when I last used the app* in
People, off; the one line under Peter's title; the suggestion after a *Can see* invite.

Eighteen days. Each phase: the mockups above are the design; the rulings below close the
splits; then build, rig audit per role, screenshots, phone.

## Splits — one list, all three boards, with recommendations

1. **The role words.** UX: *Can look / Can help*. Personas (Margaret, Linda): *look* means
   being watched — *Can see*. **Rec: Can see / Can help** (drawn that way).
2. **People's place in the hamburger.** Maya second, Devin last. **Rec: second.**
3. **Preselected role in the invite sheet.** **Rec: none; *Send a link…* disabled until one
   is tapped** (Devin, Dr Kim).
4. ***Show who added each photo* default.** UX and Margaret: off. Dr Kim and Robert: on —
   authorship drift is the one thing the owner should see. **Rec: on** (Dr Kim's argument is
   the stronger one; it is her list, and *Today 5:52 PM · Robert* costs nothing).
5. **Can a helper delete an obvious duplicate?** Robert yes; Margaret, Dr Kim, Peter no.
   **Rec: no.** Helpers tidy photos (soft-delete with her Undo), never things.
6. **Remote setup.** Peter wants to start the invite for her; Dr Kim and Margaret: every tap
   on her phone. **Rec: every tap hers; Peter narrates.** Revisit with a second family.
7. **Two ReCalls in one house.** Robert will live in hers; Peter, Dr Kim, Linda want two
   with the *in Margaret's ReCall* guard. **Rec: two, guard on the Log button** (MU2·7);
   no merged view until asked.
8. **Give vs Move.** Margaret likes *Give*; Robert wants *Move*. **Rec: Give** (it is a
   decision, not a file operation).
9. **Status switch placement.** **Rec: in People, last, and suggested once after a *Can see*
   invite** — both, as Margaret said.
10. **Billing.** Peter must be able to pay while she owns. **Rec: out of scope for this plan;
    the AI key is per owner (tech split 7) and Peter can enter his key on her phone at setup.
    Payment confers no role** (Dr Kim's condition).
11. **Tech splits 1–7** — accept the tech board's recommendations as written (roles map +
    array; `get(item)` for snaps; transfer as a callable; grants created by callable,
    changed by the grantor; migration by script; the *Sign in* choice first, `claimAnonymous`
    in Phase 3; AI key per owner).

## Rulings for Ravi

1. *Can see / Can help* — the words?
2. *Show who added each photo* on by default (split 4)?
3. Two ReCalls with the guard on the Log button (split 7)?
4. *Give* (split 8)?
5. Phase order as above — identity and rules first, with nothing visible for a week?
6. Anything on the sixteen screens you want changed before Phase 1 code starts?

## Must-never (Dr Kim, adopted)

No caregiver/patient words anywhere. No alarm state on the status line. No helper-side
*Only me* or delete of a thing. Sign-in never gates her own use of her own things. A
whole-ReCall transfer only from her own phone, and only after a second family exists.
