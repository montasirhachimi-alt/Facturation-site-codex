# SPR-401 — Module Registry Foundation

## Executive Summary

SPR-401 introduces a platform-owned Module Registry foundation for BOSIACO's future Modular Editions Platform.

The registry describes functional areas through lightweight, deterministic metadata. It does not activate modules, does not replace the sidebar, does not change Command Center behavior and does not re-expose hidden modules.

Registration does not equal activation.

## Location

Implementation lives in:

- `src/platform/modules/module.types.ts`
- `src/platform/modules/module.constants.ts`
- `src/platform/modules/module.registry.ts`
- `src/platform/modules/module.utils.ts`
- `src/platform/modules/module.descriptors.ts`
- `src/platform/modules/index.ts`

## Module ID Convention

Module IDs are stable technical identifiers and must not use translated labels.

Convention:

```text
<domain>.<capability>
```

Examples:

- `core.dashboard`
- `core.settings`
- `crm.companies`
- `crm.contacts`
- `sales.quotes`
- `sales.invoices`
- `inventory.stock`
- `hr.employees`

IDs must remain stable even when UI labels change.

## Descriptor Schema

Each descriptor can describe:

- identity: `id`, `name`, `shortName`, `description`
- organization: `category`, `order`
- lifecycle: `status`, `version`, `alphaReady`, `hidden`, `defaultEnabled`
- presentation metadata: `iconKey`, `route`
- dependency metadata: `dependencies`, `optionalDependencies`
- future capability metadata: `features`
- future sidebar metadata: `navigation`
- future Command Center metadata: `commandCenter`
- future dashboard metadata: `dashboard`

Descriptors intentionally do not store:

- React components
- instantiated services
- Prisma clients
- route modules
- large datasets
- UI callbacks

## Registry API

The `ModuleRegistry` supports:

- `register(descriptor)`
- `registerMany(descriptors)`
- `get(id)`
- `has(id)`
- `list()`
- `listByCategory(category)`
- `listAlphaReady()`
- `listVisible()`
- `validate()`

Registry ordering is deterministic by `order`, then `id`.

## Validation

Validation detects:

- duplicate module IDs
- duplicate routes
- hidden modules marked `defaultEnabled`
- invalid statuses
- missing user-facing labels
- self-dependencies
- unknown dependencies
- circular dependencies

The validation result is structured and does not require production crashes from optional planning metadata.

## Current Alpha Modules

Visible Alpha descriptors:

- `core.dashboard`
- `core.settings`
- `crm.overview`
- `crm.companies`
- `crm.contacts`
- `crm.meetings`
- `crm.tasks`
- `crm.notes`
- `sales.quotes`
- `sales.invoices`
- `sales.payments`

Alpha platform foundations registered as hidden metadata:

- `platform.command-center`
- `platform.keyboard`
- `platform.persistence`

These platform modules describe real foundations, but they are not sidebar destinations.

## Hidden and Planned Modules

Hidden or planned descriptors include:

- `crm.opportunities`
- `sales.products`
- `inventory.stock`
- `purchasing.orders`
- `purchasing.suppliers`
- `finance.cash`
- `finance.reports`
- `hr.employees`
- `platform.notifications`
- `platform.audit`
- `ai.assistant`

All hidden/planned modules use:

- `hidden: true`
- `defaultEnabled: false`
- `alphaReady: false`

This prevents the registry from re-exposing preview-era modules.

## Dependency Metadata

Dependencies are descriptive only in SPR-401.

Examples:

- `sales.quotes` depends on `crm.companies`, `crm.contacts` and `platform.persistence`.
- `sales.invoices` depends on `sales.quotes`, `crm.companies` and `platform.persistence`.
- `sales.payments` depends on `sales.invoices`, `crm.companies` and `platform.persistence`.
- CRM activity modules depend on `crm.companies` and `platform.persistence`.

No automatic activation is implemented.

## Future Consumers

Future sprints may use this registry to power:

- Edition definitions
- module activation
- sidebar filtering
- dashboard contribution discovery
- Command Center filtering
- licensing
- dependency management
- future module packaging

SPR-401 only establishes the metadata and validation layer.

## Import Safety

The registry is client-safe and dependency-light.

It does not import:

- CRM or Sales UI
- server persistence
- Prisma
- Next.js route modules
- browser globals

The intended dependency direction is:

```text
module types
  ↓
module descriptors
  ↓
module registry
  ↓
future consumers
```

## Validation Results

Runtime validation now includes focused Module Registry checks:

- expected Alpha modules are registered
- hidden future modules stay hidden
- duplicate IDs are rejected
- unknown dependencies are reported
- circular dependencies are reported
- deterministic ordering is preserved

Latest validation during SPR-401:

- `npm run validate:runtime`: passed, 80/80 checks

## Limitations

- The registry is not yet used to render the Sidebar.
- The registry is not yet used to filter Command Center providers.
- The registry does not implement Editions, licensing or activation.
- The registry does not persist module activation state.
- Hidden/planned modules remain code-level future metadata only.
