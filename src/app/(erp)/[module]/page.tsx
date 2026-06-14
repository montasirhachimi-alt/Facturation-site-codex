import { SectionHeader } from "@/components/section-header";
import { DataTable } from "@/components/data-table";
import { documents } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/format";

const labels: Record<string, string> = {
  statistiques: "Statistiques",
  paiements: "Suivi paiements",
  devis: "Devis",
  factures: "Factures",
  livraisons: "Bons de livraison",
  achats: "Factures d'achat",
  caisse: "Journal de caisse",
  fournisseurs: "Fournisseurs",
  rapports: "Rapports",
  parametres: "Paramètres"
};

const moduleRows: Record<string, string[][]> = {
  rapports: [
    ["CA mensuel", "Finance", "PDF", "Mis à jour aujourd'hui"],
    ["Marge produits", "Stock", "Excel", "Mis à jour aujourd'hui"],
    ["Clients débiteurs", "Caisse", "PDF", "Mis à jour hier"],
    ["Factures en retard", "Ventes", "Excel", "Mis à jour hier"]
  ],
  parametres: [
    ["Entreprise", "Identité HICOTECH", "Actif", "Administrateur"],
    ["Utilisateurs", "Rôles et accès", "Actif", "Administrateur"],
    ["Numérotation", "Devis, factures, achats", "Actif", "Comptable"],
    ["PDF", "Logo, cachet, signature", "Actif", "Administrateur"]
  ],
  statistiques: [
    ["Chiffre d'affaires", "Finance", formatCurrency(125430), "6 mois"],
    ["Marge brute", "Finance", formatCurrency(77130), "6 mois"],
    ["Valeur stock", "Stock", formatCurrency(214800), "Aujourd'hui"],
    ["Reste à encaisser", "Caisse", formatCurrency(32850), "Aujourd'hui"]
  ],
  paiements: [
    ["FAC-2026-000123", "École Al Hikma", "Partiel", formatCurrency(12850)],
    ["FAC-2026-000119", "Entreprise Atlas", "En retard", formatCurrency(20000)],
    ["FAC-2026-000111", "Clinique Lumière", "Partiel", formatCurrency(37000)]
  ],
  livraisons: documents.filter((document) => document.type === "Bon de livraison").map((document) => [
    document.number,
    document.customer,
    document.status,
    formatCurrency(document.total)
  ])
};

const columns: Record<string, string[]> = {
  rapports: ["Rapport", "Source", "Export", "Dernière mise à jour"],
  parametres: ["Section", "Description", "État", "Accès"],
  statistiques: ["Indicateur", "Module", "Valeur", "Période"],
  paiements: ["Facture", "Client", "Statut", "Reste"],
  livraisons: ["Numéro", "Client", "Statut", "Total"]
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const label = labels[module] ?? "Module";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Module ERP"
        title={label}
        description="Vue opérationnelle avec recherche, pagination, export et données isolées pour l'entreprise active."
        action="Nouvelle entrée"
      />
      <DataTable columns={columns[module] ?? ["Élément", "Type", "Statut", "Valeur"]} rows={moduleRows[module] ?? []} />
    </div>
  );
}
