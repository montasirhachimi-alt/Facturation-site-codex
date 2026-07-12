# SPR-402 — Module Activation Engine

## Executive Summary

SPR-402 introduces the Module Activation Engine for BOSIACO's Modular Editions Platform.

SPR-401 described what modules exist. SPR-402 determines which modules are available for the current profile.

Registration describes existence. Activation determines availability.

No visible product behavior changed in this sprint.

## Architecture

Implementation lives in `src/platform/modules/`:

- `module-activation.types.ts`
- `module-activation.defaults.ts`
- `module-activation.engine.ts`
- `module-activation.utils.ts`
- `module-activation.current.ts`
- `module-activation.context.tsx`

The dependency direction remains:

```text
module types
  ↓
module registry
  ↓
activation types/utils/engine
  ↓
provider/selectors
  ↓
navigation/search consumers
```

The activation engine does not import Prisma, server repositories, persistence providers, CRM/Sales services, page components or business UI.

## Activation Input Model

`ModuleActivationRequest` supports:

- `profileKey`
- `enabledModuleIds`
- `disabledModuleIds`
- `includeDefaults`
- `strictDependencies`
- `allowPreview`
- `allowPlanned`
- `allowHidden`
- `allowDeprecated`

The input is intentionally declarative so future sources can drive it:

- Edition profile
- license
- tenant configuration
- admin override
- development profile

No localStorage or database binding was added in SPR-402.

## Activation Result Model

`ModuleActivationResult` returns:

- requested enabled modules
- requested disabled modules
- resolved active module IDs
- resolved active module descriptors
- immutable active module ID set
- automatically enabled dependencies
- blocked modules
- warnings
- errors
- deterministic activation order

## Dependency Resolution

Required dependencies are resolved automatically.

Example:

`sales.invoices` depends on:

- `sales.quotes`
- `crm.companies`
- `platform.persistence`

If `sales.invoices` is enabled, those dependencies are activated first unless explicitly disabled.

If a required dependency is explicitly disabled, the dependent module is blocked and a `disabled-dependency` error is returned.

Optional dependencies are not activated automatically.

## Lifecycle Rules

Activation respects module status metadata:

- `stable`: may activate normally
- `alpha`: may activate normally
- `preview`: requires preview activation
- `planned`: blocked in the Alpha profile
- `hidden`: not visible by default
- `deprecated`: requires explicit deprecated activation and returns a warning when allowed

Hidden platform foundations may activate as dependencies without becoming visible. For example, `platform.persistence` can be active because CRM/Sales modules require it, but it is not a sidebar or Command Center destination.

Hidden planned modules remain inactive:

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

## Current Alpha Activation Profile

The current Alpha profile is defined in `module-activation.defaults.ts` as `alphaActivationProfile`.

Visible Alpha modules:

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

Automatically enabled hidden foundation:

- `platform.persistence`

The resolved visible product remains unchanged.

## Provider and Selectors

`ModuleActivationProvider` is mounted in `ErpShell` with the static Alpha profile.

Client selectors:

- `useModuleActivation()`
- `useActiveModules()`
- `useModuleEnabled(moduleId)`

The provider is deterministic, client-safe and has a fallback resolver if used outside the provider.

The React provider is intentionally not exported from the generic `src/platform/modules` barrel to keep non-React registry consumers dependency-light.

## Sidebar Integration

Sidebar visibility now checks the current activation result.

The sidebar remains visually unchanged:

- Dashboard
- CRM
- Ventes
- Paramètres

Hidden modules remain absent.

## Command Center Integration

Command Center navigation registration now checks active module IDs for module-backed navigation commands.

Current behavior remains unchanged:

- active CRM navigation remains available
- active Sales navigation remains available
- hidden modules such as Opportunities and Inventory remain filtered
- Quick Create remains limited to stable dialog-backed workflows
- record search remains available for active CRM/Sales data sources

## Route Availability Preparation

The following helpers were added:

- `getModuleForRoute(pathname, registry)`
- `isRouteAvailable(pathname, registry, activation)`

These prepare route gating for a later sprint. SPR-402 does not enforce route guards or redirects.

## Feature Query Helpers

Metadata-only helpers were added:

- `moduleHasFeature(descriptor, featureKey)`
- `activeModuleHasFeature(result, moduleId, featureKey)`

These do not implement a Feature Flag Engine.

## Validation

Runtime validation now covers:

- Alpha profile resolves expected modules
- dependencies auto-enable
- explicit disabled dependencies block dependents
- planned modules remain inactive
- unknown IDs are reported
- deterministic activation order
- sidebar hidden modules remain filtered
- Command Center hidden modules remain filtered

Latest SPR-402 result:

- `npm run validate:runtime`: passed, 83/83 checks

## Limitations

- No Edition profiles beyond the static Alpha profile.
- No licensing.
- No billing.
- No admin module management UI.
- No route guard enforcement yet.
- Dashboard contributions are not dynamic yet.
- Quick Create and record-search capability keys remain metadata-compatible, not activation-driven feature gates.

## Next Sprint Expectations

Future sprints can use this engine to build:

- Edition profiles
- tenant module configuration
- dynamic sidebar groups
- dynamic dashboard contributions
- route gating
- feature flags
- licensing-aware activation
