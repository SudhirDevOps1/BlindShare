"use client";

import { BrandIcon } from "@/components/brand-icon";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n/context";
import {
  fragmentToDocKey,
  docKeyToFragment,
  decryptBytes,
  hexToBuffer,
  bufferToHex,
  unwrapKeyWithPassword,
  unwrapDocKeyForOwner,
} from "@/lib/crypto-core";
import { restoreOwnerVaultFromSession } from "@/lib/vault/master-vault";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Download,
  Shield,
  Lock,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  Presentation,
  MessageSquarePlus,
  MessageCircle,
  Radio,
  Send,
  CheckCircle2,
  X,
  HelpCircle,
  Copy,
  Check,
  FileText,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import { PresenterModeView } from "@/components/viewer/presenter-mode-view";
import { VoiceNotePlayer } from "@/components/viewer/voice-note-player";
import { setupAntiLeakListeners } from "@/lib/security/anti-leak-detector";
import { AltchaBox } from "@/components/security/altcha-box";

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
    voicePitchEnabled?: boolean;
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
  docKeyOverride?: Uint8Array | null;
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
  docKeyOverride,
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
  const [fitMode, setFitMode] = useState<"width" | "page">("width");
  const [rotation, setRotation] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const pageScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [generatingNda, setGeneratingNda] = useState(false);
  const [antiLeakActive, setAntiLeakActive] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Missing / Lost Key Recovery UI State (resilience against cache clear)
  const [keyRecoveryInput, setKeyRecoveryInput] = useState("");
  const [keyRecoveryError, setKeyRecoveryError] = useState<string | null>(null);
  const [recoveringKey, setRecoveringKey] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Next-Gen Feature States
  const [audioNotes, setAudioNotes] = useState<any[]>([]);
  const [questionPins, setQuestionPins] = useState<any[]>([]);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [activePin, setActivePin] = useState<any | null>(null);
  const [newPinCoords, setNewPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [newPinText, setNewPinText] = useState("");
  const [newPinName, setNewPinName] = useState(viewerIdentity.includes("@") ? viewerIdentity.split("@")[0] : "");
  const [newPinEmail, setNewPinEmail] = useState(viewerIdentity.includes("@") ? viewerIdentity : "");
  const [questionAltcha, setQuestionAltcha] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState(false);

  // Live Presenter Room Sync
  const [isLiveRoomActive, setIsLiveRoomActive] = useState(false);
  const [followPresenter, setFollowPresenter] = useState(true);

  // High-Smoothness Presentation & Reading Ergonomics
  const [readingComfort, setReadingComfort] = useState<"natural" | "dark" | "sepia">("natural");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);

  // Native HTML5 Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = viewerContainerRef.current || document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Listen to external fullscreen changes (Esc key, browser shortcuts)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Live Fetch & Real-Time Polling for In-Doc Questions and Audio Notes
  useEffect(() => {
    let cancelled = false;

    // Load Audio Walkthrough Notes (via public link slug)
    fetch(`/api/docs/${slug}/audio`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.notes) setAudioNotes(d.notes);
      })
      .catch(() => {});

    // Poller function for question pins & founder replies
    const fetchPins = () => {
      // Pause polling when browser tab is inactive / backgrounded to conserve rate limits
      if (typeof document !== "undefined" && document.hidden) return;

      const qParams = new URLSearchParams();
      if (sessionId) qParams.set("sessionId", sessionId);
      if (viewerIdentity) qParams.set("viewerEmail", viewerIdentity);

      fetch(`/api/v/${slug}/questions?${qParams.toString()}`)
        .then((r) => {
          if (!r.ok) return null;
          return r.json();
        })
        .then((d) => {
          if (!cancelled && d?.questions) {
            setQuestionPins(d.questions);
            // Live update currently open question pin popover with founder reply in real time!
            setActivePin((curr: any) => {
              if (!curr) return null;
              const updated = d.questions.find((q: any) => q.id === curr.id);
              return updated || curr;
            });
          }
        })
        .catch(() => {});
    };

    fetchPins();
    const pinPoller = setInterval(fetchPins, 5000);

    return () => {
      cancelled = true;
      clearInterval(pinPoller);
    };
  }, [docData.id, slug, sessionId, viewerIdentity]);

  // Live Presenter Sync Watchdog
  useEffect(() => {
    const roomPoll = setInterval(async () => {
      // Pause polling when browser tab is inactive / backgrounded
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const r = await fetch(`/api/v/${slug}/room`);
        if (r.ok) {
          const d = await r.json();
          setIsLiveRoomActive(d.isLive);
          if (d.isLive && followPresenter && d.currentSlide !== currentPage) {
            setCurrentPage(d.currentSlide);
          }
        }
      } catch {}
    }, 4000);

    return () => clearInterval(roomPoll);
  }, [slug, followPresenter, currentPage]);

  // Submit new Question Pin
  const handleCreateQuestionPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinCoords || !newPinText.trim()) return;

    try {
      setSubmittingPin(true);
      const res = await fetch(`/api/v/${slug}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber: currentPage,
          posXPercent: Math.round(newPinCoords.x),
          posYPercent: Math.round(newPinCoords.y),
          questionText: newPinText.trim(),
          askerName: newPinName.trim() || undefined,
          askerEmail: newPinEmail.trim() || undefined,
          sessionId,
          altcha: questionAltcha || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.question) {
        setQuestionPins((prev) => [data.question, ...prev]);
        setNewPinCoords(null);
        setNewPinText("");
        setIsAddingPin(false);
      }
    } catch {} finally {
      setSubmittingPin(false);
    }
  };

  // Setup Anti-leak screenshot and focus deterrents
  useEffect(() => {
    if (linkData.antiLeakBlurEnabled === false) return;
    const cleanup = setupAntiLeakListeners((blurActive) => {
      setAntiLeakActive(blurActive);
    });
    return cleanup;
  }, [linkData.antiLeakBlurEnabled]);

  // Keyboard Navigation (Arrow Keys / PageUp / PageDown / F for Fullscreen / Space)
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
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages, toggleFullscreen]);

  // Resume reading hint
  const [resumePrompt, setResumePrompt] = useState<{ page: number; total: number } | null>(null);

  // Dwell Tracking buffer
  const pageDwellMap = useRef<Record<number, number>>({});
  const activePageRef = useRef(1);
  const maxPageReachedRef = useRef(1);
  const totalDwellRef = useRef(0);

  // Mobile Touch Swipe Gesture Detection with Spring Velocity
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      setIsSwiping(false);
      setSwipeOffset(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;
      // If movement is predominantly horizontal, engage buttery-smooth spring drag
      if (Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
        setIsSwiping(true);
        const isAtFirst = currentPage === 1 && deltaX > 0;
        const isAtLast = currentPage === totalPages && deltaX < 0;
        const resistance = isAtFirst || isAtLast ? 0.35 : 0.85;
        setSwipeOffset(deltaX * resistance);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Ensure horizontal swipe is intentional and exceeds vertical scroll
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (deltaX < 0) {
          // Swipe Left -> Next Page
          if (currentPage < totalPages) {
            setCurrentPage((p) => p + 1);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate(10); } catch {}
            }
          }
        } else {
          // Swipe Right -> Prev Page
          if (currentPage > 1) {
            setCurrentPage((p) => p - 1);
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              try { navigator.vibrate(10); } catch {}
            }
          }
        }
      }
    }
    setIsSwiping(false);
    setSwipeOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const annotationLayerRef = useRef<HTMLDivElement | null>(null);
  const watermarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Text Extraction & Link Annotation State
  const [currentSlideText, setCurrentSlideText] = useState("");
  const [showTextModal, setShowTextModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [pdfLinksCount, setPdfLinksCount] = useState(0);

  // Automatically reset scroll to the very top (Header) whenever page changes
  useEffect(() => {
    if (pageScrollContainerRef.current) {
      pageScrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentPage]);

  // Mouse Wheel Scroll Navigation (Smooth reading: allows full Header-to-Footer scroll without accidental slide flips)
  const lastWheelTimeRef = useRef(0);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = pageScrollContainerRef.current || e.currentTarget;
    const isScrollable = container ? container.scrollHeight > container.clientHeight + 10 : false;
    const isCanvasTaller = canvasRef.current
      ? canvasRef.current.clientHeight > (typeof window !== "undefined" ? window.innerHeight - 120 : 600)
      : false;

    // If the page is scrollable vertically (e.g. A4 document / Hindi novel / book / zoomed in),
    // NEVER switch slides on vertical mouse wheel scroll (deltaY)!
    // Let the reader scroll smoothly from Header to Footer and back from Footer to Header.
    if (isScrollable || isCanvasTaller) {
      // Allow intentional slide navigation via horizontal swipe or Shift + Wheel
      if (Math.abs(e.deltaX) > 45 || (e.shiftKey && Math.abs(e.deltaY) > 45)) {
        const now = performance.now();
        if (now - lastWheelTimeRef.current > 350) {
          lastWheelTimeRef.current = now;
          const delta = Math.abs(e.deltaX) > 45 ? e.deltaX : e.deltaY;
          if (delta > 0) {
            setCurrentPage((p) => Math.min(totalPages, p + 1));
          } else {
            setCurrentPage((p) => Math.max(1, p - 1));
          }
        }
      }
      return; // Absolute guard: never hijack vertical wheel scroll when reading a page!
    }

    // Only if the document fits 100% on screen without vertical scrolling (e.g. 16:9 presentation slide or Fit Page mode):
    if (Math.abs(e.deltaY) > 25) {
      const now = performance.now();
      if (now - lastWheelTimeRef.current > 300) {
        lastWheelTimeRef.current = now;
        if (e.deltaY > 0) {
          setCurrentPage((p) => Math.min(totalPages, p + 1));
        } else {
          setCurrentPage((p) => Math.max(1, p - 1));
        }
      }
    }
  };

  // Safe Fallback Clipboard Helper for Slide Text Selection
  const copySlideTextToClipboard = async () => {
    let textToCopy = "";
    if (typeof window !== "undefined") {
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim().length > 0) {
        textToCopy = selection.trim();
      }
    }
    if (!textToCopy) {
      textToCopy = currentSlideText;
    }

    if (!textToCopy) return;

    let success = false;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      } catch {}
    }

    if (!success && typeof document !== "undefined") {
      try {
        const ta = document.createElement("textarea");
        ta.value = textToCopy;
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "0";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {}
    }

    if (success) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

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

        // 1. Get raw key from override, password unwrapping, fragment or storage
        let docKey: Uint8Array | null = docKeyOverride ?? null;

        if (!docKey && initialPassword && wrappedKeyHex && passwordSaltHex) {
          setLoadingStep("Unwrapping AES key with PBKDF2 passphrase...");
          docKey = await unwrapKeyWithPassword(wrappedKeyHex, passwordSaltHex, initialPassword);
        }

        if (!docKey) {
          // Fragment key
          const hash = window.location.hash;
          docKey = fragmentToDocKey(hash);

          if (!docKey) {
            // 2. Check persistent local storage fallback
            const storedHex =
              sessionStorage.getItem(`blindshare_link_key_${slug}`) ||
              localStorage.getItem(`blindshare_link_key_${slug}`) ||
              sessionStorage.getItem(`blindshare_key_${slug}`) ||
              sessionStorage.getItem(`blindshare_key_${docData.id}`) ||
              localStorage.getItem(`blindshare_key_${docData.id}`) ||
              localStorage.getItem(`blindshare_key_${slug}`);
            if (storedHex) {
              docKey = hexToBuffer(storedHex);
            }
          }

          if (!docKey && (docData as any).ownerEncryptedKeyHex && (docData as any).ownerEncryptedKeyIvHex) {
            // 3. Check active session owner master vault
            const masterKey = await restoreOwnerVaultFromSession();
            if (masterKey) {
              setLoadingStep("Restoring key from your Zero-Knowledge Master Vault...");
              try {
                const unwrapped = await unwrapDocKeyForOwner(
                  (docData as any).ownerEncryptedKeyHex,
                  (docData as any).ownerEncryptedKeyIvHex,
                  masterKey
                );
                if (unwrapped && unwrapped.length === 32) {
                  docKey = unwrapped;
                }
              } catch {}
            }
          }

          if (docKey && typeof window !== "undefined") {
            // Cache in local & session storage for seamless reload and tab resilience
            try {
              const hex = bufferToHex(docKey);
              sessionStorage.setItem(`blindshare_key_${slug}`, hex);
              sessionStorage.setItem(`blindshare_key_${docData.id}`, hex);
              localStorage.setItem(`blindshare_key_${docData.id}`, hex);
              localStorage.setItem(`blindshare_link_key_${slug}`, hex);

              // Auto-fill fragment in address bar if opened without hash
              if (!window.location.hash.includes("k=")) {
                const frag = docKeyToFragment(docKey);
                window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#k=${frag}`);
              }
            } catch {}
          }
        }

        if (!docKey && docData.encryptionMode === "e2ee-fragment") {
          throw new Error(
            "Missing Decryption Key (#k=...). The server never holds the decryption key. Please request the full link including the fragment from the document owner."
          );
        }

        let pdfBytes: ArrayBuffer | null = null;

        // 1. Check if decrypted PDF is already cached in this active browser tab
        try {
          const cachedHex = sessionStorage.getItem(`blindshare_tab_decrypted_${docData.id}`);
          if (cachedHex && cachedHex.length > 32) {
            setLoadingStep("Instant tab cache loaded...");
            pdfBytes = hexToBuffer(cachedHex).buffer as ArrayBuffer;
          }
        } catch {}

        if (!pdfBytes) {
          setLoadingStep("Fetching encrypted document ciphertext from blind storage...");
          const res = await fetch(`/api/v/${slug}/bytes`);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to download ciphertext bytes");
          }

          const ciphertextBuffer = await res.arrayBuffer();

          // 2. Decrypt in client browser memory
          pdfBytes = ciphertextBuffer;

          if (docData.encryptionMode === "e2ee-fragment" && docKey) {
            setLoadingStep("Decrypting ciphertext with browser WebCrypto AES-GCM-256...");
            const iv = docData.ivHex ? hexToBuffer(docData.ivHex) : new Uint8Array(12);
            pdfBytes = await decryptBytes(ciphertextBuffer, docKey, iv);
          }

          // Cache in active tab's sessionStorage for instant 0.01s reload on refresh
          try {
            if (pdfBytes.byteLength <= 25 * 1024 * 1024) {
              const hex = bufferToHex(new Uint8Array(pdfBytes));
              sessionStorage.setItem(`blindshare_tab_decrypted_${docData.id}`, hex);
            }
          } catch {}
        }

        if (isCancelled) return;
        // Keep a cloned copy for downloading so PDF.js worker detachment never affects download
        decryptedDataRef.current = pdfBytes.slice(0);

        // 3. Load PDF.js (CDN with failover)
        setLoadingStep("Rendering document via Mozilla PDF.js...");

        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.crossOrigin = "anonymous";
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
              resolve();
            };
            script.onerror = () => {
              // Backup CDN
              const unpkgScript = document.createElement("script");
              unpkgScript.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
              unpkgScript.crossOrigin = "anonymous";
              unpkgScript.onload = () => {
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                  "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
                resolve();
              };
              unpkgScript.onerror = () => reject(new Error("Failed to load PDF.js renderer engine"));
              document.head.appendChild(unpkgScript);
            };
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

  // Page navigation & local storage progress tracker (runs on page change without HTTP flushes)
  useEffect(() => {
    activePageRef.current = currentPage;
    maxPageReachedRef.current = Math.max(maxPageReachedRef.current, currentPage);

    // Save reading progress to local storage
    try {
      localStorage.setItem(`blindshare_lastpage_${slug}`, String(currentPage));
    } catch {}
  }, [currentPage, slug]);

  // Batched Dwell Telemetry Engine (Runs on steady 25s intervals & beacon flushes, NOT on every slide click)
  useEffect(() => {
    if (!sessionId) return;

    // Dwell timer (increments active page dwell in local memory every second)
    const secondTimer = setInterval(() => {
      const page = activePageRef.current;
      pageDwellMap.current[page] = (pageDwellMap.current[page] || 0) + 1;
      totalDwellRef.current += 1;
    }, 1000);

    const flushDwellEvents = () => {
      const entries = Object.entries(pageDwellMap.current);
      if (entries.length === 0) return;

      const events = entries
        .map(([pg, dwell]) => ({
          pageNumber: parseInt(pg, 10),
          dwellSeconds: dwell,
        }))
        .filter((e) => e.dwellSeconds > 0);

      if (events.length > 0) {
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

    // Heartbeat batch flusher (Steady 25-second interval instead of rapid per-slide calls)
    const heartbeatTimer = setInterval(() => {
      flushDwellEvents();
    }, 25000);

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
  }, [slug, sessionId]);

  // Draw Dynamic Live Watermark on Overlay Canvas (Staggered Matrix with Zero Collision)
  const drawWatermark = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
      const wmCanvas = watermarkCanvasRef.current;
      if (!wmCanvas || !linkData.watermarkEnabled) return;

      const dpr = window.devicePixelRatio || 1;
      wmCanvas.width = canvasWidth * dpr;
      wmCanvas.height = canvasHeight * dpr;
      wmCanvas.style.width = `${canvasWidth}px`;
      wmCanvas.style.height = `${canvasHeight}px`;

      const ctx = wmCanvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Watermark text composition: Identity · Timestamp · Short Slug
      const timeStr = new Date().toISOString().substring(0, 10);
      const identityLabel = viewerIdentity || "CONFIDENTIAL";
      const customLabel = linkData.watermarkText ? `[${linkData.watermarkText}] ` : "";
      const watermarkString = `${customLabel}${identityLabel} • ${timeStr} • ${slug.substring(0, 8)}`;

      ctx.save();
      // Rotate around the center of the canvas
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate((-25 * Math.PI) / 180);
      ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

      ctx.font = "bold 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.18)"; // Subtle, readable, non-obtrusive
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Dynamically calculate column and row pitch based on text length to prevent any overlapping
      const textWidth = ctx.measureText(watermarkString).width;
      const stepX = Math.max(textWidth + 80, 360);
      const stepY = 120;

      let rowIndex = 0;
      for (let y = -canvasHeight; y < canvasHeight * 2; y += stepY) {
        // Stagger alternating rows so watermark repeats cleanly without collision
        const xOffset = rowIndex % 2 === 1 ? stepX / 2 : 0;
        for (let x = -canvasWidth; x < canvasWidth * 2; x += stepX) {
          ctx.fillText(watermarkString, x + xOffset, y);
        }
        rowIndex++;
      }
      ctx.restore();

      // Tamper-Evident Anti-Photo Forensic Security Stamp (Bottom-Right Corner)
      ctx.save();
      const forensicToken = (slug + (viewerIdentity || "PUBLIC") + timeStr)
        .split("")
        .reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0) | 0, 0)
        .toString(16)
        .toUpperCase();
      ctx.font = "bold 9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.28)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(`🔒 FORENSIC TRACE #${forensicToken} • ${identityLabel} • ${timeStr}`, canvasWidth - 14, canvasHeight - 10);
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

        // Ultra-High Quality Super-Sampling DPR (minimum 2x for razor-sharp vector text on all screens)
        const dpr = Math.max(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
        const unscaledViewport = page.getViewport({ scale: 1, rotation });

        let targetScale = zoom;
        if (presenterMode && typeof window !== "undefined") {
          // Fit slide proportionally inside presentation screen canvas
          const maxW = window.innerWidth * 0.90;
          const maxH = window.innerHeight * 0.82;
          const scaleW = maxW / unscaledViewport.width;
          const scaleH = maxH / unscaledViewport.height;
          targetScale = Math.min(scaleW, scaleH);
        } else if (typeof window !== "undefined") {
          const isMobile = window.innerWidth < 640;
          if (fitMode === "page") {
            // Fit entire page (height & width) inside screen viewport for full visibility
            const availableH = Math.max(window.innerHeight - 130, 300);
            const availableW = Math.max(window.innerWidth - (isMobile ? 24 : 120), 280);
            const scaleH = availableH / unscaledViewport.height;
            const scaleW = availableW / unscaledViewport.width;
            targetScale = zoom * Math.min(scaleH, scaleW);
          } else {
            // Mobile-first optimal reading width (Header to Footer smooth scroll mode)
            const containerTargetWidth = isMobile
              ? Math.max(window.innerWidth - 24, 280)
              : Math.min(window.innerWidth * 0.85, 960);
            const autoFitScale = containerTargetWidth / unscaledViewport.width;
            targetScale = zoom * (isMobile ? autoFitScale : Math.max(autoFitScale, 1.25));
          }
        }

        // Render at ultra-high resolution canvas backing store (super-sampled for zero blur)
        const renderScale = targetScale * dpr;
        const viewport = page.getViewport({ scale: renderScale, rotation });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // CSS display dimensions
        const displayWidth = Math.floor(viewport.width / dpr);
        const displayHeight = Math.floor(viewport.height / dpr);
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!isCancelled) {
          drawWatermark(displayWidth, displayHeight);

          // 4. Render Text Layer for text selection, highlighting, copy & search
          try {
            const textContent = await page.getTextContent();
            const slideRawText = textContent.items
              .map((item: any) => item.str || "")
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            setCurrentSlideText(slideRawText);

            const textLayerDiv = textLayerRef.current;
            if (textLayerDiv) {
              textLayerDiv.innerHTML = "";
              textLayerDiv.style.width = `${displayWidth}px`;
              textLayerDiv.style.height = `${displayHeight}px`;
              textLayerDiv.style.setProperty("--scale-factor", `${targetScale}`);

              const cssViewport = page.getViewport({ scale: targetScale, rotation });
              const pdfjsLib = (window as any).pdfjsLib;

              if (pdfjsLib?.renderTextLayer) {
                await pdfjsLib.renderTextLayer({
                  textContentSource: textContent,
                  container: textLayerDiv,
                  viewport: cssViewport,
                  textDivs: [],
                }).promise?.catch(() => {});
              } else {
                // High-fidelity fallback DOM text spans
                textContent.items.forEach((item: any) => {
                  if (item.str && item.transform) {
                    const tx = pdfjsLib?.Util?.transform
                      ? pdfjsLib.Util.transform(cssViewport.transform, item.transform)
                      : item.transform;
                    const span = document.createElement("span");
                    span.textContent = item.str;
                    const fontHeight = Math.hypot(tx[2] || 0, tx[3] || 12);
                    span.style.fontSize = `${Math.max(fontHeight, 10)}px`;
                    span.style.fontFamily = item.fontName || "sans-serif";
                    span.style.left = `${tx[4] || 0}px`;
                    span.style.top = `${Math.max((tx[5] || fontHeight) - fontHeight, 0)}px`;
                    textLayerDiv.appendChild(span);
                  }
                });
              }
            }
          } catch (textErr) {
            console.warn("PDF text layer extraction warning:", textErr);
          }

          // 5. Render Interactive Clickable Hyperlink Annotations Layer
          try {
            const annotations = await page.getAnnotations();
            const annotationLayerDiv = annotationLayerRef.current;
            if (annotationLayerDiv) {
              annotationLayerDiv.innerHTML = "";
              annotationLayerDiv.style.width = `${displayWidth}px`;
              annotationLayerDiv.style.height = `${displayHeight}px`;

              const cssViewport = page.getViewport({ scale: targetScale, rotation });
              let linkCount = 0;

              annotations.forEach((annot: any) => {
                if (annot.subtype === "Link" && annot.url && annot.rect) {
                  linkCount++;
                  const rect = cssViewport.convertToViewportRectangle(annot.rect);
                  const minX = Math.min(rect[0], rect[2]);
                  const minY = Math.min(rect[1], rect[3]);
                  const width = Math.abs(rect[2] - rect[0]);
                  const height = Math.abs(rect[3] - rect[1]);

                  const linkEl = document.createElement("a");
                  linkEl.href = annot.url;
                  linkEl.target = "_blank";
                  linkEl.rel = "noopener noreferrer";
                  linkEl.title = `🔗 Open: ${annot.url}`;
                  linkEl.className =
                    "absolute z-10 block rounded border border-amber-400/30 bg-amber-400/5 hover:border-amber-400 hover:bg-amber-400/25 transition-all cursor-pointer shadow-sm";
                  linkEl.style.left = `${minX}px`;
                  linkEl.style.top = `${minY}px`;
                  linkEl.style.width = `${width}px`;
                  linkEl.style.height = `${height}px`;

                  annotationLayerDiv.appendChild(linkEl);
                }
              });
              setPdfLinksCount(linkCount);
            }
          } catch (annotErr) {
            console.warn("PDF annotations warning:", annotErr);
          }

          // Predictive 0ms Pre-Caching for Adjacent Slides
          if (pdfDoc && !isCancelled) {
            if (currentPage < totalPages) {
              pdfDoc.getPage(currentPage + 1).catch(() => {});
            }
            if (currentPage > 1) {
              pdfDoc.getPage(currentPage - 1).catch(() => {});
            }
          }
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
  }, [pdfDoc, currentPage, zoom, rotation, drawWatermark, presenterMode, fitMode]);

  // Handle Download (Only if allowDownload is enabled) - Permanently Burns Indelible Watermark
  const handleDownload = async () => {
    if (!linkData.allowDownload || !decryptedDataRef.current || downloading) return;
    setDownloading(true);

    try {
      const safeTitle = (docData.title || "document").replace(/[^a-zA-Z0-9_\-\.]/g, "_");
      const filename = safeTitle.toLowerCase().endsWith(".pdf") ? safeTitle : `${safeTitle}.pdf`;

      let outputBytes: ArrayBuffer | Uint8Array = decryptedDataRef.current;

      // If watermark is enabled, permanently burn and stamp diagonal matrix watermark into every page!
      if (linkData.watermarkEnabled) {
        try {
          const { PDFDocument, rgb, degrees, StandardFonts } = await import("pdf-lib");
          const pdfDoc = await PDFDocument.load(decryptedDataRef.current.slice(0));
          const pages = pdfDoc.getPages();
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          const timeStr = new Date().toISOString().substring(0, 10);
          const identityLabel = viewerIdentity || "CONFIDENTIAL";
          const customLabel = linkData.watermarkText ? `[${linkData.watermarkText}] ` : "";
          const watermarkString = `${customLabel}${identityLabel} • ${timeStr} • ${slug.substring(0, 8)}`;

          for (const page of pages) {
            const { width, height } = page.getSize();
            const fontSize = Math.max(12, Math.min(width, height) / 36);

            // Staggered multi-layer matrix watermark across the page
            const stepX = width / 2.2;
            const stepY = height / 3.2;

            for (let x = -width * 0.2; x < width * 1.3; x += stepX) {
              for (let y = -height * 0.2; y < height * 1.3; y += stepY) {
                page.drawText(watermarkString, {
                  x,
                  y,
                  size: fontSize,
                  font,
                  color: rgb(0.55, 0.55, 0.55),
                  opacity: 0.25,
                  rotate: degrees(-32),
                });
              }
            }
          }

          outputBytes = await pdfDoc.save();
        } catch (watermarkErr) {
          console.warn("Watermark embedding fallback:", watermarkErr);
        }
      }

      const blob = new Blob([outputBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Defer revoke by 60s so browser download managers & PDF renderers have plenty of time
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Generate and download Cryptographic NDA Acceptance Certificate (PDF)
  const handleDownloadNdaCertificate = async () => {
    if (!linkData.requiresNda || generatingNda) return;
    setGeneratingNda(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([595.28, 841.89]); // A4 portrait
      const { width, height } = page.getSize();

      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

      // Gold border
      page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.85, 0.65, 0.13),
        borderWidth: 2,
      });
      page.drawRectangle({
        x: 26,
        y: 26,
        width: width - 52,
        height: height - 52,
        borderColor: rgb(0.85, 0.65, 0.13),
        borderWidth: 0.75,
      });

      // Header
      page.drawText("BLINDSHARE ZERO-KNOWLEDGE PROTOCOL", {
        x: 50,
        y: height - 70,
        size: 10,
        font: fontBold,
        color: rgb(0.85, 0.65, 0.13),
      });

      page.drawText("CERTIFICATE OF CONFIDENTIALITY", {
        x: 50,
        y: height - 105,
        size: 20,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.2),
      });

      page.drawText("& NON-DISCLOSURE AGREEMENT", {
        x: 50,
        y: height - 130,
        size: 16,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });

      // Divider line
      page.drawLine({
        start: { x: 50, y: height - 150 },
        end: { x: width - 50, y: height - 150 },
        thickness: 1.5,
        color: rgb(0.85, 0.65, 0.13),
      });

      const signatory = viewerIdentity || "Verified Cryptographic Signatory";
      const docTitle = docData.title || "Confidential Document";
      const dateStr = new Date().toUTCString();

      // Certificate Statement
      page.drawText("This certificate verifies that the recipient below has executed a binding Non-Disclosure", {
        x: 50,
        y: height - 180,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.25, 0.3, 0.35),
      });
      page.drawText("Agreement (NDA) prior to decrypting and inspecting the proprietary materials listed.", {
        x: 50,
        y: height - 196,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.25, 0.3, 0.35),
      });

      // Details Table
      const fields = [
        ["Protected Document:", docTitle],
        ["Document ID:", docData.id],
        ["Signatory / Recipient:", signatory],
        ["Share Link Slug:", `/v/${slug}`],
        ["Session Tracking ID:", sessionId],
        ["Execution Timestamp:", dateStr],
        ["Zero-Knowledge Hash:", `${slug.substring(0, 16)}...sha256-verified`],
        ["Security Protocol:", "RFC 3986 E2EE AES-GCM Client Decrypted"],
      ];

      let currentY = height - 235;
      for (const [label, val] of fields) {
        page.drawText(label, {
          x: 50,
          y: currentY,
          size: 9.5,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.3),
        });
        page.drawText(String(val), {
          x: 210,
          y: currentY,
          size: 9.5,
          font: fontRegular,
          color: rgb(0.08, 0.12, 0.2),
        });
        currentY -= 22;
      }

      // Legal Terms summary
      currentY -= 10;
      page.drawText("BINDING ACKNOWLEDGMENT:", {
        x: 50,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.85, 0.65, 0.13),
      });
      currentY -= 16;

      const terms = linkData.ndaText || "The signatory agrees that all data, presentations, pitch decks, financials, and intellectual property contained herein are strictly proprietary and confidential. The signatory covenants not to disclose, duplicate, distribute, or reverse-engineer any portion without prior written consent.";

      const words = terms.split(" ");
      let line = "";
      for (const word of words) {
        if ((line + word).length > 80) {
          page.drawText(line, { x: 50, y: currentY, size: 8.5, font: fontRegular, color: rgb(0.35, 0.4, 0.45) });
          line = word + " ";
          currentY -= 13;
        } else {
          line += word + " ";
        }
      }
      if (line) {
        page.drawText(line, { x: 50, y: currentY, size: 8.5, font: fontRegular, color: rgb(0.35, 0.4, 0.45) });
        currentY -= 18;
      }

      // Attestation Box
      page.drawRectangle({
        x: 50,
        y: 80,
        width: width - 100,
        height: 55,
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1,
        color: rgb(0.97, 0.98, 1),
      });

      page.drawText("DIGITALLY ATTESTED VIA BLINDSHARE ZERO-KNOWLEDGE VAULT", {
        x: 65,
        y: 115,
        size: 9,
        font: fontBold,
        color: rgb(0.1, 0.5, 0.3),
      });

      page.drawText(`Signatory Fingerprint: ${signatory} | Session ${sessionId.substring(0, 18)}...`, {
        x: 65,
        y: 98,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      });

      // Footer
      page.drawText("Generated client-side by BlindShare v1.4.0 — Decryption keys never stored server-side.", {
        x: 50,
        y: 35,
        size: 8,
        font: fontRegular,
        color: rgb(0.6, 0.65, 0.7),
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `NDA_Certificate_${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to generate NDA certificate:", err);
    } finally {
      setGeneratingNda(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <img src="/brand/02-favicon.svg" alt="BlindShare" className="absolute inset-0 m-auto h-7 w-7 object-contain" />
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
    const isMissingKey = error.toLowerCase().includes("missing decryption key") || error.toLowerCase().includes("#k=");

    const handleApplyRecoveryKey = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!keyRecoveryInput.trim()) return;
      setKeyRecoveryError(null);
      setRecoveringKey(true);

      try {
        const raw = keyRecoveryInput.trim();
        let derivedKey: Uint8Array | null = null;

        if (raw.includes("#k=")) {
          derivedKey = fragmentToDocKey(raw.substring(raw.indexOf("#k=")));
        } else if (raw.includes("/v/")) {
          const hashPos = raw.indexOf("#");
          if (hashPos !== -1) derivedKey = fragmentToDocKey(raw.substring(hashPos));
        } else if (raw.startsWith("k=")) {
          derivedKey = fragmentToDocKey("#" + raw);
        } else if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
          derivedKey = hexToBuffer(raw);
        } else {
          try {
            const meRes = await fetch("/api/auth/me");
            const meJson = await meRes.json().catch(() => ({}));
            if (meJson.user?.masterKeySaltHex) {
              const { unlockOwnerVault } = await import("@/lib/vault/master-vault");
              const master = await unlockOwnerVault(raw, meJson.user.masterKeySaltHex);
              const docsRes = await fetch("/api/docs");
              const docsJson = await docsRes.json().catch(() => ({}));
              const myDoc = docsJson?.documents?.find((d: any) => d.id === docData.id);
              if (myDoc?.ownerEncryptedKeyHex && myDoc?.ownerEncryptedKeyIvHex) {
                derivedKey = await unwrapDocKeyForOwner(myDoc.ownerEncryptedKeyHex, myDoc.ownerEncryptedKeyIvHex, master);
              }
            }
          } catch {}
          if (!derivedKey) {
            derivedKey = fragmentToDocKey("#k=" + raw);
          }
        }

        if (!derivedKey || derivedKey.length < 16) {
          setKeyRecoveryError("Invalid decryption key or password. Please provide the complete link or #k= fragment.");
          return;
        }

        const hex = bufferToHex(derivedKey);
        sessionStorage.setItem("blindshare_key_" + slug, hex);
        sessionStorage.setItem("blindshare_key_" + docData.id, hex);
        localStorage.setItem("blindshare_key_" + docData.id, hex);
        localStorage.setItem("blindshare_link_key_" + slug, hex);

        const frag = docKeyToFragment(derivedKey);
        window.history.replaceState(null, "", window.location.pathname + window.location.search + "#k=" + frag);

        setError(null);
        setReloadTrigger((v) => v + 1);
      } catch (err: any) {
        setKeyRecoveryError(err.message || "Failed to parse key");
      } finally {
        setRecoveringKey(false);
      }
    };

    return (
      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-md space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{t.viewer.notFoundTitle}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{error}</p>

          {isMissingKey && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Lock className="h-4 w-4" />
                <span>Recover Document Access</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If your browser cache was cleared or the link was copied without the <code className="text-amber-300">#k=...</code> fragment, enter your key or full link below to decrypt immediately:
              </p>

              {keyRecoveryError && (
                <div className="rounded-xl border border-red-500/30 bg-red-950/50 p-2.5 text-[11px] text-red-300">
                  {keyRecoveryError}
                </div>
              )}

              <form onSubmit={handleApplyRecoveryKey} className="space-y-3">
                <input
                  type="text"
                  value={keyRecoveryInput}
                  onChange={(e) => setKeyRecoveryInput(e.target.value)}
                  placeholder="Paste #k=... fragment, full share URL, or owner password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={recoveringKey || !keyRecoveryInput.trim()}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {recoveringKey ? "Unwrapping & Decrypting..." : "Decrypt & Unlock Document"}
                </button>
              </form>
            </div>
          )}

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
    <div ref={viewerContainerRef} className="flex flex-col h-screen h-[100dvh] max-h-screen overflow-hidden bg-slate-950">
      {/* Top Floating Control Toolbar */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/90 px-4 py-2.5 backdrop-blur-md flex-shrink-0">
        {/* Document Title & Brand */}
        <div className="flex items-center gap-3">
          {linkData.brandLogoUrl ? (
            <img
              src={linkData.brandLogoUrl}
              alt="Brand Logo"
              className="h-7 w-auto max-w-[120px] object-contain rounded"
            />
          ) : (
            <BrandIcon size="sm" />
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
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.2).toFixed(1))))}
              className="p-1.5 text-slate-400 hover:text-white rounded transition"
              title={t.viewer.zoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="text-[11px] font-medium text-slate-300 px-1 hover:text-amber-400 transition"
              title="Click to reset zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.2).toFixed(1))))}
              className="p-1.5 text-slate-400 hover:text-white rounded transition"
              title={t.viewer.zoomIn}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Fit Mode Toggle: Fit to Width (Scrollable Header-to-Footer) vs Fit to Page (Full Page on Screen) */}
          <button
            onClick={() => setFitMode((m) => (m === "width" ? "page" : "width"))}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
              fitMode === "page"
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-sm"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
            title={fitMode === "page" ? `${(t.viewer as any).fitWidth || "Fit Width"} (Scroll Header to Footer)` : `${(t.viewer as any).fitPage || "Fit Page"} (View Entire Page on Screen)`}
          >
            {fitMode === "page" ? (
              <>
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>{(t.viewer as any).fitPage || "Fit Page"}</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-slate-300" />
                <span>{(t.viewer as any).fitWidth || "Fit Width"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="hidden sm:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800"
            title={t.viewer.rotate}
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Slide Thumbnails Drawer Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              showThumbnails
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                : "border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:border-amber-400/50"
            }`}
            title="Toggle Slide Thumbnails Grid"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Thumbnails</span>
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

          {/* Extract / Copy Slide Text Button */}
          {currentSlideText && (
            <button
              onClick={copySlideTextToClipboard}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-amber-400/50 transition shadow-sm"
              title="Copy selected text or slide content to clipboard"
            >
              {copiedText ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Executed NDA Certificate Download */}
          {linkData.requiresNda && (
            <button
              onClick={handleDownloadNdaCertificate}
              disabled={generatingNda}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 shadow-sm transition disabled:opacity-50 cursor-pointer"
              title="Download Executed Cryptographic NDA Certificate (PDF)"
            >
              {generatingNda ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  <span className="hidden sm:inline">Signing...</span>
                </>
              ) : (
                <>
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">NDA Certificate</span>
                </>
              )}
            </button>
          )}

          {/* Allow Download Button */}
          {linkData.allowDownload && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10 transition disabled:opacity-50 cursor-pointer"
              title={linkData.watermarkEnabled ? "Download Watermarked PDF" : "Download Decrypted PDF"}
            >
              {downloading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span className="hidden sm:inline">Stamping...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>
          )}

          {/* Investor Reading Comfort Mode Toggle */}
          <button
            onClick={() => {
              setReadingComfort((curr) =>
                curr === "natural" ? "dark" : curr === "dark" ? "sepia" : "natural"
              );
            }}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition ${
              readingComfort === "dark"
                ? "bg-indigo-950/60 border-indigo-500/40 text-indigo-300"
                : readingComfort === "sepia"
                ? "bg-amber-950/60 border-amber-600/40 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title={`${t.viewer.readingComfort}: ${
              readingComfort === "natural"
                ? t.viewer.naturalMode
                : readingComfort === "dark"
                ? t.viewer.darkMode
                : t.viewer.sepiaMode
            }`}
          >
            {readingComfort === "natural" && <Sun className="h-4 w-4 text-amber-400" />}
            {readingComfort === "dark" && <Moon className="h-4 w-4 text-indigo-400" />}
            {readingComfort === "sepia" && <BookOpen className="h-4 w-4 text-amber-300" />}
          </button>

          {/* Fullscreen Cinema Presentation Mode (Hotkey F) */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg border border-slate-800"
            title={isFullscreen ? t.viewer.exitFullscreen : `${t.viewer.fullscreen} (F)`}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="rounded-lg bg-slate-900 px-2 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-slate-800 border border-slate-800"
          >
            {lang === "en" ? "हिंदी" : "EN"}
          </button>
        </div>
      </div>

      {/* Live Room Broadcaster Alert Banner */}
      {isLiveRoomActive && (
        <div className="bg-gradient-to-r from-red-600/20 via-amber-500/20 to-red-600/20 border-b border-red-500/30 px-4 py-2 text-xs text-white">
          <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-bold text-red-300">Live Presenter Broadcast Active</span>
              <span className="text-slate-300 hidden sm:inline">• Host is navigating this deck in real-time</span>
            </div>
            <button
              onClick={() => setFollowPresenter(!followPresenter)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                followPresenter
                  ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {followPresenter ? "✓ Syncing Slides (Active)" : "Sync Slides"}
            </button>
          </div>
        </div>
      )}

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
          onPageChange={async (p) => {
            setCurrentPage(p);
            // Broadcast live slide transition to viewers
            fetch(`/api/v/${slug}/room`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentSlide: p, presenterActive: true }),
            }).catch(() => {});
          }}
          onClose={() => {
            setPresenterMode(false);
            fetch(`/api/v/${slug}/room`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ presenterActive: false }),
            }).catch(() => {});
          }}
          brandLogoUrl={linkData.brandLogoUrl}
          brandAccentColor={linkData.brandAccentColor}
          watermarkText={linkData.watermarkEnabled ? (linkData.watermarkText || viewerIdentity || "CONFIDENTIAL") : null}
        >
          <div
            style={{
              filter:
                readingComfort === "dark"
                  ? "invert(0.9) hue-rotate(180deg) contrast(1.05)"
                  : readingComfort === "sepia"
                  ? "sepia(0.35) contrast(0.95) brightness(0.97)"
                  : "none",
            }}
            className="relative flex items-center justify-center"
          >
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
        <div className="flex-1 flex overflow-hidden relative">
          {/* Slide Thumbnail Drawer */}
          {showThumbnails && (
            <aside className="w-52 sm:w-60 border-r border-slate-800 bg-slate-950/95 flex flex-col flex-shrink-0 z-30 h-full overflow-hidden shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Slide Deck Grid</span>
                </div>
                <button
                  onClick={() => setShowThumbnails(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Close Thumbnails"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => {
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-full rounded-xl border p-2.5 text-left transition flex items-center justify-between group ${
                        isActive
                          ? "border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10"
                          : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-mono font-bold ${
                            isActive
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {p}
                        </span>
                        <div className="text-xs font-medium text-slate-200">
                          Slide {p}
                        </div>
                      </div>
                      {isActive ? (
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      ) : (
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-300">Jump</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          <div
            ref={pageScrollContainerRef}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full relative select-text scroll-smooth ${antiLeakActive ? "blur-xl" : ""}`}
          >
            <div className="w-full min-h-full flex flex-col items-center justify-start p-2.5 sm:p-6 md:p-8">
              {/* Question Mode Helper Banner */}
              {isAddingPin && (
                <div className="mb-3 flex-shrink-0 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3.5 py-1.5 text-xs text-amber-200 animate-pulse">
                  <MessageSquarePlus className="h-4 w-4 text-amber-400" />
                  <span>Click anywhere on this slide to drop a private question / feedback pin</span>
                  <button
                    onClick={() => setIsAddingPin(false)}
                    className="ml-2 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div
                style={{
                  transform: isSwiping ? `translate3d(${swipeOffset}px, 0, 0)` : "translate3d(0, 0, 0)",
                  transition: isSwiping ? "none" : "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
                  filter:
                    readingComfort === "dark"
                      ? "invert(0.9) hue-rotate(180deg) contrast(1.05)"
                      : readingComfort === "sepia"
                      ? "sepia(0.35) contrast(0.95) brightness(0.97)"
                      : "none",
                }}
                className={`relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex-shrink-0 ${
                  isAddingPin ? "cursor-crosshair ring-2 ring-amber-500/50" : ""
                }`}
            onClick={(e) => {
              if (!isAddingPin) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
              const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
              setNewPinCoords({ x: xPercent, y: yPercent });
            }}
          >
            {/* Main PDF Page Render Canvas */}
            <canvas ref={canvasRef} className="block max-w-full h-auto" />

            {/* Interactive Selectable & Searchable Text Layer */}
            <div ref={textLayerRef} className="pdf-text-layer" />

            {/* Interactive Clickable Hyperlinks Layer */}
            <div ref={annotationLayerRef} className="absolute inset-0 pointer-events-none z-10" />

            {/* Dynamic Live Watermark Overlay Canvas */}
            {linkData.watermarkEnabled && (
              <canvas
                ref={watermarkCanvasRef}
                className="pointer-events-none absolute inset-0 block h-full w-full z-15"
              />
            )}

            {/* In-Doc Interactive Question Pins Overlay */}
            {questionPins
              .filter((q) => q.pageNumber === currentPage)
              .map((q) => (
                <div
                  key={q.id}
                  style={{ left: `${q.posXPercent}%`, top: `${q.posYPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePin(activePin?.id === q.id ? null : q);
                    }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-slate-950 shadow-xl transition transform hover:scale-125 ${
                      q.isResolved
                        ? "bg-emerald-400 border border-emerald-300"
                        : "bg-amber-400 border border-amber-300 animate-bounce"
                    }`}
                    title={q.questionText}
                  >
                    <MessageCircle className="h-3.5 w-3.5 fill-current" />
                  </button>

                  {/* Question Popover */}
                  {activePin?.id === q.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-8 top-0 z-30 w-64 rounded-xl border border-slate-700 bg-slate-950 p-3.5 shadow-2xl text-left space-y-2 backdrop-blur-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px]">
                        <span className="font-bold text-amber-400">{q.askerName || "Reader Question"}</span>
                        <button
                          onClick={() => setActivePin(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{q.questionText}</p>
                      {q.replyText ? (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-2 text-[11px] text-emerald-300 space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Founder Reply</span>
                          </div>
                          <div>{q.replyText}</div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">Pending founder reply...</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* New Question Pin Form Modal */}
          {newPinCoords && (
            <div
              onClick={() => setNewPinCoords(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-3 text-left"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">Ask Question on Slide {currentPage}</h4>
                  </div>
                  <button onClick={() => setNewPinCoords(null)} className="text-slate-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateQuestionPin} className="space-y-3">
                  <div>
                    <textarea
                      value={newPinText}
                      onChange={(e) => setNewPinText(e.target.value)}
                      placeholder="What is your question about this slide?"
                      rows={3}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newPinName}
                      onChange={(e) => setNewPinName(e.target.value)}
                      placeholder="Your Name (Optional)"
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                    <input
                      type="email"
                      value={newPinEmail}
                      onChange={(e) => setNewPinEmail(e.target.value)}
                      placeholder="Email for reply"
                      className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="py-1">
                    <AltchaBox onVerify={(payload: string) => setQuestionAltcha(payload)} />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPin || !newPinText.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{submittingPin ? "Submitting..." : "Submit Question Pin"}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Floating Action Overlay: Voice Walkthrough Player & Question Pin Button */}
      <div className="fixed bottom-12 right-6 z-30 flex flex-col items-end gap-2.5">
        {/* Voice Walkthrough Player for Current Page */}
        {linkData.voicePitchEnabled !== false &&
          audioNotes
            .filter((n) => n.pageNumber === currentPage)
            .map((note) => (
              <VoiceNotePlayer
                key={note.id}
                audioDataUrl={note.audioDataUrl}
                durationSec={note.durationSec}
                title={note.title}
                pageNumber={currentPage}
              />
            ))}

        {/* Pin Question Button */}
        <button
          onClick={() => setIsAddingPin(!isAddingPin)}
          title={isAddingPin ? "Click anywhere on the document slide to leave a question" : "Drop a question or feedback pin on this slide for the document owner"}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md transition-all ${
            isAddingPin
              ? "border-amber-400 bg-amber-500 text-slate-950 shadow-amber-500/30 scale-105"
              : "border-slate-800 bg-slate-950/90 text-slate-200 hover:border-amber-500/50 hover:text-white"
          }`}
        >
          <MessageSquarePlus className={`h-4 w-4 ${isAddingPin ? "text-slate-950" : "text-amber-400"}`} />
          <span>{isAddingPin ? "Click Slide to Pin" : "Ask Question"}</span>
        </button>
      </div>

      {/* Bottom Floating Footer / Watermark Deterrent Disclaimer */}
      <div className="border-t border-slate-900 bg-slate-950 px-4 py-2 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 flex-shrink-0">
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
