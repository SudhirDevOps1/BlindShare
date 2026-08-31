"use client";

import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";

interface PresenterModeViewProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
  brandLogoUrl?: string | null;
  brandAccentColor?: string | null;
  watermarkText?: string | null;
  children: React.ReactNode;
}

export function PresenterModeView({
  currentPage,
  totalPages,
  onPageChange,
  onClose,
  brandLogoUrl,
  brandAccentColor,
  watermarkText,
  children,
}: PresenterModeViewProps) {
  const [laserActive, setLaserActive] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        if (currentPage < totalPages) onPageChange(currentPage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentPage > 1) onPageChange(currentPage - 1);
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "l" || e.key === "L") {
        setLaserActive((prev) => !prev);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      resetHideTimer();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    resetHideTimer();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [currentPage, totalPages, onPageChange, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden cursor-default">
      {/* Laser Pointer Effect */}
      {laserActive && (
        <div
          className="pointer-events-none fixed z-[100] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_15px_4px_rgba(239,68,68,0.8)] transition-transform duration-75"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        />
      )}

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="Logo" className="h-7 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-amber-400">
              <Sparkles className="h-5 w-5" />
              <span>Pitch Presentation</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Laser pointer toggle */}
          <button
            onClick={() => setLaserActive(!laserActive)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              laserActive
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>Laser Pointer (L)</span>
          </button>

          {/* Close Presenter Mode */}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Exit Presenter Mode (Esc)"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        <div className="relative max-h-full max-w-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
          {children}

          {/* Dynamic Watermark in Presenter Mode */}
          {watermarkText && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden opacity-25">
              <span className="rotate-[-25deg] text-2xl font-bold text-slate-400 select-none whitespace-nowrap">
                {watermarkText}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Presenter Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-t from-slate-950/90 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-xs text-slate-400">
          Use <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">←</kbd> /{" "}
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">→</kbd> or{" "}
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">Space</kbd> to navigate
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center gap-3 rounded-full bg-slate-900/90 border border-slate-800 px-4 py-1.5 shadow-xl">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-slate-400">
          <button onClick={onClose} className="hover:text-white underline">
            Exit Presentation
          </button>
        </div>
      </div>
    </div>
  );
}
