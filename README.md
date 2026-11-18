# React Sch

Phase 1 is a frontend-only React + TypeScript MVP for a Panelist Scheduling Tool that lets qualified panelists book study appointments immediately after completing a Decipher screener. The application is separate from Kinesis Panel Management and Decipher, and in this phase their integrations are simulated locally with seeded data rather than implemented live. Researchers configure studies, schedules, quotas, segment rules, visits, reminders and operational controls, while panelists can book, confirm, reschedule or cancel within the study rules. The tool also provides operational views for recruiters, reception staff and field managers, along with dashboards, reporting and exports based on local demo data. The intended outcome is to validate end-to-end scheduling workflows and business rules in a browser-only demonstration before any production-grade backend, live integrations or real messaging are approved and built.

## Contents

- [About](#about)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Design system](#design-system)
- [Commands](#commands)
- [Testing](#testing)
- [Deployment](#deployment)
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

## Tech stack

- Frontend: React (Vite) 19 (TypeScript)
- Auth: No production authentication; local demonstration role switcher and simulated scoped permissions only.

## Project structure

- `frontend/src/`
- `frontend/src/components/`
- `frontend/src/api/`
- `frontend/public/`

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

## Further documentation

- [docs/design-system.md](docs/design-system.md)

_Generated by BuildX from the project's plan and code, and rewritten when each build finishes. Keep lasting notes in `docs/`, which is linked from here._
