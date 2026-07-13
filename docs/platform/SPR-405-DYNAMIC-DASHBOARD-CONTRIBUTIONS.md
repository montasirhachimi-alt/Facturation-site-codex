# SPR-405 — Dynamic Dashboard Contributions

## Executive Summary

SPR-405 introduces the Dynamic Dashboard Contribution System.

The Dashboard is now a platform consumer of active module contributions. It no longer needs to know whether a widget comes from CRM, Sales, Core or future modules.

The current visual Dashboard remains unchanged.

## Contribution Architecture

The flow is:

```text
Module Registry
  ↓
Activation Engine
  ↓
Dashboard Contribution Registry
  ↓
Contribution Resolver
  ↓
Dashboard Renderer
```

Implementation lives in `src/platform/dashboard/`.

## Contribution Model

`DashboardContribution` supports:

- `id`
- `moduleId`
- `widgetId`
- `title`
- `priority`
- `order`
- `zone`
- `size`
- `status`
- `defaultVisible`
- `alphaReady`
- `renderKey`
- `metadata`

Descriptors do not store React components, services, callbacks or business data.

## Zones

Supported zones:

- `hero`
- `summary`
- `primary`
- `secondary`
- `sidebar`
- `footer`

Zones are metadata only. The current Dashboard maps existing sections to these zones.

## Registry

`DashboardContributionRegistry` supports:

- register
- register many
- lookup
- list
- list by module
- list by zone
- validation

Ordering is deterministic by priority, order and ID.

## Resolver

`resolveDashboardContributions()`:

1. reads active modules
2. filters contributions by active module ID
3. keeps only alpha-ready/default-visible active contributions
4. sorts deterministically
5. returns flat contributions and zone-grouped layout

## Current Alpha Contributions

Current Alpha contributions:

- `dashboard.hero` from `core.dashboard`
- `dashboard.business-health` from `core.dashboard`
- `dashboard.priority-center` from `crm.tasks`
- `dashboard.performance` from `sales.quotes`
- `dashboard.recent-activity` from `core.dashboard`
- `dashboard.quick-actions` from `core.dashboard`

Settings contributes nothing.

Inventory, HR, Finance and AI contribute nothing.

## Dashboard Integration

`src/app/(erp)/dashboard/page.tsx` now resolves dashboard contributions and renders by `renderKey`.

The render switch remains inside the Dashboard page because platform metadata must not import Dashboard UI components.

The visual result is intentionally unchanged.

## Validation

Validation detects:

- duplicate contribution IDs
- duplicate widget IDs
- duplicate render keys
- unknown modules
- unknown zones
- invalid priority
- missing title
- inactive widget visible by default

Runtime validation covers:

- registry validity
- duplicate widget ID rejection
- duplicate render key rejection
- unknown module rejection
- current Alpha contribution order
- Basic-style activation filtering Sales-owned contribution
- Core dashboard contributions remaining visible

Latest SPR-405 result:

- `npm run validate:runtime`: passed, 92/92 checks

## Import Safety

The platform dashboard layer does not import:

- React
- Dashboard UI components
- Prisma
- persistence repositories
- module pages
- services
- authentication
- permissions

The Dashboard page imports the resolver and maps render keys to existing UI.

## Limitations

- No user widget customization.
- No persisted dashboard layout.
- No dynamic dashboard editor.
- No feature flag engine.
- No new analytics.
- No new widgets.
- Dashboard zones are metadata-only for now.

## Next Sprint Expectations

The Platform Foundation is now ready for the next phase:

- Business Platform
- Product Catalog Foundation
- Future modules contributing dashboard widgets without editing platform registries or route guards
