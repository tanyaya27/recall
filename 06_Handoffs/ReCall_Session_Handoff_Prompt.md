# ReCall App — Session Continuation Prompt

Copy everything below the line and paste it as your first message in the next session.

---

This session is a continuation of the ReCall app product development work for Tanya Angadi's college application project. Please read your memory files to load full context. Here's where we left off:

## What Was Completed This Session

1. **Advisory Panel Needs-Gathering Session** — The 20-persona advisory panel (15 customer personas + 5 product team) ran an independent needs-gathering session BEFORE seeing Tanya's PRD. Output: `ReCall_Needs_Gathering_Session.docx`

2. **Tanya's PRD Merge** — Tanya uploaded her Product Requirements Document. We performed a two-way gap analysis:
   - PRD added 9 ideas the panel missed (semantic locations, pill ID via camera, voice reminders, voice feedback mining, caregiver-driven origination, product principles, success metrics, smart home integration, rehab exercise tracking)
   - Panel added 12 ideas the PRD missed (people recognition, passwords, dark mode, de-escalation, clinical correlation, caregiver burnout, institutional needs, shift handoffs, ambient display, cognitive exercises, variable family engagement, active recall)

3. **Unified Needs Analysis + Kano Model** — Merged everything into 13 need categories, classified all features using the Kano model (Must-Be, Performance, Attractive, Indifferent, Reverse), and produced a priority matrix. Output: `ReCall_Unified_Needs_Kano_Analysis.docx`

4. **Critical Gap Identified: Multi-Device Architecture** — Neither source explicitly named it, but Priya logs from her own phone 2000 miles away, Robert logs on his device for his wife, Elena uses her own phone during shifts. This requires a cloud-first architecture decision. **Tanya needs to decide: multi-device MVP or single-device with Phase 2 retrofit?**

5. **New Feature Idea: Active Recall with Multiple Choice** — Ravster proposed enhancing Dr. Lauren Kim's "active recall" mode (where patient tries to remember before seeing the answer) with an optional multiple-choice hint step. Example: "Where are your glasses?" → patient tries to recall → if stuck, gets 3-4 location options to choose from → then sees the actual photo/answer. This creates a scaffolded cognitive exercise: free recall → cued recall → recognition → answer. This idea needs to be added to the unified document and the Kano analysis (likely an Attractive/Delighter in Phase 2, paired with the existing active recall feature).

## Key Documents in Workspace (`Tanya - College Application/`)
- `ReCall_App_Abstract.docx` — 1-page counselor abstract (Tanya's voice)
- `ReCall_Advisory_Panel_Personas.docx` — Full 20-persona framework
- `ReCall_Needs_Gathering_Session.docx` — Panel-only needs (now superseded by unified doc)
- `ReCall_Unified_Needs_Kano_Analysis.docx` — **CURRENT** unified analysis + Kano model

## MVP Summary (21 Features)
- 9 Must-Be: photo capture + AI tagging, NL search, repeated query tolerance, calm UI, one-tap confirm, always correctable, time/day orientation, caregiver logging, multi-device architecture
- 8 Performance: AI accuracy, voice input, search speed, morning briefing, semantic locations, medication photo, safety photo recall, caregiver status
- 4 Delighters: nightly safety screen, caregiver-driven origination, contextual time hints, silent structured data logging

## Open Decisions
1. **Multi-device architecture**: MVP or Phase 2?
2. **Active recall + multiple choice**: Add to unified doc as scaffolded cognitive exercise feature

## Suggested Next Steps (in priority order)
1. Add the active recall + multiple choice idea to the unified document
2. Get Tanya's decision on multi-device architecture
3. Finalize MVP feature list based on Tanya's review of the unified doc
4. Competitive analysis of existing dementia/memory assistant apps
5. Begin user flow wireframing for MVP features
6. Technical architecture document (data model, API choices, sync strategy)
