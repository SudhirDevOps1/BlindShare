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

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function renderSocialIcon(key: SocialPlatformKey, className = "h-3.5 w-3.5") {
  switch (key) {
    case "github":
      return <GithubIcon className={className} />;
    case "twitter":
      return <TwitterIcon className={className} />;
    case "instagram":
      return <InstagramIcon className={className} />;
    case "discord":
      return <DiscordIcon className={className} />;
    case "linkedin":
      return <LinkedinIcon className={className} />;
    case "youtube":
      return <YoutubeIcon className={className} />;
    case "telegram":
      return <TelegramIcon className={className} />;
    case "facebook":
      return <FacebookIcon className={className} />;
    case "portfolio":
      return <Globe className={className} />;
    default:
      return <Globe className={className} />;
  }
}

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
                  {renderSocialIcon(meta.key, `h-3.5 w-3.5 ${meta.colorClass}`)}
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
