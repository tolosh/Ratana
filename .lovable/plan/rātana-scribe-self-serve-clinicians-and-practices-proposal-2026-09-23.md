# Rātana Scribe + self-serve clinicians and practices: proposal

## 1. What exists today (honest inventory)

Most of what the brief assumes exists is **front-end demonstration only**. Very little is enforced by the backend.

| Area | What is really there | Gap for this phase |
|---|---|---|
| Organisation / roles | `lantern_role_assignments` (user_id, role, org, region, team, service zone, expiry). Role switching in `/demo` is client-side. | No organisation table, no membership, no tenant id on rows. |
| Auth / onboarding | No sign-in screen. `/demo` is public. Onboarding is a scripted screen. Auth middleware is generated but not used. | Needs real sign-up, sign-in, MFA, invitations. |
| Patient / episode / pathway | `lantern_patients` (5,072 synthetic rows, episode_state, pathway, flags). Episodes, care plans and timelines live in the browser only (`crm-store`, localStorage). | No server-side episode or timeline table to file a signed note to. |
| Alerts / queue | Scores and statuses are columns on `lantern_patients`. Queue and worklists come from SECURITY DEFINER read functions callable by anon. Alert drivers are a UI pattern (`SignalBadge`, driver breakdown). | Driver pattern can be reused for provenance. Anon read functions do not fit real tenancy. |
| Audit | Client-side arrays (CRM audit, `auditEvents` in `RatanaApp`). | No append-only server audit table. |
| FHIR layer | Marketing copy and simulated labels only. | Needs a real DocumentReference-shaped export seam (can stay a stub). |
| Caregiver app | A view inside `RatanaApp.tsx` (Lamplight surface, "I need help now", observation check). | Needs a "patient summaries" inbox. |
| Design tokens | `src/styles.css`: signal colours with glyphs, Iris, Newsreader / IBM Plex Sans / IBM Plex Mono, 40px rows, 44/56px targets, night mode. | Mostly compliant. Flags below. |

**Design-rule flags (not restyling, reporting only):**
- Iris is a token, but its value has not been checked against #6E56CF. It will be confirmed and aligned in M1 if it differs.
- Tall Man lettering and the "0.5 mg" dose format are not applied anywhere yet. There are no drug values in the UI today.
- Some success notices may use the "stable" green token. I will audit this in M1.

**Refactor before building (in this order):**
1. Break up `RatanaApp.tsx` (one large file with every view) into real routes: `/app/...` for signed-in users and `/demo` kept as the public showcase.
2. Add real auth, organisations and a server-side audit table.
3. Move episode and timeline data from the browser into the database, for organisations that are not demo tenants.

## 2. My understanding

One scribe engine, used two ways: standalone for solo doctors, and embedded in HITH, where it has episode context. Solo doctors and practices sign themselves up. In this model, a practice is a hospital running its own virtual ward. A person (clinician) and an organisation (tenant and record custodian) are separate, joined by membership. Modules are turned on per organisation. The scribe drafts but never decides: every sentence has a source, unsupported sentences are flagged, nothing is filed without a signature, and nothing touches scores, alerts or the queue.

**Contradictions and risks:**
- **Data residency.** Lovable Cloud's backend region has to be confirmed. If it is not Sydney (ap-southeast-2), the "backend in Australia" constraint cannot be met on the current backend. Moving an existing project's region is not a self-serve action. The options are a new Sydney-region backend for scribe data only, or accepting a non-AU region for the prototype. This is the biggest decision in the build.
- **AI in Australia.** The built-in AI service does not guarantee AU-only processing. AU-resident drafting needs a direct provider account (for example Azure OpenAI Australia East, or AWS Bedrock Sydney) with your own keys.
- **Real vs synthetic.** Self-serve card sign-up means real clinicians and, soon, real patients. Every screen and policy says "synthetic only" today. Keeping seed data invented is easy. Making real patient data safe is a compliance programme (privacy impact assessment, APP 8, a DPA with each provider). The prototype can be built to that shape, but should not take real audio until that work is done.
- **"Never adds a diagnosis."** Only the prompt and the verification pass can enforce this. It reduces risk but cannot guarantee it. The sign-off step remains the control.
- **The existing demo** is open to anyone. Tenancy is added alongside it and does not replace it.

