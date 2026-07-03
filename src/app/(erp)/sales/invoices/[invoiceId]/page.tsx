import { InvoiceDetailsWorkspace } from "@/modules/sales/invoices/ui";

export default async function SalesInvoiceDetailsPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;
  return <InvoiceDetailsWorkspace invoiceId={invoiceId} />;
}
