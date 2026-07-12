# ZF-R7A - Alpha Blockers Cleanup

Date: 2026-07-12

## Executive Summary

ZF-R7A resolves the four Critical Alpha blockers identified in the ZF-R7 ERP Product Audit. The cleanup does not delete future modules and does not introduce new product features. It reduces the visible Alpha surface to the parts of BOSIACO that are stable enough to present professionally: Dashboard, CRM core, Sales documents, payments, settings access, command center, smart pickers and persisted CRM/Sales activity.

The guiding decision was simple: every visible production control must either work or disappear. Legacy demo-era modules and seed-backed Pipeline surfaces remain in code for future work, but they are no longer presented as finished product areas.

## Critical Issues Resolved

### Critical #1 - Legacy Demo-Era ERP Modules Exposed

Resolved by hiding legacy/demo-backed ERP areas from the primary Sidebar and Command Center navigation.

Hidden from production navigation:

- Products / Stock
- Cash
- Purchases
- HR pages
- Analytics / Statistics
- Reports
- PDF demo page
- AI Assistant
- Users

Kept visible:

- Dashboard
- CRM
- Sales
- Settings

Rationale:

- The hidden modules still depend primarily on demo data or local prototype behavior.
- Hiding them is safer than labeling some as preview and leaving mixed behavior.
- No routes or module code were deleted, so future edition work remains possible.

### Critical #2 - Topbar Unfinished Controls

Resolved by removing topbar controls that had no stable workflow.

Removed:

- Workspace switcher dropdown.
- Upcoming workspace entries.
- Workspace management menu actions.
- Notification bell with unread indicator.
- Duplicate `Commande` button.

Kept:

- Mobile menu button.
- Command Center search trigger.
- Current date display.
- Theme toggle.
- Logout.
- User identity.

Result:

- The topbar now contains only stable actions.
- No visible topbar action silently closes a menu or implies a missing workflow.

### Critical #3 - CRM Home Seed-Backed Summaries

Resolved by replacing private seed-backed CRM Home services with shared live stores.

CRM Home now reads from:

- `crmCompanyLocalService`
- `crmContactLocalService`
- `crmMeetingLocalService`
- `crmTaskLocalService`
- `crmNoteLocalService`
- `quoteService`
- `invoiceService`
- `paymentService`

CRM Home now subscribes to:

- Company updates
- Contact updates
- Meeting updates
- Task updates
- Note updates
- Quote updates
- Invoice updates
- Payment updates

Removed from CRM Home:

- Private `new CompanyService(...)`
- Private `new ContactService(...)`
- Private `new ActivityService(...)`
- Private `new MeetingService(...)`
- Private `new TaskService(...)`
- Private `new NoteService(...)`
- Private `new OpportunityService(...)`
- Private `new QuoteService(...)`
- Seed-backed Pipeline indicators

Result:

- CRM Home reflects the same live session sources as CRM and Sales workspaces.
- Activity summaries now come from real Meetings, Tasks and Notes instead of the old activity seed.
- CRM Home no longer links to or counts the hidden Pipeline.

### Critical #4 - Pipeline / Opportunities

Resolved by hiding seed-backed Pipeline/Opportunities from visible Alpha surfaces.

Removed or hidden from:

- Sales sidebar navigation.
- Command Center navigation.
- Command Center record search.
- Quick Create actions.
- CRM Home quick actions, KPI cards, hero, command strip and navigation hints.
- Dashboard quick actions, hero action, performance section and recent activity copy.
- Company detail contextual actions and tabs.
- Contact detail contextual actions and tabs.
- Company relationship graph and summary cards.
- Quote creation dialog.
- Quote list filters/table columns.
- Quote detail contextual actions and commercial information.
- Customer contextual actions.

Direct route behavior:

- `/crm/opportunities` now redirects to `/sales/quotes`.

Rationale:

- Opportunities remain a future module until persistence exists.
- The existing Opportunity implementation is preserved in code but no longer presented as an Alpha-ready workflow.

## Modules Hidden

Hidden from primary production navigation:

- Stock / Products
- Finance legacy group
- Purchases
- Cash
- HR
- Analytics / Statistics
- PDF demo page
- AI Assistant
- Users

## Modules Kept

Kept in the visible Alpha product:

