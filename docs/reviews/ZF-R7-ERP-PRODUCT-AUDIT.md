# ZF-R7 - ERP Product Audit (Alpha Readiness)

Date: 2026-07-11

## Executive Summary

BOSIACO has moved beyond prototype quality in its strongest areas. The new CRM and Sales foundations now provide a coherent product identity, durable CRM/Sales records, functional quote and invoice workflows, PDF output, command center productivity, keyboard support, smart pickers, quick create, and persisted Meetings, Tasks and Notes.

The product is not yet ready for a broad Alpha 1.0 release as a complete ERP. The main issue is no longer visual polish. The main issue is product consistency: the new persistent CRM/Sales experience sits next to older demo-era ERP surfaces that still rely on seeded data, browser-local state, preview flows, or visible placeholder controls.

Recommended release decision:

- Controlled Alpha for CRM and Sales: nearly ready after the release blockers below.
- Full ERP Alpha 1.0: not ready until demo-era modules are hidden, scoped as preview, or upgraded to the same persistence and UX standard.

## Audit Scope

Reviewed areas:

- CRM
- Sales
- Command Center
- Dashboard
- Navigation
- Settings
- Dialogs
- Tables
- PDF
- Persistence
- Keyboard
- Quick Create
- Smart Entity Picker
- Meetings
- Tasks
- Notes
- Companies
- Contacts
- Quotes
- Invoices
- Payments

Requested documents not found under exact names:

- `docs/START_NEW_SESSION.md`
- `docs/BOSIACO_ROADMAP.md`

Closest available sources used:

- `docs/01_START_NEW_SESSION.md`
- `docs/02_ROADMAP.md`
- `docs/04_ROADMAP.md`

## Scorecard

| Area | Score | Alpha Readiness |
| --- | ---: | --- |
| Product Score | 72/100 | Promising, but mixed maturity across modules |
| UX Score | 76/100 | Strong new surfaces, inconsistent legacy surfaces |
| Architecture Score | 78/100 | Good modular direction, remaining duplicate data paths |
| CRM Score | 80/100 | Strong core, Pipeline and CRM Home still need live-data alignment |
| Sales Score | 82/100 | Quotes and invoices are strong; payments need completion polish |
| Navigation Score | 70/100 | Sidebar is coherent; topbar still exposes unfinished controls |
| Zero Friction Score | 68/100 | Good foundations, but quick create and contextual flows are uneven |
| Accessibility Score | 74/100 | Keyboard-first foundations exist; needs full manual assistive review |
| Performance Score | 66/100 | Several duplicate/static data sources and legacy modules remain |
| Persistence Score | 70/100 | CRM/Sales core persists; platform and legacy ERP areas do not |

## Release Blockers

### Critical

1. **Legacy demo-era ERP pages are still exposed as product surfaces.**
   Pages such as Achats, Fournisseurs, Caisse, Stock, Statistiques, Livraison and older Devis/Factures/Paiements routes still import `src/lib/demo-data.ts` directly. They do not yet meet the same persistence and product standard as the new CRM/Sales areas.

2. **Topbar exposes visible unfinished controls.**
   The workspace switcher shows inactive workspaces as `Bientôt disponible`, workspace management actions only close the menu, and the notification bell displays an unread indicator without a stable notification center.

3. **Opportunities/Pipeline remains seed-backed while CRM and Sales are persistent.**
   The visible Pipeline experience still reads `crmOpportunitySeed` in multiple places. This can make Sales context appear disconnected from the new durable CRM/Sales model.

4. **CRM Home still mixes live product experience with seed-backed summaries.**
   CRM Home constructs private services from seed data for activities, opportunities and several summary surfaces. It can disagree with persisted Companies, Contacts, Meetings, Tasks, Notes, Quotes and Invoices.

### High

5. **Quick Create is not equally real for every visible action.**
   Company, Contact, Quote and Invoice are strong. Opportunity and Payment still use preview or route-based behavior in places, which makes the Command Center feel partly complete.

6. **Command Center copy is outdated.**
   The dialog still presents itself as instant local navigation while it now also includes records, quick create, favorites and recent items.

7. **Contact details still include seed-backed activity data.**
   Activities shown around Contact detail are not fully aligned with the persisted Meeting, Task and Note foundation.

