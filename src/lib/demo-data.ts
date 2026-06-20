import type {
  BusinessClient,
  CashEntry,
  ClientDocument,
  CompanyProfile,
  DeliveryNote,
  Employee,
  EmployeeContract,
  Attendance,
  AppUser,
  HrDocument,
  HrLeave,
  Invoice,
  PurchaseInvoice,
  Quote,
  SalesDocument,
  SalaryAdvance,
  SalarySlip,
  StockMovement,
  StockProduct,
  Supplier
} from "@/lib/types";

export const activeCompanyId = "company-hicotech";

export const activeCompanyProfile: CompanyProfile = {
  id: activeCompanyId,
  name: "HICOTECH",
  address: "N7, ILOT 14 - LOTISSEMENT FADALLAH",
  city: "MOHAMMEDIA, Maroc",
  phone: "0661144190",
  ice: "003390979000024",
  taxId: "60164052",
  logoUrl: "/hicotech-logo.png"
};

export const demoUsers: AppUser[] = [
  {
    id: "user-admin",
    companyId: activeCompanyId,
    name: "Administrateur HICOTECH",
    email: "admin@hicotech.ma",
    passwordHash: "2209251d15cb5db5025444f8eea3a9fa9a7830cb8934f0611d7665c66eadec35",
    role: "COMPANY_ADMIN",
    status: "active"
  },
  {
    id: "user-sales",
    companyId: activeCompanyId,
    name: "Commercial",
    email: "ventes@hicotech.ma",
    passwordHash: "45fd4e203bc1f59e90b516742489bbe500a332a994c6547cbb080c42a15717d9",
    role: "SALES",
    status: "active"
  },
  {
    id: "user-stock",
    companyId: activeCompanyId,
    name: "Gestion Stock",
    email: "stock@hicotech.ma",
    passwordHash: "ff83add410bb4e43fd6b07ab00c15183ff30afd6cb270a40b97053bb9b4e7565",
    role: "STOCK_MANAGER",
    status: "active"
  },
  {
    id: "user-accountant",
    companyId: activeCompanyId,
    name: "Comptable",
    email: "caisse@hicotech.ma",
    passwordHash: "17e9df22e2e393e3e6d1c37e88a3789e73dcd3f21a0589c23f07b13dad345748",
    role: "ACCOUNTANT",
    status: "active"
  },
  {
    id: "user-hr",
    companyId: activeCompanyId,
    name: "Responsable RH",
    email: "rh@hicotech.ma",
    passwordHash: "b6500aab942cbeb3c69e2126cdb322b85901755eeb5bc4c853c813d44985c2f9",
    role: "HR",
    status: "active"
  },
  {
    id: "user-readonly",
    companyId: activeCompanyId,
    name: "Lecture seule",
    email: "lecture@hicotech.ma",
    passwordHash: "98d76c060ace70fe97851f68ab413a354660b0acc4dfd7ba40a7a1918909c718",
    role: "READ_ONLY",
    status: "active"
  },
  {
    id: "user-super",
    companyId: null,
    name: "Super Admin",
    email: "super@hicotech.ma",
    passwordHash: "ae4bab9f70526336225866284c96491dc7556157ade5b90e890be244e49b9627",
    role: "SUPER_ADMIN",
    status: "active"
  }
];

export const dashboardStats = {
  revenue: 125430,
  purchases: 48300,
  expenses: 18450,
  grossMargin: 77130,
  outstanding: 32850,
  netResult: 38940,
  cashBalance: 64280,
  stockValue: 214800,
  overdueInvoices: 6,
  criticalStock: 12
};

export const salesSeries = [
  { month: "Janv", sales: 20000, purchases: 9200, expenses: 5400 },
  { month: "Fév", sales: 36000, purchases: 14200, expenses: 6900 },
  { month: "Mars", sales: 78000, purchases: 31000, expenses: 11200 },
  { month: "Avr", sales: 60000, purchases: 25500, expenses: 8800 },
  { month: "Mai", sales: 80500, purchases: 33400, expenses: 12500 },
  { month: "Juin", sales: 94200, purchases: 38600, expenses: 14600 }
];

