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
- Product Catalog Foundation: establish one canonical Product Catalog before Inventory, Purchasing or advanced Sales integrations.
- Product Catalog Import/Export: support controlled XLSX/CSV onboarding for Product master data only.
- Shared Import/Export Framework: extract Product import/export mechanics into a reusable platform capability for future business modules.
- Inventory Domain Foundation: establish warehouse, balance, movement and availability foundations before visible Inventory workflows.
- Inventory Workspace: expose the first controlled stock workspace over the posting engine while keeping Inventory inactive in the current Alpha runtime.
- Reservation & Availability Engine: make available stock and reservations the canonical authority before Sales Orders, Delivery Notes, POS or Purchasing allocation workflows.
- Reservation QA Workspace: provide controlled manual verification of reservation and release flows before commercial reservation lifecycle work.
- Commercial Documents Foundation: standardize document headers, lines, totals, status, lifecycle and definitions before Sales Orders, Delivery Notes, Purchasing documents or unified rendering.
- Procurement Foundation: introduce Suppliers and Purchase Orders as activation-gated Procurement capabilities before Goods Receipt, Supplier Invoice or stock posting.
- Goods Receipt & Inventory Posting: connect Purchase Orders to Inventory through persistent Goods Receipts and transaction-safe `RECEIPT` movements.
- Sales Orders Foundation: introduce customer commitment documents with optional Inventory reservation, while keeping physical stock decrement for future Delivery Notes.
- Quote Product Identity & Sales Order QA: preserve Product-backed vs free-form line identity across Quote, Invoice and Sales Order before Delivery Notes.
- Inventory-Tracked Product QA Fix: expose the existing Product tracking policy in Product create/edit so stockable Products can be received and reserved from the UI.
- Warehouse Persistence & Inventory Quantity QA Fix: align Inventory workspace tenant scope with persistence and normalize stock quantities before Delivery Note work.
- Quote to Sales Order Quantity Conversion Fix: preserve Quote line quantities, Product snapshots, negotiated prices and VAT when generating Sales Orders.
- Quote Lifecycle Actions & Conversion Readiness: allow draft Quotes to become sent, sent Quotes to become accepted/refused, and keep Sales Order conversion accepted-only with server validation.
- Quote Conversion Sales Order Workspace Fix: ensure accepted Quote conversion creates Sales Orders in the Sales Orders workspace so the generated detail page opens correctly.
- Delivery Notes & Physical Stock Issue: fulfill Sales Orders partially or fully through persistent Delivery Notes and transaction-safe Inventory `ISSUE` posting.
- Delivery Note Quantity Precision QA Fix: keep Delivery quantities deterministic from locale-aware input through reservation consumption and physical issue.

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
- Keep Product as one canonical business entity; future Inventory, Purchasing, Sales and Reporting modules must consume the Product Catalog instead of defining their own product model.
- Keep Product import/export restricted to Product master data; stock quantities must go through Inventory posting workflows.
- Keep import/export engines generic: future modules should provide definitions and callbacks, not duplicate CSV/XLSX, mapping, preview, template or error-report logic.
- Keep Inventory as a domain foundation first; visible stock workflows must consume the posting engine instead of mutating balances directly.
- Keep availability authoritative: future modules must call the Reservation & Availability engine instead of calculating available stock in UI or feature code.
- Keep reservation QA inside Inventory until Sales Orders or Delivery Notes define the real commercial lifecycle.
- Keep commercial documents canonical: future Sales Orders, Delivery Notes, Purchase Orders, Goods Receipts and Supplier Invoices must consume `src/platform/commercial-documents/` instead of defining independent line or total engines.
- Keep Procurement separate from CRM: Suppliers must remain dedicated Procurement entities and must not reuse CRM Company as a shortcut.

## Risks

- Hidden preview modules must not reappear simply because they are described in registry metadata.
- Licensing, billing, tenant Edition assignment and dynamic navigation are future work and must not be inferred from Edition metadata alone.
- Hidden/planned descriptors must remain inactive unless a future profile explicitly allows them.
- Future planned Edition profiles must not become runtime defaults.
- Legacy compatibility redirects must point only to active canonical routes or a safe fallback.
- Dashboard contribution descriptors must not import React components or module UI.
- Future business modules must not bypass the architecture constitution.
- Product Catalog must remain planned/inactive until a future sprint explicitly activates it in an Edition profile.
- Inventory must remain planned/inactive in Alpha until a future sprint explicitly activates it for a runtime Edition profile.
- Shared import/export must remain entity-agnostic and must not import module UI, Prisma repositories or Inventory/Sales business workflows directly.
- Reservation references must remain module-neutral until Sales Orders, Delivery Notes, Purchasing or POS exist as stable modules.
- Reservation QA controls must not appear in `alpha.crm-sales`.
- Commercial document definitions for future document types must remain metadata only until their workflows, persistence and route availability are implemented.
- Purchase Orders must not post stock. Goods Receipt will own future inventory increases.
- Goods Receipts must post stock only through the Inventory posting engine; no Procurement UI may mutate Inventory balances directly.
- Sales Orders must reserve or release stock only through the Inventory reservation engine and must never post physical `ISSUE` movements.
- Product-backed commercial lines must carry Product IDs; free-form lines must remain valid and non-inventory.
- Product stockability must use `Product.flags.trackInventory`; do not create duplicate product-type authorities.
- Inventory workspaces must use the authenticated tenant scope and the canonical Inventory quantity helpers; do not reintroduce hardcoded local company scopes or native number-step artifacts.
- Persisted commercial document numeric fields must hydrate as plain numbers before entering dialogs, conversion adapters, PDFs or calculation wrappers.
- Quote lifecycle status changes must use the Commercial Documents lifecycle and Sales Order conversion must remain blocked until the source Quote is accepted.
- Quote-to-Sales-Order conversion must preserve document relationships through source IDs while assigning each document to its canonical workspace.
- Delivery Notes are the only current Sales boundary for physical stock issue; Sales Orders reserve and Invoices remain financial.
- Delivery, Reservation and Inventory quantity arithmetic must reuse the canonical six-decimal Inventory policy.

## Open Questions

- Which Edition will become the first paid runtime option after Alpha: Basic, CRM, Sales, Enterprise or Custom?
- Which hidden modules should be upgraded after CRM/Sales: Inventory, Purchasing, HR, Finance or AI?
- What governance rules should decide when a preview/planned Edition becomes selectable?
- Which route availability policy should be user-facing once paid Editions and upgrade flows exist?
- Which business module should contribute the next stable Dashboard widget after Product Catalog matures?
- When should Product Catalog become active in Alpha navigation: after Sales line-item integration, Inventory foundation or Purchasing foundation?
- Which Inventory workflow should mature after the reservation engine: replenishment policies, Sales availability, barcode scanning, Purchasing receipts or Delivery Note fulfillment?
