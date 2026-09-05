"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { BrandIcon } from "./brand-icon";
import { ShieldCheck, Heart, Lock, Code2, ServerOff, Star, Scale, Globe } from "lucide-react";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9m1.4 9.74v-8.37H5.06v8.37z" />
    </svg>
  );
}

export function BrandFooter() {
  const { t, appName, lang, setLang } = useI18n();

  const [devProfile, setDevProfile] = React.useState({
    name: process.env.NEXT_PUBLIC_DEVELOPER_NAME || "SudhirDevOps1",
    url: process.env.NEXT_PUBLIC_DEVELOPER_URL || "https://github.com/SudhirDevOps1",
    github: process.env.NEXT_PUBLIC_DEVELOPER_GITHUB || "https://github.com/SudhirDevOps1",
    twitter: process.env.NEXT_PUBLIC_DEVELOPER_TWITTER || "",
    linkedin: process.env.NEXT_PUBLIC_DEVELOPER_LINKEDIN || "",
    portfolio: process.env.NEXT_PUBLIC_DEVELOPER_PORTFOLIO || "",
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const loadProfile = () => {
        try {
          const raw = localStorage.getItem("blindshare_custom_developer_profile");
          if (raw) {
            const parsed = JSON.parse(raw);
            setDevProfile((prev) => ({
              name: parsed.name || prev.name,
              url: parsed.url || prev.url,
              github: parsed.github || prev.github,
              twitter: parsed.twitter !== undefined ? parsed.twitter : prev.twitter,
              linkedin: parsed.linkedin !== undefined ? parsed.linkedin : prev.linkedin,
              portfolio: parsed.portfolio !== undefined ? parsed.portfolio : prev.portfolio,
            }));
          }
        } catch {}
      };
      loadProfile();
      window.addEventListener("blindshare-devprofile-updated", loadProfile);
      return () => window.removeEventListener("blindshare-devprofile-updated", loadProfile);
    }
  }, []);

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400 text-xs backdrop-blur-xl relative z-10">
      {/* Top ambient highlight line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          <div className="space-y-4 md:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="inline-block transition-opacity hover:opacity-90">
                <img
                  src="/brand/01-logo-full.svg"
                  alt="BlindShare Logo"
                  className="h-10 w-auto object-contain rounded-lg border border-slate-800/80 bg-slate-950/60 p-1 shadow-sm"
                />
              </Link>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shadow-sm">
                ₹0 Free-Tier Ready
              </span>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition shadow-sm"
                title="View MIT License"
              >
                <Scale className="h-3 w-3 text-amber-400" />
                <span>MIT Open Source</span>
              </a>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Enterprise-Grade, client-side Zero-Knowledge document sharing platform with granular per-page reading analytics.
              The server acts strictly as a blind courier and never holds unencrypted file bytes or decryption keys.
            </p>

            {/* Live Operational Status */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-1.5 text-[11px] text-emerald-300 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">All Systems Operational · Zero-Knowledge Cryptography Invariant Active</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 hover:border-amber-500/40 transition-all shadow-md hover:-translate-y-0.5"
              >
                <GithubIcon className="h-4 w-4" />
                <span>GitHub Repository</span>
              </a>
              <a
                href="https://github.com/SudhirDevOps1/BlindShare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all shadow-md hover:-translate-y-0.5"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>Star on GitHub</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3.5">Security & Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="hover:text-amber-300 text-slate-300 transition-colors flex items-center gap-1.5">
                  <span>{t.nav.privacy} (4-Quadrant)</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-300 text-slate-300 transition-colors flex items-center gap-1.5">
                  <span>{t.nav.terms} & Deterrent Notices</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/SudhirDevOps1/BlindShare/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Scale className="h-3.5 w-3.5 text-slate-400" />
                  <span>MIT License (Open Source)</span>
                </a>
              </li>
              <li>
                <a href="/api/health" target="_blank" className="hover:text-amber-300 text-slate-300 transition-colors flex items-center gap-1.5">
                  <span>/healthz Deep Check</span>
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-300 text-amber-400/90 font-medium transition-colors flex items-center gap-1.5">
                  <span>💬 Contact & Feedback</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3.5">Zero-Knowledge Proofs</h4>
            <ul className="space-y-2.5 text-slate-300 text-[11px]">
              <li className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span>DocKey in URL Fragment (#k=...)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                  <ServerOff className="h-3.5 w-3.5" />
                </div>
                <span>Zero Server Decryption Invariant</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-500/10 text-blue-400">
                  <Code2 className="h-3.5 w-3.5" />
                </div>
                <span>WebCrypto AES-GCM-256 Engine</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Architect & Developer Branding Card */}
        <div className="mt-8 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-200">
                <span>Architected &amp; Developed with</span>
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span>by</span>
                <a
                  href={devProfile.url || devProfile.github || "https://github.com/SudhirDevOps1"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors ml-0.5"
                >
                  {devProfile.name}
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Lead Creator &amp; Maintainer • Zero-Knowledge Document Vault Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {devProfile.github && (
              <a
                href={devProfile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition shadow-sm"
                title={`${devProfile.name} on GitHub`}
              >
                <GithubIcon className="h-3.5 w-3.5 text-slate-300" />
                <span>GitHub</span>
              </a>
            )}
            {devProfile.twitter && (
              <a
                href={devProfile.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-white hover:border-sky-500/50 hover:bg-slate-800 transition shadow-sm"
                title={`${devProfile.name} on X / Twitter`}
              >
                <TwitterIcon className="h-3.5 w-3.5 text-sky-400" />
                <span>X / Twitter</span>
              </a>
            )}
            {devProfile.linkedin && (
              <a
                href={devProfile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:text-white hover:border-blue-500/50 hover:bg-slate-800 transition shadow-sm"
                title={`${devProfile.name} on LinkedIn`}
              >
                <LinkedinIcon className="h-3.5 w-3.5 text-blue-400" />
                <span>LinkedIn</span>
              </a>
            )}
            {devProfile.portfolio && (
              <a
                href={devProfile.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition shadow-sm"
                title={`${devProfile.name} Portfolio`}
              >
                <Globe className="h-3.5 w-3.5 text-amber-400" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} {appName} v1.4.0. 100% Free & Open Source under MIT License.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Honest Note: Watermarks & Anti-Download are deterrents, not DRM.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
