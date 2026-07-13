# HicoPilot Roadmap

## Milestone 1 — Platform Foundation

Status: Mostly complete.

Focus:

- Product identity.
- Executive Dashboard foundation.
- Core Registry.
- Core Engines.
- Application Services.
- Documentation baseline.

## Milestone 2 — Platform Runtime

Status: In progress.

Focus:

- Workspace Context.
- Widget Runtime.
- Runtime-to-dashboard integration.
- Runtime validation.
- Service orchestration hardening.

## Milestone 3 — Platform Intelligence

Status: Planned.

Focus:

- Notification Center UI.
- Activity Timeline integration.
- Favorites and Recent Items UI.
- Command Palette expansion.
- Workspace-aware search.

## Milestone 4 — Business Applications

Status: Planned.

Focus:

- Stabilize commercial modules.
- Strengthen clients, suppliers, products, stock, purchases and cash.
- Connect business modules to durable services and persistence.

## Milestone 5 — Enterprise AI

Status: Planned.

Focus:

- AI context engine.
- Permission-aware AI suggestions.
- AI assistant integration with workspace, audit, notifications and activity.

## Milestone 6 — Marketplace

Status: Planned, with Module Registry, Module Activation, Edition Profile, Dynamic Navigation and Dashboard Contribution foundations completed in SPR-401 through SPR-405.

Focus:

- Plugin architecture.
- Extension registry.
- Marketplace-ready module contracts.
- Modular Editions Platform foundations.
- Module activation metadata.
- Edition definitions from one codebase.
- Edition profile registry and future commercial profile metadata.
- Activation-driven navigation and route availability.
- Activation-driven dashboard contributions.

Foundation completed:

- SPR-401 adds a platform-owned Module Registry describing Alpha-ready, hidden and planned modules through declarative metadata.
- Registration is metadata only and does not activate hidden modules.
- SPR-402 adds the Module Activation Engine, current Alpha activation profile and low-risk Sidebar/Command Center activation filtering.
- Activation determines availability and prepares Edition profiles, route gating, feature flags and licensing-aware module access.
- SPR-403 adds the Edition Profiles Foundation, current Alpha Edition source and future Basic, CRM, Sales, Inventory, Purchasing, HR, Enterprise and Custom metadata.
- Edition profiles provide activation input; consumers continue to depend on activation state, not Edition IDs.
- SPR-404 adds dynamic navigation composition, centralized route ownership, inactive-module fallbacks and legacy compatibility redirects driven by active modules.
- Routes and navigation now depend on active modules, never directly on Edition IDs.
- SPR-405 adds the Dynamic Dashboard Contribution System so active modules can contribute dashboard sections through metadata.
- The Platform Foundation is ready for the Business Platform phase and Product Catalog Foundation.

## Milestone 7 — Cloud Platform

Status: Planned.

Focus:

- Production security.
- Deployment hardening.
- Multi-tenant operations.
- Observability and release governance.
