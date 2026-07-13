import { NextResponse } from "next/server";
import {
  archiveInventoryWarehouse,
  createInventoryWarehouse,
  loadInventorySnapshot,
  postInventoryMovement
} from "@/server/persistence/inventory-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type { PostMovementInput } from "@/modules/inventory";

type InventoryRequest =
  | { operation: "createWarehouse"; payload: Parameters<typeof createInventoryWarehouse>[1] }
  | { operation: "archiveWarehouse"; payload: { warehouseId: string } }
  | { operation: "postMovement"; payload: PostMovementInput };

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadInventorySnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as InventoryRequest;

    if (body.operation === "createWarehouse") {
      const record = await createInventoryWarehouse(scope, body.payload);
      return NextResponse.json({ record });
    }

    if (body.operation === "archiveWarehouse") {
      const record = await archiveInventoryWarehouse(scope, body.payload.warehouseId);
      return NextResponse.json({ record });
    }

    if (body.operation === "postMovement") {
      const record = await postInventoryMovement(scope, body.payload);
      return NextResponse.json({ record });
    }

    return NextResponse.json({ error: "Opération inventaire invalide." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inventaire inconnue.";
}
