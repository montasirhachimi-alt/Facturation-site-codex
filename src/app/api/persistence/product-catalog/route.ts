import { NextResponse } from "next/server";
import {
  loadProductCatalogSnapshot,
  persistProductCatalogRecord,
  type ProductCatalogPersistenceResource
} from "@/server/persistence/product-catalog-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";

const resources = new Set<ProductCatalogPersistenceResource>(["product", "category"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadProductCatalogSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as { resource?: ProductCatalogPersistenceResource; record?: unknown };
    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload catalogue invalide." }, { status: 400 });
    }

    const record = await persistProductCatalogRecord(scope, body.resource, body.record);
    return NextResponse.json({ record });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur catalogue inconnue.";
}
