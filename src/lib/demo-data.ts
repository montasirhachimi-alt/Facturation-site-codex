import type { SalesDocument } from "@/lib/types";

export const dashboardStats = {
  revenue: 125430,
  outstanding: 32850,
  netResult: 38940,
  criticalStock: 12
};

export const salesSeries = [
  { month: "Janv", sales: 20000 },
  { month: "Fév", sales: 36000 },
  { month: "Mars", sales: 78000 },
  { month: "Avr", sales: 60000 },
  { month: "Mai", sales: 80500 },
  { month: "Juin", sales: 94200 }
];

export const productsRanking = [
  { name: "Écran interactif 75 pouces", quantity: 42 },
  { name: "Vidéoprojecteur Epson", quantity: 31 },
  { name: "Support mural", quantity: 28 },
  { name: "Câble HDMI 10M", quantity: 26 },
  { name: "Stylet interactif", quantity: 21 }
];

export const documents = [
  { number: "FAC-2026-000123", type: "Facture", customer: "École Al Hikma", date: "2026-06-12", status: "Partiellement payé", total: 39000 },
  { number: "DEV-2026-000056", type: "Devis", customer: "Lycée Ibn Sina", date: "2026-06-11", status: "Envoyé", total: 38820 },
  { number: "BL-2026-000045", type: "Bon de livraison", customer: "Entreprise Atlas", date: "2026-06-10", status: "Accepté", total: 39000 },
  { number: "PRO-2026-000019", type: "Proforma", customer: "Clinique Lumière", date: "2026-06-08", status: "Brouillon", total: 84000 },
  { number: "AV-2026-000004", type: "Avoir", customer: "Groupe Noor", date: "2026-06-05", status: "Payé", total: 3200 }
];

export const clients = [
  { company: "École Al Hikma", city: "Casablanca", ice: "001122334455667", phone: "0661 22 33 44", balance: 12850, lastReminder: "Aujourd'hui" },
  { company: "Lycée Ibn Sina", city: "Rabat", ice: "001133445566778", phone: "0678 11 22 33", balance: 0, lastReminder: "Aucune" },
  { company: "Entreprise Atlas", city: "Casablanca", ice: "001144556677889", phone: "0662 33 44 55", balance: 20000, lastReminder: "10/06/2026" },
  { company: "Clinique Lumière", city: "Marrakech", ice: "001155667788990", phone: "0663 44 55 66", balance: 84000, lastReminder: "09/06/2026" }
];

export const products = [
  { reference: "ECR-75", name: "Écran interactif 75 pouces", category: "Équipement", stock: 14, minStock: 5, salePrice: 12500, vat: 20 },
  { reference: "VID-EP", name: "Vidéoprojecteur Epson", category: "Équipement", stock: 8, minStock: 4, salePrice: 6800, vat: 20 },
  { reference: "SUP-MUR", name: "Support mural", category: "Accessoires", stock: 3, minStock: 10, salePrice: 350, vat: 20 },
  { reference: "HDMI-10", name: "Câble HDMI 10M", category: "Câblage", stock: 26, minStock: 20, salePrice: 120, vat: 20 },
  { reference: "SRV-INST", name: "Installation sur site", category: "Service", stock: 0, minStock: 0, salePrice: 950, vat: 20 }
];

export const sampleInvoice: SalesDocument = {
  type: "FACTURE",
  number: "FAC-2026-000123",
  date: "12/06/2026",
  customer: {
    name: "École Al Hikma",
    address: "45, Rue des Écoles",
    city: "Casablanca - Maroc",
    ice: "001122334455667",
    phone: "0661 22 33 44"
  },
  lines: [
    { designation: "Écran interactif 75 pouces", quantity: 2, unitPrice: 12500, vat: 20 },
    { designation: "Vidéoprojecteur Epson", quantity: 1, unitPrice: 6800, vat: 20 },
    { designation: "Support mural", quantity: 2, unitPrice: 350, vat: 20 }
  ],
  amountInWords: "Trente-neuf mille dirhams toutes taxes comprises."
};
