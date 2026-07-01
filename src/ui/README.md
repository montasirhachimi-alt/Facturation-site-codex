# HicoPilot Enterprise UI Framework

## Purpose

`src/ui/` contains reusable enterprise UI primitives for business modules. It is presentation-only and must not own business logic, persistence, Prisma access or runtime orchestration.

## Layers

- `layout/`: entity page layouts and headers.
- `toolbar/`: search and toolbar primitives.
- `tables/`: generic entity table, pagination and action buttons.
- `cards/`: metric and section cards.
- `dialogs/`: reusable dialog shell.
- `forms/`: form primitives.
- `filters/`: filter summaries and future filter panels.
- `feedback/`: empty, loading and error states.
- `hooks/`: UI-only hooks.
- `types/`: generic UI contracts.

## Rules

- Business modules provide data and actions.
- The UI framework renders those contracts.
- Do not import Prisma, runtime engines or domain services here.
- Keep components composable and strongly typed.

