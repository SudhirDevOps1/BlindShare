"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ShieldCheck, Cookie, Settings2, Check, X } from "lucide-react";

export interface CookieConsentState {
  necessary: boolean;
  analytics: boolean;
  decidedAt: string;
}

const STORAGE_KEY = "blindshare_cookie_consent_v1";

export function CookieConsentBanner() {
  const { lang, appName } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Show after a brief delay for clean page load
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveConsent = (analytics: boolean) => {
    const consent: CookieConsentState = {
      necessary: true,
      analytics,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      window.dispatchEvent(new CustomEvent("blindshare-consent-updated", { detail: consent }));
    } catch {
      // Storage blocked or private mode
    }
    setVisible(false);
    setShowPreferences(false);
  };

  if (!mounted || !visible) return null;

  const isHindi = lang === "hi";

  return (
    <>
      {/* Floating Bottom GDPR Banner */}
      <aside
        aria-label="Cookie and Privacy Consent"
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-300 sm:bottom-6"
      >
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">
                    {isHindi ? "गोपनीयता और डेटा सुरक्षा विकल्प" : "Privacy & Data Protection Preferences"}
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <Check className="h-3 w-3" />
                    {isHindi ? "जीरो-नॉलेज" : "Zero-Knowledge"}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {isHindi ? (
                    <>
                      {appName} कभी भी आपके दस्तावेज़ या एन्क्रिप्शन कुंजियाँ ट्रैक नहीं करता। हम केवल आवश्यक सत्र कुकीज़
                      और शून्य-ट्रैकिंग टेलीमेट्री का उपयोग करते हैं।{" "}
                      <Link href="/privacy" className="text-amber-400 underline hover:text-amber-300">
                        गोपनीयता नीति
                      </Link>{" "}
                      और{" "}
                      <Link href="/privacy#subprocessors" className="text-amber-400 underline hover:text-amber-300">
                        सब-प्रोसेसर
                      </Link>{" "}
                      देखें।
                    </>
                  ) : (
                    <>
                      {appName} never collects document plaintext or decryption keys. We only use strictly necessary
                      session tokens and opt-in zero-cookie telemetry. Learn more in our{" "}
                      <Link href="/privacy" className="text-amber-400 underline hover:text-amber-300">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy#subprocessors" className="text-amber-400 underline hover:text-amber-300">
                        Sub-processors
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                <Settings2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{isHindi ? "पसंद बदलें" : "Customize"}</span>
              </button>

              <button
                type="button"
                onClick={() => saveConsent(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                {isHindi ? "केवल आवश्यक" : "Decline Non-Essential"}
              </button>

              <button
                type="button"
                onClick={() => saveConsent(true)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                {isHindi ? "सभी स्वीकार करें" : "Accept All"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-amber-400">
                  <Cookie className="h-4 w-4" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {isHindi ? "कुकी और गोपनीयता प्राथमिकताएं" : "Cookie & Privacy Preferences"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* Category 1: Strictly Necessary */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white">
                      {isHindi ? "अत्यावश्यक कुकीज़ (Strictly Necessary)" : "Strictly Necessary"}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {isHindi
                        ? "लॉगिन सत्र, HMAC टोकन, और ALTCHA बॉट सुरक्षा। अक्षम नहीं किया जा सकता।"
                        : "Required for login authentication sessions, HMAC verification, and ALTCHA bot protection."}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {isHindi ? "सदा सक्रिय" : "Always Active"}
                  </span>
                </div>
              </div>

              {/* Category 2: Zero-Cookie Analytics */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <span className="text-xs font-semibold text-white">
                      {isHindi ? "शून्य-कुकी टेलीमेट्री और प्रदर्शन" : "Zero-Cookie Telemetry & Metrics"}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {isHindi
                        ? "अज्ञात पेजव्यू मेट्रिक्स। कोई व्यक्तिगत पहचान या ट्रैकर कुकी नहीं बनाई जाती।"
                        : "Anonymous performance and pageview telemetry. No tracking cookies or advertising profiles."}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={analyticsOptIn}
                      onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="peer h-5 w-9 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-slate-400 after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:bg-slate-950 peer-focus:outline-none" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => saveConsent(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {isHindi ? "केवल आवश्यक सहेजें" : "Save Essential Only"}
              </button>
              <button
                type="button"
                onClick={() => saveConsent(analyticsOptIn)}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
              >
                {isHindi ? "प्राथमिकताएं सहेजें" : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
