"use client";

import React, { useEffect, useState, use } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ViewerGates } from "@/components/gates/viewer-gates";
import { SignaturePadModal } from "@/components/gates/signature-pad-modal";
import { PdfRenderer } from "@/components/pdf-viewer/pdf-renderer";
import { MediaRenderer } from "@/components/viewer/media-renderer";
import { isPdf } from "@/lib/formats";
import { unwrapKeyWithPassword } from "@/lib/crypto-core";
import { AlertCircle, Ban, Clock, Lock, Shield } from "lucide-react";

interface VerifiedState {
  sessionId: string;
  viewerIdentity: string;
  passwordEntered?: string;
}

export default function ViewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t, appName } = useI18n();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<any>(null);
  const [blocked, setBlocked] = useState<{ kind: "expired" | "revoked" | "notfound"; message: string } | null>(null);
  const [verified, setVerified] = useState<VerifiedState | null>(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [unwrappedKey, setUnwrappedKey] = useState<Uint8Array | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Tab-Switch Anti-Spy Shield: Obfuscates document when user switches tabs or windows
  useEffect(() => {
    if (!payload?.link?.antiSpyShieldEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsWindowBlurred(true);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [payload?.link?.antiSpyShieldEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/v/${slug}`);
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          if (json.isRevoked) {
            setBlocked({ kind: "revoked", message: json.error || t.viewer.revokedDesc });
          } else if (json.isExpired) {
            setBlocked({ kind: "expired", message: json.error || t.viewer.expiredDesc });
          } else {
            setBlocked({ kind: "notfound", message: json.error || t.viewer.notFoundDesc });
          }
          setLoading(false);
          return;
        }

        setPayload(json);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setBlocked({ kind: "notfound", message: t.viewer.notFoundDesc });
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, t.viewer]);

  // Revoke-mid-session watchdog: re-check link status every 30s while reading.
  useEffect(() => {
    if (!verified) return;
    const watchdog = setInterval(async () => {
      try {
        const res = await fetch(`/api/v/${slug}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setBlocked({
            kind: json.isRevoked ? "revoked" : "expired",
            message: json.error || t.viewer.revokedDesc,
          });
          setVerified(null);
        }
      } catch {
        /* offline — keep reading, next tick re-checks */
      }
    }, 30000);
    return () => clearInterval(watchdog);
  }, [verified, slug, t.viewer]);

  const handleVerified = async (data: VerifiedState) => {
    setKeyError(null);

    // Password-mode: unwrap the DocKey client-side (PBKDF2 250k) — server never sees it.
    if (data.passwordEntered && payload?.link?.wrappedKeyHex && payload?.link?.passwordSaltHex) {
      try {
        const key = await unwrapKeyWithPassword(
          payload.link.wrappedKeyHex,
          payload.link.passwordSaltHex,
          data.passwordEntered
        );
        setUnwrappedKey(key);
      } catch {
        setKeyError(t.viewer.invalidPassword);
        return;
      }
    }

    setVerified(data);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-14 w-14">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
            <Lock className="absolute inset-0 m-auto h-5 w-5 text-amber-400" />
          </div>
          <p className="text-sm text-slate-400">{t.viewer.decryptingKey}</p>
        </div>
      </div>
    );
  }

  if (blocked) {
    const Icon = blocked.kind === "revoked" ? Ban : blocked.kind === "expired" ? Clock : AlertCircle;
    const title =
      blocked.kind === "revoked"
        ? t.viewer.revokedTitle
        : blocked.kind === "expired"
        ? t.viewer.expiredTitle
        : t.viewer.notFoundTitle;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="mb-2 text-lg font-bold text-white">{title}</h1>
          <p className="mb-6 text-xs leading-relaxed text-slate-400">{blocked.message}</p>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-left text-[11px] text-slate-500">
            Enumeration-proof response: {appName} returns identical shapes for missing, revoked and expired links so
            share-codes cannot be probed.
          </div>
        </div>
      </div>
    );
  }

  const link = payload.link;
  const doc = payload.document;
  const dataroom = payload.dataroom;

  if (!verified) {
    const needsGate = link.hasPassword || link.requiresEmail || link.requiresNda;
    if (needsGate) {
      return (
        <div className="min-h-screen bg-slate-950">
          {keyError && (
            <div className="mx-auto max-w-md px-4 pt-6">
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                {keyError}
              </div>
            </div>
          )}
          <ViewerGates
            slug={slug}
            hasPassword={link.hasPassword}
            requiresEmail={link.requiresEmail}
            requiresNda={link.requiresNda}
            ndaText={link.ndaText}
            allowedDomains={link.allowedDomains}
            onVerified={handleVerified}
          />
        </div>
      );
    }

    // Open link — still register a session so dwell analytics work.
    return (
      <OpenLinkAutoStart slug={slug} onVerified={handleVerified} />
    );
  }

  if (link.requiresSignature && !hasSigned) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <SignaturePadModal
          slug={slug}
          sessionId={verified.sessionId}
          signerEmail={verified.viewerIdentity.includes("@") ? verified.viewerIdentity : undefined}
          promptText={link.signaturePrompt}
          onSigned={() => setHasSigned(true)}
        />
      </div>
    );
  }

  // Dataroom link: show the document index first.
  if (!doc && dataroom) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Secure Dataroom
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">{dataroom.name}</h1>
            {dataroom.description && (
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{dataroom.description}</p>
            )}
          </div>

          <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            {(dataroom.documents || []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-semibold text-white">{d.title}</div>
                  <div className="text-[11px] text-slate-400">
                    {d.pageCount} pages • {(d.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {d.encryptionMode}
                  </div>
                </div>
                <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-400">
                  Encrypted
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Each dataroom document is decrypted only in your browser with the key from the link fragment.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-center text-sm text-slate-400">
        {t.viewer.notFoundDesc}
      </div>
    );
  }

  const rendererProps = {
    slug,
    linkData: {
      id: link.id,
      name: link.name,
      allowDownload: link.allowDownload,
      watermarkEnabled: link.watermarkEnabled,
      watermarkText: link.watermarkText,
      brandLogoUrl: link.brandLogoUrl,
      brandAccentColor: link.brandAccentColor,
      antiLeakBlurEnabled: link.antiLeakBlurEnabled,
    },
    sessionId: verified.sessionId,
    viewerIdentity: verified.viewerIdentity,
  };

  return (
    <div className="relative min-h-screen">
      {/* Anti-Spy Tab-Switch Obfuscation Shield */}
      {isWindowBlurred && (
        <div
          onClick={() => setIsWindowBlurred(false)}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 text-center select-none cursor-pointer"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-2xl shadow-blue-500/20 animate-pulse">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">Anti-Spy Privacy Shield Active</h2>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Document contents are secured and hidden while your browser tab is out of focus.
          </p>
          <button
            onClick={() => setIsWindowBlurred(false)}
            className="rounded-xl bg-blue-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-blue-400 transition shadow-lg shadow-blue-500/20"
          >
            Click Anywhere to Resume Viewing
          </button>
        </div>
      )}

      {isPdf(doc.originalFilename) ? (
        <PdfRenderer
          {...rendererProps}
          linkData={{
            ...rendererProps.linkData,
            slug,
            requiresNda: link.requiresNda,
            ndaText: link.ndaText,
            voicePitchEnabled: link.voicePitchEnabled,
          }}
          docData={{
            id: doc.id,
            title: doc.title,
            pageCount: doc.pageCount,
            encryptionMode: doc.encryptionMode,
            ivHex: doc.ivHex,
            tagHex: doc.tagHex,
          }}
          docKeyOverride={unwrappedKey}
          initialPassword={verified.passwordEntered}
          wrappedKeyHex={link.wrappedKeyHex}
          passwordSaltHex={link.passwordSaltHex}
        />
      ) : (
        <MediaRenderer
          {...rendererProps}
          docData={{
            id: doc.id,
            title: doc.title,
            originalFilename: doc.originalFilename,
            pageCount: doc.pageCount,
            encryptionMode: doc.encryptionMode,
            ivHex: doc.ivHex,
          }}
          docKeyOverride={unwrappedKey}
        />
      )}
    </div>
  );
}

/** Registers a view session for ungated links, then renders children via callback. */
function OpenLinkAutoStart({
  slug,
  onVerified,
}: {
  slug: string;
  onVerified: (data: VerifiedState) => void;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v/${slug}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok) {
          setError(j.error || "Unable to start viewing session");
          return;
        }
        onVerified({ sessionId: j.sessionId, viewerIdentity: j.viewerIdentity });
      })
      .catch(() => !cancelled && setError("Unable to start viewing session"));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      {error ? (
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-7 w-7 text-red-400" />
          <p className="text-sm text-slate-300">{error}</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <p className="text-sm text-slate-400">{t.viewer.loadingDoc}</p>
        </div>
      )}
    </div>
  );
}
