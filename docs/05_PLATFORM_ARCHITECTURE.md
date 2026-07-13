# BOSIACO Platform Architecture

## 1. Platform Vision

BOSIACO is built from one codebase that can support multiple Editions.

The product is module-driven:

- modules describe capabilities declaratively
- Edition profiles describe intended commercial configurations
- activation resolves what is available
- consumers render only what is active

The platform must avoid separate branches, separate applications or UI-specific Edition logic.

Core architectural decisions:

1. One codebase supports all Editions.
2. Modules describe capabilities declaratively.
3. Activation is the source of availability.
4. Edition Profiles only provide activation input.
5. Sidebar, routes, Command Center and Dashboard consume activation.
6. Business modules cannot depend on Edition IDs.
7. Platform metadata must remain lightweight and client-safe.
8. Persistence remains module-owned and tenant-scoped.
9. Hidden and planned modules must not appear as working product surfaces.
10. Future modules must use the platform contracts instead of bypassing them.

## 2. Platform Layers

The conceptual platform flow is:

```text
Module Registry
  ↓
Module Activation Engine
  ↓
Edition Profiles
  ↓
Current Activation Result
  ↓
Navigation / Routes / Command Center / Dashboard
  ↓
Business Modules
  ↓
Persistence
```

The practical dependency direction in code is:

```text
module types and descriptors
  ↓
module registry
  ↓
activation engine
  ↓
edition profiles and current edition source
  ↓
active navigation, route availability and dashboard contribution resolvers
  ↓
UI consumers
```

Business UI must consume prepared platform state. Platform metadata must not import business UI pages.

## 3. Module Registry

Location:

- `src/platform/modules/`

The Module Registry owns `ModuleDescriptor` metadata.

A module descriptor may include:

- stable `id`
- display `name` and `shortName`
- `description`
- `category`
- `iconKey`
- canonical `route`
- lifecycle `status`
- `version`
- required `dependencies`
- `optionalDependencies`
- feature keys
- navigation metadata
- Command Center metadata
- dashboard metadata
- `defaultEnabled`
- `alphaReady`
- `hidden`
- deterministic `order`

Module IDs are stable technical identifiers. They must not be translated.

Examples:

- `core.dashboard`
- `crm.companies`
- `crm.contacts`
- `sales.quotes`
- `sales.invoices`
- `inventory.stock`
- `hr.employees`

Registration does not equal activation.

Registered modules may be inactive, hidden, planned or future-only.

Registry validation detects:

- duplicate module IDs
- duplicate routes
- hidden modules enabled by default
- invalid statuses
- missing labels
- self-dependencies
- unknown dependencies
- circular dependencies

## 4. Module Activation

Location:

- `src/platform/modules/module-activation.*`

Activation resolves availability from a `ModuleActivationRequest`.

The request may include:

- enabled modules
- disabled modules
- default inclusion policy
- strict dependency policy
- preview/planned/hidden/deprecated allowances
- profile key

The result includes:

- requested enabled modules
- requested disabled modules
- active modules
- active module ID set
- automatically enabled dependencies
- blocked modules
- warnings
- errors
- deterministic activation order

Required dependencies are activated automatically unless explicitly disabled.

If a required dependency is disabled, the dependent module is blocked.

Activation determines availability.

## 5. Edition Profiles

Location:

- `src/platform/editions/`

Edition Profiles describe commercial product configurations. They do not activate modules directly.

The current default profile is:

- `alpha.crm-sales`

It enables:

- Dashboard
- Settings
- CRM overview
- Companies
- Contacts
- Meetings
- Tasks
- Notes
- Quotes
- Invoices
- Payments

Future metadata profiles exist for:

- Basic
- CRM
- Sales
- Inventory
- Purchasing
- HR
- Enterprise
- Custom

The Edition-to-Activation adapter converts an `EditionProfile` to a `ModuleActivationRequest`.

Consumers must never check Edition IDs directly.

Correct:

```text
Edition Profile
  ↓
Module Activation Engine
  ↓
Active Module Result
  ↓
Consumer
```

Incorrect:

```text
if editionId === "sales" then show button
```

The Custom Edition foundation is metadata-only. It does not persist tenant selections, license modules or provide a UI builder.

## 6. Dynamic Navigation

Navigation is derived from:

- active modules
- `ModuleDescriptor.navigation`

Location:

- `src/platform/modules/module-navigation.ts`
- `src/services/navigation/sidebar-adapter.ts`

The Sidebar consumes active navigation groups. It must not manually hardcode module availability.

Navigation metadata may include:

- label
- href
- iconKey
- group
- order
- exactMatch
- badgeKey
- parentModuleId
- mobileLabel
- searchKeywords
- hidden

