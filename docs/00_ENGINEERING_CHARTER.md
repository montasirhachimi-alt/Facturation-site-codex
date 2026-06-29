# HicoPilot Engineering Charter

## Purpose

Define the mandatory engineering rules for every HicoPilot task.

## Core Principles

### Security by Design

Security must be considered before implementation. Authentication, permissions, tenant isolation and data protection must never be treated as optional details.

### Architecture First

New work should fit the existing architecture. Create foundations before adding large features.

### Business Logic Separation

Business rules must remain separate from presentation code. UI components should not become the source of truth for business decisions.

### Reusable Components

Prefer shared, reusable components and utilities over duplicated implementations.

### Clean TypeScript

Types should be explicit, readable and reusable. Avoid `any` unless there is a clear and documented reason.

### No Duplicated Code

Before creating new logic, verify whether an equivalent component, helper or pattern already exists.

### Backward Compatibility

Preserve existing functionality. Do not remove, rename or break working behavior without explicit approval.

### Small Incremental Tasks

Large changes must be split into small, reviewable steps. Each task should have a clear scope and measurable outcome.

### Validation Before Completion

Every completed task must be validated before delivery.

### Build Must Always Pass

`npm run build` must pass before a task is considered complete.

### Typecheck Must Always Pass

`npm run typecheck` must pass before a task is considered complete.

## Development Workflow

1. Inspect the current implementation.
2. Reuse existing patterns.
3. Implement the smallest safe change.
4. Validate typecheck and build.
5. Summarize changes and risks.

## Protected Areas

Do not modify database schema, Prisma models, authentication, RBAC, routing, or business logic unless the task explicitly requires it.
