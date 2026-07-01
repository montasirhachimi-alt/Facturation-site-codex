"use client";

import { useCallback } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { ModuleSearchResult } from "@/core/search";
import { UniversalSearchProvider } from "@/platform/search";
import type { AuthSession } from "@/lib/types";
import { WorkspaceProvider } from "@/providers";
import { getCommandPaletteItems } from "@/services/commands";

export function ErpShell({ children, user }: { children: React.ReactNode; user: AuthSession | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const handleSearchSelect = useCallback((result: ModuleSearchResult) => {
    router.push(result.route);
  }, [router]);

  return (
    <WorkspaceProvider>
      <UniversalSearchProvider searchResults={getCommandPaletteItems} onSelectResult={handleSearchSelect}>
        <div className="min-h-screen bg-hicotech-cloud text-hicotech-ink dark:bg-hicotech-dark-page dark:text-white">
          <Sidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            onToggleCollapse={() => setCollapsed((value) => !value)}
            user={user}
          />
          <div className={collapsed ? "min-h-screen lg:pl-24" : "min-h-screen lg:pl-80"}>
            <Topbar onMenuClick={() => setMobileOpen(true)} user={user} />
            <main className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </UniversalSearchProvider>
    </WorkspaceProvider>
  );
}
