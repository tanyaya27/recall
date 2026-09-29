# Session 2026-09-28/29: phone-list bugs, D1–D5, the stuck move, Move it (builds 20260928b → 20260929b)

This continues the adversarial-hardening session (`2026-09-28-adversarial-walk-and-hardening.md`). It was driven by
Ravi's phone reports, one after another. The builds were pushed by Ravi from the Mac and checked on his phone.

## Builds

| Build | What |
|---|---|
| `20260928b` | Build stamp in the ☰ menu drawer ("Build <v>"). It came after a stale bundle on the phone was taken for a bug. |
| `20260928c` | B1–B4 from the 09-28 phone list: a pill after a photo keeps the photo; the caption follows the cover; sheet spacing; a working toast on add-photo. |
| `20260928d` | D1–D5 rulings (`design/BOARD_2026-09-28_phone-list-D1-D5.md`; DECISIONS 09-28): Add-photo pill, a photo viewer with Make main / Remove, per-photo captions, pills inside the where-card on one line, ••• place-list wording and button. |
| `20260929a` | **The stuck move, root cause in the RULES.** Place records had no `sharedWith`/`roles`, so the real `consistent()` refused every update to a place (add a photo, rename, Make main). The fix: the fields on every place write, and a boot repair backfills them. A failed camera save now says so. The current place was taken off the pills and tagged in the ••• list. |
| `20260929b` | **Move it opens on the current place:** "Current place: X" / "New place: Y", amber label and pin, and the current place comes back as the first pill. The question words are grey and the name bold. **The pin is aligned on the pixels** (baseline + `1cap`). **The step prompt moved into the card, above the squares.** |

## What broke / lessons (all in LESSONS.md)

- **A stale bundle was taken for a bug.** Check the phone's build first (the ☰ menu, or Settings → Version) before
  debugging anything.
- **The rig's permission stub was kinder than the real rules** (missing fields counted as empty, so the write was
  allowed). It now mirrors them. Any flow that writes must be run once with `__rig.rules(true)`.
- **Icon/text alignment has to be checked on the pixels.** When the boxes were centred, the pin still looked 3px low.
  Ravi raised it many times.
- **Ravi's frustration points:** calling a fix "small" and then building machinery; pointing him at UI he said he
  can't see; asking him to re-report things he'd already said. Read his message twice, and fix what he names.

## Suites at `20260929b` (all green)

repro_f3 50 · audit 100 · audit_roles 44 · audit_graph 66 · audit_label 14 · audit_private 34 · audit_d 117 ·
audit_where 83.

## Open (see OPEN_ITEMS)

- Ravi's phone check of `20260929b`. **He reports more bugs**, which the next session will take first.
- Next build: the build name as the last line of Settings → Version.
- Helpers can't change place photos or photo captions (the rules' editor keys). Owner-only for now.
- The rig stub's localStorage quota (cosmetic, rig only).
- Naming and Apple Developer stay in their own sessions.
