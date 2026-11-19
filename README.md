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

## Not finished yet

These planned stories did not pass BuildX's checks, so they are not in the code:

- Build study creation and lifecycle editor
- Build recurring schedule generation
- Build schedule overrides and blackout handling
- Build schedule copying and templates
- Build multi-visit configuration
- Build quota and overbooking rules
- Build slot capacity and backup-slot controls
- Build segment slot eligibility rules
- Build participant language and time-zone controls
- Build simulated Decipher handoff
- Build multi-visit booking flow and local holds
- Build booking preference and confirmation
- Build self-service rescheduling and cancellation
- Build waitlist and promotion
- Build reminder and event notification configuration
- Build local notification outbox
- Build recruitment dashboard
- Build researcher booking operations and audit
- Build bulk booking operations
- Build reception and facility operations views
- Build local reporting metrics
- Build reports, exports, and upcoming appointments list
- Make participant screens responsive and accessible
- Add automated unit and UI coverage
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
src/ (35 files)
  design-system/ (3 files)
  domain/ (2 files)
  features/ (23 files)
  fixtures/ (1 file)
  infrastructure/ (3 files)
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
- `src/App.tsx`: Wires the local demo state provider to the application shell.
- `src/domain/models.ts`: Defines scheduling domain models and required participant profile validation.
- `src/domain/repositories.ts`: Defines the repository interfaces used by scheduling UI state.
- `src/features/app-shell/ActorContext.ts`: Defines the current simulated actor context.
- `src/features/app-shell/ActorProvider.tsx`: Provides local selection and lookup of the simulated actor.
- `src/features/app-shell/AppShell.css`: Styles the responsive application shell using design-system tokens.
- `src/features/app-shell/AppShell.tsx`: Wires authorised facility routes to the new facility management feature.
- `src/features/app-shell/routes.ts`: Defines hash routes and simulated facility and study scope authorization.
- `src/features/app-shell/useCurrentActor.ts`: Exposes the selected simulated actor to application features.
- `src/features/demo-state/DemoStateContext.ts`: Adds facility and room persistence actions to the local demo-state contract.
- `src/features/demo-state/DemoStateProvider.tsx`: Persists locally maintained facilities and rooms through the existing IndexedDB boundary.
- `src/features/demo-state/useDemoState.ts`: Provides feature components with access to the demo state boundary.
- `src/features/facility-management/FacilityManagement.css`: Styles the facility management feature using design-system tokens.
- `src/features/facility-management/facilityManagementData.ts`: Builds and validates locally controlled facility and room records.
- `src/features/facility-management/FacilityManagement.tsx`: Renders local facility details, role assignments, and facility-scoped room maintenance.
- `src/features/local-data/lifecycleData.ts`: Validates and persists local JSON export, import, reset, and clear operations.
- `src/features/local-data/LocalDataControls.css`: Styles the local-data controls using design-system tokens.
- `src/features/local-data/LocalDataControls.tsx`: Renders local-data lifecycle controls and safely reads uploaded JSON before importing it.
- `src/features/welcome/WelcomeScreen.css`: Styles the welcome screen using design-system tokens.
- `src/features/welcome/WelcomeScreen.tsx`: Renders the static browser-only demo welcome screen.
- `src/fixtures/demoFixtures.ts`: Provides deterministic fictional scheduling records for all domain collections.
- `src/infrastructure/indexedDbRepository.ts`: Implements validated generic persistence with the browser IndexedDB API.
- `src/infrastructure/schedulingRepositories.ts`: Creates the complete set of named IndexedDB scheduling repositories.
- `vite.config.ts`: Configures Vite and the jsdom environment used by component tests.

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
