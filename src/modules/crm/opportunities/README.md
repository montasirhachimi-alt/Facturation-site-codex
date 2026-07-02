# CRM Opportunities Foundation

## Purpose

Opportunities represent the first Sales Engine domain inside the CRM. They connect a workspace, a company and a primary contact to a future sales pipeline.

## Domain

An opportunity contains:

- Workspace reference
- Company reference
- Primary contact reference
- Pipeline stage
- Probability
- Estimated value
- Expected close date
- Owner
- Status
- Priority
- Tags

## Architecture

The domain follows the same structure as Customers, Companies, Contacts, Activities, Meetings, Tasks and Notes:

- Strong TypeScript models
- Structured validation
- Pure utility functions
- In-memory service
- Optional activity preparation
- UI/demo seed separated under `ui/`

## Permissions

The domain is permission-aware through `PermissionDecision` inputs and prepares the permissions:

- `crm.opportunity.read`
- `crm.opportunity.write`

The permission engine is not duplicated.

## Future Integrations

Future sprints can connect Opportunities to:

- Quotes
- Invoices
- Sales orders
- Meetings
- Tasks
- Notes
- Activities
- AI recommendations

## Persistence

This foundation is intentionally in-memory only. Prisma, APIs and database persistence are out of scope for SPR-319.
