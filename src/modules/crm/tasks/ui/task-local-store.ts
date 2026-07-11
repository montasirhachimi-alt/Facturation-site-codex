import { TaskService } from "../task.service";
import { crmTaskSeed } from "./tasks.seed";

export const crmTaskStoreEventName = "hicopilot-crm-tasks-updated";
export const crmTaskLocalService = new TaskService({ seed: crmTaskSeed });

export function notifyCrmTaskStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmTaskStoreEventName));
}

export function subscribeToCrmTaskStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmTaskStoreEventName, listener);
  return () => window.removeEventListener(crmTaskStoreEventName, listener);
}
