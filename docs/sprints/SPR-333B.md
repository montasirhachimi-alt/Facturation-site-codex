# SPR-333B — Trace and Fix CRM Contacts Sidebar Click Handler

## Summary

SPR-333B traces the full CRM Contacts sidebar path and fixes the rendered click path. Contacts now resolves through the sidebar render path as a direct `/crm/contacts` workspace link.

## Root Cause

`src/components/sidebar.tsx` calculated `getSidebarGroups()` at module scope. That made the client sidebar keep a module-level navigation snapshot instead of resolving groups during the component render path.

After earlier CRM navigation fixes, the source data was correct, but the rendered sidebar could still hold stale navigation data until the client module was fully reloaded.

## Fix

- Moved `getSidebarGroups()` into the `Sidebar` component render path.
- Kept the existing Next `Link` click behavior.
- Kept contextual links inside CRM workspace rows/details.
- Confirmed the sidebar adapter resolves `crm.contacts` to `/crm/contacts`.

## Verified CRM Routes

| Sidebar item | Final href |
| --- | --- |
| Sociétés | `/crm/companies` |
| Contacts | `/crm/contacts` |
| Activités / Timeline | `/crm/activities` |
| Réunions | `/crm/meetings` |
| Tâches | `/crm/tasks` |
| Notes | `/crm/notes` |

## Validation

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed via local `tsc --noEmit` equivalent because `npm` is unavailable in this environment. |
| `npm run build` | Passed via local `next build` equivalent because `npm` is unavailable in this environment. |

## Known Warnings

- Existing `@next/next/no-img-element` warning remains in `src/components/pdf-preview.tsx`.
- Local dev-server browser verification could not run in this sandbox because binding a localhost port returned `EPERM`; the sidebar adapter was executed directly against the TypeScript sources to verify the final `crm.contacts` href.
