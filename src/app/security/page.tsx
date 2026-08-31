"use client";

import React from "react";
import { BrandHeader } from "@/components/brand-header";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { ShieldAlert, KeyRound, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

const CHECKLIST = [
  "Content-Security-Policy (incl. worker-src 'self' blob: for pdf.js)",
  "Strict-Transport-Security (preload-ready)",
  "X-Content-Type-Options: nosniff",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy (minimal, camera/geolocation/payment/usb denied)",
  "Cross-Origin-Resource-Policy & Cross-Origin-Opener-Policy: same-origin",
  "X-Frame-Options: DENY / frame-ancestors 'none'",
  "X-Robots-Tag noindex on /v/*, /dashboard/*, /admin/*",
  "No-store cache headers on every authenticated route",
];

const CONTROLS = [
  { icon: KeyRound, title: "Password hashing", body: "bcrypt, configurable cost factor (default 12 rounds)." },
  { icon: Lock, title: "Document encryption", body: "Client-side AES-GCM-256 (WebCrypto); server never decrypts." },
  { icon: ShieldAlert, title: "Brute-force defence", body: "Per-account login lockout + per-link password-gate lockout, both with cool-down windows." },
  { icon: CheckCircle2, title: "Input validation", body: "Every API route validates its body against a strict Zod schema before touching the database." },
];

export default function SecurityPage() {
  const { appName } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-10 sm:px-6">
        <header className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>RFC 9116 disclosure contact at /.well-known/security.txt</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Security</h1>
          <p className="text-sm text-slate-400">
            {appName} has <strong className="text-amber-300">not</strong> undergone an external security audit. This
            page summarizes the controls in place today; see <code className="text-amber-300">SECURITY.md</code> in the
            repository for the full disclosure policy.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONTROLS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">{c.title}</h2>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{c.body}</p>
              </div>
            );
          })}
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-base font-bold text-white">Header checklist</h2>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Responsible disclosure</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Found an issue? Please report it privately via the contact in{" "}
            <code className="text-amber-300">/.well-known/security.txt</code> rather than a public issue. We aim to
            acknowledge reports within 72 hours.
          </p>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
