import { NextResponse } from "next/server";
import {
  archiveInventoryWarehouse,
  createInventoryWarehouse,
  loadInventorySnapshot,
  postInventoryMovement,
  updateInventoryWarehouse
} from "@/server/persistence/inventory-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type { PostMovementInput, ReservationRequest } from "@/modules/inventory";

type InventoryRequest =
  | { operation: "createWarehouse"; payload: Parameters<typeof createInventoryWarehouse>[1] }
  | { operation: "updateWarehouse"; payload: { warehouseId: string } & Parameters<typeof updateInventoryWarehouse>[2] }
  | { operation: "archiveWarehouse"; payload: { warehouseId: string } }
  | { operation: "postMovement"; payload: PostMovementInput }
  | { operation: "reserve"; payload: ReservationRequest }
  | { operation: "release"; payload: ReservationRequest };

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
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    if (body.operation === "updateWarehouse") {
      const record = await updateInventoryWarehouse(scope, body.payload.warehouseId, body.payload);
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    if (body.operation === "archiveWarehouse") {
      const record = await archiveInventoryWarehouse(scope, body.payload.warehouseId);
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    if (body.operation === "postMovement") {
      const record = await postInventoryMovement(scope, body.payload);
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    if (body.operation === "reserve") {
      const record = await postInventoryMovement(scope, {
        companyId: body.payload.companyId,
        productId: body.payload.productId,
        toWarehouseId: body.payload.warehouseId,
        type: "RESERVATION",
        quantity: body.payload.quantity,
        reference: body.payload.reference,
        referenceType: body.payload.referenceType ?? "MANUAL",
        referenceId: body.payload.referenceId,
        reason: body.payload.reason,
        createdBy: body.payload.createdBy
      });
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    if (body.operation === "release") {
      const record = await postInventoryMovement(scope, {
        companyId: body.payload.companyId,
        productId: body.payload.productId,
        fromWarehouseId: body.payload.warehouseId,
        type: "RELEASE",
        quantity: body.payload.quantity,
        reference: body.payload.reference,
        referenceType: body.payload.referenceType ?? "MANUAL",
        referenceId: body.payload.referenceId,
        reason: body.payload.reason,
        createdBy: body.payload.createdBy
      });
      return NextResponse.json({ record, snapshot: await loadInventorySnapshot(scope) });
    }

    return NextResponse.json({ error: "Opération inventaire invalide." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inventaire inconnue.";
}
