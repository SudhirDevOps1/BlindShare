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
} from "lucide-react";

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
  const isDashboardRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("blindshare_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      sessionStorage.removeItem("blindshare_user");
    } catch {}
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const showDashboardNav = Boolean(user || isDashboardRoute);

  const navLinks = showDashboardNav
    ? [
        { href: "/dashboard", label: t.nav.dashboard, icon: FileText },
        { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/docs", label: t.nav.documents, icon: FileText },
        { href: "/dashboard/links", label: t.nav.links, icon: LinkIcon },
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Name */}
        <Link href={showDashboardNav ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Lock className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">{appName}</span>
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                E2EE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Zero-Knowledge Doc Sharing</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-amber-400 border border-amber-500/30 shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Language Switcher & User Action */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                lang === "en" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("hi")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                lang === "hi" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              हिन्दी
            </button>
          </div>

          {showDashboardNav ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-slate-300 border border-slate-800 hover:border-slate-700"
              >
                <User className="h-3.5 w-3.5 text-amber-400" />
                <span className="max-w-[120px] truncate">{user?.name || "Account"}</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2">
              <Link
                href="/login"
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20"
              >
                {t.nav.login}
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 md:hidden"
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
          {showDashboardNav ? (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">{user?.email || "Signed In"}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:underline"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.nav.logout}
              </button>
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
    </header>
  );
}
