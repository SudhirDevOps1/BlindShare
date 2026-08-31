"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, Type, RotateCcw, CheckCircle2, ShieldCheck, X } from "lucide-react";

interface SignaturePadModalProps {
  slug: string;
  sessionId?: string;
  signerEmail?: string;
  promptText?: string | null;
  onSigned: (signatureDataUrl: string, signerName: string) => void;
  onCancel?: () => void;
}

export function SignaturePadModal({
  slug,
  sessionId,
  signerEmail,
  promptText,
  onSigned,
  onCancel,
}: SignaturePadModalProps) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignatureDataUrl = (name: string): string => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, 600, 200);

    ctx.font = "italic 48px 'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 300, 100);

    return offscreen.toDataURL("image/png");
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      let signatureDataUrl = "";
      let finalName = typedName.trim();

      if (mode === "draw") {
        if (!hasDrawn || !canvasRef.current) {
          throw new Error("Please draw your signature before adopting.");
        }
        signatureDataUrl = canvasRef.current.toDataURL("image/png");
        if (!finalName) finalName = signerEmail?.split("@")[0] || "Signer";
      } else {
        if (!typedName.trim()) {
          throw new Error("Please type your full legal name.");
        }
        signatureDataUrl = generateTypedSignatureDataUrl(typedName.trim());
      }

      const res = await fetch(`/api/v/${slug}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          signerName: finalName,
          signerEmail: signerEmail || undefined,
          signatureDataUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record signature");
      }

      onSigned(signatureDataUrl, finalName);
    } catch (err: any) {
      setError(err.message || "Failed to submit signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-7">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="text-lg font-bold text-white">Digital Signature Required</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {promptText || "Please legally sign this document to verify identity and acknowledge confidentiality before viewing."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Mode Switcher */}
        <div className="mb-4 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === "draw" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Draw Signature</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === "type" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Type Signature</span>
          </button>
        </div>

        {/* Signature Input Area */}
        {mode === "draw" ? (
          <div className="space-y-2">
            <div className="relative h-40 w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-700 bg-slate-950 touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="h-full w-full cursor-crosshair"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-600">
                  Draw your signature here with finger or mouse
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Legally binding digital signature</span>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear Canvas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Legal Name</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {typedName.trim() && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center">
                <span className="font-serif italic text-2xl text-amber-300 tracking-wide select-none">
                  {typedName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Legal Consent Footer */}
        <div className="mt-4 rounded-xl bg-slate-950/80 p-3 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
          By clicking &ldquo;Adopt and Sign&rdquo;, I agree that this signature constitutes a valid and binding digital signature under applicable electronic transaction laws, with cryptographic timestamp verification.
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={loading || (mode === "draw" && !hasDrawn) || (mode === "type" && !typedName.trim())}
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Adopt and Sign</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
