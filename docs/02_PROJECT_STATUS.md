# HicoPilot Project Status

## Current State

| Field | Value |
| --- | --- |
| Product | HicoPilot |
| Version | v0.9.0-alpha |
| Current Milestone | Business Platform |
| Current Phase | Business Platform |
| Current Sprint | SPR-421 — Unified Search Provider Implementation |
| Next Sprint | Gradual Command Center migration to SearchService when product scope allows UI integration |
| Repository Health | Delivery Note quantities use deterministic six-decimal Inventory normalization from controlled input through posting. SPR-419 hardens the read-only Sales Order Timeline UI, stale-result protection and accessibility while preserving TimelineService boundaries. SPR-421 makes Unified Search return real CRM and Sales business results through module-owned providers while preserving legacy SearchService compatibility and the existing Command Center UI. Sales Order browser QA remains blocked under default Alpha because Sales Orders are inactive and no runtime profile switch is wired. Builds complete with the known existing PDF preview image warning. |

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
| Platform Module Registry | `src/platform/modules/` | Implemented as a client-safe declarative descriptor registry for future Editions and activation work. |
| Module Activation Engine | `src/platform/modules/` | Implemented as deterministic activation resolver with Alpha profile, dependency resolution and safe selectors. |
| Edition Profile Registry | `src/platform/editions/` | Implemented as metadata-only Edition profile registry feeding the Module Activation Engine. |
| Dynamic Navigation & Route Availability | `src/platform/modules/` | Implemented as active-module navigation composition, centralized route ownership and inactive-route redirect policy. |
| Dashboard Contribution Registry | `src/platform/dashboard/` | Implemented as metadata-only dashboard contribution registry and resolver driven by active modules. |
| Platform Architecture Constitution | `docs/05_PLATFORM_ARCHITECTURE.md` | Implemented as the mandatory architecture reference for future platform and business-module sprints. |
| Product Catalog Foundation | `src/modules/products/` | Implemented as the canonical Product service, local cache, persistence bridge and prepared hidden workspace for future business modules. |
| Inventory Domain Foundation | `src/modules/inventory/` | Implemented as warehouse, balance, stock movement, posting and reservation domain foundation with transaction-oriented persistence. |
| Inventory Quantity Policy | `src/modules/inventory/inventory.utils.ts` | Implemented as a 6-decimal quantity normalization and parsing policy consumed by Inventory dialogs, services and persistence. |
| Quote Lifecycle Actions | `src/modules/sales/quotes/` and `src/server/persistence/crm-sales-repository.ts` | Implemented as a minimal draft → sent → accepted/refused workflow with persistence validation and accepted-only Sales Order conversion readiness. |
| Quote to Sales Order Workspace Mapping | `src/modules/sales/orders/order.service.ts` | Implemented so accepted Quote conversion creates Sales Orders in `sales-orders-main` and persistence rejects malformed Sales Order workspace IDs. |
| Delivery Notes & Physical Stock Issue | `src/modules/sales/delivery-notes/` | Implemented as persistent draft/post/archive documents that consume Sales Order reservations, post Inventory `ISSUE` movements and update delivered quantities atomically. |
| Delivery Note Quantity Precision | `src/modules/sales/delivery-notes/` and `src/modules/inventory/inventory.utils.ts` | Delivery quantity inputs reuse the canonical controlled decimal policy and are normalized again at the server boundary before persistence and posting. |
| Business Timeline Engine | `src/runtime/timeline/` and `src/services/timeline/` | Implemented as a generic provider registry and timeline service foundation for future entity journey reconstruction without business-specific providers. |
| Sales Timeline Provider | `src/modules/sales/timeline/` | Implemented as the first Business Timeline provider, mapping existing Quotes, Sales Orders, Invoices and Payments into generic deterministic timeline events. |
| Inventory & Delivery Timeline Provider | `src/modules/inventory/timeline/` | Implemented as a read-only logistics provider mapping reservations, Delivery Notes and Inventory `ISSUE` movements into generic deterministic timeline events. |
| Business Timeline UI Integration | `src/modules/sales/orders/ui/sales-order-business-timeline.tsx` | Implemented as the first production Timeline placement, rendering Sales Order journeys through `TimelineService` and the shared domain-agnostic Timeline UI. |
| Business Timeline UX Hardening | `src/ui/timeline/` and `src/modules/sales/orders/ui/sales-order-business-timeline.tsx` | Implemented semantic Timeline event lists, visible status labels, local retry, safer wrapping and explicit stale-response protection without changing providers or business workflows. |
| Unified Global Search Foundation | `src/runtime/search/` and `src/services/search/` | Implemented as a Runtime-first provider registry, deterministic aggregation engine and SearchService facade for future Global Search, Command Center, HicoPilot, AI Agents and quick navigation consumers. |
| Unified Search Providers | `src/modules/crm/search/` and `src/modules/sales/search/` | Implemented real deterministic CRM Companies/Contacts and Sales document providers while keeping Runtime module-agnostic and Command Center unchanged. |

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
| Sales Navigation Integration exposes official Sales navigation metadata and renders Ventes → Devis / Factures from the sidebar adapter. | Completed |
| Sidebar Architecture Cleanup separates official business modules from legacy navigation groups and removes duplicated CRM/Sales sidebar entries. | Completed |
| CRM & Sales Navigation UX Cleanup removes the duplicated CRM menu entry and places the commercial pipeline under Ventes. | Completed |
| Payments Workflow Foundation exposes `/sales/payments`, payment details, in-memory payment recording from invoice details and Sales navigation metadata. | Completed |
| Product Experience Redesign Phase 1 simplifies the Dashboard, lightens the Sidebar and polishes shared CRM/Sales UI primitives without changing business logic. | Completed |
| CRM Navigation Clarity removes visible contextual sidebar badges and clarifies where Contacts, Activités, Réunions, Tâches and Notes live without creating standalone pages. | Completed |
| Global Search Foundation introduces a premium topbar search trigger and a sectioned UI-only search dialog ready for future providers. | Completed |
| CRM Experience 2.0 upgrades CRM home, companies, contacts, pipeline, contextual panels and shared CRM UI primitives for a more premium SaaS demo experience. | Completed |
| Core Search React UI is separated into Platform Search. | Completed |
| Unified Global Search Foundation adds a Runtime-first provider registry, failure-isolated aggregation engine and SearchService facade while preserving existing Header Search and Command Center behavior. | Completed |
| Unified Search Provider Implementation returns real CRM and Sales business results through module-owned providers and the canonical Search Runtime contract. | Completed |
| Runtime validation checks Platform Events, event subscribers, Permission Enforcement, Permission Runtime Integration, Capability Registry, Manifest System, Module Loader, Plugin Runtime, CRM Module Foundation, CRM Customers Foundation, Preferences Runtime, Widget Runtime, Workspace Context and Platform Search separation. | Completed |
| Platform Module Registry describes Alpha-ready, hidden and planned modules with lifecycle, dependency, navigation, Command Center and dashboard metadata without changing visible product behavior. | Completed |
| Module Activation Engine resolves active modules from the Alpha profile, auto-enables required dependencies, reports conflicts and filters low-risk Sidebar and Command Center navigation metadata without changing visible behavior. | Completed |
| Edition Profiles Foundation defines Alpha, Basic, CRM, Sales, Inventory, Purchasing, HR, Enterprise and Custom Edition profiles as metadata and uses the current Alpha Edition as the activation input source without changing visible behavior. | Completed |
| Dynamic Navigation & Route Availability composes Sidebar and Command Center destinations from active module navigation metadata and centralizes route ownership, legacy redirects, inactive-module fallbacks and Favorites/Recent route filtering. | Completed |
| Dynamic Dashboard Contributions make the Dashboard consume active module contribution metadata through a registry and resolver while preserving the existing visual layout. | Completed |
| Platform Architecture Constitution documents the authoritative module, activation, Edition, navigation, route, Command Center, Dashboard, persistence and import-safety rules for all future modules. | Completed |
| Product Catalog Foundation extends the existing Product model into the canonical tenant-scoped catalogue, adds ProductCategory, ProductService, repository persistence, activation-gated search and a prepared hidden Product workspace. | Completed |
| Inventory Domain Foundation adds tenant-scoped warehouse, balance and stock movement models plus a service-level posting engine and transaction-oriented repository without exposing Inventory UI. | Completed |
| Warehouse Persistence & Inventory Quantity QA Fix aligns Inventory workspace tenant scope with authenticated persistence, makes Warehouses immediately visible after confirmed writes and normalizes Inventory quantities to prevent floating-point artifacts. | Completed |
| Quote to Sales Order Quantity Conversion Fix normalizes persisted CRM/Sales numeric fields and explicitly preserves Quote quantities, Product snapshots, negotiated prices and VAT when creating Sales Order drafts. | Completed |

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
- Invoice and Payment Workspaces are in-memory only and do not persist payment recording across reloads.
- CRM Customers UI persists changes only in memory during the current browser session.
- Enterprise UI Framework is young and should evolve only through concrete business module needs.
- Documentation before SPR-207A was fragmented across several older files.

