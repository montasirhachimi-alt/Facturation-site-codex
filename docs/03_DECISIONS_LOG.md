# HicoPilot Architecture Decision Records

## ADR-037 — Delivery Quantities Reuse Canonical Inventory Precision

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-15 |

### Decision

Delivery Note quantity entry, persistence and posting reuse the canonical Inventory six-decimal quantity policy. Editable form quantities remain controlled locale-aware strings until explicit conversion; the server normalizes again before persistence and uses one normalized quantity for reservation consumption, Inventory `ISSUE` and Sales Order delivery updates.

### Motivation

Native number input stepping with `step="0.000001"` could place values such as `3.000003` in Delivery Note form state. Normalizing only after that state crossed module boundaries was too late to provide deterministic user feedback and trusted persistence.

### Consequences

Delivery Notes do not define a competing precision policy. Draft details show the projected remainder after the current BL. No Prisma migration is required, posted history remains immutable, and Alpha activation is unchanged.

## ADR-036 — Delivery Notes Own Physical Customer Stock Issue

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-15 |

### Decision

Sales Orders own customer commitment and optional reservation. Delivery Notes own physical customer stock issue. Posting a Delivery Note transactionally consumes applicable reservation, creates Inventory `ISSUE` movements, updates delivered quantities and changes the Sales Order delivery status.

Delivery Notes V1 include only Product-backed lines whose canonical Product has Inventory tracking enabled. Posted Delivery Notes are immutable and non-financial PDFs omit prices and totals.

### Motivation

Reservation must not reduce on-hand stock, and Invoices must remain financial documents. A dedicated posting document creates one auditable boundary between commitment and physical fulfillment while supporting partial deliveries safely.

### Consequences

`sales.delivery-notes` is active only in the controlled `sales-operations` profile and remains inactive in `alpha.crm-sales`. The repository performs posting in one serializable Prisma transaction and prevents double posting, over-delivery, cross-tenant access and simple Sales Order cancellation after delivery. Customer Return and reversal remain future workflows.

## ADR-035 — Quote Conversion Creates Sales Orders In The Sales Orders Workspace

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Quote-to-Sales-Order conversion must always create the Sales Order in the canonical Sales Orders workspace:

```text
sales-orders-main
```

The source Quote remains in the Quotes workspace:

```text
sales-quotes-main
```

The relationship between both documents is represented by `sourceQuoteId` and `sourceQuoteNumber`, not by sharing the same workspace ID.

### Motivation

QA found that converting an accepted Quote redirected to `/sales/orders/:id`, but the detail page displayed `Commande client introuvable.`

The converted Sales Order had inherited `quote.workspaceId`, so the Sales Orders detail workspace could not resolve it.

### Consequences

`SalesOrderService.createFromQuote()` now writes converted orders to `SALES_ORDERS_WORKSPACE_ID`.

The persistence repository rejects Sales Orders persisted under the wrong workspace.

No Delivery Note, physical stock `ISSUE`, accounting, Prisma migration, permission or route behavior was introduced.

## ADR-034 — Quote Lifecycle Gates Sales Order Readiness

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Quote lifecycle actions must reuse the Commercial Documents lifecycle instead of creating a second Sales status system.

The minimal V1 Quote lifecycle is:

```text
draft -> sent -> accepted / refused
```

Sales Order conversion is available only when the source Quote is `accepted`. The persistence repository validates both Quote status transitions and Sales Order source Quote status.

### Motivation

SPR-413D fixed Quote-to-Sales-Order quantity conversion, but newly created Quotes remained `draft` and there was no stable user flow to mark a Quote as accepted. This made the conversion technically correct but practically inaccessible.

### Consequences

Quote details expose contextual lifecycle actions for `draft` and `sent` Quotes.

New Quotes must be persisted as `draft`; direct `draft -> accepted` is rejected.

Sales Orders with a `sourceQuoteId` are rejected unless the source Quote belongs to the tenant and is accepted.

No Delivery Note, physical stock `ISSUE`, Returns, Accounting, Manufacturing, POS, AI, Kanban, Prisma migration, permission or authentication behavior was introduced.

## ADR-033 — Persisted Commercial Numeric Fields Hydrate As Plain Numbers

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

CRM/Sales persistence mapping must convert Prisma Decimal values to plain JavaScript numbers before records enter client local stores, dialogs, conversion adapters, PDFs or calculation wrappers.

Quote to Sales Order conversion explicitly maps:

```text
QuoteItem.quantity → SalesOrderLine.quantityOrdered
```

and must never rely on object spreading across incompatible commercial line models.

### Motivation

Authenticated Sales Operations QA found that a Quote line with quantity `8` could open as a Sales Order draft line with quantity `0`.

Product identity, description, price and VAT were preserved, but persisted numeric values could cross the server/client boundary as Decimal-like values. That destabilized dialog and normalization paths expecting plain numbers.

### Consequences

Quote, Invoice, Payment and Sales Order numeric fields are normalized at repository hydration.

Product-backed converted lines preserve Product ID, SKU/name snapshots and negotiated commercial values. Free-form lines preserve quantity and prices without inferring Product identity.

