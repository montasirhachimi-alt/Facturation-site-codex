import { NextResponse } from "next/server";
import { loadHrSnapshot, persistHrRecord, type HrPersistenceResource } from "@/server/persistence/hr-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";

const resources = new Set<HrPersistenceResource>(["department", "position", "employee", "contract", "leaveType", "leaveRequest", "leaveBalance", "absence", "attendanceRecord"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadHrSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as { resource?: HrPersistenceResource; record?: unknown };
    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload RH invalide." }, { status: 400 });
    }

    const record = await persistHrRecord(scope, body.resource, body.record);
    const snapshot = await loadHrSnapshot(scope);
    return NextResponse.json({ record, snapshot });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur RH inconnue.";
}
