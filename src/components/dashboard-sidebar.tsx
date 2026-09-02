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
  Zap,
} from "lucide-react";
import { TwoFactorModal } from "@/components/auth/two-factor-modal";

function GithubIcon() {
  return (
    <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
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

const BASE_NAV = [
  { href: "/dashboard",           icon: Home,          exact: true,  key: "dashboard" },
  { href: "/dashboard/analytics", icon: BarChart3,     exact: false, key: "analytics" },
  { href: "/dashboard/docs",      icon: FileText,      exact: false, key: "docs"      },
  { href: "/dashboard/links",     icon: LinkIcon,      exact: false, key: "links"     },
  { href: "/dashboard/questions", icon: MessageCircle, exact: false, key: "questions" },
  { href: "/dashboard/datarooms", icon: FolderLock,    exact: false, key: "datarooms" },
  { href: "/dashboard/settings",  icon: Settings,      exact: false, key: "settings"  },
];

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t, appName } = useI18n();
  const [collapsed, setCollapsed]   = useState(false);
  const [twoFAOpen, setTwoFAOpen]   = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Clear stale collapsed keys from previous versions — always start expanded
  useEffect(() => {
    try {
      localStorage.removeItem("bs_sidebar_col");
      localStorage.removeItem("blindshare_sidebar_collapsed");
    } catch {}
  }, []);

  const labelOf = (key: string) => {
    const map: Record<string, string> = {
      dashboard: (t.nav as any)?.dashboard || "Dashboard",
      analytics: "Analytics",
      docs:      (t.nav as any)?.documents || "Documents",
      links:     (t.nav as any)?.links     || "Links",
      questions: (t.nav as any)?.questions || "Q&A Inbox",
      datarooms: (t.nav as any)?.datarooms || "Datarooms",
      settings:  "Settings",
    };
    return map[key] || key;
  };

  const navLinks = [
    ...BASE_NAV.map((n) => ({ ...n, label: labelOf(n.key) })),
    ...(user?.role === "super_admin" || user?.role === "admin"
      ? [{ href: "/admin", icon: ShieldAlert, exact: false, key: "admin", label: "Admin", badge: true }]
      : []),
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const W = collapsed ? 68 : 248;

  return (
    <>
      {/* Global sidebar keyframes — safe, no opacity delay */}
      <style>{`
        @keyframes sbSlideIn { from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)} }
        @keyframes sbFadeUp  { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
        .sb-slide { animation: sbSlideIn 0.32s cubic-bezier(0.4,0,0.2,1) forwards; }
        .sb-fade  { animation: sbFadeUp  0.25s cubic-bezier(0.4,0,0.2,1) forwards; }
      `}</style>

      {/*
        Outer wrapper: relative+flex so the collapse toggle can sit
        at the right edge without needing overflow:visible on aside.
      */}
      <div
        className="sb-slide"
        style={{
          display: "flex",
          height: "100%",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {/* ─── Sidebar panel ──────────────────────────────── */}
        <aside
          style={{
            width: W,
            minWidth: W,
            maxWidth: W,
            transition: "width 0.26s cubic-bezier(0.4,0,0.2,1), min-width 0.26s cubic-bezier(0.4,0,0.2,1), max-width 0.26s cubic-bezier(0.4,0,0.2,1)",
            background: "linear-gradient(170deg,#090f1c 0%,#0c1526 55%,#080d18 100%)",
            boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04), 2px 0 24px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflowX: "hidden",
            overflowY: "visible",
            position: "relative",
          }}
        >
          {/* Amber top glow */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 120,
            background: "radial-gradient(ellipse at 50% -20%,rgba(245,158,11,0.18) 0%,transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />

          {/* ── Brand ─────────────────────────────────────── */}
          <div style={{
            position: "relative", zIndex: 1, flexShrink: 0,
            padding: collapsed ? "18px 12px 14px" : "18px 16px 14px",
            display: "flex", alignItems: "center",
          }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", minWidth: 0 }}>
              {/* Logo icon */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 40, height: 40, flexShrink: 0, borderRadius: 13,
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1) rotate(8deg)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Lock style={{ width: 18, height: 18, color: "#1e293b", strokeWidth: 2.8 }} />
              </div>

              {!collapsed && (
                <div className="sb-fade" style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#f8fafc", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                    {appName}
                  </div>
                  <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)",
                      borderRadius: 999, padding: "2px 7px",
                      fontSize: 9, fontWeight: 700, color: "#fbbf24", whiteSpace: "nowrap",
                    }}>
                      <Zap style={{ width: 8, height: 8, fill: "#fbbf24" }} />
                      v1.3.0 E2EE
                    </span>
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Brand divider */}
          <div style={{
            margin: "0 14px 6px", height: 1, flexShrink: 0,
            background: "linear-gradient(90deg,transparent,rgba(100,116,139,0.28),transparent)",
          }} />

          {/* ── Nav links ─────────────────────────────────── */}
          <nav
            style={{
              flex: 1, overflowY: "auto", overflowX: "hidden",
              padding: "6px 10px 6px", position: "relative", zIndex: 1,
            }}
            className="no-scrollbar"
          >
            {!collapsed && (
              <p style={{
                padding: "0 4px 6px", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "rgba(100,116,139,0.55)", userSelect: "none",
              }}>
                Menu
              </p>
            )}

            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              const hov = hoveredHref === item.href;
              const badge = (item as any).badge;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  onMouseEnter={() => setHoveredHref(item.href)}
                  onMouseLeave={() => setHoveredHref(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: collapsed ? 0 : 10,
                    borderRadius: 11,
                    padding: collapsed ? "11px 0" : "9px 11px",
                    marginBottom: 2,
                    textDecoration: "none",
                    position: "relative",
                    // Always opacity:1 — NO animation that starts at opacity:0
                    opacity: 1,
                    border: active
                      ? "1px solid rgba(245,158,11,0.22)"
                      : "1px solid transparent",
                    background: active
                      ? "linear-gradient(90deg,rgba(245,158,11,0.11),rgba(245,158,11,0.05))"
                      : hov
                      ? "rgba(30,41,59,0.65)"
                      : "transparent",
                    boxShadow: active ? "0 0 12px rgba(245,158,11,0.07)" : "none",
                    transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  {/* Active left bar */}
                  {active && !collapsed && (
                    <span style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: 16, borderRadius: "0 3px 3px 0",
                      background: "linear-gradient(180deg,#fbbf24,#f59e0b)",
                      boxShadow: "0 0 8px rgba(245,158,11,0.55)",
                    }} />
                  )}

                  <Icon style={{
                    width: collapsed ? 20 : 17,
                    height: collapsed ? 20 : 17,
                    flexShrink: 0,
                    color: active ? "#fbbf24" : hov ? "#cbd5e1" : "#64748b",
                    transition: "color 0.18s ease, transform 0.18s ease",
                    transform: hov && !active ? "scale(1.1)" : "scale(1)",
                    filter: active ? "drop-shadow(0 0 5px rgba(245,158,11,0.45))" : "none",
                  }} />

                  {!collapsed && (
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      color: active ? "#fde68a" : hov ? "#f1f5f9" : "#94a3b8",
                      letterSpacing: "-0.01em",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      transition: "color 0.18s ease",
                    }}>
                      {item.label}
                    </span>
                  )}

                  {!collapsed && badge && (
                    <span style={{
                      borderRadius: 999,
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      padding: "2px 7px",
                      fontSize: 9, fontWeight: 700, color: "#f87171", flexShrink: 0,
                    }}>
                      Admin
                    </span>
                  )}

                  {/* Collapsed tooltip */}
                  {collapsed && hov && (
                    <span style={{
                      position: "absolute", left: "calc(100% + 10px)", top: "50%",
                      transform: "translateY(-50%)", zIndex: 9999,
                      background: "rgba(15,23,42,0.97)",
                      border: "1px solid rgba(51,65,85,0.9)",
                      borderRadius: 9, padding: "6px 12px",
                      fontSize: 12, fontWeight: 500, color: "#e2e8f0",
                      whiteSpace: "nowrap",
                      boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
                      pointerEvents: "none",
                    }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Nav/Bottom divider */}
          <div style={{
            margin: "0 14px 8px", height: 1, flexShrink: 0,
            background: "linear-gradient(90deg,transparent,rgba(100,116,139,0.22),transparent)",
          }} />

          {/* ── Bottom controls ───────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: collapsed ? "0 10px 16px" : "0 12px 16px",
            display: "flex", flexDirection: "column",
            gap: 7,
            alignItems: collapsed ? "center" : "stretch",
            position: "relative", zIndex: 1,
          }}>

            {/* Language switcher */}
            {!collapsed ? (
              <div style={{
                display: "flex", borderRadius: 10, overflow: "hidden",
                border: "1px solid rgba(51,65,85,0.55)",
                background: "rgba(15,23,42,0.55)",
              }}>
                {(["en", "hi"] as const).map((l) => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    flex: 1, padding: "7px 0",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: "none", outline: "none",
                    background: lang === l ? "linear-gradient(135deg,#f59e0b,#d97706)" : "transparent",
                    color: lang === l ? "#1e293b" : "#64748b",
                    transition: "all 0.2s ease",
                    borderRadius: lang === l ? 8 : 0,
                  }}>
                    {l === "en" ? "EN" : "हिन्दी"}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                title={lang === "en" ? "हिन्दी" : "EN"}
                style={{
                  width: 38, height: 34, borderRadius: 10, cursor: "pointer",
                  border: "1px solid rgba(51,65,85,0.55)",
                  background: "rgba(15,23,42,0.55)",
                  fontSize: 10, fontWeight: 700, color: "#64748b",
                  transition: "all 0.2s ease",
                }}
              >
                {lang === "en" ? "हि" : "EN"}
              </button>
            )}

            {/* 2FA */}
            <button
              onClick={() => setTwoFAOpen(true)}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                borderRadius: 11,
                padding: collapsed ? "9px 0" : "9px 12px",
                border: "1px solid rgba(245,158,11,0.18)",
                background: "rgba(245,158,11,0.07)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.14)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.38)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.07)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.18)";
              }}
            >
              <Smartphone style={{ width: 16, height: 16, color: "#fbbf24", flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#fde68a" }}>2FA Security</span>
              )}
            </button>

            {/* GitHub */}
            <a
              href="https://github.com/SudhirDevOps1/BlindShare"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                borderRadius: 11,
                padding: collapsed ? "9px 0" : "9px 12px",
                border: "1px solid rgba(51,65,85,0.5)",
                background: "rgba(15,23,42,0.5)",
                textDecoration: "none",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,116,139,0.65)";
                (e.currentTarget as HTMLElement).style.background = "rgba(30,41,59,0.75)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.5)";
                (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.5)";
              }}
            >
              <GithubIcon />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#94a3b8" }}>GitHub</span>
                  <span style={{
                    display: "flex", alignItems: "center", gap: 3,
                    fontSize: 9, fontWeight: 700, color: "#fbbf24",
                    background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                    padding: "2px 7px", borderRadius: 999,
                  }}>
                    <Star style={{ width: 9, height: 9, fill: "#fbbf24" }} /> Star
                  </span>
                </>
              )}
            </a>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(51,65,85,0.4)" }} />

            {/* User + Logout */}
            {!collapsed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href="/dashboard/settings"
                  style={{
                    display: "flex", flex: 1, alignItems: "center", gap: 10,
                    borderRadius: 11, padding: "8px 10px", textDecoration: "none",
                    border: "1px solid rgba(51,65,85,0.5)",
                    background: "rgba(15,23,42,0.5)",
                    transition: "all 0.2s ease", minWidth: 0, overflow: "hidden",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.06)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.5)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.5)";
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 30, height: 30, flexShrink: 0, borderRadius: 10,
                    background: "linear-gradient(135deg,rgba(245,158,11,0.22),rgba(180,83,9,0.14))",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}>
                    <User style={{ width: 14, height: 14, color: "#fbbf24" }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: 105, lineHeight: 1.3,
                    }}>
                      {user?.name || "Account"}
                    </p>
                    <p style={{
                      fontSize: 10, color: "#475569",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      maxWidth: 105, marginTop: 1,
                    }}>
                      {user?.email || ""}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={onLogout}
                  title="Log out"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 38, height: 38, flexShrink: 0, borderRadius: 11,
                    border: "1px solid rgba(51,65,85,0.5)",
                    background: "rgba(15,23,42,0.5)",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(127,29,29,0.35)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.4)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.5)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,65,85,0.5)";
                  }}
                >
                  <LogOut style={{ width: 16, height: 16, color: "#64748b" }} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <Link href="/dashboard/settings" title="Settings" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38, borderRadius: 11, textDecoration: "none",
                  border: "1px solid rgba(51,65,85,0.5)", background: "rgba(15,23,42,0.5)",
                  transition: "all 0.2s ease",
                }}>
                  <User style={{ width: 16, height: 16, color: "#fbbf24" }} />
                </Link>
                <button onClick={onLogout} title="Log out" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38, borderRadius: 11, cursor: "pointer",
                  border: "1px solid rgba(51,65,85,0.5)", background: "rgba(15,23,42,0.5)",
                  transition: "all 0.2s ease",
                }}>
                  <LogOut style={{ width: 16, height: 16, color: "#64748b" }} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Collapse toggle (outside aside, no overflow:visible needed) ── */}
        <button
          onClick={() => setCollapsed((p) => !p)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position: "absolute",
            right: -13,
            top: 64,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#1e293b,#0f172a)",
            border: "1px solid rgba(100,116,139,0.4)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.55)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 18px rgba(245,158,11,0.22)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,116,139,0.4)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.45)";
          }}
        >
          {collapsed
            ? <ChevronRight style={{ width: 12, height: 12, color: "#94a3b8" }} />
            : <ChevronLeft  style={{ width: 12, height: 12, color: "#94a3b8" }} />
          }
        </button>
      </div>

      <TwoFactorModal isOpen={twoFAOpen} onClose={() => setTwoFAOpen(false)} />
    </>
  );
}
