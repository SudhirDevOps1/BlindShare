import { BrandIcon } from "./brand-icon";
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import {
  FileText,
  Link as LinkIcon,
  FolderLock,
  ShieldAlert,
  BarChart3,
  Globe,
  LogOut,
  User,
  Menu,
  X,
  Lock,
  Sparkles,
  Smartphone,
  Star,
  MessageCircle,
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

export function BrandHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t, appName } = useI18n();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthRoute) {
      setUser(null);
      try {
        sessionStorage.removeItem("blindshare_user");
      } catch {}
      setLoading(false);
      return;
    }

    try {
      const cached = sessionStorage.getItem("blindshare_user");
      if (cached) setUser(JSON.parse(cached));
    } catch {}

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          try {
            sessionStorage.setItem("blindshare_user", JSON.stringify(data.user));
          } catch {}
        } else {
          setUser(null);
          try {
            sessionStorage.removeItem("blindshare_user");
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pathname, isAuthRoute]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      sessionStorage.clear();
      localStorage.removeItem("blindshare_user");
    } catch {}
    setUser(null);
    window.location.href = "/login";
  };

  const showDashboardNav = !isAuthRoute && Boolean(user || isDashboardRoute);

  const navLinks = showDashboardNav
    ? [
        { href: "/dashboard", label: t.nav.dashboard, icon: FileText },
        { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/docs", label: t.nav.documents, icon: FileText },
        { href: "/dashboard/links", label: t.nav.links, icon: LinkIcon },
        { href: "/dashboard/questions", label: (t.nav as any).questions || "Q&A Inbox", icon: MessageCircle },
        { href: "/dashboard/datarooms", label: t.nav.datarooms, icon: FolderLock },
        ...(user?.role === "super_admin" || user?.role === "admin"
          ? [{ href: "/admin", label: t.nav.admin, icon: ShieldAlert, badge: "Admin" }]
          : []),
      ]
    : [
        { href: "/#features", label: "Features", icon: Sparkles },
        { href: "/#security", label: "Zero-Knowledge", icon: Lock },
        { href: "/privacy", label: t.nav.privacy, icon: Globe },
      ];

  // Dashboard & admin routes use DashboardShell sidebar — no top header needed
  if (isDashboardRoute) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl w-full shadow-lg shadow-black/20">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-2.5 sm:px-6 gap-2">
        {/* Brand Logo & Name */}
        <Link href={showDashboardNav ? "/dashboard" : "/"} className="flex items-center gap-2.5 group flex-shrink-0">
          <BrandIcon size="md" className="group-hover:scale-105 group-hover:border-amber-400 transition-all" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base sm:text-lg">{appName}</span>
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                v1.4.0 E2EE
              </span>
            </div>
            <p className="text-[9px] text-slate-400 hidden 2xl:block">Zero-Knowledge Doc Sharing</p>
          </div>
        </Link>

        {/* Scrollable Center Nav Tabs (Never squishes right-side user profile/logout) */}
        <nav className="hidden md:flex flex-1 min-w-0 mx-2 lg:mx-3 items-center gap-1 lg:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10"
                    : "text-slate-300 hover:bg-slate-900/80 hover:text-white hover:border-slate-800 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Language Switcher, GitHub & User Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* GitHub Star Button */}
          <a
            href="https://github.com/SudhirDevOps1/BlindShare"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition shadow-sm flex-shrink-0"
            title="Star BlindShare on GitHub"
          >
            <GithubIcon className="h-3.5 w-3.5 text-slate-300" />
            <span className="hidden 2xl:inline">GitHub</span>
            <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
              <Star className="h-2.5 w-2.5 fill-amber-400" /> Star
            </span>
          </a>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[11px] flex-shrink-0">
            <button
              onClick={() => setLang("en")}
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                lang === "en" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                lang === "hi" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              हिन्दी
            </button>
          </div>

          {showDashboardNav ? (
            <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => setTwoFactorModalOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition shadow-sm flex-shrink-0"
                title="Two-Factor Authentication Security"
              >
                <Smartphone className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden 2xl:inline">2FA Security</span>
              </button>

              <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-slate-300 border border-slate-800 hover:border-slate-700 flex-shrink-0"
                title={user?.name || "Account Settings"}
              >
                <User className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <span className="max-w-[70px] xl:max-w-[110px] truncate">{user?.name || "Account"}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="flex items-center justify-center rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-red-950/40 hover:text-red-400 hover:border-red-800 transition-colors flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2 flex-shrink-0">
              <Link
                href="/login"
                className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20"
              >
                {t.nav.login}
              </Link>
            </div>
          )}

          {/* Mobile/Tablet menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 lg:hidden flex-shrink-0"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
              >
                <Icon className="h-4 w-4 text-amber-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <a
            href="https://github.com/SudhirDevOps1/BlindShare"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <GithubIcon className="h-4 w-4 text-amber-400" />
              <span>GitHub Repository</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <Star className="h-3 w-3 fill-amber-400" /> Star
            </span>
          </a>
          {showDashboardNav ? (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTwoFactorModalOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-amber-300 hover:bg-slate-900"
              >
                <Smartphone className="h-4 w-4 text-amber-400" />
                <span>2FA Security Settings</span>
              </button>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-xs text-slate-400">{user?.email || "Signed In"}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:underline"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t.nav.logout}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center rounded-lg bg-amber-500 py-2 text-xs font-semibold text-slate-950"
              >
                {t.nav.login}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={twoFactorModalOpen}
        onClose={() => setTwoFactorModalOpen(false)}
      />
    </header>
  );
}
