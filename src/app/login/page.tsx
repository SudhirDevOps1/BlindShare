"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { BrandIcon } from "@/components/brand-icon";
import { BrandFooter } from "@/components/brand-footer";
import { useI18n } from "@/lib/i18n/context";
import { Lock, Mail, User, Key, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PasswordStrengthMeter, evaluatePassword } from "@/components/auth/password-strength";
import { unlockOwnerVault, syncVaultDocumentKeys } from "@/lib/vault/master-vault";
import { AltchaBox } from "@/components/security/altcha-box";

export default function LoginPage({ defaultRegister = false }: { defaultRegister?: boolean }) {
  const router = useRouter();
  const { t, appName } = useI18n();

  const [isRegister, setIsRegister] = useState(defaultRegister);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedPasswordFor2fa, setSavedPasswordFor2fa] = useState("");
  const [savedSaltFor2fa, setSavedSaltFor2fa] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altchaPayload, setAltchaPayload] = useState<string | null>(null);

  // 2FA Challenge state
  const [require2fa, setRequire2fa] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const [bootstrap, setBootstrap] = useState<{
    mode: "setup" | "normal";
    inviteRequired: boolean;
    placeholderEmail: string | null;
    placeholderPassword: string | null;
    hint: string;
  } | null>(null);

  useEffect(() => {
    // Check URL parameters for signup/register
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("register") === "true" || params.get("signup") === "true" || window.location.pathname.includes("signup")) {
        setIsRegister(true);
      }
    }

    fetch("/api/auth/bootstrap")
      .then((r) => r.json())
      .then((d) => {
        setBootstrap(d);
        // If database is completely fresh and not specified, default to Create Account mode
        if (d.mode === "setup") {
          setIsRegister(true);
        }
      })
      .catch(() => {});
  }, []);

  const inviteRequired = bootstrap?.inviteRequired !== false;

  const useSeededAdmin = () => {
    if (!bootstrap?.placeholderEmail) return;
    setIsRegister(false);
    setEmail(bootstrap.placeholderEmail);
    setPassword(bootstrap.placeholderPassword || "");
    setError(null);
  };

  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!twoFactorCode) {
      setError(useBackupCode ? "Please enter an 8-character backup code" : "Please enter the 6-digit authenticator code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          code: twoFactorCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.expired) {
          setRequire2fa(false);
          setTempToken("");
          setTwoFactorCode("");
        }
        throw new Error(data.error || "2FA verification failed");
      }

      if (savedPasswordFor2fa && (data.user?.masterKeySaltHex || savedSaltFor2fa)) {
        await unlockOwnerVault(savedPasswordFor2fa, data.user?.masterKeySaltHex || savedSaltFor2fa).catch(() => {});
        try {
          const [resDocs, resLinks] = await Promise.all([fetch("/api/docs"), fetch("/api/links")]);
          const docsJson = await resDocs.json().catch(() => ({}));
          const linksJson = await resLinks.json().catch(() => ({}));
          await syncVaultDocumentKeys(docsJson.documents || [], linksJson.links || []);
        } catch {}
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If in Register mode, enforce minimum password policy before submitting
    if (isRegister) {
      const minLen = 8;
      const rules = evaluatePassword(password, minLen);
      const unmet = rules.filter((r) => !r.met);
      if (unmet.length > 0) {
        setError(`Password does not meet policy: ${unmet.map((r) => r.label).join(", ")}`);
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { email, password, name, inviteCode: inviteCode.trim() || undefined }
        : { email, password, altcha: altchaPayload || undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Check if 2FA is required for this account
      if (data.require2fa) {
        setRequire2fa(true);
        setTempToken(data.tempToken);
        setSavedPasswordFor2fa(password);
        setSavedSaltFor2fa(data.masterKeySaltHex || "");
        setTwoFactorCode("");
        return;
      }

      // Unlock Zero-Knowledge Master Vault and auto-unwrap all documents & links like Proton/Bitwarden
      if (data.user?.masterKeySaltHex) {
        await unlockOwnerVault(password, data.user.masterKeySaltHex).catch(() => {});
        try {
          const [resDocs, resLinks] = await Promise.all([fetch("/api/docs"), fetch("/api/links")]);
          const docsJson = await resDocs.json().catch(() => ({}));
          const linksJson = await resLinks.json().catch(() => ({}));
          await syncVaultDocumentKeys(docsJson.documents || [], linksJson.links || []);
        } catch {}
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <BrandHeader />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {/* Top Brand Logo Icon */}
          <BrandIcon size="xl" className="mx-auto mb-4" />

          {/* Segmented Sign In / Create Account Switcher */}
          {!require2fa && (
            <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  !isRegister
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  isRegister
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              {require2fa
                ? "Two-Factor Verification"
                : isRegister
                ? "Create Platform Account"
                : "Sign In to " + appName}
            </h2>
            <p className="text-xs text-slate-400">
              {require2fa
                ? "Enter the 6-digit code from your authenticator app"
                : "Zero-Knowledge Secure Document Sharing"}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {require2fa ? (
            <form onSubmit={handle2faSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {useBackupCode ? "Emergency Backup Recovery Code:" : "6-Digit Authenticator Code:"}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder={useBackupCode ? "a1b2-c3d4" : "000000"}
                  value={twoFactorCode}
                  maxLength={useBackupCode ? 16 : 6}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className={`w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-center text-amber-400 font-mono focus:border-amber-500 focus:outline-none ${
                    useBackupCode ? "text-base tracking-widest" : "text-xl tracking-[0.4em]"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !twoFactorCode}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition shadow-lg shadow-amber-500/10"
              >
                <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-slate-400 hover:text-amber-300 transition"
                >
                  {useBackupCode ? "Use Authenticator App" : "Use Backup Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRequire2fa(false);
                    setTempToken("");
                    setTwoFactorCode("");
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-white transition"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              {bootstrap?.mode === "setup" && (
                <div className="mb-4 space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-200">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>First-Run Genesis Setup</span>
                  </div>
                  <p className="text-slate-300">
                    Create your custom <strong>Super Admin</strong> account below. The secret bootstrap invite code from your <code className="text-amber-300">.env</code> is ready.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    required={isRegister}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              {isRegister && (
                <PasswordStrengthMeter
                  password={password}
                  minLength={Number(process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH || "10")}
                />
              )}
            </div>

            {isRegister && inviteRequired && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Invite Code / Genesis Admin Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="sherinv_xxxxxxxx  or  your ADMIN_BOOTSTRAP_INVITE"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                  This is the <code className="text-amber-400">ADMIN_BOOTSTRAP_INVITE</code> value from your{" "}
                  <code className="text-amber-400">.env</code> file (default deployments ship with{" "}
                  <code className="text-amber-400">blindshare-…-genesis-admin-2026</code>), or a{" "}
                  <code className="text-amber-400">sherinv_…</code> code generated in Admin Panel → Invite Codes.
                </p>
              </div>
            )}

            {isRegister && !inviteRequired && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] leading-relaxed text-emerald-300">
                <strong className="text-emerald-200">No invite needed.</strong> This deployment has no owner yet — the
                account you create now becomes <strong>Super Admin</strong>.
              </div>
            )}

            <AltchaBox onVerify={setAltchaPayload} className="my-2" />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>{isRegister ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Login / Register Toggle */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-amber-400 hover:underline transition font-medium"
            >
              {isRegister
                ? "Already registered? Sign In instead"
                : bootstrap?.mode === "setup" || !inviteRequired
                ? "🌱 Fresh Database: Create First Super Admin Account"
                : "Have an invite code? Create Account"}
            </button>
          </div>
            </>
          )}
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
