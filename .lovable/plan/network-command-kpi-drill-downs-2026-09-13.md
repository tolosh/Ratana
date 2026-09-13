# Network Command KPI Drill-downs

## Goal
Turn all five bottom dashboard cards into keyboard-accessible entry points for the operational work behind each metric.

## What will change
- Make Admissions pending, Transfers in progress, Device concerns, Service pressure, and Workload forecast fully clickable with clear focus, hover, pressed, and chevron cues.
- Preserve the current command context and provide a breadcrumb back to Network command.
- Add a dedicated in-app view for each metric with matching totals, summary measures, filters, responsive worklists or matrices, detail context, and safe prototype actions.
- Support the ticket’s direct sub-filters: first observations, handover analytics, contact-required devices, staffing headroom, and 4/8/24-hour forecast horizons.
- Record card opens, filter changes, and action clicks in the prototype audit history shown in Governance.
- Keep device resolution separate from clinical alert resolution and retain role restrictions for patient/caregiver views.

## Technical details
- Extend the existing demo view state rather than adding public website routes, preserving the current single-console experience.
- Use existing semantic tokens, button controls, clinical state treatments, and responsive table patterns.
- Validate every card using pointer and keyboard input at desktop and mobile widths, confirm totals and back-navigation, then publish the completed release.