Sales Order totals continue to be recalculated through the Commercial Documents Foundation.

No Prisma migration, Inventory rule, Reservation rule, Delivery Note, physical stock `ISSUE`, Returns, Accounting, Manufacturing, POS, AI or Kanban behavior was introduced.

## ADR-032 — Inventory Workspace Uses Authenticated Tenant Scope And Canonical Quantity Policy

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Inventory workspace reads must use the same tenant identity as persistence writes.

For the current authenticated demo environment, Inventory workspace scope is derived from `activeCompanyId` instead of a stale hardcoded local company ID.

Inventory quantities use a single 6-decimal normalization policy through `normalizeInventoryQuantity()`, `parseInventoryQuantityInput()` and related helpers.

### Motivation

Warehouse creation was confirmed by the server but disappeared in the UI because the server wrote records under the authenticated tenant while the workspace filtered the applied snapshot under another company ID.

Manual stock quantity inputs also relied on native number stepping and raw `Number(...)` parsing, which could expose floating-point artifacts during QA.

### Consequences

Warehouse tables, Manual Receipt selectors, reservation selectors and Inventory KPIs now consume the same canonical Inventory snapshot and tenant scope.

Manual Inventory and reservation dialogs use controlled decimal text inputs with deterministic Arrow Up/Down behavior.

The server repository normalizes movement quantities before updating balances and movement history, and rejects non-stocked Products for Inventory posting.

No Prisma migration, Delivery Notes, physical stock `ISSUE`, Returns, Accounting, Manufacturing, POS, AI or Kanban behavior was introduced.

## ADR-029 — Procurement Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-411 introduces Procurement as a dedicated business module foundation with canonical Suppliers and Purchase Orders.

Suppliers are not CRM Companies. Purchase Orders reuse the Commercial Documents Foundation and Product Catalog references.

### Motivation

Product Catalog, Inventory, Reservation and Commercial Documents foundations are now available. BOSIACO can introduce Procurement without duplicating product models, stock logic or document calculation rules.

### Consequences

Procurement remains inactive in `alpha.crm-sales`.

The Purchasing profile can activate `procurement.overview`, `procurement.suppliers`, `procurement.purchase-orders` and the `sales.products` dependency.

No Goods Receipt, Supplier Invoice, Accounting, Payments, Inventory posting, purchase approval, purchase requests or RFQ workflow was introduced.

## ADR-028 — Commercial Documents Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-410 introduces `src/platform/commercial-documents/` as the canonical foundation for commercial document primitives.

Quotes and Invoices consume the shared calculation, validation, status and lifecycle foundation through existing Sales wrappers. Future Sales Orders, Delivery Notes, Purchase Orders, Goods Receipts and Supplier Invoices are registered as planned metadata only.

### Motivation

BOSIACO now has Product Catalog, Inventory, Reservation and Sales foundations. Before adding advanced commercial workflows, document structure must be standardized so future modules do not create incompatible line, total, tax, discount, numbering or lifecycle rules.

### Consequences

The current Alpha UI and workflows remain unchanged.

Commercial document platform code is dependency-light and does not import React, Prisma, CRM/Sales UI, Inventory or repositories.

Persistence remains module-owned and tenant-scoped. Inventory Reservation remains a separate authority and future document references must not mutate stock directly.

## ADR-027 — Inventory Domain Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-407 introduces Inventory as a domain foundation, not a visible module.

Inventory references the canonical Product Catalog and owns warehouse, balance and stock movement concepts.

`inventory.stock` remains planned and hidden in the current Alpha activation profile.

### Motivation

Product describes what the company sells. Inventory must describe where products are, how much exists and how much is available.

This separation is required before future Inventory UI, Purchasing, Delivery or Sales stock behavior can be implemented safely.

### Consequences

Inventory has tenant-scoped Prisma tables and a transaction-oriented repository.

Posting movements updates balances atomically.

No Sidebar entry, Dashboard widget, Command Center entry, Purchasing workflow or Sales integration is introduced by this decision.

## ADR-026 — Canonical Product Catalog Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-406 establishes the Product Catalog as the canonical product foundation for future Sales, Inventory, Purchasing, Delivery, Production and Reporting modules.

The existing Prisma `Product` model is extended rather than replaced, preserving one Product model and avoiding a duplicated catalogue.

`sales.products` remains planned and hidden in the current Alpha activation profile.

### Motivation

BOSIACO needs a single Product Catalog before adding Inventory, Purchasing or advanced Sales document behavior. Without one canonical model and service, future modules would create duplicate product concepts and inconsistent SKU, VAT and pricing behavior.

### Consequences

Product data is tenant-scoped and persists through a dedicated Product Catalog repository.

The repository mirrors canonical product fields into legacy fields for compatibility.

Search integration is prepared but activation-gated, so Product records do not appear in Alpha unless the Product module is activated later.

Inventory, Purchasing, barcode scanning, variants and price lists remain future work.

## ADR-025 — Platform Architecture Constitution

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

