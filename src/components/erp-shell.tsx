"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { KeyboardShortcutProvider } from "@/platform/keyboard";
import { ModuleActivationProvider } from "@/platform/modules/module-activation.context";
import { CrmSalesPersistenceProvider } from "@/platform/persistence";
import { UniversalSearchProvider } from "@/platform/search/providers/universal-search-provider";
import type { AuthSession } from "@/lib/types";
import { WorkspaceProvider } from "@/providers";

export function ErpShell({ children, user }: { children: React.ReactNode; user: AuthSession | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <WorkspaceProvider>
      <ModuleActivationProvider>
        <UniversalSearchProvider>
          <KeyboardShortcutProvider>
            <CrmSalesPersistenceProvider>
              <div className="min-h-screen bg-[linear-gradient(180deg,#F8FBFF_0%,#F5F7FA_42%,#EEF4FF_100%)] text-hicotech-ink dark:bg-hicotech-dark-page dark:text-white">
                <Sidebar
                  collapsed={collapsed}
                  mobileOpen={mobileOpen}
                  onCloseMobile={() => setMobileOpen(false)}
                  onToggleCollapse={() => setCollapsed((value) => !value)}
                  user={user}
                />
                <div className={collapsed ? "min-h-screen lg:pl-24" : "min-h-screen lg:pl-80"}>
                  <Topbar onMenuClick={() => setMobileOpen(true)} user={user} />
                  <main className="px-4 pb-10 pt-5 sm:px-6 lg:px-8">{children}</main>
                </div>
              </div>
            </CrmSalesPersistenceProvider>
          </KeyboardShortcutProvider>
        </UniversalSearchProvider>
      </ModuleActivationProvider>
    </WorkspaceProvider>
  );
}
