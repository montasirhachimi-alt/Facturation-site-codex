# BOSIACO Project Status

Last reconciled: 2026-08-18

This document is the current repository reality. It is intentionally not a sprint history. Historical sprint files remain useful for context, but this status is authoritative when older documents disagree with the current code.

## Current Product Identity

| Field | Current Reality |
| --- | --- |
| Product | BOSIACO, still using some HicoPilot naming in legacy files and code comments. |
| Stage | Alpha product moving from ERP Core into Business Platform foundations. |
| Default runtime edition | `alpha.crm-sales` from `src/platform/editions/edition.profiles.ts`. |
| Current default scope | Dashboard, CRM, Sales quotes/orders/delivery notes/shipments/invoices/payments, Product Catalog, Inventory, Procurement and Finance Operations. |
| Latest completed sprint reflected in code | SPR-435 — Accounting Corrections, Period Control & Auditability V1. |
| Latest roadmap reconciliation | SPR-429 — Post-Procurement Roadmap Reconciliation & Next Core Domain Decision. |
| Important caveat | Finance Operations is active for manual accounting, controlled Sales invoice/payment posting, derived financial statements, reversal corrections and minimal period posting controls. Procurement/AP, inventory valuation, localization, statutory closing and source reposting after reversal remain future work. |

## Validation Snapshot

| Command | Latest Reconciled Result |
| --- | --- |
| `npm run typecheck` | Passed on 2026-08-18. |
| `npm run validate:runtime` | Passed on 2026-08-18 with 191/191 checks. |
| `npm run build` | Passed on 2026-08-18; known `src/components/pdf-preview.tsx` `<img>` warning remains. |
| `git diff --check` | Passed on 2026-08-18. |

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
| `sales.orders` | `/sales/orders` | Active |
| `sales.delivery-notes` | `/sales/delivery-notes` | Active |
| `sales.shipments` | `/sales/shipments` | Active |
| `sales.invoices` | `/sales/invoices` | Active |
| `sales.payments` | `/sales/payments` | Active |
| `sales.products` | `/sales/products` | Active |
| `inventory.stock` | `/inventory` | Active |
| `procurement.overview` | `/procurement` | Active |
| `procurement.suppliers` | `/procurement/suppliers` | Active |
| `procurement.purchase-orders` | `/procurement/purchase-orders` | Active |
| `procurement.goods-receipts` | `/procurement/goods-receipts` | Active |
| `finance.accounting` | `/accounting` | Active |

Hidden platform dependencies such as `platform.persistence` may be automatically enabled by the activation engine but are not product navigation modules.

## Activation-Gated Modules

| Module | Status | Notes |
| --- | --- | --- |
| `sales.orders` | Active in Alpha | Persistent Sales Orders are enabled in `alpha.crm-sales`. Draft edits are server-enforced, confirmation/reservation uses the dedicated action, and the detail availability projection subtracts delivered and reserved quantities before displaying `À réserver`. |
| `sales.delivery-notes` | Active in Alpha | Persistent Delivery Notes are enabled in `alpha.crm-sales`, post Inventory `ISSUE` movements, consume reservations and support partial/final delivery. |
| `sales.shipments` | Active in Alpha | Persistent Shipment logistics records are enabled in `alpha.crm-sales`; lifecycle changes remain logistics-only and do not post Inventory movements. |
| `crm.opportunities` | Hidden | Opportunity UI/domain remnants exist, but the route redirects because persistence is not stable. |
| `finance.accounting` | Active in Alpha | Manual Finance Operations are available for accounts, journals, draft/post journal entries, reversals, period controls, General Ledger, Trial Balance, Profit & Loss and Balance Sheet. Controlled Sales invoice/payment posting is active. |
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
| Accounting Core | Persisted as `AccountingAccount`, `AccountingJournal`, `AccountingJournalEntry`, `AccountingJournalEntryLine` and `AccountingPeriod`; active Finance Operations UI consumes General Ledger, Trial Balance, Profit & Loss and Balance Sheet derived read models. |
| Commercial Accounting Settings | Persisted as `AccountingCommercialPostingSettings`; controls Sales invoice/payment posting mappings and functional currency safety. |

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
| Finance/Accounting | Active for accounts, journals, draft/post journal entries, canonical reversal corrections, minimal period posting controls, General Ledger, Trial Balance, controlled Sales invoice/payment posting, Profit & Loss and Balance Sheet. No Procurement/AP accounting, inventory valuation, reconciliation, statutory localization, statutory close or controlled reposting after reversal. |
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
- `20260817120000_accounting_foundation`
- `20260817130000_commercial_accounting_integration`
- `20260818100000_accounting_corrections_period_control`

