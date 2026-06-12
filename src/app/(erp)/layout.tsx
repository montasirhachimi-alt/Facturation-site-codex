import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hicotech-cloud text-hicotech-ink dark:bg-[#07152d] dark:text-white">
      <Sidebar />
      <div className="min-h-screen lg:pl-72">
        <Topbar />
        <main className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