8. **Platform memory is still demo/browser-local in several engines.**
   Favorites, Recent, Notifications, Audit, Widgets and Preferences still rely on demo registries or browser-local state. That is acceptable for controlled preview, but not for a full ERP Alpha promise.

9. **Persistence errors are not consistently surfaced to the user.**
   Some detail pages still log persistence failures to the console instead of showing a clear user-facing recovery path.

10. **Settings and workspace management do not yet match the product maturity of CRM/Sales.**
    Settings still contain browser-local/demo behavior and are not yet a real administrative control center.

### Medium

11. **Two product generations coexist.**
    New CRM/Sales modules use the modern BOSIACO product language. Several older modules still use legacy components, demo data and older workflows.

12. **Business terminology can still leak from older Client/Customer flows.**
    The company-centric CRM decision is correct, but older pages and data sources still reference Clients/Customers in ways that could confuse users.

13. **Table mobile behavior needs a full pass.**
    Shared tables are productive on desktop, but wide minimum table layouts can create horizontal pressure on mobile and tablet.

14. **Success feedback is inconsistent.**
    Many creation and edit flows close successfully, but do not always provide a clear confirmation or next best action.

15. **Loading and hydration states are limited.**
    Persistence-backed surfaces are functional, but initial loading, save progress and refresh feedback should be more explicit before Alpha.

16. **Legacy compatibility routes need a product decision.**
    Routes such as `/clients`, `/devis`, `/factures` and `/paiements` should either redirect clearly to the new workspaces, be hidden, or be formally marked as legacy compatibility.

### Low

17. **Known PDF image optimization warning remains.**
    `src/components/pdf-preview.tsx` still uses `<img>`, producing the known Next.js image warning.

18. **Some documentation still carries old product naming.**
    HicoPilot/BOSIACO naming should be normalized before an external Alpha package.

19. **Dead or fallback-only CRM placeholder components remain.**
    Some placeholder tab components are hidden in normal flows but remain in code and should be removed or guarded as future-only surfaces.

20. **Some generic labels are still too technical.**
    A few labels describe implementation categories rather than user outcomes.

## Module Review

### Dashboard

The Dashboard has a strong executive direction and is visually aligned with the BOSIACO identity. It is suitable as a starting point for a controlled demo.

Risks:

- Some dashboard statistics still trace back to demo/static data sources.
- Notification and alert signals need to be backed by real workflows or hidden.
- The Dashboard should prioritize persisted CRM/Sales insights before broad ERP Alpha.

### CRM

CRM is now the strongest product area. Companies, Contacts, Meetings, Tasks and Notes are coherent, persistent and closer to real ERP behavior.

What feels complete:

- Company-centric CRM model.
- Contact creation from Company context.
- Global Contacts directory aligned with persisted contacts.
- Meetings, Tasks and Notes as minimal functional CRM workflows.
- Company detail as the business center.

Remaining concerns:

- CRM Home still uses seed-backed summary sources.
- Opportunities/Pipeline is still seed-backed.
- Contact activity history is not fully backed by a durable activity-event model.
- Timeline is correctly hidden until real events exist, but the broader activity story remains incomplete.

### Sales

Sales is strong enough for controlled Alpha after blocker cleanup.

What feels complete:

- Quote creation with line items.
- Invoice creation with line items.
- Quote and invoice details.
- PDF preview/export path.
- CRM relationship preservation for Companies and Contacts.

Remaining concerns:

- Payment creation and quick create need the same completion level as Quote and Invoice.
- Opportunity selection still depends on seed-backed pipeline data.
- Product catalog integration remains partially legacy/local.
- Error states around persisted document details need user-facing messaging.

### Command Center

The Command Center is one of BOSIACO's most important product differentiators. It already makes the product feel faster than a traditional ERP.

Remaining concerns:

- Copy should reflect the current multi-purpose experience, not only navigation.
- Quick Create actions should only appear when they open real workflows.
- New Meeting, New Task and New Note should eventually open contextual dialogs from the palette, not only route users to a page.
- Record search should avoid seed-backed opportunities and payments unless they are clearly preview data.

### Navigation

The sidebar is coherent and significantly clearer than earlier versions.

Remaining concerns:

- Topbar workspace switcher exposes future workspaces.
- Workspace menu actions are visible without stable destination.
- Notification bell appears active without an implemented notification workflow.
- Duplicate command/search entry points could be simplified.