Accounting persistence exists as of SPR-430. General Ledger and Trial Balance read models exist as of SPR-431. Finance Operations UI is active as of SPR-432. No additional migration was required by SPR-432.

Commercial Accounting settings and durable source idempotency exist as of SPR-433 through `20260817130000_commercial_accounting_integration`. Profit & Loss and Balance Sheet are derived read models as of SPR-434 and do not add persistence tables or migrations.

SPR-435 adds Accounting correction and period-control persistence through `20260818100000_accounting_corrections_period_control`. It adds durable reversal linkage on `AccountingJournalEntry` and tenant-scoped `AccountingPeriod` records. Closed periods block new postings server-side but remain readable in reports.

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
| ERP Core | Operational across CRM, Sales, Product Catalog, Inventory and Procurement; Accounting Core foundation now exists but is not yet a user-facing Finance application. |
| Zero Friction ERP | Strong foundations exist: Command Center, Quick Create, Smart Picker, inline creation, contextual actions and keyboard support. |
| Modular Editions Platform | Foundations complete: registry, activation, edition profiles, dynamic navigation/routes and dashboard contributions. No licensing or admin module management UI yet. |
| Business Platform | Started through Product Catalog, Inventory, Procurement, Sales Orders, Delivery Notes, Shipment foundation and Timeline/Search runtimes. |
| AI Productivity Platform | Planned only. |
| Agent-Ready Platform | Planned only. |
| Business Operating System | Vision exists in `docs/BOSIACO_BLUEPRINT.md`; full BOS graph/workflow/agent layer is not implemented. |

## SPR-429 Roadmap Reconciliation

SPR-429 reconciles the Blueprint, runtime implementation and recent Procurement/Sales Operations work.

Verified conclusion:

- CRM, Sales, Product Catalog, Inventory and Procurement are operational Alpha capabilities.
- Sales Orders, Delivery Notes and Shipments are active in the default `alpha.crm-sales` profile.
- `/inventory` already functions as the Stock domain cockpit.
- `/procurement` already functions as the Procurement cockpit and was enriched in SPR-428.
- Sales has enough operational data for a future cockpit, but a Sales cockpit is product-experience enrichment rather than the next missing ERP Core domain.
- Accounting/Finance is not implemented as an ERP accounting engine. Current Sales invoices and payments are commercial records only.

SPR-429 recommends **Accounting Foundation V1** as the next major direction. The next sprint must not rebuild Product Catalog, Inventory, Procurement, Sales Operations, Command Center, Unified Search or platform activation foundations.

## SPR-430 Accounting Foundation Reality

SPR-430 creates the first canonical Global Accounting Core:

- `AccountingAccount`;
- `AccountingJournal`;
- `AccountingJournalEntry`;
- `AccountingJournalEntryLine`.

Accounting is tenant-scoped through the existing `Company` ownership model and `requirePersistenceTenantScope()`.

The domain enforces:

- canonical decimal-string accounting amounts;
- debit and credit totals calculated deterministically;
- `draft -> posted` journal entry lifecycle;
- `TOTAL DEBIT = TOTAL CREDIT` before posting;
- cross-tenant account/journal rejection;
- posted-entry mutation restriction through the draft persistence path.

Accounting remains country-agnostic. No Moroccan, French, Spanish or other localization pack is implemented. Company country and functional currency remain separate concepts. Journal entries store functional currency and optional transaction-currency/exchange-rate readiness, but full multi-currency accounting is not implemented.