- Dashboard
- CRM overview
- Companies
- Contacts
- Meetings
- Tasks
- Notes
- Sales Quotes
- Sales Invoices
- Sales Payments
- Settings
- Command Center

## Topbar Cleanup

The topbar now focuses on stable daily actions:

- Command Center search
- Date context
- Theme toggle
- Logout
- User identity

Removed placeholder or unfinished controls:

- Workspace selector
- Workspace management actions
- Notification bell
- Duplicate command button

## CRM Home Cleanup

CRM Home was converted from static seed snapshots to a live store snapshot hook.

Visible changes:

- Pipeline cards were replaced with quote, invoice and payment context.
- Recent activity now reflects Meetings, Tasks and Notes.
- Quick actions now point to stable CRM/Sales workspaces.
- The hero and navigation hints no longer mention hidden opportunities.

## Pipeline Decision

Decision: hide Pipeline / Opportunities for Alpha.

Reason:

- The current Pipeline implementation is seed-backed.
- Persisting Opportunities would require a separate business/persistence sprint.
- Hiding is the smallest safe Alpha cleanup and avoids presenting a fake commercial workflow.

Future path:

- Re-enable Pipeline only after a persistent Opportunity model, relationship mapping and Sales integration are implemented.

## Files Changed

Application:

- `src/app/(erp)/crm/opportunities/page.tsx`
- `src/app/(erp)/dashboard/page.tsx`
- `src/components/topbar.tsx`
- `src/services/navigation/sidebar-adapter.ts`
- `src/modules/sales/sales.navigation.ts`
- `src/platform/search/action-registry.ts`
- `src/platform/search/command-registry.ts`
- `src/platform/search/record-search-registry.ts`
- `src/platform/search/providers/quick-create-dialog-host.tsx`
- `scripts/validate-runtime.cjs`
- `src/modules/crm/home/crm-home-page.tsx`
- `src/modules/sales/quotes/ui/quote-dialog.tsx`
- `src/modules/sales/quotes/ui/quotes-workspace.tsx`
- `src/modules/sales/quotes/ui/quote-details-workspace.tsx`
- `src/modules/crm/companies/ui/pages/companies-page.tsx`
- `src/modules/crm/companies/ui/tables/companies-table.tsx`
- `src/modules/crm/companies/ui/components/company-relations-panel.tsx`
- `src/modules/crm/companies/ui/details/components/company-activity-timeline.tsx`
- `src/modules/crm/companies/ui/details/components/company-details-tabs.tsx`
- `src/modules/crm/companies/ui/details/components/company-relationship-graph.tsx`
- `src/modules/crm/companies/ui/details/components/company-summary-cards.tsx`
- `src/modules/crm/companies/ui/details/pages/company-details-page.tsx`
- `src/modules/crm/contacts/ui/details/components/contact-details-tabs.tsx`
- `src/modules/crm/contacts/ui/details/pages/contact-details-page.tsx`
- `src/modules/crm/contacts/ui/tables/contacts-table.tsx`
- `src/modules/crm/customers/ui/pages/customers-page.tsx`
- `src/modules/crm/activities/ui/activities.seed.ts`

Documentation:

- `docs/reviews/ZF-R7A-ALPHA-BLOCKERS.md`
- `docs/02_PROJECT_STATUS.md`

## Validation

Passed:

- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

Notes:

- `npm run validate:runtime` was updated to validate the new Alpha navigation decision: Sales exposes Devis, Factures and Paiements while hiding Pipeline until Opportunity persistence exists.
- The first parallel typecheck attempt collided with a simultaneous Next build refreshing `.next/types`; rerunning typecheck sequentially after build passed.
- Clean `.next` runtime test was performed.

Clean runtime smoke test:

- Deleted `.next`.
- Started a fresh dev server.
- Port `3000` was already in use locally, so Next served on `3001`.
- Authenticated checks returned `200 OK` for `/dashboard`, `/crm` and `/sales/quotes`.
- Authenticated `/crm/opportunities` returned `307` to `/sales/quotes`.
- No runtime errors appeared in the dev server output during the smoke test.

## Known Limitations

- Legacy module routes still exist but are hidden from production navigation.
- Opportunity/Pipeline code still exists for future work but is hidden from visible Alpha paths.
- Settings remains visible but is not part of this Critical blocker cleanup.
- The existing PDF preview `<img>` warning remains outside this sprint.
