# BOSIACO Project Status

Last reconciled: 2026-08-17

This document is the current repository reality. It is intentionally not a sprint history. Historical sprint files remain useful for context, but this status is authoritative when older documents disagree with the current code.

## Current Product Identity

| Field | Current Reality |
| --- | --- |
| Product | BOSIACO, still using some HicoPilot naming in legacy files and code comments. |
| Stage | Alpha product moving from ERP Core into Business Platform foundations. |
| Default runtime edition | `alpha.crm-sales` from `src/platform/editions/edition.profiles.ts`. |
| Current default scope | Dashboard, CRM, Sales quotes/orders/delivery notes/shipments/invoices/payments, Product Catalog, Inventory and Procurement. |
| Latest completed sprint reflected in code | SPR-428 — Procurement Analytics & Cockpit Enrichment. |
| Important caveat | Sales Orders, Delivery Notes and Shipments are now enabled in default `alpha.crm-sales` after authenticated end-to-end Sales Operations QA. The internal `sales-operations` profile remains available as a QA compatibility profile, not as the default product gate. |

## Validation Snapshot

| Command | Latest Reconciled Result |
| --- | --- |
| `npm run typecheck` | Passed on 2026-08-17. |
| `npm run validate:runtime` | Passed on 2026-08-17 with 167/167 checks. |
| `npm run build` | Passed on 2026-08-17; known `src/components/pdf-preview.tsx` `<img>` warning remains. |
| `git diff --check` | Passed on 2026-08-17. |

## Runtime Architecture Status

| Area | Status | Evidence |
| --- | --- | --- |
| Platform Event Runtime | Foundation implemented | `src/runtime/platform-events/` |
| Notifications Runtime | Foundation implemented | `src/runtime/notifications/` |
| Activity Runtime | Foundation implemented | `src/runtime/activity/` |
| Audit Runtime | Foundation implemented | `src/runtime/audit/` |
| Permission Enforcement | Foundation implemented | `src/runtime/permissions/` |
| Plugin Runtime | Foundation implemented, not a plugin marketplace | `src/runtime/plugins/` |
| Unified Search Runtime | Implemented foundation with provider registry and service facade | `src/runtime/search/`, `src/services/search/` |
| Business Timeline Runtime | Implemented foundation with Sales and Inventory/Delivery providers | `src/runtime/timeline/`, `src/services/timeline/`, `src/modules/sales/timeline/`, `src/modules/inventory/timeline/` |
| Module Registry | Implemented | `src/platform/modules/module.descriptors.ts` |
| Module Activation Engine | Implemented | `src/platform/modules/module-activation.*` |
| Edition Profiles | Implemented as metadata and activation input | `src/platform/editions/` |
| Dynamic Navigation and Route Availability | Implemented with middleware route enforcement | `src/platform/modules/module-route-availability.ts`, `src/middleware.ts` |
| Dashboard Contributions | Implemented as metadata resolver | `src/platform/dashboard/` |
| Shared Import/Export Framework | Implemented | `src/platform/import-export/` |

## Default Active Modules

The current default edition is `alpha.crm-sales`. It activates these user-facing modules:

| Module ID | Route | Current Status |
| --- | --- | --- |
| `core.dashboard` | `/dashboard` | Active |
| `core.settings` | `/parametres` | Active |
| `crm.overview` | `/crm` | Active |
| `crm.companies` | `/crm/companies` | Active |
| `crm.contacts` | `/crm/contacts` | Active |
| `crm.meetings` | `/crm/meetings` | Active |
| `crm.tasks` | `/crm/tasks` | Active |
| `crm.notes` | `/crm/notes` | Active |
| `sales.quotes` | `/sales/quotes` | Active |
| `sales.invoices` | `/sales/invoices` | Active |
| `sales.payments` | `/sales/payments` | Active |
| `sales.products` | `/sales/products` | Active |
| `inventory.stock` | `/inventory` | Active |
| `procurement.overview` | `/procurement` | Active |
| `procurement.suppliers` | `/procurement/suppliers` | Active |
| `procurement.purchase-orders` | `/procurement/purchase-orders` | Active |
| `procurement.goods-receipts` | `/procurement/goods-receipts` | Active |

Hidden platform dependencies such as `platform.persistence` may be automatically enabled by the activation engine but are not product navigation modules.

