"use client";

import { Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";

export default function Topbar() {
  const { isOpen, toggleMobile } = useSidebar();

  return (
    <header className={cn(
      "fixed top-0 right-0 h-14 bg-[#0D0D12] border-b border-white/5 flex items-center justify-between px-4 lg:px-6 z-40 transition-all duration-200",
      "left-0",
      isOpen ? "lg:left-56" : "lg:left-16",
    )}>
      {/* Left: hamburger (mobile) + search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggleMobile}
          className="lg:hidden w-9 h-9 rounded-xl bg-[#1a1a24] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-white/60" />
        </button>

        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2 w-full max-w-sm lg:max-w-md">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search members, trainers, payments..."
            className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-[#1a1a24] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
          <Bell className="w-4 h-4 text-white/60" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00C896] rounded-full" />
        </button>

        {/* Owner Info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold leading-none">Alex Morgan</p>
            <p className="text-white/40 text-xs mt-0.5">Gym Owner</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00C896] to-[#00D4FF] flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
            AM
          </div>
        </div>
      </div>
    </header>
  );
}
