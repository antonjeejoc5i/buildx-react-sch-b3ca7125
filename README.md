# React Sch

Phase 1 is a frontend-only React + TypeScript MVP for a Panelist Scheduling Tool that lets qualified panelists book study appointments immediately after completing a Decipher screener. The application is separate from Kinesis Panel Management and Decipher, and in this phase their integrations are simulated locally with seeded data rather than implemented live. Researchers configure studies, schedules, quotas, segment rules, visits, reminders and operational controls, while panelists can book, confirm, reschedule or cancel within the study rules. The tool also provides operational views for recruiters, reception staff and field managers, along with dashboards, reporting and exports based on local demo data. The intended outcome is to validate end-to-end scheduling workflows and business rules in a browser-only demonstration before any production-grade backend, live integrations or real messaging are approved and built.

## Contents

- [About](#about)
- [Features](#features)
- [Not finished yet](#not-finished-yet)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Design system](#design-system)
- [Key files](#key-files)
- [Commands](#commands)
- [Testing](#testing)
- [Deployment](#deployment)
- [Branches](#branches)
- [Further documentation](#further-documentation)

## About

### The problem

Qualified participants already exist in Kinesis / Panel Management and complete a qualification screener in Decipher, but there is currently no integrated way for them to book study appointments while quotas, segment rules, multi-visit intervals and reminders are enforced. Researchers therefore have to manage quotas, segment rules and multi-visit scheduling manually, and researchers and facility staff do not have one place to see recruitment and appointment status. This creates manual coordination effort, prevents immediate post-screener booking, and limits operational visibility across recruitment, appointments and facility activity.

### Goals

- Let qualified participants self-book appointments immediately after the screener, without a separate scheduling email.
- Enforce quotas, segment eligibility, overbooking and multi-visit interval rules automatically so researchers do not manage them by hand.
- Reduce no-shows and manual coordination through configurable reminders and self-service rescheduling and cancellation.
- Give Study Managers, Recruiters, Reception and Field Managers live visibility of recruitment status, upcoming appointments and facility activity.
- Support multiple countries, languages and time zones from one application.
- Validate end-to-end scheduling workflows entirely with local data and no server infrastructure in the Phase 1 MVP.

## Features

- **Set up browser-only React demo foundation.** Configure the React 19, TypeScript, and Vite static SPA with test tooling; no backend, API calls, authentication provider, or live integrations.
  - The app builds, typechecks, lints, and runs with the confirmed commands.
  - Core screens work after assets load with network disabled and no code performs HTTP requests.
- **Create local domain and persistence boundary.** Define TypeScript domain models, repository interfaces, IndexedDB repositories, React UI state boundaries, and deterministic fictional seed fixtures.
  - Structured records persist through IndexedDB repositories rather than feature components accessing storage directly.
  - Fixtures include fictional participants, profiles, screener attributes, facilities, studies, and demo users; missing required profile data returns a clear local error.
- **Build local-data lifecycle controls.** Create reset-to-seed, JSON export/import, confirmed local-data clearing, and persistent simulation disclosures.
  - Users can reset to deterministic seed data, export data, import valid data, and clear data only after confirmation.
  - Invalid imports preserve existing records; the app prominently states that data, permissions, audit, notifications, integrations, and concurrency are local simulations.
- **Build app shell and local role switcher.** Create the design-system application shell, accessible navigation, local role switching, scoped route guards, and current-actor context for local audit.
  - Navigation and routes change according to the selected seeded demo user's simulated study and facility scope.
  - Out-of-scope routes show an accessible denial state, and role selection is keyboard operable.
- **Build controlled facility and room data.** Create facility and room management with local controlled values, time zones, blackout dates, informational capacities, and role authorisation assignments.
  - Facilities and rooms can be maintained locally and each room belongs to a facility.
  - Room capacity is displayed as informational and never blocks a booking.
- **Build study creation and lifecycle editor.** Create the researcher study editor for facility, room, simulated Decipher project ID, booking controls, notifications, visits, and lifecycle status.
  - Researchers can save Draft studies and must select a facility, room, and simulated Decipher project before opening booking.
  - Studies support Draft, Open for Booking, Paused, Closed, and Archived; non-open studies reject new participant bookings.
- **Build recurring schedule generation.** Create schedule patterns for date ranges, weekday groups, operating windows, slot length, buffers, facility-local time, and UTC slots.
  - Patterns generate slots from date range, weekday, time window, duration, and buffer rules, including different day groups.
  - Slots store UTC timestamps while preserving facility operating times across daylight-saving changes; invalid schedules show validation without overwriting saved data.
- **Build schedule overrides and blackout handling.** Create the schedule calendar and date-level override controls, including blackout exclusion and affected-booking safeguards.
  - Overrides can change availability, time windows, slot length, buffer, and added or removed slots; blackout dates generate no availability.
  - Calendar states identify normal, override, and blackout dates; replacing an override requires confirmation and affected bookings are shown before schedule changes finalize.
- **Build schedule copying and templates.** Create schedule copy and reusable template controls for recurring patterns and override structures.
  - Researchers can copy patterns and overrides from a study or facility without copying location, quotas, or bookings.
  - Templates can be saved, edited, duplicated, archived, and applied as independent editable copies excluding location, quotas, and bookings.
- **Build multi-visit configuration.** Create visit configuration with separate visit schedules, overrides, and consecutive-visit interval rules.
  - Studies can require multiple visits, with schedules and overrides assigned per visit.
  - Same-day, exact-day, and minimum-to-maximum day-window rules are supported; invalid intervals are rejected clearly.
- **Build quota and overbooking rules.** Create combined quota configuration and calculation rules based on seeded screener and profile attributes.
  - Researchers can configure single- and multi-dimensional quota buckets with target, filled, remaining, default overbooking, and segment override values.
  - Booking evaluation identifies the applicable bucket and blocks booking above quota target or the whole-participant overbooking maximum.
- **Build slot capacity and backup-slot controls.** Create independent slot-capacity calculation and backup/floater slot management.
  - A full slot rejects booking regardless of quota or informational room capacity.
  - Backup slots may use different durations, remain unavailable to participants until promoted, and remain separate from waitlist records.
- **Build segment slot eligibility rules.** Create eligibility configuration and evaluator for alternating segments, restricted pools, AND/OR criteria, and per-slot overrides.
  - Rules can use profile and screener attributes with AND/OR logic and can apply alternating and restricted-pool mechanisms together.
  - The evaluator returns an explainable eligibility result and prevents ineligible participant availability.
- **Build participant language and time-zone controls.** Create localized participant presentation, language selection, locale formatting, and appointment time-zone display controls.
  - The participant UI supports English, French, German, Dutch, Flemish, Spanish, Portuguese (Brazil), and Hindi, defaulting to profile language.
  - Dates, times, numbers, validations, confirmations, reminders, and previews are localized; display time zone can change without altering stored UTC appointments.
- **Build simulated Decipher handoff.** Create local mock handoff routes for seeded qualified participants entering a study booking flow.
  - Qualified participants at an Open study see a localized study summary before slot selection with no network call.
  - Unqualified, missing-data, and closed-study participants see clear local denial states; active bookings open the existing appointment instead of a duplicate flow.
- **Build multi-visit booking flow and local holds.** Create participant slot selection, local temporary holds, visit-by-visit selection, review, and confirmation revalidation.
  - Only primary slots passing study state, eligibility, capacity, quota, overbooking, and interval rules are shown.
  - Multi-visit bookings require every visit in one continuous flow; confirmation revalidates all rules and gives actionable alternatives or waitlist guidance on failure.
- **Build booking preference and confirmation.** Create reminder preference selection, editable confirmation templates, and localized booking confirmation.
  - Participants can keep their profile default or choose email, SMS, or both without re-entering seeded contact data.
  - Confirmation includes all visits, selected-time-zone appointment times, location, enabled management links, and valid dynamic template content.
- **Build self-service rescheduling and cancellation.** Create participant appointment management with study controls, cutoffs, limits, and multi-visit rules.
  - Rescheduling and cancellation honor study enablement and configured cutoffs; rescheduling defaults to two participant changes and revalidates booking rules.
  - Multi-visit changes count once and first attempt dependent date shifts; self-service cancellation requires confirmation and cancels the complete study participation.
- **Build waitlist and promotion.** Create full-slot waitlist enrollment and FIFO local promotion with revalidation.
  - Eligible participants can join an enabled waitlist for a full slot without treating backup slots as waitlist entries.
  - When capacity opens, FIFO entries are rechecked against eligibility, quotas, and restrictions; only valid entries become bookings and receive a local promotion notification.
- **Build reminder and event notification configuration.** Create per-study reminder cadence and event template settings, plus local reminder and notification record generation.
  - Researchers can add, edit, and remove reminder timings and templates; due reminders are skipped at booking time.
  - Cancellation removes future reminders, rescheduling regenerates them, and reschedule, cancellation, and waitlist promotion create event previews for affected visits.
- **Build local notification outbox.** Create simulated email/SMS outbox previews, delivery events, and delivery-failure review.
  - Outbox previews reflect booked channels and create no real delivery, network call, or background work.
  - Simulated delivery failures are stored and visibly flagged without silently changing channels.
- **Build recruitment dashboard.** Create the per-study local recruitment dashboard and scoped drill-downs.
  - Dashboard shows quota progress, scheduled participants and slots, cancellations, no-shows, segment slot fill, and quota/slot/participant drill-downs.
  - All metrics are visibly labelled as local demonstration calculations and inaccessible scopes remain hidden.
- **Build researcher booking operations and audit.** Create authorised researcher-assisted booking, rescheduling, cancellation, restriction overrides, and local audit records.
  - Authorised researchers can operate only within simulated scope and normal booking rules apply before any override.
  - Overrides require warning acknowledgement and a reason; local audit events store actor, timestamp, action, entity references, before/after values, and reason.
- **Build bulk booking operations.** Create scoped bulk reschedule, cancellation, and notification actions with previews, conflict handling, confirmation, and linked audit records.
  - Bulk actions preview affected records and conflicts and cannot run until conflicts are resolved and confirmation is given.
  - A bulk audit ID is created and linked to every affected booking audit event.
- **Build reception and facility operations views.** Create day-of check-in/no-show operations and facility upcoming-study planning views.
  - Reception and field users see only authorized facility and room appointments with minimum participant data and can check in or mark no-shows with an affects-standing placeholder.
  - Field managers can filter authorized upcoming studies by facility, date range, study, and room.
- **Build local reporting metrics.** Create reusable calculations for fill rate, no-show rate, recruitment status, and time-to-fill.
  - Fill rate remains separate from attendance; no-show rate excludes cancelled, rescheduled-away, and future appointments.
  - Time-to-fill runs from opening until original quota targets are met and does not extend for over-target bookings; all metrics carry local-data disclosure.
- **Build reports, exports, and upcoming appointments list.** Create recruitment reporting, scoped CSV/Excel-compatible exports, and filterable future appointment table/list.
  - Recruitment reports use dashboard calculations and export current filtered or all in-scope local records with local-data disclosure.
  - Future appointments support researcher, study, facility, and date-range filters, respect scope, and provide accessible empty states without requiring a calendar view.
- **Make participant screens responsive and accessible.** Enhance participant booking and management components using existing design-system tokens and WCAG 2.1 AA practices.
  - Participant flows work at mobile widths, zoom, and keyboard-only navigation with visible focus.
  - Controls, validation, live updates, statuses, and slot availability have accessible names and non-colour-only indicators.
- **Add automated unit and UI coverage.** Expand Vitest coverage across local domain rules, persistence, role views, error states, and key feature workflows.
  - Tests cover eligibility, quotas, overbooking, intervals, daylight saving, persistence, roles, empty/error states, schedules, waitlists, language, accessibility, and local-data workflows.
  - Lint, typecheck, build, and test commands pass without network services or real personal data.

## Not finished yet

These planned stories did not pass BuildX's checks, so they are not in the code:

- Run end-to-end local scheduling journeys

## Tech stack

- Frontend: React (Vite) 19 (TypeScript)
- Auth: No production authentication; local demonstration role switcher and simulated scoped permissions only.

## Project structure

```
.github/ (1 file)
  workflows/ (1 file)
docs/ (1 file)
public/ (1 file)
src/ (137 files)
  design-system/ (3 files)
  domain/ (2 files)
  features/ (123 files)
  fixtures/ (1 file)
  infrastructure/ (3 files)
  test/ (1 file)
.dockerignore
.env.example
.gitignore
.nvmrc
Dockerfile
README.md
docker-compose.yml
eslint.config.js
index.html
package-lock.json
package.json
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
```

## Prerequisites

- Docker, to run the whole app.
- To run without Docker, the same runtime as CI and the containers: `node:24-bookworm`.

## Getting started

### With Docker

With Docker running, from the repository root:

```
docker compose up --build
```

Then open http://localhost:8080. Optional settings go in `.env`. Stop with `docker compose down`, which also discards the local data. The services are defined in `docker-compose.yml`.

### Without Docker

1. Install the dependencies: `npm ci`
2. Start the dev server: `npm run dev -- --host 0.0.0.0` (port 5173)

## Design system

Every screen follows the company design system. The rules and every token are in [docs/design-system.md](docs/design-system.md), and the variables are in `src/design-system`, loaded on every page.

Use its variables for colours, fonts, font sizes, spacing and corners. Do not write literal values or edit that folder by hand.

## Key files

- `index.html`: Provides browser metadata for the static scheduling demo.
- `package.json`: Scaffold json file
- `package-lock.json`: Scaffold json file
- `src/App.tsx`: Wires the local notification outbox into the browser-only demonstration.
- `src/domain/models.ts`: Defines scheduling domain models, including consecutive-visit interval rules for multi-visit studies.
- `src/domain/repositories.ts`: Scaffold ts file
- `src/features/appointment-management/AppointmentManagement.css`: Scaffold css file
- `src/features/appointment-management/appointmentManagementData.ts`: Scaffold ts file
- `src/features/appointment-management/AppointmentManagement.tsx`: Scaffold tsx file
- `src/features/app-shell/ActorContext.ts`: Defines the current simulated actor context.
- `src/features/app-shell/ActorProvider.tsx`: Provides local selection and lookup of the simulated actor.
- `src/features/app-shell/AppShell.css`: Styles the responsive application shell using design-system tokens.
- `src/features/app-shell/AppShell.tsx`: Wires bulk booking operations into authorized study detail routes.
- `src/features/app-shell/routes.ts`: Adds the authorised reports and appointments route to application navigation.
- `src/features/app-shell/useCurrentActor.ts`: Exposes the selected simulated actor to application features.
- `src/features/booking-confirmation/BookingConfirmation.css`: Styles the confirmation content using design-system tokens.
- `src/features/booking-confirmation/bookingConfirmationData.ts`: Builds validated localized booking confirmations and resolves participant reminder delivery preferences.
- `src/features/booking-confirmation/BookingConfirmation.tsx`: Renders a participant-facing booking confirmation with all visits, location, reminders, and enabled links.
- `src/features/booking-confirmation/ConfirmationTemplateEditor.css`: Styles the editable confirmation-template controls with design-system tokens.
- `src/features/booking-confirmation/ConfirmationTemplateEditor.tsx`: Provides the study-scoped editor for confirmation template content and management-link settings.
- `src/features/booking-flow/BookingFlow.css`: Styles the booking flow using design-system tokens.
- `src/features/booking-flow/bookingFlowData.ts`: Evaluates participant booking eligibility, capacity, quota, and visit interval rules.
- `src/features/booking-flow/BookingFlow.tsx`: Renders accessible, explicitly named available-slot controls in the participant booking flow.
- `src/features/bulk-booking-operations/BulkBookingOperations.css`: Styles the bulk booking operations controls with design-system tokens.
- `src/features/bulk-booking-operations/bulkBookingOperationsData.ts`: Builds scoped bulk booking previews, conflict checks, changes, notifications, and linked audit events.
- `src/features/bulk-booking-operations/BulkBookingOperations.tsx`: Renders scoped bulk booking selection, previews, conflict resolution controls, and explicit confirmation.
- `src/features/decipher-handoff/DecipherHandoff.css`: Uses valid design-system spacing tokens for responsive participant handoff cards.
- `src/features/decipher-handoff/decipherHandoffData.ts`: Resolves local Decipher handoff eligibility and provides localized display copy.
- `src/features/decipher-handoff/DecipherHandoffRoute.tsx`: Scaffold tsx file
- `src/features/decipher-handoff/DecipherHandoff.tsx`: Scaffold tsx file
- `src/features/demo-state/DemoStateContext.ts`: Extends the demo-state contract with persisted bulk booking operation support.
- `src/features/demo-state/DemoStateProvider.tsx`: Persists bulk booking changes, notifications, and audit events through existing local repositories.
- `src/features/demo-state/useDemoState.ts`: Provides feature components with access to the demo state boundary.
- `src/features/facility-management/FacilityManagement.css`: Styles the facility management feature using design-system tokens.
- `src/features/facility-management/facilityManagementData.ts`: Builds and validates locally controlled facility and room records.
- `src/features/facility-management/FacilityManagement.tsx`: Renders local facility details, role assignments, and facility-scoped room maintenance.
- `src/features/facility-operations/FacilityOperations.css`: Styles facility operations screens with approved design-system tokens.
- `src/features/facility-operations/facilityOperationsData.ts`: Builds authorized reception and facility-planning records and attendance updates.
- `src/features/facility-operations/FacilityPlanning.tsx`: Renders field-manager filters for authorized upcoming facility studies.
- `src/features/facility-operations/ReceptionOperations.tsx`: Renders authorized reception and field attendance operations.
- and 48 more

## Commands

### Frontend

| Step       | Command                                                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| Install    | `npm ci`                                                                                |
| Format     | `npx --yes prettier@3 --write --ignore-unknown . '!**/package-lock.json' '!.github/**'` |
| Build      | `npm run build`                                                                         |
| Dev server | `npm run dev -- --host 0.0.0.0`                                                         |
| Test       | `npx vitest run`                                                                        |
| Lint       | `npm run lint`                                                                          |
| Type check | `npx tsc -b`                                                                            |

## Testing

- Frontend: `npx vitest run`, using Vitest with React Testing Library

CI in `.github/workflows/ci.yml` checks formatting, lint, types, tests and the production build on every push and pull request.

## Deployment

- Frontend: build the `Dockerfile` in the repository root.

## Branches

- `main`: code approved in review.
- `integration`: every finished story, waiting for review.
- `story/*`: one branch for each story.

## Further documentation

- [docs/design-system.md](docs/design-system.md)

_Generated by BuildX from the project's plan and code, and rewritten when each build finishes. Keep lasting notes in `docs/`, which is linked from here._