### Settings

Settings is not yet at the maturity level of CRM/Sales.

Risks:

- Several settings still use browser-local/demo state.
- Workspace/company administration is not yet durable administrative behavior.
- Settings should be scoped as preview or upgraded before full Alpha.

### PDF

Quote and invoice PDF output is a credible business feature.

Remaining concerns:

- PDF metadata must continue to match persisted document details.
- The known `<img>` warning should be fixed before release hardening.
- Company legal metadata and final branding should receive a final business review.

### Persistence

PERSIST-001 through ZF-R6 created the right foundation for durable CRM/Sales records.

What works:

- Companies, Contacts, Quotes, Invoices, Meetings, Tasks and Notes are moving through a persistent source.
- Relationships are preserved across CRM and Sales.
- Persistence replay and migration baseline have been addressed.

Remaining concerns:

- Persistence is not yet universal across all visible ERP modules.
- Platform engines still use demo or browser-local data.
- The app still has old routes that imply durable ERP behavior while relying on demo data.

### Keyboard and Accessibility

The keyboard foundation is strong:

- Command Center shortcut.
- Keyboard help.
- Escape handling.
- Table navigation.
- Dialog submit shortcuts.
- Smart picker keyboard navigation.

Remaining concerns:

- Full screen-reader review has not been documented.
- Disabled or unavailable actions should consistently explain why.
- Every remaining visible control must be audited after topbar/settings cleanup.

## Business Model Review

The company-centric CRM model is the right direction for BOSIACO's current B2B vision.

Recommended model for Alpha:

- Company is the commercial account.
- Contacts belong to Companies.
- Quotes, Invoices, Payments and Opportunities belong to Companies.
- Customer remains an internal compatibility concept, not a primary visible business object.

Do not remove Customer persistence yet. Keep it as a future compatibility layer for B2C or advanced account structures. The visible product should continue to use Company as the main business entity.

## Zero Friction Review

### Workflow: Create Company -> Contact -> Quote -> Invoice -> Payment

Current result:

- Company creation: good.
- Contact creation: good from Company context and global directory.
- Quote creation: strong, including line items and PDF.
- Invoice creation: strong, including line items.
- Payment workflow: usable, but not yet at the same completeness level from Quick Create.

Remaining friction:

- Too many routes still expose older workflows.
- Some quick create actions route instead of opening the creation surface.
- Success confirmation is not consistent.
- Topbar controls create uncertainty.
- Opportunity context is not reliable enough for serious pipeline work.

Zero Friction score: 68/100.

## Consistency Review

Strong consistency:

- Product hero language.
- Shared dialog sizing.
- Entity table controls.
- Form field styling.
- CRM/Sales page rhythm.
- Command Center visual direction.

Weak consistency:

- Legacy ERP pages.
- Settings and workspace management.
- Demo-data pages versus persisted modules.
- Pipeline versus Company/Sales relationship model.
- Platform notifications/widgets versus real persisted records.

## Performance Review

No risky performance optimization was performed during this audit.

Observed risks:

- Duplicate client stores and seed-backed service instances remain in older surfaces.
- CRM Home and Pipeline can compute from static seed data instead of live persisted sources.
- Legacy modules increase bundle and maintenance surface.
- Demo platform registries are loaded even when they do not represent real business state.
- Some localStorage-based helpers remain for products, users, settings and PDF-related utilities.

Recommended approach:

- First remove or hide non-Alpha legacy surfaces.
- Then converge remaining visible modules on the same persistence/read model.
- Only then perform bundle and render optimization.

## Top 20 Improvements

