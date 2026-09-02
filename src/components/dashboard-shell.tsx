"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Menu, X } from "lucide-react";

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
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("blindshare_user");
      if (cached) setUser(JSON.parse(cached));
    } catch {}

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          try { sessionStorage.setItem("blindshare_user", JSON.stringify(data.user)); } catch {}
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
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <DashboardSidebar
          user={user}
          onLogout={handleLogout}
          onOpen2FA={() => {}}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative z-10 flex h-full">
            <DashboardSidebar
              user={user}
              onLogout={handleLogout}
              onOpen2FA={() => {}}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white tracking-tight">BlindShare</span>
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
            v1.3.0 E2EE
          </span>
        </div>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
