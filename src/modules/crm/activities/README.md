# CRM Activities Foundation

## Purpose

Activities are the historical memory of CRM.

Every important interaction around a Company or Contact can eventually become an Activity.

## Domain Model

The `Activity` model includes:

- workspace scope
- company relationship
- optional contact relationship
- type
- title and description
- performer and performed date
- status
- priority
- tags
- metadata
- audit timestamps

## Service Model

`ActivityService` is an in-memory, workspace-aware, company-aware, contact-aware and permission-aware service. It supports:

- `listActivities()`
- `getActivity()`
- `getActivitiesByCompany()`
- `getActivitiesByContact()`
- `createActivity()`
- `updateActivity()`
- `archiveActivity()`
- `searchActivities()`

## Timeline Philosophy

The Company Timeline consumes `ActivityService` instead of mock data.

Future integrations should create activities for emails, meetings, sales, invoices, projects, workflows and AI suggestions.

## Permission Awareness

Activity operations accept optional platform permission decisions and use `crm.activity.read` / `crm.activity.write` conventions.

## Persistence

This sprint intentionally uses in-memory storage only.
