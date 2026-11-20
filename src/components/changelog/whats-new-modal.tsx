"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
  Tag,
  Palette,
  Lock,
  GitBranch,
} from "lucide-react";
import { RELEASES_HISTORY, ReleaseNote } from "@/lib/changelog";
import { useI18n } from "@/lib/i18n/context";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVersion?: string;
}

export function WhatsNewModal({ isOpen, onClose, initialVersion }: WhatsNewModalProps) {
  const { lang } = useI18n();
  const isHi = lang === "hi";

  const [selectedVersion, setSelectedVersion] = useState<string>(
    initialVersion || RELEASES_HISTORY[0]?.version || "0.1.2"
  );

  useEffect(() => {
    if (initialVersion) {
      setSelectedVersion(initialVersion);
    }
  }, [initialVersion]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRelease: ReleaseNote =
    RELEASES_HISTORY.find((r) => r.version === selectedVersion) || RELEASES_HISTORY[0];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "branding":
        return <Palette className="h-4 w-4 text-amber-400" />;
      case "security":
        return <Shield className="h-4 w-4 text-emerald-400" />;
      case "performance":
        return <Zap className="h-4 w-4 text-sky-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl shadow-black/80 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="whats-new-title" className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                {isHi ? "नया क्या है और चेंजलॉग" : "What's New & Changelog"}
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                  v{currentRelease.version}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {isHi ? "हाल ही में जोड़े गए फीचर्स और सुरक्षा अपडेट्स" : "Recently shipped features, security hardening, and fixes"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Version Switcher Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800/60 bg-slate-950/30 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {isHi ? "रिलीज़:" : "Releases:"}
          </span>
          {RELEASES_HISTORY.map((rel) => {
            const isSelected = rel.version === selectedVersion;
            return (
              <button
                key={rel.version}
                onClick={() => setSelectedVersion(rel.version)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                }`}
              >
                <span>v{rel.version}</span>
                {rel.isLatest && (
                  <span className={`text-[9px] px-1 rounded uppercase tracking-wider font-extrabold ${isSelected ? "bg-slate-950/20 text-slate-950" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                    {isHi ? "ताज़ा" : "Latest"}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Release Title & Date Card */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {isHi ? currentRelease.titleHi : currentRelease.titleEn}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {currentRelease.date}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              {isHi ? currentRelease.bannerHeadlineHi : currentRelease.bannerHeadlineEn}
            </p>
          </div>

          {/* Key Highlights */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {isHi ? "प्रमुख विशेषताएं" : "Key Highlights"}
            </h4>
            <div className="grid gap-2">
              {(isHi ? currentRelease.highlightsHi : currentRelease.highlightsEn).map((hl, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-slate-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{hl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categorized Details */}
          {currentRelease.categories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                {getCategoryIcon(cat.category)}
                {isHi ? cat.titleHi : cat.titleEn}
              </h4>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
                {(isHi ? cat.itemsHi : cat.itemsEn).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Zero-Knowledge Invariant Reminder */}
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {isHi
                ? "सभी फीचर्स में 100% ज़ीरो-नॉलेज गारंटी बनी रहती है: सर्वर कभी भी आपके दस्तावेज़ या डिक्रिप्शन कीज़ नहीं देखता।"
                : "All features adhere strictly to our Zero-Knowledge guarantee: the server never sees unencrypted documents or decryption keys."}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-5 py-3 bg-slate-950/60 text-xs">
          <a
            href={`https://github.com/SudhirDevOps1/BlindShare/releases/tag/${currentRelease.tag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>{isHi ? "गिटहब रिलीज़ नोट्स" : "GitHub Release Notes"}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition"
          >
            {isHi ? "समझ गया" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
