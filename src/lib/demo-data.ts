import type { BusinessClient, ClientDocument, SalesDocument, StockMovement, StockProduct } from "@/lib/types";

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

export const clients: BusinessClient[] = [
  {
    id: "client-1",
    name: "Amina El Mansouri",
    company: "École Al Hikma",
    ice: "001122334455667",
    taxId: "12345678",
    rc: "98765",
    phone: "0661 22 33 44",
    email: "contact@alhikma.ma",
    address: "45, Rue des Écoles",
    city: "Casablanca"
  },
  {
    id: "client-2",
    name: "Youssef Bennani",
    company: "Lycée Ibn Sina",
    ice: "001133445566778",
    taxId: "23456789",
    rc: "87654",
    phone: "0678 11 22 33",
    email: "administration@ibnsina.ma",
    address: "78, Bd Hassan II",
    city: "Rabat"
  },
  {
    id: "client-3",
    name: "Karim Alaoui",
    company: "Entreprise Atlas",
    ice: "001144556677889",
    taxId: "34567890",
    rc: "76543",
    phone: "0662 33 44 55",
    email: "achats@atlas.ma",
    address: "12, Zone Industrielle",
    city: "Casablanca"
  },
  {
    id: "client-4",
    name: "Nadia Idrissi",
    company: "Clinique Lumière",
    ice: "001155667788990",
    taxId: "45678901",
    rc: "65432",
    phone: "0663 44 55 66",
    email: "direction@cliniquelumiere.ma",
    address: "9, Avenue Mohammed VI",
    city: "Marrakech"
  },
  {
    id: "client-5",
    name: "Mehdi Lahlou",
    company: "Groupe Noor",
    ice: "001166778899001",
    taxId: "56789012",
    rc: "54321",
    phone: "0664 55 66 77",
    email: "finance@groupenoor.ma",
    address: "23, Rue Ibn Toumert",
    city: "Tanger"
  }
];

export const clientDocuments: ClientDocument[] = [
  { id: "cdoc-1", clientId: "client-1", number: "FAC-2026-000123", type: "Facture", status: "Partiellement payé", date: "2026-06-12", total: 39000, paid: 26150 },
  { id: "cdoc-2", clientId: "client-1", number: "DEV-2026-000061", type: "Devis", status: "Envoyé", date: "2026-06-05", total: 18400, paid: 0 },
  { id: "cdoc-3", clientId: "client-2", number: "DEV-2026-000056", type: "Devis", status: "Accepté", date: "2026-06-11", total: 38820, paid: 0 },
  { id: "cdoc-4", clientId: "client-2", number: "FAC-2026-000118", type: "Facture", status: "Payé", date: "2026-05-28", total: 22400, paid: 22400 },
  { id: "cdoc-5", clientId: "client-3", number: "FAC-2026-000119", type: "Facture", status: "En retard", date: "2026-06-02", total: 20000, paid: 0 },
  { id: "cdoc-6", clientId: "client-3", number: "DEV-2026-000052", type: "Devis", status: "Accepté", date: "2026-05-22", total: 19000, paid: 0 },
  { id: "cdoc-7", clientId: "client-4", number: "PRO-2026-000019", type: "Devis", status: "Brouillon", date: "2026-06-08", total: 84000, paid: 0 },
  { id: "cdoc-8", clientId: "client-4", number: "FAC-2026-000111", type: "Facture", status: "Partiellement payé", date: "2026-05-18", total: 56000, paid: 23000 },
  { id: "cdoc-9", clientId: "client-5", number: "FAC-2026-000104", type: "Facture", status: "Payé", date: "2026-05-09", total: 3200, paid: 3200 }
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
