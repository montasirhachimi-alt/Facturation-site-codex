import { hrLocalService, notifyHrStoreUpdated, type HrSnapshot } from "@/modules/hr";

export type HrPersistenceResource = "department" | "position" | "employee" | "contract" | "leaveType" | "leaveRequest";

let hydrationPromise: Promise<HrSnapshot> | null = null;

export async function hydrateHrPersistence() {
  if (!hydrationPromise) {
    hydrationPromise = loadHrPersistenceSnapshot()
      .then((snapshot) => {
        hrLocalService.replaceSnapshot(snapshot);
        notifyHrStoreUpdated();
        return snapshot;
      })
      .catch((error) => {
        hydrationPromise = null;
        throw error;
      });
  }
  return hydrationPromise;
}

export async function loadHrPersistenceSnapshot() {
  const response = await fetch("/api/persistence/hr", {
    method: "GET",
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Données RH indisponibles.");
  }
  return await response.json() as HrSnapshot;
}

export async function persistHrRecord(resource: HrPersistenceResource, record: unknown) {
  const response = await fetch("/api/persistence/hr", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ resource, record })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as { error?: string } | undefined;
    throw new Error(body?.error ?? "Enregistrement RH impossible.");
  }
  const body = await response.json() as { record: unknown; snapshot: HrSnapshot };
  hrLocalService.replaceSnapshot(body.snapshot);
  notifyHrStoreUpdated();
  return body;
}
