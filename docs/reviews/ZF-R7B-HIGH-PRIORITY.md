# ZF-R7B — High Priority Product Cleanup

## Executive Summary

ZF-R7B reduces the ERP Product Audit high-priority findings to zero for the Alpha-visible product surface.

The cleanup focused on product trust: every visible Quick Create action now opens a stable workflow, the Command Center no longer references hidden modules, CRM activity workspaces share clearer feedback behavior, persistence saves show progress/errors, and legacy demo-era routes redirect to stable Alpha workspaces instead of rendering unfinished pages.

## High Findings Resolved

| Finding | Resolution |
| --- | --- |
| Quick Create exposed actions that did not open direct creation flows. | Quick Create now exposes only stable dialog-backed actions: Nouvelle société, Nouveau contact, Nouveau devis, Nouvelle facture. |
| Command Center mixed English/French labels and could reference hidden concepts. | Search groups and action labels are French-first; hidden routes are excluded from navigation results. |
| CRM Meetings, Tasks and Notes did not share the same feedback rhythm. | Activity workspaces now use consistent save progress, success messages and persistence error copy. |
| Persistence UX could fail quietly on key workflows. | Sales document dialogs and CRM activity dialogs disable duplicate submits and show friendly persistence errors. |
| Settings and legacy routes could expose old demo surfaces. | Settings remains visible because its controls are functional; legacy module URLs now redirect coherently. |
| Hidden modules remained discoverable through older module/search sources. | Core module registry now disables and de-searches preview-era modules for Alpha. |
| Notifications/Favorites/Recent could mention hidden modules. | Demo notification, favorite, recent and workspace snapshots were pruned to Alpha-ready modules. |

## Quick Create Review

Visible actions kept:

- Nouvelle société
- Nouveau contact
- Nouveau devis
- Nouvelle facture

Actions hidden from Quick Create for Alpha:

- Nouvelle réunion
- Nouvelle tâche
- Nouvelle note

Reason: Meetings, Tasks and Notes are real workspaces, but they did not yet expose direct Command Center creation dialogs. Keeping them visible as Quick Create actions created a mismatch between user expectation and behavior.

## Command Center Review

The Command Center now orders groups as:

1. Créer
2. Navigation
3. Données

Labels are French-first and only stable destinations are registered. The old Activities route, Opportunities route and preview modules are excluded from navigation results. Record search remains limited to live Alpha data sources: Sociétés, Contacts, Réunions, Tâches, Devis, Factures and Paiements.

## CRM Activity Consistency

Meetings, Tasks and Notes now share:

- same toolbar structure
- same search behavior
- same empty-state pattern
- same dialog save state
- same persistence error language
- same success feedback placement
- same keyboard-safe form submission through the shared dialog primitive

Success wording:

- Réunion créée.
- Réunion enregistrée.
- Tâche créée.
- Tâche enregistrée.
- Note enregistrée.

## Persistence UX

Improved surfaces:

- Quote creation
- Invoice creation
- Company Quick Create
- Contact Quick Create
- Meeting creation/edit/cancel
- Task creation/edit/complete
- Note creation/edit/archive

Behavior:

- duplicate form submissions are disabled while saving
- persistence failures keep the dialog open
- entered form state is preserved on failure
- friendly French error messages are displayed
- successful Quick Create actions show concise confirmation feedback

## Settings Review

Settings remains visible for Alpha because its visible controls perform real local workflows:

- company profile settings
- users and roles local management
- numbering settings
- PDF/print settings
- JSON export

No placeholder section was added. No unfinished Settings module was exposed.

## Legacy Routes

Stable redirects:

- `/devis` → `/sales/quotes`
- `/factures` → `/sales/invoices`
- `/paiements` → `/sales/payments`
- `/ventes` → `/sales/quotes`
- `/clients` → `/crm/companies`
- `/utilisateurs` → `/parametres`

Preview-era routes now redirect to `/dashboard` or a stable Sales workspace:

- Achats
- Fournisseurs
- Stock
- Caisse
- Statistiques
- Assistant IA
- RH pages
- PDF preview route
- Bons de livraison
- Dynamic legacy module fallback

## Notifications

Demo notifications were pruned so they no longer point to hidden Stock or AI routes. Payment and invoice actions now point to the stable Sales routes.

## Files Changed

Main implementation files:

- `src/platform/search/action-registry.ts`
- `src/platform/search/command-registry.ts`
- `src/platform/search/record-search-registry.ts`
- `src/platform/search/components/universal-search-dialog.tsx`
- `src/platform/search/providers/quick-create-dialog-host.tsx`
- `src/modules/crm/activities/ui/crm-activity-workspaces.tsx`
- `src/modules/sales/quotes/ui/quote-dialog.tsx`
- `src/modules/sales/invoices/ui/invoice-dialog.tsx`
- `src/ui/forms/form-field.tsx`
- `src/core/config/modules.ts`
- `src/core/notifications/demo-notifications.ts`
- `src/core/favorites/demo-favorites.ts`
- `src/core/recent/demo-recent-items.ts`
- `src/services/workspace/demo-workspaces.ts`
- legacy route pages under `src/app/(erp)/`

## Known Limitations

- Meetings, Tasks and Notes are intentionally not exposed as Quick Create actions until direct dialog launch from the Command Center is added.
- Preview modules still exist in code for future editions, but they are disabled/search-hidden and direct routes redirect away from unfinished screens.
- Settings is still local-state based; it is kept because visible controls are functional and do not pretend to be persisted ERP records.

## Alpha Readiness Result

All high-priority findings from the ZF-R7 audit are resolved for the visible Alpha product surface. The ERP now avoids fake workflows, stale module discovery and silent persistence interactions across the reviewed areas.
