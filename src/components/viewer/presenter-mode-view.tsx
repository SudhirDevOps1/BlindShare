"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Move,
} from "lucide-react";

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
  
  // Interactive Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      // Don't hide controls if user is actively zoomed in and panning
      if (zoom === 1) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.5));
    resetHideTimer();
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
    resetHideTimer();
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    resetHideTimer();
  };

  const handleToggleFitWidth = () => {
    if (zoom === 1.6) {
      handleResetZoom();
    } else {
      setZoom(1.6);
      setPan({ x: 0, y: 0 });
      resetHideTimer();
    }
  };

  // Double Click Zoom Toggle
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (zoom !== 1) {
      handleResetZoom();
    } else {
      setZoom(1.75);
      resetHideTimer();
    }
  };

  // Drag Panning Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1 && !laserActive) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom (Ctrl + Wheel or standard wheel zoom)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    }
  };

  useEffect(() => {
    // Reset pan when page changes
    setPan({ x: 0, y: 0 });
  }, [currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetHideTimer();
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        if (!isDragging) {
          e.preventDefault();
          if (currentPage < totalPages) onPageChange(currentPage + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        if (!isDragging) {
          e.preventDefault();
          if (currentPage > 1) onPageChange(currentPage - 1);
        }
      } else if (e.key === "Escape") {
        if (zoom > 1) {
          handleResetZoom();
        } else {
          onClose();
        }
      } else if (e.key === "l" || e.key === "L") {
        setLaserActive((prev) => !prev);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleToggleFitWidth();
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      resetHideTimer();
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    resetHideTimer();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [currentPage, totalPages, onPageChange, onClose, zoom, isDragging, laserActive]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden cursor-default"
    >
      {/* Laser Pointer Effect */}
      {laserActive && (
        <div
          className="pointer-events-none fixed z-[100] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_15px_4px_rgba(239,68,68,0.8)] transition-transform duration-75"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        />
      )}

      {/* Top Header Bar with Navigation and Zoom Controls */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent transition-opacity duration-300 ${
          controlsVisible || zoom > 1 ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt="Logo" className="h-7 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="flex items-center gap-2 font-bold tracking-tight text-amber-400">
              <Sparkles className="h-5 w-5" />
              <span>Pitch Presentation</span>
            </div>
          )}
        </div>

        {/* Center/Right Toolbar: Zoom Controls & Laser Pointer */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls Pill */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/90 border border-slate-800 px-2 py-1 shadow-xl backdrop-blur-md">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>

            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-xs font-mono font-bold text-amber-400 hover:bg-slate-800 rounded transition"
              title="Click to Reset Zoom (100%)"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              onClick={handleToggleFitWidth}
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                zoom === 1.6
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              title="Fit Width Toggle (W)"
            >
              Fit Width
            </button>

            {zoom !== 1 && (
              <button
                onClick={handleResetZoom}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                title="Reset Zoom (0)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Laser pointer toggle */}
          <button
            onClick={() => setLaserActive(!laserActive)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shadow-lg ${
              laserActive
                ? "bg-red-600 text-white shadow-red-600/30"
                : "bg-slate-900/90 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span>Laser (L)</span>
          </button>

          {/* Close Presenter Mode */}
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900/90 border border-slate-800 p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-lg"
            title="Exit Presenter Mode (Esc)"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Canvas with Zoom & Pan Transforms */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
          }}
          className="relative max-h-full max-w-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
        >
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

      {/* Zoom Helper Pill when Zoomed In */}
      {zoom > 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-slate-950/80 border border-slate-800/80 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-md shadow-lg pointer-events-none">
          <Move className="h-3 w-3 text-amber-400" />
          <span>Click & Drag to Pan · Double click to Reset</span>
        </div>
      )}

      {/* Bottom Presenter Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent transition-opacity duration-300 ${
          controlsVisible || zoom > 1 ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Navigate:</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">←</kbd>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">→</kbd>
          <span>Zoom:</span>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">+</kbd>
          <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">-</kbd>
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center gap-3 rounded-full bg-slate-900/90 border border-slate-800 px-4 py-1.5 shadow-xl backdrop-blur-md">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-full p-1 text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <button onClick={handleResetZoom} className="hover:text-amber-300 text-slate-400 transition">
            Fit 100%
          </button>
          <span>·</span>
          <button onClick={onClose} className="hover:text-white underline">
            Exit Presentation (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
