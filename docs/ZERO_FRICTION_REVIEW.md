# Zero Friction Review

## PERSIST-001 — Durable CRM and Sales Data Foundation

Date: 2026-07-10

### Objective

Move the ZF-R5 synchronized CRM/Sales records from session-only memory toward durable tenant-scoped Prisma persistence.

### Resolved Foundation Work

- Added dedicated Prisma models for CRM Companies, Customers, Contacts, Sales Quotes, Quote lines, Sales Invoices, Invoice lines and stable Sales Payments.
- Added a server-side persistence repository scoped by the authenticated session `companyId`.
- Added a client persistence provider that hydrates existing module local services from the database.
- Added write-through persistence calls for CRM create/edit/archive, Smart Entity Picker inline creation, Quick Create CRM actions, Quote creation, Invoice creation, Quote-to-Invoice conversion and Payment recording.
- Updated Sales and CRM detail pages to subscribe to live stores so hydrated persisted records can appear after refresh.

### Remaining Validation Blocker

The local PostgreSQL database at `localhost:5432` was not reachable in this environment, so migration application and full refresh/restart persistence verification could not be completed here.

### Remaining Limitations

- Existing form handlers remain synchronous; persistence writes happen immediately after local save but dialogs do not yet wait for database confirmation.
- Persistence save failures are logged in the browser console and should become user-facing in a future reliability sprint.
- Opportunities and some CRM Home summary aggregations remain seed-backed.

## ZF-R5 — CRM ↔ Sales Entity Relationship and Live Synchronization

Date: 2026-07-10

### Objective

Make CRM and Sales behave as one integrated local ERP during the same browser session.

### Resolved Issues

- Smart Entity Picker CRM adapters now read live module-owned local services instead of static seed arrays.
- Customers now use a shared local Customer service rather than a private page-level service instance.
- Companies, Customers and Contacts expose lightweight store update events for live picker/workspace synchronization.
- Inline Company, Customer and Contact creation writes through the owning CRM local service and notifies subscribers.
- Quote creation now preserves `customerId`, `companyName`, `contactName`, `opportunityName` and validity context.
- Invoice creation and Quote-to-Invoice conversion now preserve the same relationship context.
- Quote and Invoice details now prefer live CRM entities and fall back to stored labels instead of seeded reconstruction.
- Command Center Record Search now indexes live Companies, Customers, Contacts, Quotes and Invoices.
- Quick Create Company, Customer and Contact now writes to CRM local services instead of closing as a no-op.

### Authoritative Local Sources

- Companies: `crmCompanyLocalService`
- Customers: `crmCustomerLocalService`
- Contacts: `crmContactLocalService`
- Quotes: `quoteService`
- Invoices: `invoiceService`

### Remaining Limitations

- Data remains local/in-memory and does not survive a full browser reload.
- CRM Home still contains some seed-backed summary widgets.
- Opportunities remain seed-backed.
- Payment secondary surfaces still need a separate relationship synchronization review.

## ZF-R3 — Dialog Sizing and Form Workspace Comfort

Date: 2026-07-10

### Objective

Improve creation and edit dialog comfort without changing validation, submit behavior, services, APIs or business rules.

### Dialog Size System

`EntityDialog` now exposes a shared `size` API:

- `sm`: compact dialogs, around 480px.
- `md`: standard dialogs, around 640px.
- `lg`: business forms, around 880px.
- `xl`: complex commercial forms, around 1150px.

The default remains `md` for backward compatibility.

### Dialogs Resized

- Contact dialog: `md`
- Company dialog: `lg`
- Customer dialog: `lg`
- Quote dialog: `xl`
- Invoice dialog: `xl`
- Payment quick-create surface: `lg`

### Form Comfort Improvements

- Quote and Invoice dialogs now use the wider `xl` surface so line-item workflows have enough horizontal space.
- Sales line items switch to a desktop column layout from the `lg` breakpoint while preserving stacked mobile cards.
- Company and Customer dialogs use `lg`, allowing existing two-column form sections to breathe without adding fields.
- Contact remains `md` to avoid making simple contact edits feel oversized.

### Scroll and Responsive Behavior

- Dialogs stay within viewport height.
- Dialog body scrolls independently.
- Header and footer remain outside the scrolling body so context and actions stay reachable.
- Mobile keeps near-full-width dialogs with single-column form content and stacked line items.

### Remaining Limitations

- Payment creation still uses the existing quick-create preview surface; ZF-R3 only adjusts its dialog size.
- Inline entity creation remains compact through its existing picker surface and does not inherit oversized dialog widths.

## ZF-R2 — CRM Workspace & Details Polish

Date: 2026-07-10

### Objective

Remove unfinished product surfaces from visible CRM workspaces and detail pages while preserving future capabilities in code for later editions.

### Pages Reviewed

- CRM Companies workspace
- CRM Customers workspace
- CRM Contacts workspace
- CRM Opportunities workspace
- Company detail page
- Contact detail page

### Resolved Issues

- Company detail header actions no longer expose silent controls.
- Company `Favori` now uses the same Command Center Favorites foundation as Contact records.
- Company `Modifier` now opens the existing Company dialog in edit mode and saves through `CompanyService.updateCompany`.
- Company `Options` and `Relation` header actions were removed because no stable additional action/menu exists.
- Company `Épingler` is disabled with a clear reason instead of acting like an enabled control.
- Contact workspace row actions now expose only `Voir`, `Modifier` and `Archiver`; placeholder overflow, email and activity actions are no longer visible.
- Company detail tabs now show only operational tabs: overview, contacts, opportunities, quotes and invoices.
- Contact detail tabs now hide future-only tabs: emails, documents and settings.
- Opportunity cards no longer show an inert overflow icon or describe drag-and-drop as an upcoming capability.
- CRM copy no longer advertises visible "coming soon" modules inside reviewed workspaces.

### Hidden Future Modules

The following surfaces are intentionally hidden through lightweight CRM feature visibility configuration:

- `crm.company.customers`
- `crm.company.sales`
- `crm.company.projects`
- `crm.company.activity`
- `crm.company.notes`
- `crm.company.settings`
- `crm.contact.emails`
- `crm.contact.documents`
- `crm.contact.settings`

These are not deleted. They remain prepared for future editions without exposing unfinished tabs to users.

### Remaining Issues

- CRM data remains local/in-memory and is not persisted across reloads.
- Some CRM relationship widgets still use local seeded/demo values until persistence and cross-module aggregation are introduced.
- Pinning remains intentionally unavailable on CRM detail headers until a stable pinned-record foundation is productized.

### Validation Policy

ZF-R2 must pass:

- `npm run validate:runtime`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