## Activation-Gated Modules

| Module | Status | Notes |
| --- | --- | --- |
| `sales.orders` | Active in Alpha | Persistent Sales Orders are enabled in `alpha.crm-sales`. Draft edits are server-enforced, confirmation/reservation uses the dedicated action, and the detail availability projection subtracts delivered and reserved quantities before displaying `À réserver`. |
| `sales.delivery-notes` | Active in Alpha | Persistent Delivery Notes are enabled in `alpha.crm-sales`, post Inventory `ISSUE` movements, consume reservations and support partial/final delivery. |
| `sales.shipments` | Active in Alpha | Persistent Shipment logistics records are enabled in `alpha.crm-sales`; lifecycle changes remain logistics-only and do not post Inventory movements. |
| `crm.opportunities` | Hidden | Opportunity UI/domain remnants exist, but the route redirects because persistence is not stable. |
| Legacy `purchasing.*`, `finance.*`, `hr.*` | Planned/hidden | Legacy demo-era routes are redirected or hidden from active navigation. |

## Route Availability

Route availability is enforced by `src/middleware.ts` through `getRouteAvailabilityDecision()`.

| Route Family | Current Behavior |
| --- | --- |
| Active module routes | Available when the owning module is active. |
| Legacy compatibility routes | Redirect to active canonical routes, for example `/devis` to `/sales/quotes`. |
| Hidden/legacy routes | Redirect to the fallback active route, generally `/dashboard`. |
| `/crm/opportunities` and `/crm/activities` | Redirect to active stable CRM/Sales destinations. |
| `/sales/orders`, `/sales/delivery-notes`, `/sales/shipments` | Available in default Alpha because `alpha.crm-sales` now activates the owning modules. |

## Internal Sales Operations QA Switch

SPR-427 introduced a safe local/internal Edition profile switch for authenticated Sales Operations QA. After the later authenticated end-to-end validation, Sales Operations was promoted into default `alpha.crm-sales`; the switch remains available for QA compatibility.

Use this command for local Sales Operations QA:

```bash
NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE=sales-operations npm run dev
```

Restore default Alpha by unsetting the environment variable:

```bash
npm run dev
```

or by explicitly selecting:

```bash
NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE=alpha.crm-sales npm run dev
```

Safety rules:

- the switch is allowed only in `development` and `test`;
- production ignores the override and falls back to default Alpha;
- only `alpha.crm-sales` and `sales-operations` are allow-listed;
- activation is not controlled by URL parameters, cookies, localStorage or request headers.

Authenticated browser QA has now validated the Quote to Sales Order to Reservation to Delivery Note to Shipment flow. Sales Operations is promoted to default Alpha through the Edition profile, not through navigation overrides.

SPR-427A fixed the hydration consistency issue found during browser QA. The effective Edition activation request is now resolved during server render and passed into the client `ModuleActivationProvider`, so Sidebar and Command Center consumers hydrate from the same activation snapshot. The resolver also uses static `NEXT_PUBLIC_BOSIACO_INTERNAL_EDITION_PROFILE` access so Next.js can inline the public value consistently.

## Persistence Status

Persistent models are present in `prisma/schema.prisma` and backed by repository/API layers where noted.

| Domain | Persistence Reality |
| --- | --- |
| CRM Companies | Persisted as `CrmCompany` through `/api/persistence/crm-sales`. |
| CRM Customers | Persisted as `CrmCustomer` for compatibility, but not exposed as an independent primary UI object. |
| CRM Contacts | Persisted as `CrmContact` and shared across Company and global Contact surfaces. |
| CRM Meetings | Persisted as `CrmMeeting`. |
| CRM Tasks | Persisted as `CrmTask`. |
| CRM Notes | Persisted as `CrmNote`. |
| Quotes | Persisted as `SalesQuote` and `SalesQuoteLine`. |
| Invoices | Persisted as `SalesInvoice` and `SalesInvoiceLine`. |
| Payments | Persisted as `SalesPayment`. |
| Product Catalog | Persisted through Product/ProductCategory models and `product-catalog` persistence. |
| Inventory | Persisted as `InventoryWarehouse`, `InventoryBalance` and `InventoryStockMovement`. |
| Reservations | Persisted through structured Inventory movement references and availability logic. |
| Sales Orders | Persisted as `SalesOrder` and `SalesOrderLine`; active in Alpha. |
| Delivery Notes | Persisted as `SalesDeliveryNote` and `SalesDeliveryNoteLine`; active in Alpha. |
| Procurement Suppliers | Persisted as `ProcurementSupplier`. |
| Purchase Orders | Persisted as `ProcurementPurchaseOrder` and `ProcurementPurchaseOrderLine`. |
| Goods Receipts | Persisted as `ProcurementGoodsReceipt` and `ProcurementGoodsReceiptLine`. |
| Shipments | Persisted as `SalesShipment` and `SalesShipmentLine`; active in Alpha. |

