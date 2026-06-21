"use client";

import { FormEvent, useMemo, useState } from "react";
import { Download, Edit3, FileText, Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { activeCompanyProfile } from "@/lib/demo-data";
import { createHrReportPdf, createPayslipPdf } from "@/lib/pdf";
import type { HrReportColumn, HrReportSection } from "@/components/pdf-templates/HrReportPdfTemplate";

export type HrField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
};

type HrRecord = {
  id: string;
  companyId: string;
  [key: string]: string | number | boolean;
};

export function HrRecordsModule({
  title,
  records,
  fields,
  columns,
  companyId,
  readOnly = false,
  emptyTitle,
  emptyDescription
}: {
  title: string;
  records: HrRecord[];
  fields: HrField[];
  columns: HrField[];
  companyId: string;
  readOnly?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [items, setItems] = useState(records.filter((record) => record.companyId === companyId));
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<HrRecord | null>(null);
  const [editing, setEditing] = useState<HrRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HrRecord | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return items.filter((item) => Object.values(item).join(" ").toLowerCase().includes(normalized));
  }, [items, query]);

  function openCreate() {
    const initial = fields.reduce<HrRecord>((record, field) => {
      record[field.key] = field.type === "number" ? 0 : field.options?.[0] ?? "";
      return record;
    }, { id: `hr-${Date.now()}`, companyId });
    setEditing(null);
    setForm(initial);
  }

  function openEdit(item: HrRecord) {
    setEditing(item);
    setForm({ ...item });
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || readOnly) return;
    if (editing) {
      setItems((current) => current.map((item) => item.id === editing.id ? form : item));
    } else {
      setItems((current) => [form, ...current]);
    }
    setForm(null);
    setEditing(null);
  }

  function remove() {
    if (!deleteTarget || readOnly) return;
    setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function exportCsv() {
    const rows = [columns.map((column) => column.label), ...items.map((item) => columns.map((column) => String(item[column.key] ?? "")))];
    const blob = new Blob([rows.map((row) => row.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function createRecordPdf(item: HrRecord) {
    if (title.toLowerCase().includes("salaire")) {
      createPayslipPdf({
        number: `PAIE-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        employeeName: String(item.employee ?? "Employé"),
        period: String(item.month ?? item.periode ?? "Mois courant"),
        baseSalary: toNumber(item.baseSalary),
        bonuses: toNumber(item.bonuses),
        advances: toNumber(item.advances),
        deductions: toNumber(item.deductions),
        unpaidAbsences: toNumber(item.unpaidAbsences),
        netSalary: toNumber(item.netSalary)
      }, activeCompanyProfile);
      return;
    }

    const section = getHrSection(title);
    const reportColumns = getReportColumns(section);
    const reportRows = (filtered.length > 0 ? filtered : [item]).map((record) => normalizeReportRow(section, record));

    createHrReportPdf({
      number: `RH-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      period: getReportPeriod(item),
      section,
      sectionLabel: title,
      summary: {
        activeEmployees: countUnique(items, "employee"),
        contracts: title.toLowerCase().includes("contrat") ? items.length : 0,
        monthlyAttendances: title.toLowerCase().includes("présence") || title.toLowerCase().includes("presence") ? items.length : 0,
        monthlyAbsences: title.toLowerCase().includes("absence") ? items.length : 0,
        pendingLeaves: items.filter((record) => String(record.status ?? "").toLowerCase() === "en attente").length,
        payrollMass: items.reduce((sum, record) => sum + toNumber(record.netSalary), 0)
      },
      columns: reportColumns,
      rows: reportRows
    }, activeCompanyProfile);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder={`Rechercher dans ${title.toLowerCase()}...`} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">
            <Download size={18} />
            Export
          </button>
          <button type="button" disabled={readOnly} onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                {columns.map((column) => <th key={column.key} className="px-4 py-3 font-display text-xs font-bold uppercase">{column.label}</th>)}
                <th className="px-4 py-3 font-display text-xs font-bold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                  {columns.map((column) => <td key={column.key} className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200">{String(item[column.key] ?? "-")}</td>)}
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(item)} disabled={readOnly} />
                      <Action label="PDF" icon={<FileText size={16} />} onClick={() => createRecordPdf(item)} />
                      <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(item)} danger disabled={readOnly} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <FormModal title={editing ? `Modifier ${title}` : `Ajouter ${title}`} onClose={() => setForm(null)} onSubmit={save}>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <Field key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm({ ...form, [field.key]: value })} />
            ))}
          </div>
        </FormModal>
      )}

      {deleteTarget && <ConfirmDeleteDialog title="Supprimer cet élément ?" description="Cette action retire l'élément de la liste locale." onCancel={() => setDeleteTarget(null)} onConfirm={remove} />}
    </section>
  );
}