## 3. Questions (ranked by impact on the build)

1. **Residency:** For M1, may scribe data and AI calls run outside Australia (clearly labelled as a prototype), or must M1 be AU-resident from day one? The answer decides the backend and providers.
2. **Providers:** Do you have, or will you open, accounts with an AU-region transcription provider and an AU-region LLM (Azure Australia East, AWS Bedrock Sydney, Deepgram/Heidi-style AU hosting)? Keys must be yours.
3. **Real audio:** In M1–M2, will real clinicians record real patients, or only role-play and synthetic consults?
4. **Billing:** Stub only (plans and entitlements real, no card charged), or real card capture through a payments integration in a test environment?
5. **Registration checks:** Is self-declared Ahpra/MCNZ numbers with a manual review queue acceptable, or do you need automated register lookup?
6. **Existing demo:** Should `/demo` stay as the public, open showcase while `/app` becomes the real signed-in product?
7. **Telehealth capture:** Is it acceptable to use the mic only (clinician on speaker), with system-audio capture deferred?
8. **Virtual ward round:** Should one recording be split into per-patient notes automatically (with the clinician confirming the split), or should the clinician tag the patient per segment manually?
9. **Patient summaries:** Should they reach the caregiver app only after the clinician signs, with a separate "send to patient" action?
10. **Retention:** Is the default "delete audio on sign, 30-day maximum" fixed, or configurable per organisation within that ceiling?

## 4. Account model (added alongside, nothing replaced)

- **New `organisations`** table: type solo | practice | health_service, parent_id (for existing hierarchy), region_code AU/NZ, plan_id. Existing health services are backfilled as `health_service` organisations. Their current `lantern_role_assignments` keep working.
- **New `clinicians`** table: one per user, registration body and number, verification status, profession.
- **New `memberships`** table: user × organisation × role, status invited/active/suspended, supervisor_id for Registrar/Student. A person can hold many.
- **New roles** in a separate role enum on membership: practice_owner, practice_admin (metadata only), registrar (needs co-sign), assistant (prepare only, cannot sign, free seat). The existing roles are unchanged.
- **Entitlements:** `plans` plus `org_modules` (scribe, hith) plus `entitlements` (letters/month, seats). A small `has_module(org, module)` check is used by policies and the UI.
- **Moves:** solo → practice converts in place (type change, same id). Joining a practice creates a membership. Personal templates are owned by the user and follow them. Session transfer is a `session_transfers` request that the practice accepts, and it is audited. Shared care uses `org_links` (practice ↔ service); only sessions tagged to that service's episodes become visible.
- **Tenancy:** every new clinical row carries `organisation_id`. RLS uses `is_member(auth.uid(), organisation_id, roles[])`, a security-definer function. Admin roles can read metadata columns through a view without transcript or note text.
- **Migration steps:** (1) create tables only; (2) backfill organisations from existing regions and teams; (3) add a nullable `organisation_id` to `lantern_patients` and backfill it; (4) new policies are additive; the existing demo read functions are untouched.

## 5. Navigation

```text
(a) Solo, Scribe only        (b) Practice, Scribe + HITH       (c) Health service + Scribe
Sessions (today)             Network command (own ward)       [existing menu unchanged]
New session                  Clinical queue                   + Scribe
Templates                    Patient records                    Sessions
Patients (light list)        Admission & discharge              Templates
Settings: profile, plan,     Patient app                      Scribe also launches from
  MFA, retention             Scribe: Sessions, Templates        queue item, record, episode
                             Practice admin: members, seats,
                               sites, billing, usage, retention
                             Governance (audit)
```
An organisation switcher at the top of the sidebar appears only when a user holds more than one membership.

