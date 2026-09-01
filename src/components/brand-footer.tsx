"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ShieldCheck, Heart, Lock, Code2, ServerOff, Star, Scale } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function BrandFooter() {
  const { t, appName } = useI18n();

  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-slate-900">
          <div className="space-y-3 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                <Lock className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-white text-sm">{appName}</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 border border-emerald-500/20">
                ₹0 Free-Tier Ready
              </span>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition"
                title="View MIT License"
              >
                <Scale className="h-3 w-3 text-amber-400" />
                <span>MIT Open Source</span>
              </a>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Secure, client-side zero-knowledge document sharing platform with granular per-page reading analytics.
              The server acts solely as a blind courier and never holds unencrypted file bytes.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-700 transition shadow-sm"
              >
                <GithubIcon className="h-4 w-4" />
                <span>GitHub Repository</span>
              </a>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition shadow-sm"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>Star on GitHub</span>
              </a>
            </div>
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
                <a
                  href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <Scale className="h-3 w-3 text-slate-400" />
                  <span>MIT License (Open Source)</span>
                </a>
              </li>
              <li>
                <a href="/api/health" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-1">
                  <span>/healthz Deep Check</span>
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 text-amber-400/90 transition-colors flex items-center gap-1">
                  <span>💬 Contact & Feedback</span>
                </Link>
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
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} {appName}. 100% Free & Open Source under MIT License.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Honest Note: Watermarks & Anti-Download are deterrents, not DRM.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
