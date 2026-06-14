"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit3, Plus, Trash2, UserRound } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ContractType, Employee, EmployeeStatus, TenantScope } from "@/lib/types";

type EmployeeForm = Omit<Employee, "id" | "companyId">;

const emptyEmployee: EmployeeForm = {
  photoUrl: "",
  firstName: "",
  lastName: "",
  cin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  birthDate: "",
  hireDate: new Date().toISOString().slice(0, 10),
  position: "",
  department: "",
  contractType: "CDI",
  baseSalary: 0,
  status: "actif"
};

export function HrEmployeesModule({ initialEmployees, scope }: { initialEmployees: Employee[]; scope: TenantScope }) {
  const [employees, setEmployees] = useState(initialEmployees.filter((employee) => employee.companyId === scope.companyId));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tous");
  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const canWrite = scope.role !== "READ_ONLY";

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery = [employee.firstName, employee.lastName, employee.cin, employee.phone, employee.email, employee.position, employee.department]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return matchesQuery && (status === "Tous" || employee.status === status);
    });
  }, [employees, query, status]);

  function openCreate() {
    setEditing(null);
    setForm(emptyEmployee);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({ ...employee });
  }

  function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !canWrite) return;
    if (editing) {
      setEmployees((current) => current.map((employee) => employee.id === editing.id ? { ...editing, ...form } : employee));
    } else {
      setEmployees((current) => [{ id: `emp-${Date.now()}`, companyId: scope.companyId, ...form }, ...current]);
    }
    setForm(null);
    setEditing(null);
  }

  function confirmDelete() {
    if (!deleteTarget || !canWrite) return;
    setEmployees((current) => current.filter((employee) => employee.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-[1fr_180px]">
            <SearchBar value={query} onChange={setQuery} placeholder="Rechercher employé, CIN, poste..." />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {["Tous", "actif", "suspendu", "quitté"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <button type="button" disabled={!canWrite} onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            <Plus size={18} />
            Ajouter employé
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={UserRound} title="Aucun employé" description="Aucun employé ne correspond aux critères sélectionnés." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse text-sm">
              <thead>
                <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                  {["Photo", "Employé", "CIN", "Contact", "Entrée", "Poste", "Département", "Contrat", "Salaire", "Statut", "Actions"].map((column) => (
                    <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4">
                      <div className="grid size-12 place-items-center rounded-lg bg-hicotech-sky text-hicotech-blue dark:bg-hicotech-blue/20">
                        {employee.photoUrl ? <span className="text-xs font-bold">IMG</span> : <UserRound size={22} />}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-hicotech-navy dark:text-white">{employee.firstName} {employee.lastName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{formatDate(employee.birthDate)} - {employee.city}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{employee.cin}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200"><p>{employee.phone}</p><p>{employee.email}</p></td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{formatDate(employee.hireDate)}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{employee.position}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{employee.department}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{employee.contractType}</td>
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{formatCurrency(employee.baseSalary)}</td>
                    <td className="px-4 py-4"><Status value={employee.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(employee)} disabled={!canWrite} />
                        <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(employee)} danger disabled={!canWrite} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {form && (
        <FormModal title={editing ? "Modifier employé" : "Ajouter employé"} onClose={() => setForm(null)} onSubmit={saveEmployee}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Photo employé" value={form.photoUrl} onChange={(value) => setForm({ ...form, photoUrl: value })} />
            <Field label="CIN" value={form.cin} onChange={(value) => setForm({ ...form, cin: value })} required />
            <Field label="Nom" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} required />
            <Field label="Prénom" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required />
            <Field label="Téléphone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="Adresse" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
            <Field label="Ville" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
            <Field label="Date de naissance" type="date" value={form.birthDate} onChange={(value) => setForm({ ...form, birthDate: value })} />
            <Field label="Date d'entrée" type="date" value={form.hireDate} onChange={(value) => setForm({ ...form, hireDate: value })} />
            <Field label="Poste" value={form.position} onChange={(value) => setForm({ ...form, position: value })} required />
            <Field label="Département" value={form.department} onChange={(value) => setForm({ ...form, department: value })} />
            <Select label="Type de contrat" value={form.contractType} options={["CDI", "CDD", "stage", "freelance"]} onChange={(value) => setForm({ ...form, contractType: value as ContractType })} />
            <Field label="Salaire de base" type="number" value={form.baseSalary} onChange={(value) => setForm({ ...form, baseSalary: Number(value) })} />
            <Select label="Statut" value={form.status} options={["actif", "suspendu", "quitté"]} onChange={(value) => setForm({ ...form, status: value as EmployeeStatus })} />
          </div>
        </FormModal>
      )}

      {deleteTarget && <ConfirmDeleteDialog title="Supprimer cet employé ?" description="Cette action retire l'employé de la liste locale." onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

function Status({ value }: { value: EmployeeStatus }) {
  const cls = value === "actif" ? "bg-emerald-50 text-hicotech-green" : value === "suspendu" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-hicotech-red";
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${cls}`}>{value}</span>;
}

function Action({ label, icon, danger, disabled, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold disabled:opacity-40 ${danger ? "border-red-200 text-hicotech-red" : "border-slate-200 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"}`}>{icon}{label}</button>;
}

function Field({ label, value, type = "text", required, onChange }: { label: string; value: string | number; type?: string; required?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
