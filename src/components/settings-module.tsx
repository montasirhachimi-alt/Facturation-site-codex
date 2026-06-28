"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Download, Eye, Hash, KeyRound, Plus, Printer, Save, Trash2, Users, X } from "lucide-react";
import { activeCompanyId, activeCompanyProfile, demoUsers } from "@/lib/demo-data";
import type { AppUser, CompanyProfile, Role } from "@/lib/types";

type NumberingSettings = {
  quotePrefix: string;
  invoicePrefix: string;
  deliveryPrefix: string;
  purchaseOrderPrefix: string;
  creditNotePrefix: string;
  nextNumber: number;
  format: string;
};

type PdfSettings = {
  model: string;
  showLogo: boolean;
  showStamp: boolean;
  showSignature: boolean;
  paymentTerms: string;
  legalNotice: string;
  footer: string;
};

const companyStorageKey = "hicotech-settings-company";
const numberingStorageKey = "hicotech-settings-numbering";
const pdfStorageKey = "hicotech-settings-pdf";
const usersStorageKey = "hicotech-users";

const defaultCompany: CompanyProfile & { legalName: string; website: string; patente: string } = {
  ...activeCompanyProfile,
  legalName: "HICOTECH",
  website: "https://hicotech.ma",
  patente: "",
  rc: ""
};

const defaultNumbering: NumberingSettings = {
  quotePrefix: "DEV",
  invoicePrefix: "FAC",
  deliveryPrefix: "BL",
  purchaseOrderPrefix: "BC",
  creditNotePrefix: "AV",
  nextNumber: 124,
  format: "année/mois/numéro"
};

const defaultPdf: PdfSettings = {
  model: "Premium HicoPilot",
  showLogo: true,
  showStamp: true,
  showSignature: true,
  paymentTerms: "Paiement par virement, chèque ou espèces selon accord commercial.",
  legalNotice: "Toute réclamation doit être formulée dans un délai de 7 jours.",
  footer: "HICOTECH - ICE 003390979000024 - IF 60164052"
};

const roles: Role[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "SALES", "STOCK_MANAGER", "ACCOUNTANT", "HR", "READ_ONLY"];

