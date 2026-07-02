# CRM Tasks Foundation

Tasks are the follow-up workflow layer of the CRM.

Every task belongs to one company and one contact. A task may also be linked to a meeting. The foundation is in-memory only and does not use Prisma, API routes, backend services or persistence.

## Domain Model

`Task` includes:

- workspace, company and contact scope
- optional meeting reference
- task type, status and priority
- assignee and due date
- completion timestamp
- tags and audit timestamps

## Service Model

`TaskService` supports:

- `listTasks()`
- `getTask()`
- `getTasksByCompany()`
- `getTasksByContact()`
- `getTasksByMeeting()`
- `createTask()`
- `updateTask()`
- `completeTask()`
- `cancelTask()`
- `searchTasks()`

## Activity Integration

Task creation, completion and cancellation prepare Activity inputs through existing Activity contracts. `ActivityService` remains unchanged.

## Meeting Integration

Tasks can reference `meetingId`, which prepares future meeting follow-up workflows without modifying `MeetingService`.

## Future Workflow Integration

The model is ready for workflow automation, task reminders, AI follow-ups, calendar integration and team assignment.