## Known Risks

- Database schema and Prisma migration history now support durable CRM/Sales persistence; platform engines are not yet persisted.
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
- Ventes now exposes Paiements at `/sales/payments`, and open invoice details can register an in-memory payment against the remaining balance.
- The visible Sidebar now reads the official Sales navigation source, matching the CRM integration pattern.
- The visible Sidebar now follows the official product structure: Accueil, CRM, Ventes, Stock, Finance, Équipe, Analyse, IA and Système, with CRM and Ventes driven by registered business modules.
- CRM now shows `Vue d'ensemble` as its home entry, while `Pipeline commercial` lives under Ventes and keeps the existing `/crm/opportunities` route.
- Dashboard now opens with a guided business cockpit: greeting, five primary actions, focused KPIs, today's priorities and compact recent activity.
- Sidebar spacing, hierarchy and active states have been softened to reduce visual noise and explain the product faster.
- Shared CRM/Sales cards, headers, tables, filters, empty states, pagination and forms now use calmer spacing, typography and interaction states.
- CRM contextual sidebar entries no longer show visible `via contact` or `via société` badges; contextual metadata remains internal for helper titles and routing.
- Contacts and Activités guide users to Sociétés, while Réunions, Tâches and Notes guide users to an existing contact workspace.
- CRM overview and contextual panels now use calmer French wording to explain that contacts live under societies and meetings, tasks, notes and contact activity live under contact workspaces.
- Global Search now has a calm topbar entry point with platform-aware `⌘K` / `Ctrl+K` shortcut display.
- The search dialog opens from click or keyboard shortcut, closes with ESC or outside click, traps focus and presents Recent, Suggestions and Navigation sections as UI placeholders.
- The search platform now exposes a section resolver contract so future sprints can inject real search providers without changing the shell.
- CRM Experience 2.0 improves visible hierarchy, spacing, hover states, rounded surfaces, empty states, tables, filters, sticky tabs and inspectors across CRM home, companies, contacts and pipeline screens.
- CRM Experience 2.0 Visual Impact Continuation adds a high-impact CRM home hero, stronger KPI cards, more attractive CRM cards, richer table headers and clearer status badges so the change is visible immediately.
- CRM detail workspaces now present company/contact identity, actions, related panels and contextual timelines with a calmer, more executive visual rhythm.
- Opportunity cards and pipeline stages now scan faster with richer card hierarchy, sticky inspector context and clearer commercial metrics.
- CRM Product Revolution transforms the visible CRM language with launch-grade heroes, a relationship command strip, stronger record identity bands, premium metric cards, richer tables, bolder empty states and a pipeline hero designed to create a premium first impression in less than five seconds.
- Product Identity Foundation introduces reusable BOSIACO product primitives for hero sections, action cards and section headers, then aligns Dashboard, CRM and Sales around the same premium rhythm: hero, business insights, primary actions, main content and secondary context.
- CRM Home Visual Cleanup removes the isolated floating plus buttons from CRM quick actions and replaces the area with one grouped, compact and aligned Actions rapides section that better matches the premium BOSIACO identity.
- CRM Home Quick Actions Layout refinement keeps the grouped section but makes it lighter, more balanced and closer to the surrounding CRM Home rhythm without restoring floating plus controls.
- KPI Card Icon Normalization removes the oversized pale decorative icon background from the shared metric card and standardizes icon tile size, placement and visual weight across Dashboard and CRM KPI rows.
- KPI Card Vertical Rhythm improves the shared metric card spacing so KPI values have more breathing room from the title and icon tile while preserving colors, data, routes and the BOSIACO top accent.
- Executive Dashboard Revolution reframes the Dashboard as a business cockpit: executive daily summary, business health, priority center, performance, recent changes and secondary quick actions.
- Module Identity & Product Personality gives Dashboard, CRM, Sales, HR and Reports distinct visual signatures while preserving the shared BOSIACO product language, so each module communicates its purpose before the user reads the page title.
- CRM Workspace Independence restores predictable navigation: Contacts, Activités, Réunions, Tâches and Notes now open their own CRM workspaces while preserving contextual links back to related companies and contacts.
- CRM Contacts Navigation fix removes the remaining contextual classification from independent CRM sidebar workspaces so Contacts is treated as a direct `/crm/contacts` navigation item.
- CRM Contacts Sidebar Click Handler fix moves sidebar group resolution inside the Sidebar render path so the rendered Contacts link uses the current `/crm/contacts` route instead of a stale module-level navigation snapshot.
- Professional Workspace Optimization reduces vertical space across product heroes, topbar controls, KPI cards, entity tables, filters, workspace cards and CRM/Sales panels so major modules show more useful information above the fold while preserving the BOSIACO identity.
- Professional Workspace Controls upgrades shared search, filter, toolbar, action, pagination, empty-state and table selection treatments so CRM and Sales daily-use controls feel faster, clearer and more SaaS-grade without changing business behavior.
- Professional Forms Experience upgrades the shared dialog and form primitives, then organizes CRM and Sales data-entry dialogs into calmer sections with consistent required-field hints, validation messages, checkbox rows and footer actions.
- Universal Command Center replaces the placeholder global search foundation with a navigation-only command palette powered by a reusable local command registry, global `⌘K` / `Ctrl+K`, instant filtering, arrow navigation and Enter-to-open workspace routing.
- Smart Global Search extends the Command Center with a local record search registry for companies, contacts, customers, quotes, invoices, payments and opportunities, grouped separately from navigation commands with instant client-side filtering and safe existing routes.
- Quick Create Everywhere extends the Command Center with a separate action registry for common creation flows, showing Quick Create before Navigation and Records and opening existing BOSIACO dialog surfaces directly from `⌘K` / `Ctrl+K` without workspace navigation.
- Smart Entity Picker introduces a reusable keyboard-first combobox for selecting related companies, contacts, customers, quotes and invoices from local data, then integrates it into quote creation, quick-create invoice/payment/opportunity surfaces and the customer company field without changing business logic.
- Inline Entity Creation extends Smart Entity Picker with optional `+ Créer` flows for missing local entities, allowing quote/customer/invoice creation surfaces to create and select local form values without leaving the parent workflow or changing persistence behavior.
- Favorites & Recent adds local Command Center memory for favorite destinations/records and recently opened items, using bounded browser storage, compact star toggles and history sections without backend persistence or new business logic.
- Contextual Actions introduces a reusable compact action-chip framework and adds next-step suggestions to quote, invoice, payment, customer, company and contact surfaces using existing routes, tabs and local handlers only.
- Quote & Invoice Creation Workflow completion adds shared Sales line-item editing, real Quote and Invoice dialogs, product-assisted manual lines, calculated totals and local store synchronization so new commercial documents appear immediately in their workspace lists.
- Quote & Invoice PDF Export adds saved-document PDF preview, download and print actions to Quote and Invoice details, reusing the existing premium PDF renderer and routing newly created documents to their detail page for immediate export.
- Keyboard Everywhere adds a client-safe keyboard foundation, contextual create shortcuts, stable dialog submit shortcuts, shortcut help, table/list row navigation and refined contextual action keyboard behavior without changing business logic.
- Zero Friction CRM Workspace & Details Polish hides unfinished CRM detail tabs, removes inert CRM controls, connects Company detail favorite/edit actions, simplifies Contact table actions and removes visible "coming soon" CRM copy while preserving future surfaces behind lightweight visibility configuration.
- Zero Friction Dialog Sizing adds shared `EntityDialog` sizes, applies wider surfaces to Quote, Invoice, Company, Customer and Payment creation/edit flows, and improves sales line-item desktop readability while preserving mobile stacking and existing form behavior.
- Zero Friction CRM ↔ Sales Entity Sync makes Companies, Customers and Contacts share live local module-owned sources with Sales creation flows, Smart Entity Picker, Quick Create and Command Center Record Search so current-session entities become available without refresh.
- Durable CRM/Sales Persistence Foundation adds tenant-scoped Prisma models, a server persistence repository, a client hydration bridge and write-through paths for Companies, Customers, Contacts, Quotes, Invoices and stable Payments so core business records can survive refresh and restart once the local PostgreSQL migration is applied.
- Database Activation & Persistence Verification tightened CRM/Sales writes so dialogs wait for persistence confirmation, rollback local caches on failure and keep entered form data visible.
- Migration Baseline Repair adds the missing pre-PERSIST baseline migration before the CRM/Sales persistence migration, allowing Prisma to replay the complete schema from an empty PostgreSQL database and confirming Company, Customer, Contact, Quote, Invoice and Payment records survive a dev-server restart.
- Company-Centric CRM Simplification makes Société the visible commercial account, hides standalone Customer entry points, maps Quote/Invoice compatibility customer fields from the selected Company and adds Company detail access to Payments.
- ZF-R6 CRM Contacts & Activities Foundation unifies the global Contacts directory with the persisted Contact source, adds tenant-scoped persisted Meetings, Tasks and Notes, replaces demo-only CRM activity pages with functional workspaces and hides Timeline until a real persisted event source exists.
- ZF-R7A Alpha Blockers Cleanup hides demo-era ERP modules from production navigation, removes unfinished topbar controls, converts CRM Home to shared live CRM/Sales stores and hides the seed-backed Pipeline/Opportunities workflow until persistence exists.
- ZF-R7B High Priority Product Cleanup restricts Quick Create to stable dialog-backed actions, cleans Command Center labels/results, standardizes CRM activity save feedback and redirects legacy demo routes away from unfinished screens.
- SPR-401 Module Registry Foundation adds a platform-owned declarative module descriptor registry for future Editions, module activation, dependency management and dynamic product surfaces. Registration is metadata only and does not activate or expose hidden modules.
- SPR-402 Module Activation Engine adds the first authoritative active-module resolver, current Alpha activation profile, dependency resolution, route/feature query helpers and low-risk Sidebar/Command Center activation filtering without changing visible product behavior.
- SPR-403 Edition Profiles Foundation adds a platform-owned Edition profile registry, current Alpha Edition source, future commercial Edition metadata and Edition-to-Activation adapter so one codebase can support future Editions without changing the Alpha UI.
- SPR-404 Dynamic Navigation & Route Availability makes active modules the source of truth for Sidebar and Command Center navigation, centralizes route ownership and enforces inactive-module redirects through middleware while preserving current Alpha parity.
- SPR-405 Dynamic Dashboard Contributions adds a platform-owned contribution registry and resolver so active modules can contribute Dashboard sections through metadata while the current Dashboard remains visually unchanged.
- PLATFORM-ARCH-001 creates `docs/05_PLATFORM_ARCHITECTURE.md` as the mandatory architecture constitution before Product Catalog Foundation begins.
- SPR-406 Product Catalog Foundation creates the canonical product catalogue while keeping Product planned/inactive in Alpha, so no Product navigation or Sales workflow changes are visible yet.
- SPR-407 Inventory Domain Foundation creates the inventory business engine for warehouses, balances, movements, reservations and availability while keeping Inventory planned/inactive in Alpha.
- SPR-408 Inventory Workspace creates the first functional stock workspace over the Inventory posting engine, including balances, warehouses, movement history and manual receipt/issue/transfer/adjustment dialogs, while keeping Inventory inactive and unavailable in the current Alpha runtime.
- SPR-408B Product Catalog Import & Export adds XLSX/CSV templates, import parsing, column mapping, row-level validation, duplicate policies, server-confirmed Product import and all/filtered/selected Product exports without importing Inventory quantities or movements.
- SPR-408C Shared Import / Export Framework extracts Product import/export mechanics into `src/platform/import-export/` with reusable importer/exporter definitions, mapping, validation, preview, templates, CSV/XLSX helpers, duplicate policies and error reports while preserving Product behavior and Alpha visibility.
- SPR-409 Reservation & Availability Engine makes availability the canonical Inventory authority, adds `ReservationService`, structured movement references, reservation/release persistence through the existing Inventory API and reservation history display while keeping Inventory inactive in Alpha.
- SPR-409A Reservation QA Workspace adds a controlled Inventory-only `Réservations` tab with manual reservation and release dialogs so the Reservation Engine can be authenticated and persistence-tested before Sales Orders, Delivery Notes or Purchasing exist.
- SPR-410 Commercial Documents Foundation adds platform-owned document primitives, definitions, calculations, validation, status and lifecycle helpers, then routes Quote and Invoice totals through the shared foundation while preserving current Alpha behavior.
- SPR-411 Procurement Foundation adds canonical Suppliers, Purchase Orders, Purchase Order Lines, tenant-scoped persistence, Procurement routes, activation-gated Command Center metadata and Supplier import/export definitions while keeping Procurement inactive in Alpha.
- SPR-412 Goods Receipt & Inventory Posting adds persistent Goods Receipts, receipt lines, the `/procurement/goods-receipts` workspace, Purchase Order `Recevoir` flow, Command Center metadata and transaction-safe Inventory `RECEIPT` posting while keeping Procurement/Inventory inactive in Alpha.
- SPR-413 Sales Orders Foundation adds persistent Sales Orders, Sales Order lines, `/sales/orders` routes, Quote-to-Order conversion, PDF export, activation-gated Command Center metadata and optional Inventory reservation/release flows while keeping Sales Orders inactive in Alpha.
- SPR-413A Quote Product Identity & Sales Order QA preserves optional Product identity on Quote and Invoice lines, carries Product-backed lines into Sales Orders, keeps free-form lines non-inventory, adds Draft Sales Order edit and protects reservation retries from double-reserving already reserved quantities.
- SPR-413B Inventory-Tracked Product QA Fix exposes the existing `Product.flags.trackInventory` contract in the Product create/edit dialog, defaults new Products to stockable, excludes services from manual Inventory movements and protects unsafe stockable-to-service transitions while keeping Alpha as the only default profile.
- SPR-414 Delivery Notes & Physical Stock Issue adds persistent Delivery Notes, partial/full fulfillment, reservation consumption, transaction-safe Inventory `ISSUE` posting, Sales Order delivery status updates, activation-gated workspace/Command Center integration and non-financial PDF rendering while keeping Alpha as the only default profile.
- SPR-414A Delivery Note Quantity Precision QA Fix removes native micro-stepping, supports comma/dot decimals, normalizes the same quantity across Delivery, Inventory and Sales Orders, and clarifies the projected draft remainder without a schema change.
- SPR-415 Business Timeline Engine Foundation adds a Runtime-first generic timeline registry, provider contract, service facade and reusable UI renderer so future modules can reconstruct complete entity journeys without changing existing business behavior.
- SPR-416 Sales Timeline Provider proves the timeline provider model with existing Sales records, resolving Quote, Sales Order, Invoice and Payment journeys through explicit relationships only.
- SPR-417 Inventory & Delivery Timeline Provider connects logistics execution to Sales Order journeys through explicit reservation, Delivery Note and Inventory movement relationships without changing Delivery or Inventory behavior.
- SPR-418 Business Timeline UI Integration places the first read-only production timeline on Sales Order details, loading `sales.order` journeys through `TimelineService` and preserving generic UI/provider boundaries.
- SPR-419 Business Timeline UX Hardening improves the Sales Order Timeline presentation, accessibility, retry and stale-result protections, and documents the current authenticated QA blocker: `/sales/orders` is unavailable under default `alpha.crm-sales`.
- SPR-420 Unified Global Search Foundation adds the canonical provider-based Search Runtime and SearchService facade for future Global Search, Command Center, HicoPilot, AI Agent and quick navigation consumers without adding UI or business search.
- SPR-421 Unified Search Provider Implementation replaces placeholder CRM/Sales providers with deterministic Companies, Contacts, Quotes, Invoices, Sales Orders, Delivery Notes and Payments results while preserving Runtime import boundaries and legacy search compatibility.

## Validation Status

| Command | Required | Latest Known Result |
| --- | --- | --- |
| `npm run typecheck` | Yes | Passed during SPR-421. |
| `npm run build` | Yes | Passed during SPR-421; the known PDF preview image warning remains. |
| `npm run validate:runtime` | Yes for platform work | Passed during SPR-421 with 156/156 checks, including real CRM/Sales Unified Search providers, ranking, module filtering, workspace isolation and import-safety coverage. |
| Prisma schema validation | Yes for persistence work | Passed during SPR-414A; no schema change or new migration was required. |
| Prisma migration replay | Yes for persistence work | Migration `20260715171406_delivery_notes_physical_issue` applied; fresh replay result is recorded in the final report. |

## Repository Health

The repository is suitable for incremental platform work. Future work should continue to preserve visible UI and business behavior while moving shared capabilities into engines, services, contexts and runtimes.
