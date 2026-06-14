"use client";

import { FormEvent, useMemo, useState } from "react";
import { Edit3, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { EmptyState } from "@/components/empty-state";
import { FormModal } from "@/components/form-modal";
import { SearchBar } from "@/components/search-bar";
import { allPermissionModules, rolePermissions } from "@/lib/rbac";
import type { AppUser, Role, UserStatus } from "@/lib/types";

type UserForm = {
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  password: string;
};

const roles: Role[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "SALES", "STOCK_MANAGER", "ACCOUNTANT", "HR", "READ_ONLY"];

export function UsersModule({ initialUsers, companyId }: { initialUsers: AppUser[]; companyId: string }) {
  const [users, setUsers] = useState(initialUsers.filter((user) => user.companyId === companyId || user.role === "SUPER_ADMIN"));
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<UserForm | null>(null);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return users.filter((user) => [user.name, user.email, user.role, user.status].join(" ").toLowerCase().includes(normalized));
  }, [query, users]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", role: "SALES", status: "active", password: "" });
  }

  function openEdit(user: AppUser) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status, password: "" });
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const passwordHash = form.password ? await hashPasswordClient(form.password) : editing?.passwordHash ?? "";
    const payload: AppUser = {
      id: editing?.id ?? `user-${Date.now()}`,
      companyId: form.role === "SUPER_ADMIN" ? null : companyId,
      name: form.name,
      email: form.email.toLowerCase().trim(),
      role: form.role,
      status: form.status,
      passwordHash
    };
    setUsers((current) => editing ? current.map((user) => user.id === editing.id ? payload : user) : [payload, ...current]);
    setEditing(null);
    setForm(null);
  }

  function disableUser(user: AppUser) {
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: "disabled" } : item));
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setUsers((current) => current.filter((user) => user.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-hicotech-dark-border lg:flex-row lg:items-center lg:justify-between">
          <SearchBar value={query} onChange={setQuery} placeholder="Rechercher nom, email, rôle..." />
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">
            <Plus size={18} />
            Créer utilisateur
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ShieldCheck} title="Aucun utilisateur" description="Aucun utilisateur ne correspond aux critères." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
              <thead>
                <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                  {["Nom", "Email", "Rôle", "Statut", "Permissions", "Actions"].map((column) => <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{user.name}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{user.email}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{user.role}</td>
                    <td className="px-4 py-4"><Status value={user.status} /></td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-300">{permissionSummary(user.role)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Action label="Modifier" icon={<Edit3 size={16} />} onClick={() => openEdit(user)} />
                        <Action label="Désactiver" icon={<KeyRound size={16} />} onClick={() => disableUser(user)} />
                        <Action label="Supprimer" icon={<Trash2 size={16} />} onClick={() => setDeleteTarget(user)} danger />
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
        <FormModal title={editing ? "Modifier utilisateur" : "Créer utilisateur"} onClose={() => setForm(null)} onSubmit={saveUser}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nom" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Select label="Rôle" value={form.role} options={roles} onChange={(value) => setForm({ ...form, role: value as Role })} />
            <Select label="Statut" value={form.status} options={["active", "disabled"]} onChange={(value) => setForm({ ...form, status: value as UserStatus })} />
            <Field label={editing ? "Nouveau mot de passe" : "Mot de passe"} type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={!editing} />
          </div>
        </FormModal>
      )}

      {deleteTarget && <ConfirmDeleteDialog title="Supprimer cet utilisateur ?" description="Cette action retire l'utilisateur de la liste locale." onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

function permissionSummary(role: Role) {
  const modules = allPermissionModules.filter((module) => rolePermissions[role][module]?.includes("view"));
  return `${modules.length} module(s) autorisé(s)`;
}

async function hashPasswordClient(password: string) {
  const data = new TextEncoder().encode(`hicotech:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function Status({ value }: { value: UserStatus }) {
  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${value === "active" ? "bg-emerald-50 text-hicotech-green" : "bg-red-50 text-hicotech-red"}`}>{value}</span>;
}

function Action({ label, icon, danger, onClick }: { label: string; icon: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold ${danger ? "border-red-200 text-hicotech-red" : "border-slate-200 text-hicotech-navy dark:border-hicotech-dark-border dark:text-white"}`}>{icon}{label}</button>;
}

function Field({ label, value, type = "text", required, onChange }: { label: string; value: string; type?: string; required?: boolean; onChange: (value: string) => void }) {
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
