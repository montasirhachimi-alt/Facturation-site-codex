# HicoPilot Coding Standards

## Folder Organization

| Folder | Purpose |
| --- | --- |
| `src/app/` | Next.js routes and page composition. |
| `src/components/` | Current UI components and module components. |
| `src/core/` | Core Engines and platform primitives. |
| `src/services/` | Application Services that orchestrate engines. |
| `src/context/` | React contexts. |
| `src/providers/` | React providers. |
| `src/hooks/` | Public React hooks. |
| `src/preferences/` | Preferences Runtime foundation. |
| `src/widgets/` | Widget Runtime foundation. |
| `src/workspace/` | Workspace public exports. |
| `src/lib/` | Existing business helpers, auth helpers, demo data and utilities. |
| `docs/` | Official project documentation. |

## Naming Conventions

- React components use `PascalCase`.
- Hooks start with `use`.
- Services use `PascalCase` class names with `Service` suffix.
- Types use clear domain names and avoid vague names.
- Adapter files use `*-adapter.ts`.
- Runtime files use `*-runtime-*`.

## TypeScript Conventions

- Prefer explicit exported types for public APIs.
- Avoid `any`.
- Use discriminated unions where useful.
- Keep type definitions close to the owning module.
- Re-export only public APIs from `index.ts`.

## Service Conventions

- Services orchestrate Core Engines.
- Services may compose multiple engines.
- Services should expose small, typed methods.
- Services should not import React components.
- Business logic belongs in services, not UI.

## Context Conventions

- Context exposes state and actions.
- Context delegates operations to services.
- Context must not duplicate service logic.
- Context values must be memoized.
- Context actions must be stable callbacks.

## Runtime Conventions

- Runtime consumes Context.
- Runtime prepares execution state for UI.
- Runtime must not fetch duplicate platform state.
- Runtime should expose loading, error, visibility and permission foundations.

## Dependency Rules

Follow this direction:

Core Engines → Application Services → Context → Runtime → UI

Avoid reverse dependencies.

## Imports and Exports

- Prefer path aliases such as `@/services`.
- Use local relative imports inside tightly scoped folders.
- Export public APIs from folder-level `index.ts`.
- Do not expose internal helpers unless they are needed by other layers.

## Error Handling

- Do not use `alert()`.
- Avoid console spam.
- Surface errors through context or service result objects.
- Keep user-facing error handling separate from platform state.

## Performance

- Memoize context values.
- Memoize runtime values.
- Avoid creating new service instances inside repeated renders unless isolated by refs.
- Avoid duplicated requests or duplicated state.

## Documentation Style

- Markdown only.
- Use clear headings and concise tables.
- Document actual implementation, not aspirational features.
- Update sprint docs when platform behavior changes.
