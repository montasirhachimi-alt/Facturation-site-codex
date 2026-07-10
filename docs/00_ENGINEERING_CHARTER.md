# HicoPilot Engineering Charter

## Purpose

This charter defines the mandatory engineering rules for HicoPilot. Every implementation, refactor, bug fix, UI change or documentation update must follow these rules.

## Engineering Philosophy

HicoPilot is a business operating system, not a collection of isolated ERP pages. The product must evolve through stable platform foundations before visible features are expanded.

| Principle | Rule |
| --- | --- |
| Platform First | Build shared platform capabilities before duplicating module-level behavior. |
| Architecture Before Features | New features must fit the existing architecture and dependency direction. |
| Services Before UI | Business orchestration belongs in services before UI consumes it. |
| Registry as Single Source of Truth | Module definitions must come from the Core Registry where possible. |
| Business Logic inside Services | Components, contexts and runtimes must not become business logic owners. |
| Context Contains No Business Logic | React Context exposes state and delegates operations to services. |
| Runtime Consumes Context | Runtime layers prepare execution context for UI surfaces. |
| UI Consumes Runtime | UI components should receive prepared runtime data instead of assembling platform state themselves. |
| AI Respects Permissions | Future AI features must only operate inside permitted user and workspace boundaries. |
| Incremental Development | Prefer small, validated, reversible changes. |
| Backward Compatibility | Existing behavior must remain stable unless explicitly changed. |
| Strong Typing | TypeScript types should be explicit, reusable and narrow. |
| Modular Architecture | Engines, services, contexts, runtimes and UI must remain independently understandable. |
| Enterprise Coding Practices | Favor maintainability, observability, security and predictable validation. |
| French-First UI | Every new visible UI element must follow `docs/08_LOCALIZATION_GUIDE.md`. Mixed-language UI is not allowed. |

## Protected Areas

Do not modify database schema, Prisma models, routes, authentication, RBAC, permissions or business logic unless the sprint explicitly requires it.

## Required Workflow

1. Read the current documentation.
2. Inspect the repository before making changes.
3. Reuse existing engines, services and components.
4. Implement the smallest safe change.
5. Validate with `npm run typecheck`.
6. Validate with `npm run build`.
7. Document the result and remaining risks.

## Local Development Runtime Policy

Next.js development runtime caches can occasionally keep stale module graphs after structural import changes. This may surface locally as runtime errors such as:

- `__webpack_modules__[moduleId] is not a function`
- `Cannot find module './xxxx.js'`

These errors can appear even when the implementation is correct and `npm run validate:runtime`, `npm run typecheck` and `npm run build` all pass.

After structural changes such as new providers, new registries, new hooks, import graph refactoring, barrel export changes or client/server boundary changes, developers must first perform a clean local runtime test:

1. Stop the development server.
2. Delete `.next`.
3. Run `npm run dev`.
4. Re-test the affected routes.

Only investigate the error as an implementation bug if it still exists after this clean runtime test.

## Definition of Done

A task is complete only when:

- Existing functionality still works.
- No forbidden layer was modified.
- Typecheck passes.
- Build passes.
- Documentation remains accurate.
- Risks are clearly reported.