## Operational Capability Matrix

| Capability | Current Classification |
| --- | --- |
| Executive Dashboard | Works, active, contribution-driven. |
| CRM Companies | Works, active, persisted. |
| CRM Contacts | Works, active, persisted. |
| CRM Meetings | Works, active, persisted. |
| CRM Tasks | Works, active, persisted. |
| CRM Notes | Works, active, persisted. |
| CRM Customers | Compatibility layer, not a primary visible workspace. |
| CRM Opportunities/Pipeline | Hidden/inactive; do not treat as production. |
| Sales Quotes | Works, active, persisted, PDF-capable, line-item capable. |
| Sales Invoices | Works, active, persisted, PDF-capable, line-item capable. |
| Sales Payments | Works, active, persisted. |
| Product Catalog | Works, active, persisted, import/export capable. |
| Inventory | Works, active, persisted, supports warehouses, movements, availability and reservations. |
| Procurement Suppliers | Works, active, persisted. |
| Purchase Orders | Works, active, persisted. |
| Goods Receipts | Works, active, persisted, posts Inventory `RECEIPT` movements. |
| Procurement Cockpit | Works, active, derives KPIs and two lightweight analytics from persisted Procurement data. |
| Sales Orders | Works, active in Alpha, persisted. |
| Delivery Notes | Works, active in Alpha, persisted, posts Inventory `ISSUE` movements. |
| Shipments | Works, active in Alpha, persisted, logistics-only and does not post Inventory movements. |
| Global Search / Command Center | Works as local provider-based productivity surface. |
| Smart Entity Picker / Inline Creation | Implemented for supported forms; should remain generic and client-safe. |
| Business Timeline | Foundation plus Sales/Inventory providers; currently integrated on Sales Order details. |
| Settings | Active but limited to Alpha-safe settings. |
| HR | Legacy/planned; not production-ready. |
| Finance/Accounting | Not implemented beyond invoice/payment business records; no ledger, journals, reconciliation or accounting engine. |
| AI Platform | Vision/planned; no AI business feature is implemented. |
| Workflow Automation | Not implemented as a production workflow engine. |

## Database and Migration Status

The Prisma migration history can rebuild the current schema from baseline and subsequent business migrations.

Known migration folders include:

- `20260710220000_baseline`
- `20260710230000_persist_crm_sales`
- `20260711174254_zf_r6_crm_activities`
- `20260713120000_product_catalog_foundation`
- `20260713130000_inventory_domain_foundation`
- `20260713140000_inventory_workspace_reorder_point`
- `20260713150000_inventory_reservation_references`
- `20260713230000_procurement_foundation`
- `20260713231916_goods_receipt_posting`
- `20260714141552_sales_orders_foundation`
- `20260714171135_quote_product_identity`
- `20260715171406_delivery_notes_physical_issue`
- `20260724110000_product_operational_reorder_point`
- `20260813120000_shipment_persistence`

Shipment persistence exists as of this reconciliation.

## Search, Command Center and Productivity

| Surface | Current Reality |
| --- | --- |
| Command Center | Supports navigation, quick create, records, favorites and recent items for active/stable destinations. |
| Unified Search Runtime | Provider-based and module-owned. |
| CRM Search Providers | Companies, Contacts, Meetings, Tasks and Notes are represented through module-owned providers or record registries. |
| Sales Search Providers | Quotes, Invoices, Payments, Sales Orders, Delivery Notes and Shipments have mapper/provider support where their modules exist. Results must remain filtered by activation. |
| Product/Inventory/Procurement Search | Product, Warehouse, Supplier, Purchase Order and Goods Receipt records are included where active. |

