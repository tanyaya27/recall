import sys; root=sys.argv[1]
def rw(p,f):
    s=open(p).read(); n=f(s); assert n!=s,p; open(p,'w').write(n)
rw(f'{root}/06_Handoffs/DECISIONS.md', lambda s: s.replace("## 2026-09-16 (round 7b) —", """## 2026-09-16 (round 7c) — The thing card's actions are a fixed bottom bar; *Earlier photos* is always there, live only when there are some

**Decision (Ravi):** *Add photo · Edit · Shared/Private · Remove* move out of the card into a
bar fixed to the bottom of the screen — same padding, gradient and button height as Home's
*Log item · Find item* (both bars now 3.5 rem). The row had sat at a different height on every
card depending on the photo and the text under it. Icons-only measurement is unchanged. The
Edit fields open in a second card under the first. Known trade-off (Priyanka, 09-05): a fixed
bar rides up over the content when the keyboard opens for Edit; watch it on the phone.

**Earlier photos, explained and fixed.** *Earlier* means photos from BEFORE the current log —
the thing was logged again, or moved (Edit → place). The roll shows only the current log.
The button was shown whenever the item had a history row, even when no earlier photo existed
(Ravi's folders: one photo, live button). Now snaps load on open, the button keeps its place,
reads *Not there? 2 earlier photos* when there are some and *No earlier photos*, disabled,
when there are none.

---

## 2026-09-16 (round 7b) —""",1))
rw(f'{root}/06_Handoffs/OPEN_ITEMS.md', lambda s: s.replace("- [ ] **Deploy `20260916a`** from the Mac — round 7b fixes", "- [ ] **Deploy `20260916b`** from the Mac — 7c: thing-card actions in a fixed bottom bar (same height as Home's), *Earlier photos* only live when earlier photos exist (count in the label); 7b fixes").replace("- [ ] Phone-check `20260916a`:", "- [ ] Phone-check `20260916b`: thing card → the four actions sit in a bar at the bottom at the same height as Home's buttons; tap Edit → fields open in a card under; with the keyboard up the bar should not cover the field being typed in (if it does, tell me). *Blue and red folders* → *No earlier photos*, greyed. *Reading glasses* (moved once) → *Not there? N earlier photos*.").replace('git commit -m "Round 7 + 7b:', 'git commit -m "Round 7 + 7b + 7c: actions in a fixed bottom bar, Earlier photos live only with earlier photos;'))
rw(f'{root}/CLAUDE.md', lambda s: s.replace("> **2026-09-16 — build `20260916a` is BUILT, NOT YET DEPLOYED** (round 7b:", "> **2026-09-16 — build `20260916b` is BUILT, NOT YET DEPLOYED** (7c: fixed action bar, Earlier photos fixed; 7b:",1))
print('ok')
