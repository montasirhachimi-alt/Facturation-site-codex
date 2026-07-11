# ARCH-001 — Company-Centric CRM Business Model

Date: 2026-07-11

## Decision

BOSIACO CRM is now company-centric for the current B2B product vision.

The visible business workflow is:

```text
Company
↓
Contacts
↓
Quotes
↓
Invoices
↓
Payments
```

Company is the commercial account. Contacts belong to Companies. Quotes, Invoices, Payments and Opportunities belong to Companies.

## Motivation

Manual B2B workflow review showed that the standalone Customer entity duplicated the role already played by Company. Asking users to choose both `Customer` and `Company` added cognitive load without improving the current commercial workflow.

BOSIACO should guide users toward the real account they sell to: the Company.

## Customer Compatibility Policy

Customer is not deleted.

Customer remains as a compatibility and future-edition layer for:

- persisted `CrmCustomer` records
- legacy `customerId` and `customerName` fields on Sales documents
- future B2C or advanced account structures
- old route compatibility

For the current product experience, Customer is treated as a business alias over Company and is no longer exposed as an independent workspace or form requirement.

## Visible Product Rules

- CRM navigation exposes Sociétés and Contacts, not a separate Customers workspace.
- `/clients` redirects to `/crm/companies` for backward compatibility.
- Command Center Quick Create no longer exposes New Customer.
- Command Center record search no longer exposes Customer records as a separate result group.
- Smart Entity Picker uses Company for commercial-account selection.
- Quote creation requires Company and optionally Contact.
- Invoice creation requires Company and optionally Contact.
- PDF output displays Company and, when present, `À l'attention : Contact`.
- Company details owns Contacts, Opportunities, Quotes, Invoices and Payments.

## Persistence Rules

No Prisma model or database table was removed.

Sales documents keep compatibility fields:

- `customerId`
- `customerName`

New Quote and Invoice creation fills `customerName` from the selected Company label while leaving `customerId` optional. This preserves existing persistence, PDF, search and store contracts without forcing users to manage a duplicate Customer object.

## Future Options

Future editions may re-enable Customer as an advanced account abstraction if BOSIACO supports:

- B2C customers
- multi-company account groups
- buyer vs payer vs legal entity separation
- customer success lifecycle records

That future work must not reintroduce duplicate Company/Customer selection into the default B2B flow.

## Validation Scope

Manual workflow to verify:

1. Create Company.
2. Create Contact from Company.
3. Create Quote with Company and optional Contact.
4. Create Invoice with Company and optional Contact.
5. Record Payment from Invoice.
6. Confirm no Customer selection is required.

## Known Limitations

- Internal type and database names still include Customer for compatibility.
- Some legacy Customer UI module files remain in the repository but are no longer visible through normal navigation.
- Legacy Sales compatibility fields will need a future naming cleanup only when a data migration strategy exists.