function Field({ field, value, onChange }: { field: HrField; value: string | number | boolean; onChange: (value: string | number) => void }) {
  if (field.type === "select") {
    return (
      <label className="block">
        <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{field.label}</span>
        <select value={String(value)} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
          {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{field.label}</span>
      <input type={field.type ?? "text"} value={String(value)} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function getHrSection(title: string): HrReportSection {
  const normalized = title.toLowerCase();
  if (normalized.includes("contrat")) return "contrats";
  if (normalized.includes("présence") || normalized.includes("presence")) return "presences";
  if (normalized.includes("absence")) return "absences";
  if (normalized.includes("congé") || normalized.includes("conge")) return "conges";
  return "general";
}

function getReportColumns(section: HrReportSection): HrReportColumn[] {
  if (section === "contrats") {
    return [
      { key: "employee", label: "Employé", width: 35 },
      { key: "type", label: "Type de contrat", width: 25 },
      { key: "position", label: "Poste", width: 34 },
      { key: "startDate", label: "Date début", width: 24 },
      { key: "endDate", label: "Date fin", width: 24 },
      { key: "salary", label: "Salaire", width: 22, align: "right" },
      { key: "status", label: "Statut", width: 18 }
    ];
  }

  if (section === "presences") {
    return [
      { key: "employee", label: "Employé", width: 38 },
      { key: "date", label: "Date", width: 25 },
      { key: "checkIn", label: "Heure entrée", width: 25 },
      { key: "checkOut", label: "Heure sortie", width: 25 },
      { key: "lateMinutes", label: "Retard", width: 21, align: "right" },
      { key: "workedHours", label: "Heures travaillées", width: 30, align: "right" },
      { key: "status", label: "Statut", width: 18 }
    ];
  }

  if (section === "absences" || section === "conges") {
    return [
      { key: "employee", label: "Employé", width: 38 },
      { key: "startDate", label: "Date début", width: 27 },
      { key: "endDate", label: "Date fin", width: 27 },
      { key: "reason", label: "Motif", width: 48 },
      { key: "days", label: "Jours", width: 20, align: "right" },
      { key: "status", label: "Statut", width: 22 }
    ];
  }

  return [
    { key: "employee", label: "Employé", width: 42 },
    { key: "date", label: "Date", width: 28 },
    { key: "reason", label: "Motif", width: 62 },
    { key: "status", label: "Statut", width: 24 },
    { key: "value", label: "Valeur", width: 26, align: "right" }
  ];
}

function normalizeReportRow(section: HrReportSection, record: HrRecord): HrRecord {
  if (section === "contrats") {
    return {
      ...record,
      position: record.position ?? record.function ?? "-",
      status: record.status ?? "Actif"
    };
  }

  if (section === "presences") {
    return {
      ...record,
      status: record.status ?? (toNumber(record.lateMinutes) > 0 ? "Retard" : "Présent")
    };
  }

  return record;
}

function getReportPeriod(record: HrRecord) {
  return String(record.month ?? record.date ?? record.startDate ?? "Période courante");
}

function countUnique(records: HrRecord[], key: string) {
  return new Set(records.map((record) => String(record[key] ?? "")).filter(Boolean)).size;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Action({ label, icon, danger, disabled, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold disabled:opacity-40 ${danger ? "border-red-200 text-hicotech-red" : "border-slate-200 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"}`}>{icon}{label}</button>;
}
