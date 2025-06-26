"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CalendarCheck, UserCheck, CreditCard,
  BarChart3, Megaphone, Settings, BookOpen, RefreshCw, ChevronLeft, ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";

const navItems = [
  { label: "Dashboard",    href: "/dashboard",              icon: LayoutDashboard },
  { label: "Members",      href: "/dashboard/members",      icon: Users },
  { label: "Attendance",   href: "/dashboard/attendance",   icon: CalendarCheck },
  { label: "Gate Scanner", href: "/dashboard/gate-scan",    icon: ScanLine },
  { label: "Trainers",     href: "/dashboard/trainers",     icon: UserCheck },
  { label: "Payments",     href: "/dashboard/payments",     icon: CreditCard },
  { label: "Classes",      href: "/dashboard/classes",      icon: BookOpen },
  { label: "Renewals",     href: "/dashboard/renewals",     icon: RefreshCw },
  { label: "Analytics",    href: "/dashboard/analytics",    icon: BarChart3 },
  { label: "Announcements",href: "/dashboard/announcements",icon: Megaphone },
  { label: "Settings",     href: "/dashboard/settings",     icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobileOpen, toggle, closeMobile } = useSidebar();

  const showLabel = isOpen || isMobileOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-[#111118] border-r border-white/5 flex flex-col z-50 transition-all duration-200",
        // Mobile: slide in/out
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        // Desktop: full or collapsed
        isOpen ? "lg:w-56" : "lg:w-16",
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 border-b border-white/5 h-14 flex-shrink-0",
          showLabel ? "px-5" : "lg:justify-center lg:px-0 px-5",
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-xs">FF</span>
          </div>
          {showLabel && (
            <span className="text-white font-bold text-base tracking-tight whitespace-nowrap">FitForge</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={!showLabel ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
                  showLabel ? "px-3 py-2.5" : "lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5",
                  active
                    ? "text-[#00D4FF] bg-[#00D4FF]/10"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active ? "text-[#00D4FF]" : "text-white/40"
                )} />
                {showLabel && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className={cn(
          "hidden lg:flex items-center border-t border-white/5 px-2 py-3",
          showLabel ? "justify-between" : "justify-center",
        )}>
          {showLabel && <p className="text-white/20 text-xs pl-1">FitForge v2.0</p>}
          <button
            onClick={toggle}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-200", !isOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
}
