"use client";

import { CompanyService } from "@/modules/crm/companies";
import { CRM_COMPANIES_WORKSPACE_ID, crmCompanySeed } from "@/modules/crm/companies/ui/companies.seed";
import { OpportunityService } from "@/modules/crm/opportunities";
import { crmOpportunitySeed } from "@/modules/crm/opportunities/ui/opportunities.seed";
import { EntityDialog, FormActions, FormSection } from "@/ui";
import { SALES_QUOTES_WORKSPACE_ID } from "../quotes.seed";

const companyService = new CompanyService({ seed: crmCompanySeed });
const opportunityService = new OpportunityService({ seed: crmOpportunitySeed });
const companies = companyService.listCompanies({ workspaceId: CRM_COMPANIES_WORKSPACE_ID }).companies;
const opportunities = opportunityService.listOpportunities({ workspaceId: SALES_QUOTES_WORKSPACE_ID }).opportunities;

export function QuoteDialog({ onClose, onSubmit, open }: { onClose: () => void; onSubmit: () => void; open: boolean }) {
  return (
    <EntityDialog
      eyebrow="Ventes"
      title="Créer un devis"
      description="Structure du futur formulaire complet. La création utilise actuellement des données de démonstration en mémoire."
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      footer={<FormActions onCancel={onClose} submitLabel="Créer un devis" />}
    >
      <div className="mt-5 space-y-3">
        <FormSection title="Contexte commercial" description="Le devis de démonstration garde les mêmes données, mais présente clairement son origine.">
          <PreviewField label="Client" value={companies[0]?.displayName ?? "Client à sélectionner"} />
          <PreviewField label="Société" value={companies[0]?.displayName ?? "Société à sélectionner"} />
          <PreviewField label="Opportunité" value={opportunities[0]?.title ?? "Opportunité optionnelle"} />
          <PreviewField label="Validité" value="30 jours" />
        </FormSection>

        <FormSection title="Conditions financières" description="Paramètres préremplis par le flux actuel de création.">
          <PreviewField label="Devise" value="MAD" />
          <PreviewField label="Remise" value="2%" />
          <PreviewField label="Taxe" value="TVA 20%" />
          <PreviewField label="Notes" value="Notes internes préparées" />
        </FormSection>
      </div>
    </EntityDialog>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-bold text-hicotech-navy dark:text-white">{value}</p>
    </div>
  );
}
