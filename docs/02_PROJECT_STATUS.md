# HicoPilot Project Status

## Current State

| Field | Value |
| --- | --- |
| Product | HicoPilot |
| Version | Pre-Alpha |
| Current Milestone | Milestone 3 — Business Suite |
| Current Phase | Business Module Foundations |
| Current Sprint | SPR-322 — Quote → Invoice Workflow |
| Next Sprint | SPR-323 — Payments Workflow Foundation |
| Repository Health | Builds successfully with one known existing image optimization warning. |

## Completed Core Engines

| Engine | Location | Status |
| --- | --- | --- |
| Core Registry | `src/core/registry/` | Implemented as static module registry. |
| Platform Capability Registry | `src/core/capabilities/` | Implemented as generic framework-independent registry for executable capabilities. |
| Manifest System | `src/core/manifests/` | Implemented as immutable framework-independent installable component contract foundation. |
| Module Loader | `src/core/module-loader/` | Implemented as pure preparation pipeline for validated manifests and capabilities. |
| Search | `src/core/search/` | Framework-agnostic foundation implemented; React search UI moved to `src/platform/search/`. |
| Commands | `src/core/commands/` | Foundation implemented; command palette uses service-generated commands. |
| Notifications | `src/core/notifications/` | Static/in-memory foundation implemented. |
| Activity | `src/core/activity/` | Static/in-memory foundation implemented. |
| Favorites | `src/core/favorites/` | Static/in-memory foundation implemented. |
| Recent Items | `src/core/recent/` | Static/in-memory foundation implemented. |
| Preferences | `src/core/preferences/` | Static/in-memory foundation implemented. |
| Widgets | `src/core/widgets/` | Static/in-memory widget registry foundation implemented. |
| Audit | `src/core/audit/` | Static/in-memory audit foundation implemented. |

## Completed Services

Application Services exist under `src/services/` and orchestrate Core Engines. Implemented services include navigation, search, commands, notifications, activity, favorites, recent items, widgets, preferences, audit, permissions, workspace and session.

## Completed Runtime Layers

| Runtime Layer | Location | Status |
| --- | --- | --- |
| Workspace Context | `src/context/`, `src/providers/`, `src/hooks/` | Implemented and mounted in the ERP shell. |
| Preferences Runtime | `src/preferences/` | Implemented as the single runtime access point for preferences. |
| Widget Runtime | `src/widgets/` | Implemented as an invisible dashboard execution foundation. |
| Platform Event Runtime | `src/runtime/platform-events/` | Implemented as a lightweight in-memory event backbone. |
| Notification Event Subscriber | `src/runtime/notifications/` | Implemented as the first Platform Event Runtime consumer. |
| Activity Event Subscriber | `src/runtime/activity/` | Implemented as operational memory consumer for Platform Events. |
| Audit Event Subscriber | `src/runtime/audit/` | Implemented as immutable security and compliance memory consumer for Platform Events. |
| Permission Enforcement | `src/runtime/permissions/` | Implemented as framework-independent structured authorization decision foundation. |
| Plugin Runtime | `src/runtime/plugins/` | Implemented as framework-independent host state foundation for prepared module descriptors. |
| Runtime Validation | `scripts/validate-runtime.cjs` | Implemented as lightweight architecture regression validation. |

## Completed Integrations

