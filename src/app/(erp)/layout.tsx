import { ErpShell } from "@/components/erp-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <ErpShell user={user}>{children}</ErpShell>;
}
