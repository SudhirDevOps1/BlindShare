"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ShieldCheck, Heart, Lock, Code2, ServerOff } from "lucide-react";

export function BrandFooter() {
  const { t, appName } = useI18n();

  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-900">
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-white text-sm">{appName}</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                ₹0 Free-Tier Ready
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Secure, client-side zero-knowledge document sharing platform with granular per-page reading analytics.
              The server acts solely as a blind courier and never holds unencrypted file bytes.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Security & Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-amber-400 transition-colors">
                  {t.nav.privacy} (4-Quadrant Inventory)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-400 transition-colors">
                  {t.nav.terms} & Deterrent Notices
                </Link>
              </li>
              <li>
                <a href="/api/health" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>/healthz Deep Check</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Zero-Knowledge Proof</h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>DocKey in URL Fragment (#k=...)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ServerOff className="h-3.5 w-3.5 text-amber-400" />
                <span>Zero Server Decryption</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-blue-400" />
                <span>WebCrypto AES-GCM-256</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} {appName}. Zero brand lock. Rebrandable via environment tokens.
          </div>
          <div className="flex items-center gap-3">
            <span>Honest Note: Watermarks & Anti-Download are deterrents, not DRM.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
