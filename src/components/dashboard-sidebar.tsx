"use client";

import React, { useState, useEffect, useRef } from "react";
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

const NAV_LINKS = [
  { href: "/dashboard",            label: "Dashboard",  icon: Home,          exact: true  },
  { href: "/dashboard/analytics",  label: "Analytics",  icon: BarChart3,     exact: false },
  { href: "/dashboard/docs",       label: "Documents",  icon: FileText,      exact: false },
  { href: "/dashboard/links",      label: "Links",      icon: LinkIcon,      exact: false },
  { href: "/dashboard/questions",  label: "Q&A Inbox",  icon: MessageCircle, exact: false },
  { href: "/dashboard/datarooms",  label: "Datarooms",  icon: FolderLock,    exact: false },
  { href: "/dashboard/settings",   label: "Settings",   icon: Settings,      exact: false },
];

const ADMIN_LINK = { href: "/admin", label: "Admin", icon: ShieldAlert, exact: false, badge: "Admin" };

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { lang, setLang, t, appName } = useI18n();

  // Always start EXPANDED — clear any stale localStorage from previous versions
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady]         = useState(false);
  const [twoFAOpen, setTwoFAOpen] = useState(false);
  const [hovered, setHovered]     = useState<string | null>(null);

  useEffect(() => {
    // Clear old collapsed key so sidebar always resets to open
    try { localStorage.removeItem("bs_sidebar_col"); } catch {}
    setReady(true);
  }, []);

  const toggleCollapsed = () => setCollapsed((p) => !p);

  const navLinks = [
    ...NAV_LINKS.map((l) => ({ ...l, label: getLabel(l.href, t) })),
    ...((user?.role === "super_admin" || user?.role === "admin") ? [ADMIN_LINK] : []),
  ];

  function getLabel(href: string, t: any) {
    const map: Record<string, string> = {
      "/dashboard":           t.nav?.dashboard  || "Dashboard",
      "/dashboard/analytics": "Analytics",
      "/dashboard/docs":      t.nav?.documents  || "Documents",
      "/dashboard/links":     t.nav?.links      || "Links",
      "/dashboard/questions": t.nav?.questions  || "Q&A Inbox",
      "/dashboard/datarooms": t.nav?.datarooms  || "Datarooms",
      "/dashboard/settings":  "Settings",
    };
    return map[href] || href;
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const W = collapsed ? "68px" : "248px";

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn {
          from { opacity:0; transform:translateX(-20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes navItemIn {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes activePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%      { box-shadow: 0 0 12px 2px rgba(245,158,11,0.18); }
        }
        @keyframes logoSpin {
          from { transform:rotate(0deg) scale(1); }
          to   { transform:rotate(360deg) scale(1.08); }
        }
        .sidebar-anim { animation: sidebarSlideIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        .nav-item-anim { animation: navItemIn 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .active-pulse  { animation: activePulse 2.4s ease-in-out infinite; }
      `}</style>

      <aside
        className={ready ? "sidebar-anim" : ""}
        style={{
          width: W,
          minWidth: W,
          maxWidth: W,
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1), max-width 0.28s cubic-bezier(0.4,0,0.2,1)",
          background: "linear-gradient(170deg,#090f1c 0%,#0c1526 50%,#080d18 100%)",
          boxShadow: "2px 0 32px 0 rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.04)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          flexShrink: 0,
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {/* Top amber glow orb */}
        <div style={{
          position:"absolute", top:-40, left:"50%", transform:"translateX(-50%)",
          width:160, height:120, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(245,158,11,0.22) 0%,transparent 70%)",
          pointerEvents:"none", zIndex:0,
        }} />

        {/* Subtle grid pattern overlay */}
        <div style={{
          position:"absolute", inset:0, opacity:0.025, pointerEvents:"none", zIndex:0,
          backgroundImage:"linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)",
          backgroundSize:"24px 24px",
        }} />

        {/* ── Brand ─────────────────────────────────────── */}
        <div style={{position:"relative",zIndex:1,padding: collapsed ? "20px 12px 16px" : "20px 16px 16px", flexShrink:0}}>
          <Link href="/dashboard" style={{display:"flex",alignItems:"center",gap:12,textDecoration:"none",minWidth:0}}>
            {/* Logo */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              height:42, width:42, flexShrink:0,
              borderRadius:14,
              background:"linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
              boxShadow:"0 4px 20px rgba(245,158,11,0.4), 0 0 0 1px rgba(245,158,11,0.2)",
              transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1.1) rotate(8deg)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="scale(1) rotate(0deg)";}}
            >
              <Lock style={{width:19, height:19, color:"#1e293b", strokeWidth:2.5}} />
            </div>

            {!collapsed && (
              <div style={{minWidth:0, overflow:"hidden", animation:"navItemIn 0.3s ease both"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:800,fontSize:16,color:"#f8fafc",letterSpacing:"-0.02em",whiteSpace:"nowrap"}}>
                    {appName}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{
                    display:"inline-flex",alignItems:"center",gap:4,
                    borderRadius:999, background:"rgba(245,158,11,0.12)",
                    border:"1px solid rgba(245,158,11,0.25)",
                    padding:"2px 8px", fontSize:9, fontWeight:700, color:"#fbbf24", whiteSpace:"nowrap",
                  }}>
                    <Zap style={{width:8,height:8,fill:"#fbbf24"}} />
                    v1.3.0 E2EE
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Divider */}
        <div style={{
          margin: "0 14px 10px",
          height:1, flexShrink:0,
          background:"linear-gradient(90deg,transparent,rgba(100,116,139,0.3),transparent)",
        }} />

        {/* ── Nav Links ─────────────────────────────────── */}
        <nav style={{flex:1, overflowY:"auto", overflowX:"hidden", padding:"4px 10px 8px", position:"relative", zIndex:1}}
          className="no-scrollbar"
        >
          {!collapsed && (
            <p style={{
              padding:"0 6px 8px", fontSize:9, fontWeight:700, letterSpacing:"0.12em",
              textTransform:"uppercase", color:"rgba(100,116,139,0.6)", userSelect:"none",
              animation:"navItemIn 0.25s ease both",
            }}>
              Navigation
            </p>
          )}

          {navLinks.map((item, i) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + "/"));
            const isHov = hovered === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                className="nav-item-anim"
                style={{
                  display:"flex", alignItems:"center",
                  gap: collapsed ? 0 : 11,
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius:12, padding: collapsed ? "11px 0" : "10px 12px",
                  marginBottom:3, textDecoration:"none",
                  position:"relative", overflow:"visible",
                  border: active ? "1px solid rgba(245,158,11,0.22)" : "1px solid transparent",
                  background: active
                    ? "linear-gradient(90deg,rgba(245,158,11,0.12),rgba(245,158,11,0.06))"
                    : isHov
                    ? "rgba(30,41,59,0.7)"
                    : "transparent",
                  transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  animationDelay: `${i * 0.04}s`,
                  boxShadow: active ? "0 0 14px rgba(245,158,11,0.08)" : "none",
                }}
              >
                {/* Active left bar */}
                {active && !collapsed && (
                  <span style={{
                    position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
                    height:18, width:3, borderRadius:"0 4px 4px 0",
                    background:"linear-gradient(180deg,#fbbf24,#f59e0b)",
                    boxShadow:"0 0 8px rgba(245,158,11,0.6)",
                  }} />
                )}

                {/* Icon with glow on active */}
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"center",
                  width: collapsed ? 24 : 20, height: collapsed ? 24 : 20,
                  flexShrink:0,
                  filter: active ? "drop-shadow(0 0 6px rgba(245,158,11,0.5))" : "none",
                  transition:"filter 0.2s ease, transform 0.2s ease",
                  transform: isHov && !active ? "scale(1.12)" : "scale(1)",
                }}>
                  <Icon style={{
                    width: collapsed ? 20 : 17, height: collapsed ? 20 : 17,
                    color: active ? "#fbbf24" : isHov ? "#e2e8f0" : "#64748b",
                    strokeWidth: 2,
                    transition:"color 0.2s ease",
                  }} />
                </div>

                {!collapsed && (
                  <span style={{
                    flex:1, fontSize:13, fontWeight: active ? 600 : 500,
                    color: active ? "#fde68a" : isHov ? "#f1f5f9" : "#94a3b8",
                    letterSpacing:"-0.01em", lineHeight:1, whiteSpace:"nowrap",
                    transition:"color 0.2s ease",
                  }}>
                    {item.label}
                  </span>
                )}

                {!collapsed && (item as any).badge && (
                  <span style={{
                    borderRadius:999, background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)",
                    padding:"2px 8px", fontSize:9, fontWeight:700, color:"#f87171", flexShrink:0,
                  }}>
                    {(item as any).badge}
                  </span>
                )}

                {/* Tooltip (collapsed only) */}
                {collapsed && (
                  <span style={{
                    position:"absolute", left:"calc(100% + 10px)", top:"50%", transform:"translateY(-50%)",
                    zIndex:999, background:"rgba(15,23,42,0.98)", border:"1px solid rgba(51,65,85,0.9)",
                    borderRadius:10, padding:"7px 14px", fontSize:12, fontWeight:500,
                    color:"#e2e8f0", whiteSpace:"nowrap",
                    boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
                    opacity: isHov ? 1 : 0,
                    transition:"opacity 0.15s ease",
                    pointerEvents:"none",
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{
          margin:"0 14px 10px", height:1, flexShrink:0,
          background:"linear-gradient(90deg,transparent,rgba(100,116,139,0.25),transparent)",
        }} />

        {/* ── Bottom Controls ───────────────────────────── */}
        <div style={{
          display:"flex", flexDirection:"column", gap:8,
          padding: collapsed ? "0 10px 16px" : "0 12px 16px",
          flexShrink:0, position:"relative", zIndex:1,
          alignItems: collapsed ? "center" : "stretch",
        }}>
          {/* Language */}
          {!collapsed ? (
            <div style={{
              display:"flex", borderRadius:10, overflow:"hidden",
              border:"1px solid rgba(51,65,85,0.6)", background:"rgba(15,23,42,0.6)",
            }}>
              {(["en","hi"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex:1, padding:"7px 4px", fontSize:11, fontWeight:700,
                  cursor:"pointer", border:"none", outline:"none",
                  background: lang===l ? "linear-gradient(135deg,#f59e0b,#d97706)" : "transparent",
                  color: lang===l ? "#1e293b" : "#64748b",
                  transition:"all 0.2s ease",
                  borderRadius: lang===l ? 8 : 0,
                }}>
                  {l === "en" ? "EN" : "हि"}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setLang(lang==="en"?"hi":"en")}
              title="Toggle Language"
              style={{
                display:"flex", alignItems:"center", justifyContent:"center",
                height:36, width:36, borderRadius:10, cursor:"pointer",
                border:"1px solid rgba(51,65,85,0.6)", background:"rgba(15,23,42,0.6)",
                fontSize:10, fontWeight:700, color:"#94a3b8", transition:"all 0.2s ease",
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="#fbbf24";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="#94a3b8";}}
            >
              {lang==="en"?"हि":"EN"}
            </button>
          )}

          {/* 2FA */}
          <button onClick={() => setTwoFAOpen(true)}
            title="Two-Factor Authentication"
            style={{
              display:"flex", alignItems:"center", gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius:11, padding: collapsed ? "9px" : "9px 12px",
              cursor:"pointer", border:"1px solid rgba(245,158,11,0.18)",
              background:"rgba(245,158,11,0.06)", transition:"all 0.2s ease",
              width: collapsed ? 36 : "100%",
              position:"relative",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(245,158,11,0.14)";(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.4)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(245,158,11,0.06)";(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.18)";}}
          >
            <Smartphone style={{width:16,height:16,color:"#fbbf24",flexShrink:0}} />
            {!collapsed && <span style={{fontSize:12,fontWeight:600,color:"#fde68a"}}>2FA Security</span>}
          </button>

          {/* GitHub */}
          <a href="https://github.com/SudhirDevOps1/BlindShare" target="_blank" rel="noopener noreferrer"
            title="Star on GitHub"
            style={{
              display:"flex", alignItems:"center", gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius:11, padding: collapsed ? "9px" : "9px 12px",
              textDecoration:"none",
              border:"1px solid rgba(51,65,85,0.5)", background:"rgba(15,23,42,0.5)",
              transition:"all 0.2s ease",
              width: collapsed ? 36 : "100%",
            }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(100,116,139,0.7)";(e.currentTarget as HTMLElement).style.background="rgba(30,41,59,0.8)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(51,65,85,0.5)";(e.currentTarget as HTMLElement).style.background="rgba(15,23,42,0.5)";}}
          >
            <GithubIcon className="h-4 w-4" />
            {!collapsed && (
              <>
                <span style={{flex:1,fontSize:12,fontWeight:500,color:"#94a3b8"}}>GitHub</span>
                <span style={{
                  display:"flex",alignItems:"center",gap:3,fontSize:9,fontWeight:700,
                  color:"#fbbf24",background:"rgba(245,158,11,0.1)",
                  padding:"2px 7px",borderRadius:999,border:"1px solid rgba(245,158,11,0.2)",
                }}>
                  <Star style={{width:9,height:9,fill:"#fbbf24"}} /> Star
                </span>
              </>
            )}
          </a>

          {/* Divider */}
          <div style={{height:1,background:"rgba(51,65,85,0.4)",borderRadius:1}} />

          {/* User + Logout */}
          {!collapsed ? (
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Link href="/dashboard/settings" style={{
                display:"flex", flex:1, alignItems:"center", gap:10,
                borderRadius:11, padding:"8px 10px", textDecoration:"none",
                border:"1px solid rgba(51,65,85,0.5)", background:"rgba(15,23,42,0.5)",
                transition:"all 0.2s ease", minWidth:0, overflow:"hidden",
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.3)";(e.currentTarget as HTMLElement).style.background="rgba(245,158,11,0.05)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(51,65,85,0.5)";(e.currentTarget as HTMLElement).style.background="rgba(15,23,42,0.5)";}}
              >
                <div style={{
                  display:"flex",alignItems:"center",justifyContent:"center",
                  width:30,height:30,borderRadius:10,flexShrink:0,
                  background:"linear-gradient(135deg,rgba(245,158,11,0.25),rgba(180,83,9,0.15))",
                  border:"1px solid rgba(245,158,11,0.2)",
                }}>
                  <User style={{width:14,height:14,color:"#fbbf24"}} />
                </div>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100,lineHeight:1.2}}>
                    {user?.name || "Account"}
                  </p>
                  <p style={{fontSize:10,color:"#475569",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100,marginTop:2}}>
                    {user?.email || ""}
                  </p>
                </div>
              </Link>
              <button onClick={onLogout} title="Log out" style={{
                display:"flex",alignItems:"center",justifyContent:"center",
                width:38,height:38,borderRadius:11,cursor:"pointer",flexShrink:0,
                border:"1px solid rgba(51,65,85,0.5)",background:"rgba(15,23,42,0.5)",
                transition:"all 0.2s ease",
              }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(127,29,29,0.4)";(e.currentTarget as HTMLElement).style.borderColor="rgba(239,68,68,0.4)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(15,23,42,0.5)";(e.currentTarget as HTMLElement).style.borderColor="rgba(51,65,85,0.5)";}}
              >
                <LogOut style={{width:16,height:16,color:"#64748b",transition:"color 0.2s"}} />
              </button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Link href="/dashboard/settings" title={user?.name || "Settings"} style={{
                display:"flex",alignItems:"center",justifyContent:"center",
                width:36,height:36,borderRadius:10,textDecoration:"none",
                border:"1px solid rgba(51,65,85,0.5)",background:"rgba(15,23,42,0.5)",
                transition:"all 0.2s ease",
              }}>
                <User style={{width:16,height:16,color:"#fbbf24"}} />
              </Link>
              <button onClick={onLogout} title="Log out" style={{
                display:"flex",alignItems:"center",justifyContent:"center",
                width:36,height:36,borderRadius:10,cursor:"pointer",
                border:"1px solid rgba(51,65,85,0.5)",background:"rgba(15,23,42,0.5)",
                transition:"all 0.2s ease",
              }}>
                <LogOut style={{width:16,height:16,color:"#64748b"}} />
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse Toggle ───────────────────────────── */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            position:"absolute", right:-13, top:72, zIndex:20,
            display:"flex", alignItems:"center", justifyContent:"center",
            width:26, height:26, borderRadius:"50%",
            background:"linear-gradient(135deg,#1e293b,#0f172a)",
            border:"1px solid rgba(100,116,139,0.4)",
            boxShadow:"0 4px 16px rgba(0,0,0,0.4)",
            cursor:"pointer", transition:"all 0.2s ease",
          }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(245,158,11,0.5)";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(245,158,11,0.2)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="rgba(100,116,139,0.4)";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(0,0,0,0.4)";}}
        >
          {collapsed
            ? <ChevronRight style={{width:13,height:13,color:"#94a3b8"}} />
            : <ChevronLeft  style={{width:13,height:13,color:"#94a3b8"}} />
          }
        </button>
      </aside>

      <TwoFactorModal isOpen={twoFAOpen} onClose={() => setTwoFAOpen(false)} />
    </>
  );
}
