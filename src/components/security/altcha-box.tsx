"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Loader2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

interface AltchaBoxProps {
  onVerify: (payload: string) => void;
  autoSolve?: boolean;
  className?: string;
  theme?: "dark" | "amber";
}

export function AltchaBox({
  onVerify,
  autoSolve = true,
  className = "",
  theme = "dark",
}: AltchaBoxProps) {
  const { lang } = useI18n();
  const [status, setStatus] = useState<"idle" | "fetching" | "solving" | "verified" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tookMs, setTookMs] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const startVerification = async () => {
    setStatus("fetching");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/altcha", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Challenge generation failed");
      }
      const challengeData = await res.json();
      const { algorithm, challenge, maxnumber, salt, signature } = challengeData;

      setStatus("solving");
      const startTime = performance.now();

      // Inline Web Worker script for non-blocking PoW solving
      const workerCode = `
        self.onmessage = async function(e) {
          const { algorithm, challenge, maxnumber, salt, signature } = e.data;
          const enc = new TextEncoder();
          const targetHex = challenge.toLowerCase();

          for (let i = 0; i <= maxnumber; i++) {
            const data = enc.encode(salt + i);
            const hashBuf = await crypto.subtle.digest("SHA-256", data);
            const hashArr = Array.from(new Uint8Array(hashBuf));
            const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');

            if (hashHex === targetHex) {
              self.postMessage({ success: true, number: i });
              return;
            }
          }
          self.postMessage({ success: false });
        };
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      workerRef.current = worker;

      worker.onmessage = (e) => {
        URL.revokeObjectURL(workerUrl);
        if (e.data.success) {
          const elapsed = Math.round(performance.now() - startTime);
          setTookMs(elapsed);

          const payloadObj = {
            algorithm,
            challenge,
            number: e.data.number,
            salt,
            signature,
            took: elapsed,
          };

          const payloadBase64 = btoa(JSON.stringify(payloadObj));
          setStatus("verified");
          onVerify(payloadBase64);
        } else {
          setStatus("error");
          setErrorMsg("Proof-of-work search exceeded limit");
        }
      };

      worker.onerror = () => {
        URL.revokeObjectURL(workerUrl);
        setStatus("error");
        setErrorMsg("Worker execution failed");
      };

      worker.postMessage({ algorithm, challenge, maxnumber, salt, signature });
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to solve security challenge");
    }
  };

  useEffect(() => {
    if (autoSolve && status === "idle") {
      startVerification();
    }
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [autoSolve]);

  return (
    <div
      className={`rounded-xl border transition-all ${
        status === "verified"
          ? "border-emerald-500/40 bg-emerald-950/20 shadow-emerald-500/5"
          : status === "error"
          ? "border-red-500/40 bg-red-950/20"
          : "border-amber-500/30 bg-slate-900/80 shadow-amber-500/5"
      } p-3.5 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left icon & status */}
        <div className="flex items-center gap-3">
          {status === "verified" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          ) : status === "error" ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-200">
                {status === "verified"
                  ? lang === "hi"
                    ? "बॉट सुरक्षा सत्यापित"
                    : "Zero-Knowledge Bot Defense"
                  : status === "error"
                  ? lang === "hi"
                    ? "सत्यापन विफल"
                    : "Verification Failed"
                  : status === "solving"
                  ? lang === "hi"
                    ? "सुरक्षा जांच चालू है..."
                    : "Solving Proof-of-Work..."
                  : lang === "hi"
                  ? "ब्राउज़र सुरक्षा कनेक्ट हो रहा है..."
                  : "Connecting Security Node..."}
              </p>
            </div>
            <p className="text-[10px] text-slate-400">
              {status === "verified"
                ? lang === "hi"
                  ? `सत्यापित (${tookMs}ms) • 100% सेल्फ-होस्टेड`
                  : `Verified (${tookMs}ms) • Cookie-less Proof-of-Work`
                : status === "error"
                ? errorMsg || "Please click retry"
                : lang === "hi"
                ? "ब्राउज़र में बैकग्राउंड वेरिफिकेशन"
                : "Client-side PoW verification"}
            </p>
          </div>
        </div>

        {/* Right side: Badge / Retry */}
        <div>
          {status === "error" ? (
            <button
              type="button"
              onClick={startVerification}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{lang === "hi" ? "पुनः प्रयास" : "Retry"}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[9px] font-mono text-slate-400">
              <Lock className="h-2.5 w-2.5 text-amber-400" />
              ALTCHA PoW
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
