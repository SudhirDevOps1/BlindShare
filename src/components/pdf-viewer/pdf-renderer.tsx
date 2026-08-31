"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  fragmentToDocKey,
  decryptBytes,
  hexToBuffer,
  unwrapKeyWithPassword,
} from "@/lib/crypto-core";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Download,
  Shield,
  Lock,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  Presentation,
} from "lucide-react";
import { PresenterModeView } from "@/components/viewer/presenter-mode-view";
import { setupAntiLeakListeners } from "@/lib/security/anti-leak-detector";

interface PdfRendererProps {
  slug: string;
  linkData: {
    id: string;
    slug: string;
    name: string;
    allowDownload: boolean;
    watermarkEnabled: boolean;
    watermarkText: string | null;
    requiresNda: boolean;
    ndaText: string | null;
    brandLogoUrl?: string | null;
    brandAccentColor?: string | null;
    antiLeakBlurEnabled?: boolean;
  };
  docData: {
    id: string;
    title: string;
    pageCount: number;
    encryptionMode: string;
    ivHex: string | null;
    tagHex: string | null;
  };
  sessionId: string;
  viewerIdentity: string;
  initialPassword?: string;
  wrappedKeyHex?: string | null;
  passwordSaltHex?: string | null;
}

export function PdfRenderer({
  slug,
  linkData,
  docData,
  sessionId,
  viewerIdentity,
  initialPassword,
  wrappedKeyHex,
  passwordSaltHex,
}: PdfRendererProps) {
  const { t, lang, setLang, appName } = useI18n();

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Initializing WebCrypto...");
  const [error, setError] = useState<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(docData.pageCount || 1);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);
  const [antiLeakActive, setAntiLeakActive] = useState(false);

  // Setup Anti-leak screenshot and focus deterrents
  useEffect(() => {
    if (linkData.antiLeakBlurEnabled === false) return;
    const cleanup = setupAntiLeakListeners((blurActive) => {
      setAntiLeakActive(blurActive);
    });
    return cleanup;
  }, [linkData.antiLeakBlurEnabled]);

  // Keyboard Navigation (Arrow Keys / PageUp / PageDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentPage(totalPages);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  // Resume reading hint
  const [resumePrompt, setResumePrompt] = useState<{ page: number; total: number } | null>(null);

  // Dwell Tracking buffer
  const pageDwellMap = useRef<Record<number, number>>({});
  const activePageRef = useRef(1);
  const maxPageReachedRef = useRef(1);
  const totalDwellRef = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const watermarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Decrypted PDF array buffer in browser memory
  const decryptedDataRef = useRef<ArrayBuffer | null>(null);

  // Load and decrypt document
  useEffect(() => {
    let isCancelled = false;

    async function loadAndDecrypt() {
      try {
        setLoading(true);
        setError(null);
        setLoadingStep("Extracting zero-knowledge key from URL fragment...");

        // 1. Get raw key from fragment or password unwrapping
        let docKey: Uint8Array | null = null;

        if (initialPassword && wrappedKeyHex && passwordSaltHex) {
          setLoadingStep("Unwrapping AES key with PBKDF2 passphrase...");
          docKey = await unwrapKeyWithPassword(wrappedKeyHex, passwordSaltHex, initialPassword);
        } else {
          // Fragment key
          const hash = window.location.hash;
          docKey = fragmentToDocKey(hash);

          if (!docKey) {
            // Check session storage fallback (e.g. if owner navigated directly after upload)
            const storedHex = sessionStorage.getItem(`blindshare_key_${slug}`);
            if (storedHex) {
              docKey = hexToBuffer(storedHex);
            }
          }
        }

        if (!docKey && docData.encryptionMode === "e2ee-fragment") {
          throw new Error(
            "Missing Decryption Key (#k=...). The server never holds the decryption key. Please request the full link including the fragment from the document owner."
          );
        }

        setLoadingStep("Fetching encrypted document ciphertext from blind storage...");
        const res = await fetch(`/api/v/${slug}/bytes`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to download ciphertext bytes");
        }

        const ciphertextBuffer = await res.arrayBuffer();

        // 2. Decrypt in client browser memory
        let pdfBytes: ArrayBuffer = ciphertextBuffer;

        if (docData.encryptionMode === "e2ee-fragment" && docKey) {
          setLoadingStep("Decrypting ciphertext with browser WebCrypto AES-GCM-256...");
          const iv = docData.ivHex ? hexToBuffer(docData.ivHex) : new Uint8Array(12);
          pdfBytes = await decryptBytes(ciphertextBuffer, docKey, iv);
        }

        if (isCancelled) return;
        decryptedDataRef.current = pdfBytes;

        // 3. Load PDF.js
        setLoadingStep("Rendering document via Mozilla PDF.js...");

        // Dynamically load PDF.js if not on window
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
              resolve();
            };
            script.onerror = () => reject(new Error("Failed to load PDF.js renderer"));
            document.head.appendChild(script);
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const loadedPdf = await loadingTask.promise;

        if (isCancelled) return;

        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setLoading(false);

        // Check resume reading history
        try {
          const savedPage = localStorage.getItem(`blindshare_lastpage_${slug}`);
          if (savedPage) {
            const p = parseInt(savedPage, 10);
            if (p > 1 && p <= loadedPdf.numPages) {
              setResumePrompt({ page: p, total: loadedPdf.numPages });
            }
          }
        } catch {}
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF Decryption/Render Error:", err);
          setError(err.message || "Failed to decrypt and render document");
          setLoading(false);
        }
      }
    }

    loadAndDecrypt();

    return () => {
      isCancelled = true;
    };
  }, [slug, initialPassword, wrappedKeyHex, passwordSaltHex, docData]);

  // Page navigation and Dwell Heartbeat Tracker
  useEffect(() => {
    activePageRef.current = currentPage;
    maxPageReachedRef.current = Math.max(maxPageReachedRef.current, currentPage);

    // Save reading progress to local storage
    try {
      localStorage.setItem(`blindshare_lastpage_${slug}`, String(currentPage));
    } catch {}

    // Dwell timer (increments current page count every second)
    const secondTimer = setInterval(() => {
      const page = activePageRef.current;
      pageDwellMap.current[page] = (pageDwellMap.current[page] || 0) + 1;
      totalDwellRef.current += 1;
    }, 1000);

    const flushDwellEvents = () => {
      const events = Object.entries(pageDwellMap.current).map(([pg, dwell]) => ({
        pageNumber: parseInt(pg, 10),
        dwellSeconds: dwell,
      }));

      if (events.length > 0 && sessionId) {
        pageDwellMap.current = {};
        const payload = JSON.stringify({
          sessionId,
          events,
          maxPageReached: maxPageReachedRef.current,
          completedPages: maxPageReachedRef.current,
          totalDwellSeconds: totalDwellRef.current,
        });

        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon(`/api/v/${slug}/session`, blob);
        } else {
          fetch(`/api/v/${slug}/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    // Heartbeat batch flusher (every 10 seconds)
    const heartbeatTimer = setInterval(() => {
      flushDwellEvents();
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushDwellEvents();
      }
    };

    window.addEventListener("pagehide", flushDwellEvents);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(secondTimer);
      clearInterval(heartbeatTimer);
      window.removeEventListener("pagehide", flushDwellEvents);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushDwellEvents();
    };
  }, [currentPage, slug, sessionId]);

  // Draw Dynamic Live Watermark on Overlay Canvas
  const drawWatermark = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      const wmCanvas = watermarkCanvasRef.current;
      if (!wmCanvas || !linkData.watermarkEnabled) return;

      wmCanvas.width = canvasWidth;
      wmCanvas.height = canvasHeight;

      const ctx = wmCanvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Watermark text composition: Identity · Timestamp · Short Slug
      const timeStr = new Date().toISOString().substring(0, 16).replace("T", " ");
      const identityLabel = viewerIdentity || "CONFIDENTIAL";
      const customLabel = linkData.watermarkText ? `[${linkData.watermarkText}] ` : "";
      const watermarkString = `${customLabel}${identityLabel} • ${timeStr} • ${slug.substring(0, 8)}`;

      ctx.save();
      ctx.rotate((-28 * Math.PI) / 180);
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.22)"; // Subtle, readable, non-obtrusive
      ctx.textAlign = "center";

      const stepX = 280;
      const stepY = 160;

      for (let x = -canvasWidth; x < canvasWidth * 2; x += stepX) {
        for (let y = -canvasHeight; y < canvasHeight * 2; y += stepY) {
          ctx.fillText(watermarkString, x, y);
        }
      }
      ctx.restore();
    },
    [linkData.watermarkEnabled, linkData.watermarkText, viewerIdentity, slug]
  );

  // Render current PDF page
  useEffect(() => {
    if (!pdfDoc) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2.5);
        const unscaledViewport = page.getViewport({ scale: 1, rotation });

        let targetScale = zoom;
        if (presenterMode && typeof window !== "undefined") {
          // Fit slide proportionally inside presentation screen canvas
          const maxW = window.innerWidth * 0.88;
          const maxH = window.innerHeight * 0.78;
          const scaleW = maxW / unscaledViewport.width;
          const scaleH = maxH / unscaledViewport.height;
          targetScale = Math.min(scaleW, scaleH);
        }

        const viewport = page.getViewport({ scale: targetScale * dpr, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${Math.round(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!isCancelled) {
          drawWatermark(viewport.width, viewport.height);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.warn("PDF page render warning:", err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom, rotation, drawWatermark, presenterMode]);

  // Handle Download (Only if allowDownload is enabled)
  const handleDownload = () => {
    if (!linkData.allowDownload || !decryptedDataRef.current) return;
    const blob = new Blob([decryptedDataRef.current], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docData.title.replace(/[^a-zA-Z0-9_\-\.]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <Lock className="absolute inset-0 m-auto h-6 w-6 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{t.viewer.loadingDoc}</h3>
        <p className="text-sm text-slate-400 max-w-md animate-pulse">{loadingStep}</p>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Zero-Knowledge Decryption in Progress</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{t.viewer.notFoundTitle}</h3>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">{error}</p>
          <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">Why am I seeing this?</div>
            <div>
              In BlindShare's Zero-Knowledge mode, the decryption key is located strictly inside the URL fragment
              (<code className="text-amber-400">#k=...</code>) which browsers never send to the server. If this fragment was truncated or lost in copying, the document cannot be decrypted.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 select-none">
      {/* Top Floating Control Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md">
        {/* Document Title & Brand */}
        <div className="flex items-center gap-3">
          {linkData.brandLogoUrl ? (
            <img
              src={linkData.brandLogoUrl}
              alt="Brand Logo"
              className="h-7 w-auto max-w-[120px] object-contain rounded"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="h-4 w-4" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-white text-sm max-w-[200px] sm:max-w-xs truncate" title={docData.title}>
              {docData.title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span>AES-GCM Decrypted</span>
            </div>
          </div>
        </div>

        {/* Page Nav & Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 text-xs font-semibold text-slate-200">
            {t.viewer.pageOf.replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* View Controls: Zoom, Rotate, Download, Lang */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title={t.viewer.zoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-medium text-slate-300 px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title={t.viewer.zoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="hidden sm:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800"
            title={t.viewer.rotate}
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Presenter / Pitch Deck Slideshow Mode */}
          <button
            onClick={() => setPresenterMode(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 shadow-sm"
            title="Start Fullscreen Presenter Mode"
          >
            <Presentation className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Presenter Mode</span>
          </button>

          {/* Allow Download Button */}
          {linkData.allowDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10 transition"
              title="Download Decrypted PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="rounded-lg bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-slate-800 border border-slate-800"
          >
            {lang === "en" ? "हिंदी" : "EN"}
          </button>
        </div>
      </div>

      {/* Resume Reading Notice Prompt */}
      {resumePrompt && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {t.viewer.resumeHint
                  .replace("{pages}", String(resumePrompt.page))
                  .replace("{lastPage}", String(resumePrompt.page))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(resumePrompt.page);
                  setResumePrompt(null);
                }}
                className="rounded-lg bg-amber-500 px-2.5 py-1 font-bold text-slate-950 hover:bg-amber-400 text-[11px]"
              >
                {t.viewer.resumeButton}
              </button>
              <button
                onClick={() => setResumePrompt(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                {t.viewer.dismiss}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Leak Security Privacy Blur Overlay */}
      {antiLeakActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl p-6 text-center animate-in fade-in duration-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-2xl shadow-amber-500/10">
            <Shield className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Security Privacy Shield Active</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Content is temporarily blurred to prevent unauthorized screen captures or recording. Focus on this window to resume reading.
          </p>
        </div>
      )}

      {/* Canvas View: Switches between Fullscreen Presenter Mode and Standard Document View */}
      {presenterMode ? (
        <PresenterModeView
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onClose={() => setPresenterMode(false)}
          brandLogoUrl={linkData.brandLogoUrl}
          brandAccentColor={linkData.brandAccentColor}
          watermarkText={linkData.watermarkEnabled ? (linkData.watermarkText || viewerIdentity || "CONFIDENTIAL") : null}
        >
          <div className="relative flex items-center justify-center">
            <canvas ref={canvasRef} className="block max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-md" />
            {linkData.watermarkEnabled && (
              <canvas
                ref={watermarkCanvasRef}
                className="pointer-events-none absolute inset-0 block h-full w-full"
              />
            )}
          </div>
        </PresenterModeView>
      ) : (
        <div className={`flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto ${antiLeakActive ? "blur-xl" : ""}`}>
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
            {/* Main PDF Page Render Canvas */}
            <canvas ref={canvasRef} className="block max-w-full h-auto" />

            {/* Dynamic Live Watermark Overlay Canvas */}
            {linkData.watermarkEnabled && (
              <canvas
                ref={watermarkCanvasRef}
                className="pointer-events-none absolute inset-0 block h-full w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Footer / Watermark Deterrent Disclaimer */}
      <div className="border-t border-slate-900 bg-slate-950 px-4 py-2 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-amber-500" />
          <span>
            {appName} Protected View • Viewer: <strong className="text-slate-400">{viewerIdentity || "Anonymous"}</strong>
          </span>
        </div>
        <div className="text-[10px] text-slate-600">
          Notice: Anti-download and dynamic watermark overlays serve as deterrents, not DRM.
        </div>
      </div>
    </div>
  );
}