## Procurement Cockpit Reality

`/procurement` remains the canonical Procurement overview. It now enriches the existing operational lists with real-data cockpit projections:

- `Achats du mois`: current-month validated Purchase Order value, excluding drafts, cancelled and archived orders.
- `Montant engagé`: confirmed and partially received Purchase Order value.
- `Commandes ouvertes`: sent, confirmed and partially received Purchase Orders.
- `À réceptionner`: confirmed or partially received Purchase Orders with remaining quantities.
- `Fournisseurs actifs`: suppliers whose existing active/status semantics mark them as active.
- `Évolution des achats`: six-month validated Purchase Order value trend.
- `Top fournisseurs`: ranking by validated Purchase Order value.

The cockpit is read-only projection logic over scoped Procurement snapshots. It does not change Procurement workflows, Inventory posting, Prisma, persistence repositories or activation behavior.

## Blueprint Phase Assessment

| Blueprint Layer | Current State |
| --- | --- |
| Product Foundation | Largely complete for the current Alpha product. |
| ERP Core | Operational across CRM, Sales, Product Catalog, Inventory and Procurement; Accounting is not implemented. |
| Zero Friction ERP | Strong foundations exist: Command Center, Quick Create, Smart Picker, inline creation, contextual actions and keyboard support. |
| Modular Editions Platform | Foundations complete: registry, activation, edition profiles, dynamic navigation/routes and dashboard contributions. No licensing or admin module management UI yet. |
| Business Platform | Started through Product Catalog, Inventory, Procurement, Sales Orders, Delivery Notes, Shipment foundation and Timeline/Search runtimes. |
| AI Productivity Platform | Planned only. |
| Agent-Ready Platform | Planned only. |
| Business Operating System | Vision exists in `docs/BOSIACO_BLUEPRINT.md`; full BOS graph/workflow/agent layer is not implemented. |

## Known Limitations

- Product Catalog create persistence now maps duplicate, validation, tenant and stale-category failures to controlled French errors, but full authenticated browser creation QA remains blocked in this environment by a local Prisma connection error during tenant bootstrap.
- Sales Orders, Delivery Notes and Shipments are active in default Alpha after authenticated end-to-end Sales Operations QA.
- Shipments are durable and active in Alpha; carrier API integration, parcel split, GPS tracking and notification workflows are not implemented.
- Procurement is active in Alpha, but supplier invoices, approval workflows, purchasing payments and accounting integration are not implemented.
- Product Catalog import/export handles master data only; it does not import stock quantities or inventory movements.
- Inventory has posting, reservations and availability, but no barcode scanning, manufacturing, POS, carrier integration or advanced warehouse operations.
- CRM Opportunities/Pipeline remains hidden until a persistent, company-centric model is completed.
- Accounting is not implemented beyond Sales invoices/payments as commercial records.
- HR and finance legacy pages exist as routes but are hidden or redirected and should not be treated as production modules.
- Platform profiles are static; there is no tenant edition assignment, licensing engine, feature flag engine, dashboard editor or module admin UI.
- Runtime notification, activity and audit layers are foundations, not complete production observability or compliance systems.
- Some historical documents from earlier sprints describe modules as inactive that are now active; this status document supersedes those older statements.

## Recommended Candidate Directions

1. Shipment parcel/carrier decision: decide whether future logistics needs one Shipment with package lines or multiple Shipments per Delivery Note.
2. Accounting Foundation: begin a minimal ledger/accounting architecture only if the product decision is to move beyond commercial invoices/payments into financial accounting.
3. Sales Operations release monitoring: continue authenticated smoke QA for Quote acceptance, Sales Order reservation, Delivery Note posting, Shipment lifecycle and Inventory reconciliation now that the workflow is visible in Alpha.
4. Procurement future depth: supplier invoices, approval workflows, supplier payments, returns/reversals and supplier performance remain future work.

## Documentation Guidance

- Use `docs/BOSIACO_BLUEPRINT.md` for product vision and phase direction.
- Use `docs/05_PLATFORM_ARCHITECTURE.md` for module, activation, edition, navigation, route, dashboard and import-safety rules.
- Use this file for current repository status.
- Use sprint documents for historical implementation detail, not for current activation or persistence truth when code has moved on.
