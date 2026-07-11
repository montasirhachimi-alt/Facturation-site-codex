import { MeetingService } from "../meeting.service";
import { crmMeetingSeed } from "./meetings.seed";

export const crmMeetingStoreEventName = "hicopilot-crm-meetings-updated";
export const crmMeetingLocalService = new MeetingService({ seed: crmMeetingSeed });

export function notifyCrmMeetingStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmMeetingStoreEventName));
}

export function subscribeToCrmMeetingStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmMeetingStoreEventName, listener);
  return () => window.removeEventListener(crmMeetingStoreEventName, listener);
}
