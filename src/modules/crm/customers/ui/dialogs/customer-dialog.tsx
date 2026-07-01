import { Check, X } from "lucide-react";
import type { FormEvent } from "react";
import type { CustomerStatus, CustomerType } from "../../customer.types";
import type { CustomerFormState } from "../hooks/use-customers-page";

export function CustomerDialog({
  error,
  form,
  onChange,
  onClose,
  onSubmit,
  open
}: {
  error: string | null;
  form: CustomerFormState;
  onChange: (form: CustomerFormState) => void;
  onClose: () => void;
  onSubmit: () => boolean;
  open: boolean;
}) {
  if (!open) return null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-hicotech-dark-sidebar/70 px-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft dark:border-hicotech-dark-border dark:bg-hicotech-dark-card"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-hicotech-blue">CRM</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-hicotech-navy dark:text-white">Ajouter client</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Création en mémoire via CustomerService.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Nom client">
            <input value={form.displayName} onChange={(event) => onChange({ ...form, displayName: event.target.value })} required className={inputClassName} placeholder="Ex. Amina El Mansouri" />
          </Field>
          <Field label="Société">
            <input value={form.companyName} onChange={(event) => onChange({ ...form, companyName: event.target.value })} className={inputClassName} placeholder="Ex. Ecole Al Hikma" />
          </Field>
          <Field label="Email">
            <input value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} className={inputClassName} placeholder="contact@entreprise.ma" type="email" />
          </Field>
          <Field label="Téléphone">
            <input value={form.phone} onChange={(event) => onChange({ ...form, phone: event.target.value })} className={inputClassName} placeholder="0661 22 33 44" />
          </Field>
          <Field label="Statut">
            <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as CustomerStatus })} className={inputClassName}>
              <option value="lead">Prospect</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value as CustomerType })} className={inputClassName}>
              <option value="company">Société</option>
              <option value="individual">Particulier</option>
            </select>
          </Field>
          <Field label="Tags">
            <input value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} className={inputClassName} placeholder="vip, education" />
          </Field>
          <Field label="Notes">
            <input value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} className={inputClassName} placeholder="Notes internes" />
          </Field>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-hicotech-navy transition hover:bg-hicotech-cloud dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white">
            Annuler
          </button>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-hicotech-blue px-4 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-blue-700">
            <Check size={18} />
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClassName = "mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4 dark:border-hicotech-dark-border dark:bg-hicotech-dark-page/50 dark:text-white dark:placeholder:text-slate-400";

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-hicotech-navy dark:text-white">{label}</span>
      {children}
    </label>
  );
}

