import jsPDF from "jspdf";
import type { SalesDocument } from "@/lib/types";

export function createSalesPdf(document: SalesDocument) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const subtotal = document.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  pdf.setDrawColor(180, 230, 245);
  pdf.setLineWidth(1.2);
  pdf.rect(14, 12, 62, 22);
  pdf.setFillColor(7, 154, 209);
  pdf.rect(14, 31, 62, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text("HICOTECH", 18, 28);
  pdf.setFontSize(8);
  pdf.text("INFORMATIQUE SIMPLIFIEE", 24, 41);

  pdf.setFontSize(22);
  pdf.setTextColor(10, 30, 63);
  pdf.text(document.type, pageWidth - 14, 24, { align: "right" });
  pdf.setFontSize(10);
  pdf.text(`N° : ${document.number}`, pageWidth - 14, 32, { align: "right" });
  pdf.text(`Date : ${document.date}`, pageWidth - 14, 38, { align: "right" });

  pdf.setTextColor(51, 51, 51);
  pdf.setFont("helvetica", "bold");
  pdf.text("HICOTECH", 14, 56);
  pdf.setFont("helvetica", "normal");
  pdf.text(["123, Avenue Mohamed V", "Casablanca - Maroc", "ICE : 001234567000089", "IF : 12345678 - RC : 123456"], 14, 62);

  pdf.roundedRect(122, 50, 74, 35, 2, 2);
  pdf.setFont("helvetica", "bold");
  pdf.text("Client", 126, 58);
  pdf.setFont("helvetica", "normal");
  pdf.text([document.customer.name, document.customer.address, document.customer.city, `ICE : ${document.customer.ice}`, `Tél : ${document.customer.phone}`], 126, 64);

  const tableTop = 100;
  pdf.setFillColor(13, 110, 253);
  pdf.rect(14, tableTop, 182, 9, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("Désignation", 17, tableTop + 6);
  pdf.text("Qté", 120, tableTop + 6, { align: "right" });
  pdf.text("PU HT", 145, tableTop + 6, { align: "right" });
  pdf.text("TVA", 162, tableTop + 6, { align: "right" });
  pdf.text("Total HT", 192, tableTop + 6, { align: "right" });

  pdf.setTextColor(51, 51, 51);
  pdf.setFont("helvetica", "normal");
  document.lines.forEach((line, index) => {
    const y = tableTop + 18 + index * 9;
    pdf.text(line.designation, 17, y);
    pdf.text(String(line.quantity), 120, y, { align: "right" });
    pdf.text(line.unitPrice.toFixed(2), 145, y, { align: "right" });
    pdf.text(`${line.vat}%`, 162, y, { align: "right" });
    pdf.text((line.quantity * line.unitPrice).toFixed(2), 192, y, { align: "right" });
    pdf.line(14, y + 3, 196, y + 3);
  });

  pdf.setFont("helvetica", "bold");
  pdf.text("Montant en lettres", 14, 158);
  pdf.setFont("helvetica", "normal");
  pdf.text(document.amountInWords, 14, 165);

  pdf.setFont("helvetica", "bold");
  pdf.text("Total HT", 148, 156);
  pdf.text(`${subtotal.toFixed(2)} DH`, 196, 156, { align: "right" });
  pdf.text("TVA 20%", 148, 165);
  pdf.text(`${vat.toFixed(2)} DH`, 196, 165, { align: "right" });
  pdf.setFillColor(10, 30, 63);
  pdf.roundedRect(145, 172, 51, 10, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Total TTC  ${total.toFixed(2)} DH`, 192, 179, { align: "right" });

  pdf.setTextColor(10, 30, 63);
  pdf.roundedRect(28, 230, 55, 28, 2, 2);
  pdf.roundedRect(126, 230, 55, 28, 2, 2);
  pdf.text("Signature", 56, 246, { align: "center" });
  pdf.text("Cachet", 154, 246, { align: "center" });

  pdf.save(`${document.number}.pdf`);
}
