"use client";

import React from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { BrandIcon } from "./brand-icon";
import { ShieldCheck, Heart, Lock, Code2, ServerOff, Star, Scale, Globe } from "lucide-react";
import {
  loadDeveloperProfile,
  fetchDeveloperProfileFromDb,
  DEVELOPER_PROFILE_EVENT,
  DeveloperProfile,
  SOCIAL_PLATFORMS_META,
  SocialPlatformKey,
} from "@/lib/developer-profile";

import { renderRealSocialIcon, GithubIcon } from "@/components/social-icons";

export function BrandFooter() {
  const { t, appName, lang, setLang } = useI18n();
  const [devProfile, setDevProfile] = React.useState<DeveloperProfile>(loadDeveloperProfile);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const syncProfile = () => {
        setDevProfile(loadDeveloperProfile());
      };
      syncProfile();
      fetchDeveloperProfileFromDb().then((dbProfile) => {
        if (dbProfile) setDevProfile(dbProfile);
      });
      window.addEventListener(DEVELOPER_PROFILE_EVENT, syncProfile);
      return () => window.removeEventListener(DEVELOPER_PROFILE_EVENT, syncProfile);
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
                  href={devProfile.url || devProfile.platforms?.github?.url || "https://github.com/SudhirDevOps1"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors ml-0.5"
                >
                  {devProfile.name}
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {devProfile.tagline || "Lead Creator & Maintainer • Zero-Knowledge Vault"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SOCIAL_PLATFORMS_META.map((meta) => {
              const platform = devProfile.platforms[meta.key];
              if (!platform || !platform.enabled || !platform.url.trim()) return null;
              return (
                <a
                  key={meta.key}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-xl border ${meta.badgeBorder} ${meta.badgeBg} px-3 py-1.5 text-[11px] font-semibold ${meta.badgeText} transition shadow-sm hover:-translate-y-0.5`}
                  title={`${devProfile.name} on ${meta.name}`}
                >
                  {renderRealSocialIcon(meta.key, `h-3.5 w-3.5 ${meta.colorClass}`)}
                  <span>{meta.name}</span>
                </a>
              );
            })}
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
