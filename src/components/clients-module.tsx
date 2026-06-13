"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, Edit3, Eye, FileText, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { clsx } from "clsx";
import type { BusinessClient, ClientDocument } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";

type ClientFormState = Omit<BusinessClient, "id">;

const emptyClient: ClientFormState = {
  name: "",
  company: "",
  ice: "",
  taxId: "",
  rc: "",
  phone: "",
  email: "",
  address: "",
  city: ""
};

export function ClientsModule({
  initialClients,
  initialDocuments
}: {
  initialClients: BusinessClient[];
  initialDocuments: ClientDocument[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [documents] = useState(initialDocuments);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Toutes");
  const [editingClient, setEditingClient] = useState<BusinessClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<BusinessClient | null>(null);
  const [clientForm, setClientForm] = useState<ClientFormState | null>(null);

  const cities = useMemo(() => ["Toutes", ...Array.from(new Set(clients.map((client) => client.city)))], [clients]);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return clients.filter((client) => {
      const matchesQuery = [
        client.name,
        client.company,
        client.ice,
        client.taxId,
        client.rc,
        client.phone,
        client.email,
        client.address,
        client.city
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesCity = city === "Toutes" || client.city === city;

      return matchesQuery && matchesCity;
    });
  }, [city, clients, query]);

  const totals = useMemo(() => {
    const invoices = documents.filter((document) => document.type === "Facture");
    const sold = invoices.reduce((sum, document) => sum + document.total, 0);
    const paid = invoices.reduce((sum, document) => sum + document.paid, 0);

    return {
      clients: clients.length,
      quotes: documents.filter((document) => document.type === "Devis").length,
      invoices: invoices.length,
      sold,
      paid,
      outstanding: sold - paid
    };
  }, [clients.length, documents]);

  function getClientStats(clientId: string) {
    const clientDocs = documents.filter((document) => document.clientId === clientId);
    const quotes = clientDocs.filter((document) => document.type === "Devis");
    const invoices = clientDocs.filter((document) => document.type === "Facture");
    const sold = invoices.reduce((sum, document) => sum + document.total, 0);
    const paid = invoices.reduce((sum, document) => sum + document.paid, 0);

    return {
      docs: clientDocs,
      quotes: quotes.length,
      invoices: invoices.length,
      sold,
      paid,
      outstanding: sold - paid
    };
  }

  function openCreateClient() {
    setEditingClient(null);
    setClientForm(emptyClient);
  }

  function openEditClient(client: BusinessClient) {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      company: client.company,
      ice: client.ice,
      taxId: client.taxId,
      rc: client.rc,
      phone: client.phone,
      email: client.email,
      address: client.address,
      city: client.city
    });
  }

  function closeForm() {
    setEditingClient(null);
    setClientForm(null);
  }

  function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientForm) return;

    if (editingClient) {
      setClients((current) =>
        current.map((client) => (client.id === editingClient.id ? { ...editingClient, ...clientForm } : client))
      );
      setSelectedClient((current) =>
        current?.id === editingClient.id ? { ...editingClient, ...clientForm } : current
      );
    } else {
      setClients((current) => [{ id: `client-${Date.now()}`, ...clientForm }, ...current]);
    }
    closeForm();
  }

  function deleteClient(clientId: string) {
    setClients((current) => current.filter((client) => client.id !== clientId));
    setSelectedClient((current) => (current?.id === clientId ? null : current));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Clients" value={totals.clients.toString()} />
        <MetricCard label="Devis" value={totals.quotes.toString()} />
        <MetricCard label="Factures" value={totals.invoices.toString()} />
        <MetricCard label="Total vendu" value={formatCurrency(totals.sold)} />
        <MetricCard label="Total encaissé" value={formatCurrency(totals.paid)} />
        <MetricCard label="Reste à encaisser" value={formatCurrency(totals.outstanding)} warning />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 md:grid-cols-[1fr_180px] lg:flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50">
              <Search size={18} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none dark:text-white dark:placeholder:text-slate-400"
                placeholder="Rechercher nom, société, ICE, IF, RC, téléphone..."
              />
            </div>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            >
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={openCreateClient}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Ajouter client
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {["Client", "ICE / IF / RC", "Contact", "Ville", "Devis", "Factures", "Vendu", "Encaissé", "Reste", "Actions"].map((column) => (
                  <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const stats = getClientStats(client.id);

                return (
                  <tr key={client.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4">
                      <p className="font-bold text-hicotech-navy dark:text-white">{client.company}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{client.name}</p>
                      <p className="mt-1 max-w-64 text-xs text-slate-500 dark:text-slate-300">{client.address}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <p>ICE : {client.ice}</p>
                      <p>IF : {client.taxId}</p>
                      <p>RC : {client.rc}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <p>{client.phone}</p>
                      <p>{client.email}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{client.city}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{stats.quotes}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{stats.invoices}</td>
                    <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatCurrency(stats.sold)}</td>
                    <td className="px-4 py-4 font-medium text-hicotech-green">{formatCurrency(stats.paid)}</td>
                    <td className={clsx("px-4 py-4 font-bold", stats.outstanding > 0 ? "text-hicotech-red" : "text-hicotech-green")}>
                      {formatCurrency(stats.outstanding)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ClientAction label="Historique" icon={<Eye size={16} />} onClick={() => setSelectedClient(client)} />
                        <ClientAction label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEditClient(client)} />
                        <ClientAction label="Supprimer" icon={<Trash2 size={16} />} onClick={() => deleteClient(client.id)} danger />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedClient && (
        <ClientHistory client={selectedClient} documents={getClientStats(selectedClient.id).docs} onClose={() => setSelectedClient(null)} />
      )}

      {clientForm && (
        <ClientModal
          title={editingClient ? "Modifier client" : "Ajouter client"}
          form={clientForm}
          onChange={setClientForm}
          onClose={closeForm}
          onSubmit={saveClient}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-2 font-display text-xl font-bold", warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>
        {value}
      </p>
    </article>
  );
}

function ClientAction({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition",
        danger
          ? "border-red-200 text-hicotech-red hover:bg-red-50"
          : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ClientHistory({ client, documents, onClose }: { client: BusinessClient; documents: ClientDocument[]; onClose: () => void }) {
  const quotes = documents.filter((document) => document.type === "Devis").length;
  const invoices = documents.filter((document) => document.type === "Facture");
  const sold = invoices.reduce((sum, document) => sum + document.total, 0);
  const paid = invoices.reduce((sum, document) => sum + document.paid, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-dark-page/60">
            <Building2 size={22} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{client.company}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{client.name} - {client.city}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
          Fermer
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <MetricCard label="Devis" value={quotes.toString()} />
        <MetricCard label="Factures" value={invoices.length.toString()} />
        <MetricCard label="Vendu" value={formatCurrency(sold)} />
        <MetricCard label="Encaissé" value={formatCurrency(paid)} />
        <MetricCard label="Reste" value={formatCurrency(sold - paid)} warning={sold - paid > 0} />
      </div>

      <div className="mt-5 space-y-3">
        {documents.length === 0 && (
          <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-hicotech-dark-border dark:text-slate-300">
            Aucun devis ou facture pour ce client.
          </p>
        )}
        {documents.map((document) => (
          <div key={document.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/40 md:grid-cols-[110px_1fr_130px_130px_130px]">
            <span className="font-bold text-hicotech-navy dark:text-white">{formatDate(document.date)}</span>
            <div className="flex items-center gap-2">
              {document.type === "Facture" ? <Receipt size={17} className="text-hicotech-blue" /> : <FileText size={17} className="text-hicotech-blue" />}
              <span className="font-bold text-hicotech-navy dark:text-white">{document.number}</span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{document.status}</span>
            <span className="font-bold text-hicotech-navy dark:text-white">{formatCurrency(document.total)}</span>
            <span className={document.total - document.paid > 0 ? "font-bold text-hicotech-red" : "font-bold text-hicotech-green"}>
              Reste {formatCurrency(document.total - document.paid)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ClientModal({
  title,
  form,
  onChange,
  onClose,
  onSubmit
}: {
  title: string;
  form: ClientFormState;
  onChange: (form: ClientFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function update<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ClientField label="Nom" value={form.name} onChange={(value) => update("name", value)} required />
          <ClientField label="Société" value={form.company} onChange={(value) => update("company", value)} required />
          <ClientField label="ICE" value={form.ice} onChange={(value) => update("ice", value)} />
          <ClientField label="IF" value={form.taxId} onChange={(value) => update("taxId", value)} />
          <ClientField label="RC" value={form.rc} onChange={(value) => update("rc", value)} />
          <ClientField label="Téléphone" value={form.phone} onChange={(value) => update("phone", value)} />
          <ClientField label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
          <ClientField label="Ville" value={form.city} onChange={(value) => update("city", value)} />
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Adresse</span>
            <textarea
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            />
          </label>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

function ClientField({
  label,
  value,
  type = "text",
  required,
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
      />
    </label>
  );
}
