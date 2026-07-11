import { NoteService } from "../note.service";
import { crmNoteSeed } from "./notes.seed";

export const crmNoteStoreEventName = "hicopilot-crm-notes-updated";
export const crmNoteLocalService = new NoteService({ seed: crmNoteSeed });

export function notifyCrmNoteStoreUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(crmNoteStoreEventName));
}

export function subscribeToCrmNoteStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(crmNoteStoreEventName, listener);
  return () => window.removeEventListener(crmNoteStoreEventName, listener);
}
