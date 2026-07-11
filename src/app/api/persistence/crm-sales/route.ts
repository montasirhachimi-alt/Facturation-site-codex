import { NextResponse } from "next/server";
import {
  loadCrmSalesSnapshot,
  persistCrmSalesRecord,
  type CrmSalesPersistenceResource
} from "@/server/persistence/crm-sales-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";

const resources = new Set<CrmSalesPersistenceResource>(["company", "customer", "contact", "meeting", "task", "note", "quote", "invoice", "payment"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadCrmSalesSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as { resource?: CrmSalesPersistenceResource; record?: unknown };
    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload de persistance invalide." }, { status: 400 });
    }

    const record = await persistCrmSalesRecord(scope, body.resource, body.record);
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur de persistance inconnue.";
}