PLATFORM-ARCH-001 creates `docs/05_PLATFORM_ARCHITECTURE.md` as the mandatory architecture constitution for future BOSIACO platform and business-module work.

The constitution consolidates the rules from SPR-401 through SPR-405: Module Registry, Activation Engine, Edition Profiles, Dynamic Navigation, Route Availability, Command Center integration and Dashboard Contributions.

### Motivation

Before Product Catalog, Inventory, Purchasing, HR and future modules begin, BOSIACO needs one authoritative document so future development does not re-decide dependency direction, module lifecycle, route ownership, persistence boundaries or prohibited patterns.

### Consequences

Future platform and business-module sprints must read `docs/05_PLATFORM_ARCHITECTURE.md`.

New modules must use the platform contracts instead of hardcoding navigation, checking Edition IDs directly or bypassing activation and route availability.

This decision changes documentation only. No application code, Runtime, Prisma, persistence, authentication, permissions or UI behavior changed.

## ADR-024 — Dynamic Dashboard Contributions

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-405 introduces a metadata-only Dashboard Contribution Registry under `src/platform/dashboard/`.

Active modules may contribute Dashboard widgets through `DashboardContribution` descriptors. Contributions are resolved through the current `ModuleActivationResult` before the Dashboard renders.

Dashboard metadata stores render keys, not React components.

### Motivation

The platform can now describe modules, activate modules, define Editions and derive navigation/routes from active modules. The Dashboard must become another platform consumer so future modules can contribute widgets without making the Dashboard aware of CRM, Sales, Inventory, HR, Finance or AI directly.

### Alternatives

- Keep manually assembling Dashboard widgets in the Dashboard page.
- Store React components in module descriptors.
- Introduce dashboard editing, analytics or widget customization immediately.
- Let future modules patch the Dashboard page directly.

### Consequences

The current Dashboard visual result remains unchanged.

The Dashboard page maps platform render keys to existing UI components locally, preserving import safety.

Future modules can add metadata contributions without changing navigation, activation or route availability foundations.

## ADR-023 — Dynamic Navigation and Route Availability

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-13 |

### Decision

SPR-404 makes active modules the source of truth for module-backed navigation and route availability.

Sidebar and Command Center destinations are composed from `ModuleDescriptor.navigation` metadata filtered through the current `ModuleActivationResult`.

Module route availability is centralized in `module-route-availability.ts` and enforced in middleware after authentication and before RBAC.

### Motivation

SPR-401 described modules, SPR-402 activated them and SPR-403 introduced Edition profiles. BOSIACO now needs route and navigation behavior that follows activation so future Editions can safely hide unavailable modules without duplicating sidebars, route maps or product code.

### Alternatives

- Keep hardcoded Sidebar and Command Center mappings.
- Let each page decide whether its module is available.
- Check Edition IDs directly inside UI consumers.
- Add a paywall or upgrade screen before licensing exists.

### Consequences

The current Alpha UI remains unchanged.

Legacy compatibility routes redirect through a central mapping. Inactive module routes redirect to a safe fallback, usually `/dashboard`. Unknown routes preserve normal Next.js not-found behavior.

Consumers depend on activation state, never directly on Edition IDs.

## ADR-022 — Edition Profiles Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-12 |

### Decision

SPR-403 introduces a metadata-only Edition Profile Registry under `src/platform/editions/`.

Edition profiles describe commercial product configurations such as Alpha CRM & Sales, Basic, CRM, Sales, Inventory, Purchasing, HR, Enterprise and Custom.

Edition profiles do not activate modules directly. They are converted into `ModuleActivationRequest` objects and resolved through the Module Activation Engine.

### Motivation

BOSIACO needs one codebase that can support multiple future commercial Editions without duplicating applications, branches, sidebar logic or Command Center logic.

The platform already knows what modules exist through SPR-401 and which modules are active through SPR-402. It now needs a safe way to describe Edition intent before licensing, tenant assignment or dynamic route gating are added.

### Alternatives

- Hardcode Edition behavior inside Sidebar or Command Center.
- Add a user-facing Edition selector immediately.
- Build licensing and billing before Edition metadata is stable.
- Keep the Alpha activation input as a standalone module list separate from commercial Edition definitions.

### Consequences

The current Alpha product remains unchanged.

The current runtime default is `alpha.crm-sales`, and it drives the existing Module Activation Engine.

Future Editions exist as serializable metadata only. Planned modules such as Inventory, Purchasing, HR and AI remain inactive and hidden.

Consumers must continue to depend on activation state, not Edition IDs.

## ADR-021 — Module Activation Engine

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-12 |

### Decision

SPR-402 introduces a deterministic Module Activation Engine under `src/platform/modules/`.

The engine resolves active modules from declarative activation input, required dependencies, explicit disables, hidden/planned lifecycle rules and the current Alpha profile.

Registration describes existence. Activation determines availability.

### Motivation

SPR-401 made module metadata explicit, but BOSIACO still needed one authoritative answer for which modules are available in a given profile. This is required before Edition profiles, licensing, dynamic navigation, route gating or tenant module configuration can be implemented safely.

### Alternatives

