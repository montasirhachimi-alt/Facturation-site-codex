import { SectionHeader } from "@/components/section-header";
import { UsersModule } from "@/components/users-module";
import { activeCompanyId, demoUsers } from "@/lib/demo-data";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Administration"
        title="Utilisateurs et permissions"
        description="Création, modification, désactivation, mots de passe et attribution des rôles."
      />
      <UsersModule initialUsers={demoUsers} companyId={activeCompanyId} />
    </div>
  );
}
