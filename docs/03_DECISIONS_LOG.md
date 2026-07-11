# HicoPilot Architecture Decision Records

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
