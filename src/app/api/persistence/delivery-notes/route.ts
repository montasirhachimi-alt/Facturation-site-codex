import { NextResponse } from "next/server";
import type { DeliveryNote } from "@/modules/sales/delivery-notes";
import { archiveDeliveryNote, loadDeliveryNoteSnapshot, persistDeliveryNoteDraft, postDeliveryNote } from "@/server/persistence/delivery-note-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";

type DeliveryNoteRequest =
  | { operation: "saveDraft"; payload: DeliveryNote }
  | { operation: "post"; payload: { deliveryNoteId: string } }
  | { operation: "archive"; payload: { deliveryNoteId: string } };

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    return NextResponse.json(await loadDeliveryNoteSnapshot(scope));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as DeliveryNoteRequest;
    if (body.operation === "saveDraft") {
      const record = await persistDeliveryNoteDraft(scope, body.payload);
      return NextResponse.json({ record, snapshot: await loadDeliveryNoteSnapshot(scope) });
    }
    if (body.operation === "post") {
      const result = await postDeliveryNote(scope, body.payload.deliveryNoteId);
      return NextResponse.json({ snapshot: result.deliveryNoteSnapshot, inventorySnapshot: result.inventorySnapshot });
    }
    if (body.operation === "archive") {
      return NextResponse.json({ snapshot: await archiveDeliveryNote(scope, body.payload.deliveryNoteId) });
    }
    return NextResponse.json({ error: "Opération de livraison invalide." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur de livraison inconnue.";
}
