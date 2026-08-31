# ReCall

Camera-first visual memory vault + AI tagging + natural-language search for early-stage dementia patients.

Founder: Tanya Angadi. Personal motivation: close family member diagnosed with early-stage dementia. Strategic role: fills the "Application" layer of Tanya's college-application spike construction framework.

---

> **Working on this project?** Start with `CLAUDE.md` at this folder's root — it carries the
> project state, conventions, and the start/end-of-session ritual. This whole folder is one
> git repo, so the thinking and the code stay together on every machine.

## How this folder is organized

Numbered folders read in the sequence the work was produced. Empty folders declare where future work will land.

### 00_Vision — the elevator pitch
- `ReCall_App_Abstract.docx` — one-page counselor-facing abstract in Tanya's voice. The version to send Junho.
- `ReCall_Advisory_Panel_Personas.docx` — the 20-persona advisory framework across five stakeholder groups (patients, family, professional caregivers, clinicians, product team). Every product decision runs through this panel.

### 01_Needs_and_Prioritization — what to build
- `ReCall_Unified_Needs_Kano_Analysis_v2.docx` — the current authoritative needs analysis. 13 categories, Kano classification of every candidate feature, MVP shortlist, and Part 6 addendum on Scaffolded Active Recall. Read this before any product conversation.
- `ReCall_Feature_Prioritizer.html` — open in any browser. Interactive Kano × Release grid over 74 features. Drag between cells, expand for rich descriptions, save locally. Working artifact for MVP decisions.
- `_archive/` — v1 unified analysis and the panel-only needs session. Superseded by v2; kept as a historical record of how the thinking evolved.

### 02_Strategy — how to build, and against whom
- `ReCall_MultiDevice_Architecture_Memo.docx` — decision memo recommending Option B (cloud-first Firebase multi-device from MVP). Three items need Tanya's explicit sign-off.
- `ReCall_Competitive_Analysis.docx` — three-tier landscape (dementia apps, caregiver coordination, adjacent photo-AI). Positioning map, competitors to worry about, cautionary tales.
- `ReCall_AI_Capability_Scan.docx` — 14 verified AI capabilities mapped to ReCall features. Four MVP architectural implications. Errata against the competitive analysis.

### 03_Design — user flows, wireframes, visual system
- `ReCall_v0_Spec.docx` — the spec the v0 walking skeleton implements. 8 use cases.

### 04_Engineering — spec, schema, code
- `recall-app/` — the v0 walking skeleton. React + esbuild + Firebase. See its own README for setup and development.

### 05_Research — the clinical angle
Empty for now. Populates with clinical advisor outreach, IRB materials, and any research-grade data protocol once Dr. Carter-analog is onboarded.

### 06_Handoffs — decisions, lessons, session continuity
- `DECISIONS.md` — running log of choices and why they were made. **Read every session.**
- `LESSONS.md` — traps and dead ends already discovered. **Read every session.**
- `sessions/` — dated per-session handoff notes. Archive; read the most recent one.
- `ReCall_Session_Handoff_Prompt.md` — earlier handoff, kept as a template.

### docs/ — build output, not documentation
GitHub Pages serves this folder. Generated from `04_Engineering/recall-app/src/`; never hand-edited.

---

## Key facts at a glance

| Field | Value |
|---|---|
| MVP target | Summer 2026 |
| User testing | Fall 2026 |
| Launch | Summer 2027 (aligned with senior-year application season) |
| Architecture | Firebase Firestore + anonymous auth (Option B, pending Tanya sign-off) |
| Primary user | Margaret (early-stage, insightful, motivated) |
| Retention gatekeeper | Robert (spouse caregiver) |
| Adoption driver | Priya (remote daughter) — most likely to find + set up the app |
| Prioritizer total | 74 features across 5 Kano groups × 6 release phases |
| MVP count | 23 features (9 Must-Be + 8 Performance + 4 Delighter + 2 architectural flags) |

---

## Open decisions

1. **Multi-device architecture sign-off** (see `02_Strategy/ReCall_MultiDevice_Architecture_Memo.docx` §6): approve Option B, confirm MVP roles = Patient + Caregiver only, confirm data residency on tanya-command-center Firebase project.
2. **Prioritizer review**: adjust Kano and release assignments in `01_Needs_and_Prioritization/ReCall_Feature_Prioritizer.html`, then export the final state to lock the MVP feature list.
3. **Clinical advisor outreach**: named clinical advisor by fall 2026 — argued as the biggest strategic lever in both the competitive analysis and the AI capability scan.

## Suggested next steps

- Install Memory Lane Games + Recollect; play ~30 min each; document gaps against ReCall's intended design
- User-flow wireframing for the 21 MVP features (blocked on multi-device sign-off)
- Technical spec + Firestore schema (best written after architecture decision is locked)
- Run the ElevenLabs voice-cloning PoC (1 week) — decide whether to promote voice cloning from Phase 2 to MVP+
