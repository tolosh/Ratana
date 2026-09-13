# Lantern Full MVP Prototype Plan

## Goal
Build a demonstrable, non-clinical Hospital in the Home prototype that makes a synthetic 5,000-bed network operationally legible and supports the complete journey from onboarding and admission through monitoring, intervention, transfer, discharge, and governance.

The prototype will follow the attached Lantern design system exactly and clearly label all patients, devices, scores, messages, and integrations as synthetic or simulated.

## Product structure

### Shared application shell
- Create the Lantern clinician console with the supplied mark, compact navigation, role/shift context, region and site filters, synthetic-data status, and day/night themes.
- Provide role switching between seeded demo users so every experience is demonstrable without production identity integration.
- Preserve network, region, team, diagnosis, and patient context as users drill through the application.

### Core screens
1. **Network command** — capacity, occupancy, admissions, likely discharges, transfers, acuity, diagnosis mix, device concerns, workload forecasts, and aggregated network heatmap.
2. **Clinician work queue** — dense, filterable priority table with clinical status, reason, observations, freshness, task, due time, owner, and cohort summary.
3. **Patient clinical state** — identity and pathway context, risk explanation, vitals, trends, symptoms, devices, care plan, tasks, interventions, and escalation actions.
4. **Alert detail** — source readings, score components, quality concerns, ownership, timer, recommended actions, linked history, and mandatory disposition.
5. **Escalation handover** — structured SBAR-style packet, safety checklist, transport details, timeline, simulated export/print, and mock FHIR view.
6. **Patient and caregiver app** — Lamplight mobile experience for daily tasks, observation capture, symptoms, care-team response, and persistent help access.
7. **Observation capture** — accessible guided device/manual flow with confirmation, repeat measurement, symptoms, and receipt status.
8. **Scenario control** — run, pause, reset, accelerate, and inject events into named patient and background network simulations.
9. **Governance dashboard** — alert performance, workload, device reliability, escalation, onboarding, access, rule versions, and audit metrics.
10. **User management** — invitations, role templates, organizations, regions, teams, zones, shifts, onboarding, proxy access, expiry, suspension, and access audit.
11. **Emergency handover portal** — patient-specific, time-limited transfer packet with acknowledgement, response status, expiry countdown, and minimum necessary information.
12. **Admission and discharge flows** — pathway selection, safety checklist, device kit, monitoring plan, caregiver setup, advisory discharge readiness, and clinician confirmation.

## Interactive demo journeys
- Seed the specified 5,000-bed distribution across regions, diagnosis families, acuity states, pathways, teams, and device conditions.
- Include the five named drill-down patients and seven scripted scenarios from the specification.
- Make the primary respiratory deterioration story fully interactive: trigger event, network update, queue reprioritisation, alert ownership, repeat observations, physician escalation, transfer handover, emergency acknowledgement, and audit trail.
- Implement distinct end-to-end flows for heart-failure drift, post-operative infection concern, missing data/device failure, false low-SpO₂ artifact, patient help request, full user onboarding, and discharge readiness.
- Support resettable deterministic demo state so the presentation can be repeated reliably.

## Clinical logic and safeguards
- Implement the illustrative 0–100 composite score using physiology, trend, symptoms, pathway modifier, data quality/missingness, and context.
- Label it as prototype-only and “NEWS2-like”; show component contributions, rule version, source data, confidence in words, and missing inputs.
- Keep clinical status and machine inference separate: machine concerns use Iris and sit beside—not over—Stable, Clinical review, Rapid response, or No data.
- Never allow machine output to diagnose, prescribe, close clinical work, dismiss escalation, or communicate independently with a patient.
- Require owner, due time, acknowledgement, notes, outcome, escalation decision, and disposition across alerts and interventions.
- Treat No data as a first-class safety state with a distinct hatched treatment and outreach workflow.
- Make rapid-response alerts persistent and acknowledge-only, with identity and timestamp recorded.

## Lantern design-system implementation
- Port the supplied semantic tokens, including Harbour, Lamplight, Iris, clinical signal colours, light/dark surfaces, spacing, radii, target sizes, and motion durations.
- Load Newsreader, IBM Plex Sans, and IBM Plex Mono in their prescribed roles.
- Enforce the two-surface model: cool, dense clinician screens and warm, generous patient/carer screens.
- Reserve green, amber, red, and grey strictly for clinical states; pair each with its required glyph and label.
- Reserve Iris strictly for inferred, ranked, summarised, transcribed, or drafted machine output, always with provenance.
- Use hairline rules rather than decorative shadows, compact 40px clinical rows, and 44px clinician / 56px patient targets.
- Use motion only to explain state changes; never animate clinical values, flash, pulse, or strobe.
- Implement automatic night-shift styling with a user override and full reduced-motion support.
- Apply the three voice registers and banned-language rules across clinician, patient, and system copy.

## Data, access, and simulation
- Enable Lovable Cloud for persistent synthetic records, role-specific demo accounts, audit history, and repeatable scenario state.
- Keep roles in a dedicated role-assignment model and enforce access by role, organization, region, team, service zone, patient relationship, and expiry.
- Seed literal synthetic data for the complete default network and named scenarios; never generate or import real patient identifiers.
- Provide simulated invitations, identity checks, caregiver consent, staff credentials, emergency access, notifications, devices, and FHIR resources.
- Build FHIR-shaped Patient, Encounter, Observation, CarePlan, Task, Device, and handover representations for inspection during the demo.
- Record sensitive reads, state changes, score recalculations, rule versions, alert actions, interventions, role changes, proxy access, emergency access, and exports.

## Accessibility and responsive behaviour
- Target WCAG 2.2 AA throughout and AAA contrast for patient-facing body text.
- Support keyboard-only console operation, visible focus, screen-reader status announcements, 200% text scaling, and reduced motion.
- Keep escalation reachable within two keyboard actions in the console and continuously visible in the patient app.
- Test clinician screens on desktop and tablet widths; test patient and emergency experiences down to 320–375px without horizontal scrolling.
- Avoid drag-only, long-press-only, flashing, and timed interactions that penalise slow input.

## Validation and completion criteria
- Verify every navigation target and role-specific landing experience.
- Verify the 5,000-bed aggregates match seeded totals and update when scenarios run.
- Verify every urgent/rapid alert has an explanation, provenance, owner, due time, acknowledgement, and disposition.
- Verify missing data is never represented as Stable and low-quality artifact requests confirmation rather than transfer.
- Verify patient, caregiver, workforce admin, operations, device support, governance, and emergency users cannot access information outside their scope.
- Verify emergency access expires and all views/status changes appear in audit history.
- Verify the main demo journey completes without developer intervention and can be reset.
- Check all routes for unique Lantern metadata, all major desktop/mobile views visually, and the final preview for build, runtime, console, network, accessibility, and layout errors.

## Prototype boundaries shown in-product
- Demonstration only; not a certified medical product or live patient safety system.
- Synthetic patients, observations, identities, devices, alerts, and integrations only.
- No autonomous diagnosis or treatment, direct prescribing, production EHR writes, clinical validation claims, live emergency integration, or replacement of clinician judgement.