Route ownership is centralized in:

- `src/platform/modules/module-route-availability.ts`

Route rules:

1. Active module routes are available.
2. Legacy compatibility routes redirect to active canonical destinations.
3. Inactive module routes redirect to a safe fallback.
4. Unknown routes preserve normal Next.js not-found behavior.

Fallback route behavior:

1. `/dashboard` if `core.dashboard` is active.
2. first active navigable module route.
3. `/` as final fallback.

Favorites and Recent must hide inactive-module destinations without deleting stored history.

## 7. Dashboard Contributions

Location:

- `src/platform/dashboard/`

Dashboard is driven by `DashboardContribution` metadata and the current activation result.

A contribution may include:

- id
- moduleId
- widgetId
- title
- priority
- order
- zone
- size
- status
- defaultVisible
- alphaReady
- renderKey
- metadata

Supported zones:

- hero
- summary
- primary
- secondary
- sidebar
- footer

The registry validates contributions and the resolver filters them by active module ID.

The Dashboard must not know business modules directly.

Platform contribution metadata stores `renderKey`, not React components. The Dashboard page maps render keys to existing UI locally so the platform layer remains client-safe and UI-free.

## 8. Command Center Integration

Command Center navigation consumes active module navigation metadata.

Rules:

- inactive modules must not contribute navigation commands
- hidden modules must remain absent
- command destinations must be available routes
- Quick Create actions must only use stable workflows
- Record Search must only expose active module records
- Favorites and Recent must filter unavailable destinations from visible results

The Command Center must not check Edition IDs.

## 9. Import / Export Framework

Import/export is a shared platform capability under `src/platform/import-export/`.

The framework knows only:

- `ImporterDefinition`
- `ExporterDefinition`
- column metadata
- mapping rules
- validation issues
- preview statistics
- duplicate policies
- template generation
- CSV/XLSX helpers
- error report rows

The framework must not know Product, Customer, Warehouse, Supplier, Employee, Accounting or Inventory internals.

Business modules provide:

- module-specific importer definitions
- module-specific exporter definitions
- parsing callbacks
- domain validation callbacks
- duplicate identity resolution
- persistence callbacks through module-owned services or repositories

Rules:

- Product Catalog is the first consumer.
- Future modules must not duplicate CSV/XLSX parsing, template generation, preview counting or error-report creation.
- The platform must not call Prisma directly.
- Generic import/export helpers must remain client/server safe and dependency-light.
- Stock quantities must not be imported through Product master data; Inventory quantities must use Inventory posting workflows.

## 9.2 Commercial Documents Foundation

Commercial documents are shared platform primitives under `src/platform/commercial-documents/`.

The foundation defines:

- shared document headers
- shared document lines
- shared totals calculation
- shared discount and tax helpers
- shared status metadata
- shared lifecycle transitions
- shared numbering metadata
- shared validation
- shared document definitions and registry

Current Alpha consumers:

- Quotes
- Invoices

Prepared metadata only:

- Sales Orders
- Delivery Notes
- Purchase Orders
- Goods Receipts
- Supplier Invoices

Rules:

- Commercial document primitives must not import React, Next.js, Prisma, Inventory, CRM or Sales UI.
- Business modules adapt their own public types to the platform document primitives.
- Persistence remains module-owned and tenant-scoped.
- Rendering remains module-owned until a later unified document rendering engine exists.
- Future Sales Orders, Delivery Notes, Purchasing and Goods Receipt workflows must consume this foundation instead of creating independent document models.
- Inventory Reservation and Availability must remain separate; document references may link to Inventory later, but documents must not mutate stock directly.

## 9.3 Procurement Foundation

Procurement is a business module family for supplier-side workflows.

Current Procurement foundation:

- `procurement.overview`
- `procurement.suppliers`
- `procurement.purchase-orders`
- `procurement.goods-receipts`

Rules:

- Suppliers are dedicated Procurement entities.
- Suppliers must not reuse CRM Company as a shortcut.
- Purchase Orders must consume the Commercial Documents Foundation for lines, totals, status, lifecycle and numbering.
- Purchase Order lines may reference Product Catalog records.
- Purchase Orders must not post stock or increase availability.
- Goods Receipt owns inventory increases and must post through the Inventory engine.
- Future Supplier Invoice owns supplier accounting context.
- Procurement remains inactive in `alpha.crm-sales`.
- Procurement routes, Command Center entries and Dashboard contributions are activation-gated.

## 10. Business Module Contract

Every future business module must provide:

- stable module ID
- `ModuleDescriptor`
- lifecycle status
- required dependencies
- optional dependencies where useful
- canonical route ownership
- navigation metadata where visible
- Command Center metadata where relevant
- dashboard contributions where relevant
- module-owned persistence boundary
- validation rules
- runtime validation coverage
- documentation
- disabled-state behavior
- Edition availability documentation

