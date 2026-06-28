import type { BusinessClient, CashEntry, Invoice, PurchaseInvoice, StockProduct } from "@/lib/types";

export type PeriodFilter = "today" | "week" | "month" | "quarter" | "year" | "custom";

export type DateRange = {
  from: string;
  to: string;
};

export function invoiceTotals(invoice: Pick<Invoice, "lines" | "payments">) {
  const ht = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vat = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.vat / 100), 0);
  const ttc = ht + vat;
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { ht, vat, ttc, paid, outstanding: Math.max(0, ttc - paid) };
}

export function purchaseTotal(purchase: Pick<PurchaseInvoice, "lines">) {
  return purchase.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 + line.vat / 100), 0);
}

export function getDateRange(period: PeriodFilter, custom: DateRange, now = new Date()): DateRange {
  if (period === "custom") return custom;
  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    return { from: toDateInput(start), to: toDateInput(end) };
  }
  if (period === "week") {
    start.setDate(now.getDate() - 6);
  }
  if (period === "month") {
    start.setMonth(now.getMonth() - 1);
  }
  if (period === "quarter") {
    start.setMonth(now.getMonth() - 3);
  }
  if (period === "year") {
    start.setFullYear(now.getFullYear() - 1);
  }

  return { from: toDateInput(start), to: toDateInput(end) };
}

export function filterByDate<T extends { date: string }>(items: T[], range: DateRange) {
  const from = new Date(range.from);
  const to = new Date(range.to);
  to.setHours(23, 59, 59, 999);
  return items.filter((item) => {
    const date = new Date(item.date);
    return date >= from && date <= to;
  });
}

export function calculateBusinessMetrics({
  invoices,
  purchases,
  cashEntries,
  products,
  clients
}: {
  invoices: Invoice[];
  purchases: PurchaseInvoice[];
  cashEntries: CashEntry[];
  products: StockProduct[];
  clients: BusinessClient[];
}) {
  const revenue = invoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).ttc, 0);
  const paid = invoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).paid, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).outstanding, 0);
  const purchasesTotal = purchases.reduce((sum, purchase) => sum + purchaseTotal(purchase), 0);
  const expenses = cashEntries
    .filter((entry) => entry.type === "Sortie" && entry.category === "Dépense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const stockValue = products.reduce((sum, product) => sum + product.stock * product.salePrice * (1 + product.vat / 100), 0);
  const grossMargin = revenue - purchasesTotal;
  const netResult = grossMargin - expenses;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "En retard" || invoiceTotals(invoice).outstanding > 0 && new Date(invoice.dueDate) < new Date()).length;
  const topClients = clients
    .map((client) => {
      const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id);
      return {
        name: client.company,
        total: clientInvoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).ttc, 0),
        paid: clientInvoices.reduce((sum, invoice) => sum + invoiceTotals(invoice).paid, 0)
      };
    })
    .filter((client) => client.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const topProducts = products
    .map((product) => ({
      name: product.designation,
      quantity: invoices.reduce((sum, invoice) => sum + invoice.lines.filter((line) => line.productId === product.id || line.reference === product.reference).reduce((lineSum, line) => lineSum + line.quantity, 0), 0)
    }))
    .filter((product) => product.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const salesByMonth = Array.from(
    invoices.reduce((map, invoice) => {
      const key = invoice.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + invoiceTotals(invoice).ttc);
      return map;
    }, new Map<string, number>())
  )
    .map(([month, sales]) => ({ month, sales }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { revenue, paid, outstanding, purchasesTotal, expenses, stockValue, grossMargin, netResult, overdueInvoices, topClients, topProducts, salesByMonth };
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