| Priority | Severity | Improvement |
| ---: | --- | --- |
| 1 | Critical | Hide or clearly label demo-era ERP modules before Alpha. |
| 2 | Critical | Remove or wire topbar workspace management actions. |
| 3 | Critical | Remove or wire the notification bell. |
| 4 | Critical | Move CRM Home summaries to live persisted sources. |
| 5 | Critical | Persist or hide Opportunities/Pipeline for Alpha. |
| 6 | High | Make Payment quick create a real workflow or remove it from Quick Create. |
| 7 | High | Update Command Center wording and group descriptions. |
| 8 | High | Replace seed-backed contact activity views with real Meeting/Task/Note activity or hide them. |
| 9 | High | Add user-facing persistence error states. |
| 10 | High | Decide which old `/devis`, `/factures`, `/paiements`, `/clients` routes remain visible. |
| 11 | Medium | Normalize Customer/Client wording to the company-centric model. |
| 12 | Medium | Improve mobile behavior for wide tables. |
| 13 | Medium | Add consistent success feedback after save/archive. |
| 14 | Medium | Add visible loading states for persistence-backed pages. |
| 15 | Medium | Make Settings either durable or explicitly preview-only. |
| 16 | Medium | Remove fallback placeholder tab components from visible detail flows. |
| 17 | Low | Fix the known PDF `<img>` warning. |
| 18 | Low | Normalize BOSIACO/HicoPilot documentation naming. |
| 19 | Nice to Have | Add contextual next-best actions after Quote and Invoice creation. |
| 20 | Nice to Have | Add a formal Alpha checklist in release docs. |

## Quick Wins

Recommended before any new platform feature work:

1. Hide inactive workspaces in the topbar workspace selector.
2. Remove the notification bell until a real notification panel exists.
3. Update Command Center helper copy.
4. Hide seed-backed Pipeline if persistence is not implemented immediately.
5. Make CRM Home read live Company, Contact, Meeting, Task, Note, Quote and Invoice sources.
6. Remove preview-only Quick Create actions.
7. Add toast or inline success feedback to create/edit/archive flows.
8. Surface persistence failures with an error state instead of console-only logging.
9. Normalize legacy routes and navigation labels.
10. Fix the PDF image warning.

## Future Improvements

These should not block controlled CRM/Sales Alpha, but should be planned:

- Persist Opportunities and make Pipeline a real commercial workflow.
- Build a real activity-event model before reintroducing Timeline.
- Persist Products and connect line-item selection to a real product catalog.
- Persist Settings and workspace administration.
- Persist platform Notifications, Favorites, Recent and Audit events.
- Add a real workspace switcher when multi-workspace behavior is ready.
- Complete HR persistence if HR remains in Alpha scope.
- Complete Purchases, Stock, Cash and Suppliers before exposing them as ERP modules.
- Add release-grade audit logging.
- Run a full accessibility review with keyboard and screen-reader passes.

## Alpha Readiness

### Controlled CRM/Sales Alpha

Status: **Conditionally ready after blocker cleanup.**

Required before controlled Alpha:

- No visible inert topbar controls.
- CRM Home uses live persisted data.
- Pipeline is either persisted or hidden.
- Payment quick create is real or hidden.
- Command Center copy matches current behavior.
- Persistence failures are visible to the user.

### Full ERP Alpha 1.0

Status: **Not ready.**

Required before full ERP Alpha:

- Legacy demo-data modules must be hidden, preview-labeled, or upgraded.
- Settings/workspace administration must become stable.
- Notifications must become real or disappear.
- Product catalog, stock, purchases, suppliers, cash and HR need clear persistence decisions.
- Old and new route generations must be consolidated.

## Classification Summary

Critical:

- Demo-era modules exposed as first-class ERP pages.
- Inert topbar workspace and notification controls.
- Seed-backed Opportunities/Pipeline.
- Seed-backed CRM Home summaries.

High:

- Uneven Quick Create completeness.
- Outdated Command Center language.
- Seed-backed contact activity detail.
- Demo/browser-local platform engines.
- Console-only persistence errors.
- Settings/workspace controls not mature.

Medium:

- Two product generations coexist.
- Customer/Client terminology leaks.
- Mobile table pressure.
- Inconsistent success/loading feedback.
- Legacy compatibility routes need a decision.

Low:

- PDF image warning.
- Product naming drift in docs.
- Hidden/fallback placeholder components.

Nice to Have:

- More next-best actions after creation.
- Formal Alpha release checklist.
- Deeper performance/bundle review after scope cleanup.

## Final Verdict

BOSIACO now has a credible product core. CRM and Sales can become a strong controlled Alpha after focused cleanup.

The whole ERP should not yet be presented as Alpha 1.0 because users can still encounter demo-era modules and visible controls that imply functionality before it is stable. The fastest route to Alpha is not adding more features. It is reducing exposed scope, aligning all visible surfaces to persistent data, and removing every remaining control that does not perform a real action.

