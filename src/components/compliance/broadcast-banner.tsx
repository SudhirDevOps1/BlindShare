"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Megaphone, X, ArrowRight } from "lucide-react";
import { getLatestRelease } from "@/lib/changelog";
import { APP_VERSION } from "@/lib/version";
import { useI18n } from "@/lib/i18n/context";
import { WhatsNewModal } from "@/components/changelog/whats-new-modal";

export function BroadcastBanner() {
  const { lang } = useI18n();
  const isHi = lang === "hi";

  const [customBanner, setCustomBanner] = useState<string>("");
  const [isChangelogMode, setIsChangelogMode] = useState(true);
  const [dismissed, setDismissed] = useState(true); // default true until verified
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const latestRelease = getLatestRelease();

  useEffect(() => {
    setMounted(true);

    // Listen to global open event (from Header or Footer)
    const handleOpenModal = () => setModalOpen(true);
    window.addEventListener("open-whats-new", handleOpenModal);

    let isMounted = true;
    fetch("/api/public-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;

        const raw = (data?.broadcast_banner || "").trim();
        // If empty, "auto", "changelog", or the legacy static placeholder, use Changelog Mode
        const isLegacyStatic = raw.includes("WebCrypto AES-GCM-256") || raw.includes("Zero-Knowledge Protected: Secure file sharing");
        const useAutoChangelog = !raw || raw.toLowerCase() === "auto" || raw.toLowerCase() === "changelog" || isLegacyStatic;

        if (useAutoChangelog) {
          setIsChangelogMode(true);
          const key = `blindshare_whatsnew_dismissed_v${APP_VERSION}`;
          const isDismissed = sessionStorage.getItem(key) === "true";
          setDismissed(isDismissed);
        } else {
          setIsChangelogMode(false);
          setCustomBanner(raw);
          const key = "blindshare_banner_dismissed_" + encodeURIComponent(raw);
          const isDismissed = sessionStorage.getItem(key) === "true";
          setDismissed(isDismissed);
        }
      })
      .catch(() => {
        // Fallback to changelog mode on network error
        if (isMounted) {
          setIsChangelogMode(true);
          const key = `blindshare_whatsnew_dismissed_v${APP_VERSION}`;
          setDismissed(sessionStorage.getItem(key) === "true");
        }
      });

    return () => {
      isMounted = false;
      window.removeEventListener("open-whats-new", handleOpenModal);
    };
  }, []);

  if (!mounted) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      if (isChangelogMode) {
        sessionStorage.setItem(`blindshare_whatsnew_dismissed_v${APP_VERSION}`, "true");
      } else {
        sessionStorage.setItem("blindshare_banner_dismissed_" + encodeURIComponent(customBanner), "true");
      }
    } catch {}
  };

  const handleOpenChangelog = () => {
    setModalOpen(true);
  };

  return (
    <>
      {!dismissed && (
        <aside
          aria-label="Platform Announcement"
          onClick={handleOpenChangelog}
          className="relative isolate flex items-center justify-between gap-x-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-3 sm:px-4 py-2 text-xs font-semibold text-slate-950 shadow-md z-40 cursor-pointer select-none group transition-all hover:brightness-105"
        >
          <div className="flex items-center gap-2 mx-auto text-center truncate px-2">
            {isChangelogMode ? (
              <>
                <span className="flex items-center gap-1.5 rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 shadow-sm shrink-0">
                  <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
                  <span>{isHi ? latestRelease.bannerBadgeHi : latestRelease.bannerBadgeEn}</span>
                </span>
                <span className="font-bold tracking-tight text-slate-950 truncate hidden sm:inline">
                  {isHi ? latestRelease.bannerHeadlineHi : latestRelease.bannerHeadlineEn}
                </span>
                <span className="inline-flex items-center gap-1 underline underline-offset-2 font-extrabold text-slate-950 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
                  {isHi ? "चेंजलॉग देखें" : "View Changelog"}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </>
            ) : (
              <>
                <Megaphone className="h-4 w-4 shrink-0 text-slate-950 animate-bounce" />
                <span className="font-bold tracking-wide truncate">{customBanner}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-950/90 underline underline-offset-2 ml-2">
                  {isHi ? "फीचर्स" : "What's New"}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md text-slate-950/80 hover:text-slate-950 hover:bg-black/10 transition shrink-0"
            title="Dismiss announcement"
            aria-label="Dismiss announcement"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </aside>
      )}

      {/* Interactive What's New & Changelog Dialog */}
      <WhatsNewModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialVersion={APP_VERSION}
      />
    </>
  );
}
