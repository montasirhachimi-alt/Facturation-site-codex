# HicoPilot Roadmap

## Purpose

Track the planned evolution of HicoPilot from ERP foundation to commercial product.

## Product Phases

- v0.9.0-alpha: stabilize CRM, Sales, persistence and Zero Friction product quality.
- Modular Editions Platform: describe every functional area as a module from one codebase, then add activation and Edition definitions in later sprints.
- Module Activation Foundation: resolve available modules from a profile before adding licensing, tenant configuration or dynamic route gating.
- Edition Profiles Foundation: define reusable commercial Edition profiles that feed activation without changing the current Alpha product.

## Milestones

## Priorities

- Keep Alpha-visible modules limited to stable Dashboard, CRM, Sales and Settings surfaces.
- Use `src/platform/modules/` as the declarative Module Registry foundation for future Editions.
- Use `src/platform/editions/` as the metadata-only Edition profile registry.
- Preserve the rule that registration does not equal activation.
- Use the Module Activation Engine as the source of truth for availability before wiring broader dynamic navigation or dashboard behavior.
- Keep Sidebar, Command Center and future dashboard consumers dependent on activation state, not Edition IDs.

## Risks

- Hidden preview modules must not reappear simply because they are described in registry metadata.
- Licensing, billing, tenant Edition assignment and dynamic navigation are future work and must not be inferred from Edition metadata alone.
- Hidden/planned descriptors must remain inactive unless a future profile explicitly allows them.
- Future planned Edition profiles must not become runtime defaults.

## Open Questions

- Which Edition will become the first paid runtime option after Alpha: Basic, CRM, Sales, Enterprise or Custom?
- Which hidden modules should be upgraded after CRM/Sales: Inventory, Purchasing, HR, Finance or AI?
- What governance rules should decide when a preview/planned Edition becomes selectable?
