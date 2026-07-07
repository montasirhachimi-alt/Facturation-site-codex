import { PaymentDetailsWorkspace } from "@/modules/sales/payments/ui";

export default async function SalesPaymentDetailsPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  return <PaymentDetailsWorkspace paymentId={paymentId} />;
}
