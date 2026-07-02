# SPR-317A — CRM Navigation Integration Fix

## Summary

SPR-317A makes CRM discoverable from the main application Sidebar without creating new pages or changing CRM business logic.

## Objective

Expose CRM navigation links so users can reach Companies and Customers without typing URLs manually.

## Architecture

CRM Sidebar entries are added through the existing `getSidebarGroups()` adapter. The visible Sidebar continues consuming the same navigation group shape.

## Files Created

- `docs/sprints/SPR-317A.md`

## Files Modified

- `docs/02_PROJECT_STATUS.md`
- `src/components/sidebar.tsx`
- `src/services/navigation/sidebar-adapter.ts`

## Public APIs

No public runtime or business API was added.

## Navigation

- CRM → `/crm`
- Companies → `/crm/companies`
- Customers → `/clients`
- Contacts → `/crm/companies` with `via société`
- Activities / Timeline → `/crm/companies` with `via société`
- Meetings → `/crm/companies` with `via contact`
- Tasks → `/crm/companies` with `via contact`
- Notes → `/crm/companies` with `via contact`

## Validation

- `npm run typecheck`
- `npm run build`

## Known Risks

- Nested CRM links are guided shortcuts until dedicated index pages exist.
- Contacts, Meetings, Tasks and Notes remain accessed through Company and Contact workspaces.

## Future Work

Future sprints can add dedicated CRM landing or index pages if the product needs standalone CRM navigation surfaces.

## Release Notes

CRM is now visible and reachable from the Sidebar.
