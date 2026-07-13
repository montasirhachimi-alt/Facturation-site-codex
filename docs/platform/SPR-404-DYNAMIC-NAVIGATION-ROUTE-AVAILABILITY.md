# SPR-404 — Dynamic Navigation & Route Availability

## Executive Summary

SPR-404 makes navigation and route availability derive from the resolved active-module state.

The runtime flow is now:

```text
Edition Profile
  ↓
Module Activation Request
  ↓
Module Activation Engine
  ↓
Active Module Navigation
  ↓
Sidebar / Command Center / Route Availability
```

The current Alpha user experience remains unchanged.

## Navigation Source of Truth

Navigation is composed from:

- `ModuleDescriptor.navigation`
- the current `ModuleActivationResult`

The Sidebar no longer composes CRM/Sales entries from business-module navigation trees plus manual activation maps. It consumes active module navigation metadata through `getActiveModuleNavigationGroups()`.

Consumers do not inspect Edition IDs.

## Navigation Metadata Contract

The module navigation metadata supports:

- `label`
- `href`
- `iconKey`
- `group`
- `order`
- `exactMatch`
- `badgeKey`
- `parentModuleId`
- `mobileLabel`
- `searchKeywords`
- `hidden`

It remains lightweight and client-safe. It does not store React components, callbacks, services, permissions logic or Edition-specific conditions.

## Sidebar Composition

Implementation:

- `src/platform/modules/module-navigation.ts`
- `src/services/navigation/sidebar-adapter.ts`

The current Alpha sidebar parity is:

- `/dashboard`
- `/crm`
- `/crm/companies`
- `/crm/contacts`
- `/crm/meetings`
- `/crm/tasks`
- `/crm/notes`
- `/sales/quotes`
- `/sales/invoices`
- `/sales/payments`
- `/parametres`

Group order is deterministic:

1. Accueil
2. CRM
3. Ventes
4. Système

Empty groups are not rendered.

## Route Ownership Model

Implementation:

- `src/platform/modules/module-route-availability.ts`

Route ownership is derived from module descriptor routes plus central compatibility routes.

Helpers include:

- `normalizeRoutePath()`
- `listRouteOwners()`
- `getRouteOwner()`
- `getModuleForRoute()`
- `isRouteOwned()`
- `isRouteAvailable()`
- `getRouteAvailabilityDecision()`
- `getFallbackRouteForUnavailableModule()`
- `getAvailableRedirectDestination()`
- `listRoutesForModule()`
- `validateRouteAvailabilityConfiguration()`

The most specific route match wins.

Query strings and hashes do not affect route ownership.

## Inactive Route Policy

Current Alpha policy:

1. Legacy compatibility route with stable active replacement: redirect to the replacement.
2. Inactive registered module route: redirect to the safe fallback route.
3. Unknown route: preserve normal Next.js not-found behavior.

No upgrade screen or paywall was added.

## Route Guard

Route availability is enforced in `src/middleware.ts`.

The middleware order remains:

1. Ignore Next internals and API routes.
2. Preserve public routes.
3. Require authentication.
4. Apply module route availability.
5. Apply existing RBAC.

This keeps authentication authoritative and avoids protected-page flashes.

## Legacy Compatibility Redirects

Central compatibility mappings include:

- `/clients` → `/crm/companies`
- `/devis` → `/sales/quotes`
- `/factures` → `/sales/invoices`
- `/livraisons` → `/sales/invoices`
- `/paiements` → `/sales/payments`
- `/pdf` → `/sales/invoices`
- `/utilisateurs` → `/parametres`
- `/ventes` → `/sales/quotes`
- `/crm/activities` → `/crm/companies`
- `/crm/opportunities` → `/sales/quotes`

If a preferred destination becomes unavailable in a future Edition, the helper falls back safely.

Inactive legacy routes such as Stock, Purchasing, HR, Finance and AI redirect to the fallback route.

## Fallback Route

Fallback behavior:

1. `/dashboard` when `core.dashboard` is active.
2. First active navigable module route.
3. `/` as final application fallback.

This avoids scattering `/dashboard` across route guards.

## Command Center Compatibility

Command Center navigation now reads active module navigation metadata.

It still exposes the same current Alpha destinations, plus the existing virtual "Ventes" shortcut to the first active Sales route.

Hidden and inactive modules do not contribute navigation commands.

## Favorites and Recent

Favorites and Recent now filter inactive routes from visible search sections without deleting stored history.

If a module becomes active again in a future Edition, the stored item can reappear.

## Current Alpha Parity

Runtime validation asserts that the current Alpha navigation remains exactly:

- `/dashboard`
- `/crm`
- `/crm/companies`
- `/crm/contacts`
- `/crm/meetings`
- `/crm/tasks`
- `/crm/notes`
- `/sales/quotes`
- `/sales/invoices`
- `/sales/payments`
- `/parametres`

## Future Edition Tests

Runtime validation also covers:

- Basic-style activation includes Dashboard, Settings, Companies and Contacts.
- Basic-style activation excludes Sales.
- `/sales/quotes` is unavailable in Basic-style activation.
- Sales-style activation includes CRM dependencies plus Quotes, Invoices and Payments.

The runtime current Edition is not changed by these tests.

## Validation

Runtime validation now covers:

- Alpha Sidebar parity
- Basic-style navigation
- Sales-style navigation
- inactive route availability
- active route availability
- most-specific route matching
- query/hash normalization
- compatibility redirects
- redirect loop detection
- fallback route availability
- inactive Favorites/Recent filtering
- hidden/planned modules staying unavailable

Latest SPR-404 result:

- `npm run validate:runtime`: passed, 90/90 checks

## Limitations

- No Edition selector.
- No licensing or billing.
- No tenant Edition assignment.
- No user-facing "Module indisponible" screen.
- Route availability is static for the current deterministic Edition source.
- Dashboard composition is not dynamic yet.
- RBAC still uses the existing permission module mapping.

## Next Sprint Expectations

Future sprints can add:

- tenant Edition assignment
- route gating from persisted tenant configuration
- dynamic dashboard contributions
- Edition-aware onboarding
- user-facing unavailable-module messaging
- licensing-aware module activation
