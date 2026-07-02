# CRM Meetings Foundation

The Meetings domain is the first connected CRM workflow foundation.

Meetings belong to one company and one or more contacts. They are workspace-aware, company-aware, contact-aware and permission-aware. The domain is in-memory only and does not use Prisma, API routes, backend services or persistence.

## Domain Model

`Meeting` includes:

- workspace and company scope
- one or more contact references
- title, description and location
- meeting type and status
- start and end dates
- organizer and participants
- notes, tags and audit timestamps

## Service Model

`MeetingService` supports:

- `listMeetings()`
- `getMeeting()`
- `getMeetingsByCompany()`
- `getMeetingsByContact()`
- `createMeeting()`
- `updateMeeting()`
- `cancelMeeting()`
- `completeMeeting()`
- `searchMeetings()`

## Activity Integration

Meeting creation prepares an Activity input through the existing Activity contract. The service can receive an optional activity creator callback, but it does not modify `ActivityService` business logic.

## Future Calendar Integration

The model is ready for a future Calendar Runtime, Tasks, Emails, AI summaries and workspace scheduling.