Modules must integrate through the platform contracts rather than patching Sidebar, Dashboard, Command Center or middleware directly.

## 11. Persistence Boundaries

UI must never call Prisma directly.

The approved persistence shape is:

```text
Database / Prisma
  ↓
Server repository or data access layer
  ↓
Application service
  ↓
Module adapter / client cache
  ↓
Existing UI surfaces
```

Persistence requirements:

- records are tenant/company scoped
- server lookups verify ownership
- writes are confirmed before dialogs close where practical
- failed writes preserve user-entered form data
- client caches hydrate from the authoritative source
- module-owned persistence adapters avoid duplicate stores
- inventory availability and reservations must be owned by the Inventory engine, not recalculated by UI consumers

Generic UI components must not import CRM, Sales or future module persistence internals.

## 12. Client / Server Import Safety

Prohibited dependency directions:

- platform registry importing module UI pages
- platform metadata importing React components
- client components importing Prisma or server repositories
- generic UI importing CRM/Sales internals
- module pages importing private platform implementation details when a public helper exists
- activation engine importing Edition profiles
- Module Registry importing activation or Edition state

Required practices:

- keep metadata serializable
- use direct imports in sensitive graphs
- use `import type` for type-only dependencies
- avoid broad barrels in client/server boundary files
- keep server-safe helpers free of browser globals
- keep client providers free of Prisma/server-only imports

## 13. Module Lifecycle

Supported module statuses:

- stable
- alpha
- preview
- planned
- hidden
- deprecated

Meaning:

- stable: production-ready and may be enabled normally.
- alpha: available in the current Alpha product.
- preview: may be described but requires explicit preview allowance.
- planned: future-only and inactive in normal Alpha runtime.
- hidden: registered but not visible by default.
- deprecated: should not be activated unless explicitly allowed and must warn.

Hidden and planned modules must not appear as working product surfaces.

## 14. New Module Development Checklist

Before building a future module:

1. Define a stable module ID.
2. Define the `ModuleDescriptor`.
3. Choose lifecycle status.
4. Declare required dependencies.
5. Declare optional dependencies.
6. Register module metadata.
7. Define canonical route ownership.
8. Add navigation metadata only when the module is visible.
9. Add Command Center metadata where relevant.
10. Add dashboard contributions where relevant.
11. Implement module-owned domain types.
12. Implement validation.
13. Implement persistence through server repositories and module services.
14. Add client cache/hydration only if needed.
15. Validate activation.
16. Test disabled/inactive state.
17. Test legacy redirects if compatibility routes exist.
18. Test Command Center visibility.
19. Test Dashboard contribution filtering.
20. Document Edition availability.

## 15. Prohibited Patterns

Do not:

- hardcode Edition checks in UI
- add manual Sidebar items outside module metadata
- create separate branches per Edition
- duplicate dialog implementations
- call Prisma directly from UI
- ship seed-backed production workflows
- expose placeholder controls
- expose inactive modules through routes
- create separate stores for the same business entity
- let business modules casually edit platform foundation files
- store React components inside platform metadata
- introduce visible future modules before their workflows are real
- bypass route availability helpers
- bypass Dashboard contribution registry

## 16. Current Platform Status

Completed platform foundation sprints:

- SPR-401 — Module Registry Foundation
- SPR-402 — Module Activation Engine
- SPR-403 — Edition Profiles Foundation
- SPR-404 — Dynamic Navigation & Route Availability
- SPR-405 — Dynamic Dashboard Contributions
- SPR-408C — Shared Import / Export Framework
- SPR-410 — Commercial Documents Foundation
- SPR-411 — Procurement Foundation
- SPR-412 — Goods Receipt & Inventory Posting

Current known limitations:

- no licensing
- no tenant Edition assignment
- no Feature Flag Engine
- no dashboard editor
- no user layout persistence
- no module admin UI
- no paid Edition selector
- no persisted platform activation state
- no import/export definition registry
- no generic server-side import executor
- no tenant-configurable commercial document numbering
- no Sales Order, Delivery Note or Supplier Invoice workflow
- no Procurement approval, RFQ or Purchase Request workflow

## 17. Future Roadmap

Future work should proceed through the platform contracts.

Planned direction:

- Product Catalog
- Inventory
- Purchasing
- Advanced Sales documents
- Unified Document Engine
- SmartKanban
- Licensing
- Feature Flags
- AI Productivity Platform

Do not mark future work as complete until the relevant module has real workflows, persistence where required, validation and integration through activation, navigation, route availability, Command Center and Dashboard contribution contracts.