`finance.accounting` was initially registered as a hidden planned module in SPR-430. SPR-432 promotes it to an active Alpha module after the operational workflow became usable.

## SPR-431 General Ledger and Trial Balance Reality

SPR-431 adds derived Accounting report foundations without adding new persistence tables:

- `GeneralLedgerReport`;
- `TrialBalanceReport`;
- deterministic report date scope with opening, period and closing balances;
- server-side report query helpers on the existing Accounting repository/API boundary.

Official reports derive only from posted `AccountingJournalEntryLine` records. Draft entries are excluded. Totals use functional/base currency amounts and the existing integer minor-unit calculation utilities.

No General Ledger table, Trial Balance table, stored balance aggregate, Finance UI, route, Command Center item or automatic source-document posting was introduced.

## SPR-432 Finance Operations Reality

SPR-432 creates the first user-facing Finance Operations workspace:

- canonical route `/accounting`;
- Plan comptable tab for accounts;
- Journaux tab for journals;
- Écritures tab for manual draft/post journal entries;
- Grand livre tab consuming the server-derived report;
- Balance tab consuming the server-derived report.

`finance.accounting` is now active in default `alpha.crm-sales` and appears under the Finance navigation group.

Manual posting uses the canonical Accounting domain and repository. React does not calculate official Ledger or Trial Balance balances. The server scopes UI-created Accounting records to the authenticated tenant/company.

Still not implemented:

- automatic posting from Sales, Procurement, Inventory or Payments;
- VAT/tax reporting;
- bank reconciliation;
- AP/AR workflows;
- localization packs;
- fiscal periods.

## SPR-433 Commercial Accounting Integration Reality

SPR-433 introduces controlled Sales-to-Accounting posting for the first commercial sources:

- Sales Invoices;
- Sales Payments.

The integration is explicit and Finance-owned. Sales records remain commercial documents; Accounting owns the posting configuration, generated journal entries and report impact.

Commercial posting now uses:

- tenant-scoped `AccountingCommercialPostingSettings`;
- configurable Sales journal;
- configurable receivable, revenue, settlement and optional tax-payable accounts;
- `AccountingJournalEntry.sourceType/sourceId` for source traceability;
- a durable uniqueness constraint on `(tenantCompanyId, sourceType, sourceId)` for idempotency;
- canonical double-entry validation before a generated entry is persisted as posted.

Supported V1 entries:

- Invoice: debit receivable, credit revenue, credit tax only when an explicit tax account is configured.
- Payment: debit settlement/bank, credit receivable.

Draft or cancelled invoices/payments are rejected. Currency conversion is not implemented; V1 refuses posting when the source currency differs from the configured functional currency. Generated entries flow naturally into the existing General Ledger and Trial Balance read models.

Still not implemented:

- Procurement/AP accounting;
- supplier invoices;
- inventory valuation accounting;
- automatic background posting;
- controlled reposting after reversal;
- bank reconciliation;
- fiscal localization and VAT reports;
- full accounts receivable aging.

## SPR-434 Financial Statements Reality

SPR-434 adds Finance statement read models derived from canonical posted Accounting history:

- Profit & Loss / Compte de résultat;
- Balance Sheet / Bilan;
- small Finance Overview enrichment;
- one activation-aware Global Dashboard Finance contribution.

Account classification reuses the existing global account types:

- `asset`;
- `liability`;
- `equity`;
- `income`;
- `expense`.

P&L is period-based and includes only posted `income` and `expense` account movements inside the selected `fromDate` to `toDate` range. Revenue is calculated as credit minus debit on `income` accounts. Expenses are calculated as debit minus credit on `expense` accounts. Net result is revenue minus expenses.

Balance Sheet is derived as of `asOfDate` from cumulative posted account balances. Assets use debit-side balances. Liabilities and equity use credit-side balances. Because BOSIACO does not yet implement fiscal closing or retained earnings transfer, the selected-period net result is shown as a separate derived component:

