"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  FileText,
  Link as LinkIcon,
  FolderLock,
  ShieldAlert,
  BarChart3,
  LogOut,
  User,
  Lock,
  Sparkles,
  Smartphone,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  Shield,
} from "lucide-react";
import { TwoFactorModal } from "@/components/auth/two-factor-modal";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "owner";
}

interface DashboardSidebarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpen2FA: () => void;
}

export function DashboardSidebar({ user, onLogout, onOpen2FA }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t, appName } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

  // Persist collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("blindshare_sidebar_collapsed");
      if (saved !== null) setCollapsed(saved === "true");
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("blindshare_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  const navLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home, exact: true },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/docs", label: t.nav.documents, icon: FileText },
    { href: "/dashboard/links", label: t.nav.links, icon: LinkIcon },
    {
      href: "/dashboard/questions",
      label: (t.nav as any).questions || "Q&A Inbox",
      icon: MessageCircle,
    },
    { href: "/dashboard/datarooms", label: t.nav.datarooms, icon: FolderLock },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ...(user?.role === "super_admin" || user?.role === "admin"
      ? [{ href: "/admin", label: t.nav.admin, icon: ShieldAlert, badge: "Admin" }]
      : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <aside
        className={`
          relative flex flex-col h-full
          border-r border-slate-800/70
          bg-slate-950/95 backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[220px]"}
          flex-shrink-0
        `}
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)",
          boxShadow: "1px 0 24px 0 rgba(0,0,0,0.35)",
        }}
      >
        {/* Subtle amber glow at top */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-32 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Brand Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-4 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-md shadow-amber-500/30 group-hover:scale-105 group-hover:rotate-3 transition-all">
              <Lock className="h-4.5 w-4.5 text-slate-950 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white text-sm truncate">{appName}</span>
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[8px] font-bold text-amber-300 border border-amber-500/30 flex-shrink-0">
                    v1.3.0
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 truncate">Zero-Knowledge E2EE</p>
              </div>
            )}
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-slate-800/60 flex-shrink-0" />

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5 no-scrollbar">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, (item as any).exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium
                  transition-all duration-200 whitespace-nowrap overflow-hidden
                  ${collapsed ? "justify-center" : ""}
                  ${
                    active
                      ? "bg-amber-500/12 text-amber-300 border border-amber-500/25 shadow-sm shadow-amber-500/10"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                  }
                `}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
                )}
                <Icon
                  className={`flex-shrink-0 transition-colors ${collapsed ? "h-5 w-5" : "h-4 w-4"}
                  ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}
                />
                {!collapsed && (
                  <span className="truncate leading-tight">{item.label}</span>
                )}
                {!collapsed && (item as any).badge && (
                  <span className="ml-auto rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    {(item as any).badge}
                  </span>
                )}
                {/* Tooltip for collapsed */}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                    {item.label}
                    {(item as any).badge && (
                      <span className="ml-1.5 rounded bg-amber-500/20 px-1 py-0.5 text-[9px] text-amber-300">{(item as any).badge}</span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px bg-slate-800/60 flex-shrink-0" />

        {/* Bottom: Language, 2FA, GitHub, User, Logout */}
        <div className="flex flex-col gap-1 px-2 py-3 flex-shrink-0">

          {/* Language Switcher */}
          <div className={`flex items-center rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-[10px] ${collapsed ? "justify-center" : ""}`}>
            <button
              onClick={() => setLang("en")}
              title="English"
              className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
                lang === "en" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            {!collapsed && <span className="text-slate-700 px-0.5">/</span>}
            <button
              onClick={() => setLang("hi")}
              title="हिन्दी"
              className={`rounded px-1.5 py-0.5 font-semibold transition-colors ${
                lang === "hi" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {collapsed ? "HI" : "हिन्दी"}
            </button>
          </div>

          {/* 2FA Security */}
          <button
            type="button"
            onClick={() => { setTwoFactorModalOpen(true); onOpen2FA(); }}
            title="Two-Factor Authentication"
            className={`group relative flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-2.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <Smartphone className="h-4 w-4 text-amber-400 flex-shrink-0" />
            {!collapsed && <span>2FA Security</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                2FA Security
              </span>
            )}
          </button>

          {/* GitHub Star */}
          <a
            href="https://github.com/SudhirDevOps1/BlindShare"
            target="_blank"
            rel="noopener noreferrer"
            title="Star on GitHub"
            className={`group relative flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 py-2 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <GithubIcon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span>GitHub</span>
                <span className="ml-auto flex items-center gap-0.5 rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20">
                  <Star className="h-2.5 w-2.5 fill-amber-400" /> Star
                </span>
              </>
            )}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                ⭐ Star on GitHub
              </span>
            )}
          </a>

          {/* Divider */}
          <div className="h-px bg-slate-800/60 my-1" />

          {/* User Info + Logout */}
          <div className={`flex ${collapsed ? "flex-col gap-1.5 items-center" : "items-center gap-2"}`}>
            <Link
              href="/dashboard/settings"
              title={user?.name || "Account Settings"}
              className={`group relative flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all px-2.5 py-2 min-w-0 ${collapsed ? "justify-center w-full" : "flex-1"}`}
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/20">
                <User className="h-3.5 w-3.5 text-amber-400" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate max-w-[100px]">{user?.name || "Account"}</p>
                  <p className="text-[9px] text-slate-500 truncate max-w-[100px]">{user?.email || ""}</p>
                </div>
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                  {user?.name || "Account"}<br />
                  <span className="text-slate-400 text-[10px]">{user?.email}</span>
                </span>
              )}
            </Link>
            <button
              onClick={onLogout}
              title="Log out"
              className="group relative flex items-center justify-center rounded-xl border border-slate-800 p-2 text-slate-500 hover:bg-red-950/40 hover:text-red-400 hover:border-red-800/60 transition-all flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                  Log out
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all shadow-md"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
      />
    </>
  );
}