- Keep hardcoded active module arrays in Sidebar, Command Center and Dashboard.
- Treat all registered modules as active.
- Implement licensing and Edition profiles immediately.
- Persist activation state before the activation rules are stable.

### Consequences

The current visible Alpha product remains unchanged.

Sidebar and Command Center navigation now consume activation metadata in low-risk filtering paths. Hidden and planned modules remain inactive and absent.

The engine prepares future route gating, feature queries and Edition profiles without touching Prisma, authentication, permissions, persistence or business workflows.

## ADR-020 — Platform Module Registry Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-12 |

### Decision

SPR-401 introduces a platform-owned Module Registry under `src/platform/modules/`.

The registry describes modules through lightweight metadata: stable IDs, category, lifecycle status, visibility, default enablement, dependencies, feature keys, navigation metadata, Command Center metadata and dashboard contribution metadata.

Registration does not equal activation.

### Motivation

BOSIACO is entering the Modular Editions Platform phase. Future editions such as Basic, CRM, Sales, Inventory, Purchasing, HR, Enterprise and Custom must come from one codebase through configuration and activation, not separate applications or Git branches.

The product needs a deterministic module description layer before implementing activation, licensing, Edition definitions or dynamic product surfaces.

### Alternatives

- Continue using only the historical Core Registry.
- Encode Edition behavior directly in the Sidebar or Command Center.
- Introduce database-backed module activation immediately.
- Auto-scan filesystem routes to discover modules.

### Consequences

The registry is client-safe and does not import React UI, Prisma, server persistence, page modules or browser globals.

Current Sidebar, Command Center, Dashboard and persistence behavior remain unchanged.

Hidden and planned modules can be registered for planning without becoming visible. Future sprints may consume the registry for Edition definitions, activation rules, navigation filtering, Command Center filtering, dashboard contributions and licensing.

## ADR-019 — Durable CRM/Sales Persistence Bridge

| Field | Value |
| --- | --- |
| Status | Accepted |
| Date | 2026-07-10 |

### Decision

PERSIST-001 introduces dedicated Prisma models for product CRM/Sales records instead of overloading the existing tenant `Company`, legacy `Client`, `Document` and `Payment` tables.

The existing module-owned local services remain the live client cache/subscription layer. Durable authority moves to a server-side Prisma persistence repository scoped by the authenticated session `companyId`.

### Motivation

ZF-R5 made CRM and Sales coherent inside one browser session, but Companies, Customers, Contacts, Quotes, Invoices and stable Payments were still lost after refresh because the services were in-memory.

The project needs durable records without replacing existing dialogs, Smart Entity Picker, Command Center, details pages or PDF workflows.

### Alternatives

- Reuse the tenant `Company` model as CRM Company records.
- Reuse legacy `Document` rows directly for the newer Quote/Invoice workspaces.
- Store records in `localStorage` or another browser-only source.
- Rewrite CRM/Sales workflows around new server-first pages.

### Consequences

UI and generic picker components remain database-free.

CRM/Sales records are scoped by the current authenticated `companyId`.

The local services become caches over persisted data and are hydrated when the ERP shell loads.

A future reliability sprint should make form submit states await database confirmation and surface persistence failures directly in the UI.

## ADR-001 — Core Registry

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

HicoPilot uses a Core Registry as the source of truth for module definitions, including identifiers, names, categories, icons, routes, permissions, searchability, favorites and widget references.

### Motivation

Navigation, search, commands, permissions, favorites and future AI context all need consistent module metadata.

### Alternatives

- Keep module definitions hardcoded in each UI component.
- Store module metadata only in the database.

### Consequences

Platform features can reuse one module catalog. The current implementation remains static and must later be connected to persistence only when needed.

## ADR-002 — Search

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Search is service-driven and currently uses Core Registry module data through adapters.

### Motivation

Header search and future universal search need one consistent search foundation.

### Alternatives

- Keep search UI-specific.
- Implement backend search immediately.

### Consequences

Search can evolve toward commands, recent items, favorites and AI context without changing current UI.

## ADR-003 — Command Palette

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Command Palette commands are generated through CommandService and adapter layers rather than isolated static UI definitions.

### Motivation

Future commands must support navigation, workspace context, plugins, AI agents and permissions.

### Alternatives

- Keep command definitions inside the command palette component.
- Add business commands directly to UI.

### Consequences

The current palette can remain visually stable while command sources become dynamic.

## ADR-004 — Workspace Service

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

WorkspaceService owns workspace snapshots and coordinates modules, widgets, preferences, favorites, recent items, notifications and activities.

### Motivation

Dashboard, AI context, navigation and future workspace switchers need one workspace-aware source.

### Alternatives

- Let each UI area assemble workspace data independently.
- Add workspace behavior directly to Core Engines.

### Consequences

Workspace logic remains centralized in the service layer. Current data is static/in-memory.

## ADR-005 — Workspace Context

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Workspace Context exposes active workspace state to React consumers but delegates loading, switching and snapshot refresh to WorkspaceService.

### Motivation

React components need a stable state bridge without owning business orchestration.

### Alternatives