```text
Assets = Liabilities + Equity + Current Period Result
```

No financial statement tables, stored snapshots, fiscal closing system, localization pack or statutory report was added.

## SPR-435 Accounting Controls Reality

SPR-435 adds correction and period-control foundations around the canonical posted ledger:

- posted entries remain immutable;
- an eligible posted entry can be corrected through a new posted reversal entry;
- the reversal swaps debit and credit lines exactly;
- `reversalOfEntryId`, `correctionReason` and `correctionType` make the link durable;
- duplicate reversal is prevented by repository checks and database uniqueness;
- source-generated Sales invoice/payment entries remain traceable after reversal;
- reversed commercial sources are shown as `Contrepassé` rather than falsely remaining plain `Comptabilisé`;
- `AccountingPeriod` records define OPEN/CLOSED date ranges;
- posting a manual or commercial entry inside a CLOSED period is rejected server-side;
- reversal against old history is posted on an allowed open reversal date;
- periods can be reopened only through an explicit Finance action.

This is posting-period control only. It is not statutory fiscal closing, legal book certification, retained-earnings transfer or Morocco localization.

## Known Limitations

- Product Catalog create persistence now maps duplicate, validation, tenant and stale-category failures to controlled French errors, but full authenticated browser creation QA remains blocked in this environment by a local Prisma connection error during tenant bootstrap.
- Sales Orders, Delivery Notes and Shipments are active in default Alpha after authenticated end-to-end Sales Operations QA.
- Shipments are durable and active in Alpha; carrier API integration, parcel split, GPS tracking and notification workflows are not implemented.
- Procurement is active in Alpha, but supplier invoices, approval workflows, purchasing payments and procurement accounting integration are not implemented.
- Product Catalog import/export handles master data only; it does not import stock quantities or inventory movements.
- Inventory has posting, reservations and availability, but no barcode scanning, manufacturing, POS, carrier integration or advanced warehouse operations.
- CRM Opportunities/Pipeline remains hidden until a persistent, company-centric model is completed.
- Finance Operations is active for manual journal entries, reversal corrections, period posting controls, controlled Sales invoice/payment posting, Profit & Loss and Balance Sheet, but reconciliation, statutory localization, controlled reposting after reversal, fiscal closing and tax reporting are not implemented.
- HR and finance legacy pages exist as routes but are hidden or redirected and should not be treated as production modules.
- Platform profiles are static; there is no tenant edition assignment, licensing engine, feature flag engine, dashboard editor or module admin UI.
- Runtime notification, activity and audit layers are foundations, not complete production observability or compliance systems.
- Local migration application was not executed during SPR-430 because the current `.env` points at a remote Supabase PostgreSQL host; destructive or development migration commands must not be run against non-local databases without an explicit deployment plan.
- Some historical documents from earlier sprints describe modules as inactive that are now active; this status document supersedes those older statements.

## Recommended Candidate Directions

1. Procurement/AP Accounting V1: supplier invoices, AP control account, purchase posting and supplier payment boundaries are the next major financial truth gap.
2. Controlled source reposting after reversal: define a lifecycle for corrected Sales source postings if operationally required.
3. Sales Operations release monitoring: continue authenticated smoke QA for Quote acceptance, Sales Order reservation, Delivery Note posting, Shipment lifecycle and Inventory reconciliation now that the workflow is visible in Alpha.
4. Procurement future depth: supplier invoices, approval workflows, supplier payments, returns/reversals and supplier performance remain future work.
5. Sales Cockpit: useful future Product Experience work, but should align with Accounting semantics before becoming the next major cockpit.

## Documentation Guidance

- Use `docs/BOSIACO_BLUEPRINT.md` for product vision and phase direction.
- Use `docs/05_PLATFORM_ARCHITECTURE.md` for module, activation, edition, navigation, route, dashboard and import-safety rules.
- Use this file for current repository status.
- Use sprint documents for historical implementation detail, not for current activation or persistence truth when code has moved on.