export function SettingsModule() {
  const [section, setSection] = useState("entreprise");
  const [company, setCompany] = useState(defaultCompany);
  const [numbering, setNumbering] = useState(defaultNumbering);
  const [pdf, setPdf] = useState(defaultPdf);
  const [users, setUsers] = useState(demoUsers.filter((user) => user.companyId === activeCompanyId || user.role === "SUPER_ADMIN"));
  const [userForm, setUserForm] = useState<AppUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setCompany(loadStored(companyStorageKey, defaultCompany));
    setNumbering(loadStored(numberingStorageKey, defaultNumbering));
    setPdf(loadStored(pdfStorageKey, defaultPdf));
    const storedUsers = loadStored<AppUser[]>(usersStorageKey, []);
    if (storedUsers.length > 0) {
      setUsers(storedUsers.filter((user) => user.companyId === activeCompanyId || user.role === "SUPER_ADMIN"));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(usersStorageKey, JSON.stringify(users));
  }, [users]);

  const sections = useMemo(() => [
    { id: "entreprise", title: "Entreprise", description: "Identité, coordonnées, fiscalité et visuels.", icon: Building2 },
    { id: "utilisateurs", title: "Utilisateurs et rôles", description: "Comptes, statuts, rôles et permissions.", icon: Users },
    { id: "numerotation", title: "Numérotation", description: "Préfixes et prochain numéro automatique.", icon: Hash },
    { id: "pdf", title: "PDF et impression", description: "Modèle PDF, cachet, signature et mentions.", icon: Printer }
  ], []);

  function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(companyStorageKey, JSON.stringify(company));
    markSaved("Paramètres entreprise enregistrés.");
  }

  function saveNumbering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(numberingStorageKey, JSON.stringify(numbering));
    markSaved("Numérotation enregistrée.");
  }

  function savePdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(pdfStorageKey, JSON.stringify(pdf));
    markSaved("Paramètres PDF enregistrés.");
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userForm) return;
    const nextUser = userForm.passwordHash.startsWith("pending:")
      ? { ...userForm, passwordHash: await hashPasswordClient(userForm.passwordHash.replace("pending:", "")) }
      : userForm;
    setUsers((current) => current.some((user) => user.id === nextUser.id) ? current.map((user) => user.id === nextUser.id ? nextUser : user) : [nextUser, ...current]);
    setUserForm(null);
    markSaved("Utilisateur enregistré.");
  }

  async function saveUserPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordTarget || !newPassword) return;
    const passwordHash = await hashPasswordClient(newPassword);
    setUsers((current) => current.map((user) => user.id === passwordTarget.id ? { ...user, passwordHash } : user));
    setPasswordTarget(null);
    setNewPassword("");
    markSaved("Mot de passe changé.");
  }

  function toggleUserStatus(user: AppUser) {
    const nextStatus = user.status === "active" ? "disabled" : "active";
    setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
    markSaved(nextStatus === "active" ? "Utilisateur activé." : "Utilisateur désactivé.");
  }

  function deleteUser(user: AppUser) {
    setUsers((current) => current.filter((item) => item.id !== user.id));
    markSaved("Utilisateur supprimé.");
  }

  function exportJson() {
    const payload = {
      companyId: activeCompanyId,
      company,
      numbering,
      pdf,
      users: users.map((user) => ({
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "parametres-hicotech.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function markSaved(message: string) {
    setSaved(message);
    window.setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`rounded-lg border p-4 text-left shadow-soft transition ${section === item.id ? "border-hicotech-blue bg-hicotech-sky" : "border-slate-200 bg-white hover:border-hicotech-blue dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-hicotech-blue text-white"><Icon size={20} /></div>
                  <div>
                    <p className="font-display text-sm font-bold text-hicotech-navy dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{item.description}</p>
                  </div>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-hicotech-blue"><Eye size={14} /> Voir</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={exportJson} className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft">
          <Download size={18} />
          Export JSON
        </button>
      </div>

      {saved && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-hicotech-green">{saved}</p>}

      {section === "entreprise" && (
        <SettingsPanel title="Entreprise">
          <form onSubmit={saveCompany} className="grid gap-4 md:grid-cols-2">
            <Field label="Nom commercial" value={company.name ?? ""} onChange={(value) => setCompany({ ...company, name: value })} />
            <Field label="Raison sociale" value={company.legalName} onChange={(value) => setCompany({ ...company, legalName: value })} />
            <Field label="Adresse" value={company.address ?? ""} onChange={(value) => setCompany({ ...company, address: value })} />
            <Field label="Ville" value={company.city ?? ""} onChange={(value) => setCompany({ ...company, city: value })} />
            <Field label="Téléphone" value={company.phone ?? ""} onChange={(value) => setCompany({ ...company, phone: value })} />
            <Field label="Email" type="email" value={company.email ?? ""} onChange={(value) => setCompany({ ...company, email: value })} />
            <Field label="Site web" value={company.website} onChange={(value) => setCompany({ ...company, website: value })} />
            <Field label="ICE" value={company.ice ?? ""} onChange={(value) => setCompany({ ...company, ice: value })} />
            <Field label="IF" value={company.taxId ?? ""} onChange={(value) => setCompany({ ...company, taxId: value })} />
            <Field label="RC" value={company.rc ?? ""} onChange={(value) => setCompany({ ...company, rc: value })} />
            <Field label="Patente" value={company.patente} onChange={(value) => setCompany({ ...company, patente: value })} />
            <Field label="Logo" value={company.logoUrl ?? ""} onChange={(value) => setCompany({ ...company, logoUrl: value })} />
            <Field label="Cachet" value={company.stampUrl ?? ""} onChange={(value) => setCompany({ ...company, stampUrl: value })} />
            <Field label="Signature" value={company.signUrl ?? ""} onChange={(value) => setCompany({ ...company, signUrl: value })} />
            <SaveButton />
          </form>
        </SettingsPanel>
      )}

      {section === "utilisateurs" && (
        <SettingsPanel title="Utilisateurs et rôles" action={<button type="button" onClick={() => setUserForm(createUser())} className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white"><Plus size={18} /> Ajouter utilisateur</button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-hicotech-sky/70 text-left text-hicotech-navy dark:bg-hicotech-blue/20 dark:text-white">
                  {["Nom", "Email", "Rôle", "Statut", "Permissions", "Actions"].map((column) => <th key={column} className="px-4 py-3 font-display text-xs font-bold uppercase">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 dark:border-hicotech-dark-border">
                    <td className="px-4 py-4 font-bold text-hicotech-navy dark:text-white">{user.name}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{user.email}</td>
                    <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{user.role}</td>
                    <td className="px-4 py-4">{user.status}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-300">Selon matrice RBAC</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <SmallButton onClick={() => setUserForm(user)}>Modifier</SmallButton>
                        <SmallButton onClick={() => { setPasswordTarget(user); setNewPassword(""); }}><KeyRound size={14} /> Mot de passe</SmallButton>
                        <SmallButton onClick={() => toggleUserStatus(user)}>{user.status === "active" ? "Désactiver" : "Activer"}</SmallButton>
                        <SmallButton onClick={() => deleteUser(user)} danger><Trash2 size={14} /> Supprimer</SmallButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsPanel>
      )}

      {section === "numerotation" && (
        <SettingsPanel title="Numérotation">
          <form onSubmit={saveNumbering} className="grid gap-4 md:grid-cols-2">
            <Field label="Préfixe devis" value={numbering.quotePrefix} onChange={(value) => setNumbering({ ...numbering, quotePrefix: value })} />
            <Field label="Préfixe facture" value={numbering.invoicePrefix} onChange={(value) => setNumbering({ ...numbering, invoicePrefix: value })} />
            <Field label="Préfixe bon de livraison" value={numbering.deliveryPrefix} onChange={(value) => setNumbering({ ...numbering, deliveryPrefix: value })} />
            <Field label="Préfixe bon de commande" value={numbering.purchaseOrderPrefix} onChange={(value) => setNumbering({ ...numbering, purchaseOrderPrefix: value })} />
            <Field label="Préfixe avoir" value={numbering.creditNotePrefix} onChange={(value) => setNumbering({ ...numbering, creditNotePrefix: value })} />
            <Field label="Prochain numéro automatique" type="number" value={numbering.nextNumber} onChange={(value) => setNumbering({ ...numbering, nextNumber: Number(value) })} />
            <Field label="Format année/mois/numéro" value={numbering.format} onChange={(value) => setNumbering({ ...numbering, format: value })} />
            <SaveButton />
          </form>
        </SettingsPanel>
      )}

      {section === "pdf" && (
        <SettingsPanel title="PDF et impression">
          <form onSubmit={savePdf} className="grid gap-4 md:grid-cols-2">
            <Field label="Choix du modèle PDF" value={pdf.model} onChange={(value) => setPdf({ ...pdf, model: value })} />
            <Toggle label="Affichage logo" checked={pdf.showLogo} onChange={(value) => setPdf({ ...pdf, showLogo: value })} />
            <Toggle label="Affichage cachet" checked={pdf.showStamp} onChange={(value) => setPdf({ ...pdf, showStamp: value })} />
            <Toggle label="Affichage signature" checked={pdf.showSignature} onChange={(value) => setPdf({ ...pdf, showSignature: value })} />
            <TextArea label="Conditions de paiement" value={pdf.paymentTerms} onChange={(value) => setPdf({ ...pdf, paymentTerms: value })} />
            <TextArea label="Mentions légales" value={pdf.legalNotice} onChange={(value) => setPdf({ ...pdf, legalNotice: value })} />
            <TextArea label="Pied de page" value={pdf.footer} onChange={(value) => setPdf({ ...pdf, footer: value })} />
            <SaveButton />
          </form>
        </SettingsPanel>
      )}

      {userForm && (
        <UserModal user={userForm} onChange={setUserForm} onClose={() => setUserForm(null)} onSubmit={saveUser} />
      )}

      {passwordTarget && (
        <PasswordModal
          user={passwordTarget}
          password={newPassword}
          onPasswordChange={setNewPassword}
          onClose={() => setPasswordTarget(null)}
          onSubmit={saveUserPassword}
        />
      )}
    </div>
  );
}

function loadStored<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function createUser(): AppUser {
  return {
    id: `user-${Date.now()}`,
    companyId: activeCompanyId,
    name: "",
    email: "",
    role: "SALES",
    status: "active",
    passwordHash: ""
  };
}

async function hashPasswordClient(password: string) {
  const data = new TextEncoder().encode(`hicotech:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function SettingsPanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="font-display text-xl font-bold text-hicotech-navy dark:text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string | number; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-hicotech-dark-border">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-5 accent-hicotech-blue" />
    </label>
  );
}

function SaveButton() {
  return (
    <div className="md:col-span-2">
      <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">
        <Save size={18} />
        Enregistrer
      </button>
    </div>
  );
}

function SmallButton({ children, danger, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold ${
        danger
          ? "border-red-200 text-hicotech-red hover:bg-red-50"
          : "border-slate-200 text-hicotech-navy hover:bg-hicotech-sky dark:border-hicotech-dark-border dark:text-white dark:hover:bg-hicotech-blue/20"
      }`}
    >
      {children}
    </button>
  );
}

function PasswordModal({
  user,
  password,
  onPasswordChange,
  onClose,
  onSubmit
}: {
  user: AppUser;
  password: string;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">Changer mot de passe</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{user.name} - {user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 dark:border-hicotech-dark-border"><X size={18} /></button>
        </div>
        <div className="mt-6">
          <Field label="Nouveau mot de passe" type="password" value={password} onChange={onPasswordChange} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Annuler</button>
          <button type="submit" disabled={!password} className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}

function UserModal({ user, onChange, onClose, onSubmit }: { user: AppUser; onChange: (user: AppUser) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-bold text-hicotech-navy dark:text-white">Utilisateur</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 dark:border-hicotech-dark-border"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nom" value={user.name} onChange={(value) => onChange({ ...user, name: value })} />
          <Field label="Email" type="email" value={user.email} onChange={(value) => onChange({ ...user, email: value })} />
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Rôle utilisateur</span>
            <select value={user.role} onChange={(event) => onChange({ ...user, role: event.target.value as Role })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-hicotech-navy dark:text-white">Statut</span>
            <select value={user.status} onChange={(event) => onChange({ ...user, status: event.target.value as AppUser["status"] })} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </label>
          <Field label="Changer mot de passe" type="password" value="" onChange={(value) => onChange({ ...user, passwordHash: value ? `pending:${value}` : user.passwordHash })} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy dark:border-hicotech-dark-border dark:text-white">Annuler</button>
          <button type="submit" className="rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
