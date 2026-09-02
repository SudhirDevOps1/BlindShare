"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { CryptoInteractiveDemo } from "@/components/landing/crypto-interactive-demo";
import { FeaturesShowcase } from "@/components/landing/features-showcase";
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

export default function HomePage() {
  const { t, appName } = useI18n();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
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
              <span className="text-slate-300">₹0 Free Tier</span>
              <span className="text-amber-500">•</span>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-400 hover:underline"
              >
                <span>⭐ Open Source on GitHub (MIT)</span>
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
                <span>Sign In / Genesis Admin</span>
              </Link>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all backdrop-blur-xl hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-1.5">⭐ Star on GitHub</span>
              </a>
            </div>

            {/* Invariant Highlights */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3.5 text-left">
              {[
                { title: t.hero.bullet1, desc: "WebCrypto in-browser", icon: Lock },
                { title: t.hero.bullet2, desc: "10s buffered flushes", icon: BarChart3 },
                { title: t.hero.bullet3, desc: "Server is blind courier", icon: ServerOff },
                { title: t.hero.bullet4, desc: "Rebrandable via ENV", icon: Globe },
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

            {/* Live Interactive Zero-Knowledge Simulator */}
            <div className="pt-10">
              <CryptoInteractiveDemo />
            </div>
          </div>
        </section>

        {/* Zero-Knowledge Flow Diagram Section */}
        <section id="security" className="border-t border-slate-900/80 bg-slate-950/70 py-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Zero-Knowledge Guarantee</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">How Zero-Knowledge Document Sharing Works</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                Unlike ordinary document sharing platforms which store plaintext PDFs on their servers, BlindShare encrypts your document with WebCrypto AES-GCM before it ever leaves your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Step 1 */}
              <div className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold text-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Client-Side Encryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your browser creates a random 256-bit AES-GCM DocKey. The PDF ArrayBuffer is encrypted locally. Only ciphertext is sent to the server.
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
                <h3 className="text-base font-bold text-white">The Fragment Key (#k=...)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The generated link embeds the key in the URL fragment <code className="text-amber-400 font-mono">#k=...</code>. By web standard RFC 3986, browsers NEVER transmit fragments over HTTP requests.
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
                <h3 className="text-base font-bold text-white">In-Browser Decryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The viewer's browser pulls ciphertext from storage and decrypts it directly in memory, rendering via Mozilla PDF.js with live watermark overlays.
                </p>
                <div className="rounded-xl bg-slate-950/80 p-3 font-mono text-[11px] text-emerald-300 border border-slate-800">
                  pdf.js + Dynamic Watermark
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 sm:px-6 border-t border-slate-900">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300">
                <Zap className="h-3.5 w-3.5" />
                <span>Enterprise Suite</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Enterprise Power-Sharing Features</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                All the enterprise security gates and analytics, without subscription fees or brand lock-in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: BarChart3,
                  title: "Per-Page Dwell Sparklines",
                  desc: "Track exact seconds spent on each page, scroll depth, and completion rate with batch buffered heartbeats.",
                },
                {
                  icon: ShieldCheck,
                  title: "Dynamic Live Watermark",
                  desc: "Overlay viewer email, timestamp, and unique link token diagonally across pages as an anti-leak deterrent.",
                },
                {
                  icon: Key,
                  title: "PBKDF2 Password Wrap",
                  desc: "Double crypto-gate: 250k PBKDF2 iterations wrap the DocKey so even server admins cannot inspect documents.",
                },
                {
                  icon: FolderLock,
                  title: "Curated Datarooms",
                  desc: "Bundle multi-document pitch packs with custom NDAs, permission matrix, and consolidated analytics.",
                },
                {
                  icon: Layers,
                  title: "Seamless Versioning",
                  desc: "Re-upload new versions of your pitch deck without breaking your existing share links.",
                },
                {
                  icon: Zap,
                  title: "Real-time Push Notifications",
                  desc: "Receive instant Web Push alerts the moment an investor or client opens your link.",
                },
              ].map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="glass-card rounded-2xl p-6 space-y-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Deep Interactive Features & Security Showcase */}
        <section className="border-t border-slate-900/80 bg-slate-950/60">
          <FeaturesShowcase />
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
