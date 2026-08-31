"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Copy,
  Check,
  AlertCircle,
  Key,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TwoFactorModal({ isOpen, onClose }: TwoFactorModalProps) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"status" | "setup" | "backup" | "disable">("status");

  // Setup state
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackups, setCopiedBackups] = useState(false);

  // Disable state
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/user/2fa");
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(Boolean(data.enabled));
        setStep("status");
      }
    } catch {
      setError("Failed to fetch 2FA security status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleStartSetup = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start 2FA setup");

      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeDataUrl);
      setStep("setup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enable",
          secret,
          code: verificationCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setIsEnabled(true);
      setBackupCodes(data.backupCodes || []);
      setStep("backup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your current password to disable 2FA");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/user/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "disable",
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disable 2FA");

      setIsEnabled(false);
      setPassword("");
      setStep("status");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: "secret" | "backups") => {
    navigator.clipboard.writeText(text);
    if (type === "secret") {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackups(true);
      setTimeout(() => setCopiedBackups(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-5 sm:p-6 shadow-2xl space-y-4 text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Two-Factor Authentication (2FA)</h2>
              <p className="text-[11px] text-slate-400">RFC 6238 TOTP Authenticator Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-400" />
            <p className="text-xs">Loading 2FA status...</p>
          </div>
        ) : step === "status" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 sm:p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border shrink-0 ${
                    isEnabled
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">
                    {isEnabled ? "2FA is Currently Enabled" : "2FA is Currently Disabled"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isEnabled
                      ? "Your account requires a 6-digit TOTP code on login."
                      : "Add an extra layer of security using Google Authenticator, Authy, or 1Password."}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Close
              </button>
              {isEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("disable");
                  }}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleStartSetup}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
                  <span>Enable 2FA Authenticator</span>
                </button>
              )}
            </div>
          </div>
        ) : step === "setup" ? (
          <form onSubmit={handleVerifyEnable} className="space-y-3.5">
            <p className="text-xs text-slate-300">
              1. Scan this QR code using <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong>:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
              {qrCodeUrl && (
                <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-lg">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="h-28 w-28 sm:h-32 sm:w-32" />
                </div>
              )}
              <div className="space-y-1.5 text-xs text-slate-400 flex-1 w-full">
                <div>Cannot scan? Enter secret key manually:</div>
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-amber-300 select-all">
                  <span className="truncate">{secret}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(secret, "secret")}
                    className="p-1 hover:text-white shrink-0"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                2. Enter 6-Digit Code Generated by Your App:
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center text-xl tracking-[0.4em] font-mono rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-amber-400 placeholder:text-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("status")}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || verificationCode.length !== 6}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Verify & Activate</span>
              </button>
            </div>
          </form>
        ) : step === "backup" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>Two-Factor Authentication is now active on your account!</span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Emergency Backup Recovery Codes:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(backupCodes.join("\n"), "backups")}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300"
                >
                  {copiedBackups ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedBackups ? "Copied All" : "Copy Codes"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Save these codes in a safe password manager. If you ever lose your phone, each code can be used once to log in.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-slate-600 text-[10px]">{idx + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("status");
                  onClose();
                }}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                I Have Saved My Codes
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDisable} className="space-y-4">
            <p className="text-xs text-slate-300">
              Please enter your account password to confirm disabling Two-Factor Authentication:
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Account Password:</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder:text-slate-700 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("status")}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !password}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Confirm Disable</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