| Integration | Status |
| --- | --- |
| Sidebar reads from NavigationService/Core Registry through an adapter. | Completed |
| Header search reads from SearchService/Core Registry through an adapter. | Completed |
| Command Palette reads from CommandService through an adapter. | Completed |
| WorkspaceService provides workspace snapshots. | Completed |
| Dashboard consumes Workspace Context through a bridge. | Completed |
| Preferences Runtime consumes Workspace Context. | Completed |
| Dashboard bridge consumes Widget Runtime. | Completed |
| Platform Event Runtime foundation exists for future service decoupling. | Completed |
| Notification Event Subscriber transforms supported platform events into notification requests through NotificationService. | Completed |
| Activity Event Subscriber transforms supported platform events into activity records through ActivityService. | Completed |
| Audit Event Subscriber transforms supported platform events into immutable audit records through AuditService. | Completed |
| Permission Enforcement returns structured immutable authorization decisions for future executable capabilities. | Completed |
| Widget Runtime consumes PermissionService and exposes structured permission decisions without changing visibility. | Completed |
| CommandService consumes PermissionService for command execution decisions while preserving navigation behavior. | Completed |
| Platform Capability Registry registers and discovers executable capability contracts. | Completed |
| Manifest System validates installable component contracts before future loading. | Completed |
| Module Loader validates, prepares and registers manifest capabilities without executing modules. | Completed |
| Plugin Runtime registers, enables, disables and tracks prepared module descriptors without executing plugin code. | Completed |
| CRM Module Foundation exposes manifest, capabilities, permissions, navigation and routes as the first Business Suite module. | Completed |
| CRM Customers Foundation exposes customer domain types, validation, utilities and in-memory service. | Completed |
| CRM Shared Foundation exposes reusable CRM search, filters, sorting, pagination, errors, events, commands and utilities. | Completed |
| CRM Customers Professional UI exposes the first visible CRM business page backed by CustomerService and CRM Shared Foundation. | Completed |
| HicoPilot Enterprise UI Framework extracts reusable business UI primitives consumed by CRM Customers. | Completed |
| CRM Companies Foundation exposes company domain types, validation, utilities and in-memory service. | Completed |
| CRM Companies Professional Workspace exposes the central CRM company page using Enterprise UI Framework. | Completed |
| Company Details Workspace exposes a company-centric CRM surface with overview, tabs and future integration placeholders. | Completed |
| Business Experience Sprint improves Dashboard, Navigation, Topbar, Entity Tables, Cards, Empty States and shared micro UX. | Completed |
| Company Workspace 2.0 upgrades the company page into an enterprise CRM workspace with timeline, notes, tasks, graph and inspector. | Completed |
| CRM Contacts Foundation exposes company-scoped contact domain types, validation, utilities and in-memory service. | Completed |
| Company Contacts Workspace makes the Contacts tab inside Company Workspace operational with search, filters, table, add, edit and archive. | Completed |
| CRM Activities Foundation exposes activity domain types, validation, utilities, in-memory service and Company Timeline integration. | Completed |
| CRM Contact Details Workspace exposes a contact-centric CRM workspace with overview, activities, inspector and Company navigation. | Completed |
| CRM Meetings Foundation exposes meeting domain types, validation, utilities, in-memory service and Contact Workspace meeting integration. | Completed |
| CRM Tasks Foundation exposes task domain types, validation, utilities, in-memory service and Contact Workspace task integration. | Completed |
| CRM Notes Foundation exposes note domain types, validation, utilities, in-memory service and Contact Workspace notes integration. | Completed |
| CRM Home Workspace replaces the generic `/crm` module fallback with a real French CRM landing workspace. | Completed |
| Sales Opportunities Foundation introduces the first Sales Engine domain and exposes opportunities in CRM Home, Company Workspace and Contact Workspace. | Completed |
| Product Consistency & French Localization standardizes visible CRM, Sidebar and Topbar terminology around French-first product language. | Completed |
| Sales Pipeline Workspace exposes a professional `/crm/opportunities` Kanban-style pipeline and connects CRM Home, Sidebar, Company Workspace and Contact Workspace discovery. | Completed |
| Quotes Workspace exposes `/sales/quotes`, quote details, in-memory quote creation and CRM quote panels connected to companies, contacts and opportunities. | Completed |
| Quote → Invoice Workflow exposes `/sales/invoices`, invoice details and one-click invoice generation from accepted quotes. | Completed |
| Core Search React UI is separated into Platform Search. | Completed |
| Runtime validation checks Platform Events, event subscribers, Permission Enforcement, Permission Runtime Integration, Capability Registry, Manifest System, Module Loader, Plugin Runtime, CRM Module Foundation, CRM Customers Foundation, Preferences Runtime, Widget Runtime, Workspace Context and Platform Search separation. | Completed |

## Known Technical Debt

