# Next session — after release 1 (`20261001a`), judged "real shit"

Paste everything below the line as the first message of the new session.

---

Continue ReCall. The folder on my Mac is `~/Documents/Claude/Projects/Tanya - College Application/ReCall` (repo
tanyaya27/recall, GitHub Pages from `docs/`).

**Who is who.** Tanya designed ReCall and makes the design calls. Ravi (this Mac, user "rangadi") builds it with her and
commits. Messages on this account can come from either of us. If you can't tell, don't guess a name.

**Read first:** `CLAUDE.md`, `02_Strategy/PRODUCT_BOARD.md`, `06_Handoffs/DECISIONS.md` (10-01 and 10-02),
`06_Handoffs/LESSONS.md` (the last two entries), the end of `06_Handoffs/sessions/2026-09-29-tier-audit.md`, and the top
of `06_Handoffs/OPEN_ITEMS.md`. `06_Handoffs/RIG.md` covers setting up the test rig.

**Where it stands.** Build `20261001a` is live (commit 8414a87). It's Tanya's release 1, "Words, and one pick". The
camera takes the item's photos, her words, one optional "What is it in?" and "+ What is the X in?" for tiers 2–3. There
is one "where" list everywhere, and Home tiles show photo + name. It passed 631 checks and six independent tester rounds.
The screens as built are in `06_Handoffs/design/mockups/BUILD_2026-10-01a_words-and-one-pick.jpg`. The verdict on 10-02:
**"You have yet again, produced real shit."** No specifics were given yet.

**What I want from this session, in order:**
1. **Ask me one question first:** what I saw that was wrong (screens, steps, phone). Build nothing until I answer.
   While you wait, walk the live build yourself, phone-size, as Margaret would on her first day: log an item, say
   where it is, find it, move it. List everything that is confusing, slow, cramped or wrong, judged against Tanya's rule
   "Simplicity must rule everything", not against the tests. Bring that list next to my answer.
2. **Then tell me plainly** what you think the real problem is: a bug, a flow, or the model itself. Say whether a
   rollback to `20260930f` makes sense. A rollback is one revert, and it's my call, not yours.
3. Fix only what we agree on. Each bug gets a failing check first. Design changes go to us as rendered options
   before any code.

**Standing rules.**
- Git on the Mac starts with `find .git -name "*.lock" -delete`. I commit and push from the Mac; you don't run git
  that writes. Read-only git uses `git --no-optional-locks`.
- Before overwriting any file on the Mac, check it for drift against what you started from. Before giving me git
  commands, verify every delivered file's hash on the Mac.
- Every deliverable goes to my folder AND to the chat as a file card (send the file, then commit it by its fileUuid).
- Keep fixes as small as the bug. Don't point me at a screen I've said I can't see. Don't ask me to re-report what I've
  already told you.
- Maximise vertical space. Be brief. No recap of steps.
- At the end, update OPEN_ITEMS, DECISIONS, LESSONS, the session file and CLAUDE.md, and give me the git commands with a
  `cd` that works:
  `cd ~/Documents/Claude/Projects/"Tanya - College Application"/ReCall`
