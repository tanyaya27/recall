# Multi-user, reset: Margaret owns her ReCall, and invites her circle

Ravi, 2026-09-19: *the current proposal treats the main user as a person with no control
over her life — so dependent that others must be her proxy. The board saying Robert and
Priya should not show up on Margaret's app is shocking; it implies she is not legally in
charge of her own decisions. That is not who we are designing for. A person like that would
be in assisted care with staff around her, and the app would not be useful. Our Margaret is
in charge of her faculties and sees the app as a bridge over memory gaps. Robert or her son
may be the one who brings her the app. Reset the board's understanding and come back.*

He is right, and the 09-14 boards got it wrong in the foundation, not the details. This note
resets the premise, answers his four questions, and gives one recommendation. Nothing in
`PLAN_2026-09-14_multi-user.md` survives except the plumbing (households, rules, the AI-key
proxy) — and even that is re-scoped by who owns what.

---

## 1. Who we are building for — the reset

**Margaret is a competent adult with a memory problem, not a patient under supervision.**
She decides what goes in the app, who sees it, and when that changes. Early-stage memory
loss is precisely the stage where a person is still running her own life and wants tools
that keep it that way. The moment she cannot run her own phone, this app stops being the
right tool and her care circle uses something else. So the app's model of her must be the
model of an owner.

That changes what "helpers" are. Robert and Priya are not proxies who act on her behalf
while she is kept unaware; they are people **she has invited into her ReCall**, at a level
she chose, and she can see who they are and what they can do. Their names belong on her
screen, in the place where she manages her circle, exactly as a Google Photos shared album
shows you who you shared it with.

**The customer and the user can differ, and the model must hold either way.** Three routes
into the app, all real:

- Margaret finds it herself: she is customer, owner and user. Her circle comes later, if ever.
- Robert (spouse) brings it to her, sets it up on her phone, and helps her use it. He is the
  customer; she is still the owner. He is her first invitee — and very often they share the
  same home, so most of what they log is common ground.
