"use client";
import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarCtx {
  isOpen: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarCtx>({
  isOpen: true,
  isMobileOpen: false,
  toggle: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{
      isOpen,
      isMobileOpen,
      toggle: () => setIsOpen(p => !p),
      toggleMobile: () => setIsMobileOpen(p => !p),
      closeMobile: () => setIsMobileOpen(false),
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
