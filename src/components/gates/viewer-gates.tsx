"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Lock, Mail, FileCheck, Shield, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

import { AltchaBox } from "@/components/security/altcha-box";

interface ViewerGatesProps {
  slug: string;
  hasPassword: boolean;
  requiresEmail: boolean;
  requiresNda: boolean;
  ndaText: string | null;
  allowedDomains: string | null;
  onVerified: (data: { sessionId: string; viewerIdentity: string; passwordEntered?: string }) => void;
}

export function ViewerGates({
  slug,
  hasPassword,
  requiresEmail,
  requiresNda,
  ndaText,
  allowedDomains,
  onVerified,
}: ViewerGatesProps) {
  const { t, appName } = useI18n();

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [altchaPayload, setAltchaPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (hasPassword && !password.trim()) {
        throw new Error(t.viewer.passwordPrompt);
      }

      if (requiresEmail && (!email.trim() || !email.includes("@"))) {
        throw new Error("Please enter a valid email address.");
      }

      if (requiresNda && !ndaAgreed) {
        throw new Error(t.viewer.ndaRequired);
      }

      const res = await fetch(`/api/v/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password.trim() || undefined,
          email: email.trim() || undefined,
          ndaAgreed,
          altcha: altchaPayload || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      onVerified({
        sessionId: data.sessionId,
        viewerIdentity: data.viewerIdentity,
        passwordEntered: password.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || "Access verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Header Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          {hasPassword ? <Lock className="h-7 w-7" /> : requiresEmail ? <Mail className="h-7 w-7" /> : <FileCheck className="h-7 w-7" />}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-1">
            {hasPassword
              ? t.viewer.passwordTitle
              : requiresEmail
              ? t.viewer.emailTitle
              : t.viewer.ndaTitle}
          </h2>
          <p className="text-xs text-slate-400">
            Protected by {appName} Zero-Knowledge Security
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          {hasPassword && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.viewer.passwordPrompt}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.viewer.passwordPlaceholder}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          {requiresEmail && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {t.viewer.emailPrompt}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.viewer.emailPlaceholder}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {allowedDomains && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Allowed domains: <span className="text-amber-400 font-medium">{allowedDomains}</span>
                </p>
              )}
            </div>
          )}

          {/* NDA Clickwrap Agreement */}
          {requiresNda && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-medium text-slate-300">
                {t.viewer.ndaTitle}
              </label>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] text-slate-400 leading-relaxed">
                {ndaText ||
                  "CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT: By accessing this document, you acknowledge that all materials, data, metrics, and information contained herein are strictly proprietary and confidential. You agree not to disclose, copy, capture, or distribute any part of this document to third parties without prior written consent."}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ndaAgreed}
                  onChange={(e) => setNdaAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-300 select-none">
                  {t.viewer.ndaAgree}
                </span>
              </label>
            </div>
          )}

          {/* ALTCHA Zero-Knowledge Proof-of-Work Bot Defense */}
          <div className="pt-1">
            <AltchaBox onVerify={(payload: string) => setAltchaPayload(payload)} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <span>{hasPassword ? t.viewer.unlock : t.viewer.continueBtn}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>End-to-End Encrypted Session</span>
          </p>
        </div>
      </div>
    </div>
  );
}