- Runtime data is currently static or in-memory.
- Some module pages still use local/demo data rather than persisted services.
- RBAC exists as a foundation but is not production-grade.
- Permission Enforcement is integrated with Widget Runtime and CommandService, but not yet with Navigation, Plugin, Marketplace, Workflow or AI runtimes.
- Preferences Runtime distributes current preferences but does not provide a preferences editing UI.
- Platform Event Runtime is not yet integrated with business services.
- Platform Capability Registry exists but is not yet consumed by commands, widgets, navigation, plugins or AI.
- Manifest System exists but no module loader, plugin runtime or marketplace consumes manifests yet.
- Module Loader prepares modules but no Plugin Runtime executes descriptors yet.
- Plugin Runtime hosts descriptors but does not execute plugin code, load remote modules or provide an SDK yet.
- CRM Module Foundation exists but does not implement CRM CRUD, services, persistence or UI pages yet.
- CRM Customers Foundation is in-memory only and has no persistence, API or visible UI yet.
- CRM Shared Foundation is generic only and is not yet consumed by every CRM domain because future CRM domains do not exist yet.
- CRM Companies Foundation is in-memory only and has no persistence or API; the SPR-307 workspace is visible but non-persistent.
- CRM Companies Workspace persists changes only in memory during the current browser session.
- Company Details Workspace uses seeded in-memory company data and future-module placeholders.
- Favorites, Pinned, Recent, Workspace switch and Command controls are experience placeholders until platform behavior is connected.
- Company Workspace 2.0 uses mock timeline, notes, tasks, relationship graph and KPI placeholders.
- CRM Contacts Foundation is in-memory only and has no UI, persistence, API or database-backed referential integrity yet.
- Company Contacts Workspace persists contact changes only in memory during the current browser session.
- CRM Activities Foundation is in-memory only and future modules do not yet emit activities automatically.
- CRM Contact Details Workspace uses seeded in-memory contact, company and activity data until CRM persistence is introduced.
- CRM Meetings Foundation is in-memory only and prepares Activity entries without backend persistence or calendar integration.
- CRM Tasks Foundation is in-memory only and prepares Activity entries without backend persistence or workflow automation.
- CRM Notes Foundation is in-memory only and prepares Activity entries without backend persistence or AI knowledge indexing.
- Quotes Workspace is in-memory only and does not persist quote creation across reloads.
- Invoice Workspace is in-memory only and payment state is a foundation for a future payment workflow.
- CRM Customers UI persists changes only in memory during the current browser session.
- Enterprise UI Framework is young and should evolve only through concrete business module needs.
- Documentation before SPR-207A was fragmented across several older files.

## Known Risks

- Database schema exists, but the platform engines are not yet persisted.
- Workspace switching UI does not exist yet.
- AI features are not yet permission-aware because AI platform integration has not started.
- Build currently reports an existing `next/image` warning in `src/components/pdf-preview.tsx`.

## UX Fixes

- Workspace selector in the topbar is now interactive and opens an accessible placeholder dropdown with current workspace, upcoming workspace entries and workspace management actions. Real workspace switching remains intentionally unimplemented.
- CRM is now visible from the main Sidebar with direct access to CRM, Companies and Customers, plus guided nested entries for Contacts, Timeline, Meetings, Tasks and Notes.
- CRM now opens a dedicated `/crm` workspace instead of the generic ERP module fallback, with French labels and guided access to connected CRM areas.
- CRM now surfaces Opportunities as the first Sales Engine concept, improves French CRM wording and makes the pipeline discoverable from CRM Home, Company Workspace and Contact Workspace.
- Visible CRM, Sidebar and Topbar copy has been polished toward French-first terminology, and a localization guide now defines official vocabulary for future sprints.
- CRM now exposes a dedicated Opportunités entry and a professional visual sales pipeline at `/crm/opportunities`, with French labels and guided access from CRM Home.
- Ventes now exposes a dedicated Devis workspace at `/sales/quotes`, with CRM Home recent quotes and company/contact quote panels.
- Ventes now exposes Factures at `/sales/invoices`, and accepted quotes can generate invoices in one click.

## Validation Status

| Command | Required | Latest Known Result |
| --- | --- | --- |
| `npm run typecheck` | Yes | To run during SPR-322 completion. |
| `npm run build` | Yes | To run during SPR-322 completion. |
| `npm run validate:runtime` | Yes | To run during SPR-322 completion. |

## Repository Health

The repository is suitable for incremental platform work. Future work should continue to preserve visible UI and business behavior while moving shared capabilities into engines, services, contexts and runtimes.