- Use local dashboard state.
- Introduce Redux, Zustand or another external state library.

### Consequences

The platform gets a lightweight state layer while preserving service ownership of business behavior.

## ADR-006 — Platform Composition

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

HicoPilot follows the dependency direction: Core Engines → Application Services → Context/Runtime → UI.

### Motivation

The product needs predictable extension points for widgets, AI, plugins, workspaces and marketplace features.

### Alternatives

- Allow services and UI to import each other freely.
- Build feature modules as isolated vertical stacks.

### Consequences

Layer boundaries are clearer. New features must respect dependency direction.

## ADR-007 — Widget Runtime

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Dashboard widgets receive workspace, snapshot, preference, visibility, loading, error and permission context from a shared Widget Runtime.

### Motivation

Future dashboards need many widgets without duplicated workspace requests and local runtime state.

### Alternatives

- Let each widget call Workspace Context directly.
- Build widget orchestration inside Dashboard components.

### Consequences

The dashboard gets an execution boundary for future widget behavior while the current UI remains unchanged.

## ADR-008 — Platform Event Runtime

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

HicoPilot adopts a lightweight internal Platform Event Runtime as the communication backbone between future business services and future notification, activity, audit, plugin and AI runtimes.

### Motivation

Direct service-to-runtime coupling would make future platform modules difficult to evolve. Business services should emit events without knowing which runtime consumes them.

### Alternatives

- Let business services call notification, activity and audit services directly.
- Introduce an external event library or broker.
- Persist every event immediately through the database.

### Consequences

The runtime remains synchronous, in-memory and framework-agnostic. It creates a decoupling contract without implementing notifications, activities, audit, plugins or AI.

## ADR-009 — Core Search Separation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Core Search remains framework-agnostic. React-specific universal search files, including provider, hook and dialog code, live under `src/platform/search/`.

### Motivation

Core Engines must not depend on React, UI libraries, providers, contexts or components. Search UI can consume Core Search, but Core Search must remain pure TypeScript so it can support future services, runtimes, plugins and AI context without framework coupling.

### Alternatives

- Keep React search provider and dialog files inside `src/core/search/`.
- Move the universal search UI into generic components without a platform boundary.
- Rewrite the search feature during the separation.

### Consequences

`src/core/search/` now exports only search types, registry and services. Existing UI imports the universal search provider and hook from `src/platform/search/`. Search behavior remains unchanged while dependency direction is corrected.

## ADR-010 — Preferences Runtime

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Runtime consumers access preferences through Preferences Runtime instead of reading Workspace Context or PreferencesService directly.

### Motivation

Theme, density, language, format, widget preferences and future feature flags need one stable runtime access point.

### Alternatives

- Let each runtime or component filter preferences independently.
- Add preference access directly to Widget Runtime.

### Consequences

Preferences are prepared once and distributed consistently. Editing preferences and persistence remain future work.

## ADR-011 — Runtime Validation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

HicoPilot uses a lightweight Node-based runtime validation script to protect platform architecture before adding more runtime layers.

### Motivation

The platform now contains several foundational runtimes and contexts. Before implementing Notification, Activity, Audit, Plugin and AI runtimes, the project needs practical regression checks for event delivery, runtime boundaries, workspace delegation and Core Search separation.

### Alternatives

- Add a full testing framework immediately.
- Rely only on `npm run typecheck` and `npm run build`.
- Delay runtime validation until business modules are persisted.

### Consequences

`npm run validate:runtime` becomes a required architecture check. The current script intentionally remains small, dependency-free and focused on runtime contracts rather than exhaustive feature coverage.

## ADR-012 — Notification Event Subscriber

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Notifications consume Platform Events through a dedicated Notification Event Subscriber instead of being called directly by business services.

### Motivation

Business services should emit events without knowing which platform capability consumes them. Notifications are one consumer of the event backbone, alongside future activity, audit, plugin and AI runtimes.

### Alternatives

- Let business services call NotificationService directly.
- Build notification UI before establishing event consumption.
- Add business-specific notification rules inside the event runtime.

### Consequences

The notification flow is decoupled and framework-independent. The subscriber maps supported generic platform event categories into notification requests and delegates creation to NotificationService. No notification UI or persistence is introduced by this decision.

## ADR-013 — Activity Event Subscriber

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Activity is generated exclusively from Platform Events through a dedicated Activity Event Subscriber.

### Motivation

HicoPilot needs operational memory that is decoupled from business services. Business services should emit events, and platform consumers should decide how those events become notifications, activities, audits, workflows, and future AI context.

### Alternatives

- Let business services call ActivityService directly.
- Build an Activity Timeline UI before the event-driven memory layer exists.
- Add business-specific activity logic directly inside Platform Event Runtime.

### Consequences

The activity flow is event-driven, framework-independent and generic. The subscriber maps supported platform event categories into activity records and delegates persistence to ActivityService. No Activity UI, route, database or Prisma change is introduced.

## ADR-014 — Audit Record & Event Subscriber

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Audit records are immutable runtime records generated exclusively from Platform Events through a dedicated Audit Event Subscriber.