## 6. Key screens and states

- **Sign-up** (4 steps): account + MFA enrolment → registration number (pending review is shown, and it does not block Free) → solo or practice → plan. Error states: registration already in use; MFA not completed, so recording is locked with the reason shown.
- **Recording:** patient/context picker (optional for solo), template, consent script with a single "Consent given" tap (the record button is disabled until then). The live view shows elapsed time, upload status per chunk ("12 of 14 uploaded"), and Pause, Off the record and End. **Offline:** a banner reads "Offline. 18 chunks stored on this device. Will upload when connected." Chunks are never discarded. **Mic denied:** an instruction panel. **Transcription unavailable:** recording continues and chunks are kept; transcription is queued.
- **Review and sign:** transcript with speaker labels on the left, Iris-marked draft note on the right. Hovering or focusing a sentence highlights its source segments or cited observations (value + 24h time), in the same style as alert drivers. Flagged sentences have an Iris outline with the reason; each must be accepted, edited or deleted. The Sign button shows the number of open flags. After signing, the note is locked and only "Add addendum" is available. Registrars see "Awaiting co-sign by Dr X". **Model unavailable:** transcript is kept; the message reads "Draft not generated. Retry or write manually"; a manual note can still be signed. **Empty:** "No sessions today" with a New session button.
- **Outputs:** letter, discharge summary and patient summary (reading level shown), plus tasks confirmed one by one (confirm / edit / discard). None are sent before signing.
- **Template editor:** sections plus plain-language rules ("Always list medications with dose and route"), a preview against a sample transcript, version history, and scope (personal or practice).
- **Practice admin:** members and invites, seat count against the plan, sites, retention setting, usage (sessions, minutes, letters per clinician) and an audit filter. No clinical text is visible.
- **Launched from HITH:** the queue item or episode header has a "Scribe" button. Patient, episode, pathway and today's observations are pre-attached. The signed note is filed to the episode timeline; confirmed tasks go into the existing task list. The score, alert and queue position stay unchanged.

## 7. Data model (new tables; all carry organisation_id with member-scoped RLS)

```text
organisations ─┬─ memberships ── users/clinicians
               ├─ org_modules, entitlements ── plans
               ├─ org_links (shared care)
               └─ scribe_sessions ── patient_id? → lantern_patients
                    │                 episode_id? → episodes (new, server-side)
                    ├─ consents (script version, captured_by, at)
                    ├─ audio_chunks (seq, storage path, uploaded_at, deleted_at)
                    ├─ transcript_segments (seq, speaker, t_start, t_end, text)
                    ├─ notes (template_version, status draft|signed|cosign_pending, signed_by/at)
                    │    ├─ note_sentences (section, text, flagged, flag_reason, resolution)
                    │    │    └─ sentence_sources (segment_id | observation_id | alert_id | pathway_id)
                    │    └─ note_addenda
                    ├─ outputs (letter|discharge|patient_summary, status)
                    ├─ proposed_tasks (status proposed|confirmed|discarded, task_ref)
                    └─ shares / exports (target, fhir_documentreference json)
templates, template_versions (owner user or org)
audit_events (append-only; actor, org, action, entity, at; no clinical text)
session_transfers
```
Audio lives in a private storage bucket with paths scoped by organisation. RLS on storage mirrors membership. Assistants can insert sessions and chunks but not sign. Nothing is ever hard-deleted from audit.

**Existing items modified:** `lantern_patients` (add nullable organisation_id), `lantern_role_assignments` (add nullable organisation_id), the patient RLS policy (additive policy only), `RatanaApp.tsx` (nav entries, Scribe button on queue/record, split into routes), `PatientCrm.tsx` (timeline shows signed notes), the caregiver view (summaries inbox), `src/styles.css` (Iris check only), `__root.tsx`/`start.ts` (auth middleware). The demo read functions, existing dashboards and flows are unchanged.

## 8. Architecture

