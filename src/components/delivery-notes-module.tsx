"use client";

import { FormEvent, useMemo, useState } from "react";
import { clsx } from "clsx";
import { Edit3, Eye, FileText, FileUp, Plus, Printer, Receipt, Trash2, Truck, X } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { Filters } from "@/components/filters";
import { SearchBar } from "@/components/search-bar";
import { formatDate } from "@/lib/format";
import { createDeliveryNotePdf } from "@/lib/pdf";
import { activeCompanyProfile } from "@/lib/demo-data";
import type {
  BusinessClient,
  DeliveryNote,
  DeliveryNoteLine,
  DeliveryNoteStatus,
  StockProduct,
  TenantScope
} from "@/lib/types";

type DeliveryFormState = Omit<DeliveryNote, "id" | "companyId">;

const pageSize = 5;
const statuses: DeliveryNoteStatus[] = ["Brouillon", "Validé", "Livré", "Annulé"];
const units = ["Pièce", "Unité", "Lot", "Service", "Mètre"];

export function DeliveryNotesModule({
  initialDeliveryNotes,
  clients,
  products,
  scope
}: {
  initialDeliveryNotes: DeliveryNote[];
  clients: BusinessClient[];
  products: StockProduct[];
  scope: TenantScope;
}) {
  const [deliveryNotes, setDeliveryNotes] = useState(initialDeliveryNotes.filter((note) => note.companyId === scope.companyId));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<DeliveryFormState | null>(null);
  const [editingNote, setEditingNote] = useState<DeliveryNote | null>(null);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryNote | null>(null);
  const [message, setMessage] = useState("");
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const canWrite = scope.role !== "READ_ONLY";

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return deliveryNotes.filter((note) => {
      const client = getClient(note.clientId, clients);
      const matchesQuery = [
        note.number,
        note.internalReference,
        note.status,
        client?.name ?? "",
        client?.company ?? "",
        note.lines.map((line) => `${line.reference} ${line.designation}`).join(" ")
      ].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "Tous" || note.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clients, deliveryNotes, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / pageSize));
  const visibleNotes = filteredNotes.slice((page - 1) * pageSize, page * pageSize);
  const totalDelivered = deliveryNotes.reduce((sum, note) => sum + getDeliveredQuantity(note), 0);
  const deliveredNotes = deliveryNotes.filter((note) => note.status === "Livré").length;

  function openCreate() {
    const client = clients[0];
    setEditingNote(null);
    setForm({
      number: nextDeliveryNumber(deliveryNotes.length + 1),
      date: new Date().toISOString().slice(0, 10),
      status: "Brouillon",
      internalReference: "",
      clientId: client?.id ?? "",
      deliveryAddress: client?.address ?? "",
      city: client?.city ?? "",
      lines: [createLine(products[0])],
      deliveryTerms: "",
      internalNotes: ""
    });
  }

  function openEdit(note: DeliveryNote) {
    setEditingNote(note);
    setForm({
      number: note.number,
      date: note.date,
      status: note.status,
      internalReference: note.internalReference,
      clientId: note.clientId,
      deliveryAddress: note.deliveryAddress,
      city: note.city,
      lines: note.lines,
      deliveryTerms: note.deliveryTerms,
      internalNotes: note.internalNotes
    });
  }

  function saveForm(status?: DeliveryNoteStatus) {
    if (!form || !canWrite) return;
    const notePayload = { ...form, status: status ?? form.status };
    if (editingNote) {
      setDeliveryNotes((current) => current.map((note) => note.id === editingNote.id ? { ...editingNote, ...notePayload } : note));
      setSelectedNote((current) => current?.id === editingNote.id ? { ...editingNote, ...notePayload } : current);
    } else {
      setDeliveryNotes((current) => [{ id: `delivery-${Date.now()}`, companyId: scope.companyId, ...notePayload }, ...current]);
    }
    setMessage(status === "Validé" ? "Bon de livraison validé." : "Brouillon enregistré.");
    setPage(1);
    setForm(null);
    setEditingNote(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveForm();
  }

  function confirmDelete() {
    if (!deleteTarget || !canWrite) return;
    setDeliveryNotes((current) => current.filter((note) => note.id !== deleteTarget.id));
    setSelectedNote((current) => current?.id === deleteTarget.id ? null : current);
    setDeleteTarget(null);
  }

  function updateClient(clientId: string) {
    if (!form) return;
    const client = getClient(clientId, clients);
    setForm({
      ...form,
      clientId,
      deliveryAddress: client?.address ?? "",
      city: client?.city ?? ""
    });
  }

  function updateLine(lineId: string, patch: Partial<DeliveryNoteLine>) {
    if (!form) return;
    setForm({ ...form, lines: form.lines.map((line) => line.id === lineId ? { ...line, ...patch } : line) });
  }

  function updateLineProduct(lineId: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    updateLine(lineId, {
      productId,
      reference: product?.reference ?? "",
      designation: product?.designation ?? ""
    });
  }

  function createPdf(note: DeliveryNote, mode: "save" | "print" = "save") {
    const client = getClient(note.clientId, clients);
    if (!client) return;
    createDeliveryNotePdf(note, client, activeCompanyProfile, mode);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Bons de livraison" value={deliveryNotes.length.toString()} />
        <Metric label="BL livrés" value={deliveredNotes.toString()} />
        <Metric label="Quantité livrée" value={totalDelivered.toString()} />
        <Metric label="Brouillons" value={deliveryNotes.filter((note) => note.status === "Brouillon").length.toString()} warning />
      </div>

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-hicotech-green dark:border-emerald-900/40 dark:bg-emerald-950/20">
          {message}
        </p>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 lg:grid-cols-[1fr_190px] xl:flex-1">
            <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Rechercher BL, client, référence, produit..." />
            <Filters filters={[{ label: "Statut", value: statusFilter, options: ["Tous", ...statuses].map((status) => ({ label: status, value: status })), onChange: (value) => { setStatusFilter(value); setPage(1); } }]} />
          </div>
          <button type="button" disabled={!canWrite} onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus size={18} />
            Nouveau BL
          </button>
        </div>

        {loading && <StateLine text="Chargement des bons de livraison..." />}
        {error && <StateLine text={error} danger />}
        {!loading && !error && filteredNotes.length === 0 && (
          <div className="p-5">
            <EmptyState icon={Truck} title="Aucun bon de livraison" description="Aucun bon de livraison ne correspond aux critères sélectionnés." />
          </div>
        )}

        {filteredNotes.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-sm">
                <thead>
                  <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                    {["Numéro BL", "Date", "Client", "Statut", "Articles", "Quantité livrée", "Référence", "Actions"].map((column) => (
                      <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleNotes.map((note) => {
                    const client = getClient(note.clientId, clients);
                    return (
                      <tr key={note.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{note.number}</td>
                        <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{formatDate(note.date)}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-hicotech-navy dark:text-white">{client?.company ?? "Client supprimé"}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{client?.name} - {client?.phone}</p>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={note.status} /></td>
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{note.lines.length}</td>
                        <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{getDeliveredQuantity(note)}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{note.internalReference || "-"}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Action label="Voir" icon={<Eye size={16} />} onClick={() => setSelectedNote(note)} />
                            <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(note)} disabled={!canWrite} />
                            <Action label="PDF" icon={<FileUp size={16} />} onClick={() => createPdf(note)} />
                            <Action label="Imprimer" icon={<Printer size={16} />} onClick={() => createPdf(note, "print")} />
                            <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(note)} danger disabled={!canWrite} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} total={filteredNotes.length} onPageChange={setPage} />
          </>
        )}
      </section>

      {selectedNote && (
        <DeliveryDetails
          note={selectedNote}
          client={getClient(selectedNote.clientId, clients)}
          onClose={() => setSelectedNote(null)}
          onPdf={() => createPdf(selectedNote)}
          onPrint={() => createPdf(selectedNote, "print")}
          onConvert={() => setMessage(`Le bon ${selectedNote.number} est prêt à convertir en facture.`)}
        />
      )}

      {form && (
        <DeliveryFormModal
          form={form}
          clients={clients}
          products={products}
          title={editingNote ? "Modifier bon de livraison" : "Nouveau bon de livraison"}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
          onSaveDraft={() => saveForm("Brouillon")}
          onValidate={() => saveForm("Validé")}
          onPdf={() => {
            const client = getClient(form.clientId, clients);
            if (client) createDeliveryNotePdf({ id: editingNote?.id ?? "draft", companyId: scope.companyId, ...form }, client, activeCompanyProfile);
          }}
          onPrint={() => {
            const client = getClient(form.clientId, clients);
            if (client) createDeliveryNotePdf({ id: editingNote?.id ?? "draft", companyId: scope.companyId, ...form }, client, activeCompanyProfile, "print");
          }}
          onConvert={() => setMessage(`Le bon ${form.number} est prêt à convertir en facture.`)}
          onFormChange={setForm}
          onClientChange={updateClient}
          onLineChange={updateLine}
          onLineProductChange={updateLineProduct}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Supprimer ce bon de livraison ?"
          description="Cette action retire le bon de livraison de la liste locale."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function DeliveryFormModal({
  title,
  form,
  clients,
  products,
  onSubmit,
  onClose,
  onSaveDraft,
  onValidate,
  onPdf,
  onPrint,
  onConvert,
  onFormChange,
  onClientChange,
  onLineChange,
  onLineProductChange
}: {
  title: string;
  form: DeliveryFormState;
  clients: BusinessClient[];
  products: StockProduct[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onValidate: () => void;
  onPdf: () => void;
  onPrint: () => void;
  onConvert: () => void;
  onFormChange: (form: DeliveryFormState) => void;
  onClientChange: (clientId: string) => void;
  onLineChange: (lineId: string, patch: Partial<DeliveryNoteLine>) => void;
  onLineProductChange: (lineId: string, productId: string) => void;
}) {
  const client = getClient(form.clientId, clients);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">Bons de livraison</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <FormSection title="Informations générales">
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Numéro BL automatique" value={form.number} onChange={(value) => onFormChange({ ...form, number: value })} required />
            <Field label="Date du bon de livraison" type="date" value={form.date} onChange={(value) => onFormChange({ ...form, date: value })} required />
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Statut</span>
              <select value={form.status} onChange={(event) => onFormChange({ ...form, status: event.target.value as DeliveryNoteStatus })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <Field label="Référence interne" value={form.internalReference} onChange={(value) => onFormChange({ ...form, internalReference: value })} />
          </div>
        </FormSection>

        <FormSection title="Client">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Sélection du client existant</span>
              <select value={form.clientId} onChange={(event) => onClientChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                {clients.map((item) => <option key={item.id} value={item.id}>{item.company}</option>)}
              </select>
            </label>
            <ReadOnly label="Nom client" value={client?.name ?? ""} />
            <ReadOnly label="Société" value={client?.company ?? ""} />
            <ReadOnly label="Téléphone" value={client?.phone ?? ""} />
            <Field label="Adresse de livraison" value={form.deliveryAddress} onChange={(value) => onFormChange({ ...form, deliveryAddress: value })} />
            <Field label="Ville" value={form.city} onChange={(value) => onFormChange({ ...form, city: value })} />
          </div>
        </FormSection>

        <FormSection title="Produits livrés">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-hicotech-dark-border">
            <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                  {["Produit / service", "Référence", "Désignation", "Qté commandée", "Qté livrée", "Unité", "Observations", ""].map((column) => (
                    <th key={column} className="px-3 py-3 font-display text-xs font-bold uppercase">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-3 py-3">
                      <select value={line.productId} onChange={(event) => onLineProductChange(line.id, event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                        {products.map((product) => <option key={product.id} value={product.id}>{product.designation}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3"><input value={line.reference} onChange={(event) => onLineChange(line.id, { reference: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3"><input value={line.designation} onChange={(event) => onLineChange(line.id, { designation: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3"><input type="number" min={0} value={line.orderedQuantity} onChange={(event) => onLineChange(line.id, { orderedQuantity: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3"><input type="number" min={0} value={line.deliveredQuantity} onChange={(event) => onLineChange(line.id, { deliveredQuantity: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3">
                      <select value={line.unit} onChange={(event) => onLineChange(line.id, { unit: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
                        {units.map((unit) => <option key={unit}>{unit}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3"><input value={line.observations} onChange={(event) => onLineChange(line.id, { observations: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" /></td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => onFormChange({ ...form, lines: form.lines.filter((item) => item.id !== line.id) })} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-hicotech-red">Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => onFormChange({ ...form, lines: [...form.lines, createLine(products[0])] })} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            <Plus size={16} />
            Ajouter une ligne
          </button>
        </FormSection>

        <FormSection title="Totaux / résumé">
          <div className="grid gap-4 md:grid-cols-2">
            <Metric label="Nombre total articles" value={form.lines.length.toString()} />
            <Metric label="Quantité totale livrée" value={form.lines.reduce((sum, line) => sum + line.deliveredQuantity, 0).toString()} />
          </div>
        </FormSection>

        <FormSection title="Notes">
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="Conditions de livraison" value={form.deliveryTerms} onChange={(value) => onFormChange({ ...form, deliveryTerms: value })} />
            <TextArea label="Observations internes" value={form.internalNotes} onChange={(value) => onFormChange({ ...form, internalNotes: value })} />
          </div>
        </FormSection>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Annuler</button>
          <button type="button" onClick={onSaveDraft} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"><FileText size={18} /> Enregistrer brouillon</button>
          <button type="button" onClick={onValidate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white"><Truck size={18} /> Valider le bon</button>
          <button type="button" onClick={onPdf} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"><FileUp size={18} /> Générer PDF</button>
          <button type="button" onClick={onPrint} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"><Printer size={18} /> Imprimer</button>
          <button type="button" onClick={onConvert} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-navy px-4 py-2.5 text-sm font-bold text-white dark:bg-hicotech-blue"><Receipt size={18} /> Convertir en facture</button>
        </div>
      </form>
    </div>
  );
}

function DeliveryDetails({
  note,
  client,
  onClose,
  onPdf,
  onPrint,
  onConvert
}: {
  note: DeliveryNote;
  client?: BusinessClient;
  onClose: () => void;
  onPdf: () => void;
  onPrint: () => void;
  onConvert: () => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{note.number}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{client?.company} - {formatDate(note.date)} - {note.internalReference || "Sans référence"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Action label="PDF" icon={<FileUp size={16} />} onClick={onPdf} />
          <Action label="Imprimer" icon={<Printer size={16} />} onClick={onPrint} />
          <Action label="Convertir" icon={<Receipt size={16} />} onClick={onConvert} />
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Fermer</button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Metric label="Statut" value={note.status} />
        <Metric label="Articles" value={note.lines.length.toString()} />
        <Metric label="Quantité livrée" value={getDeliveredQuantity(note).toString()} />
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
              {["Référence", "Désignation", "Commandée", "Livrée", "Unité", "Observations"].map((column) => <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {note.lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{line.reference}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.designation}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.orderedQuantity}</td>
                <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{line.deliveredQuantity}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.unit}</td>
                <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{line.observations || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function nextDeliveryNumber(index: number) {
  return `BL-2026-${String(index + 46).padStart(6, "0")}`;
}

function createLine(product?: StockProduct): DeliveryNoteLine {
  return {
    id: `dll-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: product?.id ?? "",
    reference: product?.reference ?? "",
    designation: product?.designation ?? "",
    orderedQuantity: 1,
    deliveredQuantity: 1,
    unit: "Pièce",
    observations: ""
  };
}

function getClient(clientId: string, clients: BusinessClient[]) {
  return clients.find((client) => client.id === clientId);
}

function getDeliveredQuantity(note: Pick<DeliveryNote, "lines">) {
  return note.lines.reduce((sum, line) => sum + line.deliveredQuantity, 0);
}

function Metric({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</p>
      <p className={clsx("mt-2 font-display text-2xl font-bold", warning ? "text-hicotech-red" : "text-hicotech-navy dark:text-white")}>{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: DeliveryNoteStatus }) {
  return (
    <span className={clsx("rounded-md px-2 py-1 text-xs font-bold", status === "Livré" ? "bg-emerald-50 text-hicotech-green" : status === "Annulé" ? "bg-red-50 text-hicotech-red" : "bg-blue-50 text-hicotech-blue")}>{status}</span>
  );
}

function StateLine({ text, danger }: { text: string; danger?: boolean }) {
  return <p className={clsx("p-5 text-sm font-semibold", danger ? "text-hicotech-red" : "text-slate-500 dark:text-slate-300")}>{text}</p>;
}

function Action({ label, icon, danger, disabled, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={clsx("inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40", danger ? "border-red-200 text-hicotech-red hover:bg-red-50" : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20")}>
      {icon}
      {label}
    </button>
  );
}

function Pagination({ page, totalPages, total, onPageChange }: { page: number; totalPages: number; total: number; onPageChange: (page: number) => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm dark:border-hicotech-dark-border md:flex-row md:items-center md:justify-between">
      <p className="text-slate-500 dark:text-slate-300">{total} résultat(s)</p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Précédent</button>
        <span className="font-bold text-hicotech-navy dark:text-white">{page} / {totalPages}</span>
        <button type="button" disabled={page === totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40 dark:border-hicotech-dark-border">Suivant</button>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/30">
      <h3 className="font-display text-lg font-bold text-hicotech-navy dark:text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value, type = "text", required, onChange }: { label: string; value: string | number; type?: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input value={value} readOnly className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}
