# HicoPilot Roadmap

## Purpose

Track the planned evolution of HicoPilot from ERP foundation to commercial product.

## Product Phases

- v0.9.0-alpha: stabilize CRM, Sales, persistence and Zero Friction product quality.
- Modular Editions Platform: describe every functional area as a module from one codebase, then add activation and Edition definitions in later sprints.

## Milestones

## Priorities

- Keep Alpha-visible modules limited to stable Dashboard, CRM, Sales and Settings surfaces.
- Use `src/platform/modules/` as the declarative Module Registry foundation for future Editions.
- Preserve the rule that registration does not equal activation.

## Risks

- Hidden preview modules must not reappear simply because they are described in registry metadata.
- Edition activation, licensing and dynamic navigation are future work and must not be inferred from SPR-401 descriptors.

## Open Questions

- Which Editions will be sold first: Basic, CRM, Sales, Enterprise or Custom?
- Which hidden modules should be upgraded after CRM/Sales: Inventory, Purchasing, HR, Finance or AI?
