# HicoPilot Project Status

## Current State

| Field | Value |
| --- | --- |
| Product | HicoPilot |
| Version | Pre-Alpha |
| Current Milestone | Milestone 3 — Business Suite |
| Current Phase | Business Module Foundations |
| Current Sprint | SPR-302 — CRM Customers Foundation |
| Next Sprint | SPR-303 — CRM Customers UI Foundation |
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
- Documentation before SPR-207A was fragmented across several older files.

## Known Risks

- Database schema exists, but the platform engines are not yet persisted.
- Workspace switching UI does not exist yet.
- AI features are not yet permission-aware because AI platform integration has not started.
- Build currently reports an existing `next/image` warning in `src/components/pdf-preview.tsx`.

## Validation Status

| Command | Required | Latest Known Result |
| --- | --- | --- |
| `npm run typecheck` | Yes | Passing during SPR-302. |
| `npm run build` | Yes | Passing during SPR-302 with the known existing `next/image` warning in PDF preview. |
| `npm run validate:runtime` | Yes | Passing during SPR-302. |

## Repository Health

The repository is suitable for incremental platform work. Future work should continue to preserve visible UI and business behavior while moving shared capabilities into engines, services, contexts and runtimes.