export const productsRanking = [
  { name: "Écran interactif 75 pouces", quantity: 42 },
  { name: "Vidéoprojecteur Epson", quantity: 31 },
  { name: "Support mural", quantity: 28 },
  { name: "Câble HDMI 10M", quantity: 26 },
  { name: "Stylet interactif", quantity: 21 }
];

export const topClients = [
  { company: "Clinique Lumière", total: 56000, paid: 23000 },
  { company: "École Al Hikma", total: 39000, paid: 26150 },
  { company: "Lycée Ibn Sina", total: 22400, paid: 22400 },
  { company: "Entreprise Atlas", total: 20000, paid: 0 },
  { company: "Groupe Noor", total: 3840, paid: 3840 }
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

export const suppliers: Supplier[] = [
  {
    id: "supplier-1",
    companyId: activeCompanyId,
    name: "Tech Distribution Maroc",
    contactName: "Said Amrani",
    ice: "002244668811335",
    taxId: "99887766",
    rc: "445566",
    phone: "0522 44 88 11",
    email: "facturation@tdm.ma",
    address: "Zone industrielle Sidi Maarouf",
    city: "Casablanca",
    balance: 18400
  },
  {
    id: "supplier-2",
    companyId: activeCompanyId,
    name: "Epson Partner Center",
    contactName: "Meryem Zahraoui",
    ice: "002255779922446",
    taxId: "88776655",
    rc: "334455",
    phone: "0537 20 44 90",
    email: "commandes@epsonpartner.ma",
    address: "Avenue Annakhil, Hay Riad",
    city: "Rabat",
    balance: 0
  },
  {
    id: "supplier-3",
    companyId: activeCompanyId,
    name: "Accessoires Pro",
    contactName: "Imane Rami",
    ice: "002266880033557",
    taxId: "77665544",
    rc: "223344",
    phone: "0539 77 12 18",
    email: "contact@accessoirespro.ma",
    address: "12, Rue Ibn Khaldoun",
    city: "Tanger",
    balance: 4200
  },
  {
    id: "supplier-4",
    companyId: activeCompanyId,
    name: "Smart Board Import",
    contactName: "Omar Ghali",
    ice: "002277991144668",
    taxId: "66554433",
    rc: "112233",
    phone: "0524 66 10 31",
    email: "finance@smartboard.ma",
    address: "Quartier industriel Al Massar",
    city: "Marrakech",
    balance: 31200
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
    minStock: 5,
    unit: "Pièce"
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
    minStock: 4,
    unit: "Pièce"
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
    minStock: 10,
    unit: "Pièce"
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
    minStock: 20,
    unit: "Pièce"
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
    minStock: 8,
    unit: "Pièce"
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
    minStock: 0,
    unit: "Pièce"
  }
];

export const stockMovements: StockMovement[] = [
  { id: "mov-1", productReference: "ECR-75", productName: "Écran interactif 75 pouces", type: "Entrée", quantity: 6, reason: "Réception fournisseur", reference: "ACH-2026-00041", date: "2026-06-12" },
  { id: "mov-2", productReference: "SUP-MUR", productName: "Support mural", type: "Sortie", quantity: 4, reason: "Bon de livraison client", reference: "BL-2026-000045", date: "2026-06-11" },
  { id: "mov-3", productReference: "VID-EP", productName: "Vidéoprojecteur Epson", type: "Sortie", quantity: 1, reason: "Facture client", reference: "FAC-2026-000123", date: "2026-06-10" },
  { id: "mov-4", productReference: "HDMI-10", productName: "Câble HDMI 10M", type: "Entrée", quantity: 20, reason: "Réapprovisionnement", reference: "ACH-2026-00039", date: "2026-06-09" },
  { id: "mov-5", productReference: "STY-INT", productName: "Stylet interactif", type: "Ajustement", quantity: -1, reason: "Correction inventaire", reference: "INV-2026-00007", date: "2026-06-08" }
];

export const deliveryNotes: DeliveryNote[] = [
  {
    id: "delivery-1",
    companyId: activeCompanyId,
    number: "BL-2026-000045",
    date: "2026-06-10",
    status: "Livré",
    internalReference: "CMD-ATLAS-0610",
    clientId: "client-3",
    deliveryAddress: "12, Zone Industrielle",
    city: "Casablanca",
    deliveryTerms: "Livraison sur site client avec vérification du matériel.",
    internalNotes: "Prévoir installation complémentaire semaine prochaine.",
    lines: [
      {
        id: "dll-1",
        productId: "prod-1",
        reference: "ECR-75",
        designation: "Écran interactif 75 pouces",
        orderedQuantity: 2,
        deliveredQuantity: 2,
        unit: "Pièce",
        observations: "Livré sans réserve"
      },
      {
        id: "dll-2",
        productId: "prod-3",
        reference: "SUP-MUR",
        designation: "Support mural",
        orderedQuantity: 2,
        deliveredQuantity: 2,
        unit: "Pièce",
        observations: "À poser par l'équipe technique"
      }
    ]
  },
  {
    id: "delivery-2",
    companyId: activeCompanyId,
    number: "BL-2026-000046",
    date: "2026-06-12",
    status: "Validé",
    internalReference: "CMD-HIKMA-0612",
    clientId: "client-1",
    deliveryAddress: "45, Rue des Écoles",
    city: "Casablanca",
    deliveryTerms: "Livraison partielle acceptée par le client.",
    internalNotes: "Reste à livrer 1 vidéoprojecteur.",
    lines: [
      {
        id: "dll-3",
        productId: "prod-4",
        reference: "HDMI-10",
        designation: "Câble HDMI 10M",
        orderedQuantity: 20,
        deliveredQuantity: 20,
        unit: "Pièce",
        observations: ""
      },
      {
        id: "dll-4",
        productId: "prod-2",
        reference: "VID-EP",
        designation: "Vidéoprojecteur Epson",
        orderedQuantity: 2,
        deliveredQuantity: 1,
        unit: "Pièce",
        observations: "Livraison partielle"
      }
    ]
  }
];

export const quotes: Quote[] = [
  {
    id: "quote-1",
    number: "DEV-2026-000056",
    date: "2026-06-11",
    clientId: "client-2",
    status: "Envoyé",
    lines: [
      { id: "ql-1", productId: "prod-1", designation: "Écran interactif 75 pouces", quantity: 2, unitPrice: 12500, vat: 20 },
      { id: "ql-2", productId: "prod-2", designation: "Vidéoprojecteur Epson", quantity: 1, unitPrice: 6800, vat: 20 },
      { id: "ql-3", productId: "prod-3", designation: "Support mural", quantity: 2, unitPrice: 350, vat: 20 }
    ]
  },
  {
    id: "quote-2",
    number: "DEV-2026-000061",
    date: "2026-06-05",
    clientId: "client-1",
    status: "Brouillon",
    lines: [
      { id: "ql-4", productId: "prod-4", designation: "Câble HDMI 10M", quantity: 20, unitPrice: 120, vat: 20 },
      { id: "ql-5", productId: "prod-6", designation: "Installation sur site", quantity: 1, unitPrice: 950, vat: 20 }
    ]
  },
  {
    id: "quote-3",
    number: "DEV-2026-000052",
    date: "2026-05-22",
    clientId: "client-3",
    status: "Accepté",
    lines: [
      { id: "ql-6", productId: "prod-2", designation: "Vidéoprojecteur Epson", quantity: 2, unitPrice: 6800, vat: 20 },
      { id: "ql-7", productId: "prod-3", designation: "Support mural", quantity: 4, unitPrice: 350, vat: 20 }
    ]
  },
  {
    id: "quote-4",
    number: "DEV-2026-000048",
    date: "2026-05-14",
    clientId: "client-4",
    status: "Refusé",
    lines: [
      { id: "ql-8", productId: "prod-1", designation: "Écran interactif 75 pouces", quantity: 4, unitPrice: 12500, vat: 20 }
    ]
  }
];

export const invoices: Invoice[] = [
  {
    id: "invoice-1",
    number: "FAC-2026-000123",
    date: "2026-06-12",
    dueDate: "2026-06-30",
    clientId: "client-1",
    status: "Partiellement payée",
    lines: [
      { id: "il-1", productId: "prod-1", designation: "Écran interactif 75 pouces", quantity: 2, unitPrice: 12500, vat: 20 },
      { id: "il-2", productId: "prod-2", designation: "Vidéoprojecteur Epson", quantity: 1, unitPrice: 6800, vat: 20 },
      { id: "il-3", productId: "prod-3", designation: "Support mural", quantity: 2, unitPrice: 350, vat: 20 }
    ],
    payments: [
      { id: "pay-1", invoiceId: "invoice-1", date: "2026-06-13", amount: 15000, mode: "Virement", reference: "VIR-0613" },
      { id: "pay-2", invoiceId: "invoice-1", date: "2026-06-18", amount: 11150, mode: "Chèque", reference: "CHQ-8821" }
    ]
  },
  {
    id: "invoice-2",
    number: "FAC-2026-000118",
    date: "2026-05-28",
    dueDate: "2026-06-10",
    clientId: "client-2",
    status: "Payée",
    lines: [
      { id: "il-4", productId: "prod-4", designation: "Câble HDMI 10M", quantity: 30, unitPrice: 120, vat: 20 },
      { id: "il-5", productId: "prod-6", designation: "Installation sur site", quantity: 2, unitPrice: 950, vat: 20 }
    ],
    payments: [
      { id: "pay-3", invoiceId: "invoice-2", date: "2026-06-02", amount: 6600, mode: "Carte bancaire", reference: "CB-20260602" }
    ]
  },
  {
    id: "invoice-3",
    number: "FAC-2026-000119",
    date: "2026-06-02",
    dueDate: "2026-06-12",
    clientId: "client-3",
    status: "En retard",
    lines: [
      { id: "il-6", productId: "prod-2", designation: "Vidéoprojecteur Epson", quantity: 2, unitPrice: 6800, vat: 20 },
      { id: "il-7", productId: "prod-3", designation: "Support mural", quantity: 4, unitPrice: 350, vat: 20 }
    ],
    payments: []
  },
  {
    id: "invoice-4",
    number: "FAC-2026-000111",
    date: "2026-05-18",
    dueDate: "2026-06-01",
    clientId: "client-4",
    status: "Partiellement payée",
    lines: [
      { id: "il-8", productId: "prod-1", designation: "Écran interactif 75 pouces", quantity: 4, unitPrice: 12500, vat: 20 }
    ],
    payments: [
      { id: "pay-4", invoiceId: "invoice-4", date: "2026-05-25", amount: 23000, mode: "Virement", reference: "VIR-0525" }
    ]
  },
  {
    id: "invoice-5",
    number: "FAC-2026-000104",
    date: "2026-05-09",
    dueDate: "2026-05-20",
    clientId: "client-5",
    status: "Payée",
    lines: [
      { id: "il-9", productId: "prod-5", designation: "Stylet interactif", quantity: 20, unitPrice: 160, vat: 20 }
    ],
    payments: [
      { id: "pay-5", invoiceId: "invoice-5", date: "2026-05-11", amount: 3840, mode: "Espèces", reference: "ESP-00104" }
    ]
  }
];

export const purchaseInvoices: PurchaseInvoice[] = [
  {
    id: "purchase-1",
    companyId: activeCompanyId,
    number: "ACH-2026-00041",
    date: "2026-06-12",
    dueDate: "2026-06-30",
    supplierId: "supplier-1",
    status: "Partiellement payée",
    paid: 12000,
    lines: [
      { id: "pil-1", productId: "prod-1", designation: "Écran interactif 75 pouces", quantity: 6, unitPrice: 9800, vat: 20 },
      { id: "pil-2", productId: "prod-3", designation: "Support mural", quantity: 10, unitPrice: 210, vat: 20 }
    ]
  },
  {
    id: "purchase-2",
    companyId: activeCompanyId,
    number: "ACH-2026-00039",
    date: "2026-06-09",
    dueDate: "2026-06-20",
    supplierId: "supplier-3",
    status: "Payée",
    paid: 1680,
    lines: [
      { id: "pil-3", productId: "prod-4", designation: "Câble HDMI 10M", quantity: 20, unitPrice: 70, vat: 20 }
    ]
  },
  {
    id: "purchase-3",
    companyId: activeCompanyId,
    number: "ACH-2026-00036",
    date: "2026-05-28",
    dueDate: "2026-06-12",
    supplierId: "supplier-2",
    status: "En retard",
    paid: 0,
    lines: [
      { id: "pil-4", productId: "prod-2", designation: "Vidéoprojecteur Epson", quantity: 4, unitPrice: 5300, vat: 20 }
    ]
  }
];

export const cashEntries: CashEntry[] = [
  { id: "cash-1", companyId: activeCompanyId, date: "2026-06-13", type: "Entrée", category: "Paiement client", label: "Encaissement FAC-2026-000123", amount: 15000, mode: "Virement", reference: "VIR-0613" },
  { id: "cash-2", companyId: activeCompanyId, date: "2026-06-12", type: "Sortie", category: "Paiement fournisseur", label: "Acompte ACH-2026-00041", amount: 12000, mode: "Virement", reference: "ACH-2026-00041" },
  { id: "cash-3", companyId: activeCompanyId, date: "2026-06-10", type: "Sortie", category: "Dépense", label: "Frais livraison client", amount: 650, mode: "Espèces", reference: "DEP-0610" },
  { id: "cash-4", companyId: activeCompanyId, date: "2026-06-08", type: "Entrée", category: "Vente", label: "Vente comptoir accessoires", amount: 3840, mode: "Carte bancaire", reference: "TPE-0608" },
  { id: "cash-5", companyId: activeCompanyId, date: "2026-06-05", type: "Sortie", category: "Achat", label: "Achat câbles HDMI", amount: 1680, mode: "Chèque", reference: "ACH-2026-00039" }
];

export const employees: Employee[] = [
  {
    id: "emp-1",
    companyId: activeCompanyId,
    photoUrl: "",
    firstName: "Yassine",
    lastName: "Karimi",
    cin: "BE123456",
    phone: "0661 10 20 30",
    email: "yassine.karimi@hicotech.ma",
    address: "Hay Al Qods",
    city: "Mohammedia",
    birthDate: "1991-03-14",
    hireDate: "2023-01-10",
    position: "Technicien installation",
    department: "Technique",
    contractType: "CDI",
    baseSalary: 6500,
    status: "actif"
  },
  {
    id: "emp-2",
    companyId: activeCompanyId,
    photoUrl: "",
    firstName: "Salma",
    lastName: "Berrada",
    cin: "BK778899",
    phone: "0662 44 55 66",
    email: "salma.berrada@hicotech.ma",
    address: "Quartier Oasis",
    city: "Casablanca",
    birthDate: "1994-08-02",
    hireDate: "2022-09-01",
    position: "Responsable commerciale",
    department: "Ventes",
    contractType: "CDI",
    baseSalary: 9200,
    status: "actif"
  },
  {
    id: "emp-3",
    companyId: activeCompanyId,
    photoUrl: "",
    firstName: "Imane",
    lastName: "Raji",
    cin: "HH456123",
    phone: "0667 90 12 34",
    email: "imane.raji@hicotech.ma",
    address: "Centre-ville",
    city: "Rabat",
    birthDate: "1998-12-21",
    hireDate: "2026-02-15",
    position: "Assistante administrative",
    department: "Administration",
    contractType: "CDD",
    baseSalary: 4800,
    status: "actif"
  },
  {
    id: "emp-4",
    companyId: activeCompanyId,
    photoUrl: "",
    firstName: "Othmane",
    lastName: "Amrani",
    cin: "AB909090",
    phone: "0668 11 33 55",
    email: "othmane.amrani@hicotech.ma",
    address: "Sidi Maarouf",
    city: "Casablanca",
    birthDate: "1989-06-09",
    hireDate: "2021-05-03",
    position: "Magasinier",
    department: "Stock",
    contractType: "CDI",
    baseSalary: 5600,
    status: "suspendu"
  }
];

export const employeeContracts: EmployeeContract[] = [
  { id: "contract-1", companyId: activeCompanyId, employeeId: "emp-1", type: "CDI", startDate: "2023-01-10", endDate: "", salary: 6500, position: "Technicien installation", signedFileUrl: "" },
  { id: "contract-2", companyId: activeCompanyId, employeeId: "emp-2", type: "CDI", startDate: "2022-09-01", endDate: "", salary: 9200, position: "Responsable commerciale", signedFileUrl: "" },
  { id: "contract-3", companyId: activeCompanyId, employeeId: "emp-3", type: "CDD", startDate: "2026-02-15", endDate: "2026-12-31", salary: 4800, position: "Assistante administrative", signedFileUrl: "" }
];

export const attendances: Attendance[] = [
  { id: "att-1", companyId: activeCompanyId, employeeId: "emp-1", date: "2026-06-14", checkIn: "08:35", checkOut: "17:42", lateMinutes: 5, workedHours: 8.1 },
  { id: "att-2", companyId: activeCompanyId, employeeId: "emp-2", date: "2026-06-14", checkIn: "08:56", checkOut: "18:05", lateMinutes: 26, workedHours: 8.2 },
  { id: "att-3", companyId: activeCompanyId, employeeId: "emp-3", date: "2026-06-14", checkIn: "08:25", checkOut: "17:30", lateMinutes: 0, workedHours: 8 },
  { id: "att-4", companyId: activeCompanyId, employeeId: "emp-4", date: "2026-06-13", checkIn: "09:15", checkOut: "16:50", lateMinutes: 45, workedHours: 6.9 }
];

export const hrLeaves: HrLeave[] = [
  { id: "leave-1", companyId: activeCompanyId, employeeId: "emp-1", type: "congé", reason: "Congé annuel", startDate: "2026-06-20", endDate: "2026-06-24", days: 5, status: "en attente", balance: 14 },
  { id: "leave-2", companyId: activeCompanyId, employeeId: "emp-2", type: "absence", reason: "Rendez-vous administratif", startDate: "2026-06-14", endDate: "2026-06-14", days: 1, status: "validé", balance: 9 },
  { id: "leave-3", companyId: activeCompanyId, employeeId: "emp-3", type: "congé", reason: "Congé personnel", startDate: "2026-07-01", endDate: "2026-07-03", days: 3, status: "refusé", balance: 10 }
];

export const salaryAdvances: SalaryAdvance[] = [
  { id: "adv-1", companyId: activeCompanyId, employeeId: "emp-1", amount: 1500, date: "2026-06-05", mode: "Virement", deducted: true },
  { id: "adv-2", companyId: activeCompanyId, employeeId: "emp-3", amount: 800, date: "2026-06-10", mode: "Espèces", deducted: false }
];

export const salarySlips: SalarySlip[] = [
  { id: "slip-1", companyId: activeCompanyId, employeeId: "emp-1", month: "2026-06", baseSalary: 6500, bonuses: 600, advances: 1500, deductions: 250, unpaidAbsences: 0, netSalary: 5350 },
  { id: "slip-2", companyId: activeCompanyId, employeeId: "emp-2", month: "2026-06", baseSalary: 9200, bonuses: 1200, advances: 0, deductions: 400, unpaidAbsences: 0, netSalary: 10000 },
  { id: "slip-3", companyId: activeCompanyId, employeeId: "emp-3", month: "2026-06", baseSalary: 4800, bonuses: 300, advances: 800, deductions: 100, unpaidAbsences: 0, netSalary: 4200 }
];

export const hrDocuments: HrDocument[] = [
  { id: "hrdoc-1", companyId: activeCompanyId, employeeId: "emp-1", type: "CIN", title: "Copie CIN Yassine Karimi", fileUrl: "", issuedAt: "2026-01-10" },
  { id: "hrdoc-2", companyId: activeCompanyId, employeeId: "emp-2", type: "Contrat", title: "Contrat CDI signé", fileUrl: "", issuedAt: "2022-09-01" },
  { id: "hrdoc-3", companyId: activeCompanyId, employeeId: "emp-3", type: "Attestation de travail", title: "Attestation de travail", fileUrl: "", issuedAt: "2026-06-01" }
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
