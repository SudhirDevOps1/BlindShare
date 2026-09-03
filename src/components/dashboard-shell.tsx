"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Menu, X } from "lucide-react";
import { Lock } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "owner";
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("blindshare_user");
      if (cached) setUser(JSON.parse(cached));
    } catch {}

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          try { sessionStorage.setItem("blindshare_user", JSON.stringify(d.user)); } catch {}
        } else {
          setUser(null);
          try { sessionStorage.removeItem("blindshare_user"); } catch {}
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    try { sessionStorage.clear(); localStorage.removeItem("blindshare_user"); } catch {}
    setUser(null);
    window.location.href = "/login";
  };

  return (
    /*
     * Full-viewport flex row.
     * Sidebar is fixed-width (shrink-0), main area takes the rest.
     * overflow-hidden on the outer shell ensures no page-level scrollbar clash.
     */
    <div
      className="flex"
      style={{ height: "100dvh", overflow: "hidden", background: "#080e1a" }}
    >
      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <div className="hidden lg:flex h-full flex-shrink-0">
        <DashboardSidebar user={user} onLogout={handleLogout} />
      </div>

      {/* ── Mobile Sidebar Drawer ─────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          {/* Sidebar panel */}
          <div className="relative z-10 flex h-full animate-in slide-in-from-left duration-300 shadow-2xl">
            <DashboardSidebar user={user} onLogout={handleLogout} />
          </div>
          {/* Close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white shadow-xl active:scale-95 transition-all"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0" style={{ overflow: "hidden" }}>
        {/* Mobile topbar */}
        <div className="flex lg:hidden items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-slate-800 active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/25">
                <Lock className="h-4 w-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">BlindShare</span>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/25">
            v1.4.0 E2EE
          </span>
        </div>

        {/*
         * Page scroll area — fills remaining height.
         * overflow-y-auto here means the sidebar stays fixed while content scrolls.
         * Dashboard page components no longer need min-h-screen.
         */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ background: "linear-gradient(160deg,#0b1220 0%,#080e1a 100%)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
