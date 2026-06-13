import type { SalesDocument, StockMovement, StockProduct } from "@/lib/types";

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

export const products: StockProduct[] = [
  {
    id: "prod-1",
    reference: "ECR-75",
    designation: "Écran interactif 75 pouces",
    description: "Écran tactile 4K pour salles de réunion et classes connectées.",
    category: "Équipement",
    imageUrl: "",
    purchasePrice: 9800,
    salePrice: 12500,
    vat: 20,
    stock: 14,
    minStock: 5
  },
  {
    id: "prod-2",
    reference: "VID-EP",
    designation: "Vidéoprojecteur Epson",
    description: "Vidéoprojecteur professionnel haute luminosité.",
    category: "Équipement",
    imageUrl: "",
    purchasePrice: 5300,
    salePrice: 6800,
    vat: 20,
    stock: 8,
    minStock: 4
  },
  {
    id: "prod-3",
    reference: "SUP-MUR",
    designation: "Support mural",
    description: "Support mural renforcé pour écrans interactifs.",
    category: "Accessoires",
    imageUrl: "",
    purchasePrice: 210,
    salePrice: 350,
    vat: 20,
    stock: 3,
    minStock: 10
  },
  {
    id: "prod-4",
    reference: "HDMI-10",
    designation: "Câble HDMI 10M",
    description: "Câble HDMI blindé 10 mètres.",
    category: "Câblage",
    imageUrl: "",
    purchasePrice: 70,
    salePrice: 120,
    vat: 20,
    stock: 26,
    minStock: 20
  },
  {
    id: "prod-5",
    reference: "STY-INT",
    designation: "Stylet interactif",
    description: "Stylet de remplacement pour écran interactif.",
    category: "Accessoires",
    imageUrl: "",
    purchasePrice: 95,
    salePrice: 160,
    vat: 20,
    stock: 2,
    minStock: 8
  },
  {
    id: "prod-6",
    reference: "SRV-INST",
    designation: "Installation sur site",
    description: "Prestation d'installation et configuration.",
    category: "Service",
    imageUrl: "",
    purchasePrice: 0,
    salePrice: 950,
    vat: 20,
    stock: 0,
    minStock: 0
  }
];

export const stockMovements: StockMovement[] = [
  { id: "mov-1", productReference: "ECR-75", productName: "Écran interactif 75 pouces", type: "Entrée", quantity: 6, reason: "Réception fournisseur", reference: "ACH-2026-00041", date: "2026-06-12" },
  { id: "mov-2", productReference: "SUP-MUR", productName: "Support mural", type: "Sortie", quantity: 4, reason: "Bon de livraison client", reference: "BL-2026-000045", date: "2026-06-11" },
  { id: "mov-3", productReference: "VID-EP", productName: "Vidéoprojecteur Epson", type: "Sortie", quantity: 1, reason: "Facture client", reference: "FAC-2026-000123", date: "2026-06-10" },
  { id: "mov-4", productReference: "HDMI-10", productName: "Câble HDMI 10M", type: "Entrée", quantity: 20, reason: "Réapprovisionnement", reference: "ACH-2026-00039", date: "2026-06-09" },
  { id: "mov-5", productReference: "STY-INT", productName: "Stylet interactif", type: "Ajustement", quantity: -1, reason: "Correction inventaire", reference: "INV-2026-00007", date: "2026-06-08" }
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
