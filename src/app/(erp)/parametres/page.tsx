import { SectionHeader } from "@/components/section-header";
import { SettingsModule } from "@/components/settings-module";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Paramètres"
        title="Paramètres entreprise"
        description="Identité entreprise, utilisateurs, numérotation, PDF et impression."
      />
      <SettingsModule />
    </div>
  );
}
