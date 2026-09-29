# Next session: Ravi's phone bugs after 20260929b (written 2026-09-29)

Paste everything below the line as the first message of the new session, with the `ReCall` folder connected.
Then send the bug list and screenshots in the same or the next message.

---

We're continuing ReCall (Tanya's household memory app). I'm Ravi, and I test it on my iPhone. The repo is in my
connected folder `ReCall`. **This session fixes the bugs I found on the phone after build `20260929b`.** I'll send the
list and screenshots.

**Read these before anything else:**
- `CLAUDE.md`
- `06_Handoffs/sessions/2026-09-29-phone-list-bugs-and-move.md`, the last session, including its lessons
- the top three NOW sections of `06_Handoffs/OPEN_ITEMS.md`
- `06_Handoffs/LESSONS.md`, the 09-28 and 09-29 entries
- `06_Handoffs/DECISIONS.md`, the 09-27 to 09-29 entries (camera look B, D1–D5, Move it)
- `06_Handoffs/RIG.md`, all of it

**Set up the review rig first (`06_Handoffs/RIG.md`).**
- Rebuild it in the container from `04_Engineering/recall-app/rig` and `src`, using Playwright 1.56.1 with
  `/opt/pw-browsers`.
- Run every suite before touching code. The expected baseline is: repro_f3 50 · audit 100 · audit_roles 44 ·
  audit_graph 66 · audit_label 14 · audit_private 34 · audit_d 117 · audit_where 83.

**How to work:**
1. **Check which build my phone is running first.** Settings → Version shows the build time; the ☰ menu shows
   "Build <v>". If it isn't `20260929b` or newer, say so before calling anything a bug.
2. **Reproduce each bug in the rig before fixing it.** Add a check that fails on the old code and passes on the new.
   Flows that write data are tested with `__rig.rules(true)`, because the real rules refuse what the stub may allow.
   Visual bugs (alignment, colour, spacing) are checked on the pixels of a screenshot, not on element boxes.
3. **Bugs get fixed directly. Anything that is a design choice with a real alternative goes to me as rendered options**
   (the two boards, with the disagreements shown). Tanya and I decide.
4. **Include with this batch:** the build name ("Build 20260929c") as the last line of the Settings → Version box
   (OPEN_ITEMS, "Next build").
5. **Before handing off:**
   - Run all suites.
   - Show me the screenshots.
   - Build `docs/app.js` with the production flags (RIG.md).
   - Bump both `?v=` stamps in `docs/index.html` to `20260929c`, then d, and so on.
   - Update OPEN_ITEMS, DECISIONS (my rulings) and LESSONS.
   - Commit the files into my folder.
   - Give me the git commands.

**Rules:**
- Git on the Mac starts with `find .git -name "*.lock" -delete`. I commit and push from the Mac; you don't run git
  that writes. Read-only git uses `git --no-optional-locks`.
- Before overwriting any file on the Mac, check it for drift against what you started from.
- Every deliverable goes to my folder AND to the chat as a file card.
- Keep fixes as small as the bug. Don't point me at a screen I've said I can't see. Don't ask me to re-report what
  I've already told you.
