"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { CryptoInteractiveDemo } from "@/components/landing/crypto-interactive-demo";
import { FeaturesShowcase } from "@/components/landing/features-showcase";
import { StatsCounter } from "@/components/landing/stats-counter";
import { WorkflowTimeline } from "@/components/landing/workflow-timeline";
import { ArchitectureShowcase } from "@/components/landing/architecture-showcase";
import { CTABanner } from "@/components/landing/cta-banner";
import { TrustBar } from "@/components/landing/trust-bar";
import {
  Lock,
  ShieldCheck,
  Eye,
  FileText,
  BarChart3,
  ServerOff,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  FolderLock,
  Layers,
  Key,
} from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
}

export default function HomePage() {
  const { t, appName } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user?: SessionUser | null }) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:py-28 aurora-bg">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-amber-500/15 blur-[140px] pointer-events-none rounded-full animate-float" />
          <div className="absolute bottom-10 right-10 w-[450px] h-[250px] bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute top-20 left-10 w-[300px] h-[200px] bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-5xl text-center space-y-8">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-xl shadow-lg shadow-amber-500/5 shimmer-badge hover:border-amber-500/50 transition-all">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{t.hero.badge}</span>
              <span className="text-amber-500">•</span>
              <span className="text-slate-300">{t.heroExtras?.freeTier || "₹0 Free Tier"}</span>
              <span className="text-amber-500">•</span>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline"
              >
                <span>{t.heroExtras?.openSource || "⭐ Open Source on GitHub (MIT)"}</span>
              </a>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight sm:leading-none">
              {t.hero.title.split("Deep Reading Analytics")[0]}
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent block sm:inline">
                Deep Reading Analytics
              </span>
            </h1>

            <p className="mx-auto max-w-3xl text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
              {t.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-slate-950 shadow-2xl shadow-amber-500/30 hover:from-amber-400 hover:to-amber-500 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{user ? t.nav.dashboard : t.hero.ctaUpload}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-7 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-800/90 hover:border-slate-600 transition-all backdrop-blur-xl hover:-translate-y-0.5 shadow-lg"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                <span>{t.heroExtras?.signInAdmin || "Sign In / Genesis Admin"}</span>
              </Link>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all backdrop-blur-xl hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-1.5">{t.heroExtras?.starOnGitHub || "⭐ Star on GitHub"}</span>
              </a>
            </div>

            {/* Invariant Highlights */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3.5 text-left">
              {[
                { title: t.hero.bullet1, desc: t.heroExtras?.bullet1Desc || "WebCrypto in-browser", icon: Lock },
                { title: t.hero.bullet2, desc: t.heroExtras?.bullet2Desc || "10s buffered flushes", icon: BarChart3 },
                { title: t.hero.bullet3, desc: t.heroExtras?.bullet3Desc || "Server is blind courier", icon: ServerOff },
                { title: t.hero.bullet4, desc: t.heroExtras?.bullet4Desc || "Rebrandable via ENV", icon: Globe },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="glass-card rounded-2xl p-4 transition-all">
                    <div className="flex items-center gap-2 text-amber-400 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Visual Zero-Knowledge Flow Blueprint */}
            <div className="pt-8 max-w-4xl mx-auto">
              <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900/60 p-3 sm:p-5 backdrop-blur-2xl shadow-2xl shadow-amber-500/10">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {t.heroExtras?.zkBlueprint || "RFC 3986 Zero-Knowledge Architecture"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    {t.heroExtras?.fragmentOnly || "#k=fragment client-only"}
                  </span>
                </div>
                <img
                  src="/brand/17-hero-animated-encryption.svg"
                  alt="BlindShare Zero-Knowledge Encryption Flow Diagram"
                  className="w-full h-auto max-h-[380px] object-contain rounded-xl pointer-events-none"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Live Interactive Zero-Knowledge Simulator */}
            <div className="pt-6">
              <CryptoInteractiveDemo />
            </div>
          </div>
        </section>

        {/* ── Tech Trust Bar ───────────────────────────────────────────── */}
        <TrustBar />

        {/* ── Stats Counter Strip ─────────────────────────────────────── */}
        <StatsCounter />

        {/* Zero-Knowledge Flow Diagram Section */}
        <section id="security" className="border-t border-slate-900/80 bg-slate-950/70 py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t.securitySteps?.badge || "Zero-Knowledge Guarantee"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.securitySteps?.title || "How Zero-Knowledge Document Sharing Works"}</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                {t.securitySteps?.subtitle || "Unlike ordinary document sharing platforms which store plaintext PDFs on their servers, BlindShare encrypts your document with WebCrypto AES-GCM before it ever leaves your browser."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-white">{t.securitySteps?.step1Title || "Client-Side Encryption"}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.securitySteps?.step1Desc || "Your browser creates a random 256-bit AES-GCM DocKey. The PDF ArrayBuffer is encrypted locally. Only ciphertext is sent to the server."}
                </p>
                <div className="rounded-xl bg-slate-950/80 p-3 font-mono text-[11px] text-amber-300 border border-slate-800">
                  AES-GCM-256 (IV: 96-bit)
                </div>
              </div>

              {/* Step 2 */}
              <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold text-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-white">{t.securitySteps?.step2Title || "Zero-Knowledge Courier"}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.securitySteps?.step2Desc || "The server and database store ciphertext chunks and metadata. It never receives the decryption key (#k=...) which lives only in the client URL fragment."}
                </p>
                <div className="rounded-xl bg-slate-950/80 p-3 font-mono text-[11px] text-blue-300 border border-slate-800">
                  /v/code#k=base64url(Key)
                </div>
              </div>

              {/* Step 3 */}
              <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-white">{t.securitySteps?.step3Title || "Recipient Browser Decryption"}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t.securitySteps?.step3Desc || "The recipient loads the page. Their browser extracts #k= from the URL fragment and decrypts the document directly in WebCrypto memory."}
                </p>
                <div className="rounded-xl bg-slate-950/80 p-3 font-mono text-[11px] text-emerald-300 border border-slate-800">
                  pdf.js + Dynamic Watermark
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7-Step Workflow Timeline ─────────────────────────────────── */}
        <WorkflowTimeline />

        {/* ── Zero-Knowledge Architecture & Visual Brand Showcase ──────── */}
        <ArchitectureShowcase />

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 sm:px-6 border-t border-slate-900">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <Zap className="h-3.5 w-3.5" />
                <span>{t.enterpriseFeatures?.badge || "Enterprise Suite"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.enterpriseFeatures?.title || "Enterprise Power-Sharing Features"}</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                {t.enterpriseFeatures?.subtitle || "All the enterprise security gates and analytics, without subscription fees or brand lock-in."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: BarChart3,
                  title: t.enterpriseFeatures?.sparklinesTitle || "Per-Page Dwell Sparklines",
                  desc: t.enterpriseFeatures?.sparklinesDesc || "Track exact seconds spent on each page, scroll depth, and completion rate with batch buffered heartbeats.",
                },
                {
                  icon: ShieldCheck,
                  title: t.enterpriseFeatures?.watermarkTitle || "Dynamic Live Watermark",
                  desc: t.enterpriseFeatures?.watermarkDesc || "Overlay viewer email, timestamp, and unique link token diagonally across pages as an anti-leak deterrent.",
                },
                {
                  icon: Key,
                  title: t.enterpriseFeatures?.passwordWrapTitle || "PBKDF2 Password Wrap",
                  desc: t.enterpriseFeatures?.passwordWrapDesc || "Double crypto-gate: 250k PBKDF2 iterations wrap the DocKey so even server admins cannot inspect documents.",
                },
                {
                  icon: FolderLock,
                  title: t.nav?.datarooms || "Curated Datarooms",
                  desc: "Bundle multi-document pitch packs with custom NDAs, permission matrix, and consolidated analytics.",
                },
                {
                  icon: Layers,
                  title: "Seamless Versioning",
                  desc: "Re-upload new versions of your pitch deck without breaking your existing share links.",
                },
                {
                  icon: Zap,
                  title: t.enterpriseFeatures?.notificationsTitle || "Real-time Push Notifications",
                  desc: t.enterpriseFeatures?.notificationsDesc || "Receive instant Web Push alerts the moment an investor or client opens your link.",
                },
              ].map((feat, i) => {
                const Icon = feat.icon;
                const colors = [
                  "#f59e0b","#10b981","#a78bfa","#60a5fa","#fb923c","#34d399"
                ];
                const col = colors[i % colors.length];
                return (
                  <FeatureCard key={i} feat={feat} color={col} Icon={Icon} />
                );
              })}
            </div>
          </div>
        </section>

        {/* Deep Interactive Features & Security Showcase */}
        <section className="border-t border-slate-900/80 bg-slate-950/60">
          <FeaturesShowcase />
        </section>

        {/* ── Final CTA Banner ─────────────────────────────────────────── */}
        <CTABanner />
      </main>

      <BrandFooter />
    </div>
  );
}

