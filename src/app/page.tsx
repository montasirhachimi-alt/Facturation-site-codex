import { redirect } from "next/navigation";
import { HicotechLogo } from "@/components/hicotech-logo";
import { demoUsers } from "@/lib/demo-data";
import { setSession, verifyPassword } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const user = demoUsers.find((item) => item.email === email && item.status === "active");

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/?error=1");
  }

  await setSession(user);
  redirect("/dashboard");
}

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E6F2FF_0,#F5F7FA_38%,#ffffff_100%)] px-4 py-8 text-hicotech-ink">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <HicotechLogo size="lg" />
          <div className="max-w-xl space-y-5">
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-hicotech-blue">
              ERP CRM Multi-Entreprises
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight text-hicotech-navy md:text-6xl">
              HICOTECH ERP
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              Gestion commerciale, facturation, stock, caisse et CRM dans une
              interface française moderne, pensée pour les entreprises
              marocaines.
            </p>
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {["Ventes", "Stock", "Caisse"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white bg-white/80 p-4 text-center text-sm font-semibold text-hicotech-navy shadow-soft"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white bg-white p-6 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-hicotech-navy">
                Connexion
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Accès sécurisé à votre espace entreprise
              </p>
            </div>
            <span className="rounded-full bg-hicotech-sky px-3 py-1 text-xs font-semibold text-hicotech-blue">
              Démo
            </span>
          </div>
          <form action={login} className="space-y-4">
            {params?.error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-hicotech-red">
                Email ou mot de passe incorrect.
              </p>
            )}
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy">
                Email
              </span>
              <input
                name="email"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4"
                defaultValue="admin@hicotech.ma"
                type="email"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-hicotech-navy">
                Mot de passe
              </span>
              <input
                name="password"
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-hicotech-blue/20 transition focus:border-hicotech-blue focus:ring-4"
                placeholder="Mot de passe"
                type="password"
              />
            </label>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg bg-hicotech-blue px-4 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:bg-blue-700"
            >
              Ouvrir le tableau de bord
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            Démo : admin@hicotech.ma avec le mot de passe fourni au démarrage du projet.
          </p>
        </div>
      </section>
    </main>
  );
}
