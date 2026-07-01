# CRM Customers Foundation

## Purpose

The Customers foundation defines the customer domain model for the CRM module. It prepares HicoPilot for future customer screens, persistence and CRM workflows without adding UI, API routes or database access.

## Type Model

The domain model includes:

- `Customer`
- `CustomerStatus`
- `CustomerType`
- `CustomerSource`
- `CreateCustomerInput`
- `UpdateCustomerInput`
- `CustomerFilters`
- `CustomerSearchQuery`
- `CustomerSort`
- `CustomerListResult`

## Service Model

`CustomerService` is an in-memory service foundation. It supports:

- `listCustomers()`
- `getCustomerById()`
- `createCustomer()`
- `updateCustomer()`
- `archiveCustomer()`
- `searchCustomers()`

The service is deterministic when injected with `now` and `createId` functions. It is easy to replace with persistence later.

## Validation Strategy

Validation helpers return structured results and do not throw for normal validation failures. They validate:

- display name
- workspace scope
- email format
- phone format
- user id
- optional permission decision

## Workspace Awareness

All customer operations are scoped by `workspaceId`. Listing, lookup and search never return customers from another workspace.

## Permission Awareness

The service accepts optional platform permission decisions. It does not implement or duplicate the permission engine.

## Future Persistence Migration

The in-memory store is intentionally isolated behind `CustomerService`. Future Prisma/database migration should preserve the public service API where possible.

## Future UI Sprint

Future UI work should consume the service/domain layer instead of reimplementing customer filtering, sorting, validation or normalization in React components.

