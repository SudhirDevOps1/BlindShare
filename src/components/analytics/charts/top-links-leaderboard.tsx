"use client";

import React from "react";
import { Trophy, ExternalLink, Copy, Check, BarChart2, Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import {
  hexToBuffer,
  bufferToHex,
  docKeyToFragment,
  fragmentToDocKey,
  unwrapDocKeyForOwner,
} from "@/lib/crypto-core";
import { syncVaultDocumentKeys, unlockOwnerVault } from "@/lib/vault/master-vault";

interface TopLinksLeaderboardProps {
  links?: any[];
  linkPerformance?: any[];
}

export function TopLinksLeaderboard({ links = [], linkPerformance = [] }: TopLinksLeaderboardProps) {
  const { t } = useI18n();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Key Recovery Dialog State
  const [keyRecoveryTarget, setKeyRecoveryTarget] = React.useState<any | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [showKeyInput, setShowKeyInput] = React.useState(false);
  const [keyError, setKeyError] = React.useState<string | null>(null);
  const [recovering, setRecovering] = React.useState(false);
  const [restoreSuccess, setRestoreSuccess] = React.useState<{ url: string; elapsedMs: number } | null>(null);

  const perfMap = React.useMemo(() => {
    const map = new Map<string, any>();
    if (linkPerformance) {
      linkPerformance.forEach((p) => {
        if (p.linkId) map.set(p.linkId, p);
      });
    }
    return map;
  }, [linkPerformance]);

  const topItems = React.useMemo(() => {
    if (links && links.length > 0) {
      return [...links]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 5)
        .map((l) => {
          const perf = perfMap.get(l.id);
          return {
            id: l.id,
            title: l.name || l.slug,
            viewCount: l.viewCount || 0,
            avgDwell: perf?.formattedAvgDwell || (l.viewCount > 0 ? "0m 45s" : "0s"),
            score: perf?.score !== undefined ? perf.score : (l.viewCount > 0 ? 50 : 0),
            code: l.slug,
            docId: l.docId,
            ownerEncryptedKeyHex: l.ownerEncryptedKeyHex,
            ownerEncryptedKeyIvHex: l.ownerEncryptedKeyIvHex,
            hasPassword: l.hasPassword,
            isReal: true,
          };
        });
    }
    return [];
  }, [links, perfMap]);

  const maxViews = Math.max(...topItems.map((item) => item.viewCount || 1), 1);

  const getStoredKeyHex = (item: any): string | null => {
    if (typeof window === "undefined") return null;
    return (
      (item.docId && sessionStorage.getItem(`blindshare_key_${item.docId}`)) ||
      (item.docId && localStorage.getItem(`blindshare_key_${item.docId}`)) ||
      (item.id && sessionStorage.getItem(`blindshare_key_${item.id}`)) ||
      (item.id && localStorage.getItem(`blindshare_key_${item.id}`)) ||
      sessionStorage.getItem(`blindshare_link_key_${item.code}`) ||
      localStorage.getItem(`blindshare_link_key_${item.code}`) ||
      sessionStorage.getItem(`blindshare_key_${item.code}`) ||
      localStorage.getItem(`blindshare_key_${item.code}`) ||
      null
    );
  };

  const buildFullUrl = (item: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let url = `${origin}/v/${item.code}`;

    const storedHex = getStoredKeyHex(item);
    if (storedHex) {
      try {
        const docKey = hexToBuffer(storedHex);
        url += `#k=${docKeyToFragment(docKey)}`;
      } catch {}
    }
    return url;
  };

  const handleCopy = async (item: any) => {
    let storedHex = getStoredKeyHex(item);

    // If key is missing in storage, attempt immediate auto-unwrap via active master vault
    if (!storedHex && (item.ownerEncryptedKeyHex || item.docId)) {
      try {
        await syncVaultDocumentKeys([], [item]);
        storedHex = getStoredKeyHex(item);
      } catch {}
    }

    // If still missing and it's an E2EE doc without password, open recovery modal
    if (!storedHex && item.docId && !item.hasPassword) {
      setKeyRecoveryTarget(item);
      setKeyInput("");
      setKeyError(null);
      return;
    }

    const url = buildFullUrl(item);
    copyTextFallback(url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyTextFallback = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        } catch {}
      });
    } else if (typeof document !== "undefined") {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }
  };

  const handleSaveRecoveredKey = async () => {
    if (!keyRecoveryTarget || !keyInput.trim()) return;

    // eslint-disable-next-line react-hooks/purity
    const startTime = Date.now();
    try {
      setRecovering(true);
      setKeyError(null);
      setRestoreSuccess(null);

      let docKey: Uint8Array | null = null;
      const trimmed = keyInput.trim();

      // Case A: User pasted a URL or key fragment directly (#k=..., k=..., /v/..., or raw 32-byte hex)
      const looksLikeFragment =
        trimmed.includes("#k=") ||
        trimmed.includes("/v/") ||
        trimmed.startsWith("k=") ||
        /^[a-zA-Z0-9_-]{43,44}$/.test(trimmed) ||
        /^[0-9a-fA-F]{64}$/.test(trimmed);

      if (looksLikeFragment) {
        try {
          if (trimmed.includes("#k=")) {
            docKey = fragmentToDocKey(trimmed.substring(trimmed.indexOf("#k=")));
          } else if (trimmed.includes("/v/")) {
            const hashIdx = trimmed.indexOf("#");
            if (hashIdx !== -1) {
              docKey = fragmentToDocKey(trimmed.substring(hashIdx));
            }
          } else if (trimmed.startsWith("k=")) {
            docKey = fragmentToDocKey(`#${trimmed}`);
          } else if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
            docKey = hexToBuffer(trimmed);
          } else {
            docKey = fragmentToDocKey(`#k=${trimmed}`);
          }
        } catch {}
      }

      // Case B: If not a fragment, or fragment parsing failed, treat as account password
      if (!docKey) {
        const verifyRes = await fetch("/api/auth/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: trimmed }),
        });

        const verifyData = await verifyRes.json().catch(() => ({}));

        if (!verifyRes.ok || !verifyData.valid) {
          setKeyError("Incorrect password or invalid key fragment. Please check your account password or paste the share link URL / #k=... fragment.");
          setRecovering(false);
          return;
        }

        const masterKey = await unlockOwnerVault(trimmed, verifyData.masterKeySaltHex);

        let encKeyHex = keyRecoveryTarget.ownerEncryptedKeyHex;
        let encIvHex = keyRecoveryTarget.ownerEncryptedKeyIvHex;

        const docsRes = await fetch("/api/docs");
        const docsJson = await docsRes.json().catch(() => ({}));
        const allDocs = Array.isArray(docsJson.documents) ? docsJson.documents : [];
        const targetDoc = allDocs.find((d: any) => d.id === keyRecoveryTarget.docId);

        if (!encKeyHex && targetDoc) {
          encKeyHex = targetDoc.ownerEncryptedKeyHex;
          encIvHex = targetDoc.ownerEncryptedKeyIvHex;
        }

        if (encKeyHex && encIvHex) {
          try {
            docKey = await unwrapDocKeyForOwner(encKeyHex, encIvHex, masterKey);
          } catch {
            setKeyError("Password verified, but Master Vault decryption tag did not match. Please paste the original share link or #k=... fragment.");
            setRecovering(false);
            return;
          }
        }

        await syncVaultDocumentKeys(allDocs, links);

        if (!docKey) {
          setKeyError("Account password verified! However, this document key was not backed up in the Master Vault. Please paste the share link URL or #k=... fragment.");
          setRecovering(false);
          return;
        }
      }

      if (docKey && docKey.length === 32) {
        const hex = bufferToHex(docKey);
        if (typeof window !== "undefined") {
          if (keyRecoveryTarget.docId) {
            sessionStorage.setItem(`blindshare_key_${keyRecoveryTarget.docId}`, hex);
            localStorage.setItem(`blindshare_key_${keyRecoveryTarget.docId}`, hex);
          }
          if (keyRecoveryTarget.id) {
            sessionStorage.setItem(`blindshare_key_${keyRecoveryTarget.id}`, hex);
            localStorage.setItem(`blindshare_key_${keyRecoveryTarget.id}`, hex);
          }
          if (keyRecoveryTarget.code) {
            sessionStorage.setItem(`blindshare_link_key_${keyRecoveryTarget.code}`, hex);
            localStorage.setItem(`blindshare_link_key_${keyRecoveryTarget.code}`, hex);
          }
        }

        // eslint-disable-next-line react-hooks/purity
        const elapsedMs = Math.max(1, Date.now() - startTime);
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const fullUrl = `${origin}/v/${keyRecoveryTarget.code}#k=${docKeyToFragment(docKey)}`;

        copyTextFallback(fullUrl);
        setCopiedId(keyRecoveryTarget.id);
        setTimeout(() => setCopiedId(null), 2500);

        setRestoreSuccess({ url: fullUrl, elapsedMs });
      }
    } catch (err: any) {
      setKeyError(err.message || "Failed to restore decryption key.");
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              {t.charts?.leaderboard?.title || "Top Performing Pitch Decks & Share Links"}
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Ranked Velocity
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.charts?.leaderboard?.subtitle || "Ranked comparison by investor interest and average attention velocity"}
          </p>
        </div>
      </div>

      {/* Leaderboard Rows */}
      {topItems.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-8 text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="text-xs font-bold text-white">No share links yet</div>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Generate your first tracked link to see real investor velocity and engagement rankings here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
        {topItems.map((item, index) => {
          const ratio = (item.viewCount || 0) / maxViews;
          const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600", "text-slate-500", "text-slate-600"];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-base font-black font-mono w-5 text-center ${rankColors[index] || "text-slate-500"}`}>
                  #{index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {item.title || item.code}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span>
                      {item.viewCount || 0} {t.charts?.leaderboard?.views || "views"}
                    </span>
                    <span>•</span>
                    <span>{item.avgDwell || "0s"}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      {item.score !== undefined ? item.score : 0} {t.charts?.leaderboard?.score || "Score"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Actions */}
              <div className="flex items-center gap-3 sm:w-48 justify-end">
                <div className="w-24 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden hidden sm:block">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item)}
                  className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="Copy Share Link"
                >
                  {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>

                <Link
                  href={`/dashboard/analytics/${item.id}`}
                  className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-1.5 text-amber-400 hover:bg-amber-500/20 transition"
                  title="View Analytics"
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Key Recovery / Restore Dialog */}
      {keyRecoveryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restore Decryption Key</h3>
                <p className="text-xs text-slate-400">
                  Link: <span className="text-slate-300 font-semibold">{keyRecoveryTarget.title || keyRecoveryTarget.code}</span>
                </p>
              </div>
            </div>

            {restoreSuccess ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>Decryption Key Restored Successfully!</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/40 w-fit">
                      ⚡ Restored in {restoreSuccess.elapsedMs}ms (PBKDF2 WebCrypto)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero-Knowledge key <code className="text-amber-400">#k=...</code> has been unwrapped and copied to your clipboard.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={restoreSuccess.url}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        copyTextFallback(restoreSuccess.url);
                        setCopiedId(keyRecoveryTarget.id);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setKeyRecoveryTarget(null);
                      setRestoreSuccess(null);
                      setKeyInput("");
                    }}
                    className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400 space-y-1.5">
                  <p className="text-slate-300 font-medium">Zero-Knowledge Vault Recovery</p>
                  <p className="leading-relaxed">
                    Enter your <span className="text-amber-400 font-semibold">Account Password</span> to automatically unlock and restore all document keys from your Zero-Knowledge Master Vault, or paste the share link / <code className="text-amber-400">#k=...</code> fragment.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Account Password, Decryption Key, or Link
                  </label>
                  <div className="relative">
                    <input
                      type={showKeyInput ? "text" : "password"}
                      value={keyInput}
                      onChange={(e) => {
                        setKeyInput(e.target.value);
                        setKeyError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && keyInput.trim() && !recovering) {
                          handleSaveRecoveredKey();
                        }
                      }}
                      placeholder="Enter account password or paste #k=... fragment"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                      aria-label={showKeyInput ? "Hide key" : "Show key"}
                    >
                      {showKeyInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {keyError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300 leading-relaxed">
                      {keyError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setKeyRecoveryTarget(null)}
                    disabled={recovering}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecoveredKey}
                    disabled={!keyInput.trim() || recovering}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 shadow-md shadow-amber-500/10"
                  >
                    {recovering ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        <span>Unwrapping...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Restore & Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
