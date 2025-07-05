import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SidebarProvider } from "@/lib/sidebar-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0D0D12]">
        <Sidebar />
        <Topbar />
        <DashboardShell>{children}</DashboardShell>
      </div>
    </SidebarProvider>
  );
}
