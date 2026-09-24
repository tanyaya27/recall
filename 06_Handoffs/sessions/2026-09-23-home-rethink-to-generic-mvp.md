# Session 2026-09-23 → 09-24: home-screen rethink → general memory app → MVP step 1

## What happened

- **Home-screen rethink (09-23).** The rig was rebuilt from `RIG.md` (notes added for a fresh
  container). Six concepts were drawn with the boards plus a new graphic-designer persona (Noor Haddad):
  `design/BOARD_2026-09-23_home-screen.md`, `mockups/H1_*.png`, generator `rig/gen_h1.py`.
  **Ravi: "100% cosmetic … quite useless."** The layouts are parked as possible Settings styles. The
  lesson is in LESSONS (test the premise before executing a brief).
- **Scenarios (09-24).** Five of Ravi's scenarios (Margaret + Robert, Dan's garage, Leila's storage
  locker, June's garden, Evelyn + Nisha's papers and appointments), ten dimensions, logging-speed
  targets, setup questions, the support network: `design/BOARD_2026-09-24_scenarios-and-logging.md`.
- **Tanya ruled (DECISIONS 09-24): ReCall is a general memory app for anyone**, and the logging clock
  starts when the person reaches for the phone.
- **MVP gap list and order**, approved: `design/PLAN_2026-09-24_generic-mvp.md` (steps 1–5).
  Fast-capture brainstorm (guess vs pick, the frosted strip, aim/touch/labels, sessions, QR):
  `design/BOARD_2026-09-24_fast-capture-brainstorm.md`. Four-week plan, ruler sizing, and the garage
  photo list: `design/PLAN_2026-09-24_next-steps.md`.
- **MVP step 1 BUILT (`20260924b`), on the Mac, not pushed:**
  - The `ai` Cloud Function now uses ReCall's own key (secret `ANTHROPIC_KEY`) or the owner's key.
  - It clamps the model and size, and limits calls to 150 per person per day and 3000 per project.
  - Prompts are neutral; there is no setup card.
  - Settings → AI says "Nothing to set up", with your own key folded away.
  - First-run line **option C** (Tanya): *Take a photo of where you put something. / Later, tap Find
    item and ask for it.*
  - Tests: rig audit 98/98 and audit_roles 42/42; the functions on the real emulators 11/11
    (`firebase/rules-test/run_ai_test.sh`).
- **Name check:** "ReCall" is very likely taken on the App Store and crowded; pending "RECALL" software
  trademarks exist (`NAMING_2026-09-24_findings.md`). The naming + Apple Developer session prompt is
  `PROMPT_2026-09-24_naming-and-apple.md`.

## Half-finished / next

- **Deploy step 1** in the order in OPEN_ITEMS: billing + budget alert → a new Anthropic key
  → `firebase functions:secrets:set ANTHROPIC_KEY` → `firebase deploy --only functions:ai` → push.
- **The naming + Apple session** (separate): `06_Handoffs/PROMPT_2026-09-24_naming-and-apple.md`.
- **The MVP session continues:** render the three fast-capture options (brainstorm §7) → Ravi picks
  → step 2 (#6 #9 #10). Ravi's garage photo session feeds tests A, B and C.
- The invite test (15 min) and App Check are still open.
