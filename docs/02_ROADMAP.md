# HicoPilot Roadmap

## Purpose

Track the planned evolution of HicoPilot from ERP foundation to commercial product.

## Product Phases

- v0.9.0-alpha: stabilize CRM, Sales, persistence and Zero Friction product quality.
- Modular Editions Platform: describe every functional area as a module from one codebase, then add activation and Edition definitions in later sprints.
- Module Activation Foundation: resolve available modules from a profile before adding licensing, tenant configuration or dynamic route gating.
- Edition Profiles Foundation: define reusable commercial Edition profiles that feed activation without changing the current Alpha product.
- Dynamic Navigation & Route Availability: derive navigation and module route access from active modules before tenant Edition assignment.
- Dynamic Dashboard Contributions: make Dashboard sections resolve from active module contribution metadata.
- Platform Architecture Constitution: consolidate module, activation, Edition, navigation, route, Command Center, Dashboard and persistence rules before future business modules.
- Business Platform: begin concrete business-module expansion after the platform foundation.

## Milestones

## Priorities

- Keep Alpha-visible modules limited to stable Dashboard, CRM, Sales and Settings surfaces.
- Use `src/platform/modules/` as the declarative Module Registry foundation for future Editions.
- Use `src/platform/editions/` as the metadata-only Edition profile registry.
- Preserve the rule that registration does not equal activation.
- Use the Module Activation Engine as the source of truth for availability before wiring broader dynamic navigation or dashboard behavior.
- Keep Sidebar, Command Center and future dashboard consumers dependent on activation state, not Edition IDs.
- Keep route availability centralized so inactive modules cannot render their workspaces.
- Keep Dashboard composition dependent on contribution metadata, not direct module knowledge.
- Use `docs/05_PLATFORM_ARCHITECTURE.md` as the mandatory reference before building new business modules.

## Risks

- Hidden preview modules must not reappear simply because they are described in registry metadata.
- Licensing, billing, tenant Edition assignment and dynamic navigation are future work and must not be inferred from Edition metadata alone.
- Hidden/planned descriptors must remain inactive unless a future profile explicitly allows them.
- Future planned Edition profiles must not become runtime defaults.
- Legacy compatibility redirects must point only to active canonical routes or a safe fallback.
- Dashboard contribution descriptors must not import React components or module UI.
- Future business modules must not bypass the architecture constitution.

## Open Questions

- Which Edition will become the first paid runtime option after Alpha: Basic, CRM, Sales, Enterprise or Custom?
- Which hidden modules should be upgraded after CRM/Sales: Inventory, Purchasing, HR, Finance or AI?
- What governance rules should decide when a preview/planned Edition becomes selectable?
- Which route availability policy should be user-facing once paid Editions and upgrade flows exist?
- Which business module should contribute the next stable Dashboard widget after Product Catalog matures?
