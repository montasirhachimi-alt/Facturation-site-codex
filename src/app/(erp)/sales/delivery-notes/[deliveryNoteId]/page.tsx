import { DeliveryNoteDetailsWorkspace } from "@/modules/sales/delivery-notes/ui";

export default async function DeliveryNoteDetailsRoute({ params }: { params: Promise<{ deliveryNoteId: string }> }) {
  const { deliveryNoteId } = await params;
  return <DeliveryNoteDetailsWorkspace deliveryNoteId={deliveryNoteId} />;
}