### Motivation

Audit is the security and compliance memory of HicoPilot. It must be stricter than activity history and must not depend on direct calls from business services. Platform Events provide a decoupled, traceable source for future permission enforcement, AI governance, compliance, workflow accountability and enterprise cloud operations.

### Alternatives

- Let business services call AuditService directly.
- Reuse activity records as audit records.
- Add audit logic directly inside Platform Event Runtime.
- Build an Audit Center UI before the audit memory layer exists.

### Consequences

Audit is generated through a framework-independent subscriber. The runtime `AuditRecord` is frozen when mapped, duplicate event ids do not create duplicate audit records, and subscriber failures do not interrupt Platform Event Runtime delivery. No Audit UI, route, database or Prisma change is introduced.

## ADR-015 — Permission Enforcement Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Every executable capability in HicoPilot must eventually pass through a centralized Permission Enforcement layer before execution.

### Motivation

AI, plugins, commands, widgets, workflow actions, marketplace capabilities and APIs require a shared authorization contract. Boolean-only permission checks are not enough for an enterprise platform because future consumers need structured reasons, resource metadata, workspace identity, user identity and deterministic behavior.

### Alternatives

- Keep permission checks scattered inside UI components and services.
- Expand the current RBAC helpers directly instead of adding an enforcement boundary.
- Delay permission enforcement until AI or plugins exist.
- Build a full enterprise policy engine immediately.

### Consequences

Permission Enforcement is framework-independent and returns immutable structured decisions. It reuses the current static RBAC foundation without redesigning authentication, users, roles, database schema or Prisma. Runtime integration remains a future sprint so existing UI and business behavior are unchanged.

## ADR-016 — Permission Runtime Integration

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Runtime and service consumers must use `PermissionService` for authorization decisions instead of duplicating RBAC checks.

### Motivation

SPR-214 created the enforcement foundation. SPR-215 begins integration by connecting Widget Runtime and CommandService to structured permission decisions while preserving the current visible UI. This prepares commands, widgets, plugins, workflows and AI to share one authorization contract.

### Alternatives

- Leave runtime consumers with placeholder `allowed: true` states.
- Let each runtime import the RBAC matrix directly.
- Enforce UI filtering immediately.
- Wait until plugins or AI exist before integrating permissions.

### Consequences

Widget Runtime now exposes permission decisions per widget without changing widget visibility. CommandService evaluates command permissions before execution, and navigation commands request only `view` permission to preserve existing behavior. Full Navigation, Plugin, Marketplace, Workflow and AI permission integration remains future work.

## ADR-017 — Platform Capability Registry

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

All future executable capabilities in HicoPilot should be registered through a common Platform Capability Registry.

### Motivation

Commands, widgets, navigation actions, services, runtimes, plugins, AI skills, AI agents, workflow actions and API endpoints need a shared discoverability contract. Without a common registry, each layer would define executable capability metadata differently, making permissions, manifests, plugins, marketplace and AI integration harder to govern.

### Alternatives

- Let each runtime own its own executable metadata.
- Treat plugin manifests as the first capability source.
- Extend the module registry to represent executable capabilities.
- Delay capability contracts until Plugin Runtime exists.

### Consequences

The Capability Registry is framework-independent and lives in `src/core/capabilities/`. It supports registration, duplicate detection, lookup, filtering, removal, deterministic listing and immutable metadata. It does not implement plugins, AI, marketplace, commands, widgets or navigation behavior yet.

## ADR-018 — Manifest System Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Every future installable platform component must expose a manifest before it can be loaded by HicoPilot.

### Motivation

HicoPilot is evolving toward plugins, marketplace, AI skills, workflows and installable applications. The platform needs a stable contract describing identity, capabilities, permissions, dependencies, compatibility, versioning and metadata before any runtime loading exists.

### Alternatives

- Let Plugin Runtime define manifests later.
- Treat Marketplace entries as the first installable contract.
- Register capabilities directly without a component manifest.
- Use package manager metadata as the manifest.

### Consequences

The Manifest System lives in `src/core/manifests/`, remains framework-independent and returns structured validation results instead of throwing for normal validation failures. Valid manifests are immutable. The sprint does not implement Plugin Runtime, Module Loader, Marketplace or capability registration from manifests.

## ADR-019 — Module Loader Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Installable platform components are prepared through a Module Loader before any future runtime execution.

### Motivation

The platform needs a deterministic preparation step between manifest validation and plugin execution. This step validates compatibility and dependencies, registers declared capabilities and produces immutable runtime descriptors without executing code.

### Alternatives

- Let Plugin Runtime validate and prepare manifests directly.
- Register capabilities straight from manifests without a loading step.
- Execute module entry points during loading.
- Delay loading until marketplace installation exists.

### Consequences

The Module Loader lives in `src/core/module-loader/`, remains framework-independent and does not execute entries, plugins or dynamic imports. It returns structured load results and immutable descriptors. Future Plugin Runtime can consume descriptors without owning manifest validation or capability registration.

