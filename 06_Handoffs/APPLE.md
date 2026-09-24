# Apple Developer Program: who enrolls, how, and what we record here

**Status 2026-09-24: waiting on Tanya and Ravi to decide who enrolls (§1). Nothing has been submitted or paid.**
This file will also hold ReCall's Apple **identifiers**: Team ID, bundle ID, Services ID, Key ID. It
never holds a private key, a `.p8` file, a password or a verification code. **The repo is public.**

Sources, re-checked 2026-09-24: [Enroll](https://developer.apple.com/programs/enroll/) ·
[Enrollment help](https://developer.apple.com/help/account/membership/program-enrollment/) ·
[D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/) ·
[App transfer overview](https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer) ·
[App transfer criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria)

---

## 1. The decision first: who enrolls?

It decides **whose name is the seller** on the App Store, who signs Apple's agreements, and what
paperwork is needed. The fee is **$99 USD a year** in every case.

### What Apple requires (their words, 09-24)

- **Everyone:** an Apple Account with two-factor authentication, and being "the legal age of majority
  in your region" (18 in Washington).
- **Minors:** "If you're under the age of majority in your region, your parent/guardian can enroll with
  their Apple Account and share their account with you."
- **Individual:** your legal first and last name ("an alias, nickname, or company name… will cause a
  delay"); an address that isn't a P.O. box. "Your name will be displayed as the seller name of your apps."
- **Organization:** a legal entity ("We do not accept DBAs, fictitious business names, trade names, or
  branches"); a **D-U-N-S number** (free, allow up to 5 business days from D&B, plus up to 2 for Apple
  to receive it); a **work email on the organization's domain**; a **public, working website on that
  domain** ("websites that contain minimal content or display a message from a domain registrar won't be
  accepted"); and an enroller with **legal authority to bind** the organization (owner/founder,
  executive, or someone given that authority). Apple may phone to verify and may ask for notarized
  business documents. The organization's name is the seller.

### The options

| | A. Ravi, as an individual | B. Tanya, as an individual | C. Nova Camino Ventures LLC | D. A new entity just for the app |
|---|---|---|---|---|
| **Seller on the App Store** | Ravi's legal name | Tanya's legal name | "Nova Camino Ventures LLC" | the new entity's legal name (could match the app's new name) |
| **Who signs Apple's agreements** | Ravi | Tanya | Ravi, as the LLC's owner | whoever the entity authorizes |
| **Paperwork** | none beyond ID | none beyond ID | D-U-N-S (look up first; it may already exist), a work email on the LLC's domain, a working LLC website | form the entity, then everything in C |
| **Time to approval** | often a day or two; sometimes longer | same as A | **1–3 weeks is common** (D-U-N-S + verification) | several weeks |
| **Can it be Tanya's?** | only in the credits | **yes, but only if she's 18 or older.** CLAUDE.md says she's in high school; **if she's under 18, Apple's route is A with the account shared with her** | through an agreement between Tanya and the LLC | yes, if it's set up that way |
| **Fits the timeline?** (native app from week 4, `PLAN_2026-09-24_next-steps.md`) | easily | easily | yes, if the D-U-N-S lookup starts this week | tight |

### Things to raise, not decide

1. **Whose project vs who can legally enroll.** CLAUDE.md says ReCall is Tanya's project, and she's the
   builder. If she's under 18, she can't hold the membership herself. The seller name on the App Store
   will then be Ravi's or a company's. Her authorship can still show in the listing: the description,
   the website, and the listing's free-text **copyright line** (e.g. *© 2026 Tanya Angadi*). **Check
   with Apple before relying on that field for attribution.** This matters for a college application.
2. **Should a company own it?** C puts ReCall in Ravi's company alongside PlantWise. D keeps it
   separate. Either way, who owns the code, the name and the users' data is a question for your
   attorney. The trademark filing (see the naming board, §7) should be in the same owner's name as the
   developer account.
3. **You can move later, with limits.** Apple lets an app be transferred between developer accounts, but
   **only after at least one version has been released on the App Store**. The bundle ID, reviews,
   iCloud data and the Sign in with Apple Services ID move with it. TestFlight must be turned off first,
   and Xcode Cloud data removed. Several third-party guides also describe converting an individual
   membership to an organization through Apple Developer Support. That isn't on Apple's own pages, so
   **confirm with Apple before relying on it.**
4. **The organization route needs a website on the organization's domain**, not just the app's. For C,
   that means Nova Camino's own site. For D, it could be the new name's domain, which ties this decision
   to the naming pick.
5. **Firebase is on Tanya's Google account** (tangadi.biz@gmail.com). The Apple account doesn't have to
   match; Sign in with Apple only needs identifiers from Apple pasted into her Firebase console.

---

## 2. Signing up, once §1 is decided

Claude can walk through this in your Chrome with you, explaining each screen in one line. **You enter the
payment details and accept the legal agreements yourself; Claude never does.**

**Route A or B (individual):**
1. On the iPhone, open the **Apple Developer app** → Account → *Enroll today* (or go to
   developer.apple.com/programs/enroll → *Start your enrollment*). Sign in with the Apple Account that
   will own the membership. Two-factor must be on.
2. Confirm your **legal name**, address and phone. No nickname.
3. The app may ask you to scan a photo ID to verify your identity.
4. Choose **Individual / Sole Proprietor**.
5. Read and **accept the Apple Developer Program License Agreement** yourself.
6. **Pay $99** yourself. A confirmation email follows. If it hasn't arrived within 24 hours, contact Apple.

**Route C (Nova Camino Ventures LLC):**
1. **This week:** look up the LLC at developer.apple.com/enroll/duns-lookup. Use the exact legal name,
   as registered with the Washington Secretary of State. If it isn't listed, submit it to D&B (free; up to
   5 business days, then up to 2 more for Apple).
2. Make sure the LLC's **website is public and working** on its own domain, and that Ravi has an email
   on that domain. Create or sign in to an Apple Account on that work email, with two-factor on.
3. Enroll as an **Organization**: legal entity name, D-U-N-S, headquarters address, your role (owner).
4. Wait for Apple's verification. They may call, and may ask for business documents.
5. When Apple's email arrives, **accept the agreement and pay** yourself.

---

## 3. After approval (it may take days)

1. **Record the Team ID** below. Identifiers only.
2. **Reserve the app name** in App Store Connect (My Apps → + → New App). This is the only definitive
   test of whether a store name is free. **Needs the chosen name first**, and Ravi's OK.
3. **Bundle ID, proposed:** `com.<seller>.<appname>`, e.g. `com.novacamino.wherly` or
   `com.<surname>.wherly`. **It can never change once a build is uploaded.** Confirm with Ravi before
   creating it. Sam's point: the display name can change later, the bundle ID can't, so keep it plain.
4. **Sign in with Apple for Firebase** (`04_Engineering/firebase/README.md`, step 2):
   Certificates, Identifiers & Profiles → **Identifiers** → a **Services ID** for
   `recall-d9886.firebaseapp.com` (return URL from the Firebase console) → **Keys** → a key with *Sign in
   with Apple* → download the `.p8` **once, straight into the Firebase console**: Authentication →
   Sign-in method → Apple, on tangadi.biz@gmail.com, project `recall-d9886`. Paste the Services ID, Team
   ID, Key ID and private key there. **The `.p8` never goes in the repo or in chat.**
   Leave `APPLE_SIGNIN` in `People.jsx` **false**. Turning it on is an app change for the MVP session.
5. **Unblocked by this:** MVP step 4 (Capacitor wrap → TestFlight → the lock-screen / Action Button /
   Siri capture paths). It needs the Team ID, the bundle ID, a signing certificate (Xcode can manage it
   automatically), and the App Store name reserved. The App Store's privacy and account rules (a privacy
   policy, in-app account deletion under 5.1.1(v), Sign in with Apple or an equivalent under 4.8) are
   already on the MVP list as #4.

---

## 4. Identifiers (fill in after approval; identifiers only)

| What | Value | Where it's used |
|---|---|---|
| Account holder / seller | *(decided in §1)* | App Store listing |
| Team ID | — | Firebase Apple provider; Xcode signing |
| Bundle ID | — | the native app; can't change after the first upload |
| App Store name (reserved) | — | App Store Connect |
| Services ID (Sign in with Apple) | — | Firebase Apple provider |
| Key ID (Sign in with Apple) | — | Firebase Apple provider (**the key itself stays out of the repo**) |