/* 3D-tilt feature card — inline client component */
function FeatureCard({
  feat,
  color,
  Icon,
}: {
  feat: { title: string; desc: string };
  color: string;
  Icon: React.ElementType;
}) {
  const [tilt, setTilt] = React.useState({});
  const [hov,  setHov]  = React.useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    setTilt({ transform: `perspective(600px) rotateX(${-y * 9}deg) rotateY(${x * 11}deg) translateZ(6px) scale(1.01)` });
  };
  const onLeave = () => {
    setTilt({ transform: "perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)" });
    setHov(false);
  };

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setHov(true)}
      style={{
        borderRadius: 20,
        border: `1px solid ${hov ? color + "44" : "rgba(51,65,85,0.4)"}`,
        background: hov
          ? `radial-gradient(circle at 30% 20%, ${color}0e, rgba(12,18,38,0.95))`
          : "rgba(15,23,42,0.7)",
        backdropFilter: "blur(16px)",
        padding: "28px 24px",
        cursor: "default",
        transition: "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease",
        boxShadow: hov
          ? `0 20px 48px -8px ${color}1a, 0 0 0 1px ${color}22`
          : "0 4px 16px rgba(0,0,0,0.25)",
        transformStyle: "preserve-3d",
        ...tilt,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: `${color}14`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
        transform: hov ? "scale(1.1) rotate(6deg)" : "scale(1)",
        boxShadow: hov ? `0 0 18px ${color}35` : "none",
      }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <h3 style={{
        fontSize: 15, fontWeight: 800, color: "#f8fafc",
        letterSpacing: "-0.02em", marginBottom: 10, lineHeight: 1.3,
      }}>
        {feat.title}
      </h3>
      <p style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.65 }}>
        {feat.desc}
      </p>
    </div>
  );
}
