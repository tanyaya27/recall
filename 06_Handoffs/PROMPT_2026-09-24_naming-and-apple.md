# Next session (separate from the app work): the name, and the Apple Developer sign-up (written 2026-09-24)

Runs from any machine. Before starting on a different machine, get the latest repo:
`git clone https://github.com/tanyaya27/recall` (or `git pull` in an existing copy), then connect
that folder to the Cowork session. This session **does not change app code**. MVP work continues in
its own session.

Paste everything below the line as the first message of the new session.

---

We're continuing ReCall (Tanya's project). The repo is in my connected folder `ReCall` (nothing is built in
this session, so a fresh clone needs no `npm install`). Before anything else, read
`CLAUDE.md`, `02_Strategy/PRODUCT_BOARD.md`, the top two sections of `06_Handoffs/OPEN_ITEMS.md`,
`06_Handoffs/DECISIONS.md` (the 2026-09-24 entries), the latest file in `06_Handoffs/sessions/`,
`06_Handoffs/NAMING_2026-09-24_findings.md`, `06_Handoffs/design/PLAN_2026-09-24_generic-mvp.md`,
`03_Design/ReCall_Identity_Design_Prompt.md` and `04_Engineering/firebase/README.md`.

**Context in one paragraph.** On 09-24 Tanya ruled that ReCall is a *general memory app for anyone*,
not only people with memory loss (DECISIONS 09-24). MVP step 1 is built (`20260924b`: AI through
ReCall's server, no key, no setup card). The native iPhone app (step 4) and Sign in with Apple need
an **Apple Developer Program** membership. A quick check (`NAMING_2026-09-24_findings.md`) found that
"ReCall" is almost certainly taken as an App Store name, crowded (Microsoft's Windows Recall,
recall.it, Recall.ai) and has pending "RECALL" software trademarks. This session does two jobs, in
this order.

## Job 1: the name

1. **Convene the boards** as usual (build board: Maya, Devin, Priyanka, Sam; persona board: Margaret,
   Robert, Peter, Dr Kim, Harold, plus the 09-24 scenario people Dan, Leila, June, Evelyn and Nisha),
   with **Noor Haddad** (the graphic designer from `design/BOARD_2026-09-23_home-screen.md`) owning the
   sound, look and feel of the name. Show me the disagreements, not a consensus.
2. **Criteria to agree first**, then generate against them:
   - distinctive, not descriptive (so it can be protected)
   - easy to say and spell after hearing it once
   - no illness, memory-loss, surveillance or "AI" connotations (the identity brief's rules)
   - works for a tradesperson's garage *and* a grandmother's glasses
   - a home-screen name of **≤ 11 characters**, so it isn't cut off under the icon
   - a store name of ≤ 30 characters
   - pleasant in English, and not rude or awkward in Spanish or Hindi (our likely next languages)
3. **15–20 candidates** across several strategies: invented words, real words used in a new way,
   compounds, and names that keep the "Re-" idea. Include one or two that keep **ReCall** as the
   home-screen name with a distinct store name (e.g. *ReCall: Where I Put It*), so that path is
   judged fairly too.
4. **Check every candidate** and record each result with its source link:
   - **App Store**: search apps.apple.com (web search / fetch) for exact and near names.
   - **US trademarks**: USPTO search (tmsearch.uspto.gov; use the browser if a fetch can't render
     it) and the Justia mirror (trademarks.justia.com), classes **9 and 42** at least, live marks only.
   - **Domains**: .com and .app (and one fallback, e.g. get<name>.com): available, parked or in use.
   - **Google Play and a web search** for the same name in a memory, notes or home-organising product.
5. **Shortlist 3–5** in one table: name · why · App Store · trademark · domains · the boards' for and
   against · risk (low/med/high). Then ask **Tanya and Ravi to pick**. This is their call.
6. **Do not** buy a domain, file a trademark, or reserve anything that costs money without asking.
   Say plainly that an attorney's clearance search is needed before committing, and what it
   typically covers.

## Job 2: the Apple Developer Program

**First, a decision for Tanya and Ravi, before any form: who enrolls?** It decides whose name
shows as the **seller** on the App Store, who signs Apple's agreements, and what paperwork is needed.
Lay out the options with their consequences. Use Apple's current page
(https://developer.apple.com/programs/enroll/) and re-check it; don't rely on this summary:

- **Individual**: the person must have reached the legal age of majority where they live, use
  their legal name, and have an Apple Account with two-factor authentication. Their legal name is
  the seller shown on the App Store.
- **Organization** (e.g. an LLC): the enroller must have legal authority to bind it. It needs a
  legal entity name (not a DBA), a **D-U-N-S number** (free from Dun & Bradstreet, but it can take
  days), a work email on the organization's domain, and a **functional public website on that
  domain**. The organization's name is the seller.
- The fee is **$99 USD per year** (per Apple's page, 09-24).
- Things to raise, not decide: whose project ReCall is (Tanya's, per CLAUDE.md) versus who can
  legally enroll; whether an organization should own it; that apps can later be transferred between
  developer accounts (check Apple's current rules before relying on this).

**Then guide the sign-up step by step**, in my browser if I want (read the `chrome-browser` skill
first). **I enter the payment details and accept the legal agreements myself**; Claude never does.
Explain each screen in one line.

**After approval** (it may take days; if so, write the remaining steps into OPEN_ITEMS and stop):
1. Record the **Team ID** in `06_Handoffs/APPLE.md`: identifiers only, never a private key, password
   or `.p8` file. Keys stay out of the repo (it's public).
2. **Reserve the app name** in App Store Connect with the chosen name. This is the definitive
   availability test. Bundle ID pattern to propose: `com.<seller>.<appname>`. Confirm with me first.
3. **Sign in with Apple for Firebase**, following step 2 of `04_Engineering/firebase/README.md`
   (Services ID, Team ID, Key ID, private key into the Firebase console on account
   **tangadi.biz@gmail.com**, project `recall-d9886`). Leave `APPLE_SIGNIN` in `People.jsx` false;
   turning it on is an app change for the MVP session.
4. Note what the native-app step (MVP step 4: Capacitor → TestFlight) now needs and is unblocked.

## House rules (same as always)

- Every deliverable goes to my folder **and** as a file card in the chat.
- Keep `06_Handoffs/OPEN_ITEMS.md` current, including what's waiting on Apple or on us.
- Record decisions in `06_Handoffs/DECISIONS.md` (who objected to what).
- Wrap-up per `CLAUDE.md`: a session log in `06_Handoffs/sessions/`, lessons promoted.
- Git commands on the Mac start with `find .git -name "*.lock" -delete`. Commit from the Mac, not the
  sandbox. Tell me the commands; don't run git from the sandbox.
- **No app code changes in this session.** If the chosen name should replace "ReCall" in the app,
  write the list of places it appears into OPEN_ITEMS for the MVP session.
