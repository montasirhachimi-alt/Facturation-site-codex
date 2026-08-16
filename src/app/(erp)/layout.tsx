import { ErpShell } from "@/components/erp-shell";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentEditionActivationRequest } from "@/platform/editions";

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const activationRequest = getCurrentEditionActivationRequest();

  return (
    <ErpShell user={user} activationRequest={activationRequest}>
      {children}
    </ErpShell>
  );
}