## ADR-020 — Plugin Runtime Foundation

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Plugin Runtime consumes prepared `ModuleDescriptor` objects from Module Loader instead of raw manifests.

### Motivation

Plugin Runtime should host plugin state and lifecycle, not duplicate manifest validation, compatibility checks, dependency checks or capability registration. Keeping preparation separate from hosting preserves the platform dependency model and prevents runtime execution concerns from leaking into manifest and module loading foundations.

### Alternatives

- Let Plugin Runtime consume raw manifests and validate them again.
- Execute plugin entry points during registration.
- Wait for Plugin SDK before creating runtime lifecycle state.
- Merge Module Loader and Plugin Runtime into one layer.

### Consequences

Plugin Runtime remains framework-independent and deterministic. It registers immutable descriptors, tracks lifecycle state, prepares permission decisions and exposes lookup/state APIs. It does not execute plugin code, dynamically import modules, install plugins, call remote resources or implement marketplace behavior.

## ADR-021 — Company-Centric CRM Business Model

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

BOSIACO CRM is company-centric for the current B2B workflow. Company is the visible commercial account. Contacts, Opportunities, Quotes, Invoices and Payments belong to Companies.

Customer is retained as an internal compatibility and future-edition layer, but it is no longer exposed as an independent visible business object in default navigation, Command Center creation, Smart Entity Picker selection or Sales document creation.

### Motivation

The previous Company + Customer model duplicated account selection in normal B2B selling. Users had to decide between two concepts that represented the same business account, which increased cognitive load and made Quote/Invoice creation feel less direct.

### Consequences

New Quotes and Invoices require Company and optionally Contact. Legacy `customerName` fields are filled from the selected Company label to preserve existing persistence, store, PDF and search contracts. `CrmCustomer` tables and Customer services remain available for compatibility and possible future B2C or advanced account editions.

## ADR-022 — CRM Activities V1 Persistence Scope

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Meetings, Tasks and Notes are persistent CRM V1 capabilities linked to a required Company and an optional Contact. Timeline remains hidden until BOSIACO has a real persisted CRM event source.

### Motivation

Manual review showed that Meetings, Tasks, Notes and Timeline looked like functional modules but were driven by demo-only data. This created an unfinished-product feeling and broke user confidence.

### Consequences

`CrmMeeting`, `CrmTask` and `CrmNote` are tenant-scoped Prisma models. Their UI workspaces reuse module-owned local services hydrated by persistence. Timeline is not exposed in navigation, and `/crm/activities` redirects to Companies for route compatibility.

## ADR-023 — Inventory Workspace Activation Boundary

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

The Inventory workspace is implemented as an activable business workspace over the Inventory posting engine, but it remains inactive in the current `alpha.crm-sales` runtime.

### Motivation

SPR-407 created the durable inventory domain but no user-facing stock workspace. SPR-408 needs a real operational surface for balances, warehouses and manual stock movements while preserving the Alpha rule that planned modules must not appear as production-ready product surfaces.

### Consequences

`inventory.stock` owns `/inventory` and exposes navigation/Command Center metadata for controlled activation profiles. Current Alpha route availability redirects `/inventory` to the safe fallback. The workspace uses Product Catalog records and the Inventory posting engine, never direct balance mutation. Dashboard Inventory contributions are registered as prepared metadata but not visible by default.

## ADR-024 — Product Catalog Import Boundary

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Product Catalog import/export is limited to canonical Product fields and must not import Inventory balances, Warehouses or Stock movements.

### Motivation

Businesses need Excel/CSV onboarding for Products before Inventory adoption, but mixing product master data with stock quantities would bypass the Inventory posting engine and create unaudited balances.

### Consequences

Templates, imports and exports include Product master data only. Confirmed imports are revalidated server-side and applied through the Product Catalog persistence boundary. Stock quantities must enter the system later through Inventory posting workflows.

## ADR-025 — Shared Import / Export Platform

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

BOSIACO import/export mechanics are platform-owned under `src/platform/import-export/`. Business modules provide `ImporterDefinition` and `ExporterDefinition` metadata plus module-specific parsing, validation, identity resolution and persistence callbacks.

### Motivation

SPR-408B made Product Catalog import/export production-ready, but future modules need the same capabilities without duplicating CSV/XLSX parsing, column mapping, preview statistics, duplicate policies, template generation or error reports.

### Consequences

Product Catalog becomes the first consumer of the shared framework while preserving its visible behavior. Future modules must reuse the platform helpers and keep business rules inside their own module boundaries. The platform must remain entity-agnostic and must not import Product, CRM, Inventory, Purchasing, Prisma repositories or UI workflows directly.

## ADR-026 — Inventory Reservation Availability Authority

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Inventory availability is the single business authority for future allocation and fulfillment decisions.

```text
quantityAvailable = quantityOnHand - quantityReserved
```

Reservations and releases must go through the Inventory posting engine and persist as `RESERVATION` / `RELEASE` stock movements. Reservation state is stored in `InventoryBalance.quantityReserved`; no separate reservation quantity store is introduced.

### Motivation

