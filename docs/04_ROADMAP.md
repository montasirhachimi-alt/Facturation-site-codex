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

Status: In progress.

Focus:

- Stabilize commercial modules.
- Strengthen clients, suppliers, products, stock, purchases and cash.
- Connect business modules to durable services and persistence.
- Establish Product Catalog as the first canonical shared business entity before Inventory and Purchasing.

Foundation in progress:

- SPR-406 creates the canonical Product Catalog foundation over one Product model, one Product service and one Product repository.
- Product remains planned/inactive in Alpha until a later activation sprint.
- SPR-408B adds Product Catalog XLSX/CSV template download, import preview/validation, duplicate policies and exports for all active, filtered or selected Products.
- SPR-408C extracts Product import/export mechanics into a shared Import/Export Framework so future modules can reuse definitions, mapping, preview, templates, CSV/XLSX helpers, duplicate policies and error reports.
- SPR-407 creates the Inventory Domain Foundation with warehouses, balances, stock movements, reservations and transaction-safe posting.
- Inventory remains planned/inactive in Alpha until a later runtime activation sprint.
- SPR-408 creates a controlled Inventory workspace for balances, warehouses, movement history and manual receipt/issue/transfer/adjustment posting.
- Inventory remains inactive in the current Alpha runtime; `/inventory` is available only through an activation result that includes `inventory.stock`.
- Purchasing, variants, barcode scanning, reservation workflow UI, valuation, sales allocation and stock movement cancellation remain future work.

## Milestone 5 — Enterprise AI

Status: Planned.

Focus:

- AI context engine.
- Permission-aware AI suggestions.
- AI assistant integration with workspace, audit, notifications and activity.

## Milestone 6 — Marketplace

Status: Planned, with Module Registry, Module Activation, Edition Profile, Dynamic Navigation and Dashboard Contribution foundations completed in SPR-401 through SPR-405 and consolidated by `docs/05_PLATFORM_ARCHITECTURE.md`.

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
- Platform architecture constitution for future modules.

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
- PLATFORM-ARCH-001 consolidates the completed platform rules into `docs/05_PLATFORM_ARCHITECTURE.md`, the mandatory reference for future platform and business-module sprints.

## Milestone 7 — Cloud Platform

Status: Planned.

Focus:

- Production security.
- Deployment hardening.
- Multi-tenant operations.
- Observability and release governance.
