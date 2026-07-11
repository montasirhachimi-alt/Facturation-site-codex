# ZF-R5 — CRM ↔ Sales Entity Relationship and Live Synchronization

Date: 2026-07-10

## Objective

Make CRM and Sales behave as one integrated local ERP during the current browser session.

A Company, Customer or Contact created from CRM, Quick Create or Smart Entity Picker must become immediately available to Quote and Invoice creation without refreshing or reopening the application.

## Root Cause

CRM and Sales were reading related entities from different local sources:

- Smart Entity Picker adapters read static seed arrays.
- Customers used a private `CustomerService` instance inside the page hook.
- Quote and Invoice dialogs used static company/contact seeds.
- Quote and Invoice details reconstructed relationship labels from seeded service instances.
- Command Center Record Search indexed CRM and Sales seed arrays instead of live local services.
- Quick Create Company and Customer dialogs closed without writing to the owning CRM local service.

This made inline-created entities picker-local and caused relationship labels or IDs to disappear between creation, details, PDF and search.

## Authoritative Local Sources

The following module-owned local sources now act as the session authorities:

- Companies: `crmCompanyLocalService`
- Customers: `crmCustomerLocalService`
- Contacts: `crmContactLocalService`
- Quotes: `quoteService`
- Invoices: `invoiceService`

Each CRM entity local source exposes a lightweight browser event subscription so pickers, workspaces and Command Center surfaces can refresh without a browser reload.

## Relationship Integrity

Quote records now preserve:

- `customerId`
- `customerName`
- `companyId`
- `companyName`
- `contactId`
- `contactName`
- `opportunityId`
- `opportunityName`

Invoice records now preserve the same commercial context and quote-to-invoice conversion carries the context forward.

Customers now preserve `companyId` in addition to `companyName`.

## Picker Synchronization

Smart Entity Picker adapters now read live CRM local services instead of static seeds.

Inline creation now writes through the owning CRM local service:

- Company inline creation creates a Company in `crmCompanyLocalService`.
- Customer inline creation creates a Customer in `crmCustomerLocalService`.
- Contact inline creation creates a Contact in `crmContactLocalService` when a Company is selected.

After creation, the owning store emits its update event, picker subscribers refresh, and the created item is selected immediately.

## Quote Workflow Result

Quote creation now uses live Customers, Companies and Contacts.

Selecting a Customer can suggest its Company when the Company field is empty. It does not overwrite a manually selected Company.

Selecting a Contact can suggest its Company when the Company field is empty. It does not overwrite a manually selected Company.

Saved Quote details and PDF use the stored Quote relationship context with live CRM entity lookup as the first preference and stored labels as fallback.

## Invoice Workflow Result

Invoice creation now uses live Customers, Companies and Contacts.

Invoices created from Quotes inherit the Quote relationship context.

Invoice details and PDF use the stored Invoice relationship context with live CRM entity lookup as the first preference and stored labels as fallback.

## Command Center Consistency

Record Search now indexes live local Companies, Customers, Contacts, Quotes and Invoices.

Quick Create Company, Customer and Contact now writes to the CRM local services and notifies subscribers.

## Remaining Limitations

- Data remains local/in-memory and does not persist across full browser reloads.
- CRM Home summary widgets still include some seed-backed overview data and should be migrated in a later workspace aggregation sprint.
- Opportunities remain seed-backed because ZF-R5 focuses on Company, Customer, Contact, Quote and Invoice synchronization.
- Payments still read company labels from seeded helpers in some secondary surfaces; payment relationship synchronization should be reviewed separately.