Future modules such as Sales Orders, Delivery Notes, POS and Manufacturing need one safe source for allocation and fulfillment validation. Allowing UI screens or future modules to calculate availability independently would create inconsistent stock decisions.

### Consequences

`ReservationService` is the public business layer for `reserve`, `release`, `canReserve`, `canFulfill`, `getAvailability` and `recalculateAvailability`. Structured movement references (`referenceType`, `referenceId`) prepare future document linking without making Inventory depend on those modules. Low-stock logic uses available stock, not on-hand stock.

## ADR-027 — Reservation QA Workspace Boundary

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

The Reservation QA workflow lives inside the controlled Inventory workspace as a `Réservations` tab. It is not a standalone module, not a top-level navigation group and not a commercial Sales Order reservation lifecycle.

### Motivation

The Reservation & Availability Engine needs authenticated manual QA before Sales Orders, Delivery Notes, Purchasing or POS integrations are built. Without a thin QA surface, testers cannot reliably create and release reservations through the same persistence path future modules will use.

### Consequences

The tab uses existing Inventory persistence operations (`reserve`, `release`) and movement-backed history. No duplicate reservation store, Reservation table, Command Center Quick Create or `/inventory/reservations` route is introduced. Alpha remains unchanged because Inventory remains inactive unless the controlled Inventory profile is active.

## ADR-028 — Goods Receipt Owns Procurement Stock Increases

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Purchase Orders do not update Inventory. Supplier stock increases are created only by posting a Goods Receipt.

Goods Receipt posting must call the Inventory posting engine inside a server transaction. UI screens and Procurement repositories must not mutate Inventory balances directly.

### Motivation

Purchase Orders represent intent to buy, not physical receipt. Posting stock from Purchase Orders would overstate inventory before goods arrive. Goods Receipt creates the operational control point for partial receipts, warehouse validation, duplicate posting prevention and future Supplier Invoice matching.

### Consequences

`procurement.goods-receipts` depends on `procurement.purchase-orders`, `inventory.stock`, `sales.products` and `platform.persistence`. Posted receipt lines create `RECEIPT` Inventory movements with `referenceType = GOODS_RECEIPT`. Purchase Orders become `partially_received` or `received` from posted receipt quantities. Returns, reversal and Supplier Invoice matching remain future work.

## ADR-029 — Sales Orders Own Customer Commitment, Not Physical Stock Issue

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Sales Orders represent customer commitment and optional stock reservation. They must never physically decrease Inventory on-hand quantities.

Confirming a Sales Order may post Inventory `RESERVATION` movements when the user explicitly chooses to reserve stock. Cancelling a reserved Sales Order posts Inventory `RELEASE` movements. Physical stock decrement remains the responsibility of future Delivery Notes.

### Motivation

BOSIACO needs a clear operational boundary between commitment, allocation, fulfillment, billing and payment. If Sales Orders directly posted `ISSUE` movements, stock would decrease before goods are delivered and future Delivery Notes would either duplicate or fight the same responsibility.

### Consequences

`sales.orders` depends on Product Catalog and can integrate with Inventory availability, but it does not own fulfillment. Manual Sales Order lines with Product IDs can reserve stock. Quote-converted lines preserve commercial information but are not reservable until Quote lines carry Product references. Delivery Notes remain the future module that will post Inventory `ISSUE` movements.

## ADR-030 — Commercial Lines May Be Product-Backed or Free-Form

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Sales document lines support two explicit modes:

- Product-backed lines carry an optional canonical Product ID plus SKU/name snapshots.
- Free-form lines carry commercial text only and have no Product ID.

Product identity must be preserved from Product Catalog to Quote, Invoice and Sales Order lines when selected. Free-form lines remain valid and must never be inferred as Products from descriptions, labels or SKU-like text.

### Motivation

Delivery Notes, reservation, movement history and future fulfillment require stable Product IDs. At the same time, BOSIACO must continue to support service/manual lines that are commercial but not Inventory stock.

### Consequences

Quote and Invoice line persistence stores optional Product identity. Quote-to-Sales-Order and Quote-to-Invoice conversion preserve Product-backed and free-form line modes. Inventory reservation uses Product IDs only and calculates remaining reservation from ordered quantity minus already reserved quantity.

## ADR-031 — Product Inventory Tracking Uses the Existing Canonical Flag

| Field | Value |
| --- | --- |
| Status | Accepted |

### Decision

Product inventory behavior is controlled by the existing canonical field:

- Domain: `Product.flags.trackInventory`
- Prisma: `Product.trackInventory`

BOSIACO must not introduce a second product-type or stockable field for the same concept.

### Motivation

The Product Catalog already had the persistence and service contract needed for inventory tracking. The missing piece was Product create/edit UX. Adding another field would split Product identity and create ambiguity for Inventory, Sales Orders and future Delivery Notes.

### Consequences

The Product dialog exposes `Produit stockable` and `Service / non stocké`. New Products default to stockable for controlled Product → Inventory → Sales Order QA. Services remain valid commercial Products but are excluded from Inventory movements and reservation eligibility. A stockable Product cannot be changed to service/non-stocked after Inventory balances or movements exist.
