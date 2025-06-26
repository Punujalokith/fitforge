"use client";
import { useSidebar } from "@/lib/sidebar-context";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();
  return (
    <main className={cn(
      "pt-14 px-4 pb-4 lg:px-6 lg:pb-6 min-h-screen transition-all duration-200",
      "ml-0",
      isOpen ? "lg:ml-56" : "lg:ml-16",
    )}>
      {children}
    </main>
  );
}
