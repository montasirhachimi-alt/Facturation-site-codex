import { OrderDetailsWorkspace } from "@/modules/sales/orders/ui";

export default async function SalesOrderDetailsRoute({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <OrderDetailsWorkspace orderId={orderId} />;
}
