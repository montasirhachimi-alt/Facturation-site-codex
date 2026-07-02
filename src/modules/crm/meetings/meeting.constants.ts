import type { MeetingSort, MeetingStatus, MeetingType } from "./meeting.types";

export const MEETING_TYPES = Object.freeze([
  "on_site",
  "online",
  "phone_call",
  "demo",
  "sales_meeting",
  "internal",
  "customer_success",
  "custom"
] satisfies MeetingType[]);

export const MEETING_STATUSES = Object.freeze(["planned", "confirmed", "completed", "cancelled"] satisfies MeetingStatus[]);

export const DEFAULT_MEETING_TYPE: MeetingType = "online";
export const DEFAULT_MEETING_STATUS: MeetingStatus = "planned";
export const DEFAULT_MEETING_SORT: MeetingSort = Object.freeze({ field: "startAt", direction: "asc" });

export const CRM_MEETING_READ_PERMISSION = Object.freeze({ module: "crm.meeting", action: "read" as const });
export const CRM_MEETING_WRITE_PERMISSION = Object.freeze({ module: "crm.meeting", action: "write" as const });
