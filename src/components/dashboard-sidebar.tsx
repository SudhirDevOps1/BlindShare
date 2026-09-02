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
  Smartphone,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
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
}

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t, appName } = useI18n();
  // Default OPEN (expanded) — only collapse when user manually collapses
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bs_sidebar_col");
      if (saved !== null) setCollapsed(saved === "1");
    } catch {}
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("bs_sidebar_col", next ? "1" : "0"); } catch {}
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
      ? [{ href: "/admin", label: t.nav.admin, icon: ShieldAlert, badge: "Admin", exact: false }]
      : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Sidebar width values
  const W_EXPANDED = "240px";
  const W_COLLAPSED = "68px";

  return (
    <>
      <aside
        style={{
          width: mounted ? (collapsed ? W_COLLAPSED : W_EXPANDED) : W_EXPANDED,
          minWidth: mounted ? (collapsed ? W_COLLAPSED : W_EXPANDED) : W_EXPANDED,
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: "linear-gradient(180deg,#0b1220 0%,#0d1527 60%,#0b1220 100%)",
          boxShadow: "2px 0 20px 0 rgba(0,0,0,0.4)",
        }}
        className="relative flex flex-col h-full border-r border-slate-800/60 flex-shrink-0 overflow-hidden"
      >
        {/* Amber glow top accent */}
        <div
          className="pointer-events-none absolute top-0 inset-x-0 h-40 opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(245,158,11,0.35) 0%, transparent 65%)" }}
        />

        {/* ── Brand ─────────────────────────────────────── */}
        <div className="relative flex items-center gap-3 px-4 pt-5 pb-4 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Lock className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-base truncate">{appName}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/25">
                    v1.3.0 E2EE
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent flex-shrink-0" />

        {/* ── Nav Links ─────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2.5 space-y-0.5 no-scrollbar">
          {/* Section label */}
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-600 select-none">
              Navigation
            </p>
          )}
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  group relative flex items-center gap-3 rounded-xl text-sm font-medium
                  transition-all duration-200 select-none overflow-visible
                  ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}
                  ${active
                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
                  }
                `}
              >
                {/* Left active bar */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-amber-400" />
                )}

                <Icon
                  className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4.5 w-4.5"}
                  ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}
                />

                {!collapsed && (
                  <span className="truncate flex-1 leading-none">{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/30 flex-shrink-0">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span
                    className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[999]
                    rounded-lg bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs font-medium
                    text-slate-100 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100
                    transition-opacity duration-150"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-400">{item.badge}</span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 mt-1 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent flex-shrink-0" />

        {/* ── Bottom Controls ───────────────────────────── */}
        <div className={`flex flex-col gap-2 px-2.5 py-3 flex-shrink-0 ${collapsed ? "items-center" : ""}`}>
          {/* Language Switcher */}
          {!collapsed ? (
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden text-[11px]">
              <button
                onClick={() => setLang("en")}
                className={`flex-1 py-1.5 font-semibold transition-colors ${
                  lang === "en" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`flex-1 py-1.5 font-semibold transition-colors ${
                  lang === "hi" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                हिन्दी
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              title={lang === "en" ? "Switch to हिन्दी" : "Switch to EN"}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-[10px] font-bold text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
            >
              {lang === "en" ? "हि" : "EN"}
            </button>
          )}

          {/* 2FA */}
          <button
            type="button"
            onClick={() => setTwoFactorModalOpen(true)}
            title="Two-Factor Authentication"
            className={`group relative flex items-center gap-3 rounded-xl border border-amber-500/15 bg-amber-500/8
              px-3 py-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/15 transition-all
              ${collapsed ? "justify-center px-0 w-10 h-10" : ""}`}
          >
            <Smartphone className="h-4 w-4 text-amber-400 flex-shrink-0" />
            {!collapsed && <span>2FA Security</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[999] rounded-lg bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                2FA Security
              </span>
            )}
          </button>

          {/* GitHub */}
          <a
            href="https://github.com/SudhirDevOps1/BlindShare"
            target="_blank"
            rel="noopener noreferrer"
            title="Star on GitHub"
            className={`group relative flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/50
              px-3 py-2.5 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-all
              ${collapsed ? "justify-center px-0 w-10 h-10" : ""}`}
          >
            <GithubIcon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">GitHub</span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                  <Star className="h-2.5 w-2.5 fill-amber-400" /> Star
                </span>
              </>
            )}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[999] rounded-lg bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                ⭐ Star on GitHub
              </span>
            )}
          </a>

          {/* Divider */}
          <div className="h-px bg-slate-800/60 w-full" />

          {/* User + Logout */}
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/settings"
                className="group flex flex-1 items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/50 px-2.5 py-2 hover:border-slate-700 transition-all min-w-0"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/25 to-amber-700/20 border border-amber-500/20">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-[110px] leading-none">{user?.name || "Account"}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[110px] mt-0.5">{user?.email || ""}</p>
                </div>
              </Link>
              <button
                onClick={onLogout}
                title="Log out"
                className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 p-2 text-slate-500 hover:bg-red-950/50 hover:text-red-400 hover:border-red-800/60 transition-all flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 items-center">
              <Link
                href="/dashboard/settings"
                title={user?.name || "Account Settings"}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/40 transition-all"
              >
                <User className="h-4 w-4 text-amber-400" />
                <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[999] rounded-lg bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {user?.name || "Account"}
                  {user?.email && <><br /><span className="text-slate-400 text-[10px]">{user.email}</span></>}
                </span>
              </Link>
              <button
                onClick={onLogout}
                title="Log out"
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-red-950/50 hover:text-red-400 hover:border-red-800/60 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-[999] rounded-lg bg-slate-800 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  Log out
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse Toggle ───────────────────────────── */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-500 hover:text-amber-400 hover:border-amber-500/50 transition-all shadow-lg"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      <TwoFactorModal isOpen={twoFactorModalOpen} onClose={() => setTwoFactorModalOpen(false)} />
    </>
  );
}