```text
Browser mic (MediaRecorder, 5 s chunks)
  → IndexedDB queue (always written first)
  → upload server function: uploadChunk (auth + MFA check) → private storage
  → transcribeChunk server function → Transcription provider (streaming, AU)
  → transcript_segments rows (realtime to the review screen)
End session → draftNote (LLM, strict JSON: sections → sentences → source ids)
            → verifyNote (second LLM pass: each sentence vs its sources → flags)
            → review UI → signNote (locks, files, audits, schedules audio deletion)
```
**Server functions:** createSession, captureConsent, uploadChunk, transcribeChunk, finaliseTranscript, draftNote, verifyNote, resolveFlag, signNote, cosignNote, addAddendum, generateOutput, confirmTask, exportNote, transferSession, plus org, invite and entitlement functions. Every one writes `audit_events`. The providers sit behind `TranscriptionProvider` and `DraftingProvider` interfaces.

**Provider recommendations (AU residency):**
- **Transcription:** Azure AI Speech (Australia East). It has AU residency, diarisation and custom phrase lists for drug names. Alternatives: AWS Transcribe Medical (not offered in Sydney; standard Transcribe is) or Deepgram (AU hosting only under enterprise terms).
- **Drafting / verification:** Azure OpenAI (Australia East, data zone AU) or AWS Bedrock Sydney (Claude). Both keep processing in AU under your account.
- **Prototype fallback:** Lovable's built-in AI service works immediately without keys, but it is not AU-resident. Acceptable only if question 1 allows it, and it would be labelled as such.

## 9. Build plan (each milestone clickable on ratana.cloud)

- **M0: Foundations.** Auth with email and Google, MFA enrolment, organisations, memberships, audit table, `/app` shell, `/demo` untouched. *Real:* auth, tenancy, audit. *Mocked:* none.
- **M1: Solo scribe.** Self-serve solo sign-up (plan chosen, billing stubbed), consent → record with offline buffering → transcript → drafted note with sentence provenance and verification flags → resolve → sign → locked note + addendum, copy by section. *Real:* recording, storage, transcription, drafting, verification, signing, audit, audio deletion on sign. *Mocked:* card payment, registration verification (manual flag).
- **M2: Templates and outputs.** Full template set, plain-language rule editor and versions, letters, patient summary, task confirmation, entitlement limits on Free. *Mocked:* delivery of letters (download only).
- **M3: Practices.** Practice sign-up, sites, invites, seats, practice admin, usage dashboard, retention setting, registrar co-sign, assistant role, solo → practice conversion, session transfer. *Mocked:* billing charges.
- **M4: HITH-embedded.** Enable the HITH module for a practice (its own virtual ward using existing screens, scoped by org), Scribe from queue item and episode, observation citations, filing to the episode timeline, tasks into the workflow, caregiver summaries, virtual ward round. *Mocked:* devices and observations stay synthetic.
- **M5: Shared care and export seam.** org_links, shared-session visibility, DocumentReference JSON export and stubbed Best Practice/MedicalDirector adapters. *Mocked:* actual write-back.

## 10. Limits and suggestions

- **Native mobile / background recording:** mobile web stops recording when the screen locks or the app is backgrounded on iOS. Suggestion: a keep-awake prompt plus the resilient chunk queue now; a native wrapper later.
- **Telehealth system audio:** browsers cannot capture another app's audio. Tab audio works only when the call runs in a Chrome tab. Suggestion: mic plus speaker now; a desktop helper later.
- **Practice-system write-back:** Best Practice and MedicalDirector need on-premises or partner APIs. Suggestion: copy by section now, with the FHIR seam designed for later.
- **AU residency of the backend:** depends on question 1. It cannot be changed from within this project if it is not Sydney.
- **Real payments:** available through a payments integration, but stubbed per the brief.
- **Compliance:** the product can be shaped for the Privacy Act, APPs and TGA exclusion, but certification, PIA and provider DPAs sit outside the build.
