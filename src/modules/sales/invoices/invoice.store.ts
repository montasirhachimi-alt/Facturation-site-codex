import { InvoiceService } from "./invoice.service";
import { invoiceSeed } from "./invoices.seed";

export const invoiceService = new InvoiceService({ seed: invoiceSeed });
