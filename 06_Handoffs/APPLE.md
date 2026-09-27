# Apple Developer Program: Ravi enrolls as an individual; Tanya is credited

**Decided 2026-09-24 (Tanya):** Ravi enrolls as an **individual**. Tanya is credited as the creator. The name is
**paused** and runs in its own session (`06_Handoffs/PROMPT_2026-09-26_naming.md`). The Apple sign-up has its own
session, started 2026-09-26. **Nothing has been submitted or paid yet.**

This file also holds ReCall's Apple **identifiers**: Team ID, bundle ID, Services ID and Key ID. It never holds a
private key, a `.p8` file, a password or a verification code. **The repo is public.**

Sources, re-checked 2026-09-24: [Enroll](https://developer.apple.com/programs/enroll/) ·
[Enrollment help](https://developer.apple.com/help/account/membership/program-enrollment/) ·
[Updating your account](https://developer.apple.com/support/account/) ·
[Roles](https://developer.apple.com/help/account/access/roles/) ·
[D-U-N-S](https://developer.apple.com/help/account/membership/D-U-N-S/) ·
[App transfer overview](https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer) ·
[App transfer criteria](https://developer.apple.com/help/app-store-connect/transfer-an-app/app-transfer-criteria)

---

## 1. What this choice means

- **Seller on the App Store:** Ravi's legal name. Apple: "Your name will be displayed as the seller name of your
  apps."
- **Agreements:** Ravi accepts them and pays the **$99 USD a year** himself.
- **Tanya's credit:** in the listing, not the seller line. She can be credited in the description, on the app's
  website, in the in-app About screen, and in the listing's free-text copyright line (e.g. *© 2026 Tanya
  Angadi*). Confirm with Apple before relying on the copyright field for attribution.
- **Tanya's access:** an individual account can't add team members to the Developer Program. Apple: "If you're
  enrolled as an individual and add users in App Store Connect, users receive access only to your content in
  App Store Connect and are not considered part of your team." So:
  - **Tanya can be added in App Store Connect** (listing, TestFlight, builds), under her own Apple Account.
  - **Signing builds in Xcode** (Certificates, Identifiers & Profiles) uses **Ravi's** developer Apple Account,
    signed in on the Mac. That is Apple's own route for a minor: "your parent/guardian can enroll with their
    Apple Account and share their account with you."

## 2. Can it move to an LLC later? Yes, two ways

1. **Convert the membership (Apple's own route).** Apple: "If you'd like to update your membership from an
   individual to an organization, please
   [submit a request](https://developer.apple.com/contact/request/migrate-individual-account). You'll need to be
   the founder/cofounder of the organization and provide details such as your organization's D-U-N-S Number. You
   also may be asked to submit business documents."
   - For Nova Camino Ventures LLC, Ravi qualifies if he is its founder. It also needs a D-U-N-S number
     (free; up to about 7 business days) and, as for any organization, a working website and a work email on the
     LLC's domain.
   - Afterwards the LLC's name becomes the seller.
   - Apple's page doesn't say whether the Team ID and existing apps carry over unchanged. Ask Developer Support
     when filing. Developer forum threads report the conversion can take weeks
     ([example](https://developer.apple.com/forums/thread/780937)).
2. **Transfer the app to a separate LLC account.** This is possible only **after at least one version has been
   released on the App Store**.
   - The bundle ID, reviews, iCloud data and the Sign in with Apple Services ID move with the app.
   - TestFlight must be turned off and Xcode Cloud data removed first.

**What to do now so either works later:** choose a **bundle ID without Ravi's personal name in it** (§3), because
the bundle ID can never change once a build is uploaded. A new owner can't rename it either.

## 3. After approval (it may take a day or two, sometimes longer)

1. **Record the Team ID** in §4. Identifiers only.
2. **Bundle ID, proposed:** `com.<neutral-owner>.recall`, e.g. `com.novacamino.recall`. It contains no personal
   name and no app name, so it survives both the rename (paused) and a later move to an LLC.
   - It's never shown to users. The Firestore collections and the Firebase project keep `recall` too
     (naming board, criterion 11).
   - **Confirm with Ravi before creating it.** Treat it as permanent.
3. **Sign in with Apple for Firebase** (`04_Engineering/firebase/README.md`, step 2):
   1. Certificates, Identifiers & Profiles → Identifiers → the **App ID** (bundle ID above), with *Sign in with
      Apple* ticked.
   2. Create a **Services ID** for `recall-d9886.firebaseapp.com`, using the return URL shown in the Firebase
      console, with that App ID as primary.
   3. Keys → a key with *Sign in with Apple*.
   4. Download the `.p8` **once, straight into the Firebase console**: Authentication → Sign-in method → Apple, on
      tangadi.biz@gmail.com, project `recall-d9886`.
   5. Paste the Services ID, Team ID, Key ID and private key there. **The `.p8` never goes in the repo or in
      chat.**
   - Leave `APPLE_SIGNIN` in `People.jsx` **false**. Turning it on is an app change for the MVP session.
4. **Reserving the App Store name waits for the name**, which is paused. Creating the App Store Connect app
   record needs a name, so do it after the name is picked.
5. **Unblocked by this:** MVP step 4 (Capacitor wrap → TestFlight). It needs the Team ID and the bundle ID.
   TestFlight *internal* testing works before a public name is settled, but the App Store Connect app record
   still needs some name.

## 4. Identifiers (fill in after approval; identifiers only)

| What | Value | Where it's used |
|---|---|---|
| Account holder / seller | Ravi (individual), decided 2026-09-24 | App Store listing |
| Team ID | — | Firebase Apple provider; Xcode signing |
| Bundle ID | — (proposed `com.<neutral-owner>.recall`, confirm first) | the native app; can't change after the first upload |
| App Store name (reserved) | — (paused with the naming) | App Store Connect |
| Services ID (Sign in with Apple) | — | Firebase Apple provider |
| Key ID (Sign in with Apple) | — | Firebase Apple provider (**the key itself stays out of the repo**) |

---

## Background: the options that were weighed (2026-09-24)

- **Ravi as an individual** (chosen): fastest.
- **Tanya as an individual:** only if she's 18 or older.
- **Nova Camino Ventures LLC:** needs a D-U-N-S number, a website and a work email; 1–3 weeks is common.
- **A new entity:** slowest.

Apple's requirements, from its enroll page:
- **Everyone:** an Apple Account with two-factor authentication, and being of legal age of majority in their
  region.
- **Individuals:** their legal name. No nickname, and no P.O. box as the address.
- **Organizations:** a legal entity (not a DBA), a D-U-N-S number, a work email and a working website on the
  organization's domain, and binding authority. Apple may phone, and may ask for notarized documents.
