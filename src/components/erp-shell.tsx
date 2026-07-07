"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { UniversalSearchProvider } from "@/platform/search";
import type { AuthSession } from "@/lib/types";
import { WorkspaceProvider } from "@/providers";

export function ErpShell({ children, user }: { children: React.ReactNode; user: AuthSession | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <WorkspaceProvider>
      <UniversalSearchProvider>
        <div className="min-h-screen bg-slate-50 text-hicotech-ink dark:bg-hicotech-dark-page dark:text-white">
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
      </UniversalSearchProvider>
    </WorkspaceProvider>
  );
}
