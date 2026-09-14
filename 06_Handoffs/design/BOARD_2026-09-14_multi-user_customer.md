# End-user board — 2026-09-14 — Multi-persona: Margaret, Robert, Priya sign in with roles

**Question (Ravi):** move from one shared anonymous vault on one phone to a household where Margaret, Robert and Priya each sign in, with roles. Standing three plus James, Linda, Harold, Elena and Dr. Lauren Kim. Reviewed against §2 of the 09-05 design and the 09-14 decisions. No consensus is offered; the splits are at the end.

## Margaret

What she needs from a multi-user app is that it looks exactly like the app she has now: her board, her two verbs, the day line. Other people putting things on her board is welcome — "Robert photographing my glasses where he moved them is him being kind, not keeping tabs" — provided the tile shows no badge, no name, no "Robert added this." Who photographed a thing is not her concern, and telling her turns her board into a log of her lapses.

She will not log in. Not a password, not an email, not a code from a text, not "tap your name." Her phone already knows it is hers; a screen that asks who she is on a bad day is the *tap to name* homework she rejected on 09-05, only worse. If signing in must happen on her phone, Robert does it once at setup and she never sees the word again.

What worries her is Priya. She does not want her daughter seeing the bedside table on a Tuesday morning, or how many times she asked for her keys. She would accept Priya seeing that things were photographed today, even the photos, if she is told plainly, once, by Robert: "Priya can see this too." What she would not accept is finding out later. Her role: everything on her own board. Must not: be asked anything about who else is in the house. Day one for her: nothing changes. That is the test.

## Robert

He needs one thing: his own phone, the same board, no card between five photos, *Another?* after each save. He has asked for this since 09-05 and notes that "roles" is arriving before the thing he asked for. He will not type on her phone and not much on his: a code he can *read out* to Priya is right; a code he has to *enter* is borderline, six digits is his limit.

What he refuses: a login every time; a mode switch; a dashboard; anything that makes his phone look different enough from hers that he cannot help her with hers. *This phone is used by: Margaret / someone helping* is exactly the right amount of role. He does not want to be called "caregiver" in the app. He is her husband.

His worry is the reverse of Margaret's: Priya calling because the app said nothing was logged today, when they were at his sister's. Priya's card should say what the app saw and nothing more — no "no activity" alarm. Must be able to: photograph, fix, remove, add places, join his phone, add Priya. Must not have to: approve anything. Day one: Ravi opens his phone, sets *someone helping*, reads a code off Margaret's phone into his. Under two minutes or he stops.

## Priya

Nothing in the 09-05 cut was for her; this finally is, and she wants it kept honest. She needs one card — photos today, last opened, later the routines — one tap on her own phone, from a link Robert or the app texts her. She will not fly out to enter a key; the per-device AI key is still the biggest blocker to a real family. A QR is useless at two thousand miles; a link with the code inside it is right.

She refuses raw event streams, a "you haven't checked" nudge (she is a little bit Susan too), and a role that gives her *less* than Robert by default, because in her family she is the one who sets the thing up. She wants read plus log, so she can photograph her father's hearing aids on a visit and have them land on his board.

What worries her is the world-readable vault. She said it on 09-05 and repeats it: the rules must be tightened by household *before* her father's bedroom is in Firestore under an account with her name on it. Joining a household is the moment the app stops being test data. Day one: a text, one tap, a card that says *3 photos today · last at 4:10 pm · phone opened this morning*. Nothing else on it.

## James (through his daughter)

Passes if, and only if, the helper phone works with James's phone switched off. He will not join, sign in or scan anything; his daughter's phone is the whole app. His note for the architecture: "patient" must be a *slot* in the household, not a device that signed in — a household with no patient device is normal, not an edge case.

## Linda

Her fear is not being watched but being watched *and told*. If her daughter joins, Linda will ask "can you see this?" ten times, and the answer must be the same calm sentence each time, in Settings: *Rosa can see your things.* Never a notification, never a badge, never an "added by Rosa" line — that is the app telling her she needed help. She is the one persona who *wants* to know she is not alone in the app, and she wants it as furniture, not as an event.

## Harold

Roles make him more suspicious, not less. "Who else is in this?" he will ask once and then refuse. He tolerates a household only if his wife did all of it on her phone and his never shows a person's name. His contribution is sharp: the day the app shows *who* logged a thing, it has become surveillance and the phone goes in a drawer. Name nobody, anywhere on the patient's board.

## Elena (dementia care specialist)

She will be the third person invited, and wants her role to exist in the data even if unbuilt: log, fix places, never delete, never see settings, removable by the family in one tap. Her real concern is predictability: the patient's phone must not change on the day someone joins — no toast, no "Priya has joined." She would refuse to introduce any version that announces its own membership to the patient.

## Dr. Lauren Kim (OT)

One flag: a remote relative logging for a patient who could still log her own is a scaffold that quietly becomes a replacement. Record *who* logged in the events, for the research export and for her; agree with Harold that it never appears on the board. Data, not display.

## The minimum for this family — Ravi/Tanya remote, Margaret on one phone

**Stage 1 — the helper phone, no accounts.** *This phone is used by* on Robert's phone; *Another?*; the note field. Two anonymous devices in one `household`, joined by a six-digit code read off Margaret's Settings and typed once into Robert's. Firestore rules scoped by household. Nothing new on Margaret's screen. Robert and Margaret accept this; Priya accepts it as a prerequisite.

**Stage 2 — Priya's card, by link.** The helper phone can *Send a link* — a URL carrying the household code — by text. Opening it lands on the one-card status, board behind it. Still anonymous auth; the link is the credential. Her phone has no AI key, so either the key lives on the household (Sam's problem) or her card is read-only for now — Priya takes read-only over waiting.

**Stage 3 — real sign-in for helpers only.** Priya and Robert upgrade their anonymous identity to an email, so a lost phone does not lose the household. Margaret's phone stays anonymous forever. Roles become *person* / *helper* / *family* with the rules Elena described. Who-logged goes into `recall_events` only.

**Stage 4 — professional and removal.** Elena's role; remove a member; the sentence *Priya can see your things* in Margaret's Settings. Not before a second family is testing.

## Splits for Ravi/Tanya

Margaret and Linda want to be told once, in Settings, who can see the board; Harold and Elena say the patient's phone must never mention another person. Robert wants a code read aloud; Priya wants a link; nobody wants a QR. Priya wants log rights on day one; Dr. Kim wants remote logging held back until Margaret's own logging is measured; Robert does not care so long as it is not his problem. Priya says the rules must be tightened before Stage 1 ships; Robert would ship without them because Ravi's kitchen is test data. James and Harold insist the patient is a slot, not a sign-in; the architecture memo's "Patient device + Caregiver device" assumes a patient device exists.

**Recommendation.** Build Stage 1 now, as designed on 09-05, with household-scoped rules — it is what Robert asked for first and what Priya said must precede real photos. Add nothing to Margaret's screen in any stage; who-logged is recorded, never displayed. Ship Priya's card in Stage 2 read-only by link, and settle her logging rights by watching whether Margaret keeps logging her own things once Robert can.