- Her son (Priya's role, from a distance) brings it, sets it up remotely, checks in. He is
  the customer; she is the owner; he is an invitee with less to do day to day.

In every route the data is Margaret's and the invitations are hers to give and to take
away. The person who paid does not own her memory. That is both the ethical line and, as far
as a non-lawyer can tell, the legal one — §2.

## 2. How the legality of a multi-user system works (not legal advice)

I am not a lawyer; Tanya should have a real one look at this before any second family is on
the app. But the shape is well understood, and it rests on three things:

**Consent by the account owner.** Sharing personal data (photos of the inside of her home,
her routines, her medications) with another person is lawful when the owner agrees to it,
knowingly, and can withdraw. In consumer apps this is the "invite" — the owner adds someone,
sees them listed, can remove them. The app records who invited whom and when. This is how
shared albums, family calendars and location sharing (Find My) all work, and it is the model
we should copy: **owner-granted access, revocable, visible.**

**Capacity.** The law presumes an adult has capacity to make her own decisions until a
court or clinical process says otherwise. Early-stage memory loss does not remove it. So
Margaret can consent to sharing, full stop. If a day comes when she cannot, the relevant
instrument is a power of attorney or guardianship — a legal event outside the app — and the
app's job is only to make it possible to *transfer ownership* to the person who holds it,
with a record of the transfer. We do not need to build that now; we need a data model in
which ownership is a field, not an assumption (§4).

**Sensitive data.** Some of what the app could hold is health-adjacent — medication routines,
appointments, a diagnosis implied by the app's very purpose. In the US, an app used by a
person for herself is generally not covered by HIPAA (that applies to providers, insurers
and their contractors), but state privacy laws and app-store rules still apply, and the
moment a *professional* carer or an agency is on the account the picture changes. Which is
why the professional role should stay out of scope until there is a second family and a
lawyer. Practically: clear language at the invite ("Robert will be able to see every photo
you log and where things are"), a way to remove him, and no data sold or used for anything
but the app.

So the answer to your first question: it works like every consumer sharing feature — the
owner grants, the app records, the owner can revoke — and nothing about early-stage memory
loss changes that.

## 3. Slack / Docs / Zoom, or owner-grants-access?

**Owner-grants-access.** Slack and Docs are peer collaboration: everyone is an equal member
of a workspace that belongs to an organisation, and the document is the shared object.
ReCall is different in one decisive way: the shared object is *one person's memory of her
own home*. There is exactly one owner per ReCall, and it is the person whose things they
are. Everyone else is a guest at a level she set.

The nearest existing models, in order of closeness:

- **Google Photos shared album / Apple Shared Album** — one owner, invitees who can view
  and (if allowed) add; the owner sees the list of people; anyone can leave; the owner can
  remove. Closest to what we want for the core.
- **Apple Family Sharing / Find My** — an organiser, members who share by choice, and
  location sharing that each person turns on for specific people. Closest to what we want
  for *private* and for the status card ("did anything happen today").
- **Slack / Docs** — wrong model: nobody owns the workspace, everyone is symmetric.

There is one wrinkle Ravi's third route raises: **two people in the same home who both
lose things.** Robert may want his own ReCall too. That is two owners, two ReCalls, and the
things in the shared kitchen appear in both — which is exactly what happens when two people
share albums with each other. The model handles it without a "household" object at all: a
ReCall belongs to a person; a person can be a guest in another person's ReCall; a place
name is just a string in each. If the two ReCalls ever need to know they are the same
kitchen, that is the place hierarchy's `parent` doing cross-ReCall work — later.

## 4. The model: one owner, invited guests, per-thing sharing

Four concepts, all visible to Margaret:

**Owner.** The person whose ReCall it is. One per ReCall. She sees everything, can change
anything, invites and removes guests, and can hand the ReCall to someone else (the capacity
case — a deliberate, confirmed act, recorded).

**Guest.** A person the owner invited. Every guest has the same two facts on the owner's
screen: who they are (name, and how they were invited) and **what they can do**, which is
one of two levels the owner picks and can change:

- *Can see* — sees the shared things and where they are; can search; can use the status
  card. Cannot change anything. (Priya from another city, at first.)
- *Can help* — everything above, plus: log things, add photos, move things, edit names and
  places, manage places. (Robert in the same house.)

Nothing a guest does is hidden from Margaret: a thing Robert logged shows *added by Robert*
on its card if she wants to see it, and the event log records it. Neither level lets a
guest remove Margaret's things permanently, invite others, or change her privacy — those
stay with the owner.

**Shared / private, per thing — Margaret's switch, already built.** *Keep this private*
means "only I see this, on any of my devices". Everything else is visible to her guests at
their level. This is the inclusion model Ravi ruled on 09-14, restated with the right
subject: it is not "hidden from the household", it is "not shared with my guests". The
default is shared, because the point of inviting Robert is that he can help find things; a
person who wants a private-by-default ReCall simply invites nobody.

**Guest's own things.** A *can help* guest logging in Margaret's ReCall is adding to *her*
memory, not his. If Robert wants his own, he starts his own ReCall and invites her. The app
must make that difference plain at the moment he logs: the title bar says whose ReCall he
is in.

**What Margaret sees, then.** Her home screen is unchanged. One new row in the hamburger:
**People** — a list of who is in her ReCall, their level, *Invite someone…*, and on each
person *Change what they can do* / *Remove*. When someone else has logged a thing, its card
can show *added by Robert* under the title band (a switch like the others: *Show who added
what*, off by default so her screen stays hers). That is the whole of the owner's UI. It is
the opposite of the 09-14 plan: her guests are named on her phone because it is her phone
and they are her guests.

**What a guest sees.** The same app, with the title *Margaret's ReCall* where the day line
is (so Robert never confuses it with his own), the two verbs, the grid, the cards, minus
the controls his level does not include. A *can see* guest has no *Log item* — the footer
is *Find item* alone plus the status card. A *can help* guest has everything but People
and Remove.

**Status card ("did anything happen today").** Built for the guest, but it is *about*
Margaret, so she decides whether it exists: a switch in People — *Let my people see when I
last used the app* — off by default. When on, a guest's home carries one line: *3 things
logged today, last at 3:10 pm · app opened at 4:02 pm*. This is the Find My model: she
turns her location on for named people.

## 5. Identity, devices and the practical plumbing

- **Private is per person across devices** (settled 09-16). So a person needs an identity
  that spans devices: a sign-in. Margaret signs in once, on each device, with the least
  ceremony we can manage (Apple/Google sign-in; passkey later). Anonymous auth stays only
  for a ReCall with one device and no guests — the day-one case — and upgrades in place
  when she adds a second device or her first guest, so nothing she has logged is lost.
- **Inviting** is a link she sends (Messages, WhatsApp) that carries a code; the guest
  opens it, signs in, and appears in her People list at the level she chose. The link
  expires; she can revoke it. No QR, no typed codes on the phone — the link *is* the code.
- **Rules** enforce the model server-side: a ReCall doc has an owner and a members map
  `{uid: 'see' | 'help'}`; every item, snap and place carries the ReCall id; reads require
  membership, writes require *help*, private items require being the owner, People and
  ownership changes require being the owner. This replaces the 09-14 "household" with
  something narrower and clearer.
- **AI key**: leaves the phone, behind a callable function billed to the ReCall's owner —
  unchanged from the tech board, and still the thing that makes remote setup possible.
- **Native wrapper**: needed for remote install (TestFlight) and for the camera permission
  problem; belongs in the same stage as sign-in because both are "the app becomes an app".

## 6. What this reverses from 09-14

| 09-14 plan | Now |
|---|---|
| "Patient" is a slot on a phone; Margaret never signs in | Margaret is the **owner**; she signs in once per device |
| Her phone never names another person | Her phone has **People**: who is in, what they can do |
| Roles: person / helper / professional | **Owner**, guests at *can see* / *can help*; professional deferred |
| Hamburger removed under her role | Her hamburger gains **People**; nothing removed |
| Household = the unit of sharing | **One person's ReCall** is the unit; a person can be a guest in another's |
| Private = "only this phone" → "hidden from household" | Private = **not shared with my guests**, on all my devices |
| Priya's card as her Home, on by default | Status line, **owner opts in**, per guest level |
| Tell Margaret once vs never | **Always**: it is her list |

## 7. Where the reset board splits

The build board re-read §1 and re-argued; the persona board now has the three customers of
§1 in the room (Margaret as owner; Robert as spouse-customer; Arjun, her son, as remote
customer) instead of "patient and helpers".

1. **Sign-in for Margaret at all.** Devin: a sign-in screen is the first thing that could
   make her give up; keep anonymous auth until she invites someone, then upgrade. Sam: an
   anonymous identity that later upgrades is a known Firebase path (`linkWithCredential`)
   and the audit can cover it. Margaret: "if Robert sets it up for me, I don't care; if I
   set it up, don't ask me to make a password." **Recommendation: anonymous until the first
   second device or first guest, then an in-place upgrade with Apple/Google sign-in.**
2. **Can a *can help* guest make a thing private?** Robert: he logs her pills; she may want
   that private. Maya: only the owner should decide what is hidden from other guests, else
   one guest hides things from another. **Recommendation: owner only, for now**; a guest can
   ask her to.
3. **Should the owner be able to make a guest's photo private from that guest?** Arjun: no —
   Robert saw it when he took it. **Unanimous: private applies to future visibility only;
   the app says so.**
4. **Status line default.** Arjun wants it on by default (it is why he installed the app).
   Margaret and Devin: off, she turns it on for him when he asks. **Recommendation: off; the
   invite flow for a *can see* guest suggests turning it on, in her words.**
5. **Two owners in one home.** Robert: he loses things too. Priyanka: two ReCalls with
   cross-guesting works today with no new object; a merged "our home" view is a later
   feature. **Recommendation: two ReCalls, cross-invited; revisit after a second family.**
6. **Ownership transfer.** Maya wants it in the first release so the capacity case is never
   an emergency; Devin wants it after a second family. **Recommendation: the *field* now
   (owner on the ReCall doc, rules keyed to it), the *screen* later.**

## 8. Sequence (replaces the 09-14 stages)

1. **Model and rules** (no visible change): ReCall doc with owner + members; every doc
   carries the ReCall id; migration of Ravi's data to a ReCall he owns; rules by owner /
   level; the rig's stub learns `getDoc`, two-field `where`, and a permission table.
2. **Identity**: in-place upgrade to Apple/Google sign-in; the AI-key function; the native
   wrapper (TestFlight) — the three things that make a second device and a remote guest
   possible.
3. **People**: the invite link, the People screen (levels, remove), guest views (*Margaret's
   ReCall* title, footer by level, *added by* switch), private = owner-only, status line
   opt-in.
4. Later, with a second family: ownership transfer screen, professional role, two-owner
   home view.

Each stage: rendered screens first (People, the invite, the guest's Home), Ravi's rulings,
then build, rig audit per level, screenshots, then the phone.

## 9. Rulings before any screens

1. Owner + two guest levels (*can see* / *can help*), as §4? Or a third level?
2. Sign-in: anonymous until the first guest or second device, then upgrade (split 1)?
3. Private: owner only (split 2)?
4. Status line: opt-in by the owner (split 4)?
5. Two ReCalls for two owners in one home, cross-invited (split 5)?
6. The words: *ReCall* for one person's collection? *People* for the screen? *Can see* /
   *Can help* for the levels? *Guest* is my word — is there a better one for Robert?

---

## 10. Ravi's two cases (09-19): one model, the Drive model

Ravi: *Margaret invites Peter, her son. Robert makes his own ReCall and shares one item with
Margaret as an editor, maybe transfers it — that feels like a Google Doc. Which model
applies, or both?*

**Both, and they are the same model once the unit of ownership is the thing.** The §4 note
put ownership on the whole ReCall; that fits case 1 and breaks on case 2. Google Drive gets
this right and is the pattern to copy:

- **Every thing has one owner** (the person whose ReCall it was logged into). Like a file.
- **A thing can be shared with a person at a role**: *viewer* · *editor* · and ownership can
  be **transferred** (one owner at a time, the old owner becomes an editor). Like a file.
- **A whole ReCall can be shared with a person at a role** — which means "every thing I own,
  now and in future, at this role". Like sharing a folder. That is case 1: Margaret shares
  her ReCall with Peter as viewer or editor. It is a rule, not a copy: things she adds later
  are covered; things she marks private are excluded.
- **Per-thing sharing is the exception path** — case 2: Robert shares *the good scissors*
  with Margaret as editor, or transfers them because they are really hers.

So Peter and Robert are the same kind of person to the system: someone who holds roles on
things. Peter holds one role on all of Margaret's things via the ReCall-level grant; Robert
holds a role on one of hers, and she on one of his. No "guest" concept is needed; the word
goes. What a person sees is simply **every thing they own or hold a role on**, in one grid,
each marked with whose it is when it is not theirs.

**The three roles, precisely** (same names as Drive, which people already know):

| | viewer | editor | owner |
|---|---|---|---|
| see the thing, its photos, where it is, search for it | ✓ | ✓ | ✓ |
| log a sighting (add photo, mark it moved, edit the place) | | ✓ | ✓ |
| rename, fix the context line | | ✓ | ✓ |
| remove old photos (tidy) | | ✓ | ✓ |
| remove the thing | | | ✓ |
| share / unshare / change someone's role | | | ✓ |
| keep it private (= unshare from everyone) | | | ✓ |
| transfer ownership | | | ✓ |

Editors cannot delete or change who sees a thing — that is the line that keeps a helper from
acting as her proxy without her.

**What this does to the screens** — three touches, no new concept for Margaret beyond
"shared with":

1. **People** (hamburger): the people she has shared her whole ReCall with, and their role.
   *Invite someone…* → pick viewer/editor → send the link. This is case 1, and it is what
   most owners will ever use.
2. **On a thing card**, the *Keep this private* switch becomes a row **Shared with · Peter,
   Robert** (or *Only me*) that opens a sheet: the ReCall-level people, each with their role
   inherited (greyed, "via your ReCall"), *Add a person…* for a one-off share (case 2), a
   per-person role, and *Transfer to…* at the bottom. *Only me* is the private state — same
   meaning as today, now with names.
3. **In the grid**, a thing someone else owns shows a small *Robert's* tag under the name
   (colour-blind safe: words, not colour). Her own things are untagged, so her screen is
   unchanged until someone shares with her.

**Transfer** moves the thing and all its sightings into Margaret's ReCall; Robert keeps an
editor role by default so nothing he could do yesterday stops working today. Places are
per ReCall and stay strings, so "Kitchen counter" simply comes along as text; the place
hierarchy can reconcile the two kitchens later.

**Where the board still splits on this:**

1. **Is per-thing sharing worth building before a second family?** Devin: case 2 is real
   but rare; ship People (folder-level) first and add the per-thing sheet when someone
   asks. Maya: the model must be per-thing from day one or the rules and data are wrong
   later — but the *sheet* can wait. **Recommendation: model per-thing now (owner + roles
   map on every item, ReCall-level grants as a rule the rules engine expands); build People
   first; the per-thing sheet and Transfer in the next stage.**
2. **Can an editor make a thing private?** Now unambiguous: no — private is "shared with no
   one", and sharing is the owner's. (Closes split 2 of §7.)
3. **Should a ReCall-level editor see things she owns that she then shares one-off with
   someone else?** Yes; roles add, they never subtract. Only *Only me* removes.

**Rulings replaced:** §9 items 1–3 become: (1) viewer / editor / owner per thing, with a
ReCall-level grant as the common case — agreed? (2) People first, per-thing sheet and
Transfer next stage? (3) *Shared with · names* replaces *Keep this private* on the card?
Items 4–6 stand.
